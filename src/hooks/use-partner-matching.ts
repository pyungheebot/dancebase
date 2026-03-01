"use client";

import useSWR from "swr";
import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { PartnerMatchingData, PartnerMatchingRecord, PartnerPair } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

const MAX_HISTORY = 5;
const STORAGE_KEY_PREFIX = "dancebase:partner-matching:";

// ============================================
// localStorage 유틸
// ============================================

function loadMatchingData(groupId: string): PartnerMatchingData {
  if (typeof window === "undefined") return { records: [] };
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${groupId}`);
    if (!raw) return { records: [] };
    return JSON.parse(raw) as PartnerMatchingData;
  } catch {
    return { records: [] };
  }
}

function saveMatchingData(groupId: string, data: PartnerMatchingData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${groupId}`, JSON.stringify(data));
}

// ============================================
// Fisher-Yates 셔플
// ============================================

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ============================================
// 매칭 생성
// ============================================

type SimpleMember = { userId: string; name: string };

function buildPairs(members: SimpleMember[]): PartnerPair[] {
  const shuffled = fisherYatesShuffle(members);
  const pairs: PartnerPair[] = [];
  let i = 0;

  while (i < shuffled.length) {
    const remaining = shuffled.length - i;
    if (remaining === 1) {
      // 남은 1명 → 마지막 쌍에 추가 (3인 1조)
      if (pairs.length > 0) {
        const last = pairs[pairs.length - 1];
        last.memberIds.push(shuffled[i].userId);
        last.memberNames.push(shuffled[i].name);
      } else {
        // 전체 멤버가 1명인 경우
        pairs.push({
          memberIds: [shuffled[i].userId],
          memberNames: [shuffled[i].name],
        });
      }
      i++;
    } else if (remaining === 3) {
      // 남은 3명 → 3인 1조
      pairs.push({
        memberIds: shuffled.slice(i, i + 3).map((m) => m.userId),
        memberNames: shuffled.slice(i, i + 3).map((m) => m.name),
      });
      i += 3;
    } else {
      // 2명씩
      pairs.push({
        memberIds: [shuffled[i].userId, shuffled[i + 1].userId],
        memberNames: [shuffled[i].name, shuffled[i + 1].name],
      });
      i += 2;
    }
  }

  return pairs;
}

/**
 * "중복 방지" 옵션: 직전 매칭에서 같은 쌍이면 재시도 (최대 10회)
 */
function buildPairsAvoidDuplicate(
  members: SimpleMember[],
  lastRecord: PartnerMatchingRecord | null
): PartnerPair[] {
  if (!lastRecord || members.length <= 2) {
    return buildPairs(members);
  }

  const lastPairSets = lastRecord.pairs.map(
    (p) => new Set(p.memberIds)
  );

  const hasDuplicate = (pairs: PartnerPair[]) =>
    pairs.some((pair) => {
      const pairSet = new Set(pair.memberIds);
      return lastPairSets.some((lastSet) => {
        if (lastSet.size !== pairSet.size) return false;
        for (const id of pairSet) {
          if (!lastSet.has(id)) return false;
        }
        return true;
      });
    });

  let attempt = 0;
  let result = buildPairs(members);
  while (hasDuplicate(result) && attempt < 10) {
    result = buildPairs(members);
    attempt++;
  }
  return result;
}

// ============================================
// 훅
// ============================================

export type UsePartnerMatchingReturn = {
  /** SWR로 조회한 멤버 목록 */
  members: SimpleMember[];
  membersLoading: boolean;
  /** 현재 매칭 결과 (미실행 시 null) */
  currentPairs: PartnerPair[] | null;
  /** localStorage 이력 */
  history: PartnerMatchingRecord[];
  /** 이력에서 선택한 상세 보기 레코드 */
  selectedRecord: PartnerMatchingRecord | null;
  setSelectedRecord: (r: PartnerMatchingRecord | null) => void;
  /** 매칭 실행 */
  runMatching: (label: string, avoidDuplicate: boolean) => void;
  /** 이력 개별 삭제 */
  deleteRecord: (id: string) => void;
};

export function usePartnerMatching(groupId: string): UsePartnerMatchingReturn {
  const supabase = createClient();

  // 멤버 목록 조회 (SWR)
  const { data: members = [], isLoading: membersLoading } = useSWR(
    swrKeys.partnerMatchingMembers(groupId),
    async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("user_id, profiles(id, name)")
        .eq("group_id", groupId);

      if (error) throw error;

      type RowType = {
        user_id: string;
        profiles: { id: string; name: string } | { id: string; name: string }[] | null;
      };

      return ((data ?? []) as RowType[]).map((row) => {
        const profile = Array.isArray(row.profiles)
          ? row.profiles[0]
          : row.profiles;
        return {
          userId: row.user_id,
          name: (profile as { name: string } | null)?.name ?? "알 수 없음",
        };
      });
    }
  );

  // localStorage 이력
  const [data, setData] = useState<PartnerMatchingData>(() =>
    loadMatchingData(groupId)
  );

  // 현재 매칭 결과
  const [currentPairs, setCurrentPairs] = useState<PartnerPair[] | null>(null);

  // 이력 상세 보기 선택
  const [selectedRecord, setSelectedRecord] =
    useState<PartnerMatchingRecord | null>(null);

  // 매칭 실행
  const runMatching = useCallback(
    (label: string, avoidDuplicate: boolean) => {
      if (members.length < 2) return;

      const lastRecord = data.records[0] ?? null;
      const pairs = avoidDuplicate
        ? buildPairsAvoidDuplicate(members, lastRecord)
        : buildPairs(members);

      setCurrentPairs(pairs);

      const newRecord: PartnerMatchingRecord = {
        id: crypto.randomUUID(),
        pairs,
        matchedAt: new Date().toISOString(),
        label: label.trim() || `매칭 ${formatYearMonthDay(new Date())}`,
      };

      const updated: PartnerMatchingData = {
        records: [newRecord, ...data.records].slice(0, MAX_HISTORY),
      };

      setData(updated);
      saveMatchingData(groupId, updated);
      setSelectedRecord(null);
    },
    [members, data, groupId]
  );

  // 이력 삭제
  const deleteRecord = useCallback(
    (id: string) => {
      const updated: PartnerMatchingData = {
        records: data.records.filter((r) => r.id !== id),
      };
      setData(updated);
      saveMatchingData(groupId, updated);
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
    },
    [data, groupId, selectedRecord]
  );

  return {
    members,
    membersLoading,
    currentPairs,
    history: data.records,
    selectedRecord,
    setSelectedRecord,
    runMatching,
    deleteRecord,
  };
}
