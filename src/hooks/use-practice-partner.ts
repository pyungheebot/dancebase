"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  PracticePartnerEntry,
  PracticePartnerMember,
  PracticePartnerMatch,
  PracticePartnerSkillLevel,
} from "@/types";

// ============================================
// 상수
// ============================================

const STORAGE_KEY_PREFIX = "practice-partner-";

export const SKILL_LEVEL_LABELS: Record<PracticePartnerSkillLevel, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
  expert: "전문가",
};

export const SKILL_LEVEL_COLORS: Record<PracticePartnerSkillLevel, string> = {
  beginner: "bg-green-100 text-green-700 border-green-200",
  intermediate: "bg-blue-100 text-blue-700 border-blue-200",
  advanced: "bg-purple-100 text-purple-700 border-purple-200",
  expert: "bg-rose-100 text-rose-700 border-rose-200",
};

// ============================================
// localStorage 헬퍼
// ============================================

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function loadData(groupId: string): PracticePartnerEntry {
  if (typeof window === "undefined") {
    return makeEmpty(groupId);
  }
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return makeEmpty(groupId);
    return JSON.parse(raw) as PracticePartnerEntry;
  } catch {
    return makeEmpty(groupId);
  }
}

function saveData(entry: PracticePartnerEntry): void {
  localStorage.setItem(getStorageKey(entry.groupId), JSON.stringify(entry));
}

