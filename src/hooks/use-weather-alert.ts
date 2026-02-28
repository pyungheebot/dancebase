"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { WeatherAlertEntry, WeatherAlertCondition, WeatherAlertLevel } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const STORAGE_PREFIX = "dancebase:weather-alert";

function storageKey(groupId: string): string {
  return `${STORAGE_PREFIX}:${groupId}`;
}

function loadAlerts(groupId: string): WeatherAlertEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as WeatherAlertEntry[];
  } catch {
    return [];
  }
}

function saveAlerts(groupId: string, alerts: WeatherAlertEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(groupId), JSON.stringify(alerts));
}

// ─── 날짜 헬퍼 ───────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(base: string, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useWeatherAlert(groupId: string) {
  const key = swrKeys.weatherAlert(groupId);

  const { data, mutate } = useSWR(key, () => loadAlerts(groupId), {
    revalidateOnFocus: false,
  });

  const alerts: WeatherAlertEntry[] = data ?? [];

  // ── CRUD ─────────────────────────────────────────────────

  function addAlert(
    input: Omit<WeatherAlertEntry, "id" | "createdAt">
  ): boolean {
    try {
      const stored = loadAlerts(groupId);
      const newEntry: WeatherAlertEntry = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const updated = [...stored, newEntry];
      saveAlerts(groupId, updated);
      mutate(updated, false);
      return true;
    } catch {
      return false;
    }
  }

  function updateAlert(
    id: string,
    patch: Partial<Omit<WeatherAlertEntry, "id" | "createdAt">>
  ): boolean {
    try {
      const stored = loadAlerts(groupId);
      const updated = stored.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry
      );
      saveAlerts(groupId, updated);
      mutate(updated, false);
      return true;
    } catch {
      return false;
    }
  }

  function deleteAlert(id: string): boolean {
    try {
      const stored = loadAlerts(groupId);
      const updated = stored.filter((entry) => entry.id !== id);
      saveAlerts(groupId, updated);
      mutate(updated, false);
      return true;
    } catch {
      return false;
    }
  }

  // ── 조회 헬퍼 ────────────────────────────────────────────

  function getTodayAlert(): WeatherAlertEntry | null {
    const today = todayStr();
    return alerts.find((e) => e.date === today) ?? null;
  }

  function getUpcomingAlerts(days: number): WeatherAlertEntry[] {
    const today = todayStr();
    const limit = addDays(today, days);
    return alerts
      .filter((e) => e.date >= today && e.date <= limit)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function getRecentAlerts(days: number): WeatherAlertEntry[] {
    const today = todayStr();
    const from = addDays(today, -days);
    return alerts
      .filter((e) => e.date >= from && e.date <= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalAlerts = alerts.length;
  const dangerDays = alerts.filter(
    (e) => e.alertLevel === "danger" || e.alertLevel === "warning"
  ).length;
  const safeDays = alerts.filter((e) => e.alertLevel === "safe").length;

  return {
    alerts,
    addAlert,
    updateAlert,
    deleteAlert,
    getTodayAlert,
    getUpcomingAlerts,
    getRecentAlerts,
    stats: { totalAlerts, dangerDays, safeDays },
  };
}

// ─── 상수 (컴포넌트에서 재사용) ──────────────────────────────

export const WEATHER_CONDITION_LABELS: Record<WeatherAlertCondition, string> = {
  sunny: "맑음",
  cloudy: "흐림",
  rainy: "비",
  snowy: "눈",
  windy: "강풍",
  hot: "폭염",
  cold: "한파",
  humid: "습함",
};

export const WEATHER_LEVEL_LABELS: Record<WeatherAlertLevel, string> = {
  safe: "안전",
  caution: "주의",
  warning: "경고",
  danger: "위험",
};

export const WEATHER_LEVEL_COLORS: Record<WeatherAlertLevel, string> = {
  safe: "bg-green-100 text-green-700",
  caution: "bg-yellow-100 text-yellow-700",
  warning: "bg-orange-100 text-orange-700",
  danger: "bg-red-100 text-red-700",
};
