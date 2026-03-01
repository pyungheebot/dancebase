"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { GroupBudgetCategory } from "@/types";

// ============================================================
// Props
// ============================================================

export type CategoryManagerDialogProps = {
  open: boolean;
  onClose: () => void;
  categories: GroupBudgetCategory[];
  onAdd: (cat: GroupBudgetCategory) => Promise<void>;
  onRemove: (name: string) => Promise<void>;
};

// ============================================================
// 컴포넌트
// ============================================================

export function CategoryManagerDialog({
  open,
  onClose,
  categories,
  onAdd,
  onRemove,
}: CategoryManagerDialogProps) {
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📌");

  const titleId = "category-manager-dialog-title";
  const listId = "category-list";

  async function handleAdd() {
    if (!newName.trim()) {
      toast.error(TOAST.GROUP_BUDGET.CATEGORY_NAME_REQUIRED);
      return;
    }
    await onAdd({ name: newName.trim(), icon: newIcon });
    toast.success(TOAST.GROUP_BUDGET.CATEGORY_ADDED);
    setNewName("");
    setNewIcon("📌");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" aria-labelledby={titleId}>
        <DialogHeader>
          <DialogTitle id={titleId} className="text-sm">
            카테고리 관리
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* 기존 카테고리 목록 */}
          <div
            id={listId}
            className="max-h-48 space-y-1 overflow-y-auto"
            role="list"
            aria-label="등록된 카테고리 목록"
          >
            {categories.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">
                카테고리가 없습니다
              </p>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.name}
                  role="listitem"
                  className="flex items-center justify-between rounded-md border px-2 py-1.5"
                >
                  <span className="text-xs" aria-label={`${cat.name} 카테고리`}>
                    {cat.icon} {cat.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                    onClick={() => onRemove(cat.name)}
                    aria-label={`${cat.name} 카테고리 삭제`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <Separator />

          {/* 새 카테고리 추가 */}
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-muted-foreground">
              새 카테고리
            </legend>
            <div className="flex gap-2">
              <Input
                className="h-8 w-14 text-center text-base"
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                maxLength={2}
                aria-label="카테고리 아이콘 (이모지)"
                title="아이콘 (이모지)"
              />
              <Input
                className="h-8 flex-1 text-xs"
                placeholder="카테고리명"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="카테고리 이름"
              />
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleAdd}
                aria-label="카테고리 추가"
              >
                추가
              </Button>
            </div>
          </fieldset>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
