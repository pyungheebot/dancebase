"use client";

import { useState, useCallback } from "react";
import type { ShowGalleryAlbum, ShowGalleryPhoto, ShowGalleryCategory } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:show-gallery:${groupId}:${projectId}`;
}

// ============================================================
// 통계 타입
// ============================================================

export type ShowGalleryStats = {
  totalAlbums: number;
  totalPhotos: number;
  favoriteCount: number;
};

// ============================================================
// 훅
// ============================================================

export function useShowGallery(groupId: string, projectId: string) {
  const [albums, setAlbums] = useState<ShowGalleryAlbum[]>(() => loadFromStorage<ShowGalleryAlbum[]>(storageKey(groupId, projectId), []));

  const reload = useCallback(() => {
    if (!groupId || !projectId) return;
    const data = loadFromStorage<ShowGalleryAlbum[]>(storageKey(groupId, projectId), []);
    setAlbums(data);
  }, [groupId, projectId]);

  const persist = useCallback(
    (next: ShowGalleryAlbum[]) => {
      saveToStorage(storageKey(groupId, projectId), next);
      setAlbums(next);
    },
    [groupId, projectId]
  );

  // 앨범 생성
  const createAlbum = useCallback(
    (name: string, description?: string): ShowGalleryAlbum => {
      const album: ShowGalleryAlbum = {
        id: crypto.randomUUID(),
        name,
        description,
        photos: [],
        createdAt: new Date().toISOString(),
      };
      persist([...albums, album]);
      return album;
    },
    [albums, persist]
  );

  // 앨범 삭제
  const deleteAlbum = useCallback(
    (albumId: string): boolean => {
      const next = albums.filter((a) => a.id !== albumId);
      if (next.length === albums.length) return false;
      persist(next);
      return true;
    },
    [albums, persist]
  );

  // 사진 추가
  const addPhoto = useCallback(
    (
      albumId: string,
      title: string,
      description: string | undefined,
      category: ShowGalleryCategory,
      photographer: string | undefined,
      tags: string[]
    ): ShowGalleryPhoto | null => {
      const albumIdx = albums.findIndex((a) => a.id === albumId);
      if (albumIdx === -1) return null;

      const photo: ShowGalleryPhoto = {
        id: crypto.randomUUID(),
        title,
        description: description || undefined,
        category,
        photographer: photographer || undefined,
        tags,
        likes: [],
        isFavorite: false,
        uploadedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const next = [...albums];
      const updatedAlbum = {
        ...next[albumIdx],
        photos: [...next[albumIdx].photos, photo],
      };
      // 첫 번째 사진이면 커버로 설정
      if (!updatedAlbum.coverPhotoId) {
        updatedAlbum.coverPhotoId = photo.id;
      }
      next[albumIdx] = updatedAlbum;
      persist(next);
      return photo;
    },
    [albums, persist]
  );

  // 사진 삭제
  const deletePhoto = useCallback(
    (albumId: string, photoId: string): boolean => {
      const albumIdx = albums.findIndex((a) => a.id === albumId);
      if (albumIdx === -1) return false;

      const album = albums[albumIdx];
      const filtered = album.photos.filter((p) => p.id !== photoId);
      if (filtered.length === album.photos.length) return false;

      const next = [...albums];
      const updatedAlbum = { ...album, photos: filtered };
      // 커버가 삭제된 경우 다음 사진으로 변경
      if (album.coverPhotoId === photoId) {
        updatedAlbum.coverPhotoId =
          filtered.length > 0 ? filtered[0].id : undefined;
      }
      next[albumIdx] = updatedAlbum;
      persist(next);
      return true;
    },
    [albums, persist]
  );

  // 좋아요 토글
  const toggleLike = useCallback(
    (albumId: string, photoId: string, memberName: string): boolean => {
      const albumIdx = albums.findIndex((a) => a.id === albumId);
      if (albumIdx === -1) return false;

      const photoIdx = albums[albumIdx].photos.findIndex(
        (p) => p.id === photoId
      );
      if (photoIdx === -1) return false;

      const photo = albums[albumIdx].photos[photoIdx];
      const alreadyLiked = photo.likes.includes(memberName);
      const updatedLikes = alreadyLiked
        ? photo.likes.filter((l) => l !== memberName)
        : [...photo.likes, memberName];

      const next = [...albums];
      const updatedPhotos = [...next[albumIdx].photos];
      updatedPhotos[photoIdx] = { ...photo, likes: updatedLikes };
      next[albumIdx] = { ...next[albumIdx], photos: updatedPhotos };
      persist(next);
      return true;
    },
    [albums, persist]
  );

  // 즐겨찾기 토글
  const toggleFavorite = useCallback(
    (albumId: string, photoId: string): boolean => {
      const albumIdx = albums.findIndex((a) => a.id === albumId);
      if (albumIdx === -1) return false;

      const photoIdx = albums[albumIdx].photos.findIndex(
        (p) => p.id === photoId
      );
      if (photoIdx === -1) return false;

      const photo = albums[albumIdx].photos[photoIdx];
      const next = [...albums];
      const updatedPhotos = [...next[albumIdx].photos];
      updatedPhotos[photoIdx] = { ...photo, isFavorite: !photo.isFavorite };
      next[albumIdx] = { ...next[albumIdx], photos: updatedPhotos };
      persist(next);
      return true;
    },
    [albums, persist]
  );

  // 카테고리별 사진 조회 (전체 앨범 통합)
  const getByCategory = useCallback(
    (category: ShowGalleryCategory): ShowGalleryPhoto[] => {
      return albums.flatMap((a) =>
        a.photos.filter((p) => p.category === category)
      );
    },
    [albums]
  );

  // 통계
  const stats: ShowGalleryStats = (() => {
    const totalPhotos = albums.reduce((sum, a) => sum + a.photos.length, 0);
    const favoriteCount = albums.reduce(
      (sum, a) => sum + a.photos.filter((p) => p.isFavorite).length,
      0
    );
    return {
      totalAlbums: albums.length,
      totalPhotos,
      favoriteCount,
    };
  })();

  return {
    albums,
    loading: false,
    createAlbum,
    deleteAlbum,
    addPhoto,
    deletePhoto,
    toggleLike,
    toggleFavorite,
    getByCategory,
    stats,
    refetch: reload,
  };
}
