"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { ActivityRetrospective } from "@/types";
import { toast } from "sonner";
import { removeFromStorage } from "@/lib/local-storage";

const CACHE_KEY_PREFIX = "dancebase:retrospective:";
const MAX_CACHED_MONTHS = 12;

function loadCache(groupId: string): ActivityRetrospective[] {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${groupId}`);
    if (!raw) return [];
    return JSON.parse(raw) as ActivityRetrospective[];
  } catch {
    return [];
  }
}

function saveCache(groupId: string, reports: ActivityRetrospective[]): void {
  try {
    // 최신 순 정렬 후 최대 12개월만 유지
    const sorted = [...reports].sort((a, b) => b.month.localeCompare(a.month));
    const trimmed = sorted.slice(0, MAX_CACHED_MONTHS);
    localStorage.setItem(`${CACHE_KEY_PREFIX}${groupId}`, JSON.stringify(trimmed));
  } catch {
    // localStorage 쓰기 실패는 무시
  }
}

function getCachedReport(
  groupId: string,
  month: string
): ActivityRetrospective | null {
  const cache = loadCache(groupId);
  return cache.find((r) => r.month === month) ?? null;
}

async function fetchReportFromSupabase(
  groupId: string,
  month: string
): Promise<ActivityRetrospective> {
  const supabase = createClient();

  // month = "YYYY-MM" → 해당 월의 시작/끝 ISO 날짜 계산
  const [year, mon] = month.split("-").map(Number);
  const startDate = new Date(year, mon - 1, 1);
  const endDate = new Date(year, mon, 1); // 다음 달 1일 (exclusive)
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  // 1. 해당 월 일정 목록
  const { data: schedules, error: schedulesError } = await supabase
    .from("schedules")
    .select("id")
    .eq("group_id", groupId)
    .gte("start_at", startIso)
    .lt("start_at", endIso);

  if (schedulesError) throw schedulesError;

  const scheduleIds = (schedules ?? []).map((s: { id: string }) => s.id);
  const totalSchedules = scheduleIds.length;

  // 2. 출석률 계산 (해당 월 일정들의 출석 기록)
  let attendanceRate = 0;
  if (scheduleIds.length > 0) {
    const { data: attendanceRows, error: attendanceError } = await supabase
      .from("attendance")
      .select("status")
      .in("schedule_id", scheduleIds);

    if (attendanceError) throw attendanceError;

    const rows = attendanceRows ?? [];
    const total = rows.length;
    const present = rows.filter(
      (r: { status: string }) => r.status === "present" || r.status === "late"
    ).length;
    attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
  }

  // 3. 게시글 수
  const { count: totalPosts, error: postsError } = await supabase
    .from("board_posts")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .gte("created_at", startIso)
    .lt("created_at", endIso);

  if (postsError) throw postsError;

  // 4. 댓글 수 (해당 그룹 게시글에 달린 댓글)
  const { count: totalComments, error: commentsError } = await supabase
    .from("board_comments")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .gte("created_at", startIso)
    .lt("created_at", endIso);

  if (commentsError) throw commentsError;

  // 5. 멤버 증감 (신규 가입 - 탈퇴)
  const { count: joinedCount, error: joinedError } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .gte("joined_at", startIso)
    .lt("joined_at", endIso);

  if (joinedError) throw joinedError;

  const { count: leftCount, error: leftError } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .gte("left_at", startIso)
    .lt("left_at", endIso);

  if (leftError) throw leftError;

  const memberGrowth = (joinedCount ?? 0) - (leftCount ?? 0);

  // 6. 재정 (수입/지출)
  const { data: transactions, error: financeError } = await supabase
    .from("finance_transactions")
    .select("type, amount")
    .eq("group_id", groupId)
    .gte("transaction_date", startDate.toISOString().split("T")[0])
    .lt("transaction_date", endDate.toISOString().split("T")[0]);

  if (financeError) throw financeError;

  const txRows: { type: string; amount: number | null }[] = transactions ?? [];
  const totalIncome = txRows
    .filter((t) => t.type === "income")
    .reduce((sum: number, t) => sum + (t.amount ?? 0), 0);
  const totalExpense = txRows
    .filter((t) => t.type === "expense")
    .reduce((sum: number, t) => sum + (t.amount ?? 0), 0);

  return {
    month,
    attendanceRate,
    totalSchedules,
    totalPosts: totalPosts ?? 0,
    totalComments: totalComments ?? 0,
    memberGrowth,
    totalIncome,
    totalExpense,
    generatedAt: new Date().toISOString(),
  };
}

export function useActivityRetrospective(groupId: string) {
  const { data: cachedReports, mutate } = useSWR(
    groupId ? swrKeys.activityRetrospective(groupId) : null,
    () => loadCache(groupId),
    {
      // localStorage는 동기적이므로 revalidate 최소화
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const reports = cachedReports ?? [];

  async function generateReport(month: string): Promise<ActivityRetrospective | null> {
    // 이미 캐시된 경우 바로 반환
    const existing = getCachedReport(groupId, month);
    if (existing) {
      toast.success(`${month} 리포트를 캐시에서 불러왔습니다.`);
      return existing;
    }

    try {
      const report = await fetchReportFromSupabase(groupId, month);

      // 캐시 저장
      const current = loadCache(groupId);
      const updated = current.filter((r) => r.month !== month);
      updated.push(report);
      saveCache(groupId, updated);

      // SWR 캐시 갱신
      await mutate(loadCache(groupId));

      toast.success(`${month} 활동 회고 리포트가 생성되었습니다.`);
      return report;
    } catch (err) {
      console.error("[useActivityRetrospective] generateReport error:", err);
      toast.error("리포트 생성에 실패했습니다.");
      return null;
    }
  }

  function clearCache(): void {
    try {
      removeFromStorage(`${CACHE_KEY_PREFIX}${groupId}`);
      mutate([]);
    } catch {
      // ignore
    }
  }

  return {
    reports,
    generateReport,
    clearCache,
    refetch: () => mutate(loadCache(groupId)),
  };
}
