"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  SharedFileData,
  SharedFileItem,
  SharedFileFolderItem,
  SharedFileCategory,
} from "@/types";

// ——————————————————————————————
// localStorage 헬퍼
// ——————————————————————————————

function loadData(groupId: string): SharedFileData {
  if (typeof window === "undefined") {
    return { groupId, files: [], folders: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(`group-shared-files-${groupId}`);
    if (!raw) return { groupId, files: [], folders: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as SharedFileData;
  } catch {
    return { groupId, files: [], folders: [], updatedAt: new Date().toISOString() };
  }
}

function persistData(data: SharedFileData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `group-shared-files-${data.groupId}`,
      JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
    );
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ——————————————————————————————
// 파라미터 타입
// ——————————————————————————————

export type AddFileParams = {
  name: string;
  url: string;
  category: SharedFileCategory;
  description: string | null;
  uploadedBy: string;
  fileSize: string | null;
  tags: string[];
  folderId: string | null;
};

export type UpdateFileParams = Partial<
  Omit<SharedFileItem, "id" | "createdAt">
>;

// ——————————————————————————————
// 훅
// ——————————————————————————————

export function useSharedFiles(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.groupSharedFiles(groupId),
    () => loadData(groupId),
    { revalidateOnFocus: false }
  );

  const fileData: SharedFileData = data ?? {
    groupId,
    files: [],
    folders: [],
    updatedAt: new Date().toISOString(),
  };

  // ——— 파일 추가 ———
  const addFile = useCallback(
    (params: AddFileParams) => {
      const current = loadData(groupId);
      const newFile: SharedFileItem = {
        id: crypto.randomUUID(),
        name: params.name,
        url: params.url,
        category: params.category,
        description: params.description,
        uploadedBy: params.uploadedBy,
        fileSize: params.fileSize,
        tags: params.tags,
        folderId: params.folderId,
        createdAt: new Date().toISOString(),
      };
      const updated: SharedFileData = {
        ...current,
        files: [newFile, ...current.files],
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 파일 수정 ———
  const updateFile = useCallback(
    (fileId: string, params: UpdateFileParams) => {
      const current = loadData(groupId);
      const updated: SharedFileData = {
        ...current,
        files: current.files.map((f) =>
          f.id !== fileId ? f : { ...f, ...params }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 파일 삭제 ———
  const deleteFile = useCallback(
    (fileId: string) => {
      const current = loadData(groupId);
      const updated: SharedFileData = {
        ...current,
        files: current.files.filter((f) => f.id !== fileId),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 폴더 추가 ———
  const addFolder = useCallback(
    (name: string, parentId: string | null) => {
      const current = loadData(groupId);
      const newFolder: SharedFileFolderItem = {
        id: crypto.randomUUID(),
        name,
        parentId,
      };
      const updated: SharedFileData = {
        ...current,
        folders: [...current.folders, newFolder],
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 폴더 이름 변경 ———
  const renameFolder = useCallback(
    (folderId: string, newName: string) => {
      const current = loadData(groupId);
      const updated: SharedFileData = {
        ...current,
        folders: current.folders.map((folder) =>
          folder.id !== folderId ? folder : { ...folder, name: newName }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 폴더 삭제 (하위 파일/폴더 포함) ———
  const deleteFolder = useCallback(
    (folderId: string) => {
      const current = loadData(groupId);

      // 재귀적으로 하위 폴더 ID 모두 수집
      function collectDescendantIds(id: string): string[] {
        const children = current.folders.filter((f) => f.parentId === id);
        return [id, ...children.flatMap((c) => collectDescendantIds(c.id))];
      }
      const allIds = new Set(collectDescendantIds(folderId));

      const updated: SharedFileData = {
        ...current,
        folders: current.folders.filter((f) => !allIds.has(f.id)),
        // 해당 폴더 및 하위 폴더에 속한 파일도 모두 제거
        files: current.files.filter(
          (f) => f.folderId === null || !allIds.has(f.folderId)
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 특정 폴더의 파일 목록 ———
  const getFilesInFolder = useCallback(
    (folderId: string | null) => {
      return fileData.files.filter((f) => f.folderId === folderId);
    },
    [fileData.files]
  );

  // ——————————————————————————————
  // 통계
  // ——————————————————————————————

  const files = fileData.files;
  const folders = fileData.folders;

  const totalFiles = files.length;
  const totalFolders = folders.length;

  const categoryBreakdown: Record<SharedFileCategory, number> = {
    document: 0,
    image: 0,
    video: 0,
    audio: 0,
    spreadsheet: 0,
    other: 0,
  };
  for (const file of files) {
    categoryBreakdown[file.category] =
      (categoryBreakdown[file.category] ?? 0) + 1;
  }

  return {
    fileData,
    loading: isLoading,
    refetch: () => mutate(),
    // 파일 CRUD
    addFile,
    updateFile,
    deleteFile,
    // 폴더 CRUD
    addFolder,
    renameFolder,
    deleteFolder,
    // 유틸
    getFilesInFolder,
    // 통계
    totalFiles,
    totalFolders,
    categoryBreakdown,
  };
}
