"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  ActivityAnomaly,
  AnomalyDetectionResult,
  AnomalyLevel,
  AnomalyMetricType,
} from "@/types/index";

// 이탈 임계값 상수
const DEVIATION_WARNING = 30;   // 30% 이상 하락 시 warning
const DEVIATION_CRITICAL = 50;  // 50% 이상 하락 시 critical

// 건강 점수 차감 상수
const HEALTH_PENALTY_WARNING = 15;
const HEALTH_PENALTY_CRITICAL = 30;

/**
 * 현재 기간과 이전 기간의 날짜 범위를 반환합니다.
 * 현재: 최근 30일, 이전: 31~60일 전
 */
function buildPeriods(): {
  current: { from: string; to: string };
  previous: { from: string; to: string };
} {
  const now = new Date();

  const currentTo = new Date(now);
  currentTo.setHours(23, 59, 59, 999);

  const currentFrom = new Date(now);
  currentFrom.setDate(now.getDate() - 29);
  currentFrom.setHours(0, 0, 0, 0);

  const previousTo = new Date(currentFrom);
  previousTo.setDate(currentFrom.getDate() - 1);
  previousTo.setHours(23, 59, 59, 999);

  const previousFrom = new Date(previousTo);
  previousFrom.setDate(previousTo.getDate() - 29);
  previousFrom.setHours(0, 0, 0, 0);

  return {
    current: {
      from: currentFrom.toISOString(),
      to: currentTo.toISOString(),
    },
    previous: {
      from: previousFrom.toISOString(),
      to: previousTo.toISOString(),
    },
  };
}

/**
 * 하락률(%)을 계산합니다. (이전 - 현재) / 이전 * 100
 * 이전 값이 0이면 null을 반환합니다.
 */
function calcDropPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((previous - current) / previous) * 100);
}

/**
 * 상승률(%)을 계산합니다. (현재 - 이전) / 이전 * 100
 * 이전 값이 0이면 null을 반환합니다.
 */
function calcRisePercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * 편차 수치를 기반으로 이상 레벨을 결정합니다.
 */
function getAnomalyLevel(deviationPercent: number): AnomalyLevel {
  if (deviationPercent >= DEVIATION_CRITICAL) return "critical";
  if (deviationPercent >= DEVIATION_WARNING) return "warning";
  return "info";
}

