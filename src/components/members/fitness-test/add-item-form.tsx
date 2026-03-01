"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FITNESS_CATEGORY_LABELS,
  FITNESS_CATEGORY_COLORS,
  FITNESS_CATEGORY_ORDER,
} from "@/hooks/use-fitness-test";
import type { FitnessTestCategory, AddItemFormProps } from "./types";

/**
 * 항목 관리 탭 - 새 테스트 항목 추가 폼
 */
export function AddItemForm({ onAdd }: AddItemFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FitnessTestCategory | "">("");
  const [unit, setUnit] = useState("");
  const [higherIsBetter, setHigherIsBetter] = useState(true);

  const nameId = "add-item-name";
  const unitId = "add-item-unit";
  const categoryGroupId = "add-item-category";
  const directionGroupId = "add-item-direction";

  function handleAdd() {
    if (!name.trim()) {
      toast.error(TOAST.MEMBERS.FITNESS_ITEM_NAME_REQUIRED);
      return;
    }
    if (!category) {
      toast.error(TOAST.MEMBERS.FITNESS_CATEGORY_REQUIRED);
      return;
    }
    if (!unit.trim()) {
      toast.error(TOAST.MEMBERS.FITNESS_UNIT_REQUIRED);
      return;
    }
    onAdd(name.trim(), category, unit.trim(), higherIsBetter);
    setName("");
    setCategory("");
    setUnit("");
    setHigherIsBetter(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAdd();
  }

  return (
    <fieldset className="rounded-md border bg-muted/20 px-3 py-3 space-y-2.5">
      <legend className="text-xs font-medium text-muted-foreground px-1">
        새 항목 추가
      </legend>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label htmlFor={nameId} className="text-[10px] text-muted-foreground">
            항목명
          </label>
          <Input
            id={nameId}
            placeholder="예: 앉아서 윗몸 굽히기"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 text-xs"
            aria-required="true"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={unitId} className="text-[10px] text-muted-foreground">
            단위
          </label>
          <Input
            id={unitId}
            placeholder="예: cm, 초, 회"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 text-xs"
            aria-required="true"
          />
        </div>
      </div>

      <div className="space-y-1" role="group" aria-labelledby={categoryGroupId}>
        <p
          id={categoryGroupId}
          className="text-[10px] text-muted-foreground"
        >
          카테고리
        </p>
        <div className="flex flex-wrap gap-1.5">
          {FITNESS_CATEGORY_ORDER.map((cat) => {
            const colors = FITNESS_CATEGORY_COLORS[cat];
            const isSelected = category === cat;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setCategory(cat)}
                className={`text-[11px] px-2 py-1 rounded-md border font-medium transition-colors ${
                  isSelected
                    ? `${colors.badge} border-current`
                    : "bg-background text-muted-foreground border-border hover:bg-accent"
                }`}
              >
                {FITNESS_CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1" role="group" aria-labelledby={directionGroupId}>
        <p
          id={directionGroupId}
          className="text-[10px] text-muted-foreground"
        >
          방향
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-pressed={higherIsBetter}
            onClick={() => setHigherIsBetter(true)}
            className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
              higherIsBetter
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            높을수록 좋음
          </button>
          <button
            type="button"
            aria-pressed={!higherIsBetter}
            onClick={() => setHigherIsBetter(false)}
            className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
              !higherIsBetter
                ? "bg-orange-100 text-orange-700 border-orange-300"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            낮을수록 좋음
          </button>
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs w-full"
        onClick={handleAdd}
        aria-label="항목 추가"
      >
        <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
        항목 추가
      </Button>
    </fieldset>
  );
}
