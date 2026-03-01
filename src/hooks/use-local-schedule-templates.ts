"use client";

import { useState, useCallback } from "react";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type { ScheduleTemplateItem, ScheduleTemplateFormData } from "@/types";

const MAX_TEMPLATES = 20;

function getStorageKey(groupId: string): string {
  return `dancebase:schedule-templates:${groupId}`;
}

function loadTemplates(groupId: string): ScheduleTemplateItem[] {
  return loadFromStorage<ScheduleTemplateItem[]>(getStorageKey(groupId), []);
}

function saveTemplates(groupId: string, templates: ScheduleTemplateItem[]): void {
  saveToStorage(getStorageKey(groupId), templates);
}

export function useLocalScheduleTemplates(groupId: string) {
  const [templates, setTemplates] = useState<ScheduleTemplateItem[]>([]);

  // 마운트 시 localStorage에서 읽기


  /**
   * 새 템플릿 저장
   * 최대 20개 제한 - 초과 시 false 반환
   */
  const addTemplate = useCallback(
    (formData: ScheduleTemplateFormData, dayOfWeek?: number | null): boolean => {
      const current = loadTemplates(groupId);
      if (current.length >= MAX_TEMPLATES) return false;

      const newItem: ScheduleTemplateItem = {
        id: crypto.randomUUID(),
        groupId,
        title: formData.title,
        location: formData.location,
        dayOfWeek: dayOfWeek ?? null,
        startTime: formData.startTime,
        durationMinutes: formData.durationMinutes,
        attendanceMethod: formData.attendanceMethod,
        memo: formData.memo,
        createdAt: new Date().toISOString(),
      };

      const updated = [newItem, ...current];
      saveTemplates(groupId, updated);
      setTemplates(updated);
      return true;
    },
    [groupId]
  );

  /**
   * 기존 일정 데이터로 템플릿 저장
   */
  const saveFromSchedule = useCallback(
    (
      scheduleData: {
        title: string;
        location?: string | null;
        startAt: string; // ISO 날짜 문자열
        durationMinutes?: number;
        attendanceMethod?: string;
        memo?: string | null;
      }
    ): boolean => {
      const current = loadTemplates(groupId);
      if (current.length >= MAX_TEMPLATES) return false;

      const startDate = new Date(scheduleData.startAt);
      const hours = startDate.getHours().toString().padStart(2, "0");
      const minutes = startDate.getMinutes().toString().padStart(2, "0");

      const formData: ScheduleTemplateFormData = {
        title: scheduleData.title,
        location: scheduleData.location ?? "",
        startTime: `${hours}:${minutes}`,
        durationMinutes: scheduleData.durationMinutes ?? 60,
        attendanceMethod: scheduleData.attendanceMethod ?? "",
        memo: scheduleData.memo ?? "",
      };

      return addTemplate(formData, startDate.getDay());
    },
    [groupId, addTemplate]
  );

  /**
   * 템플릿 수정
   */
  const updateTemplate = useCallback(
    (id: string, updates: Partial<ScheduleTemplateFormData & { dayOfWeek: number | null }>): void => {
      const current = loadTemplates(groupId);
      const updated = current.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      saveTemplates(groupId, updated);
      setTemplates(updated);
    },
    [groupId]
  );

  /**
   * 템플릿 삭제
   */
  const deleteTemplate = useCallback(
    (id: string): void => {
      const current = loadTemplates(groupId);
      const updated = current.filter((t) => t.id !== id);
      saveTemplates(groupId, updated);
      setTemplates(updated);
    },
    [groupId]
  );

  /**
   * 템플릿에서 폼 데이터 추출 (날짜는 별도 선택)
   */
  const getFormDataFromTemplate = useCallback(
    (template: ScheduleTemplateItem): ScheduleTemplateFormData => ({
      title: template.title,
      location: template.location,
      startTime: template.startTime,
      durationMinutes: template.durationMinutes,
      attendanceMethod: template.attendanceMethod,
      memo: template.memo,
    }),
    []
  );

  return {
    templates,
    maxReached: templates.length >= MAX_TEMPLATES,
    addTemplate,
    saveFromSchedule,
    updateTemplate,
    deleteTemplate,
    getFormDataFromTemplate,
  };
}
