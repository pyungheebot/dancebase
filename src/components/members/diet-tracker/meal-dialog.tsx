"use client";

import { useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DietMealType } from "@/types";
import { MEAL_TYPE_LABEL, MEAL_TYPE_ORDER, type MealForm } from "./types";
import { FoodTagInput } from "./food-tag-input";

interface MealDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  isEditing: boolean;
  form: MealForm;
  setForm: React.Dispatch<React.SetStateAction<MealForm>>;
}

export function MealDialog({
  open,
  onClose,
  onSave,
  isEditing,
  form,
  setForm,
}: MealDialogProps) {
  const mealTypeId = useId();
  const timeId = useId();
  const foodsId = useId();
  const caloriesId = useId();
  const proteinId = useId();
  const notesId = useId();
  const formDescId = useId();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm"
        aria-describedby={formDescId}
      >
        <DialogHeader>
          <DialogTitle className="text-sm">
            {isEditing ? "식사 수정" : "식사 추가"}
          </DialogTitle>
        </DialogHeader>

        <p id={formDescId} className="sr-only">
          {isEditing
            ? "기존 식사 기록을 수정하는 폼입니다."
            : "새로운 식사 기록을 추가하는 폼입니다. 음식 목록은 필수 항목입니다."}
        </p>

        <fieldset className="space-y-3 border-0 p-0 m-0">
          <legend className="sr-only">식사 정보 입력</legend>

          {/* 식사 유형 */}
          <div className="space-y-1">
            <label
              htmlFor={mealTypeId}
              className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
            >
              식사 유형
            </label>
            <Select
              value={form.mealType}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, mealType: v as DietMealType }))
              }
            >
              <SelectTrigger id={mealTypeId} className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPE_ORDER.map((type) => (
                  <SelectItem key={type} value={type} className="text-xs">
                    {MEAL_TYPE_LABEL[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 시간 */}
          <div className="space-y-1">
            <label
              htmlFor={timeId}
              className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
            >
              시간 (선택)
            </label>
            <Input
              id={timeId}
              type="time"
              value={form.time}
              onChange={(e) =>
                setForm((f) => ({ ...f, time: e.target.value }))
              }
              className="h-7 text-xs"
            />
          </div>

          {/* 음식 태그 */}
          <div className="space-y-1">
            <label
              htmlFor={foodsId}
              className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
            >
              음식 목록 <span aria-label="필수">*</span>
            </label>
            <FoodTagInput
              foods={form.foods}
              onAdd={(food) =>
                setForm((f) => ({ ...f, foods: [...f.foods, food] }))
              }
              onRemove={(food) =>
                setForm((f) => ({
                  ...f,
                  foods: f.foods.filter((fd) => fd !== food),
                }))
              }
            />
          </div>

          {/* 칼로리 / 단백질 */}
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="영양 정보">
            <div className="space-y-1">
              <label
                htmlFor={caloriesId}
                className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
              >
                칼로리 (kcal)
              </label>
              <Input
                id={caloriesId}
                type="number"
                min={0}
                step={1}
                value={form.calories}
                onChange={(e) =>
                  setForm((f) => ({ ...f, calories: e.target.value }))
                }
                placeholder="예: 500"
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor={proteinId}
                className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
              >
                단백질 (g)
              </label>
              <Input
                id={proteinId}
                type="number"
                min={0}
                step={0.1}
                value={form.protein}
                onChange={(e) =>
                  setForm((f) => ({ ...f, protein: e.target.value }))
                }
                placeholder="예: 30"
                className="h-7 text-xs"
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <label
              htmlFor={notesId}
              className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide"
            >
              메모 (선택)
            </label>
            <Textarea
              id={notesId}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="식단에 대한 메모를 입력하세요..."
              className="text-xs resize-none min-h-[56px]"
            />
          </div>
        </fieldset>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={onSave}>
            {isEditing ? "수정 완료" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
