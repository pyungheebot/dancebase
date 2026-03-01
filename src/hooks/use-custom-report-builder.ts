"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { subDays } from "date-fns";
import type {
  CustomReportConfig,
  ReportMetricType,
  ReportMetricValue,
  ReportPeriod,
} from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// 지표 메타 정보
export const REPORT_METRIC_META: Record<
  ReportMetricType,
  { label: string; unit: string }
> = {
  attendance_rate: { label: "출석률", unit: "%" },
  total_attendance: { label: "총 출석 수", unit: "회" },
  post_count: { label: "게시글 수", unit: "개" },
  comment_count: { label: "댓글 수", unit: "개" },
  member_count: { label: "멤버 수", unit: "명" },
  new_member_count: { label: "신규 멤버 수", unit: "명" },
  rsvp_rate: { label: "RSVP 응답률", unit: "%" },
};

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  "7d": "최근 7일",
  "30d": "최근 30일",
  "90d": "최근 90일",
  all: "전체",
};

const MAX_REPORTS = 5;

function getStorageKey(groupId: string): string {
  return `dancebase:custom-reports:${groupId}`;
}

function loadReports(groupId: string): CustomReportConfig[] {
  return loadFromStorage<CustomReportConfig[]>(getStorageKey(groupId), []);
}

function saveReports(groupId: string, reports: CustomReportConfig[]): void {
  saveToStorage(getStorageKey(groupId), reports);
}

function getPeriodStartDate(period: ReportPeriod): string | null {
  if (period === "all") return null;
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  return subDays(new Date(), days).toISOString().slice(0, 10);
}

async function computeMetricValues(
  groupId: string,
  metrics: ReportMetricType[],
  period: ReportPeriod
): Promise<ReportMetricValue[]> {
  const supabase = createClient();
  const periodStart = getPeriodStartDate(period);

  const results: ReportMetricValue[] = [];

  for (const metric of metrics) {
    const meta = REPORT_METRIC_META[metric];
    let value = 0;

    try {
      if (metric === "member_count") {
        const { count } = await supabase
          .from("group_members")
          .select("user_id", { count: "exact", head: true })
          .eq("group_id", groupId);
        value = count ?? 0;
      } else if (metric === "new_member_count") {
        let query = supabase
          .from("group_members")
          .select("user_id", { count: "exact", head: true })
          .eq("group_id", groupId);
        if (periodStart) {
          query = query.gte("joined_at", periodStart);
        }
        const { count } = await query;
        value = count ?? 0;
      } else if (metric === "post_count") {
        let query = supabase
          .from("board_posts")
          .select("id", { count: "exact", head: true })
          .eq("group_id", groupId);
        if (periodStart) {
          query = query.gte("created_at", periodStart);
        }
        const { count } = await query;
        value = count ?? 0;
      } else if (metric === "comment_count") {
        // board_comments는 post_id를 통해 group_id 연결
        const { data: posts } = await supabase
          .from("board_posts")
          .select("id")
          .eq("group_id", groupId);
        const postIds = (posts ?? []).map((p: { id: string }) => p.id);
        if (postIds.length > 0) {
          let query = supabase
            .from("board_comments")
            .select("id", { count: "exact", head: true })
            .in("post_id", postIds);
          if (periodStart) {
            query = query.gte("created_at", periodStart);
          }
          const { count } = await query;
          value = count ?? 0;
        }
      } else if (metric === "total_attendance" || metric === "attendance_rate") {
        // 기간 내 일정 조회
        let schedulesQuery = supabase
          .from("schedules")
          .select("id")
          .eq("group_id", groupId)
          .neq("attendance_method", "none");
        if (periodStart) {
          schedulesQuery = schedulesQuery.gte("starts_at", periodStart);
        }
        const { data: schedules } = await schedulesQuery;
        const scheduleIds = (schedules ?? []).map((s: { id: string }) => s.id);

        if (scheduleIds.length === 0) {
          value = 0;
        } else {
          const { count: presentCount } = await supabase
            .from("attendance")
            .select("id", { count: "exact", head: true })
            .in("schedule_id", scheduleIds)
            .in("status", ["present", "late"]);

          if (metric === "total_attendance") {
            value = presentCount ?? 0;
          } else {
            // attendance_rate: 전체 멤버 x 일정 수 대비 출석 비율
            const { count: memberCount } = await supabase
              .from("group_members")
              .select("user_id", { count: "exact", head: true })
              .eq("group_id", groupId);

            const possible = scheduleIds.length * (memberCount ?? 0);
            value =
              possible > 0
                ? Math.round(((presentCount ?? 0) / possible) * 100)
                : 0;
          }
        }
      } else if (metric === "rsvp_rate") {
        let schedulesQuery = supabase
          .from("schedules")
          .select("id")
          .eq("group_id", groupId);
        if (periodStart) {
          schedulesQuery = schedulesQuery.gte("starts_at", periodStart);
        }
        const { data: schedules } = await schedulesQuery;
        const scheduleIds = (schedules ?? []).map((s: { id: string }) => s.id);

        if (scheduleIds.length === 0) {
          value = 0;
        } else {
          const { count: rsvpCount } = await supabase
            .from("schedule_rsvps")
            .select("id", { count: "exact", head: true })
            .in("schedule_id", scheduleIds);

          const { count: memberCount } = await supabase
            .from("group_members")
            .select("user_id", { count: "exact", head: true })
            .eq("group_id", groupId);

          const possible = scheduleIds.length * (memberCount ?? 0);
          value =
            possible > 0
              ? Math.round(((rsvpCount ?? 0) / possible) * 100)
              : 0;
        }
      }
    } catch {
      value = 0;
    }

    results.push({
      type: metric,
      label: meta.label,
      value,
      unit: meta.unit,
    });
  }

  return results;
}

