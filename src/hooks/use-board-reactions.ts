"use client";

import { useCallback, useEffect, useState } from "react";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import {
  BOARD_REACTION_EMOJIS,
  type BoardReactionEmoji,
  type BoardReactionEntry,
  type BoardReactionsData,
} from "@/types";

const STORAGE_KEY_PREFIX = "dancebase:board-reactions:";

function getStorageKey(postId: string): string {
  return `${STORAGE_KEY_PREFIX}${postId}`;
}

function loadReactions(postId: string): BoardReactionsData {
  const parsed = loadFromStorage<BoardReactionsData>(getStorageKey(postId), []);
  // 유효성 검증: emoji 목록에 없는 항목 필터링
  return parsed.filter((entry) =>
    (BOARD_REACTION_EMOJIS as readonly string[]).includes(entry.emoji)
  );
}

function saveReactions(postId: string, data: BoardReactionsData): void {
  saveToStorage(getStorageKey(postId), data);
}

/**
 * 특정 postId에 대한 이모지 반응을 관리하는 훅.
 * localStorage 기반으로 동작합니다.
 */
export function useBoardReactions(postId: string, userId?: string) {
  const [reactions, setReactions] = useState<BoardReactionsData>(() =>
    loadReactions(postId)
  );

  // postId 변경 시 localStorage 재로드
  useEffect(() => {
    setReactions(loadReactions(postId));
  }, [postId]);

  /**
   * 이모지 반응을 토글합니다.
   * - userId가 이미 해당 이모지에 반응했으면 제거
   * - 없으면 추가
   */
  const toggleReaction = useCallback(
    (targetPostId: string, emoji: BoardReactionEmoji, targetUserId: string) => {
      setReactions((prev) => {
        const existing = prev.find((e) => e.emoji === emoji);
        let next: BoardReactionsData;

        if (existing) {
          const hasReacted = existing.userIds.includes(targetUserId);
          if (hasReacted) {
            // 반응 제거
            const updatedUserIds = existing.userIds.filter(
              (id) => id !== targetUserId
            );
            if (updatedUserIds.length === 0) {
              // userIds가 빈 경우 해당 이모지 항목 삭제
              next = prev.filter((e) => e.emoji !== emoji);
            } else {
              next = prev.map((e) =>
                e.emoji === emoji ? { ...e, userIds: updatedUserIds } : e
              );
            }
          } else {
            // 반응 추가
            next = prev.map((e) =>
              e.emoji === emoji
                ? { ...e, userIds: [...e.userIds, targetUserId] }
                : e
            );
          }
        } else {
          // 새 이모지 항목 생성
          next = [...prev, { emoji, userIds: [targetUserId] }];
        }

        saveReactions(targetPostId, next);
        return next;
      });
    },
    []
  );

  /**
   * 반응 목록 반환 (카운트 포함, 카운트 > 0인 항목만)
   */
  const getReactions = useCallback(
    (targetPostId: string): Array<BoardReactionEntry & { count: number }> => {
      const data = targetPostId === postId ? reactions : loadReactions(targetPostId);
      return data
        .filter((e) => e.userIds.length > 0)
        .map((e) => ({ ...e, count: e.userIds.length }));
    },
    [postId, reactions]
  );

  /**
   * 특정 userId가 해당 postId에 남긴 반응 이모지를 반환합니다.
   * 없으면 null
   */
  const getUserReaction = useCallback(
    (
      targetPostId: string,
      targetUserId: string
    ): BoardReactionEmoji | null => {
      const data =
        targetPostId === postId ? reactions : loadReactions(targetPostId);
      const found = data.find((e) => e.userIds.includes(targetUserId));
      return found ? found.emoji : null;
    },
    [postId, reactions]
  );

  /** 현재 사용자(userId)가 남긴 반응 (편의 프로퍼티) */
  const myReaction: BoardReactionEmoji | null =
    userId ? getUserReaction(postId, userId) : null;

  /** 현재 postId의 반응 목록 (카운트 포함) */
  const reactionList = reactions
    .filter((e) => e.userIds.length > 0)
    .map((e) => ({ ...e, count: e.userIds.length }));

  return {
    reactions,
    reactionList,
    myReaction,
    toggleReaction,
    getReactions,
    getUserReaction,
  };
}
