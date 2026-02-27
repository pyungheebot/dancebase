"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { Schedule, CountdownSchedule } from "@/types";

// 남은 시간을 일/시/분/초로 분해
function calcTimeLeft(startsAt: string): {
  totalSeconds: number;
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  secondsLeft: number;
  isUrgent: boolean;
} {
  const diff = Math.max(0, new Date(startsAt).getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const daysLeft = Math.floor(totalSeconds / 86400);
  const hoursLeft = Math.floor((totalSeconds % 86400) / 3600);
  const minutesLeft = Math.floor((totalSeconds % 3600) / 60);
  const secondsLeft = totalSeconds % 60;
  const isUrgent = diff < 24 * 60 * 60 * 1000; // 24시간 이내
  return { totalSeconds, daysLeft, hoursLeft, minutesLeft, secondsLeft, isUrgent };
}

function toCountdownSchedule(schedule: Schedule): CountdownSchedule {
  const { daysLeft, hoursLeft, minutesLeft, secondsLeft, isUrgent } =
    calcTimeLeft(schedule.starts_at);
  return {
    id: schedule.id,
    title: schedule.title,
    startsAt: schedule.starts_at,
    location: schedule.location,
    daysLeft,
    hoursLeft,
    minutesLeft,
    secondsLeft,
    isUrgent,
  };
}

export function useScheduleCountdown(groupId: string) {
  // Supabase에서 다음 일정(starts_at > now) 상위 4개 조회 (1개 메인 + 3개 미리보기)
  const { data: upcomingSchedules, isLoading } = useSWR(
    swrKeys.scheduleCountdown(groupId),
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("group_id", groupId)
        .gt("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(4);

      if (error) throw error;
      return (data ?? []) as Schedule[];
    },
    {
      // 1분마다 재조회 (카운트다운은 setInterval로 처리)
      refreshInterval: 60_000,
    }
  );

  // 실시간 카운트다운 상태 (1초 갱신)
  const [countdownList, setCountdownList] = useState<CountdownSchedule[]>([]);

  useEffect(() => {
    if (!upcomingSchedules || upcomingSchedules.length === 0) {
      setCountdownList([]);
      return;
    }

    // 초기값 설정
    setCountdownList(upcomingSchedules.map(toCountdownSchedule));

    const timer = setInterval(() => {
      setCountdownList(upcomingSchedules.map(toCountdownSchedule));
    }, 1000);

    return () => clearInterval(timer);
  }, [upcomingSchedules]);

  const nextSchedule = countdownList[0] ?? null;
  const previewList = countdownList.slice(1); // 다음 3개 (인덱스 1~3)

  return {
    nextSchedule,
    previewList,
    loading: isLoading,
  };
}
