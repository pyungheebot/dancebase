"use client";

import { useState, useEffect, useCallback } from "react";
import type { MusicLicenseEntry, MusicLicenseStatus } from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:music-license:${groupId}`;
}

function loadData(groupId: string): MusicLicenseEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as MusicLicenseEntry[];
  } catch {
    return [];
  }
}

function saveData(groupId: string, data: MusicLicenseEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 날짜 기준 상태 계산 헬퍼
// ============================================================

function computeStatus(entry: MusicLicenseEntry): MusicLicenseStatus {
  if (!entry.expiryDate) return "active";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(entry.expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring_soon";
  return "active";
}

// ============================================================
// 통계 타입
// ============================================================

export type MusicLicenseStats = {
  totalLicenses: number;
  activeLicenses: number;
  expiringCount: number;
  expiredCount: number;
  pendingCount: number;
  totalCost: number;
};

// ============================================================
// 훅
// ============================================================

export function useMusicLicense(groupId: string) {
  const [licenses, setLicenses] = useState<MusicLicenseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadData(groupId);
    setLicenses(data);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback(
    (next: MusicLicenseEntry[]) => {
      saveData(groupId, next);
      setLicenses(next);
    },
    [groupId]
  );

  // 라이선스 추가
  const addLicense = useCallback(
    (input: Omit<MusicLicenseEntry, "id" | "status" | "createdAt">): MusicLicenseEntry => {
      const entry: MusicLicenseEntry = {
        ...input,
        id: crypto.randomUUID(),
        status: "active",
        createdAt: new Date().toISOString(),
      };
      // 날짜 기준으로 status 자동 계산
      entry.status = computeStatus(entry);
      persist([...licenses, entry]);
      return entry;
    },
    [licenses, persist]
  );

  // 라이선스 수정
  const updateLicense = useCallback(
    (id: string, updates: Partial<Omit<MusicLicenseEntry, "id" | "createdAt">>): boolean => {
      const next = licenses.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, ...updates };
        // expiryDate가 변경된 경우 status 재계산 (status를 명시적으로 넘기지 않은 경우)
        if (updates.expiryDate !== undefined && updates.status === undefined) {
          updated.status = computeStatus(updated);
        }
        return updated;
      });
      if (next.every((l, i) => l === licenses[i])) return false;
      persist(next);
      return true;
    },
    [licenses, persist]
  );

  // 라이선스 삭제
  const deleteLicense = useCallback(
    (id: string): boolean => {
      const next = licenses.filter((l) => l.id !== id);
      if (next.length === licenses.length) return false;
      persist(next);
      return true;
    },
    [licenses, persist]
  );

  // 만료 임박 목록 (daysAhead 일 이내)
  const getExpiringLicenses = useCallback(
    (daysAhead: number): MusicLicenseEntry[] => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return licenses.filter((l) => {
        if (!l.expiryDate) return false;
        const expiry = new Date(l.expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const diffMs = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= daysAhead;
      });
    },
    [licenses]
  );

  // 날짜 기준으로 모든 status 재계산
  const refreshStatuses = useCallback((): void => {
    const next = licenses.map((l) => ({
      ...l,
      status: computeStatus(l),
    }));
    persist(next);
  }, [licenses, persist]);

  // 통계
  const stats: MusicLicenseStats = (() => {
    const totalLicenses = licenses.length;
    const activeLicenses = licenses.filter((l) => l.status === "active").length;
    const expiringCount = licenses.filter((l) => l.status === "expiring_soon").length;
    const expiredCount = licenses.filter((l) => l.status === "expired").length;
    const pendingCount = licenses.filter((l) => l.status === "pending").length;
    const totalCost = licenses.reduce((sum, l) => sum + (l.cost ?? 0), 0);
    return {
      totalLicenses,
      activeLicenses,
      expiringCount,
      expiredCount,
      pendingCount,
      totalCost,
    };
  })();

  return {
    licenses,
    loading,
    addLicense,
    updateLicense,
    deleteLicense,
    getExpiringLicenses,
    refreshStatuses,
    stats,
    refetch: reload,
  };
}
