"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateMemberPairingSuggestion } from "@/lib/swr/invalidate";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type { MemberPairingSuggestion } from "@/types";

// ============================================
// 상수
// ============================================

const CACHE_KEY_PREFIX = "dancebase:pairing-cache:";
const TOP_PAIRS = 5;

// ============================================
// localStorage 유틸
// ============================================

function loadCache(groupId: string): MemberPairingSuggestion[] | null {
  return loadFromStorage<MemberPairingSuggestion[] | null>(`${CACHE_KEY_PREFIX}${groupId}`, null);
}

function saveCache(groupId: string, suggestions: MemberPairingSuggestion[]): void {
  saveToStorage(`${CACHE_KEY_PREFIX}${groupId}`, suggestions);
}

// ============================================
// 원시 멤버 데이터 타입
// ============================================

type RawMember = {
  user_id: string;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
};

type RawAttendance = {
  user_id: string;
  schedule_id: string;
  status: string;
};

type RawSchedule = {
  id: string;
};

// ============================================
// 호환성 점수 계산 로직
// ============================================

/**
 * 출석률 차이가 작을수록 높은 점수 (최대 50점)
 * 두 멤버의 출석률 차이가 0%면 50점, 100%면 0점 (선형 감소)
 */
function calcAttendanceRateScore(rate1: number, rate2: number): number {
  const diff = Math.abs(rate1 - rate2);
  return Math.round(50 * (1 - diff / 100));
}

/**
 * 같은 일정에 함께 출석한 횟수가 많을수록 높은 점수 (최대 50점)
 * coAttendance 횟수 기준 — 10회 이상이면 만점
 */
function calcCoAttendanceScore(coCount: number): number {
  return Math.min(50, Math.round(coCount * 5));
}

/**
 * 호환 이유 문자열 생성
 */
function buildReason(
  rate1: number,
  rate2: number,
  coCount: number
): string {
  const diff = Math.abs(rate1 - rate2);
  const parts: string[] = [];

  if (diff <= 5) {
    parts.push("출석률이 거의 같음");
  } else if (diff <= 15) {
    parts.push("비슷한 출석 패턴");
  } else {
    parts.push("출석 수준 보완 가능");
  }

  if (coCount >= 8) {
    parts.push(`함께 출석 ${coCount}회로 높은 연대감`);
  } else if (coCount >= 4) {
    parts.push(`함께 출석 ${coCount}회`);
  } else if (coCount > 0) {
    parts.push(`함께 출석 ${coCount}회`);
  } else {
    parts.push("새로운 조합");
  }

  return parts.join(" · ");
}

/**
 * 멤버 목록 + 출석 데이터로 상위 N쌍의 추천 생성
 */
function computeSuggestions(
  members: Array<{ userId: string; displayName: string; attendanceRate: number }>,
  attendanceMap: Map<string, Set<string>> // userId -> Set<scheduleId>
): MemberPairingSuggestion[] {
  const results: MemberPairingSuggestion[] = [];

  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const m1 = members[i];
      const m2 = members[j];

      const attended1 = attendanceMap.get(m1.userId) ?? new Set<string>();
      const attended2 = attendanceMap.get(m2.userId) ?? new Set<string>();

      // 공동 출석 횟수
      let coCount = 0;
      for (const sid of attended1) {
        if (attended2.has(sid)) coCount++;
      }

      const rateScore = calcAttendanceRateScore(m1.attendanceRate, m2.attendanceRate);
      const coScore = calcCoAttendanceScore(coCount);
      const compatibilityScore = rateScore + coScore;
      const reason = buildReason(m1.attendanceRate, m2.attendanceRate, coCount);

      results.push({
        member1: {
          userId: m1.userId,
          displayName: m1.displayName,
          attendanceRate: m1.attendanceRate,
        },
        member2: {
          userId: m2.userId,
          displayName: m2.displayName,
          attendanceRate: m2.attendanceRate,
        },
        compatibilityScore,
        reason,
      });
    }
  }

  // 점수 내림차순 정렬 후 상위 TOP_PAIRS개 반환
  results.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  return results.slice(0, TOP_PAIRS);
}

