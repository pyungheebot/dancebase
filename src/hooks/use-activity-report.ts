"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
import type {
  GroupActivityReport,
  GroupReportPeriod,
  GroupReportSection,
} from "@/types";

// ─── 상수 ─────────────────────────────────────────────────────

const MAX_REPORTS = 12;

// ─── localStorage 헬퍼 ────────────────────────────────────────

function loadData(groupId: string): GroupActivityReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(
      `dancebase:activity-reports:${groupId}`
    );
    if (!raw) return [];
    return JSON.parse(raw) as GroupActivityReport[];
  } catch {
    return [];
  }
}

function saveData(groupId: string, data: GroupActivityReport[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `dancebase:activity-reports:${groupId}`,
      JSON.stringify(data)
    );
  } catch {
    /* ignore */
  }
}

// ─── 시뮬레이션 데이터 생성 ───────────────────────────────────

/**
 * 이전 리포트가 있을 경우 해당 수치를 참고해 변화율을 계산합니다.
 * 없을 경우 랜덤 초기값을 반환합니다.
 */
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calcChange(
  current: number,
  previous: number | undefined
): number | undefined {
  if (previous === undefined || previous === 0) return undefined;
  return Math.round(((current - previous) / previous) * 100);
}

function generateSections(
  prevSections: GroupReportSection[] | undefined
): GroupReportSection[] {
  const prevMap = new Map(
    (prevSections ?? []).map((s) => [s.label, s.value])
  );

  const scheduleCount = randomInRange(4, 20);
  const postCount = randomInRange(2, 30);
  const attendanceRate = randomInRange(55, 100);
  const activeMembers = randomInRange(3, 25);
  const practiceHours = randomInRange(5, 40);
  const newMembers = randomInRange(0, 5);

  return [
    {
      label: "일정 수",
      value: scheduleCount,
      unit: "건",
      change: calcChange(scheduleCount, prevMap.get("일정 수")),
    },
    {
      label: "게시글 수",
      value: postCount,
      unit: "개",
      change: calcChange(postCount, prevMap.get("게시글 수")),
    },
    {
      label: "평균 출석률",
      value: attendanceRate,
      unit: "%",
      change: calcChange(attendanceRate, prevMap.get("평균 출석률")),
    },
    {
      label: "활동 멤버",
      value: activeMembers,
      unit: "명",
      change: calcChange(activeMembers, prevMap.get("활동 멤버")),
    },
    {
      label: "연습 시간",
      value: practiceHours,
      unit: "시간",
      change: calcChange(practiceHours, prevMap.get("연습 시간")),
    },
    {
      label: "신규 가입",
      value: newMembers,
      unit: "명",
      change: calcChange(newMembers, prevMap.get("신규 가입")),
    },
  ];
}

/**
 * 기간 라벨을 생성합니다.
 * monthly: "2026년 2월", quarterly: "2026년 1분기"
 */
function buildPeriodLabel(period: GroupReportPeriod): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1~12

  if (period === "monthly") {
    return `${year}년 ${month}월`;
  }
  // quarterly
  const quarter = Math.ceil(month / 3);
  return `${year}년 ${quarter}분기`;
}

// ─── 훅 ─────────────────────────────────────────────────────

export interface GenerateReportInput {
  period: GroupReportPeriod;
  highlights: string[];
  concerns: string[];
}

export function useActivityReport(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.activityReport(groupId) : null,
    () => loadData(groupId),
    { revalidateOnFocus: false }
  );

  const reports = data ?? [];

  // ── 리포트 생성 ──────────────────────────────────────────

  function generateReport(input: GenerateReportInput): boolean {
    try {
      const stored = loadData(groupId);

      // 직전 리포트의 섹션을 참고해 변화율 계산
      const prevSections =
        stored.length > 0 ? stored[stored.length - 1].sections : undefined;

      const newReport: GroupActivityReport = {
        id: crypto.randomUUID(),
        period: input.period,
        periodLabel: buildPeriodLabel(input.period),
        sections: generateSections(prevSections),
        highlights: input.highlights.filter(Boolean),
        concerns: input.concerns.filter(Boolean),
        createdAt: new Date().toISOString(),
      };

      // 최신순 prepend, 최대 MAX_REPORTS 유지
      const next = [newReport, ...stored].slice(0, MAX_REPORTS);
      saveData(groupId, next);
      mutate(next, false);
      toast.success("활동 리포트가 생성되었습니다.");
      return true;
    } catch {
      toast.error("리포트 생성에 실패했습니다.");
      return false;
    }
  }

  // ── 리포트 삭제 ──────────────────────────────────────────

  function deleteReport(reportId: string): boolean {
    try {
      const stored = loadData(groupId);
      const next = stored.filter((r) => r.id !== reportId);
      if (next.length === stored.length) return false;
      saveData(groupId, next);
      mutate(next, false);
      toast.success("리포트가 삭제되었습니다.");
      return true;
    } catch {
      toast.error("리포트 삭제에 실패했습니다.");
      return false;
    }
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalReports = reports.length;
  const latestReport = reports[0] ?? null;

  return {
    reports,
    totalReports,
    latestReport,
    // CRUD
    generateReport,
    deleteReport,
    // SWR
    refetch: () => mutate(),
  };
}
