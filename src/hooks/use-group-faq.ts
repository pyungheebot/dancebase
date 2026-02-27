"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useEntitySettings } from "@/hooks/use-entity-settings";
import {
  GROUP_FAQ_SETTING_KEY,
  DEFAULT_GROUP_FAQ_SETTING,
  type GroupFaq,
  type GroupFaqSettingValue,
} from "@/types";

export function useGroupFaq(groupId: string) {
  const {
    value,
    loading,
    save,
    refetch,
  } = useEntitySettings<GroupFaqSettingValue>(
    { entityType: "group", entityId: groupId, key: GROUP_FAQ_SETTING_KEY },
    DEFAULT_GROUP_FAQ_SETTING
  );

  const faqs = value.faqs ?? [];

  const addFaq = useCallback(
    async (faq: Omit<GroupFaq, "id" | "order">) => {
      const newFaq: GroupFaq = {
        id: crypto.randomUUID(),
        question: faq.question,
        answer: faq.answer,
        order: faqs.length,
      };

      const newFaqs = [...faqs, newFaq];
      const { error } = await save({ faqs: newFaqs });

      if (error) {
        toast.error("FAQ 추가에 실패했습니다");
        return false;
      }

      toast.success("FAQ가 추가되었습니다");
      return true;
    },
    [faqs, save]
  );

  const updateFaq = useCallback(
    async (id: string, updates: Partial<Omit<GroupFaq, "id" | "order">>) => {
      const newFaqs = faqs.map((faq) =>
        faq.id === id ? { ...faq, ...updates } : faq
      );
      const { error } = await save({ faqs: newFaqs });

      if (error) {
        toast.error("FAQ 수정에 실패했습니다");
        return false;
      }

      toast.success("FAQ가 수정되었습니다");
      return true;
    },
    [faqs, save]
  );

  const deleteFaq = useCallback(
    async (id: string) => {
      const newFaqs = faqs
        .filter((faq) => faq.id !== id)
        .map((faq, index) => ({ ...faq, order: index }));
      const { error } = await save({ faqs: newFaqs });

      if (error) {
        toast.error("FAQ 삭제에 실패했습니다");
        return false;
      }

      toast.success("FAQ가 삭제되었습니다");
      return true;
    },
    [faqs, save]
  );

  const moveFaq = useCallback(
    async (id: string, direction: "up" | "down") => {
      const index = faqs.findIndex((faq) => faq.id === id);
      if (index === -1) return false;
      if (direction === "up" && index === 0) return false;
      if (direction === "down" && index === faqs.length - 1) return false;

      const newFaqs = [...faqs];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      [newFaqs[index], newFaqs[swapIndex]] = [
        newFaqs[swapIndex],
        newFaqs[index],
      ];

      const reordered = newFaqs.map((faq, i) => ({ ...faq, order: i }));
      const { error } = await save({ faqs: reordered });

      if (error) {
        toast.error("순서 변경에 실패했습니다");
        return false;
      }

      return true;
    },
    [faqs, save]
  );

  return {
    faqs,
    loading,
    addFaq,
    updateFaq,
    deleteFaq,
    moveFaq,
    refetch,
  };
}
