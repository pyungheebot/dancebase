"use client";

import { useState, useCallback, useId } from "react";
import {
  UtensilsCrossed,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Droplets,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useDietTracker } from "@/hooks/use-diet-tracker";
import type { DietMealType, DietTrackerMeal } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

import {
  getTodayStr,
  MEAL_TYPE_ORDER,
  type MealForm,
  getDefaultMealForm,
} from "./diet-tracker/types";
import { WaterTracker } from "./diet-tracker/water-tracker";
import { MealTypeSection } from "./diet-tracker/meal-type-section";
import { WeeklyCaloriesChart } from "./diet-tracker/weekly-calories-chart";
import { MealDialog } from "./diet-tracker/meal-dialog";

// ============================================================
// 통계 요약 서브컴포넌트
// ============================================================

function DietStatsSummary({
  totalMeals,
  averageCalories,
  weeklyMealCount,
}: {
  totalMeals: number;
  averageCalories: number;
  weeklyMealCount: number;
}) {
  return (
    <dl className="grid grid-cols-3 gap-2">
      <div className="rounded-lg bg-muted/50 p-2 text-center">
        <dt className="text-[10px] text-muted-foreground">총 식사 수</dt>
        <dd className="text-lg font-bold text-orange-500">{totalMeals}</dd>
      </div>
      <div className="rounded-lg bg-muted/50 p-2 text-center">
        <dt className="text-[10px] text-muted-foreground">평균 칼로리</dt>
        <dd className="text-lg font-bold text-green-500">
          {averageCalories > 0 ? `${averageCalories}` : "-"}
        </dd>
      </div>
      <div className="rounded-lg bg-muted/50 p-2 text-center">
        <dt className="text-[10px] text-muted-foreground">주간 식사</dt>
        <dd className="text-lg font-bold text-blue-500">{weeklyMealCount}</dd>
      </div>
    </dl>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

export function DietTrackerCard({
  memberId,
  memberName = "",
}: {
  memberId: string;
  memberName?: string;
}) {
  const today = getTodayStr();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MealForm>(getDefaultMealForm());

  const dateInputId = useId();
  const chartRegionId = useId();

  const {
    loading,
    addMeal,
    updateMeal,
    deleteMeal,
    setWater,
    getDayLog,
    getWeeklyCalories,
    stats,
  } = useDietTracker(memberId);

  const dayLog = getDayLog(selectedDate, memberName);
  const weeklyCalories = getWeeklyCalories();

  // 다이얼로그 열기 (신규)
  const openAddDialog = useCallback((mealType: DietMealType) => {
    setForm(getDefaultMealForm(mealType));
    setEditingId(null);
    setDialogOpen(true);
  }, []);

  // 다이얼로그 열기 (수정)
  const openEditDialog = useCallback((meal: DietTrackerMeal) => {
    setForm({
      mealType: meal.mealType,
      time: meal.time ?? "",
      foods: [...meal.foods],
      calories: meal.calories != null ? String(meal.calories) : "",
      protein: meal.protein != null ? String(meal.protein) : "",
      notes: meal.notes ?? "",
    });
    setEditingId(meal.id);
    setDialogOpen(true);
  }, []);

  // 다이얼로그 닫기
  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingId(null);
  }, []);

  // 저장
  const handleSave = useCallback(() => {
    if (form.foods.length === 0) {
      toast.error(TOAST.MEMBERS.DIET_FOOD_REQUIRED);
      return;
    }

    const caloriesNum =
      form.calories !== "" ? parseInt(form.calories) : undefined;
    const proteinNum =
      form.protein !== "" ? parseFloat(form.protein) : undefined;

    if (editingId) {
      const ok = updateMeal(editingId, {
        mealType: form.mealType,
        time: form.time || undefined,
        foods: form.foods,
        calories: caloriesNum,
        protein: proteinNum,
        notes: form.notes || undefined,
      });
      if (ok) {
        toast.success(TOAST.MEMBERS.DIET_UPDATED);
        closeDialog();
      } else {
        toast.error(TOAST.UPDATE_ERROR);
      }
    } else {
      addMeal({
        date: selectedDate,
        mealType: form.mealType,
        time: form.time || undefined,
        foods: form.foods,
        calories: caloriesNum,
        protein: proteinNum,
        notes: form.notes || undefined,
      });
      toast.success(TOAST.MEMBERS.DIET_SAVED);
      closeDialog();
    }
  }, [form, editingId, selectedDate, addMeal, updateMeal, closeDialog]);

  // 삭제
  const handleDeleteMeal = useCallback(
    (id: string) => {
      const ok = deleteMeal(id);
      if (ok) {
        toast.success(TOAST.MEMBERS.DIET_DELETED);
      } else {
        toast.error(TOAST.DELETE_ERROR);
      }
    },
    [deleteMeal]
  );

  // 수분 토글
  const handleWaterToggle = useCallback(
    (cupIndex: number) => {
      const currentCups = dayLog.water.cups;
      if (cupIndex < currentCups) {
        setWater(selectedDate, cupIndex);
      } else {
        setWater(selectedDate, cupIndex + 1);
      }
    },
    [dayLog.water.cups, selectedDate, setWater]
  );

  // 해당 날짜의 식사 유형별 그룹
  const mealsByType = useCallback(
    (mealType: DietMealType): DietTrackerMeal[] =>
      dayLog.meals.filter((m) => m.mealType === mealType),
    [dayLog.meals]
  );

  // 하루 총 칼로리 / 단백질
  const dayTotalCalories = dayLog.meals.reduce(
    (s, m) => s + (m.calories ?? 0),
    0
  );
  const dayTotalProtein = dayLog.meals.reduce(
    (s, m) => s + (m.protein ?? 0),
    0
  );

  return (
    <>
      <Card>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader
              className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg py-3"
              aria-expanded={open}
              aria-controls="diet-tracker-content"
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UtensilsCrossed
                    className="h-4 w-4 text-orange-500"
                    aria-hidden="true"
                  />
                  식단 관리
                </CardTitle>
                <div className="flex items-center gap-2">
                  {stats.totalMeals > 0 && (
                    <div
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      aria-label={`총 ${stats.totalMeals}끼, 평균 수분 ${stats.averageWaterCups}잔`}
                    >
                      <span>총 {stats.totalMeals}끼</span>
                      <span
                        className="text-muted-foreground/40"
                        aria-hidden="true"
                      >
                        |
                      </span>
                      <Droplets
                        className="h-3 w-3 text-blue-500"
                        aria-hidden="true"
                      />
                      <span>평균 {stats.averageWaterCups}잔</span>
                    </div>
                  )}
                  {open ? (
                    <ChevronUp
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronDown
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent id="diet-tracker-content">
            <CardContent className="pt-0 pb-4 space-y-4">
              {loading ? (
                <p
                  className="text-xs text-muted-foreground text-center py-4"
                  role="status"
                  aria-live="polite"
                >
                  불러오는 중...
                </p>
              ) : (
                <>
                  {/* 통계 요약 */}
                  <DietStatsSummary
                    totalMeals={stats.totalMeals}
                    averageCalories={stats.averageCalories}
                    weeklyMealCount={stats.weeklyMealCount}
                  />

                  {/* 날짜 선택 */}
                  <div className="flex items-center gap-2">
                    <label htmlFor={dateInputId} className="sr-only">
                      날짜 선택
                    </label>
                    <Input
                      id={dateInputId}
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="h-7 text-xs flex-1"
                    />
                    {selectedDate !== today && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setSelectedDate(today)}
                        aria-label="오늘 날짜로 이동"
                      >
                        오늘
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground -mt-2">
                    <time dateTime={selectedDate}>
                      {formatYearMonthDay(selectedDate)}
                    </time>
                  </p>

                  {/* 수분 섭취 트래커 */}
                  <WaterTracker
                    cups={dayLog.water.cups}
                    onToggle={handleWaterToggle}
                  />

                  {/* 하루 합계 (칼로리/단백질이 있는 경우만) */}
                  {(dayTotalCalories > 0 || dayTotalProtein > 0) && (
                    <div
                      className="flex gap-2"
                      aria-label="오늘 영양 합계"
                      aria-live="polite"
                    >
                      {dayTotalCalories > 0 && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200">
                          오늘 총 {dayTotalCalories}kcal
                        </Badge>
                      )}
                      {dayTotalProtein > 0 && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                          단백질 {Math.round(dayTotalProtein * 10) / 10}g
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* 식사별 섹션 */}
                  <div className="space-y-3" role="list" aria-label="식사 유형별 기록">
                    {MEAL_TYPE_ORDER.map((mealType) => (
                      <MealTypeSection
                        key={mealType}
                        mealType={mealType}
                        meals={mealsByType(mealType)}
                        onDelete={handleDeleteMeal}
                        onEdit={openEditDialog}
                        onAdd={openAddDialog}
                      />
                    ))}
                  </div>

                  {/* 주간 칼로리 차트 */}
                  <div
                    className="space-y-2"
                    id={chartRegionId}
                    aria-labelledby={`${chartRegionId}-title`}
                  >
                    <p
                      id={`${chartRegionId}-title`}
                      className="text-xs font-medium flex items-center gap-1.5"
                    >
                      <BarChart2
                        className="h-3.5 w-3.5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      주간 칼로리 현황
                    </p>
                    <WeeklyCaloriesChart data={weeklyCalories} />
                  </div>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 식사 추가/수정 다이얼로그 */}
      <MealDialog
        open={dialogOpen}
        onClose={closeDialog}
        onSave={handleSave}
        isEditing={!!editingId}
        form={form}
        setForm={setForm}
      />
    </>
  );
}
