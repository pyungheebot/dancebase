"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import {
  GROUP_FAQ_SETTING_KEY,
  DEFAULT_GROUP_FAQ_SETTING,
  GROUP_FAQ_CATEGORIES,
  type GroupFaq,
  type GroupFaqCategory,
  type GroupFaqSettingValue,
} from "@/types";

const STORAGE_KEY = (groupId: string) => `${GROUP_FAQ_SETTING_KEY}_${groupId}`;

export function useGroupFaq(groupId: string) {
  const swrKey = swrKeys.groupFaq(groupId);

  const { data, isLoading, mutate } = useSWR(swrKey, () =>
    loadFromStorage<GroupFaqSettingValue>(STORAGE_KEY(groupId), DEFAULT_GROUP_FAQ_SETTING)
  );

  const value = data ?? DEFAULT_GROUP_FAQ_SETTING;

  // 고정 항목 먼저, 그 다음 order 순 정렬
  const faqs = [...(value.faqs ?? [])].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return a.order - b.order;
  });

  const persist = useCallback((newValue: GroupFaqSettingValue): boolean => {
    try {
      saveToStorage(STORAGE_KEY(groupId), newValue);
      return true;
    } catch {
      return false;
    }
  }, [groupId]);

  const addFaq = useCallback(
    async (faq: {
      question: string;
      answer: string;
      category: GroupFaqCategory;
      authorName: string;
    }) => {
      const nonPinned = (value.faqs ?? []).filter((f) => !f.pinned);
      const newFaq: GroupFaq = {
        id: crypto.randomUUID(),
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        authorName: faq.authorName,
        createdAt: new Date().toISOString(),
        pinned: false,
        order: nonPinned.length,
      };

      const newValue: GroupFaqSettingValue = {
        faqs: [...(value.faqs ?? []), newFaq],
      };

      if (!persist(newValue)) {
        toast.error(TOAST.FAQ.ADD_ERROR);
        return false;
      }

      await mutate(newValue);
      toast.success(TOAST.FAQ.ADDED);
      return true;
    },
    [value, persist, mutate]
  );

  const updateFaq = useCallback(
    async (
      id: string,
      updates: Partial<Omit<GroupFaq, "id" | "order" | "createdAt">>
    ) => {
      const newFaqs = (value.faqs ?? []).map((faq) =>
        faq.id === id ? { ...faq, ...updates } : faq
      );
      const newValue: GroupFaqSettingValue = { faqs: newFaqs };

      if (!persist(newValue)) {
        toast.error(TOAST.FAQ.UPDATE_ERROR);
        return false;
      }

      await mutate(newValue);
      toast.success(TOAST.FAQ.UPDATED);
      return true;
    },
    [value, persist, mutate]
  );

  const deleteFaq = useCallback(
    async (id: string) => {
      const newFaqs = (value.faqs ?? [])
        .filter((faq) => faq.id !== id)
        .map((faq, index) => ({ ...faq, order: index }));
      const newValue: GroupFaqSettingValue = { faqs: newFaqs };

      if (!persist(newValue)) {
        toast.error(TOAST.FAQ.DELETE_ERROR);
        return false;
      }

      await mutate(newValue);
      toast.success(TOAST.FAQ.DELETED);
      return true;
    },
    [value, persist, mutate]
  );

  const togglePin = useCallback(
    async (id: string) => {
      const newFaqs = (value.faqs ?? []).map((faq) =>
        faq.id === id ? { ...faq, pinned: !faq.pinned } : faq
      );
      const newValue: GroupFaqSettingValue = { faqs: newFaqs };

      if (!persist(newValue)) {
        toast.error(TOAST.BOARD.PIN_ERROR);
        return false;
      }

      await mutate(newValue);
      return true;
    },
    [value, persist, mutate]
  );

  const moveFaq = useCallback(
    async (id: string, direction: "up" | "down") => {
      // 비고정 항목만 순서 조정
      const pinned = (value.faqs ?? []).filter((f) => f.pinned);
      const unpinned = (value.faqs ?? []).filter((f) => !f.pinned);
      const index = unpinned.findIndex((faq) => faq.id === id);
      if (index === -1) return false;
      if (direction === "up" && index === 0) return false;
      if (direction === "down" && index === unpinned.length - 1) return false;

      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [unpinned[index], unpinned[swapIndex]] = [
        unpinned[swapIndex],
        unpinned[index],
      ];

      const reordered = unpinned.map((faq, i) => ({ ...faq, order: i }));
      const newValue: GroupFaqSettingValue = {
        faqs: [...pinned, ...reordered],
      };

      if (!persist(newValue)) {
        toast.error(TOAST.ORDER_ERROR);
        return false;
      }

      await mutate(newValue);
      return true;
    },
    [value, persist, mutate]
  );

  // 카테고리별 항목 수 통계
  const categoryStats = GROUP_FAQ_CATEGORIES.map((cat) => ({
    category: cat,
    count: (value.faqs ?? []).filter((f) => f.category === cat).length,
  }));

  return {
    faqs,
    loading: isLoading,
    addFaq,
    updateFaq,
    deleteFaq,
    togglePin,
    moveFaq,
    categoryStats,
    refetch: () => mutate(),
  };
}
