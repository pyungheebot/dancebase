"use client";

import { memo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DietMealType, DietTrackerMeal } from "@/types";
import { MEAL_TYPE_LABEL } from "./types";
import { MealItem } from "./meal-item";

interface MealTypeSectionProps {
  mealType: DietMealType;
  meals: DietTrackerMeal[];
  onDelete: (id: string) => void;
  onEdit: (meal: DietTrackerMeal) => void;
  onAdd: (mealType: DietMealType) => void;
}

export const MealTypeSection = memo(function MealTypeSection({
  mealType,
  meals,
  onDelete,
  onEdit,
  onAdd,
}: MealTypeSectionProps) {
  const sectionId = `meal-section-${mealType}`;

  return (
    <section aria-labelledby={sectionId} className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h3
          id={sectionId}
          className="text-xs font-medium text-muted-foreground"
        >
          {MEAL_TYPE_LABEL[mealType]}
        </h3>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[10px] px-1.5 gap-0.5"
          onClick={() => onAdd(mealType)}
          aria-label={`${MEAL_TYPE_LABEL[mealType]} 식사 추가`}
        >
          <Plus className="h-2.5 w-2.5" aria-hidden="true" />
          추가
        </Button>
      </div>
      {meals.length > 0 ? (
        <div className="space-y-1" role="list" aria-label={`${MEAL_TYPE_LABEL[mealType]} 기록 목록`}>
          {meals.map((meal) => (
            <div key={meal.id} role="listitem">
              <MealItem meal={meal} onDelete={onDelete} onEdit={onEdit} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground/60 pl-1" aria-live="polite">
          기록 없음
        </p>
      )}
    </section>
  );
});
