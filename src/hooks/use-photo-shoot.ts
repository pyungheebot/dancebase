"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { swrKeys } from "@/lib/swr/keys";
import type {
  PhotoShootData,
  PhotoShootPlan,
  PhotoShootPlanType,
} from "@/types";

// ============================================
// localStorage 키 및 유틸
// ============================================

function getStorageKey(projectId: string): string {
  return `dancebase:photo-shoot:${projectId}`;
}

function loadFromStorage(projectId: string): PhotoShootData {
  const defaultData: PhotoShootData = {
    projectId,
    plans: [],
    photographerName: null,
    updatedAt: new Date().toISOString(),
  };
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = localStorage.getItem(getStorageKey(projectId));
    if (!raw) return defaultData;
    return JSON.parse(raw) as PhotoShootData;
  } catch {
    return defaultData;
  }
}

function saveToStorage(data: PhotoShootData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(data.projectId), JSON.stringify(data));
}

// ============================================
// 입력 타입
// ============================================

export type PhotoShootPlanInput = {
  title: string;
  type: PhotoShootPlanType;
  location: string | null;
  timing: string | null;
  participants: string[];
  poseDescription: string | null;
  referenceUrl: string | null;
  notes: string;
};

// ============================================
// 훅
// ============================================

export function usePhotoShoot(projectId: string) {
  const [data, setData] = useState<PhotoShootData | null>(null);
  const [initialized, setInitialized] = useState(false);

  // SWR 캐시 관리 (fetcher는 localStorage에서 읽음)
  const { data: swrData, mutate } = useSWR(
    swrKeys.photoShootPlan(projectId),
    () => loadFromStorage(projectId),
    { revalidateOnFocus: false }
  );

  // 마운트 시 초기화
  useEffect(() => {
    if (!initialized) {
      setData(loadFromStorage(projectId));
      setInitialized(true);
    }
  }, [projectId, initialized]);

  // SWR 데이터가 업데이트될 때 동기화
  useEffect(() => {
    if (swrData) {
      setData(swrData);
    }
  }, [swrData]);

  // 내부 저장 헬퍼
  const persist = useCallback(
    (next: PhotoShootData) => {
      saveToStorage(next);
      setData(next);
      mutate(next, false);
    },
    [mutate]
  );

  // 현재 데이터
  const current: PhotoShootData = data ?? {
    projectId,
    plans: [],
    photographerName: null,
    updatedAt: new Date().toISOString(),
  };

  // 계획 추가
  const addPlan = useCallback(
    (input: PhotoShootPlanInput): boolean => {
      const trimTitle = input.title.trim();
      if (!trimTitle) {
        toast.error("촬영 계획 제목을 입력해주세요");
        return false;
      }
      const newPlan: PhotoShootPlan = {
        id: crypto.randomUUID(),
        title: trimTitle,
        type: input.type,
        location: input.location?.trim() || null,
        timing: input.timing?.trim() || null,
        participants: input.participants.filter((p) => p.trim()),
        poseDescription: input.poseDescription?.trim() || null,
        referenceUrl: input.referenceUrl?.trim() || null,
        isCompleted: false,
        notes: input.notes.trim(),
        createdAt: new Date().toISOString(),
      };
      const next: PhotoShootData = {
        ...current,
        plans: [...current.plans, newPlan],
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      toast.success("촬영 계획이 추가되었습니다");
      return true;
    },
    [current, persist]
  );

  // 계획 수정
  const updatePlan = useCallback(
    (id: string, input: PhotoShootPlanInput): boolean => {
      const trimTitle = input.title.trim();
      if (!trimTitle) {
        toast.error("촬영 계획 제목을 입력해주세요");
        return false;
      }
      const idx = current.plans.findIndex((p) => p.id === id);
      if (idx === -1) {
        toast.error("촬영 계획을 찾을 수 없습니다");
        return false;
      }
      const updatedPlans = current.plans.map((p) =>
        p.id === id
          ? {
              ...p,
              title: trimTitle,
              type: input.type,
              location: input.location?.trim() || null,
              timing: input.timing?.trim() || null,
              participants: input.participants.filter((pt) => pt.trim()),
              poseDescription: input.poseDescription?.trim() || null,
              referenceUrl: input.referenceUrl?.trim() || null,
              notes: input.notes.trim(),
            }
          : p
      );
      const next: PhotoShootData = {
        ...current,
        plans: updatedPlans,
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      toast.success("촬영 계획이 수정되었습니다");
      return true;
    },
    [current, persist]
  );

  // 계획 삭제
  const deletePlan = useCallback(
    (id: string): void => {
      const next: PhotoShootData = {
        ...current,
        plans: current.plans.filter((p) => p.id !== id),
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      toast.success("촬영 계획이 삭제되었습니다");
    },
    [current, persist]
  );

  // 완료 토글
  const toggleCompleted = useCallback(
    (id: string): void => {
      const updatedPlans = current.plans.map((p) =>
        p.id === id ? { ...p, isCompleted: !p.isCompleted } : p
      );
      const next: PhotoShootData = {
        ...current,
        plans: updatedPlans,
        updatedAt: new Date().toISOString(),
      };
      persist(next);
    },
    [current, persist]
  );

  // 촬영 담당자 설정
  const setPhotographer = useCallback(
    (name: string | null): void => {
      const next: PhotoShootData = {
        ...current,
        photographerName: name?.trim() || null,
        updatedAt: new Date().toISOString(),
      };
      persist(next);
      toast.success("촬영 담당자가 업데이트되었습니다");
    },
    [current, persist]
  );

  // 통계
  const totalPlans = current.plans.length;
  const completedCount = current.plans.filter((p) => p.isCompleted).length;
  const typeDistribution: Record<PhotoShootPlanType, number> = {
    group: 0,
    individual: 0,
    action: 0,
    backstage: 0,
    detail: 0,
  };
  for (const plan of current.plans) {
    typeDistribution[plan.type]++;
  }

  return {
    plans: current.plans,
    photographerName: current.photographerName,
    updatedAt: current.updatedAt,
    loading: !initialized,
    totalPlans,
    completedCount,
    typeDistribution,
    addPlan,
    updatePlan,
    deletePlan,
    toggleCompleted,
    setPhotographer,
  };
}
