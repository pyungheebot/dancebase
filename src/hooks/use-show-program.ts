"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  ShowProgramEntry,
  ShowProgramPiece,
  ShowProgramCredit,
  ShowProgramSponsor,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:show-program:${groupId}:${projectId}`;
}

function loadEntry(
  groupId: string,
  projectId: string
): ShowProgramEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    return raw ? (JSON.parse(raw) as ShowProgramEntry) : null;
  } catch {
    return null;
  }
}

function saveEntry(
  groupId: string,
  projectId: string,
  entry: ShowProgramEntry
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    getStorageKey(groupId, projectId),
    JSON.stringify(entry)
  );
}

function createEmptyEntry(
  groupId: string,
  projectId: string
): ShowProgramEntry {
  return {
    id: crypto.randomUUID(),
    groupId,
    projectId,
    showTitle: "",
    showSubtitle: undefined,
    showDate: undefined,
    venue: undefined,
    greeting: undefined,
    closingMessage: undefined,
    pieces: [],
    credits: [],
    sponsors: [],
    specialThanks: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// 훅
// ============================================================

export function useShowProgram(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.showProgram(groupId, projectId),
    async () => {
      const existing = loadEntry(groupId, projectId);
      if (existing) return existing;
      const fresh = createEmptyEntry(groupId, projectId);
      saveEntry(groupId, projectId, fresh);
      return fresh;
    }
  );

  const entry = data ?? createEmptyEntry(groupId, projectId);

  // 공통 저장 헬퍼
  function persist(updated: ShowProgramEntry): void {
    const withTimestamp: ShowProgramEntry = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    saveEntry(groupId, projectId, withTimestamp);
    mutate(withTimestamp, false);
  }

  // ── 기본 정보 수정 ──
  async function updateBasicInfo(
    fields: Partial<
      Pick<
        ShowProgramEntry,
        | "showTitle"
        | "showSubtitle"
        | "showDate"
        | "venue"
        | "greeting"
        | "closingMessage"
        | "specialThanks"
      >
    >
  ): Promise<void> {
    persist({ ...entry, ...fields });
  }

  // ── 프로그램 순서 항목 추가 ──
  async function addPiece(
    input: Omit<ShowProgramPiece, "id" | "order">
  ): Promise<ShowProgramPiece> {
    const newPiece: ShowProgramPiece = {
      ...input,
      id: crypto.randomUUID(),
      order: entry.pieces.length + 1,
    };
    persist({ ...entry, pieces: [...entry.pieces, newPiece] });
    return newPiece;
  }

  // ── 프로그램 순서 항목 수정 ──
  async function updatePiece(
    pieceId: string,
    fields: Partial<Omit<ShowProgramPiece, "id" | "order">>
  ): Promise<void> {
    const updated = entry.pieces.map((p) =>
      p.id === pieceId ? { ...p, ...fields } : p
    );
    persist({ ...entry, pieces: updated });
  }

  // ── 프로그램 순서 항목 삭제 ──
  async function deletePiece(pieceId: string): Promise<void> {
    const filtered = entry.pieces
      .filter((p) => p.id !== pieceId)
      .map((p, idx) => ({ ...p, order: idx + 1 }));
    persist({ ...entry, pieces: filtered });
  }

  // ── 프로그램 순서 위로 이동 ──
  async function movePieceUp(pieceId: string): Promise<void> {
    const sorted = [...entry.pieces].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((p) => p.id === pieceId);
    if (idx <= 0) return;
    [sorted[idx - 1], sorted[idx]] = [sorted[idx], sorted[idx - 1]];
    const reindexed = sorted.map((p, i) => ({ ...p, order: i + 1 }));
    persist({ ...entry, pieces: reindexed });
  }

  // ── 프로그램 순서 아래로 이동 ──
  async function movePieceDown(pieceId: string): Promise<void> {
    const sorted = [...entry.pieces].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((p) => p.id === pieceId);
    if (idx < 0 || idx >= sorted.length - 1) return;
    [sorted[idx], sorted[idx + 1]] = [sorted[idx + 1], sorted[idx]];
    const reindexed = sorted.map((p, i) => ({ ...p, order: i + 1 }));
    persist({ ...entry, pieces: reindexed });
  }

  // ── 크레딧 추가 ──
  async function addCredit(
    input: Omit<ShowProgramCredit, "id">
  ): Promise<ShowProgramCredit> {
    const newCredit: ShowProgramCredit = {
      ...input,
      id: crypto.randomUUID(),
    };
    persist({ ...entry, credits: [...entry.credits, newCredit] });
    return newCredit;
  }

  // ── 크레딧 수정 ──
  async function updateCredit(
    creditId: string,
    fields: Partial<Omit<ShowProgramCredit, "id">>
  ): Promise<void> {
    const updated = entry.credits.map((c) =>
      c.id === creditId ? { ...c, ...fields } : c
    );
    persist({ ...entry, credits: updated });
  }

  // ── 크레딧 삭제 ──
  async function deleteCredit(creditId: string): Promise<void> {
    const filtered = entry.credits.filter((c) => c.id !== creditId);
    persist({ ...entry, credits: filtered });
  }

  // ── 스폰서 추가 ──
  async function addSponsor(
    input: Omit<ShowProgramSponsor, "id">
  ): Promise<ShowProgramSponsor> {
    const newSponsor: ShowProgramSponsor = {
      ...input,
      id: crypto.randomUUID(),
    };
    persist({ ...entry, sponsors: [...entry.sponsors, newSponsor] });
    return newSponsor;
  }

  // ── 스폰서 수정 ──
  async function updateSponsor(
    sponsorId: string,
    fields: Partial<Omit<ShowProgramSponsor, "id">>
  ): Promise<void> {
    const updated = entry.sponsors.map((s) =>
      s.id === sponsorId ? { ...s, ...fields } : s
    );
    persist({ ...entry, sponsors: updated });
  }

  // ── 스폰서 삭제 ──
  async function deleteSponsor(sponsorId: string): Promise<void> {
    const filtered = entry.sponsors.filter((s) => s.id !== sponsorId);
    persist({ ...entry, sponsors: filtered });
  }

  // ── 통계 ──
  const stats = {
    pieceCount: entry.pieces.length,
    creditCount: entry.credits.length,
    sponsorCount: entry.sponsors.length,
    hasGreeting: Boolean(entry.greeting),
    hasSpecialThanks: Boolean(entry.specialThanks),
  };

  return {
    entry,
    loading: isLoading,
    stats,
    // 기본 정보
    updateBasicInfo,
    // 프로그램 순서
    addPiece,
    updatePiece,
    deletePiece,
    movePieceUp,
    movePieceDown,
    // 크레딧
    addCredit,
    updateCredit,
    deleteCredit,
    // 스폰서
    addSponsor,
    updateSponsor,
    deleteSponsor,
    // SWR 갱신
    refetch: () => mutate(),
  };
}
