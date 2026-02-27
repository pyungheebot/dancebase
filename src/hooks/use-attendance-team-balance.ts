"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { subMonths, startOfDay } from "date-fns";
import type {
  BalancedTeam,
  TeamBalancerMember,
  AttendanceTeamBalanceResult,
} from "@/types";
import { TEAM_BALANCER_COLORS as COLORS } from "@/types";
import type { EntityMember } from "@/types/entity-context";

// ============================================
// 내부 타입
// ============================================

type AttendanceRow = {
  user_id: string;
  schedule_id: string;
};

type ScheduleRow = {
  id: string;
  starts_at: string;
};

// ============================================
// 유사도 계산 (코사인 유사도 단순화)
// 같은 일정에 함께 출석한 횟수를 기반으로 유사도 계산
// ============================================

function calcCoAttendance(
  vecA: boolean[],
  vecB: boolean[]
): number {
  let coCount = 0;
  for (let i = 0; i < vecA.length; i++) {
    if (vecA[i] && vecB[i]) coCount++;
  }
  return coCount;
}

// ============================================
// K-means 단순화 알고리즘
// 유사도(같이 출석한 횟수) 기반 클러스터링
// ============================================

function kMeansCluster(
  members: TeamBalancerMember[],
  vectors: Map<string, boolean[]>,
  k: number
): TeamBalancerMember[][] {
  if (members.length === 0) return [];
  if (members.length <= k) {
    return members.map((m) => [m]);
  }

  const n = members.length;

  // 유사도 행렬 계산 (공동 출석 횟수)
  const simMatrix: number[][] = Array.from({ length: n }, () =>
    new Array(n).fill(0)
  );
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const vecI = vectors.get(members[i].userId) ?? [];
      const vecJ = vectors.get(members[j].userId) ?? [];
      const sim = calcCoAttendance(vecI, vecJ);
      simMatrix[i][j] = sim;
      simMatrix[j][i] = sim;
    }
  }

  // 출석률 기준 내림차순 정렬 후 k개 초기 센터 선택 (균등 분포)
  const sortedIndices = [...Array(n).keys()].sort(
    (a, b) => members[b].attendanceRate - members[a].attendanceRate
  );

  // 초기 클러스터 배정: 출석률 순으로 라운드로빈 배분
  const clusters: number[][] = Array.from({ length: k }, () => []);
  sortedIndices.forEach((idx, pos) => {
    clusters[pos % k].push(idx);
  });

  // 반복 최적화 (최대 20회)
  const MAX_ITER = 20;
  for (let iter = 0; iter < MAX_ITER; iter++) {
    // 각 클러스터의 "중심" = 클러스터 내 평균 유사도가 가장 높은 멤버
    const centers: number[] = clusters.map((cluster) => {
      if (cluster.length === 0) return 0;
      let bestIdx = cluster[0];
      let bestSum = -1;
      for (const idx of cluster) {
        let sum = 0;
        for (const other of cluster) {
          if (idx !== other) sum += simMatrix[idx][other];
        }
        if (sum > bestSum) {
          bestSum = sum;
          bestIdx = idx;
        }
      }
      return bestIdx;
    });

    // 각 멤버를 가장 유사한 센터 클러스터에 재배정
    const newClusters: number[][] = Array.from({ length: k }, () => []);
    for (let i = 0; i < n; i++) {
      let bestCluster = 0;
      let bestSim = -1;
      for (let c = 0; c < k; c++) {
        const sim = simMatrix[i][centers[c]];
        if (sim > bestSim) {
          bestSim = sim;
          bestCluster = c;
        }
      }
      newClusters[bestCluster].push(i);
    }

    // 빈 클러스터가 생기면 가장 큰 클러스터에서 이동
    for (let c = 0; c < k; c++) {
      if (newClusters[c].length === 0) {
        const biggestClusterIdx = newClusters.reduce(
          (max, curr, idx) =>
            curr.length > newClusters[max].length ? idx : max,
          0
        );
        const moved = newClusters[biggestClusterIdx].pop();
        if (moved !== undefined) {
          newClusters[c].push(moved);
        }
      }
    }

    // 수렴 확인
    const changed = clusters.some((cluster, c) => {
      const a = [...cluster].sort((x, y) => x - y);
      const b = [...newClusters[c]].sort((x, y) => x - y);
      return JSON.stringify(a) !== JSON.stringify(b);
    });

    clusters.splice(0, k, ...newClusters);
    if (!changed) break;
  }

  // 팀 크기 균형 조정: 팀 간 크기 차이가 2 이상이면 큰 팀에서 작은 팀으로 이동
  const MAX_BALANCE_ITER = n;
  for (let iter = 0; iter < MAX_BALANCE_ITER; iter++) {
    const sizes = clusters.map((c) => c.length);
    const maxSize = Math.max(...sizes);
    const minSize = Math.min(...sizes);
    if (maxSize - minSize <= 1) break;

    const bigIdx = sizes.indexOf(maxSize);
    const smallIdx = sizes.indexOf(minSize);
    const moved = clusters[bigIdx].pop();
    if (moved !== undefined) {
      clusters[smallIdx].push(moved);
    }
  }

  return clusters.map((cluster) => cluster.map((idx) => members[idx]));
}

