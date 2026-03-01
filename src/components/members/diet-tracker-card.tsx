"use client";

import { useState, useCallback } from "react";
import {
  UtensilsCrossed,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  X,
  Droplets,
  BarChart2,
  Clock,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { cn } from "@/lib/utils";
import { useDietTracker } from "@/hooks/use-diet-tracker";
import type { DietMealType, DietTrackerMeal } from "@/types";

// ============================================================
// 상수 매핑
// ============================================================

const MEAL_TYPE_LABEL: Record<DietMealType, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
  supplement: "보충제",
};

const MEAL_TYPE_COLOR: Record<DietMealType, string> = {
  breakfast: "bg-orange-100 text-orange-700 border-orange-200",
  lunch: "bg-green-100 text-green-700 border-green-200",
  dinner: "bg-blue-100 text-blue-700 border-blue-200",
  snack: "bg-pink-100 text-pink-700 border-pink-200",
  supplement: "bg-purple-100 text-purple-700 border-purple-200",
};

const MEAL_TYPE_BG: Record<DietMealType, string> = {
  breakfast: "bg-orange-50 border-orange-100",
  lunch: "bg-green-50 border-green-100",
  dinner: "bg-blue-50 border-blue-100",
  snack: "bg-pink-50 border-pink-100",
  supplement: "bg-purple-50 border-purple-100",
};

const MEAL_TYPE_ORDER: DietMealType[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "supplement",
];

const TOTAL_WATER_CUPS = 8;

// ============================================================
// 날짜 유틸
// ============================================================

