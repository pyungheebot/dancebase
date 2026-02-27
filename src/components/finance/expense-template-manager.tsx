"use client";

import { useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Play,
  Pencil,
  X,
  ChevronLeft,
} from "lucide-react";
import {
  useExpenseTemplates,
  type ExpenseTemplate,
  type ExpenseTemplateItem,
} from "@/hooks/use-expense-templates";
import type { FinanceCategory } from "@/types";

// ============================================
// Props
// ============================================

type ExpenseTemplateManagerProps = {
  groupId: string;
  projectId?: string | null;
  categories: FinanceCategory[];
};

// ============================================
// 빈 항목 생성
// ============================================

function createEmptyItem(): Omit<ExpenseTemplateItem, "id"> {
  return { description: "", amount: 0, categoryId: null };
}

// ============================================
// 편집 폼 패널
// ============================================

type EditFormProps = {
  initial?: ExpenseTemplate | null;
  categories: FinanceCategory[];
  onSave: (name: string, items: Omit<ExpenseTemplateItem, "id">[]) => void;
  onCancel: () => void;
};

function EditForm({ initial, categories, onSave, onCancel }: EditFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [items, setItems] = useState<Omit<ExpenseTemplateItem, "id">[]>(
    initial?.items.map(({ description, amount, categoryId }) => ({
      description,
      amount,
      categoryId,
    })) ?? [createEmptyItem()]
  );

  const addItem = () => setItems((prev) => [...prev, createEmptyItem()]);

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (
    idx: number,
    field: keyof Omit<ExpenseTemplateItem, "id">,
    value: string | number | null
  ) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const validItems = items.filter(
      (it) => it.description.trim() && it.amount > 0
    );
    if (validItems.length === 0) return;
    onSave(trimmedName, validItems);
  };

  const totalAmount = items.reduce((sum, it) => sum + (it.amount || 0), 0);
  const canSave =
    name.trim().length > 0 &&
    items.some((it) => it.description.trim() && it.amount > 0);

  return (
    <div className="flex flex-col gap-3">
      {/* 뒤로 가기 */}
      <button
        onClick={onCancel}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-fit"
      >
        <ChevronLeft className="h-3 w-3" />
        목록으로
      </button>

      {/* 템플릿 이름 */}
      <div className="space-y-1">
        <Label className="text-xs">템플릿 이름</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 월정기 지출"
          className="h-7 text-xs"
        />
      </div>

      {/* 항목 목록 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">항목</Label>
          <span className="text-[10px] text-muted-foreground">
            합계: {totalAmount.toLocaleString()}원
          </span>
        </div>

        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            {/* 설명 */}
            <Input
              value={item.description}
              onChange={(e) =>
                updateItem(idx, "description", e.target.value)
              }
              placeholder="설명"
              className="h-7 text-xs flex-1 min-w-0"
            />
            {/* 금액 */}
            <Input
              type="number"
              min={0}
              value={item.amount === 0 ? "" : item.amount}
              onChange={(e) =>
                updateItem(
                  idx,
                  "amount",
                  e.target.value === "" ? 0 : Number(e.target.value)
                )
              }
              placeholder="금액"
              className="h-7 text-xs w-24 shrink-0"
            />
            {/* 카테고리 (선택적) */}
            {categories.length > 0 && (
              <Select
                value={item.categoryId ?? "__none__"}
                onValueChange={(val) =>
                  updateItem(
                    idx,
                    "categoryId",
                    val === "__none__" ? null : val
                  )
                }
              >
                <SelectTrigger className="h-7 text-xs w-24 shrink-0">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">없음</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {/* 삭제 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(idx)}
              disabled={items.length === 1}
              aria-label="항목 삭제"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {/* 항목 추가 */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs w-full gap-1"
          onClick={addItem}
        >
          <Plus className="h-3 w-3" />
          항목 추가
        </Button>
      </div>

      {/* 저장 / 취소 */}
      <div className="flex gap-1.5 pt-1">
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={handleSave}
          disabled={!canSave}
        >
          저장
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function ExpenseTemplateManager({
  groupId,
  projectId,
  categories,
}: ExpenseTemplateManagerProps) {
  const {
    templates,
    applyingId,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
  } = useExpenseTemplates(groupId);

  const [open, setOpen] = useState(false);
  // null = 목록, "new" = 신규 생성, string = 편집 중인 템플릿 id
  const [editingId, setEditingId] = useState<string | "new" | null>(null);

  const editingTemplate =
    editingId && editingId !== "new"
      ? templates.find((t) => t.id === editingId) ?? null
      : null;

  const handleSave = useCallback(
    (name: string, items: Omit<ExpenseTemplateItem, "id">[]) => {
      if (editingId === "new") {
        createTemplate(name, items);
      } else if (editingId) {
        updateTemplate(editingId, name, items);
      }
      setEditingId(null);
    },
    [editingId, createTemplate, updateTemplate]
  );

  const handleApply = async (templateId: string) => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    await applyTemplate(templateId, { projectId, yearMonth });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          aria-label="지출 템플릿 관리"
        >
          <FileSpreadsheet className="h-3 w-3" />
          지출 템플릿
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md p-4 overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-sm flex items-center gap-1.5">
            <FileSpreadsheet className="h-4 w-4" />
            지출 템플릿 관리
          </SheetTitle>
        </SheetHeader>

        {/* 편집 폼 */}
        {editingId !== null ? (
          <EditForm
            initial={editingTemplate}
            categories={categories}
            onSave={handleSave}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          /* 목록 */
          <div className="flex flex-col gap-3">
            {/* 신규 템플릿 버튼 */}
            <Button
              size="sm"
              className="h-7 text-xs gap-1 w-full"
              onClick={() => setEditingId("new")}
            >
              <Plus className="h-3 w-3" />
              새 템플릿 만들기
            </Button>

            {templates.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                저장된 템플릿이 없습니다.
                <br />
                매월 반복되는 고정 지출을 등록해보세요.
              </p>
            ) : (
              <div className="rounded-lg border divide-y">
                {templates.map((tmpl) => {
                  const total = tmpl.items.reduce(
                    (sum, it) => sum + it.amount,
                    0
                  );
                  const isApplying = applyingId === tmpl.id;

                  return (
                    <div key={tmpl.id} className="px-3 py-2.5 space-y-1.5">
                      {/* 이름 + 배지 행 */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium truncate">
                          {tmpl.name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4"
                          >
                            {tmpl.items.length}건
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 text-red-600 border-red-200 bg-red-50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40"
                          >
                            -{total.toLocaleString()}원
                          </Badge>
                        </div>
                      </div>

                      {/* 항목 미리보기 */}
                      <div className="space-y-0.5">
                        {tmpl.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-[11px] text-muted-foreground"
                          >
                            <span className="truncate">{item.description}</span>
                            <span className="shrink-0 tabular-nums ml-2">
                              {item.amount.toLocaleString()}원
                            </span>
                          </div>
                        ))}
                        {tmpl.items.length > 3 && (
                          <p className="text-[10px] text-muted-foreground/60">
                            외 {tmpl.items.length - 3}건 더...
                          </p>
                        )}
                      </div>

                      {/* 액션 버튼 행 */}
                      <div className="flex items-center gap-1 pt-0.5">
                        {/* 이번 달 일괄 등록 */}
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1 flex-1"
                          onClick={() => handleApply(tmpl.id)}
                          disabled={isApplying}
                        >
                          <Play className="h-3 w-3" />
                          {isApplying ? "등록 중..." : "이번 달 일괄 등록"}
                        </Button>
                        {/* 편집 */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingId(tmpl.id)}
                          aria-label="템플릿 편집"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        {/* 삭제 */}
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteTemplate(tmpl.id)}
                          aria-label="템플릿 삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
