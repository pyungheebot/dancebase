"use client";

import { useState } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { createNotification } from "@/lib/notifications";
import { swrKeys } from "@/lib/swr/keys";

// 브로드캐스트 발송 대상 유형
export type BroadcastTargetType = "no_response" | "not_going" | "maybe" | "all";

// 멤버별 RSVP 상태
export type MemberRsvpStatus = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  response: "going" | "not_going" | "maybe" | null; // null = 미응답
};

// 브로드캐스트 발송 이력
export type BroadcastHistory = {
  sentAt: string;
  targetType: BroadcastTargetType;
  recipientCount: number;
};

const HISTORY_KEY_PREFIX = "broadcast-history-";

function getBroadcastHistoryKey(scheduleId: string) {
  return `${HISTORY_KEY_PREFIX}${scheduleId}`;
}

function loadBroadcastHistory(scheduleId: string): BroadcastHistory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getBroadcastHistoryKey(scheduleId));
    return raw ? (JSON.parse(raw) as BroadcastHistory[]) : [];
  } catch {
    return [];
  }
}

function saveBroadcastHistory(scheduleId: string, entry: BroadcastHistory) {
  if (typeof window === "undefined") return;
  const history = loadBroadcastHistory(scheduleId);
  history.unshift(entry);
  // 최근 10건만 보관
  const trimmed = history.slice(0, 10);
  localStorage.setItem(getBroadcastHistoryKey(scheduleId), JSON.stringify(trimmed));
}

export function useScheduleBroadcast(scheduleId: string, groupId: string) {
  const [sending, setSending] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    scheduleId && groupId
      ? swrKeys.scheduleBroadcast(scheduleId, groupId)
      : null,
    async () => {
      const supabase = createClient();

      // 그룹 멤버 전체 조회 (profiles 포함)
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("user_id, profiles(id, name, avatar_url)")
        .eq("group_id", groupId);

      if (membersError) throw membersError;

      // 일정 RSVP 조회
      const { data: rsvpRows, error: rsvpError } = await supabase
        .from("schedule_rsvp")
        .select("user_id, response")
        .eq("schedule_id", scheduleId);

      if (rsvpError) throw rsvpError;

      // RSVP 맵 구성
      const rsvpMap = new Map<string, "going" | "not_going" | "maybe">();
      (rsvpRows ?? []).forEach((r: { user_id: string; response: string }) => {
        rsvpMap.set(r.user_id, r.response as "going" | "not_going" | "maybe");
      });

      // 멤버별 RSVP 상태 통합
      type MemberRow = {
        user_id: string;
        profiles: { id: string; name: string; avatar_url: string | null } | null;
      };

      const memberStatuses: MemberRsvpStatus[] = (members as MemberRow[])
        .map((m) => ({
          userId: m.user_id,
          name: m.profiles?.name ?? "알 수 없음",
          avatarUrl: m.profiles?.avatar_url ?? null,
          response: rsvpMap.get(m.user_id) ?? null,
        }));

      return memberStatuses;
    }
  );

  const members = data ?? [];

  // 통계
  const going = members.filter((m) => m.response === "going").length;
  const notGoing = members.filter((m) => m.response === "not_going").length;
  const maybe = members.filter((m) => m.response === "maybe").length;
  const noResponse = members.filter((m) => m.response === null).length;

  // 대상별 필터
  function getTargetMembers(targetType: BroadcastTargetType): MemberRsvpStatus[] {
    switch (targetType) {
      case "no_response":
        return members.filter((m) => m.response === null);
      case "not_going":
        return members.filter((m) => m.response === "not_going");
      case "maybe":
        return members.filter((m) => m.response === "maybe");
      case "all":
        return members.filter((m) => m.response !== "going");
    }
  }

  // 발송 이력 로드
  function getHistory(): BroadcastHistory[] {
    return loadBroadcastHistory(scheduleId);
  }

  // 알림 발송
  async function broadcastReminder(
    targetType: BroadcastTargetType,
    scheduleTitle: string,
    scheduleDaysLeft: number
  ): Promise<{ success: boolean; count: number }> {
    setSending(true);
    try {
      const targets = getTargetMembers(targetType);
      if (targets.length === 0) {
        return { success: true, count: 0 };
      }

      const message = `${scheduleTitle} 일정이 ${scheduleDaysLeft}일 후입니다. RSVP를 확인해주세요.`;
      const title = "일정 참석 여부 확인 요청";

      // notifications 테이블에 insert 시도
      const supabase = createClient();
      const { error } = await supabase.from("notifications").insert(
        targets.map((m) => ({
          user_id: m.userId,
          type: "attendance",
          title,
          message,
          link: null,
          is_read: false,
        }))
      );

      if (error) {
        // notifications 테이블 없거나 실패 시 createNotification 함수로 개별 발송
        for (const m of targets) {
          await createNotification({
            userId: m.userId,
            type: "attendance",
            title,
            message,
          });
        }
      }

      // 발송 이력 저장
      saveBroadcastHistory(scheduleId, {
        sentAt: new Date().toISOString(),
        targetType,
        recipientCount: targets.length,
      });

      return { success: true, count: targets.length };
    } finally {
      setSending(false);
    }
  }

  return {
    members,
    loading: isLoading,
    sending,
    stats: { going, notGoing, maybe, noResponse },
    getTargetMembers,
    getHistory,
    broadcastReminder,
    refetch: () => mutate(),
  };
}