function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateKor(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dayIdx = new Date(`${dateStr}T00:00:00`).getDay();
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일 (${days[dayIdx]})`;
}

function formatDateShort(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

// ============================================================
// 서브 컴포넌트: 음식 태그 입력
// ============================================================

function FoodTagInput({
  foods,
  onAdd,
  onRemove,
}: {
  foods: string[];
  onAdd: (food: string) => void;
  onRemove: (food: string) => void;
}) {
  const [input, setInput] = useState("");

  const handleAdd = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput("");
  }, [input, onAdd]);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="음식 입력 후 Enter"
          className="h-7 text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2"
          onClick={handleAdd}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {foods.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {foods.map((food) => (
            <Badge
              key={food}
              className="text-[10px] px-1.5 py-0 gap-0.5 bg-slate-100 text-slate-700 border-slate-200"
            >
              {food}
              <button
                type="button"
                onClick={() => onRemove(food)}
                className="ml-0.5 hover:opacity-70"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 수분 섭취 트래커
// ============================================================

function WaterTracker({
  cups,
  onToggle,
}: {
  cups: number;
  onToggle: (cupIndex: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Droplets className="h-3 w-3 text-blue-500" />
          수분 섭취
        </span>
        <span className="text-xs font-medium text-blue-600">
          {cups} / {TOTAL_WATER_CUPS}잔
          <span className="text-[10px] text-muted-foreground ml-1">
            ({cups * 250}ml)
          </span>
        </span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: TOTAL_WATER_CUPS }, (_, i) => {
          const filled = i < cups;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onToggle(i)}
              className={cn(
                "h-7 w-7 rounded-md border transition-all hover:scale-110",
                filled
                  ? "bg-blue-100 border-blue-300 text-blue-600"
                  : "bg-muted border-border text-muted-foreground/40"
              )}
              title={`${i + 1}잔 (${(i + 1) * 250}ml)`}
            >
              <Droplets
                className={cn(
                  "h-3.5 w-3.5 mx-auto",
                  filled ? "fill-blue-400" : ""
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 식사 항목
// ============================================================

function MealItem({
  meal,
  onDelete,
  onEdit,
}: {
  meal: DietTrackerMeal;
  onDelete: (id: string) => void;
  onEdit: (meal: DietTrackerMeal) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5 space-y-1.5",
        MEAL_TYPE_BG[meal.mealType]
      )}
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
              <Clock className="h-2.5 w-2.5" />
              {meal.time}
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
          >
            <Pencil className="h-2.5 w-2.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(meal.id)}
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>
      {meal.foods.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {meal.foods.map((food) => (
            <Badge
              key={food}
              className="text-[10px] px-1.5 py-0 bg-white/70 text-slate-600 border-slate-200"
            >
              {food}
            </Badge>
          ))}
        </div>
      )}
      {meal.notes && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {meal.notes}
        </p>
      )}
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 식사 유형별 섹션
// ============================================================

function MealTypeSection({
  mealType,
  meals,
  onDelete,
  onEdit,
  onAdd,
}: {
  mealType: DietMealType;
  meals: DietTrackerMeal[];
  onDelete: (id: string) => void;
  onEdit: (meal: DietTrackerMeal) => void;
  onAdd: (mealType: DietMealType) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {MEAL_TYPE_LABEL[mealType]}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[10px] px-1.5 gap-0.5"
          onClick={() => onAdd(mealType)}
        >
          <Plus className="h-2.5 w-2.5" />
          추가
        </Button>
      </div>
      {meals.length > 0 ? (
        <div className="space-y-1">
          {meals.map((meal) => (
            <MealItem
              key={meal.id}
              meal={meal}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground/60 pl-1">
          기록 없음
        </p>
      )}
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 주간 칼로리 바 차트
// ============================================================

function WeeklyCaloriesChart({
  data,
}: {
  data: Array<{ date: string; calories: number }>;
}) {
  const maxCalories = Math.max(...data.map((d) => d.calories), 1);

  const hasAnyData = data.some((d) => d.calories > 0);

  if (!hasAnyData) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        최근 7일 칼로리 데이터가 없습니다.
      </p>
    );
  }

  return (
    <div className="flex items-end gap-1 h-16">
      {data.map(({ date, calories }) => {
        const heightPct = maxCalories > 0 ? (calories / maxCalories) * 100 : 0;
        const isToday = date === getTodayStr();
        return (
          <div
            key={date}
            className="flex flex-col items-center gap-0.5 flex-1 min-w-0"
          >
            <div className="w-full flex items-end justify-center h-12">
              <div
                className={cn(
                  "w-full rounded-t transition-all",
                  isToday ? "bg-orange-400" : "bg-orange-200"
                )}
                style={{ height: `${Math.max(heightPct, calories > 0 ? 8 : 0)}%` }}
                title={calories > 0 ? `${calories}kcal` : "기록 없음"}
              />
            </div>
            <span
              className={cn(
                "text-[9px] truncate w-full text-center",
                isToday
                  ? "text-orange-600 font-medium"
                  : "text-muted-foreground"
              )}
            >
              {formatDateShort(date)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 식사 추가/수정 다이얼로그 폼 타입
// ============================================================

type MealForm = {
  mealType: DietMealType;
  time: string;
  foods: string[];
  calories: string;
  protein: string;
  notes: string;
};

function getDefaultMealForm(mealType: DietMealType = "breakfast"): MealForm {
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
// 메인 컴포넌트
// ============================================================

export function DietTrackerCard({
  memberId,
  memberName = "",
}: {
  memberId: string;
  memberName?: string;
}) {
  const [open, setOpen] = useState(false);
  const today = getTodayStr();
  const [selectedDate, setSelectedDate] = useState(today);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MealForm>(getDefaultMealForm());

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
      toast.error("음식을 하나 이상 입력하세요.");
      return;
    }

    const caloriesNum = form.calories !== "" ? parseInt(form.calories) : undefined;
    const proteinNum = form.protein !== "" ? parseFloat(form.protein) : undefined;

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
        toast.success("식사 기록이 수정되었습니다.");
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
      toast.success("식사가 기록되었습니다.");
      closeDialog();
    }
  }, [form, editingId, selectedDate, addMeal, updateMeal, closeDialog]);

  // 삭제
  const handleDeleteMeal = useCallback(
    (id: string) => {
      const ok = deleteMeal(id);
      if (ok) {
        toast.success("식사 기록이 삭제되었습니다.");
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
      // 클릭한 인덱스가 현재 채워진 수보다 작으면 해당 잔 이하로 줄이고,
      // 그렇지 않으면 그 잔까지 채운다
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
    (mealType: DietMealType): DietTrackerMeal[] => {
      return dayLog.meals.filter((m) => m.mealType === mealType);
    },
    [dayLog.meals]
  );

  // 하루 총 칼로리
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
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-orange-500" />
                  식단 관리
                </CardTitle>
                <div className="flex items-center gap-2">
                  {stats.totalMeals > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>총 {stats.totalMeals}끼</span>
                      <span className="text-muted-foreground/40">|</span>
                      <Droplets className="h-3 w-3 text-blue-500" />
                      <span>평균 {stats.averageWaterCups}잔</span>
                    </div>
                  )}
                  {open ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 space-y-4">
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : (
                <>
                  {/* ── 통계 요약 ── */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-muted/50 p-2 text-center">
                      <p className="text-lg font-bold text-orange-500">
                        {stats.totalMeals}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        총 식사 수
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2 text-center">
                      <p className="text-lg font-bold text-green-500">
                        {stats.averageCalories > 0
                          ? `${stats.averageCalories}`
                          : "-"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        평균 칼로리
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2 text-center">
                      <p className="text-lg font-bold text-blue-500">
                        {stats.weeklyMealCount}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        주간 식사
                      </p>
                    </div>
                  </div>

                  {/* ── 날짜 선택 ── */}
                  <div className="flex items-center gap-2">
                    <Input
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
                      >
                        오늘
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground -mt-2">
                    {formatDateKor(selectedDate)}
                  </p>

                  {/* ── 수분 섭취 트래커 ── */}
                  <WaterTracker
                    cups={dayLog.water.cups}
                    onToggle={handleWaterToggle}
                  />

                  {/* ── 하루 합계 (칼로리/단백질 있는 경우만) ── */}
                  {(dayTotalCalories > 0 || dayTotalProtein > 0) && (
                    <div className="flex gap-2">
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

                  {/* ── 식사별 섹션 ── */}
                  <div className="space-y-3">
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

                  {/* ── 주간 칼로리 차트 ── */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium flex items-center gap-1.5">
                      <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
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

      {/* ── 식사 추가/수정 다이얼로그 ── */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingId ? "식사 수정" : "식사 추가"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* 식사 유형 */}
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                식사 유형
              </label>
              <Select
                value={form.mealType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, mealType: v as DietMealType }))
                }
              >
                <SelectTrigger className="h-7 text-xs">
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
              <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                시간 (선택)
              </label>
              <Input
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
              <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                음식 목록
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
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  칼로리 (kcal)
                </label>
                <Input
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
                <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  단백질 (g)
                </label>
                <Input
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
              <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                메모 (선택)
              </label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="식단에 대한 메모를 입력하세요..."
                className="text-xs resize-none min-h-[56px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={closeDialog}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
              {editingId ? "수정 완료" : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
