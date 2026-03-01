"use client";

import { useState, useCallback } from "react";
import type {
  PosterProject,
  PosterVersion,
  PosterVersionStatus,
  PosterVote,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:poster-management:${groupId}:${projectId}`;
}

function loadData(groupId: string, projectId: string): PosterProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as PosterProject[];
  } catch {
    return [];
  }
}

function saveData(
  groupId: string,
  projectId: string,
  data: PosterProject[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, projectId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type PosterManagementStats = {
  totalProjects: number;
  totalVersions: number;
  approvedVersions: number;
};

// ============================================================
// 훅
// ============================================================

export function usePosterManagement(groupId: string, projectId: string) {
  const [projects, setProjects] = useState<PosterProject[]>(() => loadData(groupId, projectId));

  const reload = useCallback(() => {
    if (!groupId || !projectId) return;
    const data = loadData(groupId, projectId);
    setProjects(data);
  }, [groupId, projectId]);

  const persist = useCallback(
    (next: PosterProject[]) => {
      saveData(groupId, projectId, next);
      setProjects(next);
    },
    [groupId, projectId]
  );

  // ── 포스터 프로젝트 CRUD ──────────────────────────────────

  const addProject = useCallback(
    (
      partial: Pick<PosterProject, "posterName"> &
        Partial<Pick<PosterProject, "deadline">>
    ): PosterProject => {
      const newProject: PosterProject = {
        id: crypto.randomUUID(),
        projectId,
        posterName: partial.posterName,
        versions: [],
        selectedVersionId: undefined,
        deadline: partial.deadline,
        createdAt: new Date().toISOString(),
      };
      persist([...projects, newProject]);
      return newProject;
    },
    [projects, persist, projectId]
  );

  const updateProject = useCallback(
    (
      posterId: string,
      partial: Partial<Pick<PosterProject, "posterName" | "deadline">>
    ): boolean => {
      const idx = projects.findIndex((p) => p.id === posterId);
      if (idx === -1) return false;
      const next = [...projects];
      next[idx] = { ...next[idx], ...partial };
      persist(next);
      return true;
    },
    [projects, persist]
  );

  const deleteProject = useCallback(
    (posterId: string): boolean => {
      const next = projects.filter((p) => p.id !== posterId);
      if (next.length === projects.length) return false;
      persist(next);
      return true;
    },
    [projects, persist]
  );

  // ── 버전 CRUD ─────────────────────────────────────────────

  const addVersion = useCallback(
    (
      posterId: string,
      partial: Pick<PosterVersion, "title" | "designer" | "description"> &
        Partial<Pick<PosterVersion, "dimensions" | "colorScheme">>
    ): PosterVersion | null => {
      const idx = projects.findIndex((p) => p.id === posterId);
      if (idx === -1) return null;

      const existing = projects[idx].versions;
      const versionNumber =
        existing.length > 0
          ? Math.max(...existing.map((v) => v.versionNumber)) + 1
          : 1;

      const newVersion: PosterVersion = {
        id: crypto.randomUUID(),
        versionNumber,
        title: partial.title,
        designer: partial.designer,
        description: partial.description,
        dimensions: partial.dimensions,
        colorScheme: partial.colorScheme ?? [],
        status: "draft",
        votes: [],
        createdAt: new Date().toISOString(),
      };

      const next = [...projects];
      next[idx] = {
        ...next[idx],
        versions: [...next[idx].versions, newVersion],
      };
      persist(next);
      return newVersion;
    },
    [projects, persist]
  );

  const updateVersion = useCallback(
    (
      posterId: string,
      versionId: string,
      partial: Partial<
        Pick<
          PosterVersion,
          "title" | "designer" | "description" | "dimensions" | "colorScheme"
        >
      >
    ): boolean => {
      const posterIdx = projects.findIndex((p) => p.id === posterId);
      if (posterIdx === -1) return false;

      const versionIdx = projects[posterIdx].versions.findIndex(
        (v) => v.id === versionId
      );
      if (versionIdx === -1) return false;

      const next = [...projects];
      const updatedVersions = [...next[posterIdx].versions];
      updatedVersions[versionIdx] = {
        ...updatedVersions[versionIdx],
        ...partial,
      };
      next[posterIdx] = { ...next[posterIdx], versions: updatedVersions };
      persist(next);
      return true;
    },
    [projects, persist]
  );

  const deleteVersion = useCallback(
    (posterId: string, versionId: string): boolean => {
      const posterIdx = projects.findIndex((p) => p.id === posterId);
      if (posterIdx === -1) return false;

      const filtered = projects[posterIdx].versions.filter(
        (v) => v.id !== versionId
      );
      if (filtered.length === projects[posterIdx].versions.length) return false;

      const next = [...projects];
      next[posterIdx] = { ...next[posterIdx], versions: filtered };
      persist(next);
      return true;
    },
    [projects, persist]
  );

  // ── 투표 ──────────────────────────────────────────────────

  const vote = useCallback(
    (
      posterId: string,
      versionId: string,
      memberName: string,
      rating: number,
      comment?: string
    ): boolean => {
      const posterIdx = projects.findIndex((p) => p.id === posterId);
      if (posterIdx === -1) return false;

      const versionIdx = projects[posterIdx].versions.findIndex(
        (v) => v.id === versionId
      );
      if (versionIdx === -1) return false;

      const existing = projects[posterIdx].versions[versionIdx];
      const filteredVotes = existing.votes.filter(
        (v) => v.memberName !== memberName
      );

      const newVote: PosterVote = { memberName, rating, comment };
      const updatedVotes = [...filteredVotes, newVote];

      const next = [...projects];
      const updatedVersions = [...next[posterIdx].versions];
      updatedVersions[versionIdx] = {
        ...updatedVersions[versionIdx],
        votes: updatedVotes,
      };
      next[posterIdx] = { ...next[posterIdx], versions: updatedVersions };
      persist(next);
      return true;
    },
    [projects, persist]
  );

  // ── 상태 변경 ─────────────────────────────────────────────

  const updateStatus = useCallback(
    (
      posterId: string,
      versionId: string,
      status: PosterVersionStatus
    ): boolean => {
      const posterIdx = projects.findIndex((p) => p.id === posterId);
      if (posterIdx === -1) return false;

      const versionIdx = projects[posterIdx].versions.findIndex(
        (v) => v.id === versionId
      );
      if (versionIdx === -1) return false;

      const next = [...projects];
      const updatedVersions = [...next[posterIdx].versions];
      updatedVersions[versionIdx] = {
        ...updatedVersions[versionIdx],
        status,
      };
      next[posterIdx] = { ...next[posterIdx], versions: updatedVersions };
      persist(next);
      return true;
    },
    [projects, persist]
  );

  // ── 최종 선정 ─────────────────────────────────────────────

  const selectFinal = useCallback(
    (posterId: string, versionId: string): boolean => {
      const posterIdx = projects.findIndex((p) => p.id === posterId);
      if (posterIdx === -1) return false;

      const versionIdx = projects[posterIdx].versions.findIndex(
        (v) => v.id === versionId
      );
      if (versionIdx === -1) return false;

      const next = [...projects];
      const updatedVersions = next[posterIdx].versions.map((v) =>
        v.id === versionId ? { ...v, status: "final" as PosterVersionStatus } : v
      );
      next[posterIdx] = {
        ...next[posterIdx],
        versions: updatedVersions,
        selectedVersionId: versionId,
      };
      persist(next);
      return true;
    },
    [projects, persist]
  );

  // ── 통계 ──────────────────────────────────────────────────

  const stats: PosterManagementStats = (() => {
    const totalProjects = projects.length;
    const totalVersions = projects.reduce(
      (sum, p) => sum + p.versions.length,
      0
    );
    const approvedVersions = projects.reduce(
      (sum, p) =>
        sum +
        p.versions.filter(
          (v) => v.status === "approved" || v.status === "final"
        ).length,
      0
    );
    return { totalProjects, totalVersions, approvedVersions };
  })();

  return {
    projects,
    loading: false,
    addProject,
    updateProject,
    deleteProject,
    addVersion,
    updateVersion,
    deleteVersion,
    vote,
    updateStatus,
    selectFinal,
    stats,
    refetch: reload,
  };
}
