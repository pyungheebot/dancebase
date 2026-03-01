"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
import type { ContributionRecord, ContributionSummary, ContributionType } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const STORAGE_KEY = (groupId: string) =>
  `dancebase:contributions:${groupId}`;

// ─── 기본 typeBreakdown 생성 헬퍼 ───────────────────────────

function emptyTypeBreakdown(): Record<ContributionType, number> {
  return {
    teaching: 0,
    organizing: 0,
    choreography: 0,
    music: 0,
    logistics: 0,
    mentoring: 0,
    other: 0,
  };
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useContributionBoard(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.contributionBoard(groupId) : null,
    () => loadFromStorage<ContributionRecord[]>(STORAGE_KEY(groupId), []),
    { revalidateOnFocus: false }
  );

  const records = data ?? [];

  // ── 기여 기록 추가 ──────────────────────────────────────

  function addRecord(input: {
    memberName: string;
    type: ContributionType;
    description: string;
    points: number;
    date: string;
    awardedBy: string;
  }): boolean {
    if (!input.memberName.trim()) {
      toast.error("멤버 이름을 입력해주세요.");
      return false;
    }
    if (!input.awardedBy.trim()) {
      toast.error("부여자 이름을 입력해주세요.");
      return false;
    }
    if (!input.description.trim()) {
      toast.error("활동 내용을 입력해주세요.");
      return false;
    }
    if (input.points < 1 || input.points > 10) {
      toast.error("포인트는 1~10 사이여야 합니다.");
      return false;
    }
    if (!input.date) {
      toast.error("날짜를 선택해주세요.");
      return false;
    }
    try {
      const stored = loadFromStorage<ContributionRecord[]>(STORAGE_KEY(groupId), []);
      const newRecord: ContributionRecord = {
        id: crypto.randomUUID(),
        memberName: input.memberName.trim(),
        type: input.type,
        description: input.description.trim(),
        points: input.points,
        date: input.date,
        awardedBy: input.awardedBy.trim(),
        createdAt: new Date().toISOString(),
      };
      const next = [newRecord, ...stored];
      saveToStorage(STORAGE_KEY(groupId), next);
      mutate(next, false);
      toast.success(`${input.memberName}님의 기여가 기록되었습니다.`);
      return true;
    } catch {
      toast.error("기여 기록 추가에 실패했습니다.");
      return false;
    }
  }

  // ── 기여 기록 삭제 ──────────────────────────────────────

  function deleteRecord(id: string): boolean {
    try {
      const stored = loadFromStorage<ContributionRecord[]>(STORAGE_KEY(groupId), []);
      const next = stored.filter((r) => r.id !== id);
      if (next.length === stored.length) return false;
      saveToStorage(STORAGE_KEY(groupId), next);
      mutate(next, false);
      toast.success("기여 기록이 삭제되었습니다.");
      return true;
    } catch {
      toast.error("기여 기록 삭제에 실패했습니다.");
      return false;
    }
  }

  // ── 멤버별 요약 ─────────────────────────────────────────

  function getSummaryForMember(memberName: string): ContributionSummary | null {
    const memberRecords = records.filter((r) => r.memberName === memberName);
    if (memberRecords.length === 0) return null;

    const typeBreakdown = emptyTypeBreakdown();
    let totalPoints = 0;

    for (const r of memberRecords) {
      totalPoints += r.points;
      typeBreakdown[r.type] = (typeBreakdown[r.type] ?? 0) + r.points;
    }

    return {
      memberName,
      totalPoints,
      typeBreakdown,
      recordCount: memberRecords.length,
    };
  }

  // ── 전체 요약(totalPoints 높은 순) ─────────────────────

  function getAllSummaries(): ContributionSummary[] {
    const map = new Map<string, ContributionSummary>();

    for (const r of records) {
      const existing = map.get(r.memberName);
      if (existing) {
        existing.totalPoints += r.points;
        existing.typeBreakdown[r.type] =
          (existing.typeBreakdown[r.type] ?? 0) + r.points;
        existing.recordCount += 1;
      } else {
        const breakdown = emptyTypeBreakdown();
        breakdown[r.type] = r.points;
        map.set(r.memberName, {
          memberName: r.memberName,
          totalPoints: r.points,
          typeBreakdown: breakdown,
          recordCount: 1,
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.totalPoints - a.totalPoints
    );
  }

  // ── 유형 필터 ───────────────────────────────────────────

  function filterByType(type: ContributionType): ContributionRecord[] {
    return records.filter((r) => r.type === type);
  }

  // ── 통계 ────────────────────────────────────────────────

  const totalRecords = records.length;
  const totalPoints = records.reduce((sum, r) => sum + r.points, 0);
  const summaries = getAllSummaries();
  const topContributor = summaries.length > 0 ? summaries[0].memberName : null;

  return {
    records,
    // CRUD
    addRecord,
    deleteRecord,
    // 조회
    getSummaryForMember,
    getAllSummaries,
    filterByType,
    // 통계
    totalRecords,
    totalPoints,
    topContributor,
    // SWR
    refetch: () => mutate(),
  };
}