export function useAnomalyDetection(groupId: string): {
  result: AnomalyDetectionResult | null;
  loading: boolean;
  refetch: () => void;
} {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.anomalyDetection(groupId),
    async (): Promise<AnomalyDetectionResult> => {
      const supabase = createClient();
      const { current, previous } = buildPeriods();
      const now = new Date().toISOString();

      const anomalies: ActivityAnomaly[] = [];

      // -------------------------------------------------------
      // 1. 출석률 분석
      // -------------------------------------------------------
      const [curAttRes, prevAttRes] = await Promise.all([
        // 현재 기간 출석 데이터
        supabase
          .from("attendance")
          .select("status, schedule_id")
          .in(
            "schedule_id",
            (
              await supabase
                .from("schedules")
                .select("id")
                .eq("group_id", groupId)
                .gte("starts_at", current.from)
                .lte("starts_at", current.to)
            ).data?.map((s: { id: string }) => s.id) ?? []
          ),
        // 이전 기간 출석 데이터
        supabase
          .from("attendance")
          .select("status, schedule_id")
          .in(
            "schedule_id",
            (
              await supabase
                .from("schedules")
                .select("id")
                .eq("group_id", groupId)
                .gte("starts_at", previous.from)
                .lte("starts_at", previous.to)
            ).data?.map((s: { id: string }) => s.id) ?? []
          ),
      ]);

      const calcAttendanceRate = (rows: { status: string }[]): number => {
        if (!rows || rows.length === 0) return 0;
        const attended = rows.filter(
          (r) => r.status === "present" || r.status === "late"
        ).length;
        return Math.round((attended / rows.length) * 100);
      };

      const curAttRate = calcAttendanceRate(
        (curAttRes.data ?? []) as { status: string }[]
      );
      const prevAttRate = calcAttendanceRate(
        (prevAttRes.data ?? []) as { status: string }[]
      );

      if (prevAttRate > 0) {
        const drop = calcDropPercent(curAttRate, prevAttRate);
        if (drop !== null && drop >= DEVIATION_WARNING) {
          const level = getAnomalyLevel(drop);
          const metricType: AnomalyMetricType = "attendance";
          anomalies.push({
            id: `anomaly-attendance-${Date.now()}`,
            metricType,
            level,
            title: "출석률 급감",
            description: `최근 30일 출석률이 이전 기간 대비 ${drop}% 하락했습니다. (${prevAttRate}% → ${curAttRate}%)`,
            currentValue: curAttRate,
            expectedValue: prevAttRate,
            deviationPercent: drop,
            detectedAt: now,
          });
        }
      }

      // -------------------------------------------------------
      // 2. 게시글 수 분석
      // -------------------------------------------------------
      const [curPostRes, prevPostRes] = await Promise.all([
        supabase
          .from("board_posts")
          .select("id", { count: "exact", head: true })
          .eq("group_id", groupId)
          .gte("created_at", current.from)
          .lte("created_at", current.to),
        supabase
          .from("board_posts")
          .select("id", { count: "exact", head: true })
          .eq("group_id", groupId)
          .gte("created_at", previous.from)
          .lte("created_at", previous.to),
      ]);

      const curPostCount = curPostRes.count ?? 0;
      const prevPostCount = prevPostRes.count ?? 0;

      if (prevPostCount > 0) {
        const drop = calcDropPercent(curPostCount, prevPostCount);
        if (drop !== null && drop >= DEVIATION_WARNING) {
          const level = getAnomalyLevel(drop);
          const metricType: AnomalyMetricType = "posts";
          anomalies.push({
            id: `anomaly-posts-${Date.now()}`,
            metricType,
            level,
            title: "게시글 수 급감",
            description: `최근 30일 게시글 수가 이전 기간 대비 ${drop}% 감소했습니다. (${prevPostCount}건 → ${curPostCount}건)`,
            currentValue: curPostCount,
            expectedValue: prevPostCount,
            deviationPercent: drop,
            detectedAt: now,
          });
        }
      }

      // -------------------------------------------------------
      // 3. 멤버 수 변화 분석
      // -------------------------------------------------------
      const [curMemberRes, prevMemberRes] = await Promise.all([
        supabase
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .eq("group_id", groupId)
          .lte("joined_at", current.to),
        supabase
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .eq("group_id", groupId)
          .lte("joined_at", previous.to),
      ]);

      const curMemberCount = curMemberRes.count ?? 0;
      const prevMemberCount = prevMemberRes.count ?? 0;

      if (prevMemberCount > 0) {
        const drop = calcDropPercent(curMemberCount, prevMemberCount);
        if (drop !== null && drop >= DEVIATION_WARNING) {
          const level = getAnomalyLevel(drop);
          const metricType: AnomalyMetricType = "members";
          anomalies.push({
            id: `anomaly-members-${Date.now()}`,
            metricType,
            level,
            title: "멤버 수 감소",
            description: `멤버 수가 이전 기간 대비 ${drop}% 감소했습니다. (${prevMemberCount}명 → ${curMemberCount}명)`,
            currentValue: curMemberCount,
            expectedValue: prevMemberCount,
            deviationPercent: drop,
            detectedAt: now,
          });
        }
      }

      // -------------------------------------------------------
      // 4. 재정 이상 분석 (지출 급증)
      // -------------------------------------------------------
      const [curExpenseRes, prevExpenseRes] = await Promise.all([
        supabase
          .from("finance_transactions")
          .select("amount")
          .eq("group_id", groupId)
          .eq("type", "expense")
          .gte("transaction_date", current.from.slice(0, 10))
          .lte("transaction_date", current.to.slice(0, 10)),
        supabase
          .from("finance_transactions")
          .select("amount")
          .eq("group_id", groupId)
          .eq("type", "expense")
          .gte("transaction_date", previous.from.slice(0, 10))
          .lte("transaction_date", previous.to.slice(0, 10)),
      ]);

      const sumAmount = (rows: { amount: number }[]): number =>
        (rows ?? []).reduce((acc, r) => acc + (r.amount ?? 0), 0);

      const curExpense = sumAmount(
        (curExpenseRes.data ?? []) as { amount: number }[]
      );
      const prevExpense = sumAmount(
        (prevExpenseRes.data ?? []) as { amount: number }[]
      );

      if (prevExpense > 0) {
        const rise = calcRisePercent(curExpense, prevExpense);
        if (rise !== null && rise >= DEVIATION_WARNING) {
          const level = getAnomalyLevel(rise);
          const metricType: AnomalyMetricType = "finance";
          anomalies.push({
            id: `anomaly-finance-${Date.now()}`,
            metricType,
            level,
            title: "지출 급증",
            description: `최근 30일 지출이 이전 기간 대비 ${rise}% 증가했습니다. (${prevExpense.toLocaleString()}원 → ${curExpense.toLocaleString()}원)`,
            currentValue: curExpense,
            expectedValue: prevExpense,
            deviationPercent: rise,
            detectedAt: now,
          });
        }
      }

      // -------------------------------------------------------
      // 건강 점수 계산 (100점에서 이상 징후 수준별 차감)
      // -------------------------------------------------------
      let healthScore = 100;
      for (const anomaly of anomalies) {
        if (anomaly.level === "critical") {
          healthScore -= HEALTH_PENALTY_CRITICAL;
        } else if (anomaly.level === "warning") {
          healthScore -= HEALTH_PENALTY_WARNING;
        } else {
          healthScore -= 5;
        }
      }
      healthScore = Math.max(0, healthScore);

      return {
        anomalies,
        lastCheckedAt: now,
        healthScore,
      };
    },
    {
      revalidateOnFocus: false,
    }
  );

  return {
    result: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
