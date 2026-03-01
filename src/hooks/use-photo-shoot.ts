"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
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
  // SWR 캐시 관리 (fetcher는 localStorage에서 읽음)
  const { data, mutate } = useSWR(
    swrKeys.photoShootPlan(projectId),
    () => loadFromStorage<PhotoShootData>(getStorageKey(projectId), {} as PhotoShootData),
    { revalidateOnFocus: false }
  );

  // 내부 저장 헬퍼
  const persist = useCallback(
    (next: PhotoShootData) => {
      saveToStorage(getStorageKey(projectId), next);
      mutate(next, false);
    },
    [projectId, mutate]
  );

  // 현재 데이터
  const current: PhotoShootData = useMemo(() => data ?? {
    projectId,
    plans: [],
    photographerName: null,
    updatedAt: new Date().toISOString(),
  }, [data, projectId]);

  // 계획 추가
  const addPlan = useCallback(
    (input: PhotoShootPlanInput): boolean => {
      const trimTitle = input.title.trim();
      if (!trimTitle) {
        toast.error(TOAST.PHOTO_SHOOT.TITLE_REQUIRED);
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
      toast.success(TOAST.PHOTO_SHOOT.ADDED);
      return true;
    },
    [current, persist]
  );

  // 계획 수정
  const updatePlan = useCallback(
    (id: string, input: PhotoShootPlanInput): boolean => {
      const trimTitle = input.title.trim();
      if (!trimTitle) {
        toast.error(TOAST.PHOTO_SHOOT.TITLE_REQUIRED);
        return false;
      }
      const idx = current.plans.findIndex((p) => p.id === id);
      if (idx === -1) {
        toast.error(TOAST.PHOTO_SHOOT.NOT_FOUND);
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
      toast.success(TOAST.PHOTO_SHOOT.UPDATED);
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
      toast.success(TOAST.PHOTO_SHOOT.DELETED);
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
      toast.success(TOAST.PHOTO_SHOOT.ASSIGNEE_UPDATED);
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
    loading: false,
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
