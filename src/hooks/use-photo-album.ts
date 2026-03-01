"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { PhotoAlbum, PhotoAlbumItem } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ─── 훅 ─────────────────────────────────────────────────────

const STORAGE_KEY = (groupId: string) => `dancebase:photo-albums:${groupId}`;

export function usePhotoAlbum(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.photoAlbum(groupId) : null,
    () => loadFromStorage<PhotoAlbum[]>(STORAGE_KEY(groupId), []),
    { revalidateOnFocus: false }
  );

  const albums = data ?? [];

  // ── 앨범 추가 ────────────────────────────────────────────

  function addAlbum(input: { name: string; coverUrl?: string }): boolean {
    if (!input.name.trim()) {
      toast.error(TOAST.ALBUM.NAME_REQUIRED);
      return false;
    }
    try {
      const stored = loadFromStorage<PhotoAlbum[]>(STORAGE_KEY(groupId), []);
      const newAlbum: PhotoAlbum = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        coverUrl: input.coverUrl?.trim() ?? "",
        photos: [],
        createdAt: new Date().toISOString(),
      };
      const next = [...stored, newAlbum];
      saveToStorage(STORAGE_KEY(groupId), next);
      mutate(next, false);
      toast.success(TOAST.ALBUM.CREATED);
      return true;
    } catch {
      toast.error(TOAST.ALBUM.CREATE_ERROR);
      return false;
    }
  }

  // ── 앨범 삭제 ────────────────────────────────────────────

  function deleteAlbum(albumId: string): boolean {
    try {
      const stored = loadFromStorage<PhotoAlbum[]>(STORAGE_KEY(groupId), []);
      const next = stored.filter((a) => a.id !== albumId);
      if (next.length === stored.length) return false;
      saveToStorage(STORAGE_KEY(groupId), next);
      mutate(next, false);
      toast.success(TOAST.ALBUM.DELETED);
      return true;
    } catch {
      toast.error(TOAST.ALBUM.DELETE_ERROR);
      return false;
    }
  }

  // ── 사진 추가 ────────────────────────────────────────────

  function addPhoto(
    albumId: string,
    input: Omit<PhotoAlbumItem, "id" | "createdAt">
  ): boolean {
    if (!input.title.trim()) {
      toast.error(TOAST.ALBUM.PHOTO_TITLE_REQUIRED);
      return false;
    }
    try {
      const stored = loadFromStorage<PhotoAlbum[]>(STORAGE_KEY(groupId), []);
      const album = stored.find((a) => a.id === albumId);
      if (!album) {
        toast.error(TOAST.ALBUM.NOT_FOUND);
        return false;
      }
      const newPhoto: PhotoAlbumItem = {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        imageUrl: input.imageUrl.trim(),
        description: input.description.trim(),
        tags: input.tags.map((t) => t.trim()).filter(Boolean),
        takenAt: input.takenAt,
        uploadedBy: input.uploadedBy.trim(),
        createdAt: new Date().toISOString(),
      };
      const next = stored.map((a) =>
        a.id === albumId ? { ...a, photos: [...a.photos, newPhoto] } : a
      );
      saveToStorage(STORAGE_KEY(groupId), next);
      mutate(next, false);
      toast.success(TOAST.ALBUM.PHOTO_ADDED);
      return true;
    } catch {
      toast.error(TOAST.ALBUM.PHOTO_ADD_ERROR);
      return false;
    }
  }

  // ── 사진 삭제 ────────────────────────────────────────────

  function deletePhoto(albumId: string, photoId: string): boolean {
    try {
      const stored = loadFromStorage<PhotoAlbum[]>(STORAGE_KEY(groupId), []);
      const next = stored.map((a) =>
        a.id === albumId
          ? { ...a, photos: a.photos.filter((p) => p.id !== photoId) }
          : a
      );
      saveToStorage(STORAGE_KEY(groupId), next);
      mutate(next, false);
      toast.success(TOAST.ALBUM.PHOTO_DELETED);
      return true;
    } catch {
      toast.error(TOAST.ALBUM.PHOTO_DELETE_ERROR);
      return false;
    }
  }

  // ── 사진 수정 ────────────────────────────────────────────

  function updatePhoto(
    albumId: string,
    photoId: string,
    patch: Partial<Omit<PhotoAlbumItem, "id" | "createdAt">>
  ): boolean {
    try {
      const stored = loadFromStorage<PhotoAlbum[]>(STORAGE_KEY(groupId), []);
      const next = stored.map((a) => {
        if (a.id !== albumId) return a;
        return {
          ...a,
          photos: a.photos.map((p) =>
            p.id === photoId ? { ...p, ...patch } : p
          ),
        };
      });
      saveToStorage(STORAGE_KEY(groupId), next);
      mutate(next, false);
      toast.success(TOAST.ALBUM.PHOTO_UPDATED);
      return true;
    } catch {
      toast.error(TOAST.ALBUM.PHOTO_UPDATE_ERROR);
      return false;
    }
  }

  // ── 필터 ─────────────────────────────────────────────────

  function getAlbumsByTag(tag: string): PhotoAlbum[] {
    if (!tag || tag === "all") return albums;
    return albums.filter((a) =>
      a.photos.some((p) => p.tags.includes(tag))
    );
  }

  function searchPhotos(
    query: string
  ): { album: PhotoAlbum; photo: PhotoAlbumItem }[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results: { album: PhotoAlbum; photo: PhotoAlbumItem }[] = [];
    for (const album of albums) {
      for (const photo of album.photos) {
        const matches =
          photo.title.toLowerCase().includes(q) ||
          photo.description.toLowerCase().includes(q) ||
          photo.tags.some((t) => t.toLowerCase().includes(q));
        if (matches) results.push({ album, photo });
      }
    }
    return results;
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalAlbums = albums.length;
  const totalPhotos = albums.reduce((sum, a) => sum + a.photos.length, 0);

  // 전체 고유 태그 목록
  const allTags = Array.from(
    new Set(albums.flatMap((a) => a.photos.flatMap((p) => p.tags)))
  ).sort();

  return {
    albums,
    // CRUD
    addAlbum,
    deleteAlbum,
    addPhoto,
    deletePhoto,
    updatePhoto,
    // 필터
    getAlbumsByTag,
    searchPhotos,
    // 통계
    totalAlbums,
    totalPhotos,
    allTags,
    // SWR
    refetch: () => mutate(),
  };
}
