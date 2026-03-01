"use client";

import useSWR from "swr";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { swrKeys } from "@/lib/swr/keys";
import type {
  AnnouncementTemplateEntry,
  AnnouncementTemplateCategory,
  AnnouncementTemplateVariable,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string): string {
  return `dancebase:announcement-template:${groupId}`;
}

function loadEntries(groupId: string): AnnouncementTemplateEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    return raw ? (JSON.parse(raw) as AnnouncementTemplateEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(
  groupId: string,
  entries: AnnouncementTemplateEntry[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(entries));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ============================================================
// 변수 치환 유틸
// ============================================================

/**
 * 템플릿 문자열에서 {{변수}} 패턴을 찾아 지정된 값으로 치환합니다.
 * 값이 없으면 빈 문자열로 대체합니다.
 */
export function interpolateTemplate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    const trimmedKey = key.trim();
    return values[trimmedKey] ?? "";
  });
}

/**
 * 템플릿 문자열에서 {{변수}} 패턴의 키 목록을 추출합니다.
 */
export function extractVariableKeys(template: string): string[] {
  const matches = template.matchAll(/\{\{([^}]+)\}\}/g);
  const keys = new Set<string>();
  for (const match of matches) {
    keys.add(match[1].trim());
  }
  return Array.from(keys);
}

// ============================================================
// 입력 타입
// ============================================================

export type AddAnnouncementTemplateInput = {
  name: string;
  category: AnnouncementTemplateCategory;
  titleTemplate: string;
  bodyTemplate: string;
  variables?: AnnouncementTemplateVariable[];
};

export type UpdateAnnouncementTemplateInput =
  Partial<AddAnnouncementTemplateInput>;

// ============================================================
// 훅
// ============================================================

