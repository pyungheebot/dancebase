"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { Project, ProjectTask } from "@/types";

export type TimelineProject = Project & {
  member_count: number;
  is_shared: boolean;
  completionRate: number;
  totalTasks: number;
  doneTasks: number;
  // 그리드 좌표 (월 단위)
  colStart: number; // 1-based 컬럼 시작
  colSpan: number;  // 컬럼 수
  hasDate: boolean;
};

export type TimelineMonth = {
  year: number;
  month: number; // 1~12
  label: string; // "2025년 3월"
};

export type ProjectTimelineData = {
  projects: TimelineProject[];
  months: TimelineMonth[];
  todayColOffset: number | null; // 오늘 날짜의 픽셀 오프셋 (%)
};

const CELL_WIDTH = 120; // px per month

/** 날짜 문자열(YYYY-MM-DD)을 Date(로컬 자정)로 파싱 */
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 두 날짜(로컬 자정) 사이의 일 수 */
function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

/** 해당 월의 총 일 수 */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * 월 인덱스(0-based: months 배열 인덱스)에서
 * 해당 날짜가 차지하는 분수(소수) 컬럼 위치를 반환.
 * monthIndex=0이면 months[0]의 1일이 컬럼 0.0
 */
function dateToColFraction(date: Date, months: TimelineMonth[]): number {
  if (months.length === 0) return 0;
  const first = months[0];
  const firstDay = new Date(first.year, first.month - 1, 1);
  const totalDays = daysBetween(firstDay, date);
  // 각 월의 일 수를 누적해서 컬럼 위치 계산
  let monthIdx = 0;
  let accumulated = 0;
  for (let i = 0; i < months.length; i++) {
    const dim = daysInMonth(months[i].year, months[i].month);
    if (accumulated + dim > totalDays) {
      const dayInMonth = totalDays - accumulated;
      return i + dayInMonth / dim;
    }
    accumulated += dim;
    monthIdx = i + 1;
  }
  return monthIdx;
}

export function useProjectTimeline(groupId: string) {
  const fetcher = async (): Promise<ProjectTimelineData> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { projects: [], months: [], todayColOffset: null };

    // 1. 그룹 프로젝트 목록 조회
    const { data: projectsData, error: projectsError } = await supabase.rpc(
      "get_group_projects",
      { p_group_id: groupId, p_user_id: user.id }
    );
    if (projectsError) return { projects: [], months: [], todayColOffset: null };

    const rawProjects = (projectsData ?? []) as (Project & { member_count: number; is_shared: boolean })[];
    if (rawProjects.length === 0) return { projects: [], months: [], todayColOffset: null };

    // 2. 각 프로젝트의 태스크 완료율 조회 (병렬)
    const taskResults = await Promise.all(
      rawProjects.map((p) =>
        supabase
          .from("project_tasks")
          .select("id, status")
          .eq("project_id", p.id)
      )
    );

    // 3. 날짜 범위 계산 (타임라인 표시 범위)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // start_date / end_date 있는 프로젝트만 날짜 범위 계산에 포함
    const datedProjects = rawProjects.filter((p) => p.start_date || p.end_date);

    let rangeStart: Date;
    let rangeEnd: Date;

    if (datedProjects.length === 0) {
      // 날짜 없는 프로젝트만 있을 때: 이번 달 ± 2달
      rangeStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      rangeEnd = new Date(today.getFullYear(), today.getMonth() + 3, 0);
    } else {
      const starts = datedProjects
        .filter((p) => p.start_date)
        .map((p) => parseDate(p.start_date!));
      const ends = datedProjects
        .filter((p) => p.end_date)
        .map((p) => parseDate(p.end_date!));

      const minDate = starts.length > 0 ? new Date(Math.min(...starts.map((d) => d.getTime()))) : today;
      const maxDate = ends.length > 0 ? new Date(Math.max(...ends.map((d) => d.getTime()))) : today;

      // 오늘도 범위에 포함
      const effectiveMin = minDate < today ? minDate : today;
      const effectiveMax = maxDate > today ? maxDate : today;

      // 전후 1달 여유
      rangeStart = new Date(effectiveMin.getFullYear(), effectiveMin.getMonth() - 1, 1);
      rangeEnd = new Date(effectiveMax.getFullYear(), effectiveMax.getMonth() + 2, 0);
    }

    // 4. 월 목록 생성
    const months: TimelineMonth[] = [];
    const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    const endMonth = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);
    while (cur <= endMonth) {
      months.push({
        year: cur.getFullYear(),
        month: cur.getMonth() + 1,
        label: `${cur.getFullYear()}년 ${cur.getMonth() + 1}월`,
      });
      cur.setMonth(cur.getMonth() + 1);
    }

    // 5. 오늘 날짜 컬럼 오프셋 (%)
    const todayFraction = dateToColFraction(today, months);
    const todayColOffset =
      months.length > 0 ? (todayFraction / months.length) * 100 : null;

    // 6. 각 프로젝트에 좌표 + 완료율 추가
    const timelineProjects: TimelineProject[] = rawProjects.map((p, idx) => {
      const tasks = (taskResults[idx].data ?? []) as Pick<ProjectTask, "id" | "status">[];
      const totalTasks = tasks.length;
      const doneTasks = tasks.filter((t) => t.status === "done").length;
      const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      if (!p.start_date && !p.end_date) {
        return {
          ...p,
          completionRate,
          totalTasks,
          doneTasks,
          colStart: 1,
          colSpan: 1,
          hasDate: false,
        };
      }

      // start/end 가 없으면 fallback
      const startD = p.start_date ? parseDate(p.start_date) : today;
      const endD = p.end_date ? parseDate(p.end_date) : startD;

      const startFraction = dateToColFraction(startD, months);
      const endFraction = dateToColFraction(new Date(endD.getFullYear(), endD.getMonth(), endD.getDate() + 1), months);

      const colStart = Math.max(0, startFraction);
      const colSpan = Math.max(endFraction - colStart, 0.1); // 최소 너비 보장

      return {
        ...p,
        completionRate,
        totalTasks,
        doneTasks,
        colStart,
        colSpan,
        hasDate: true,
      };
    });

    return { projects: timelineProjects, months, todayColOffset };
  };

  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.projectTimeline(groupId) : null,
    fetcher
  );

  return {
    projects: data?.projects ?? [],
    months: data?.months ?? [],
    todayColOffset: data?.todayColOffset ?? null,
    loading: isLoading,
    refetch: () => mutate(),
    cellWidth: CELL_WIDTH,
  };
}
