"use client";

import { useState, useCallback } from "react";
import type { RehearsalPlan, RehearsalWeek, RehearsalCheckItem } from "@/types";

// ============================================
// 6주 리허설 템플릿 정의
// ============================================

type WeekTemplate = {
  goal: string;
  checks: string[];
};

const WEEK_TEMPLATES: Record<number, WeekTemplate> = {
  6: {
    goal: "기초 안무 연습",
    checks: [
      "전체 안무 개요 공유 및 파트 분배",
      "1절 기초 스텝 익히기",
      "2절 기초 스텝 익히기",
      "개인 연습 영상 촬영 및 피드백",
      "다음 주 연습 일정 확정",
    ],
  },
  5: {
    goal: "안무 완성 + 음악 마감",
    checks: [
      "전체 안무 1회독 완주",
      "취약 파트 집중 반복 연습",
      "음악 편집 버전 최종 확정",
      "대형 및 포메이션 초안 작성",
      "의상 콘셉트 회의",
    ],
  },
  4: {
    goal: "팀 합동 연습",
    checks: [
      "팀 전체 합동 연습 1회 이상 진행",
      "포메이션 이동 동선 정리",
      "음악과 안무 싱크 맞추기",
      "연습 영상 전체 촬영 및 피드백",
    ],
  },
  3: {
    goal: "의상 / 소품 준비",
    checks: [
      "의상 최종 확정 및 주문/제작",
      "소품 목록 작성 및 준비",
      "헤어·메이크업 콘셉트 확정",
      "안무 집중 보완 연습",
      "공연 무대 사전 답사 (가능 시)",
    ],
  },
  2: {
    goal: "무대 리허설",
    checks: [
      "의상 착용 합동 연습",
      "무대 동선 리허설 1회 이상",
      "조명·음향 체크",
      "입·퇴장 동선 정리",
      "긴급 대체 플랜 수립",
    ],
  },
  1: {
    goal: "최종 점검 + 드레스 리허설",
    checks: [
      "드레스 리허설 (풀 런스루)",
      "최종 의상·소품 점검",
      "공연 당일 타임라인 공유",
      "멘탈 케어 및 컨디션 관리",
    ],
  },
};

// ============================================
// 유틸 함수
// ============================================

/** 주차 범위 레이블 생성: "D-42 ~ D-36" */
function makeWeekLabel(weekNumber: number): string {
  // weekNumber 6 → D-42~D-36, weekNumber 1 → D-7~D-1
  const dEnd = weekNumber * 7;
  const dStart = dEnd - 6;
  return `D-${dEnd} ~ D-${dStart}`;
}

/** 6주 RehearsalWeek 배열 생성 */
function buildWeeks(_performanceDate: string): RehearsalWeek[] {
  return [6, 5, 4, 3, 2, 1].map((wn) => {
    const tmpl = WEEK_TEMPLATES[wn];
    const checks: RehearsalCheckItem[] = tmpl.checks.map((title, idx) => ({
      id: `w${wn}-c${idx + 1}-${Date.now()}`,
      title,
      checked: false,
    }));
    return {
      weekNumber: wn,
      label: makeWeekLabel(wn),
      goal: tmpl.goal,
      checks,
    };
  });
}

/** localStorage 키 생성 */
function makeStorageKey(groupId: string, projectId: string): string {
  return `dancebase:rehearsal-plan:${groupId}:${projectId}`;
}

// ============================================
// 훅
// ============================================

export function useRehearsalPlanner(groupId: string, projectId: string) {
  const storageKey = makeStorageKey(groupId, projectId);

  const [plan, setPlan] = useState<RehearsalPlan | null>(null);

  // 마운트 시 localStorage에서 불러오기

  /** localStorage에 저장하고 state 업데이트 */
  const persist = useCallback(
    (next: RehearsalPlan | null) => {
      if (next === null) {
        localStorage.removeItem(storageKey);
        setPlan(null);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(next));
        setPlan(next);
      }
    },
    [storageKey]
  );

  /** 플랜 생성 */
  const createPlan = useCallback(
    (performanceDate: string, title: string) => {
      const newPlan: RehearsalPlan = {
        id: `plan-${Date.now()}`,
        performanceDate,
        title,
        weeks: buildWeeks(performanceDate),
        createdAt: new Date().toISOString(),
      };
      persist(newPlan);
    },
    [persist]
  );

  /** 체크 토글 */
  const toggleCheck = useCallback(
    (weekNumber: number, checkId: string) => {
      if (!plan) return;
      const updatedWeeks = plan.weeks.map((w) => {
        if (w.weekNumber !== weekNumber) return w;
        return {
          ...w,
          checks: w.checks.map((c) =>
            c.id === checkId ? { ...c, checked: !c.checked } : c
          ),
        };
      });
      persist({ ...plan, weeks: updatedWeeks });
    },
    [plan, persist]
  );

  /** 플랜 삭제 */
  const deletePlan = useCallback(() => {
    persist(null);
  }, [persist]);

  /** 주차 완료율 (0-100) */
  const getWeekProgress = useCallback(
    (weekNumber: number): number => {
      if (!plan) return 0;
      const week = plan.weeks.find((w) => w.weekNumber === weekNumber);
      if (!week || week.checks.length === 0) return 0;
      const done = week.checks.filter((c) => c.checked).length;
      return Math.round((done / week.checks.length) * 100);
    },
    [plan]
  );

  /** 전체 완료율 (0-100) */
  const overallProgress = useCallback((): number => {
    if (!plan) return 0;
    const total = plan.weeks.reduce((acc, w) => acc + w.checks.length, 0);
    if (total === 0) return 0;
    const done = plan.weeks.reduce(
      (acc, w) => acc + w.checks.filter((c) => c.checked).length,
      0
    );
    return Math.round((done / total) * 100);
  }, [plan]);

  /** D-Day 계산 */
  const getDDay = useCallback((): number | null => {
    if (!plan) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const perf = new Date(plan.performanceDate);
    perf.setHours(0, 0, 0, 0);
    return Math.round((perf.getTime() - today.getTime()) / 86400000);
  }, [plan]);

  return {
    plan,
    createPlan,
    toggleCheck,
    deletePlan,
    getWeekProgress,
    overallProgress,
    getDDay,
  };
}
