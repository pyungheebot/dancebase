"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupWishlistV2 } from "@/hooks/use-group-wishlist-v2";
import type { GroupWishCategory, GroupWishPriority, GroupWishItem } from "@/types";
import { ALL_CATEGORIES, ALL_PRIORITIES } from "./types";
import { CATEGORY_META, PRIORITY_META } from "./meta";

interface EditItemDialogProps {
  item: GroupWishItem;
  hook: ReturnType<typeof useGroupWishlistV2>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditItemDialog({ item, hook, open, onOpenChange }: EditItemDialogProps) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [category, setCategory] = useState<GroupWishCategory>(item.category);
  const [priority, setPriority] = useState<GroupWishPriority>(item.priority);
  const [estimatedCost, setEstimatedCost] = useState(
    item.estimatedCost > 0 ? String(item.estimatedCost) : ""
  );

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(TOAST.GROUP_WISHLIST.TITLE_REQUIRED);
      return;
    }
    const cost = estimatedCost ? parseInt(estimatedCost.replace(/,/g, ""), 10) : 0;
    const ok = hook.updateItem(item.id, {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      estimatedCost: isNaN(cost) ? 0 : cost,
    });
    if (ok) {
      toast.success(TOAST.GROUP_WISHLIST.UPDATED);
      onOpenChange(false);
    } else {
      toast.error(TOAST.UPDATE_ERROR);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Pencil className="h-4 w-4 text-violet-500" aria-hidden="true" />
            위시 수정
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <label htmlFor="wishlist-edit-title" className="text-[11px] font-medium text-gray-500">
              제목 <span className="text-red-400" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </label>
            <Input
              id="wishlist-edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 60))}
              className="h-7 text-xs"
              aria-required="true"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="wishlist-edit-description" className="text-[11px] font-medium text-gray-500">
              설명
            </label>
            <Textarea
              id="wishlist-edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              className="min-h-[56px] resize-none text-xs"
            />
          </div>

          <fieldset className="space-y-1">
            <legend className="text-[11px] font-medium text-gray-500">카테고리</legend>
            <div role="radiogroup" aria-label="카테고리 선택" className="flex flex-wrap gap-1.5">
              {ALL_CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                const selected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    aria-pressed={selected}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      selected
                        ? `${meta.bg} ${meta.border} ${meta.text} font-semibold`
                        : "border-gray-200 bg-background text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span aria-hidden="true">{meta.icon}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-1">
            <legend className="text-[11px] font-medium text-gray-500">우선순위</legend>
            <div role="radiogroup" aria-label="우선순위 선택" className="flex gap-1.5">
              {ALL_PRIORITIES.map((p) => {
                const meta = PRIORITY_META[p];
                const selected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    aria-pressed={selected}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      selected
                        ? `${meta.badge} border-transparent font-semibold`
                        : "border-gray-200 bg-background text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-1">
            <label htmlFor="wishlist-edit-cost" className="text-[11px] font-medium text-gray-500">
              예상 비용
            </label>
            <div className="relative">
              <Input
                id="wishlist-edit-cost"
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0"
                min={0}
                className="h-7 pr-6 text-xs"
                aria-label="예상 비용 (원)"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400" aria-hidden="true">원</span>
            </div>
          </div>

          <Button
            className="h-8 w-full bg-violet-500 text-xs hover:bg-violet-600"
            onClick={handleSubmit}
            disabled={!title.trim()}
          >
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
