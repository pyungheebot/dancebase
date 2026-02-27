"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { SocialRelation, SocialRelationType } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) => `dancebase:social-graph:${groupId}`;

function loadRelations(groupId: string): SocialRelation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as SocialRelation[];
  } catch {
    return [];
  }
}

function saveRelations(groupId: string, relations: SocialRelation[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(groupId), JSON.stringify(relations));
  } catch {
    /* ignore */
  }
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useSocialGraph(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.socialGraph(groupId) : null,
    () => loadRelations(groupId),
    { revalidateOnFocus: false }
  );

  const relations: SocialRelation[] = data ?? [];

  // ── 내부 업데이트 헬퍼 ───────────────────────────────────

  function update(next: SocialRelation[]): void {
    saveRelations(groupId, next);
    mutate(next, false);
  }

  // ── 관계 추가 ────────────────────────────────────────────

  function addRelation(params: {
    member1: string;
    member2: string;
    relationType: SocialRelationType;
    strength: number;
    since: string;
    note: string;
  }): boolean {
    if (!params.member1.trim() || !params.member2.trim()) return false;
    if (params.member1 === params.member2) return false;

    const stored = loadRelations(groupId);
    const newRelation: SocialRelation = {
      id: crypto.randomUUID(),
      member1: params.member1.trim(),
      member2: params.member2.trim(),
      relationType: params.relationType,
      strength: Math.min(10, Math.max(1, params.strength)),
      since: params.since,
      note: params.note.trim(),
      createdAt: new Date().toISOString(),
    };
    update([newRelation, ...stored]);
    return true;
  }

  // ── 관계 삭제 ────────────────────────────────────────────

  function deleteRelation(relationId: string): boolean {
    const stored = loadRelations(groupId);
    const next = stored.filter((r) => r.id !== relationId);
    if (next.length === stored.length) return false;
    update(next);
    return true;
  }

  // ── 강도 업데이트 ────────────────────────────────────────

  function updateStrength(relationId: string, strength: number): boolean {
    const stored = loadRelations(groupId);
    const idx = stored.findIndex((r) => r.id === relationId);
    if (idx === -1) return false;
    const next = stored.map((r) =>
      r.id === relationId
        ? { ...r, strength: Math.min(10, Math.max(1, strength)) }
        : r
    );
    update(next);
    return true;
  }

  // ── 특정 멤버의 관계 목록 ────────────────────────────────

  function getRelationsForMember(name: string): SocialRelation[] {
    return relations.filter(
      (r) => r.member1 === name || r.member2 === name
    );
  }

  // ── 가장 많이 연결된 멤버 ────────────────────────────────

  function getMostConnected(): { name: string; count: number } | null {
    if (relations.length === 0) return null;
    const countMap: Record<string, number> = {};
    for (const r of relations) {
      countMap[r.member1] = (countMap[r.member1] ?? 0) + 1;
      countMap[r.member2] = (countMap[r.member2] ?? 0) + 1;
    }
    const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    return { name: sorted[0][0], count: sorted[0][1] };
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalRelations = relations.length;

  const uniqueMembers = Array.from(
    new Set(relations.flatMap((r) => [r.member1, r.member2]))
  ).length;

  const avgStrength =
    relations.length > 0
      ? Math.round(
          (relations.reduce((sum, r) => sum + r.strength, 0) / relations.length) * 10
        ) / 10
      : 0;

  return {
    relations,
    totalRelations,
    uniqueMembers,
    avgStrength,
    addRelation,
    deleteRelation,
    updateStrength,
    getRelationsForMember,
    getMostConnected,
    refetch: () => mutate(),
  };
}
