import type { DietMealType } from "@/types";

// ============================================================
// 상수 매핑
// ============================================================

export const MEAL_TYPE_LABEL: Record<DietMealType, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
  supplement: "보충제",
};

export const MEAL_TYPE_COLOR: Record<DietMealType, string> = {
  breakfast: "bg-orange-100 text-orange-700 border-orange-200",
  lunch: "bg-green-100 text-green-700 border-green-200",
  dinner: "bg-blue-100 text-blue-700 border-blue-200",
  snack: "bg-pink-100 text-pink-700 border-pink-200",
  supplement: "bg-purple-100 text-purple-700 border-purple-200",
};

export const MEAL_TYPE_BG: Record<DietMealType, string> = {
  breakfast: "bg-orange-50 border-orange-100",
  lunch: "bg-green-50 border-green-100",
  dinner: "bg-blue-50 border-blue-100",
  snack: "bg-pink-50 border-pink-100",
  supplement: "bg-purple-50 border-purple-100",
};

export const MEAL_TYPE_ORDER: DietMealType[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "supplement",
];

export const TOTAL_WATER_CUPS = 8;

// ============================================================
// 식사 폼 타입
// ============================================================

export type MealForm = {
  mealType: DietMealType;
  time: string;
  foods: string[];
  calories: string;
  protein: string;
  notes: string;
};

export function getDefaultMealForm(mealType: DietMealType = "breakfast"): MealForm {
  return {
    mealType,
    time: "",
    foods: [],
    calories: "",
    protein: "",
    notes: "",
  };
}

// ============================================================
// 날짜 유틸
// ============================================================

export function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
