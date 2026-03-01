"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { swrKeys } from "@/lib/swr/keys";
import type {
  ThankYouLetterEntry,
  ThankYouLetterSheet,
  ThankYouLetterSponsorType,
  ThankYouLetterStatus,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:thank-you-letter:${groupId}:${projectId}`;
}

function loadSheet(groupId: string, projectId: string): ThankYouLetterSheet {
  if (typeof window === "undefined") {
    return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    if (raw) return JSON.parse(raw) as ThankYouLetterSheet;
  } catch {
    // 파싱 실패 시 빈 시트 반환
  }
  return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
}

function saveSheet(sheet: ThankYouLetterSheet): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey(sheet.groupId, sheet.projectId),
      JSON.stringify(sheet)
    );
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ============================================================
// 입력 타입
// ============================================================

export type AddThankYouLetterInput = {
  sponsorName: string;
  sponsorType: ThankYouLetterSponsorType;
  sponsorDetail?: string;
  letterContent: string;
  managerName: string;
  sponsorContact?: string;
  sponsorEmail?: string;
  note?: string;
};

export type UpdateThankYouLetterInput = Partial<AddThankYouLetterInput>;

// ============================================================
// 훅
// ============================================================

export function useThankYouLetter(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId && projectId ? swrKeys.thankYouLetter(groupId, projectId) : null,
    async () => loadSheet(groupId, projectId)
  );

  const sheet = data ?? {
    groupId,
    projectId,
    entries: [],
    updatedAt: new Date().toISOString(),
  };

  // 생성일 내림차순 정렬
  const entries = [...sheet.entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // ── 편지 추가 ──
  const addEntry = useCallback(
    async (input: AddThankYouLetterInput): Promise<boolean> => {
      if (!input.sponsorName.trim()) {
        toast.error(TOAST.THANK_YOU.SPONSOR_REQUIRED);
        return false;
      }
      if (!input.letterContent.trim()) {
        toast.error(TOAST.THANK_YOU.CONTENT_REQUIRED);
        return false;
      }
      if (!input.managerName.trim()) {
        toast.error(TOAST.INFO.ASSIGNEE_REQUIRED);
        return false;
      }

      const current = loadSheet(groupId, projectId);
      const now = new Date().toISOString();

      const newEntry: ThankYouLetterEntry = {
        id: crypto.randomUUID(),
        sponsorName: input.sponsorName.trim(),
        sponsorType: input.sponsorType,
        sponsorDetail: input.sponsorDetail?.trim() || undefined,
        letterContent: input.letterContent.trim(),
        status: "draft",
        sentAt: undefined,
        managerName: input.managerName.trim(),
        sponsorContact: input.sponsorContact?.trim() || undefined,
        sponsorEmail: input.sponsorEmail?.trim() || undefined,
        note: input.note?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      const updated: ThankYouLetterSheet = {
        ...current,
        entries: [...current.entries, newEntry],
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.THANK_YOU.ADDED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 편지 수정 ──
  const updateEntry = useCallback(
    async (id: string, changes: UpdateThankYouLetterInput): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const target = current.entries.find((e) => e.id === id);
      if (!target) {
        toast.error(TOAST.NOT_FOUND);
        return false;
      }

      const now = new Date().toISOString();
      const updated: ThankYouLetterSheet = {
        ...current,
        entries: current.entries.map((e) =>
          e.id === id
            ? {
                ...e,
                sponsorName: changes.sponsorName?.trim() ?? e.sponsorName,
                sponsorType: changes.sponsorType ?? e.sponsorType,
                sponsorDetail:
                  changes.sponsorDetail !== undefined
                    ? changes.sponsorDetail?.trim() || undefined
                    : e.sponsorDetail,
                letterContent: changes.letterContent?.trim() ?? e.letterContent,
                managerName: changes.managerName?.trim() ?? e.managerName,
                sponsorContact:
                  changes.sponsorContact !== undefined
                    ? changes.sponsorContact?.trim() || undefined
                    : e.sponsorContact,
                sponsorEmail:
                  changes.sponsorEmail !== undefined
                    ? changes.sponsorEmail?.trim() || undefined
                    : e.sponsorEmail,
                note:
                  changes.note !== undefined
                    ? changes.note?.trim() || undefined
                    : e.note,
                updatedAt: now,
              }
            : e
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.THANK_YOU.UPDATED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 편지 삭제 ──
  const deleteEntry = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const now = new Date().toISOString();
      const updated: ThankYouLetterSheet = {
        ...current,
        entries: current.entries.filter((e) => e.id !== id),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.THANK_YOU.DELETED);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 발송 완료 처리 ──
  const markAsSent = useCallback(
    async (id: string, sentAt?: string): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const target = current.entries.find((e) => e.id === id);
      if (!target) {
        toast.error(TOAST.NOT_FOUND);
        return false;
      }

      const now = new Date().toISOString();
      const updated: ThankYouLetterSheet = {
        ...current,
        entries: current.entries.map((e) =>
          e.id === id
            ? {
                ...e,
                status: "sent" as ThankYouLetterStatus,
                sentAt: sentAt ?? now.split("T")[0],
                updatedAt: now,
              }
            : e
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.THANK_YOU.SENT);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 작성중으로 되돌리기 ──
  const markAsDraft = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadSheet(groupId, projectId);
      const target = current.entries.find((e) => e.id === id);
      if (!target) {
        toast.error(TOAST.NOT_FOUND);
        return false;
      }

      const now = new Date().toISOString();
      const updated: ThankYouLetterSheet = {
        ...current,
        entries: current.entries.map((e) =>
          e.id === id
            ? {
                ...e,
                status: "draft" as ThankYouLetterStatus,
                sentAt: undefined,
                updatedAt: now,
              }
            : e
        ),
        updatedAt: now,
      };
      saveSheet(updated);
      await mutate(updated, false);
      toast.success(TOAST.INFO.MADE_DRAFT);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 상태별 필터 ──
  const getByStatus = useCallback(
    (status: ThankYouLetterStatus): ThankYouLetterEntry[] => {
      return entries.filter((e) => e.status === status);
    },
    [entries]
  );

  // ── 후원 유형별 필터 ──
  const getBySponsorType = useCallback(
    (sponsorType: ThankYouLetterSponsorType): ThankYouLetterEntry[] => {
      return entries.filter((e) => e.sponsorType === sponsorType);
    },
    [entries]
  );

  // ── 통계 ──
  const stats = {
    total: entries.length,
    draft: entries.filter((e) => e.status === "draft").length,
    sent: entries.filter((e) => e.status === "sent").length,
    byType: {
      money: entries.filter((e) => e.sponsorType === "money").length,
      goods: entries.filter((e) => e.sponsorType === "goods").length,
      venue: entries.filter((e) => e.sponsorType === "venue").length,
      service: entries.filter((e) => e.sponsorType === "service").length,
    },
  };

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    deleteEntry,
    markAsSent,
    markAsDraft,
    getByStatus,
    getBySponsorType,
    stats,
  };
}
