"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { GroupHealthSnapshot, GroupHealthSnapshotResult } from "@/types/index";

const MAX_SNAPSHOTS = 6;
const LS_PREFIX = "dancebase:health-snapshots:";

/** localStorage에서 스냅샷 배열을 읽습니다 */
function loadSnapshots(groupId: string): GroupHealthSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}${groupId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as GroupHealthSnapshot[];
  } catch {
    return [];
  }
}

/** localStorage에 스냅샷 배열을 저장합니다 (최대 MAX_SNAPSHOTS개 유지) */
function saveSnapshots(groupId: string, snapshots: GroupHealthSnapshot[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = snapshots.slice(-MAX_SNAPSHOTS);
    localStorage.setItem(`${LS_PREFIX}${groupId}`, JSON.stringify(trimmed));
  } catch {
    // localStorage 저장 실패는 무시
  }
}

/** 현재 연월을 "YYYY-MM" 형식으로 반환합니다 */
function currentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** 이번 달 시작/끝 ISO 문자열을 반환합니다 */
function monthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

/**
 * 그룹 건강도 월별 스냅샷 훅
 *
 * - Supabase에서 이번 달 데이터를 계산하여 현재 달 스냅샷을 저장/갱신합니다.
 * - localStorage 키: `dancebase:health-snapshots:${groupId}`
 * - 최대 6개월 이력을 유지합니다.
 */
export function useGroupHealthSnapshot(groupId: string): GroupHealthSnapshotResult {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.groupHealthSnapshot(groupId) : null,
    async (): Promise<GroupHealthSnapshot[]> => {
      const supabase = createClient();
      const month = currentMonth();
      const { from, to } = monthRange();

      // =============================================
      // 1. 전체 멤버 수
      // =============================================
      const { count: memberCount, error: memberErr } = await supabase
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId);

      if (memberErr) throw new Error("멤버 데이터를 불러오지 못했습니다");

      const totalMembers = memberCount ?? 0;

      // =============================================
      // 2. 이번 달 출석률 계산
      //    출석 방식이 'none'이 아닌 이번 달 일정의 출석 기록
      // =============================================
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", from)
        .lte("starts_at", to);

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");

      const scheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);

      let attendanceRate = 0;
      if (scheduleIds.length > 0 && totalMembers > 0) {
        const { data: attRows, error: attErr } = await supabase
          .from("attendance")
          .select("status")
          .in("schedule_id", scheduleIds);

        if (attErr) throw new Error("출석 기록을 불러오지 못했습니다");

        const attList = (attRows ?? []) as { status: string }[];
        const totalPossible = scheduleIds.length * totalMembers;
        const presentCount = attList.filter(
          (a) => a.status === "present" || a.status === "late"
        ).length;

        attendanceRate =
          totalPossible > 0
            ? Math.round((presentCount / totalPossible) * 100)
            : 0;
      }

      // =============================================
      // 3. 이번 달 게시글 수
      // =============================================
      const { count: postCountRaw, error: postErr } = await supabase
        .from("board_posts")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId)
        .gte("created_at", from)
        .lte("created_at", to);

      if (postErr) throw new Error("게시글 데이터를 불러오지 못했습니다");

      const postCount = postCountRaw ?? 0;

      // =============================================
      // 4. 활동 멤버 비율 계산
      //    이번 달 board_posts 또는 attendance에 기록이 있는 고유 멤버 수
      // =============================================
      let activeRate = 0;
      if (totalMembers > 0) {
        // 이번 달 게시글 작성자 집합
        const { data: postAuthors, error: authorErr } = await supabase
          .from("board_posts")
          .select("created_by")
          .eq("group_id", groupId)
          .gte("created_at", from)
          .lte("created_at", to);

        if (authorErr) throw new Error("게시글 작성자 데이터를 불러오지 못했습니다");

        const activeUserIds = new Set<string>(
          (postAuthors ?? []).map((p: { created_by: string }) => p.created_by)
        );

        // 이번 달 출석 기록이 있는 멤버 집합 (present or late)
        if (scheduleIds.length > 0) {
          const { data: attUserRows, error: attUserErr } = await supabase
            .from("attendance")
            .select("user_id, status")
            .in("schedule_id", scheduleIds)
            .in("status", ["present", "late"]);

          if (attUserErr) throw new Error("출석 멤버 데이터를 불러오지 못했습니다");

          (attUserRows ?? []).forEach((a: { user_id: string; status: string }) => {
            activeUserIds.add(a.user_id);
          });
        }

        activeRate = Math.round((activeUserIds.size / totalMembers) * 100);
      }

      // =============================================
      // 5. 스냅샷 저장/갱신
      // =============================================
      const newSnapshot: GroupHealthSnapshot = {
        month,
        attendanceRate,
        memberCount: totalMembers,
        postCount,
        activeRate,
      };

      const existing = loadSnapshots(groupId);
      // 같은 달 항목이 있으면 교체, 없으면 추가
      const filtered = existing.filter((s) => s.month !== month);
      const updated = [...filtered, newSnapshot].sort((a, b) =>
        a.month.localeCompare(b.month)
      );

      saveSnapshots(groupId, updated);
      return updated.slice(-MAX_SNAPSHOTS);
    }
  );

  const snapshots = data ?? loadSnapshots(groupId).slice(-MAX_SNAPSHOTS);
  const month = currentMonth();
  const current = snapshots.find((s) => s.month === month) ?? null;

  // 전월 계산
  const now = new Date();
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const previous = snapshots.find((s) => s.month === prevMonth) ?? null;

  return {
    snapshots,
    current,
    previous,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
