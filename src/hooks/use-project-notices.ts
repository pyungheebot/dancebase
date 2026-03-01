"use client";

import { useState, useCallback } from "react";
import type { ProjectNotice, ProjectNoticeImportance } from "@/types";

const MAX_NOTICES = 20;

function getStorageKey(projectId: string): string {
  return `project-notices-${projectId}`;
}

function loadNotices(projectId: string): ProjectNotice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ProjectNotice[];
  } catch {
    return [];
  }
}

function saveNotices(projectId: string, notices: ProjectNotice[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(notices));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

export function useProjectNotices(projectId: string) {
  const [notices, setNotices] = useState<ProjectNotice[]>([]);
  const [mounted, setMounted] = useState(false);

  // 마운트 후 localStorage에서 불러오기


  // urgent 공지를 상단 고정, 그 다음 createdAt 내림차순 정렬
  const sortedNotices = [...notices].sort((a, b) => {
    if (a.importance === "urgent" && b.importance !== "urgent") return -1;
    if (a.importance !== "urgent" && b.importance === "urgent") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const createNotice = useCallback(
    (params: {
      title: string;
      content: string;
      importance: ProjectNoticeImportance;
      createdBy: string;
    }): void => {
      const newNotice: ProjectNotice = {
        id: crypto.randomUUID(),
        title: params.title.trim(),
        content: params.content.trim(),
        importance: params.importance,
        createdBy: params.createdBy,
        createdAt: new Date().toISOString(),
      };

      setNotices((prev) => {
        // 최근 MAX_NOTICES건만 유지 (오래된 것 제거)
        const updated = [newNotice, ...prev].slice(0, MAX_NOTICES);
        saveNotices(projectId, updated);
        return updated;
      });
    },
    [projectId]
  );

  const deleteNotice = useCallback(
    (noticeId: string): void => {
      setNotices((prev) => {
        const updated = prev.filter((n) => n.id !== noticeId);
        saveNotices(projectId, updated);
        return updated;
      });
    },
    [projectId]
  );

  return {
    notices: sortedNotices,
    loading: !mounted,
    createNotice,
    deleteNotice,
  };
}
