"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useScheduleWeather } from "@/hooks/use-schedule-weather";
import type { Schedule } from "@/types";

type ScheduleWeatherBadgeProps = {
  schedule: Pick<
    Schedule,
    "id" | "starts_at" | "latitude" | "longitude"
  >;
};

/**
 * 일정 날짜의 날씨 예보를 표시하는 배지 컴포넌트.
 * - 7일 이내 일정에만 표시
 * - 로딩 중 Skeleton 표시
 * - API 오류 시 숨김
 */
export function ScheduleWeatherBadge({ schedule }: ScheduleWeatherBadgeProps) {
  const { weather, loading, error, forecastAvailable } = useScheduleWeather(
    schedule.id,
    schedule.starts_at,
    schedule.latitude,
    schedule.longitude
  );

  // 7일 초과 일정은 렌더링하지 않음
  if (!forecastAvailable) return null;

  // API 오류 시 숨김
  if (error) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 py-1">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-3 w-32 rounded" />
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="text-base leading-none" aria-label={weather.description}>
        {weather.emoji}
      </span>
      <span className="font-medium text-foreground">{weather.description}</span>
      <span>
        최고 {weather.tempMax}°C / 최저 {weather.tempMin}°C
      </span>
      {weather.precipitationProbability > 0 && (
        <span className="text-blue-500">
          강수 {weather.precipitationProbability}%
        </span>
      )}
    </div>
  );
}
