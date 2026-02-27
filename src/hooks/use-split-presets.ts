"use client";

import { useState, useEffect, useCallback } from "react";
import type { SplitPreset, SplitRuleType } from "@/types";

// ============================================
// 상수
// ============================================

const STORAGE_KEY_PREFIX = "split-presets-";

export const RULE_TYPE_LABELS: Record<SplitRuleType, string> = {
  equal: "균등 분배",
  by_role: "역할별",
  by_attendance: "출석률별",
  custom_ratio: "수동 비율",
};

// ============================================
// localStorage 헬퍼
// ============================================

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function loadPresets(groupId: string): SplitPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as SplitPreset[];
  } catch {
    return [];
  }
}

function savePresets(groupId: string, presets: SplitPreset[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(presets));
  } catch {
    // 무시
  }
}

// ============================================
// 프리셋 적용 — 멤버별 분담금 계산
// ============================================

export type ApplyPresetMember = {
  userId: string;
  name: string;
  role: "leader" | "sub_leader" | "member";
  /** 출석률 0~100 */
  attendanceRate?: number;
};

export type ApplyPresetResult = {
  userId: string;
  name: string;
  role: "leader" | "sub_leader" | "member";
  attendanceRate?: number;
  amount: number;
};

export function applyPresetCalc(
  preset: SplitPreset,
  members: ApplyPresetMember[],
  totalAmount: number
): ApplyPresetResult[] {
  if (members.length === 0 || totalAmount <= 0) {
    return members.map((m) => ({ ...m, amount: 0 }));
  }

  switch (preset.ruleType) {
    case "equal": {
      const perPerson = Math.floor(totalAmount / members.length);
      const remainder = totalAmount - perPerson * members.length;
      return members.map((m, idx) => ({
        ...m,
        amount: idx === 0 ? perPerson + remainder : perPerson,
      }));
    }

    case "by_role": {
      const roleRatios = preset.config.roleRatios ?? {
        leader: 0,
        sub_leader: 50,
        member: 100,
      };
      // 가중치 합산 후 비례 배분
      const weights = members.map((m) => roleRatios[m.role] ?? 100);
      const totalWeight = weights.reduce((s, w) => s + w, 0);
      if (totalWeight === 0) {
        return members.map((m) => ({ ...m, amount: 0 }));
      }
      let distributed = 0;
      const results: ApplyPresetResult[] = members.map((m, idx) => {
        if (idx === members.length - 1) {
          // 마지막 멤버가 나머지 금액 부담
          return { ...m, amount: totalAmount - distributed };
        }
        const amount = Math.floor((totalAmount * weights[idx]) / totalWeight);
        distributed += amount;
        return { ...m, amount };
      });
      return results;
    }

    case "by_attendance": {
      const thresholds = preset.config.attendanceThresholds ?? [
        { minRate: 90, ratio: 80 },
        { minRate: 70, ratio: 100 },
        { minRate: 50, ratio: 120 },
        { minRate: 0, ratio: 150 },
      ];
      // 내림차순 정렬
      const sorted = [...thresholds].sort((a, b) => b.minRate - a.minRate);

      const getRatio = (rate: number): number => {
        for (const t of sorted) {
          if (rate >= t.minRate) return t.ratio;
        }
        return sorted[sorted.length - 1]?.ratio ?? 100;
      };

      const ratios = members.map((m) =>
        getRatio(m.attendanceRate ?? 100)
      );
      const totalRatio = ratios.reduce((s, r) => s + r, 0);
      if (totalRatio === 0) {
        return members.map((m) => ({ ...m, amount: 0 }));
      }
      let distributed = 0;
      return members.map((m, idx) => {
        if (idx === members.length - 1) {
          return { ...m, amount: totalAmount - distributed };
        }
        const amount = Math.floor((totalAmount * ratios[idx]) / totalRatio);
        distributed += amount;
        return { ...m, amount };
      });
    }

    case "custom_ratio": {
      const customRatios = preset.config.customRatios ?? {};
      const ratios = members.map((m) => customRatios[m.userId] ?? 100);
      const totalRatio = ratios.reduce((s, r) => s + r, 0);
      if (totalRatio === 0) {
        const perPerson = Math.floor(totalAmount / members.length);
        const remainder = totalAmount - perPerson * members.length;
        return members.map((m, idx) => ({
          ...m,
          amount: idx === 0 ? perPerson + remainder : perPerson,
        }));
      }
      let distributed = 0;
      return members.map((m, idx) => {
        if (idx === members.length - 1) {
          return { ...m, amount: totalAmount - distributed };
        }
        const amount = Math.floor((totalAmount * ratios[idx]) / totalRatio);
        distributed += amount;
        return { ...m, amount };
      });
    }

    default:
      return members.map((m) => ({ ...m, amount: 0 }));
  }
}

// ============================================
// 훅
// ============================================

export function useSplitPresets(groupId: string) {
  const [presets, setPresets] = useState<SplitPreset[]>([]);

  useEffect(() => {
    setPresets(loadPresets(groupId));
  }, [groupId]);

  // 생성
  const createPreset = useCallback(
    (
      name: string,
      ruleType: SplitRuleType,
      config: SplitPreset["config"]
    ): SplitPreset => {
      const newPreset: SplitPreset = {
        id: crypto.randomUUID(),
        name,
        ruleType,
        config,
        createdAt: new Date().toISOString(),
      };
      setPresets((prev) => {
        const updated = [...prev, newPreset];
        savePresets(groupId, updated);
        return updated;
      });
      return newPreset;
    },
    [groupId]
  );

  // 수정
  const updatePreset = useCallback(
    (id: string, data: Partial<Pick<SplitPreset, "name" | "ruleType" | "config">>) => {
      setPresets((prev) => {
        const updated = prev.map((p) =>
          p.id === id ? { ...p, ...data } : p
        );
        savePresets(groupId, updated);
        return updated;
      });
    },
    [groupId]
  );

  // 삭제
  const deletePreset = useCallback(
    (id: string) => {
      setPresets((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        savePresets(groupId, updated);
        return updated;
      });
    },
    [groupId]
  );

  // 프리셋 적용
  const applyPreset = useCallback(
    (
      presetId: string,
      members: ApplyPresetMember[],
      totalAmount: number
    ): ApplyPresetResult[] => {
      const preset = presets.find((p) => p.id === presetId);
      if (!preset) return [];
      return applyPresetCalc(preset, members, totalAmount);
    },
    [presets]
  );

  return {
    presets,
    createPreset,
    updatePreset,
    deletePreset,
    applyPreset,
    RULE_TYPE_LABELS,
  };
}
