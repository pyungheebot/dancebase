"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateSessionAutoFeedback } from "@/lib/swr/invalidate";
import type { SessionAutoFeedback } from "@/types";

const STORAGE_KEY = (groupId: string) =>
  `dancebase:session-feedback:${groupId}`;
const MAX_FEEDBACKS = 50;

function loadFromStorage(groupId: string): SessionAutoFeedback[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as SessionAutoFeedback[];
  } catch {
    return [];
  }
}

function saveToStorage(groupId: string, feedbacks: SessionAutoFeedback[]) {
  try {
    // 최대 50개 유지 (최신순)
    const trimmed = feedbacks
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, MAX_FEEDBACKS);
    localStorage.setItem(STORAGE_KEY(groupId), JSON.stringify(trimmed));
  } catch {
    // localStorage 쓰기 실패는 무시
  }
}

function buildAutoSummary(
  attendanceRate: number,
  presentCount: number,
  absentCount: number,
  lateCount: number
): string {
  const total = presentCount + absentCount + lateCount;
  const suffix =
    total > 0
      ? ` (총 ${total}명 중 출석 ${presentCount}명, 지각 ${lateCount}명, 결석 ${absentCount}명)`
      : "";

  if (attendanceRate >= 90) {
    return `출석률이 매우 좋습니다! 전원 참여에 가까운 세션이었습니다.${suffix}`;
  }
  if (attendanceRate >= 70) {
    return `양호한 출석률입니다. 일부 불참 멤버에게 확인이 필요합니다.${suffix}`;
  }
  if (attendanceRate >= 50) {
    return `출석률이 다소 낮습니다. 멤버들의 참여 독려가 필요합니다.${suffix}`;
  }
  return `출석률이 매우 낮습니다. 일정 시간 조정을 고려해주세요.${suffix}`;
}

export function useSessionAutoFeedback(groupId: string) {
  const { data, mutate } = useSWR(
    swrKeys.sessionAutoFeedback(groupId),
    () => loadFromStorage(groupId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const feedbacks = data ?? [];

  /**
   * 특정 일정의 출석 데이터를 조회해 자동 요약 피드백을 생성합니다.
   * 저장은 하지 않으며, 생성된 SessionAutoFeedback 객체를 반환합니다.
   */
  const generateFeedback = async (
    scheduleId: string
  ): Promise<SessionAutoFeedback> => {
    const supabase = createClient();

    // 일정 정보 조회
    const { data: schedule, error: schedErr } = await supabase
      .from("schedules")
      .select("id, title, starts_at")
      .eq("id", scheduleId)
      .single();

    if (schedErr || !schedule) {
      throw new Error("일정 정보를 불러오지 못했습니다.");
    }

    // 출석 데이터 조회
    const { data: attendanceRows, error: attErr } = await supabase
      .from("attendance")
      .select("status")
      .eq("schedule_id", scheduleId);

    if (attErr) {
      throw new Error("출석 데이터를 불러오지 못했습니다.");
    }

    const rows: { status: string }[] = (attendanceRows ?? []).map(
      (row: { status: string }) => ({ status: row.status })
    );
    const presentCount = rows.filter((r: { status: string }) => r.status === "present").length;
    const lateCount = rows.filter((r: { status: string }) => r.status === "late").length;
    const absentCount = rows.filter((r: { status: string }) => r.status === "absent").length;
    const total = presentCount + lateCount + absentCount;
    const attendanceRate =
      total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

    const autoSummary = buildAutoSummary(
      attendanceRate,
      presentCount,
      absentCount,
      lateCount
    );

    const feedback: SessionAutoFeedback = {
      id: crypto.randomUUID(),
      scheduleId,
      scheduleName: schedule.title,
      date: schedule.starts_at,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate,
      autoSummary,
      customNote: "",
      createdAt: new Date().toISOString(),
    };

    return feedback;
  };

  /**
   * 피드백을 localStorage에 저장합니다.
   * 같은 scheduleId가 이미 있으면 덮어씁니다.
   */
  const saveFeedback = (feedback: SessionAutoFeedback) => {
    const current = loadFromStorage(groupId);
    const filtered = current.filter((f) => f.scheduleId !== feedback.scheduleId);
    const updated = [feedback, ...filtered];
    saveToStorage(groupId, updated);
    invalidateSessionAutoFeedback(groupId);
    mutate(loadFromStorage(groupId));
  };

  /**
   * 특정 피드백을 id로 삭제합니다.
   */
  const deleteFeedback = (feedbackId: string) => {
    const current = loadFromStorage(groupId);
    const updated = current.filter((f) => f.id !== feedbackId);
    saveToStorage(groupId, updated);
    invalidateSessionAutoFeedback(groupId);
    mutate(loadFromStorage(groupId));
  };

  /**
   * 저장된 피드백 전체를 반환합니다. (최신순)
   */
  const getFeedbacks = (): SessionAutoFeedback[] => {
    return loadFromStorage(groupId).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  return {
    feedbacks,
    generateFeedback,
    saveFeedback,
    deleteFeedback,
    getFeedbacks,
    refetch: () => mutate(),
  };
}
