"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  FlexTrackData,
  FlexTrackPart,
  FlexTrackPartConfig,
  FlexTrackRecord,
  FlexTrackUnit,
} from "@/types";

// ─── 부위 메타데이터 ──────────────────────────────────────────

export const FLEX_PART_META: Record<
  FlexTrackPart,
  { label: string; unit: FlexTrackUnit; defaultGoal: number; description: string }
> = {
  forward_bend: {
    label: "전굴",
    unit: "cm",
    defaultGoal: 30,
    description: "앞으로 숙이기 (손끝~바닥)",
  },
  side_split: {
    label: "개각",
    unit: "deg",
    defaultGoal: 180,
    description: "좌우 벌리기 (각도)",
  },
  y_balance: {
    label: "Y밸런스",
    unit: "cm",
    defaultGoal: 100,
    description: "한발 균형 (도달 거리)",
  },
  shoulder: {
    label: "어깨 유연성",
    unit: "cm",
    defaultGoal: 20,
    description: "어깨 가동범위 (손끝 간격)",
  },
  hip_mobility: {
    label: "고관절 가동범위",
    unit: "deg",
    defaultGoal: 120,
    description: "고관절 굴곡 각도",
  },
};

export const FLEX_PARTS: FlexTrackPart[] = [
  "forward_bend",
  "side_split",
  "y_balance",
  "shoulder",
  "hip_mobility",
];

// ─── 기본값 ───────────────────────────────────────────────────

function buildDefaultPart(part: FlexTrackPart): FlexTrackPartConfig {
  return {
    part,
    goal: FLEX_PART_META[part].defaultGoal,
    records: [],
  };
}

function buildDefaultData(memberId: string): FlexTrackData {
  return {
    memberId,
    parts: FLEX_PARTS.map(buildDefaultPart),
    updatedAt: new Date().toISOString(),
  };
}

// ─── localStorage 헬퍼 ──────────────────────────────────────

function getStorageKey(memberId: string) {
  return `dance-flexibility-${memberId}`;
}

// ─── 달성률 계산 ──────────────────────────────────────────────

/** 최근 측정값 기준 목표 달성률 (0~100) */
export function calcFlexProgress(config: FlexTrackPartConfig): number {
  if (config.records.length === 0) return 0;
  const latest = config.records[0].value;
  if (config.goal <= 0) return 0;
  return Math.min(100, Math.round((latest / config.goal) * 100));
}

/** 전체 평균 달성률 (0~100) */
export function calcOverallProgress(data: FlexTrackData): number {
  const progresses = data.parts.map(calcFlexProgress);
  const sum = progresses.reduce((a, b) => a + b, 0);
  return Math.round(sum / progresses.length);
}

// ─── 훅 ──────────────────────────────────────────────────────

export function useDanceFlexibility(memberId: string) {
  const { data, mutate } = useSWR(
    swrKeys.danceFlexibility(memberId),
    () => loadFromStorage<FlexTrackData>(getStorageKey(memberId), {} as FlexTrackData),
    { revalidateOnFocus: false }
  );

  const flexData = data ?? buildDefaultData(memberId);

  /** 부위별 기록 추가 */
  function addRecord(
    part: FlexTrackPart,
    record: Omit<FlexTrackRecord, "id">
  ) {
    const newRecord: FlexTrackRecord = { ...record, id: crypto.randomUUID() };
    const next: FlexTrackData = {
      ...flexData,
      parts: flexData.parts.map((p) =>
        p.part !== part
          ? p
          : {
              ...p,
              // 최신순 정렬
              records: [newRecord, ...p.records].sort(
                (a, b) => b.date.localeCompare(a.date)
              ),
            }
      ),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(memberId), next);
    mutate(next, false);
  }

  /** 부위별 기록 삭제 */
  function removeRecord(part: FlexTrackPart, recordId: string) {
    const next: FlexTrackData = {
      ...flexData,
      parts: flexData.parts.map((p) =>
        p.part !== part
          ? p
          : { ...p, records: p.records.filter((r) => r.id !== recordId) }
      ),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(memberId), next);
    mutate(next, false);
  }

  /** 부위 목표값 변경 */
  function updateGoal(part: FlexTrackPart, goal: number) {
    const next: FlexTrackData = {
      ...flexData,
      parts: flexData.parts.map((p) =>
        p.part !== part ? p : { ...p, goal }
      ),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(memberId), next);
    mutate(next, false);
  }

  return {
    data: flexData,
    addRecord,
    removeRecord,
    updateGoal,
    refetch: () => mutate(),
  };
}
