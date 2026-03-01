"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { ScheduleWeather } from "@/types";
import { removeFromStorage } from "@/lib/local-storage";

// 서울 기본 좌표
const DEFAULT_LAT = 37.5665;
const DEFAULT_LON = 126.978;

// 날씨 코드 -> 이모지 + 설명 매핑
function getWeatherInfo(code: number): { emoji: string; description: string } {
  if (code === 0) return { emoji: "☀️", description: "맑음" };
  if (code <= 3) return { emoji: "⛅", description: code === 1 ? "구름 조금" : "구름 많음" };
  if (code <= 48) return { emoji: "🌫️", description: "안개" };
  if (code <= 67) return { emoji: "🌧️", description: "비" };
  if (code <= 77) return { emoji: "❄️", description: "눈" };
  if (code <= 82) return { emoji: "🌦️", description: "소나기" };
  if (code <= 99) return { emoji: "⛈️", description: "뇌우" };
  return { emoji: "🌡️", description: "알 수 없음" };
}

// YYYY-MM-DD 형식으로 날짜 포맷
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// localStorage 캐시 키
function cacheKey(scheduleId: string): string {
  return `weather-${scheduleId}`;
}

type CacheEntry = {
  data: ScheduleWeather;
  expiresAt: number;
};

function readCache(scheduleId: string): ScheduleWeather | null {
  try {
    const raw = localStorage.getItem(cacheKey(scheduleId));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      removeFromStorage(cacheKey(scheduleId));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache(scheduleId: string, data: ScheduleWeather): void {
  try {
    const entry: CacheEntry = {
      data,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1시간 TTL
    };
    localStorage.setItem(cacheKey(scheduleId), JSON.stringify(entry));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

async function fetchWeather(
  scheduleId: string,
  dateStr: string,
  lat: number,
  lon: number
): Promise<ScheduleWeather> {
  const cached = readCache(scheduleId);
  if (cached) return cached;

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode` +
    `&timezone=Asia/Seoul` +
    `&start_date=${dateStr}&end_date=${dateStr}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`날씨 API 호출 실패: ${res.status}`);

  const json = await res.json();
  const daily = json.daily;

  if (
    !daily ||
    !Array.isArray(daily.temperature_2m_max) ||
    daily.temperature_2m_max.length === 0
  ) {
    throw new Error("날씨 데이터를 파싱할 수 없습니다");
  }

  const weatherCode: number = daily.weathercode[0] ?? 0;
  const { emoji, description } = getWeatherInfo(weatherCode);

  const weather: ScheduleWeather = {
    date: dateStr,
    tempMax: Math.round(daily.temperature_2m_max[0] ?? 0),
    tempMin: Math.round(daily.temperature_2m_min[0] ?? 0),
    precipitationProbability: Math.round(
      daily.precipitation_probability_max[0] ?? 0
    ),
    weatherCode,
    emoji,
    description,
  };

  writeCache(scheduleId, weather);
  return weather;
}

type UseScheduleWeatherResult = {
  weather: ScheduleWeather | null;
  loading: boolean;
  error: Error | null;
  /** 7일 이내 일정 여부 */
  forecastAvailable: boolean;
};

/**
 * 일정 ID와 시작 시각(ISO 문자열), 선택적 위도/경도를 받아
 * 해당 날짜의 날씨 예보를 반환합니다.
 *
 * - 7일 이후 일정: forecastAvailable = false, weather = null
 * - 7일 이내 일정: Open-Meteo API로 조회 후 캐싱
 */
export function useScheduleWeather(
  scheduleId: string,
  startsAt: string,
  latitude?: number | null,
  longitude?: number | null
): UseScheduleWeatherResult {
  const scheduleDate = new Date(startsAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (scheduleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 7일 초과 또는 과거(-1일 이상 지난 것도 허용하지 않음)
  const forecastAvailable = diffDays >= 0 && diffDays <= 6;

  const { data, isLoading, error } = useSWR<ScheduleWeather>(
    forecastAvailable ? swrKeys.scheduleWeather(scheduleId) : null,
    () => {
      const lat = latitude ?? DEFAULT_LAT;
      const lon = longitude ?? DEFAULT_LON;
      const dateStr = formatDate(scheduleDate);
      return fetchWeather(scheduleId, dateStr, lat, lon);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60 * 60 * 1000, // 1시간
    }
  );

  return {
    weather: data ?? null,
    loading: isLoading,
    error: error ?? null,
    forecastAvailable,
  };
}
