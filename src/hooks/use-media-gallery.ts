"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type { MediaAlbum, MediaGalleryData, MediaGalleryItem } from "@/types";

// ——————————————————————————————
// localStorage 헬퍼
// ——————————————————————————————

function loadData(groupId: string): MediaGalleryData {
  if (typeof window === "undefined") {
    return {
      groupId,
      items: [],
      albums: [],
      updatedAt: new Date().toISOString(),
    };
  }
  try {
    const raw = localStorage.getItem(`group-media-gallery-${groupId}`);
    if (!raw) {
      return {
        groupId,
        items: [],
        albums: [],
        updatedAt: new Date().toISOString(),
      };
    }
    return JSON.parse(raw) as MediaGalleryData;
  } catch {
    return {
      groupId,
      items: [],
      albums: [],
      updatedAt: new Date().toISOString(),
    };
  }
}

function persistData(data: MediaGalleryData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `group-media-gallery-${data.groupId}`,
      JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
    );
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ——————————————————————————————
// 파라미터 타입
// ——————————————————————————————

export type AddItemParams = Omit<MediaGalleryItem, "id" | "createdAt">;

export type UpdateItemParams = Partial<
  Omit<MediaGalleryItem, "id" | "createdAt">
>;

export type CreateAlbumParams = Omit<MediaAlbum, "id" | "createdAt">;

export type UpdateAlbumParams = Partial<
  Omit<MediaAlbum, "id" | "createdAt">
>;

// ——————————————————————————————
// 훅
// ——————————————————————————————

export function useMediaGallery(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.groupMediaGallery(groupId),
    () => loadData(groupId),
    { revalidateOnFocus: false }
  );

  const galleryData: MediaGalleryData = data ?? {
    groupId,
    items: [],
    albums: [],
    updatedAt: new Date().toISOString(),
  };

  // ——— 미디어 항목 추가 ———
  const addItem = useCallback(
    (params: AddItemParams) => {
      const current = loadData(groupId);
      const newItem: MediaGalleryItem = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...params,
      };
      const updated: MediaGalleryData = {
        ...current,
        items: [newItem, ...current.items],
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 미디어 항목 수정 ———
  const updateItem = useCallback(
    (itemId: string, params: UpdateItemParams) => {
      const current = loadData(groupId);
      const updated: MediaGalleryData = {
        ...current,
        items: current.items.map((item) =>
          item.id !== itemId ? item : { ...item, ...params }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 미디어 항목 삭제 ———
  const deleteItem = useCallback(
    (itemId: string) => {
      const current = loadData(groupId);
      const updated: MediaGalleryData = {
        ...current,
        items: current.items.filter((item) => item.id !== itemId),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 앨범 생성 ———
  const createAlbum = useCallback(
    (params: CreateAlbumParams) => {
      const current = loadData(groupId);
      const newAlbum: MediaAlbum = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...params,
      };
      const updated: MediaGalleryData = {
        ...current,
        albums: [newAlbum, ...current.albums],
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 앨범 수정 ———
  const updateAlbum = useCallback(
    (albumId: string, params: UpdateAlbumParams) => {
      const current = loadData(groupId);
      const updated: MediaGalleryData = {
        ...current,
        albums: current.albums.map((album) =>
          album.id !== albumId ? album : { ...album, ...params }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 앨범 삭제 (앨범 내 항목은 미분류로 이동) ———
  const deleteAlbum = useCallback(
    (albumId: string) => {
      const current = loadData(groupId);
      const updated: MediaGalleryData = {
        ...current,
        albums: current.albums.filter((album) => album.id !== albumId),
        // 해당 앨범에 속한 항목들을 미분류(albumId: null)로 변경
        items: current.items.map((item) =>
          item.albumId === albumId ? { ...item, albumId: null } : item
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 앨범별 항목 조회 ———
  const getAlbumItems = useCallback(
    (albumId: string | null): MediaGalleryItem[] => {
      const current = loadData(groupId);
      return current.items.filter((item) => item.albumId === albumId);
    },
    [groupId]
  );

  // ——————————————————————————————
  // 통계 계산
  // ——————————————————————————————

  const items = galleryData.items;
  const albums = galleryData.albums;

  const totalItems = items.length;
  const photoCount = items.filter((item) => item.type === "photo").length;
  const videoCount = items.filter((item) => item.type === "video").length;
  const albumCount = albums.length;

  return {
    galleryData,
    loading: isLoading,
    refetch: () => mutate(),
    // 미디어 CRUD
    addItem,
    updateItem,
    deleteItem,
    // 앨범 CRUD
    createAlbum,
    updateAlbum,
    deleteAlbum,
    // 조회
    getAlbumItems,
    // 통계
    totalItems,
    photoCount,
    videoCount,
    albumCount,
  };
}