// ============================================
// 훅
// ============================================

export type UseMemberPairingSuggestionReturn = {
  suggestions: MemberPairingSuggestion[];
  loading: boolean;
  /** 추천을 새로 계산하고 캐시 갱신 */
  generatePairings: () => void;
};

export function useMemberPairingSuggestion(
  groupId: string
): UseMemberPairingSuggestionReturn {
  const supabase = createClient();

  const { data: suggestions = [], isLoading: loading, mutate } = useSWR(
    swrKeys.memberPairingSuggestion(groupId),
    async (): Promise<MemberPairingSuggestion[]> => {
      // 캐시 우선 반환
      const cached = loadCache(groupId);
      if (cached && cached.length > 0) return cached;

      return await fetchAndCompute(groupId, supabase);
    }
  );

  // 강제 재계산 (캐시 무시)
  const generatePairings = useCallback(async () => {
    const fresh = await fetchAndCompute(groupId, supabase);
    saveCache(groupId, fresh);
    mutate(fresh, { revalidate: false });
    invalidateMemberPairingSuggestion(groupId);
  }, [groupId, supabase, mutate]);

  return {
    suggestions,
    loading,
    generatePairings,
  };
}

// ============================================
// Supabase 조회 + 계산 (캐시 무관)
// ============================================

async function fetchAndCompute(
  groupId: string,
  supabase: ReturnType<typeof createClient>
): Promise<MemberPairingSuggestion[]> {
  // 1) 그룹 멤버 + 프로필 조회
  const { data: memberRows, error: memberError } = await supabase
    .from("group_members")
    .select("user_id, profiles(display_name)")
    .eq("group_id", groupId);

  if (memberError) throw memberError;

  // 2) 그룹의 과거 일정 조회 (최근 90일)
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const sinceISO = since.toISOString();

  const { data: scheduleRows, error: scheduleError } = await supabase
    .from("schedules")
    .select("id")
    .eq("group_id", groupId)
    .lte("start_at", new Date().toISOString())
    .gte("start_at", sinceISO);

  if (scheduleError) throw scheduleError;

  const scheduleIds = ((scheduleRows ?? []) as RawSchedule[]).map((s) => s.id);

  // 3) 출석 레코드 조회 (status = 'present')
  let attendanceRows: RawAttendance[] = [];
  if (scheduleIds.length > 0) {
    const { data: attData, error: attError } = await supabase
      .from("attendance")
      .select("user_id, schedule_id, status")
      .in("schedule_id", scheduleIds)
      .eq("status", "present");

    if (attError) throw attError;
    attendanceRows = (attData ?? []) as RawAttendance[];
  }

  // 4) 멤버별 출석률 및 출석 일정 Set 계산
  const totalSchedules = scheduleIds.length;

  // userId -> Set<scheduleId> (출석한 일정)
  const attendanceMap = new Map<string, Set<string>>();
  for (const row of attendanceRows) {
    if (!attendanceMap.has(row.user_id)) {
      attendanceMap.set(row.user_id, new Set());
    }
    attendanceMap.get(row.user_id)!.add(row.schedule_id);
  }

  // 5) 멤버 정보 가공
  const members = ((memberRows ?? []) as RawMember[]).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const displayName = profile?.display_name ?? "알 수 없음";
    const attended = attendanceMap.get(row.user_id)?.size ?? 0;
    const attendanceRate =
      totalSchedules > 0 ? Math.round((attended / totalSchedules) * 100) : 0;

    return { userId: row.user_id, displayName, attendanceRate };
  });

  if (members.length < 2) return [];

  // 6) 호환성 점수 계산 및 상위 쌍 추출
  const suggestions = computeSuggestions(members, attendanceMap);
  saveCache(groupId, suggestions);

  return suggestions;
}
