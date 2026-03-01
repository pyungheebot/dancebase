"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { invalidateFinance } from "@/lib/swr/invalidate";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

// ============================================
// 타입 정의
// ============================================

export type ExpenseTemplateItem = {
  id: string;
  description: string;
  amount: number;
  categoryId?: string | null;
};

export type ExpenseTemplate = {
  id: string;
  name: string;
  items: ExpenseTemplateItem[];
};

// ============================================
// localStorage 유틸리티
// ============================================

function getStorageKey(groupId: string): string {
  return `expense-templates-${groupId}`;
}

function loadTemplates(groupId: string): ExpenseTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as ExpenseTemplate[];
  } catch {
    return [];
  }
}

function saveTemplates(groupId: string, templates: ExpenseTemplate[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(groupId), JSON.stringify(templates));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================
// 훅
// ============================================

export function useExpenseTemplates(groupId: string) {
  const [templates, setTemplates] = useState<ExpenseTemplate[]>([]);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  // 마운트 시 로드


  // ---- CRUD ----

  const createTemplate = useCallback(
    (name: string, items: Omit<ExpenseTemplateItem, "id">[]) => {
      const newTemplate: ExpenseTemplate = {
        id: generateId(),
        name,
        items: items.map((item) => ({ ...item, id: generateId() })),
      };
      const updated = [...loadTemplates(groupId), newTemplate];
      saveTemplates(groupId, updated);
      setTemplates(updated);
      return newTemplate;
    },
    [groupId]
  );

  const updateTemplate = useCallback(
    (id: string, name: string, items: Omit<ExpenseTemplateItem, "id">[]) => {
      const current = loadTemplates(groupId);
      const updated = current.map((t) =>
        t.id === id
          ? {
              ...t,
              name,
              items: items.map((item) => ({ ...item, id: generateId() })),
            }
          : t
      );
      saveTemplates(groupId, updated);
      setTemplates(updated);
    },
    [groupId]
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      const current = loadTemplates(groupId);
      const updated = current.filter((t) => t.id !== id);
      saveTemplates(groupId, updated);
      setTemplates(updated);
    },
    [groupId]
  );

  // ---- 일괄 등록 ----

  const applyTemplate = useCallback(
    async (
      templateId: string,
      options: {
        projectId?: string | null;
        yearMonth?: string; // "YYYY-MM" — 기본값: 현재 월
      } = {}
    ) => {
      const template = templates.find((t) => t.id === templateId);
      if (!template || template.items.length === 0) {
        toast.error(TOAST.TEMPLATE.EMPTY);
        return false;
      }

      setApplyingId(templateId);

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error(TOAST.LOGIN_REQUIRED);
          return false;
        }

        // 날짜 결정: 해당 월 1일
        const yearMonth =
          options.yearMonth ??
          new Date().toISOString().slice(0, 7);
        const transactionDate = `${yearMonth}-01`;

        const rows = template.items.map((item) => ({
          group_id: groupId,
          project_id: options.projectId ?? null,
          category_id: item.categoryId ?? null,
          type: "expense" as const,
          amount: item.amount,
          title: item.description,
          description: null,
          transaction_date: transactionDate,
          created_by: user.id,
          paid_by: null,
        }));

        const { error } = await supabase
          .from("finance_transactions")
          .insert(rows);

        if (error) {
          toast.error(`일괄 등록 실패: ${error.message}`);
          return false;
        }

        toast.success(
          `${template.name} - ${template.items.length}건 등록 완료`
        );
        invalidateFinance(groupId, options.projectId);
        return true;
      } finally {
        setApplyingId(null);
      }
    },
    [groupId, templates]
  );

  return {
    templates,
    applyingId,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
  };
}