function makeEmpty(groupId: string): PracticePartnerEntry {
  return {
    id: crypto.randomUUID(),
    groupId,
    members: [],
    matches: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================
// 훅
// ============================================

export function usePracticePartner(groupId: string) {
  const [entry, setEntry] = useState<PracticePartnerEntry>(() =>
    makeEmpty(groupId)
  );

  // 초기 로드
  useEffect(() => {
    setEntry(loadData(groupId));
  }, [groupId]);

  // 상태 업데이트 + localStorage 동기화
  const updateEntry = useCallback(
    (updater: (prev: PracticePartnerEntry) => PracticePartnerEntry) => {
      setEntry((prev) => {
        const next = updater({ ...prev, updatedAt: new Date().toISOString() });
        saveData(next);
        return next;
      });
    },
    []
  );

  // ============================================
  // 멤버 관리
  // ============================================

  /** 멤버 등록 */
  const addMember = useCallback(
    (
      name: string,
      skillLevel: PracticePartnerSkillLevel,
      availableTimes: string[],
      preferredPartnerIds: string[] = []
    ) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const newMember: PracticePartnerMember = {
        id: crypto.randomUUID(),
        name: trimmed,
        skillLevel,
        availableTimes,
        preferredPartnerIds,
        joinedAt: new Date().toISOString(),
      };
      updateEntry((prev) => ({
        ...prev,
        members: [...prev.members, newMember],
      }));
    },
    [updateEntry]
  );

  /** 멤버 삭제 */
  const removeMember = useCallback(
    (memberId: string) => {
      updateEntry((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId),
        // 해당 멤버가 포함된 활성 매칭 종료
        matches: prev.matches.map((match) => {
          if (
            match.status === "active" &&
            (match.memberAId === memberId || match.memberBId === memberId)
          ) {
            return { ...match, status: "ended" as const, endedAt: new Date().toISOString() };
          }
          return match;
        }),
      }));
    },
    [updateEntry]
  );

  /** 멤버 정보 수정 */
  const updateMember = useCallback(
    (
      memberId: string,
      patch: Partial<
        Pick<
          PracticePartnerMember,
          "name" | "skillLevel" | "availableTimes" | "preferredPartnerIds"
        >
      >
    ) => {
      updateEntry((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === memberId ? { ...m, ...patch } : m
        ),
      }));
    },
    [updateEntry]
  );

  // ============================================
  // 매칭 관리
  // ============================================

  /** 수동 매칭 생성 */
  const createMatch = useCallback(
    (memberAId: string, memberBId: string) => {
      updateEntry((prev) => {
        const memberA = prev.members.find((m) => m.id === memberAId);
        const memberB = prev.members.find((m) => m.id === memberBId);
        if (!memberA || !memberB) return prev;

        // 이미 매칭된 경우 스킵
        if (memberA.currentMatchId || memberB.currentMatchId) return prev;

        const newMatch: PracticePartnerMatch = {
          id: crypto.randomUUID(),
          memberAId,
          memberAName: memberA.name,
          memberBId,
          memberBName: memberB.name,
          status: "active",
          matchedAt: new Date().toISOString(),
        };

        return {
          ...prev,
          matches: [...prev.matches, newMatch],
          members: prev.members.map((m) => {
            if (m.id === memberAId || m.id === memberBId) {
              return { ...m, currentMatchId: newMatch.id };
            }
            return m;
          }),
        };
      });
    },
    [updateEntry]
  );

  /** 매칭 해제 */
  const endMatch = useCallback(
    (matchId: string) => {
      updateEntry((prev) => {
        const match = prev.matches.find((m) => m.id === matchId);
        if (!match || match.status === "ended") return prev;

        return {
          ...prev,
          matches: prev.matches.map((m) =>
            m.id === matchId
              ? { ...m, status: "ended" as const, endedAt: new Date().toISOString() }
              : m
          ),
          members: prev.members.map((m) => {
            if (m.id === match.memberAId || m.id === match.memberBId) {
              const { currentMatchId: _removed, ...rest } = m;
              void _removed;
              return rest;
            }
            return m;
          }),
        };
      });
    },
    [updateEntry]
  );

  /** 랜덤 매칭 (매칭 안 된 멤버끼리 무작위 페어링) */
  const randomMatch = useCallback(() => {
    updateEntry((prev) => {
      // 현재 매칭되지 않은 멤버 목록
      const unmatched = prev.members.filter((m) => !m.currentMatchId);
      if (unmatched.length < 2) return prev;

      // 셔플
      const shuffled = [...unmatched].sort(() => Math.random() - 0.5);

      const newMatches: PracticePartnerMatch[] = [];
      const updatedMemberMap: Record<string, string> = {}; // memberId -> matchId

      for (let i = 0; i + 1 < shuffled.length; i += 2) {
        const a = shuffled[i];
        const b = shuffled[i + 1];
        const match: PracticePartnerMatch = {
          id: crypto.randomUUID(),
          memberAId: a.id,
          memberAName: a.name,
          memberBId: b.id,
          memberBName: b.name,
          status: "active",
          matchedAt: new Date().toISOString(),
        };
        newMatches.push(match);
        updatedMemberMap[a.id] = match.id;
        updatedMemberMap[b.id] = match.id;
      }

      return {
        ...prev,
        matches: [...prev.matches, ...newMatches],
        members: prev.members.map((m) =>
          updatedMemberMap[m.id]
            ? { ...m, currentMatchId: updatedMemberMap[m.id] }
            : m
        ),
      };
    });
  }, [updateEntry]);

  // ============================================
  // 파트너 평가
  // ============================================

  /** 파트너 평가 등록 */
  const ratePartner = useCallback(
    (
      matchId: string,
      raterId: string,
      rating: number,
      note?: string
    ) => {
      updateEntry((prev) => {
        return {
          ...prev,
          matches: prev.matches.map((m) => {
            if (m.id !== matchId) return m;
            if (m.memberAId === raterId) {
              return { ...m, ratingAtoB: rating, noteAtoB: note };
            }
            if (m.memberBId === raterId) {
              return { ...m, ratingBtoA: rating, noteBtoA: note };
            }
            return m;
          }),
        };
      });
    },
    [updateEntry]
  );

  // ============================================
  // 파생 데이터
  // ============================================

  const activeMatches = entry.matches.filter((m) => m.status === "active");
  const endedMatches = entry.matches.filter((m) => m.status === "ended");
  const unmatchedMembers = entry.members.filter((m) => !m.currentMatchId);
  const matchedMembers = entry.members.filter((m) => !!m.currentMatchId);

  return {
    entry,
    members: entry.members,
    matches: entry.matches,
    activeMatches,
    endedMatches,
    unmatchedMembers,
    matchedMembers,
    addMember,
    removeMember,
    updateMember,
    createMatch,
    endMatch,
    randomMatch,
    ratePartner,
  };
}
