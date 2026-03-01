"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  MediaPressKitEntry,
  MediaPressKitOutlet,
  MediaPressKitSheet,
  MediaPressKitStatus,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:media-press-kit:${groupId}:${projectId}`;
}

function loadSheet(groupId: string, projectId: string): MediaPressKitSheet {
  return loadFromStorage<MediaPressKitSheet>(
    getStorageKey(groupId, projectId),
    { groupId, projectId, entries: [], updatedAt: new Date().toISOString() }
  );
}

function saveSheet(sheet: MediaPressKitSheet): void {
  saveToStorage(getStorageKey(sheet.groupId, sheet.projectId), sheet);
}

// ============================================================
// 입력 타입
// ============================================================

export type AddMediaPressKitInput = {
  title: string;
  writtenAt: string;
  content: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  attachmentUrls?: string[];
};

export type UpdateMediaPressKitInput = Partial<AddMediaPressKitInput>;

export type AddOutletInput = Omit<MediaPressKitOutlet, "id">;

export type UpdateOutletInput = Partial<Omit<MediaPressKitOutlet, "id">>;

// ============================================================
// 훅
// ============================================================

export function useMediaPressKit(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId && projectId ? swrKeys.mediaPressKit(groupId, projectId) : null,
    async () => loadSheet(groupId, projectId)
  );

  const sheet = data ?? {
    groupId,
    projectId,
    entries: [],
    updatedAt: new Date().toISOString(),
  };

  // 작성일 내림차순 정렬
  const entries = [...sheet.entries].sort(
    (a, b) => new Date(b.writtenAt).getTime() - new Date(a.writtenAt).getTime()
  );

  // ── 보도자료 추가 ──
  const addEntry = useCallback(
    async (input: AddMediaPressKitInput): Promise<boolean> => {
      if (!input.title.trim()) {
        toast.error(TOAST.PRESS.TITLE_REQUIRED);
        return false;
      }
      if (!input.writtenAt) {
        toast.error(TOAST.INFO.DATE_WRITTEN_REQUIRED);
        return false;
      }
      if (!input.content.trim()) {
        toast.error(TOAST.CONTENT_REQUIRED);
        return false;
      }
      if (!input.contactName.trim()) {
        toast.error(TOAST.INFO.AMBASSADOR_REQUIRED);
        return false;
      }

      const current = loadSheet(groupId, projectId);
      const now = new Date().toISOString();

      const newEntry: MediaPressKitEntry = {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        writtenAt: input.writtenAt,
        content: input.content.trim(),
        contactName: input.contactName.trim(),
        contactEmail: input.contactEmail?.trim() || undefined,
        contactPhone: input.contactPhone?.trim() || undefined,
        attachmentUrls: input.attachmentUrls ?? [],
        outlets: [],
        status: "draft",
        createdAt: now,
        updatedAt: now,
      };

      const updated: MediaPressKitSheet = {
        ...current,
        entries: [...current.entries, newEntry],
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.PRESS.ADDED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 보도자료 수정 ──
  const updateEntry = useCallback(
    async (id: string, changes: UpdateMediaPressKitInput): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const target = current.entries.find((e) => e.id === id);
      if (!target) {
        toast.error(TOAST.NOT_FOUND);
        return false;
      }

      const now = new Date().toISOString();
      const updated: MediaPressKitSheet = {
        ...current,
        entries: current.entries.map((e) =>
          e.id === id
            ? {
                ...e,
                title: changes.title?.trim() ?? e.title,
                writtenAt: changes.writtenAt ?? e.writtenAt,
                content: changes.content?.trim() ?? e.content,
                contactName: changes.contactName?.trim() ?? e.contactName,
                contactEmail:
                  changes.contactEmail !== undefined
                    ? changes.contactEmail?.trim() || undefined
                    : e.contactEmail,
                contactPhone:
                  changes.contactPhone !== undefined
                    ? changes.contactPhone?.trim() || undefined
                    : e.contactPhone,
                attachmentUrls: changes.attachmentUrls ?? e.attachmentUrls,
                updatedAt: now,
              }
            : e
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.PRESS.UPDATED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 보도자료 삭제 ──
  const deleteEntry = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const now = new Date().toISOString();
      const updated: MediaPressKitSheet = {
        ...current,
        entries: current.entries.filter((e) => e.id !== id),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.PRESS.DELETED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 배포 상태 변경 ──
  const changeStatus = useCallback(
    async (id: string, status: MediaPressKitStatus): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const target = current.entries.find((e) => e.id === id);
      if (!target) {
        toast.error(TOAST.NOT_FOUND);
        return false;
      }

      const now = new Date().toISOString();
      const updated: MediaPressKitSheet = {
        ...current,
        entries: current.entries.map((e) =>
          e.id === id ? { ...e, status, updatedAt: now } : e
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);

      const STATUS_LABELS: Record<MediaPressKitStatus, string> = {
        draft: "작성중",
        review: "검토중",
        published: "배포완료",
      };
      toast.success(`상태가 "${STATUS_LABELS[status]}"(으)로 변경되었습니다`);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 매체 추가 ──
  const addOutlet = useCallback(
    async (entryId: string, input: AddOutletInput): Promise<boolean> => {
      if (!input.name.trim()) {
        toast.error(TOAST.PRESS.MEDIA_REQUIRED);
        return false;
      }

      const current = loadSheet(groupId, projectId);
      const target = current.entries.find((e) => e.id === entryId);
      if (!target) {
        toast.error(TOAST.PRESS.NOT_FOUND);
        return false;
      }

      const now = new Date().toISOString();
      const newOutlet: MediaPressKitOutlet = {
        ...input,
        id: crypto.randomUUID(),
        name: input.name.trim(),
        contactName: input.contactName?.trim() || undefined,
        contactEmail: input.contactEmail?.trim() || undefined,
        note: input.note?.trim() || undefined,
      };

      const updated: MediaPressKitSheet = {
        ...current,
        entries: current.entries.map((e) =>
          e.id === entryId
            ? { ...e, outlets: [...e.outlets, newOutlet], updatedAt: now }
            : e
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.PRESS.MEDIA_ADDED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 매체 게재 여부 토글 ──
  const toggleOutletPublished = useCallback(
    async (entryId: string, outletId: string): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const entry = current.entries.find((e) => e.id === entryId);
      if (!entry) return false;

      const outlet = entry.outlets.find((o) => o.id === outletId);
      if (!outlet) return false;

      const now = new Date().toISOString();
      const nextPublished = !outlet.published;

      const updated: MediaPressKitSheet = {
        ...current,
        entries: current.entries.map((e) =>
          e.id === entryId
            ? {
                ...e,
                outlets: e.outlets.map((o) =>
                  o.id === outletId
                    ? {
                        ...o,
                        published: nextPublished,
                        publishedAt: nextPublished ? now : undefined,
                      }
                    : o
                ),
                updatedAt: now,
              }
            : e
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(nextPublished ? "게재 완료로 표시했습니다" : "게재 취소했습니다");
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 매체 삭제 ──
  const deleteOutlet = useCallback(
    async (entryId: string, outletId: string): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const now = new Date().toISOString();

      const updated: MediaPressKitSheet = {
        ...current,
        entries: current.entries.map((e) =>
          e.id === entryId
            ? {
                ...e,
                outlets: e.outlets.filter((o) => o.id !== outletId),
                updatedAt: now,
              }
            : e
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.PRESS.MEDIA_DELETED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 통계 ──
  const stats = {
    total: entries.length,
    draft: entries.filter((e) => e.status === "draft").length,
    review: entries.filter((e) => e.status === "review").length,
    published: entries.filter((e) => e.status === "published").length,
    totalOutlets: entries.reduce((sum, e) => sum + e.outlets.length, 0),
    publishedOutlets: entries.reduce(
      (sum, e) => sum + e.outlets.filter((o) => o.published).length,
      0
    ),
  };

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    deleteEntry,
    changeStatus,
    addOutlet,
    toggleOutletPublished,
    deleteOutlet,
    stats,
  };
}
