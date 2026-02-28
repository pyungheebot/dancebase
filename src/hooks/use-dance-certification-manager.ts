"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  DanceCertificationEntry,
  DanceCertificationData,
  DanceCertificationCategory,
  DanceCertificationStatus,
} from "@/types";

// ============================================
// 카테고리 라벨
// ============================================

export const CERT_CATEGORY_LABELS: Record<DanceCertificationCategory, string> = {
  genre:      "장르 자격",
  instructor: "지도자",
  judge:      "심판",
  safety:     "안전",
  other:      "기타",
};

// ============================================
// 상태 라벨
// ============================================

export const CERT_STATUS_LABELS: Record<DanceCertificationStatus, string> = {
  valid:   "유효",
  expired: "만료",
  renewal: "갱신 필요",
};

// ============================================
// 상태별 배지 색상 (Tailwind)
// ============================================

export const CERT_STATUS_COLORS: Record<
  DanceCertificationStatus,
  { badge: string; text: string }
> = {
  valid:   { badge: "bg-green-100 text-green-700 border-green-300",  text: "text-green-700" },
  expired: { badge: "bg-gray-100 text-gray-500 border-gray-300",     text: "text-gray-500" },
  renewal: { badge: "bg-yellow-100 text-yellow-700 border-yellow-300", text: "text-yellow-700" },
};

// ============================================
// 카테고리별 배지 색상 (Tailwind)
// ============================================

export const CERT_CATEGORY_COLORS: Record<DanceCertificationCategory, string> = {
  genre:      "bg-purple-100 text-purple-700 border-purple-300",
  instructor: "bg-blue-100 text-blue-700 border-blue-300",
  judge:      "bg-orange-100 text-orange-700 border-orange-300",
  safety:     "bg-red-100 text-red-700 border-red-300",
  other:      "bg-gray-100 text-gray-600 border-gray-300",
};

// ============================================
// 만료 임박 경계 (일수)
// ============================================

export const RENEWAL_WARNING_DAYS = 30;

// ============================================
// 상태 자동 판별
// ============================================

export function computeCertStatus(
  expiresAt?: string
): DanceCertificationStatus {
  if (!expiresAt) return "valid";
  const now = new Date();
  const expDate = new Date(expiresAt);
  if (expDate < now) return "expired";
  const diffMs = expDate.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= RENEWAL_WARNING_DAYS) return "renewal";
  return "valid";
}

// ============================================
// localStorage 헬퍼
// ============================================

function storageKey(memberId: string): string {
  return `dancebase:dance-cert-manager:${memberId}`;
}

function loadData(memberId: string): DanceCertificationData {
  if (typeof window === "undefined") {
    return { memberId, entries: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(memberId));
    if (!raw) {
      return { memberId, entries: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as DanceCertificationData;
  } catch {
    return { memberId, entries: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(memberId: string, data: DanceCertificationData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(memberId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================
// 훅
// ============================================

export function useDanceCertificationManager(memberId: string) {
  const { data, isLoading, mutate } = useSWR(
    memberId ? swrKeys.danceCertificationManager(memberId) : null,
    () => loadData(memberId),
    { revalidateOnFocus: false }
  );

  const entries: DanceCertificationEntry[] = data?.entries ?? [];

  // 인증서 추가
  async function addEntry(
    input: Omit<DanceCertificationEntry, "id" | "createdAt" | "status">
  ): Promise<void> {
    const current = loadData(memberId);
    const status = computeCertStatus(input.expiresAt);
    const newEntry: DanceCertificationEntry = {
      ...input,
      id: `cert-mgr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status,
      createdAt: new Date().toISOString(),
    };
    const updated: DanceCertificationData = {
      memberId,
      entries: [...current.entries, newEntry],
      updatedAt: new Date().toISOString(),
    };
    saveData(memberId, updated);
    await mutate(updated, false);
  }

  // 인증서 수정
  async function updateEntry(
    entryId: string,
    patch: Partial<Omit<DanceCertificationEntry, "id" | "createdAt">>
  ): Promise<void> {
    const current = loadData(memberId);
    const updatedEntries = current.entries.map((e) => {
      if (e.id !== entryId) return e;
      const merged = { ...e, ...patch };
      // expiresAt 변경 시 상태 재계산
      if (patch.expiresAt !== undefined || patch.status === undefined) {
        merged.status = patch.status ?? computeCertStatus(merged.expiresAt);
      }
      return merged;
    });
    const updated: DanceCertificationData = {
      memberId,
      entries: updatedEntries,
      updatedAt: new Date().toISOString(),
    };
    saveData(memberId, updated);
    await mutate(updated, false);
  }

  // 인증서 삭제
  async function deleteEntry(entryId: string): Promise<void> {
    const current = loadData(memberId);
    const updated: DanceCertificationData = {
      memberId,
      entries: current.entries.filter((e) => e.id !== entryId),
      updatedAt: new Date().toISOString(),
    };
    saveData(memberId, updated);
    await mutate(updated, false);
  }

  // 만료 임박 항목 (갱신 필요 포함)
  const expiringEntries = entries.filter(
    (e) => e.status === "renewal"
  );

  // 만료된 항목
  const expiredEntries = entries.filter(
    (e) => e.status === "expired"
  );

  // 유효한 항목
  const validEntries = entries.filter(
    (e) => e.status === "valid"
  );

  // 카테고리별 통계
  const categoryStats: Record<DanceCertificationCategory, number> = {
    genre:      0,
    instructor: 0,
    judge:      0,
    safety:     0,
    other:      0,
  };
  for (const e of entries) {
    categoryStats[e.category] = (categoryStats[e.category] ?? 0) + 1;
  }

  // 상태 일괄 동기화 (저장된 상태를 최신 날짜 기준으로 재계산)
  async function syncStatuses(): Promise<void> {
    const current = loadData(memberId);
    const synced = current.entries.map((e) => ({
      ...e,
      status: computeCertStatus(e.expiresAt),
    }));
    const updated: DanceCertificationData = {
      memberId,
      entries: synced,
      updatedAt: new Date().toISOString(),
    };
    saveData(memberId, updated);
    await mutate(updated, false);
  }

  return {
    entries,
    loading: isLoading,
    validEntries,
    expiringEntries,
    expiredEntries,
    categoryStats,
    addEntry,
    updateEntry,
    deleteEntry,
    syncStatuses,
    refetch: () => mutate(),
  };
}
