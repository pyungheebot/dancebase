"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type { BudgetScenario, ScenarioResult } from "@/types";

const MAX_SCENARIOS = 5;

function getStorageKey(groupId: string): string {
  return `dancebase:budget-scenario:${groupId}`;
}

function loadScenarios(groupId: string): BudgetScenario[] {
  return loadFromStorage<BudgetScenario[]>(getStorageKey(groupId), []);
}

function saveScenarios(groupId: string, scenarios: BudgetScenario[]): void {
  saveToStorage(getStorageKey(groupId), scenarios);
}

function calcResult(scenario: BudgetScenario): ScenarioResult {
  const monthlyIncome =
    scenario.monthlyFee * scenario.memberCount +
    scenario.performanceCount * scenario.avgPerformanceIncome +
    scenario.otherIncome;

  const monthlyExpense = scenario.venueRentPerMonth + scenario.otherExpenses;

  const monthlyProfit = monthlyIncome - monthlyExpense;
  const annualProfit = monthlyProfit * 12;

  return {
    scenarioId: scenario.id,
    monthlyIncome,
    monthlyExpense,
    monthlyProfit,
    annualProfit,
  };
}

export function useBudgetScenario(groupId: string) {
  const { data: scenarios, mutate } = useSWR(
    swrKeys.budgetScenario(groupId),
    () => loadScenarios(groupId),
    { fallbackData: [] }
  );

  const list = useMemo(() => scenarios ?? [], [scenarios]);

  // 결과 계산 (전체 시나리오)
  const results: ScenarioResult[] = list.map(calcResult);

  // 단일 시나리오 결과 계산
  const getResult = useCallback(
    (scenarioId: string): ScenarioResult | null => {
      const scenario = list.find((s) => s.id === scenarioId);
      if (!scenario) return null;
      return calcResult(scenario);
    },
    [list]
  );

  // 시나리오 추가
  const addScenario = useCallback(
    (
      params: Omit<BudgetScenario, "id" | "createdAt">
    ): { error?: string } => {
      const current = loadScenarios(groupId);
      if (current.length >= MAX_SCENARIOS) {
        return { error: `시나리오는 최대 ${MAX_SCENARIOS}개까지 등록할 수 있습니다.` };
      }

      const newScenario: BudgetScenario = {
        ...params,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };

      const updated = [...current, newScenario];
      saveScenarios(groupId, updated);
      void mutate(updated, false);
      return {};
    },
    [groupId, mutate]
  );

  // 시나리오 수정
  const updateScenario = useCallback(
    (
      scenarioId: string,
      params: Partial<Omit<BudgetScenario, "id" | "createdAt">>
    ): { error?: string } => {
      const current = loadScenarios(groupId);
      const idx = current.findIndex((s) => s.id === scenarioId);
      if (idx === -1) {
        return { error: "시나리오를 찾을 수 없습니다." };
      }

      const updated = current.map((s) =>
        s.id === scenarioId ? { ...s, ...params } : s
      );
      saveScenarios(groupId, updated);
      void mutate(updated, false);
      return {};
    },
    [groupId, mutate]
  );

  // 시나리오 삭제
  const deleteScenario = useCallback(
    (scenarioId: string): void => {
      const current = loadScenarios(groupId);
      const updated = current.filter((s) => s.id !== scenarioId);
      saveScenarios(groupId, updated);
      void mutate(updated, false);
    },
    [groupId, mutate]
  );

  return {
    scenarios: list,
    results,
    maxScenarios: MAX_SCENARIOS,
    canAdd: list.length < MAX_SCENARIOS,
    getResult,
    addScenario,
    updateScenario,
    deleteScenario,
  };
}