export function useCustomReportBuilder(groupId: string) {
  const [reports, setReports] = useState<CustomReportConfig[]>(() =>
    loadReports(groupId)
  );
  const [computing, setComputing] = useState(false);

  // 단일 리포트 결과 계산 (SWR 기반)
  const useReportResult = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId) ?? null;
    return useSWR(
      report ? swrKeys.customReport(groupId, reportId) : null,
      async (): Promise<ReportMetricValue[]> => {
        if (!report) return [];
        return computeMetricValues(groupId, report.metrics, report.period);
      }
    );
  };

  // 리포트 저장 (최대 5개)
  const saveReport = useCallback(
    (config: Omit<CustomReportConfig, "id" | "createdAt">) => {
      const current = loadReports(groupId);
      if (current.length >= MAX_REPORTS) {
        return { success: false, error: `최대 ${MAX_REPORTS}개까지 저장할 수 있습니다.` };
      }
      const newReport: CustomReportConfig = {
        ...config,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const updated = [...current, newReport];
      saveReports(groupId, updated);
      setReports(updated);
      return { success: true, report: newReport };
    },
    [groupId]
  );

  // 리포트 삭제
  const deleteReport = useCallback(
    (reportId: string) => {
      const current = loadReports(groupId);
      const updated = current.filter((r) => r.id !== reportId);
      saveReports(groupId, updated);
      setReports(updated);
    },
    [groupId]
  );

  // 특정 리포트 결과 즉시 계산 (저장 없이 미리보기용)
  const computeReport = useCallback(
    async (
      metrics: ReportMetricType[],
      period: ReportPeriod
    ): Promise<ReportMetricValue[]> => {
      setComputing(true);
      try {
        return await computeMetricValues(groupId, metrics, period);
      } finally {
        setComputing(false);
      }
    },
    [groupId]
  );

  // 저장된 특정 리포트 결과 계산
  const computeSavedReport = useCallback(
    async (reportId: string): Promise<ReportMetricValue[]> => {
      const report = loadReports(groupId).find((r) => r.id === reportId);
      if (!report) return [];
      setComputing(true);
      try {
        return await computeMetricValues(groupId, report.metrics, report.period);
      } finally {
        setComputing(false);
      }
    },
    [groupId]
  );

  return {
    reports,
    computing,
    saveReport,
    deleteReport,
    computeReport,
    computeSavedReport,
    useReportResult,
    maxReports: MAX_REPORTS,
    canSave: reports.length < MAX_REPORTS,
  };
}