// ============================================
// useAttendanceTeamBalance 훅
// ============================================

export function useAttendanceTeamBalance(
  groupId: string,
  members: EntityMember[],
  teamCount: number = 2
): AttendanceTeamBalanceResult {
  // SWR로 최근 2개월 출석 데이터 조회
  const { data, isLoading, mutate } = useSWR(
    groupId && members.length > 1
      ? swrKeys.attendanceTeamBalance(groupId)
      : null,
    async (): Promise<{
      memberStats: TeamBalancerMember[];
      vectors: [string, boolean[]][];
    }> => {
      const supabase = createClient();

      // 최근 2개월 기준 날짜
      const twoMonthsAgo = startOfDay(subMonths(new Date(), 2)).toISOString();

      // 최근 2개월 내 일정 조회 (출석 체크 있는 일정만)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", twoMonthsAgo)
        .order("starts_at", { ascending: true });

      if (schedErr) throw new Error("일정 데이터를 불러오지 못했습니다");

      const schedules = (scheduleRows ?? []) as ScheduleRow[];
      const scheduleIds = schedules.map((s) => s.id);

      if (scheduleIds.length === 0) {
        return { memberStats: [], vectors: [] };
      }

      const memberUserIds = members.map((m) => m.userId);

      // 출석 데이터 조회
      const { data: attData, error: attErr } = await supabase
        .from("attendance")
        .select("user_id, schedule_id")
        .in("schedule_id", scheduleIds)
        .in("user_id", memberUserIds);

      if (attErr) throw new Error("출석 데이터를 불러오지 못했습니다");

      const attendanceRows = (attData ?? []) as AttendanceRow[];

      // 멤버별 출석 벡터 생성 (일정별 boolean[])
      const vectorMap = new Map<string, boolean[]>();
      const rateMap = new Map<string, number>();

      for (const member of members) {
        const vec = scheduleIds.map((sid) =>
          attendanceRows.some(
            (a) => a.user_id === member.userId && a.schedule_id === sid
          )
        );
        vectorMap.set(member.userId, vec);

        const presentCount = vec.filter(Boolean).length;
        const rate =
          scheduleIds.length > 0
            ? Math.round((presentCount / scheduleIds.length) * 100)
            : 0;
        rateMap.set(member.userId, rate);
      }

      const memberStats: TeamBalancerMember[] = members.map((m) => ({
        userId: m.userId,
        name: m.nickname || m.profile.name,
        avatarUrl: m.profile.avatar_url,
        attendanceRate: rateMap.get(m.userId) ?? 0,
      }));

      return {
        memberStats,
        vectors: Array.from(vectorMap.entries()),
      };
    }
  );

  // 클러스터링 및 팀 구성
  const teams: BalancedTeam[] = (() => {
    if (!data || data.memberStats.length === 0) return [];

    const { memberStats, vectors } = data;
    const vectorMap = new Map<string, boolean[]>(vectors);

    const k = Math.min(teamCount, memberStats.length);
    const clusters = kMeansCluster(memberStats, vectorMap, k);

    const teamLabels = ["A", "B", "C", "D"];

    return clusters.map((clusterMembers, idx) => {
      const avg =
        clusterMembers.length > 0
          ? Math.round(
              clusterMembers.reduce((s, m) => s + m.attendanceRate, 0) /
                clusterMembers.length
            )
          : 0;

      return {
        index: idx,
        name: `팀 ${teamLabels[idx] ?? idx + 1}`,
        colorKey: COLORS[idx % COLORS.length].key,
        members: clusterMembers,
        avgAttendanceRate: avg,
      } satisfies BalancedTeam;
    });
  })();

  // 팀 간 출석률 편차
  const rateDeviation = (() => {
    if (teams.length < 2) return 0;
    const rates = teams.map((t) => t.avgAttendanceRate);
    return Math.max(...rates) - Math.min(...rates);
  })();

  const hasData = (data?.memberStats.length ?? 0) > 0;

  return {
    teams,
    rateDeviation,
    hasData,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
