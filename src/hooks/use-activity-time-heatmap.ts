"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import {
  type TimeSlot,
  type ActivityTimeCell,
  type ActivityTimeHeatmapResult,
  TIME_SLOTS,
} from "@/types";

// ────────────────────────────────────────────────────────────────────────────
// 내부 원시 데이터 타입
// ────────────────────────────────────────────────────────────────────────────

type RawScheduleRow = {
  id: string;
  starts_at: string;
};

type RawAttendanceRow = {
  schedule_id: string;
  status: string;
};

type RawPostRow = {
  created_at: string;
};

type RawCommentRow = {
  created_at: string;
};

// ────────────────────────────────────────────────────────────────────────────
// 시간대 판별 함수
// ────────────────────────────────────────────────────────────────────────────

function getTimeSlot(hour: number): TimeSlot {
  for (const slot of TIME_SLOTS) {
    if (slot.key === "night") {
      if (hour >= 22 || hour < 6) return "night";
    } else {
      if (hour >= slot.startHour && hour < slot.endHour) return slot.key;
    }
  }
  return "morning";
}

// ────────────────────────────────────────────────────────────────────────────
// 강도 레벨 계산 (전체 최댓값 대비 상대 비율)
// ────────────────────────────────────────────────────────────────────────────

function calcIntensity(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || maxCount === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

// ────────────────────────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────────────────────────

export function useActivityTimeHeatmap(groupId: string): ActivityTimeHeatmapResult {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.activityTimeHeatmap(groupId) : null,
    async () => {
      const supabase = createClient();

      // 3개월 전 기준일
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const since = threeMonthsAgo.toISOString();

      // 1) 최근 3개월 일정 조회 (출석 체크 대상)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", since);

      if (schedErr) throw schedErr;

      const schedules: RawScheduleRow[] = scheduleRows ?? [];

      // 2) 출석 기록 조회 (present / late만 활동으로 집계)
      let attendanceTimes: Array<{ dayOfWeek: number; timeSlot: TimeSlot }> = [];

      if (schedules.length > 0) {
        const scheduleIds = schedules.map((s) => s.id);

        const { data: attRows, error: attErr } = await supabase
          .from("attendance")
          .select("schedule_id, status")
          .in("schedule_id", scheduleIds)
          .in("status", ["present", "late"]);

        if (attErr) throw attErr;

        const attendances: RawAttendanceRow[] = attRows ?? [];

        // scheduleId -> {dayOfWeek, timeSlot} 맵
        const scheduleMetaMap = new Map<string, { dayOfWeek: number; timeSlot: TimeSlot }>();
        for (const s of schedules) {
          const date = new Date(s.starts_at);
          scheduleMetaMap.set(s.id, {
            dayOfWeek: date.getDay(),
            timeSlot: getTimeSlot(date.getHours()),
          });
        }

        attendanceTimes = attendances.flatMap((att) => {
          const meta = scheduleMetaMap.get(att.schedule_id);
          return meta ? [meta] : [];
        });
      }

      // 3) 게시글 created_at 조회
      const { data: postRows, error: postErr } = await supabase
        .from("board_posts")
        .select("created_at")
        .eq("group_id", groupId)
        .gte("created_at", since);

      if (postErr) throw postErr;

      const posts: RawPostRow[] = postRows ?? [];

      // 4) 댓글 created_at 조회 — 그룹 내 게시글 id 목록으로 필터
      const { data: postIdRows, error: postIdErr } = await supabase
        .from("board_posts")
        .select("id")
        .eq("group_id", groupId)
        .gte("created_at", since);

      if (postIdErr) throw postIdErr;

      const postIdList = (postIdRows ?? []).map((r: { id: string }) => r.id);

      let comments: RawCommentRow[] = [];
      if (postIdList.length > 0) {
        const { data: commentRows, error: commentErr } = await supabase
          .from("board_comments")
          .select("created_at")
          .in("post_id", postIdList)
          .gte("created_at", since);

        if (commentErr) throw commentErr;
        comments = commentRows ?? [];
      }

      // 5) 게시글 + 댓글 시간 집계
      const contentTimes: Array<{ dayOfWeek: number; timeSlot: TimeSlot }> = [
        ...posts,
        ...comments,
      ].map((row) => {
        const date = new Date(row.created_at);
        return {
          dayOfWeek: date.getDay(),
          timeSlot: getTimeSlot(date.getHours()),
        };
      });

      // 6) 전체 활동 집계: 요일 x 시간대 = 28칸
      const countMap = new Map<string, number>();

      for (const item of [...attendanceTimes, ...contentTimes]) {
        const key = `${item.dayOfWeek}-${item.timeSlot}`;
        countMap.set(key, (countMap.get(key) ?? 0) + 1);
      }

      const maxCount = Math.max(0, ...Array.from(countMap.values()));

      // 7) 28칸 셀 생성
      const cells: ActivityTimeCell[] = [];
      for (let dow = 0; dow < 7; dow++) {
        for (const slot of TIME_SLOTS) {
          const key = `${dow}-${slot.key}`;
          const count = countMap.get(key) ?? 0;
          cells.push({
            dayOfWeek: dow,
            timeSlot: slot.key,
            count,
            intensity: calcIntensity(count, maxCount),
          });
        }
      }

      // 8) 가장 활발 / 가장 조용한 시간대
      const activeCells = cells.filter((c) => c.count > 0);

      let busiestSlot: { dayOfWeek: number; timeSlot: TimeSlot } | null = null;
      let quietestSlot: { dayOfWeek: number; timeSlot: TimeSlot } | null = null;

      if (activeCells.length > 0) {
        const busiest = activeCells.reduce((a, b) => (b.count > a.count ? b : a));
        busiestSlot = { dayOfWeek: busiest.dayOfWeek, timeSlot: busiest.timeSlot };

        const quietest = activeCells.reduce((a, b) => (b.count < a.count ? b : a));
        quietestSlot = { dayOfWeek: quietest.dayOfWeek, timeSlot: quietest.timeSlot };
      }

      return {
        cells,
        busiestSlot,
        quietestSlot,
        hasData: activeCells.length > 0,
      };
    }
  );

  return {
    cells: data?.cells ?? [],
    busiestSlot: data?.busiestSlot ?? null,
    quietestSlot: data?.quietestSlot ?? null,
    hasData: data?.hasData ?? false,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
