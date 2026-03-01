"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  StageWeatherData,
  StageWeatherForecast,
  StageWeatherPlan,
  StageWeatherRainPlan,
  StageWeatherCondition,
  StageWeatherSafety,
  StageWeatherCheckItem,
} from "@/types";

// ─── 기본값 ───────────────────────────────────────────────────

const DEFAULT_CHECKLIST: StageWeatherCheckItem[] = [
  { id: "cl-1", label: "음향 장비 방수 커버 확인", done: false },
  { id: "cl-2", label: "전기 케이블 안전 점검", done: false },
  { id: "cl-3", label: "무대 바닥 미끄럼 방지 확인", done: false },
  { id: "cl-4", label: "조명 장비 방수 여부 확인", done: false },
  { id: "cl-5", label: "관객 안전 구역 표시 확인", done: false },
];

const DEFAULT_RAIN_PLAN: StageWeatherRainPlan = {
  venueChange: false,
  alternativeVenue: "",
  raincoatReady: false,
  tentReady: false,
};

function buildDefaultData(projectId: string): StageWeatherData {
  return {
    projectId,
    forecasts: [],
    plans: [],
    rainPlan: DEFAULT_RAIN_PLAN,
    updatedAt: new Date().toISOString(),
  };
}

function getStorageKey(projectId: string) {
  return `stage-weather-${projectId}`;
}

// ─── 날씨 → 판정 자동 계산 ────────────────────────────────────

export function calcSafety(
  condition: StageWeatherCondition,
  temperature: number,
  humidity: number
): StageWeatherSafety {
  if (condition === "rainy" || condition === "snowy") return "danger";
  if (condition === "windy") return "caution";
  if (humidity > 90) return "caution";
  if (temperature > 38 || temperature < -5) return "caution";
  if (condition === "cloudy") return "safe";
  return "safe";
}

// ─── 훅 ──────────────────────────────────────────────────────

export function useStageWeather(projectId: string) {
  const { data, mutate } = useSWR(
    swrKeys.stageWeather(projectId),
    () => loadFromStorage<StageWeatherData>(getStorageKey(projectId), {} as StageWeatherData),
    { revalidateOnFocus: false }
  );

  const weatherData = data ?? buildDefaultData(projectId);

  // 예보 추가
  function addForecast(forecast: Omit<StageWeatherForecast, "id" | "checklist" | "safety">) {
    const next: StageWeatherData = {
      ...weatherData,
      forecasts: [
        ...weatherData.forecasts,
        {
          ...forecast,
          id: crypto.randomUUID(),
          safety: calcSafety(forecast.condition, forecast.temperature, forecast.humidity),
          checklist: DEFAULT_CHECKLIST.map((c) => ({ ...c, id: crypto.randomUUID() })),
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(projectId), next);
    mutate(next, false);
  }

  // 예보 수정
  function updateForecast(
    forecastId: string,
    patch: Partial<Omit<StageWeatherForecast, "id" | "checklist" | "safety">>
  ) {
    const next: StageWeatherData = {
      ...weatherData,
      forecasts: weatherData.forecasts.map((f) => {
        if (f.id !== forecastId) return f;
        const merged = { ...f, ...patch };
        return {
          ...merged,
          safety: calcSafety(merged.condition, merged.temperature, merged.humidity),
        };
      }),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(projectId), next);
    mutate(next, false);
  }

  // 예보 삭제
  function removeForecast(forecastId: string) {
    const next: StageWeatherData = {
      ...weatherData,
      forecasts: weatherData.forecasts.filter((f) => f.id !== forecastId),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(projectId), next);
    mutate(next, false);
  }

  // 체크리스트 항목 토글
  function toggleCheckItem(forecastId: string, itemId: string) {
    const next: StageWeatherData = {
      ...weatherData,
      forecasts: weatherData.forecasts.map((f) => {
        if (f.id !== forecastId) return f;
        return {
          ...f,
          checklist: f.checklist.map((c) =>
            c.id === itemId ? { ...c, done: !c.done } : c
          ),
        };
      }),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(projectId), next);
    mutate(next, false);
  }

  // 체크리스트 항목 추가
  function addCheckItem(forecastId: string, label: string) {
    const next: StageWeatherData = {
      ...weatherData,
      forecasts: weatherData.forecasts.map((f) => {
        if (f.id !== forecastId) return f;
        return {
          ...f,
          checklist: [
            ...f.checklist,
            { id: crypto.randomUUID(), label, done: false },
          ],
        };
      }),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(projectId), next);
    mutate(next, false);
  }

  // 체크리스트 항목 삭제
  function removeCheckItem(forecastId: string, itemId: string) {
    const next: StageWeatherData = {
      ...weatherData,
      forecasts: weatherData.forecasts.map((f) => {
        if (f.id !== forecastId) return f;
        return {
          ...f,
          checklist: f.checklist.filter((c) => c.id !== itemId),
        };
      }),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(projectId), next);
    mutate(next, false);
  }

  // 대응 플랜 추가
  function addPlan(plan: Omit<StageWeatherPlan, "id">) {
    const next: StageWeatherData = {
      ...weatherData,
      plans: [
        ...weatherData.plans,
        { ...plan, id: crypto.randomUUID() },
      ],
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(projectId), next);
    mutate(next, false);
  }

  // 대응 플랜 수정
  function updatePlan(planId: string, patch: Partial<Omit<StageWeatherPlan, "id">>) {
    const next: StageWeatherData = {
      ...weatherData,
      plans: weatherData.plans.map((p) =>
        p.id === planId ? { ...p, ...patch } : p
      ),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(projectId), next);
    mutate(next, false);
  }

  // 대응 플랜 삭제
  function removePlan(planId: string) {
    const next: StageWeatherData = {
      ...weatherData,
      plans: weatherData.plans.filter((p) => p.id !== planId),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(projectId), next);
    mutate(next, false);
  }

  // 우천 대체 계획 수정
  function updateRainPlan(patch: Partial<StageWeatherRainPlan>) {
    const next: StageWeatherData = {
      ...weatherData,
      rainPlan: { ...weatherData.rainPlan, ...patch },
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(projectId), next);
    mutate(next, false);
  }

  return {
    data: weatherData,
    addForecast,
    updateForecast,
    removeForecast,
    toggleCheckItem,
    addCheckItem,
    removeCheckItem,
    addPlan,
    updatePlan,
    removePlan,
    updateRainPlan,
    refetch: () => mutate(),
  };
}
