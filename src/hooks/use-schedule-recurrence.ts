"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  ScheduleRecurrenceRule,
  RecurrenceType,
  RecurrenceEndType,
} from "@/types";

// ============================================
// 상수
// ============================================

const MAX_RULES = 10;

// ============================================
// localStorage 헬퍼
// ============================================

function getStorageKey(groupId: string): string {
  return `dancebase:schedule-recurrence:${groupId}`;
}

function loadRules(groupId: string): ScheduleRecurrenceRule[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as ScheduleRecurrenceRule[];
  } catch {
    return [];
  }
}

function saveRules(groupId: string, rules: ScheduleRecurrenceRule[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(groupId), JSON.stringify(rules));
}

// ============================================
// 향후 일정 생성 유틸리티
// ============================================

/**
 * 반복 규칙에서 향후 N개의 일정 날짜(Date 배열)를 생성합니다.
 * 기준일: 오늘 (포함하지 않고 익일부터)
 */
export function generateUpcomingDates(
  rule: ScheduleRecurrenceRule,
  count: number = 4
): Date[] {
  const results: Date[] = [];

  if (rule.daysOfWeek.length === 0) return results;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 종료 날짜 파싱
  const endDate = rule.endDate ? new Date(rule.endDate) : null;
  if (endDate) endDate.setHours(23, 59, 59, 999);

  // endCount 한도 (by_count 시)
  const maxByCount =
    rule.endType === "by_count" && rule.endCount != null
      ? rule.endCount
      : Infinity;

  let cursor = new Date(today);
  cursor.setDate(cursor.getDate() + 1); // 내일부터 시작

  // biweekly는 2주 단위이므로, 기준 주(월요일)를 추적
  // weekly / biweekly: 요일 기반 / monthly: 요일-of-month (다음 달의 같은 요일)

  let safeGuard = 0;
  const MAX_ITERATIONS = 1000;

  while (
    results.length < count &&
    results.length < maxByCount &&
    safeGuard < MAX_ITERATIONS
  ) {
    safeGuard++;

    const dayOfWeek = cursor.getDay(); // 0=일 ~ 6=토

    if (rule.type === "weekly" || rule.type === "biweekly") {
      if (rule.daysOfWeek.includes(dayOfWeek)) {
        // biweekly: 격주 확인 (오늘 기준 주 번호)
        let include = true;
        if (rule.type === "biweekly") {
          const refDate = new Date(2024, 0, 1); // 기준 월요일 (임의 고정)
          const diffMs = cursor.getTime() - refDate.getTime();
          const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
          include = diffWeeks % 2 === 0;
        }
        if (include) {
          if (endDate && cursor > endDate) break;
          results.push(new Date(cursor));
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    } else if (rule.type === "monthly") {
      // 매월: 해당 달에서 daysOfWeek에 해당하는 첫 번째 날짜 (N번째 해당 요일)
      // 단순하게 현재 날짜가 해당 요일이면 추가
      if (rule.daysOfWeek.includes(dayOfWeek)) {
        if (endDate && cursor > endDate) break;
        results.push(new Date(cursor));
        // 다음 달로 이동 (28일 후)
        cursor.setDate(cursor.getDate() + 28);
        // 정확한 동일 요일을 찾기 위해 조정
        while (!rule.daysOfWeek.includes(cursor.getDay())) {
          cursor.setDate(cursor.getDate() + 1);
        }
      } else {
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return results;
}

// ============================================
// 훅 반환 타입
// ============================================

export type RecurrenceRuleFormData = Omit<
  ScheduleRecurrenceRule,
  "id" | "groupId" | "createdAt"
>;

export type UseScheduleRecurrenceReturn = {
  rules: ScheduleRecurrenceRule[];
  maxReached: boolean;
  /** 새 반복 규칙 추가. 최대 10개 초과 시 false 반환 */
  addRule: (formData: RecurrenceRuleFormData) => boolean;
  /** 기존 반복 규칙 수정 */
  updateRule: (id: string, formData: RecurrenceRuleFormData) => void;
  /** 반복 규칙 삭제 */
  deleteRule: (id: string) => void;
  /** 특정 규칙에서 향후 일정 날짜 생성 */
  getUpcomingDates: (rule: ScheduleRecurrenceRule, count?: number) => Date[];
};

// ============================================
// 훅 구현
// ============================================

export function useScheduleRecurrence(
  groupId: string
): UseScheduleRecurrenceReturn {
  const [rules, setRules] = useState<ScheduleRecurrenceRule[]>([]);

  // 마운트 시 localStorage에서 읽기
  useEffect(() => {
    if (!groupId) return;
    setRules(loadRules(groupId));
  }, [groupId]);

  const addRule = useCallback(
    (formData: RecurrenceRuleFormData): boolean => {
      const current = loadRules(groupId);
      if (current.length >= MAX_RULES) return false;

      const newRule: ScheduleRecurrenceRule = {
        id: crypto.randomUUID(),
        groupId,
        ...formData,
        createdAt: new Date().toISOString(),
      };

      const updated = [newRule, ...current];
      saveRules(groupId, updated);
      setRules(updated);
      return true;
    },
    [groupId]
  );

  const updateRule = useCallback(
    (id: string, formData: RecurrenceRuleFormData): void => {
      const current = loadRules(groupId);
      const updated = current.map((r) =>
        r.id === id ? { ...r, ...formData } : r
      );
      saveRules(groupId, updated);
      setRules(updated);
    },
    [groupId]
  );

  const deleteRule = useCallback(
    (id: string): void => {
      const current = loadRules(groupId);
      const updated = current.filter((r) => r.id !== id);
      saveRules(groupId, updated);
      setRules(updated);
    },
    [groupId]
  );

  const getUpcomingDates = useCallback(
    (rule: ScheduleRecurrenceRule, count: number = 4): Date[] => {
      return generateUpcomingDates(rule, count);
    },
    []
  );

  return {
    rules,
    maxReached: rules.length >= MAX_RULES,
    addRule,
    updateRule,
    deleteRule,
    getUpcomingDates,
  };
}

// ============================================
// 반복 규칙 요약 텍스트 생성 유틸리티
// ============================================

const DAY_LABELS: Record<number, string> = {
  0: "일",
  1: "월",
  2: "화",
  3: "수",
  4: "목",
  5: "금",
  6: "토",
};

const RECURRENCE_TYPE_LABELS: Record<RecurrenceType, string> = {
  weekly: "매주",
  biweekly: "격주",
  monthly: "매월",
};

const RECURRENCE_END_TYPE_LABELS: Record<RecurrenceEndType, string> = {
  never: "계속",
  by_date: "날짜까지",
  by_count: "N회 후 종료",
};

export function formatRecurrenceSummary(rule: ScheduleRecurrenceRule): string {
  const typeLabel = RECURRENCE_TYPE_LABELS[rule.type];
  const daysLabel =
    rule.daysOfWeek.length > 0
      ? rule.daysOfWeek
          .slice()
          .sort((a, b) => a - b)
          .map((d) => `${DAY_LABELS[d]}요일`)
          .join(", ")
      : "요일 미선택";

  const endLabel =
    rule.endType === "by_date" && rule.endDate
      ? `${rule.endDate}까지`
      : rule.endType === "by_count" && rule.endCount != null
      ? `${rule.endCount}회 후 종료`
      : RECURRENCE_END_TYPE_LABELS[rule.endType];

  return `${typeLabel} ${daysLabel} ${rule.startTime} (${rule.durationMinutes}분) · ${endLabel}`;
}

export { DAY_LABELS, RECURRENCE_TYPE_LABELS, RECURRENCE_END_TYPE_LABELS };
