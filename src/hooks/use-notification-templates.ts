"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { NotificationTemplate, Schedule, SendNotificationResult } from "@/types";

// ============================================
// 기본 템플릿 정의
// ============================================

const DEFAULT_TEMPLATES: Omit<NotificationTemplate, "id" | "groupId" | "createdAt" | "updatedAt">[] =
  [
    {
      title: "내일 일정 안내",
      body: "내일 {scheduleTitle} 일정이 있습니다. {location}에서 {time}에 만나요!",
    },
    {
      title: "1시간 전 리마인더",
      body: "{scheduleTitle} 시작 1시간 전입니다. 준비해주세요!",
    },
    {
      title: "연습 수고 & 다음 일정 안내",
      body: "오늘 {scheduleTitle} 연습 수고했습니다. 다음 일정은 {nextSchedule}입니다.",
    },
  ];

// ============================================
// localStorage 유틸
// ============================================

function getStorageKey(groupId: string): string {
  return `dancebase:notification-templates:${groupId}`;
}

function loadTemplates(groupId: string): NotificationTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (raw) return JSON.parse(raw) as NotificationTemplate[];
    // 최초 접근 시 기본 템플릿 생성
    const now = new Date().toISOString();
    const defaults: NotificationTemplate[] = DEFAULT_TEMPLATES.map((t, idx) => ({
      id: `default-${idx + 1}`,
      groupId,
      title: t.title,
      body: t.body,
      createdAt: now,
      updatedAt: now,
    }));
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(defaults));
    return defaults;
  } catch {
    return [];
  }
}

function saveTemplates(groupId: string, templates: NotificationTemplate[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(templates));
  } catch {
    // 무시
  }
}

// ============================================
// 변수 치환 유틸
// ============================================

export function replaceVariables(
  templateBody: string,
  schedule: Schedule
): string {
  const time = format(new Date(schedule.starts_at), "HH:mm", { locale: ko });
  const location = schedule.location ?? "미정";

  return templateBody
    .replace(/\{scheduleTitle\}/g, schedule.title)
    .replace(/\{location\}/g, location)
    .replace(/\{time\}/g, time)
    .replace(/\{nextSchedule\}/g, "추후 공지");
}

// ============================================
// 훅
// ============================================

export function useNotificationTemplates(groupId: string) {
  const [sending, setSending] = useState(false);

  // SWR로 그룹 멤버 목록 패치 (알림 발송용)
  const { data: memberData, isLoading: membersLoading } = useSWR(
    groupId ? swrKeys.groupMembersForNotification(groupId) : null,
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("group_members")
        .select("user_id, profiles(id, name, avatar_url)")
        .eq("group_id", groupId);

      if (error) throw error;

      type MemberRow = {
        user_id: string;
        profiles: { id: string; name: string; avatar_url: string | null } | null;
      };

      return (data as MemberRow[]).map((m) => ({
        userId: m.user_id,
        name: m.profiles?.name ?? "알 수 없음",
        avatarUrl: m.profiles?.avatar_url ?? null,
      }));
    }
  );

  const members = memberData ?? [];

  // ---- 템플릿 로드 (SWR 없이 로컬 상태로 관리) ----
  // useCallback으로 안정적인 참조 제공
  const getTemplates = useCallback((): NotificationTemplate[] => {
    return loadTemplates(groupId);
  }, [groupId]);

  // 추가
  const addTemplate = useCallback(
    (title: string, body: string): NotificationTemplate => {
      const templates = loadTemplates(groupId);
      const now = new Date().toISOString();
      const newTemplate: NotificationTemplate = {
        id: `tpl-${Date.now()}`,
        groupId,
        title,
        body,
        createdAt: now,
        updatedAt: now,
      };
      saveTemplates(groupId, [...templates, newTemplate]);
      return newTemplate;
    },
    [groupId]
  );

  // 수정
  const updateTemplate = useCallback(
    (id: string, updates: { title?: string; body?: string }): boolean => {
      const templates = loadTemplates(groupId);
      const idx = templates.findIndex((t) => t.id === id);
      if (idx === -1) return false;
      templates[idx] = {
        ...templates[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveTemplates(groupId, templates);
      return true;
    },
    [groupId]
  );

  // 삭제
  const deleteTemplate = useCallback(
    (id: string): boolean => {
      const templates = loadTemplates(groupId);
      const filtered = templates.filter((t) => t.id !== id);
      if (filtered.length === templates.length) return false;
      saveTemplates(groupId, filtered);
      return true;
    },
    [groupId]
  );

  // 알림 발송
  const sendNotification = useCallback(
    async (
      templateId: string,
      schedule: Schedule,
      memberIds: string[]
    ): Promise<SendNotificationResult> => {
      setSending(true);
      try {
        const templates = loadTemplates(groupId);
        const template = templates.find((t) => t.id === templateId);
        if (!template) {
          return { success: false, count: 0, error: "템플릿을 찾을 수 없습니다" };
        }
        if (memberIds.length === 0) {
          return { success: false, count: 0, error: "발송 대상 멤버가 없습니다" };
        }

        const message = replaceVariables(template.body, schedule);
        const title = template.title;

        const supabase = createClient();
        const { error } = await supabase.from("notifications").insert(
          memberIds.map((userId) => ({
            user_id: userId,
            type: "attendance",
            title,
            message,
            link: null,
            is_read: false,
          }))
        );

        if (error) {
          return { success: false, count: 0, error: error.message };
        }

        return { success: true, count: memberIds.length };
      } finally {
        setSending(false);
      }
    },
    [groupId]
  );

  return {
    members,
    membersLoading,
    sending,
    getTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    sendNotification,
    replaceVariables,
  };
}
