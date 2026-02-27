"use client";

import { useState, useCallback, useEffect } from "react";
import type { ProjectResource, ResourceType } from "@/types";

const STORAGE_KEY_PREFIX = "dancebase:resources:";

// ============================================
// localStorage 헬퍼
// ============================================

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function loadResources(groupId: string): ProjectResource[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as ProjectResource[];
  } catch {
    return [];
  }
}

function saveResources(groupId: string, resources: ProjectResource[]): void {
  localStorage.setItem(getStorageKey(groupId), JSON.stringify(resources));
}

// ============================================
// 훅
// ============================================

export function useProjectResources(groupId: string) {
  const [resources, setResources] = useState<ProjectResource[]>([]);

  // 초기 로드
  useEffect(() => {
    setResources(loadResources(groupId));
  }, [groupId]);

  // 상태 업데이트 + localStorage 동기화
  const updateResources = useCallback(
    (updater: (prev: ProjectResource[]) => ProjectResource[]) => {
      setResources((prev) => {
        const next = updater(prev);
        saveResources(groupId, next);
        return next;
      });
    },
    [groupId]
  );

  // 리소스 추가
  const addResource = useCallback(
    (data: Omit<ProjectResource, "id" | "createdAt">) => {
      const newResource: ProjectResource = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      updateResources((prev) => [newResource, ...prev]);
    },
    [updateResources]
  );

  // 리소스 수정
  const updateResource = useCallback(
    (id: string, data: Partial<Omit<ProjectResource, "id" | "createdAt">>) => {
      updateResources((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data } : r))
      );
    },
    [updateResources]
  );

  // 리소스 삭제
  const deleteResource = useCallback(
    (id: string) => {
      updateResources((prev) => prev.filter((r) => r.id !== id));
    },
    [updateResources]
  );

  // 유형별 필터
  const filterByType = useCallback(
    (type: ResourceType): ProjectResource[] => {
      return resources.filter((r) => r.type === type);
    },
    [resources]
  );

  // 태그별 필터
  const filterByTag = useCallback(
    (tag: string): ProjectResource[] => {
      return resources.filter((r) => r.tags.includes(tag));
    },
    [resources]
  );

  // 프로젝트별 필터
  const filterByProject = useCallback(
    (projectId: string): ProjectResource[] => {
      return resources.filter((r) => r.projectId === projectId);
    },
    [resources]
  );

  // 제목 검색
  const searchByTitle = useCallback(
    (query: string): ProjectResource[] => {
      const q = query.trim().toLowerCase();
      if (!q) return resources;
      return resources.filter((r) => r.title.toLowerCase().includes(q));
    },
    [resources]
  );

  // 전체 태그 목록 추출 (중복 제거, 가나다순)
  const getAllTags = useCallback((): string[] => {
    const tagSet = new Set<string>();
    resources.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [resources]);

  return {
    resources,
    addResource,
    updateResource,
    deleteResource,
    filterByType,
    filterByTag,
    filterByProject,
    searchByTitle,
    getAllTags,
  };
}