export function useAnnouncementTemplate(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.announcementTemplate(groupId) : null,
    async () => loadEntries(groupId)
  );

  const entries = useMemo(() => data ?? [], [data]);

  // ── 템플릿 추가 ──
  const addTemplate = useCallback(
    async (input: AddAnnouncementTemplateInput): Promise<boolean> => {
      if (!input.name.trim()) {
        toast.error(TOAST.TEMPLATE.NAME_REQUIRED);
        return false;
      }
      if (!input.titleTemplate.trim()) {
        toast.error(TOAST.TEMPLATE.TITLE_REQUIRED);
        return false;
      }
      if (!input.bodyTemplate.trim()) {
        toast.error(TOAST.TEMPLATE.BODY_REQUIRED);
        return false;
      }

      // 템플릿에서 자동으로 변수 목록 추출 (제목 + 본문 통합)
      const titleKeys = extractVariableKeys(input.titleTemplate);
      const bodyKeys = extractVariableKeys(input.bodyTemplate);
      const allKeys = Array.from(new Set([...titleKeys, ...bodyKeys]));

      // 사용자 제공 변수와 자동 추출 변수 병합
      const existingKeys = new Set(
        (input.variables ?? []).map((v) => v.key)
      );
      const autoVariables: AnnouncementTemplateVariable[] = allKeys
        .filter((k) => !existingKeys.has(k))
        .map((k) => ({ key: k, label: k, defaultValue: "" }));

      const variables: AnnouncementTemplateVariable[] = [
        ...(input.variables ?? []),
        ...autoVariables,
      ];

      const now = new Date().toISOString();
      const newEntry: AnnouncementTemplateEntry = {
        id: crypto.randomUUID(),
        groupId,
        name: input.name.trim(),
        category: input.category,
        titleTemplate: input.titleTemplate.trim(),
        bodyTemplate: input.bodyTemplate.trim(),
        variables,
        useCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      const updated = [...entries, newEntry];
      saveEntries(groupId, updated);
      await mutate(updated, false);
      toast.success(TOAST.TEMPLATE.ADDED);
      return true;
    },
    [groupId, entries, mutate]
  );

  // ── 템플릿 수정 ──
  const updateTemplate = useCallback(
    async (
      id: string,
      changes: UpdateAnnouncementTemplateInput
    ): Promise<boolean> => {
      const target = entries.find((e) => e.id === id);
      if (!target) {
        toast.error(TOAST.TEMPLATE.NOT_FOUND);
        return false;
      }

      const newTitleTemplate =
        changes.titleTemplate !== undefined
          ? changes.titleTemplate.trim()
          : target.titleTemplate;
      const newBodyTemplate =
        changes.bodyTemplate !== undefined
          ? changes.bodyTemplate.trim()
          : target.bodyTemplate;

      // 수정된 템플릿에서 변수 재추출
      const titleKeys = extractVariableKeys(newTitleTemplate);
      const bodyKeys = extractVariableKeys(newBodyTemplate);
      const allKeys = Array.from(new Set([...titleKeys, ...bodyKeys]));

      // 기존 변수 유지, 새 변수 추가
      const existingVarMap = new Map(
        (changes.variables ?? target.variables).map((v) => [v.key, v])
      );
      const mergedVariables: AnnouncementTemplateVariable[] = allKeys.map(
        (k) =>
          existingVarMap.get(k) ?? { key: k, label: k, defaultValue: "" }
      );

      const updated = entries.map((e) =>
        e.id === id
          ? {
              ...e,
              name:
                changes.name !== undefined
                  ? changes.name.trim()
                  : e.name,
              category:
                changes.category !== undefined
                  ? changes.category
                  : e.category,
              titleTemplate: newTitleTemplate,
              bodyTemplate: newBodyTemplate,
              variables: mergedVariables,
              updatedAt: new Date().toISOString(),
            }
          : e
      );

      saveEntries(groupId, updated);
      await mutate(updated, false);
      toast.success(TOAST.TEMPLATE.UPDATED);
      return true;
    },
    [groupId, entries, mutate]
  );

  // ── 템플릿 삭제 ──
  const deleteTemplate = useCallback(
    async (id: string): Promise<boolean> => {
      const filtered = entries.filter((e) => e.id !== id);
      saveEntries(groupId, filtered);
      await mutate(filtered, false);
      toast.success(TOAST.TEMPLATE.DELETED);
      return true;
    },
    [groupId, entries, mutate]
  );

  // ── 사용 횟수 증가 ──
  const incrementUseCount = useCallback(
    async (id: string): Promise<void> => {
      const updated = entries.map((e) =>
        e.id === id ? { ...e, useCount: e.useCount + 1 } : e
      );
      saveEntries(groupId, updated);
      await mutate(updated, false);
    },
    [groupId, entries, mutate]
  );

  // ── 변수 치환 미리보기 ──
  const previewTemplate = useCallback(
    (
      id: string,
      values: Record<string, string>
    ): { title: string; body: string } | null => {
      const target = entries.find((e) => e.id === id);
      if (!target) return null;
      return {
        title: interpolateTemplate(target.titleTemplate, values),
        body: interpolateTemplate(target.bodyTemplate, values),
      };
    },
    [entries]
  );

  // ── 카테고리 필터 ──
  const filterByCategory = useCallback(
    (
      category: AnnouncementTemplateCategory | "all"
    ): AnnouncementTemplateEntry[] => {
      if (category === "all") return entries;
      return entries.filter((e) => e.category === category);
    },
    [entries]
  );

  // ── 통계 ──
  const stats = {
    total: entries.length,
    totalUseCount: entries.reduce((sum, e) => sum + e.useCount, 0),
    byCategory: {
      practice: entries.filter((e) => e.category === "practice").length,
      performance: entries.filter((e) => e.category === "performance").length,
      meeting: entries.filter((e) => e.category === "meeting").length,
      gathering: entries.filter((e) => e.category === "gathering").length,
      etc: entries.filter((e) => e.category === "etc").length,
    },
    mostUsed:
      entries.length > 0
        ? entries.reduce((a, b) => (a.useCount >= b.useCount ? a : b))
        : null,
  };

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addTemplate,
    updateTemplate,
    deleteTemplate,
    incrementUseCount,
    previewTemplate,
    filterByCategory,
    stats,
  };
}
