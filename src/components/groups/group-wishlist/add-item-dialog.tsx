"use client";

import { useState } from "react";
import { Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupWishlistV2 } from "@/hooks/use-group-wishlist-v2";
import type { GroupWishCategory, GroupWishPriority } from "@/types";
import { ALL_CATEGORIES, ALL_PRIORITIES } from "./types";
import { CATEGORY_META, PRIORITY_META } from "./meta";

interface AddItemDialogProps {
  hook: ReturnType<typeof useGroupWishlistV2>;
}

export function AddItemDialog({ hook }: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GroupWishCategory>("practice_song");
  const [priority, setPriority] = useState<GroupWishPriority>("medium");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [proposedBy, setProposedBy] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(TOAST.GROUP_WISHLIST.TITLE_REQUIRED);
      return;
    }
    if (!proposedBy.trim()) {
      toast.error(TOAST.GROUP_WISHLIST.PROPOSER_REQUIRED);
      return;
    }
    const cost = estimatedCost ? parseInt(estimatedCost.replace(/,/g, ""), 10) : 0;
    const ok = hook.addItem(title, description, category, priority, isNaN(cost) ? 0 : cost, proposedBy);
    if (ok) {
      toast.success(TOAST.GROUP_WISHLIST.ADDED);
      setTitle("");
      setDescription("");
      setCategory("practice_song");
      setPriority("medium");
      setEstimatedCost("");
      setProposedBy("");
      setOpen(false);
    } else {
      toast.error(TOAST.GROUP_WISHLIST.ADD_ERROR);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 bg-violet-500 text-xs hover:bg-violet-600">
          <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
          추가
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-violet-500" aria-hidden="true" />
            새 위시 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 제목 */}
          <div className="space-y-1">
            <label htmlFor="wishlist-add-title" className="text-[11px] font-medium text-gray-500">
              제목 <span className="text-red-400" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </label>
            <Input
              id="wishlist-add-title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 60))}
              placeholder="예: BTS 작은 것들을 위한 시"
              className="h-7 text-xs"
              aria-required="true"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label htmlFor="wishlist-add-description" className="text-[11px] font-medium text-gray-500">
              설명 (선택)
            </label>
            <Textarea
              id="wishlist-add-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder="추가 설명을 입력하세요"
              className="min-h-[56px] resize-none text-xs"
              aria-describedby="wishlist-add-description-count"
            />
            <p id="wishlist-add-description-count" className="text-right text-[10px] text-gray-400" aria-live="polite">
              {description.length}/200
            </p>
          </div>

          {/* 카테고리 */}
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

          {/* 우선순위 */}
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

          {/* 예상 비용 */}
          <div className="space-y-1">
            <label htmlFor="wishlist-add-cost" className="text-[11px] font-medium text-gray-500">
              예상 비용 (선택)
            </label>
            <div className="relative">
              <Input
                id="wishlist-add-cost"
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

          {/* 제안자 */}
          <div className="space-y-1">
            <label htmlFor="wishlist-add-proposedBy" className="text-[11px] font-medium text-gray-500">
              제안자 <span className="text-red-400" aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </label>
            <Input
              id="wishlist-add-proposedBy"
              value={proposedBy}
              onChange={(e) => setProposedBy(e.target.value.slice(0, 20))}
              placeholder="본인 이름을 입력하세요"
              className="h-7 text-xs"
              aria-required="true"
            />
          </div>

          <Button
            className="h-8 w-full bg-violet-500 text-xs hover:bg-violet-600"
            onClick={handleSubmit}
            disabled={!title.trim() || !proposedBy.trim()}
          >
            추가하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
