"use client";

import { memo } from "react";
import { Clock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DietTrackerMeal } from "@/types";
import { MEAL_TYPE_LABEL, MEAL_TYPE_COLOR, MEAL_TYPE_BG } from "./types";

interface MealItemProps {
  meal: DietTrackerMeal;
  onDelete: (id: string) => void;
  onEdit: (meal: DietTrackerMeal) => void;
}

export const MealItem = memo(function MealItem({
  meal,
  onDelete,
  onEdit,
}: MealItemProps) {
  return (
    <article
      className={cn(
        "rounded-lg border p-2.5 space-y-1.5",
        MEAL_TYPE_BG[meal.mealType]
      )}
      aria-label={`${MEAL_TYPE_LABEL[meal.mealType]} 식사 기록`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0 shrink-0",
              MEAL_TYPE_COLOR[meal.mealType]
            )}
          >
            {MEAL_TYPE_LABEL[meal.mealType]}
          </Badge>
          {meal.time && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" aria-hidden="true" />
              <time dateTime={`${meal.date}T${meal.time}`}>{meal.time}</time>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {meal.calories != null && meal.calories > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {meal.calories}kcal
            </span>
          )}
          {meal.protein != null && meal.protein > 0 && (
            <span className="text-[10px] text-muted-foreground">
              단백질 {meal.protein}g
            </span>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0"
            onClick={() => onEdit(meal)}
            aria-label={`${MEAL_TYPE_LABEL[meal.mealType]} 식사 수정`}
          >
            <Pencil className="h-2.5 w-2.5" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(meal.id)}
            aria-label={`${MEAL_TYPE_LABEL[meal.mealType]} 식사 삭제`}
          >
            <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
      {meal.foods.length > 0 && (
        <ul className="flex flex-wrap gap-1 list-none p-0 m-0" aria-label="음식 목록">
          {meal.foods.map((food) => (
            <li key={food}>
              <Badge className="text-[10px] px-1.5 py-0 bg-card/70 text-slate-600 border-slate-200">
                {food}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      {meal.notes && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {meal.notes}
        </p>
      )}
    </article>
  );
});
