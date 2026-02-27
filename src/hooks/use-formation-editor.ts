"use client";

import { useState, useEffect, useCallback } from "react";
import type { FormationProject, FormationScene, FormationPosition } from "@/types";

const MAX_SCENES = 10;

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:formations:${groupId}:${projectId}`;
}

function loadProject(groupId: string, projectId: string): FormationProject {
  if (typeof window === "undefined") return { scenes: [], updatedAt: "" };
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) return { scenes: [], updatedAt: "" };
    return JSON.parse(raw) as FormationProject;
  } catch {
    return { scenes: [], updatedAt: "" };
  }
}

function saveProject(
  groupId: string,
  projectId: string,
  project: FormationProject
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, projectId), JSON.stringify(project));
  } catch {
    // 무시
  }
}

export function useFormationEditor(groupId: string, projectId: string) {
  const [project, setProject] = useState<FormationProject>({ scenes: [], updatedAt: "" });
  const [loading, setLoading] = useState(true);

  // 초기 로드
  useEffect(() => {
    if (!groupId || !projectId) {
      setLoading(false);
      return;
    }
    const stored = loadProject(groupId, projectId);
    setProject(stored);
    setLoading(false);
  }, [groupId, projectId]);

  // 상태 업데이트 + localStorage 동기화
  const updateProject = useCallback(
    (next: FormationProject) => {
      const withTimestamp: FormationProject = {
        ...next,
        updatedAt: new Date().toISOString(),
      };
      setProject(withTimestamp);
      saveProject(groupId, projectId, withTimestamp);
    },
    [groupId, projectId]
  );

  // 씬 추가 (최대 10개)
  const addScene = useCallback(
    (label: string): boolean => {
      if (project.scenes.length >= MAX_SCENES) return false;
      const newScene: FormationScene = {
        id: crypto.randomUUID(),
        label: label.trim(),
        positions: [],
        createdAt: new Date().toISOString(),
      };
      updateProject({
        ...project,
        scenes: [...project.scenes, newScene],
      });
      return true;
    },
    [project, updateProject]
  );

  // 씬 삭제
  const deleteScene = useCallback(
    (sceneId: string): void => {
      updateProject({
        ...project,
        scenes: project.scenes.filter((s) => s.id !== sceneId),
      });
    },
    [project, updateProject]
  );

  // 씬에 멤버 위치 추가 (무대 중앙에 배치)
  const addPosition = useCallback(
    (sceneId: string, memberName: string, color: string): boolean => {
      const scene = project.scenes.find((s) => s.id === sceneId);
      if (!scene) return false;

      // 이미 같은 이름의 멤버가 있으면 추가하지 않음
      const alreadyExists = scene.positions.some(
        (p) => p.memberName === memberName
      );
      if (alreadyExists) return false;

      const newPosition: FormationPosition = {
        memberId: crypto.randomUUID(),
        memberName: memberName.trim(),
        x: 50,
        y: 50,
        color,
      };

      const updatedScenes = project.scenes.map((s) =>
        s.id === sceneId
          ? { ...s, positions: [...s.positions, newPosition] }
          : s
      );
      updateProject({ ...project, scenes: updatedScenes });
      return true;
    },
    [project, updateProject]
  );

  // 멤버 위치 업데이트
  const updatePosition = useCallback(
    (sceneId: string, memberId: string, x: number, y: number): void => {
      // 0-100 범위 클램프
      const clampedX = Math.max(2, Math.min(98, x));
      const clampedY = Math.max(2, Math.min(98, y));

      const updatedScenes = project.scenes.map((s) =>
        s.id === sceneId
          ? {
              ...s,
              positions: s.positions.map((p) =>
                p.memberId === memberId
                  ? { ...p, x: clampedX, y: clampedY }
                  : p
              ),
            }
          : s
      );
      updateProject({ ...project, scenes: updatedScenes });
    },
    [project, updateProject]
  );

  // 멤버 위치 제거
  const removePosition = useCallback(
    (sceneId: string, memberId: string): void => {
      const updatedScenes = project.scenes.map((s) =>
        s.id === sceneId
          ? { ...s, positions: s.positions.filter((p) => p.memberId !== memberId) }
          : s
      );
      updateProject({ ...project, scenes: updatedScenes });
    },
    [project, updateProject]
  );

  // 씬의 모든 포지션에서 같은 이름의 멤버를 복사 (씬 복제 시 활용)
  const copyPositionsFromScene = useCallback(
    (fromSceneId: string, toSceneId: string): boolean => {
      const fromScene = project.scenes.find((s) => s.id === fromSceneId);
      const toScene = project.scenes.find((s) => s.id === toSceneId);
      if (!fromScene || !toScene) return false;

      const copiedPositions: FormationPosition[] = fromScene.positions.map((p) => ({
        ...p,
        memberId: crypto.randomUUID(),
      }));

      const updatedScenes = project.scenes.map((s) =>
        s.id === toSceneId ? { ...s, positions: copiedPositions } : s
      );
      updateProject({ ...project, scenes: updatedScenes });
      return true;
    },
    [project, updateProject]
  );

  return {
    scenes: project.scenes,
    loading,
    canAddScene: project.scenes.length < MAX_SCENES,
    addScene,
    deleteScene,
    addPosition,
    updatePosition,
    removePosition,
    copyPositionsFromScene,
  };
}
