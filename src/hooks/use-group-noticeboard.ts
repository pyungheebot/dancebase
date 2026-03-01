"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import {
  NOTICEBOARD_STORAGE_KEY,
  DEFAULT_NOTICEBOARD_DATA,
  NOTICEBOARD_POST_CATEGORIES,
  type NoticeboardPost,
  type NoticeboardPostCategory,
  type NoticeboardComment,
  type NoticeboardData,
} from "@/types";

const STORAGE_KEY = (groupId: string) => `${NOTICEBOARD_STORAGE_KEY}_${groupId}`;

export function useGroupNoticeboard(groupId: string) {
  const swrKey = swrKeys.groupNoticeboard(groupId);

  const { data, isLoading, mutate } = useSWR(swrKey, () =>
    loadFromStorage<NoticeboardData>(STORAGE_KEY(groupId), DEFAULT_NOTICEBOARD_DATA)
  );

  const value = data ?? DEFAULT_NOTICEBOARD_DATA;

  // 최신순 정렬
  const posts = [...(value.posts ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const persist = useCallback((newValue: NoticeboardData): boolean => {
    try {
      saveToStorage(STORAGE_KEY(groupId), newValue);
      return true;
    } catch {
      return false;
    }
  }, [groupId]);

  // 게시글 추가
  const addPost = useCallback(
    async (input: {
      title: string;
      content: string;
      authorName: string;
      category: NoticeboardPostCategory;
    }) => {
      const newPost: NoticeboardPost = {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        content: input.content.trim(),
        authorName: input.authorName.trim(),
        category: input.category,
        createdAt: new Date().toISOString(),
        comments: [],
      };
      const newValue: NoticeboardData = {
        posts: [...(value.posts ?? []), newPost],
      };
      if (!persist(newValue)) {
        toast.error(TOAST.BOARD.CREATE_ERROR);
        return false;
      }
      await mutate(newValue);
      toast.success(TOAST.BOARD.CREATED);
      return true;
    },
    [value, persist, mutate]
  );

  // 게시글 수정
  const updatePost = useCallback(
    async (
      id: string,
      updates: Partial<Pick<NoticeboardPost, "title" | "content" | "authorName" | "category">>
    ) => {
      const newPosts = (value.posts ?? []).map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      const newValue: NoticeboardData = { posts: newPosts };
      if (!persist(newValue)) {
        toast.error(TOAST.BOARD.UPDATE_ERROR);
        return false;
      }
      await mutate(newValue);
      toast.success(TOAST.BOARD.UPDATED);
      return true;
    },
    [value, persist, mutate]
  );

  // 게시글 삭제
  const deletePost = useCallback(
    async (id: string) => {
      const newPosts = (value.posts ?? []).filter((p) => p.id !== id);
      const newValue: NoticeboardData = { posts: newPosts };
      if (!persist(newValue)) {
        toast.error(TOAST.BOARD.DELETE_ERROR);
        return false;
      }
      await mutate(newValue);
      toast.success(TOAST.BOARD.DELETED);
      return true;
    },
    [value, persist, mutate]
  );

  // 댓글 추가
  const addComment = useCallback(
    async (
      postId: string,
      input: { authorName: string; content: string }
    ) => {
      const newComment: NoticeboardComment = {
        id: crypto.randomUUID(),
        authorName: input.authorName.trim(),
        content: input.content.trim(),
        createdAt: new Date().toISOString(),
      };
      const newPosts = (value.posts ?? []).map((p) =>
        p.id === postId
          ? { ...p, comments: [...p.comments, newComment] }
          : p
      );
      const newValue: NoticeboardData = { posts: newPosts };
      if (!persist(newValue)) {
        toast.error(TOAST.BOARD.COMMENT_CREATE_ERROR);
        return false;
      }
      await mutate(newValue);
      toast.success(TOAST.BOARD.COMMENT_CREATED);
      return true;
    },
    [value, persist, mutate]
  );

  // 댓글 삭제
  const deleteComment = useCallback(
    async (postId: string, commentId: string) => {
      const newPosts = (value.posts ?? []).map((p) =>
        p.id === postId
          ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
          : p
      );
      const newValue: NoticeboardData = { posts: newPosts };
      if (!persist(newValue)) {
        toast.error(TOAST.BOARD.COMMENT_DELETE_ERROR);
        return false;
      }
      await mutate(newValue);
      toast.success(TOAST.BOARD.COMMENT_DELETED);
      return true;
    },
    [value, persist, mutate]
  );

  // 카테고리별 통계
  const categoryStats = NOTICEBOARD_POST_CATEGORIES.map((cat) => ({
    category: cat,
    count: (value.posts ?? []).filter((p) => p.category === cat).length,
  }));

  const totalCount = (value.posts ?? []).length;

  return {
    posts,
    totalCount,
    loading: isLoading,
    addPost,
    updatePost,
    deletePost,
    addComment,
    deleteComment,
    categoryStats,
    refetch: () => mutate(),
  };
}
