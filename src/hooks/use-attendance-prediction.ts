"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { calculateShowRate, predictAttendance } from "@/lib/attendance-prediction";

export type AttendancePredictionResult = {
  rsvpYesCount: number;
  predictedAttendance: number;
  showRate: number;
  hasData: boolean;
};

export function useAttendancePrediction(
  groupId: string | null,
  scheduleId: string | null
) {
  const { data, isLoading, mutate } = useSWR(
    groupId && scheduleId
      ? swrKeys.attendancePrediction(groupId, scheduleId)
      : null,
    async (): Promise<AttendancePredictionResult> => {
      if (!groupId || !scheduleId) {
        return { rsvpYesCount: 0, predictedAttendance: 0, showRate: 0.85, hasData: false };
      }

      const supabase = createClient();

      // RSVP 'going' 수 조회
      const { data: rsvpRows, error: rsvpError } = await supabase
        .from("schedule_rsvp")
        .select("user_id")
        .eq("schedule_id", scheduleId)
        .eq("response", "going");

      if (rsvpError) throw rsvpError;

      const rsvpYesCount = (rsvpRows ?? []).length;

      // show rate 계산
      const showRate = await calculateShowRate(groupId, supabase);

      const predictedAttendance = predictAttendance(rsvpYesCount, showRate);

      return {
        rsvpYesCount,
        predictedAttendance,
        showRate,
        hasData: rsvpYesCount > 0,
      };
    }
  );

  return {
    prediction: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
