"use client";

import { useState, useEffect, useCallback } from "react";
import type { ChoreoVersion, ChoreoVersionStatus, ChoreoVersionStore, ChoreoSectionNote } from "@/types";

// ============================================
// 상수
// ============================================

const MAX_VERSIONS = 20;

// ============================================
// localStorage 헬퍼
// ============================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:choreo-version:${groupId}:${projectId}`;
}

const DEFAULT_STORE: ChoreoVersionStore = {
  songTitle: "",
  versions: [],
  currentVersionId: null,
  updatedAt: new Date().toISOString(),
};

function loadStore(groupId: string, projectId: string): ChoreoVersionStore {
  if (typeof window === "undefined") return { ...DEFAULT_STORE };
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) return { ...DEFAULT_STORE };
    return JSON.parse(raw) as ChoreoVersionStore;
  } catch {
    return { ...DEFAULT_STORE };
  }
}

function saveStore(groupId: string, projectId: string, store: ChoreoVersionStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, projectId), JSON.stringify(store));
  } catch {
    // 무시
  }
}

// ============================================
// 이전 버전과 섹션 변경 여부 비교
// ============================================

/**
 * prevSections와 nextSections를 비교해서
 * nextSections의 각 섹션에 changed 플래그를 설정한다.
 * - sectionName이 동일한 섹션이 없거나 content가 다르면 changed = true
 */
function markChangedSections(
  prevSections: ChoreoSectionNote[],
  nextSections: ChoreoSectionNote[]
): ChoreoSectionNote[] {
  return nextSections.map((sec) => {
    const prev = prevSections.find((p) => p.sectionName === sec.sectionName);
    const changed = !prev || prev.content !== sec.content;
    return { ...sec, changed };
  });
}

// ============================================
// 훅
// ============================================

export function useChoreographyVersion(groupId: string, projectId: string) {
  const [store, setStore] = useState<ChoreoVersionStore>({ ...DEFAULT_STORE });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId || !projectId) {
      setLoading(false);
      return;
    }
    const data = loadStore(groupId, projectId);
    setStore(data);
    setLoading(false);
  }, [groupId, projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // 스토어 업데이트 헬퍼
  const update = useCallback(
    (patch: Partial<ChoreoVersionStore>) => {
      setStore((prev) => {
        const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
        saveStore(groupId, projectId, next);
        return next;
      });
    },
    [groupId, projectId]
  );

  // -----------------------------------------------
  // 곡 제목 수정
  // -----------------------------------------------
  const updateSongTitle = useCallback(
    (songTitle: string) => {
      update({ songTitle });
    },
    [update]
  );

  // -----------------------------------------------
  // 버전 추가
  // -----------------------------------------------
  const addVersion = useCallback(
    (payload: {
      label: string;
      description: string;
      sections: Omit<ChoreoSectionNote, "changed">[];
      createdBy: string;
    }): boolean => {
      if (store.versions.length >= MAX_VERSIONS) return false;

      // 이전 버전 섹션 (마지막 버전 기준)
      const prevSections: ChoreoSectionNote[] =
        store.versions.length > 0
          ? (store.versions[store.versions.length - 1]?.sections ?? [])
          : [];

      const sectionsWithChanged = markChangedSections(
        prevSections,
        payload.sections.map((s) => ({ ...s, changed: false }))
      );

      const nextVersionNumber =
        store.versions.length > 0
          ? Math.max(...store.versions.map((v) => v.versionNumber)) + 1
          : 1;

      const newVersion: ChoreoVersion = {
        id: crypto.randomUUID(),
        versionNumber: nextVersionNumber,
        label: payload.label.trim(),
        status: "draft",
        description: payload.description.trim(),
        sections: sectionsWithChanged,
        createdBy: payload.createdBy.trim(),
        createdAt: new Date().toISOString(),
      };

      const updatedVersions = [...store.versions, newVersion];
      update({
        versions: updatedVersions,
        currentVersionId: newVersion.id,
      });
      return true;
    },
    [store.versions, update]
  );

  // -----------------------------------------------
  // 버전 상태 변경
  // -----------------------------------------------
  const updateVersionStatus = useCallback(
    (versionId: string, status: ChoreoVersionStatus): void => {
      const updated = store.versions.map((v) =>
        v.id === versionId ? { ...v, status } : v
      );
      update({ versions: updated });
    },
    [store.versions, update]
  );

  // -----------------------------------------------
  // 현재 버전 설정
  // -----------------------------------------------
  const setCurrentVersion = useCallback(
    (versionId: string): void => {
      update({ currentVersionId: versionId });
    },
    [update]
  );

  // -----------------------------------------------
  // 버전 삭제
  // -----------------------------------------------
  const deleteVersion = useCallback(
    (versionId: string): void => {
      const updated = store.versions.filter((v) => v.id !== versionId);
      const currentVersionId =
        store.currentVersionId === versionId
          ? (updated[updated.length - 1]?.id ?? null)
          : store.currentVersionId;
      update({ versions: updated, currentVersionId });
    },
    [store.versions, store.currentVersionId, update]
  );

  // -----------------------------------------------
  // 두 버전 비교 (변경된 섹션 목록 반환)
  // -----------------------------------------------
  const compareVersions = useCallback(
    (versionIdA: string, versionIdB: string): ChoreoSectionNote[] => {
      const vA = store.versions.find((v) => v.id === versionIdA);
      const vB = store.versions.find((v) => v.id === versionIdB);
      if (!vA || !vB) return [];
      return markChangedSections(vA.sections, vB.sections);
    },
    [store.versions]
  );

  // -----------------------------------------------
  // 통계
  // -----------------------------------------------
  const stats = {
    totalVersions: store.versions.length,
    draftCount: store.versions.filter((v) => v.status === "draft").length,
    reviewCount: store.versions.filter((v) => v.status === "review").length,
    approvedCount: store.versions.filter((v) => v.status === "approved").length,
    archivedCount: store.versions.filter((v) => v.status === "archived").length,
    currentVersion: store.versions.find((v) => v.id === store.currentVersionId) ?? null,
    latestVersion: store.versions[store.versions.length - 1] ?? null,
  };

  const canAdd = store.versions.length < MAX_VERSIONS;

  return {
    store,
    loading,
    canAdd,
    stats,
    updateSongTitle,
    addVersion,
    updateVersionStatus,
    setCurrentVersion,
    deleteVersion,
    compareVersions,
    reload,
  };
}
