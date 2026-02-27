"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
import type { PhotoAlbum, PhotoAlbumItem } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

function loadData(groupId: string): PhotoAlbum[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`dancebase:photo-albums:${groupId}`);
    if (!raw) return [];
    return JSON.parse(raw) as PhotoAlbum[];
  } catch {
    return [];
  }
}

function saveData(groupId: string, data: PhotoAlbum[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `dancebase:photo-albums:${groupId}`,
      JSON.stringify(data)
    );
  } catch {
    /* ignore */
  }
}

// ─── 훅 ─────────────────────────────────────────────────────

export function usePhotoAlbum(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.photoAlbum(groupId) : null,
    () => loadData(groupId),
    { revalidateOnFocus: false }
  );

  const albums = data ?? [];

  // ── 앨범 추가 ────────────────────────────────────────────

  function addAlbum(input: { name: string; coverUrl?: string }): boolean {
    if (!input.name.trim()) {
      toast.error("앨범 이름을 입력해주세요.");
      return false;
    }
    try {
      const stored = loadData(groupId);
      const newAlbum: PhotoAlbum = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        coverUrl: input.coverUrl?.trim() ?? "",
        photos: [],
        createdAt: new Date().toISOString(),
      };
      const next = [...stored, newAlbum];
      saveData(groupId, next);
      mutate(next, false);
      toast.success("앨범이 생성되었습니다.");
      return true;
    } catch {
      toast.error("앨범 생성에 실패했습니다.");
      return false;
    }
  }

  // ── 앨범 삭제 ────────────────────────────────────────────

  function deleteAlbum(albumId: string): boolean {
    try {
      const stored = loadData(groupId);
      const next = stored.filter((a) => a.id !== albumId);
      if (next.length === stored.length) return false;
      saveData(groupId, next);
      mutate(next, false);
      toast.success("앨범이 삭제되었습니다.");
      return true;
    } catch {
      toast.error("앨범 삭제에 실패했습니다.");
      return false;
    }
  }

  // ── 사진 추가 ────────────────────────────────────────────

  function addPhoto(
    albumId: string,
    input: Omit<PhotoAlbumItem, "id" | "createdAt">
  ): boolean {
    if (!input.title.trim()) {
      toast.error("사진 제목을 입력해주세요.");
      return false;
    }
    try {
      const stored = loadData(groupId);
      const album = stored.find((a) => a.id === albumId);
      if (!album) {
        toast.error("앨범을 찾을 수 없습니다.");
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
      saveData(groupId, next);
      mutate(next, false);
      toast.success("사진이 추가되었습니다.");
      return true;
    } catch {
      toast.error("사진 추가에 실패했습니다.");
      return false;
    }
  }

  // ── 사진 삭제 ────────────────────────────────────────────

  function deletePhoto(albumId: string, photoId: string): boolean {
    try {
      const stored = loadData(groupId);
      const next = stored.map((a) =>
        a.id === albumId
          ? { ...a, photos: a.photos.filter((p) => p.id !== photoId) }
          : a
      );
      saveData(groupId, next);
      mutate(next, false);
      toast.success("사진이 삭제되었습니다.");
      return true;
    } catch {
      toast.error("사진 삭제에 실패했습니다.");
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
      const stored = loadData(groupId);
      const next = stored.map((a) => {
        if (a.id !== albumId) return a;
        return {
          ...a,
          photos: a.photos.map((p) =>
            p.id === photoId ? { ...p, ...patch } : p
          ),
        };
      });
      saveData(groupId, next);
      mutate(next, false);
      toast.success("사진이 수정되었습니다.");
      return true;
    } catch {
      toast.error("사진 수정에 실패했습니다.");
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
