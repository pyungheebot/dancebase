"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  Droplets,
  Flame,
  Beef,
  Target,
  UtensilsCrossed,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { useDanceNutrition } from "@/hooks/use-dance-nutrition";
import { DanceNutritionEntry, DanceNutritionMealTime } from "@/types";
import { formatMonthDay } from "@/lib/date-utils";

// ---- 상수 ----
const MEAL_TIME_LABELS: Record<DanceNutritionMealTime, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

const MEAL_TIME_COLORS: Record<DanceNutritionMealTime, string> = {
  breakfast: "bg-amber-400",
  lunch: "bg-green-400",
  dinner: "bg-blue-400",
  snack: "bg-pink-400",
};

const MEAL_TIME_BADGE_COLORS: Record<DanceNutritionMealTime, string> = {
  breakfast: "bg-amber-100 text-amber-700",
  lunch: "bg-green-100 text-green-700",
  dinner: "bg-blue-100 text-blue-700",
  snack: "bg-pink-100 text-pink-700",
};

type EntryFormData = {
  date: string;
  mealTime: DanceNutritionMealTime;
  menuName: string;
  calories: string;
  protein: string;
  carbs: string;
  water: string;
  memo: string;
};

const EMPTY_FORM: EntryFormData = {
  date: new Date().toISOString().slice(0, 10),
  mealTime: "breakfast",
  menuName: "",
  calories: "",
  protein: "",
  carbs: "",
  water: "",
  memo: "",
};

// ---- 헬퍼 ----
function toNum(v: string): number {
  const n = parseFloat(v);
  return isNaN(n) || n < 0 ? 0 : n;
}

function progressColor(pct: number): string {
  if (pct >= 100) return "bg-green-500";
  if (pct >= 60) return "bg-blue-500";
  return "bg-orange-400";
}

// ---- 식단 기록 폼 다이얼로그 ----
function EntryFormDialog({
  open,
  onClose,
  onSubmit,
  initial,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EntryFormData) => void;
  initial: EntryFormData;
  title: string;
}) {
  const [form, setForm] = useState<EntryFormData>(initial);

  function set(key: keyof EntryFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.menuName.trim()) {
      toast.error("메뉴명을 입력해주세요.");
      return;
    }
    if (!form.date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {/* 날짜 + 식사 시간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">날짜</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">식사 시간</Label>
              <Select
                value={form.mealTime}
                onValueChange={(v) => set("mealTime", v as DanceNutritionMealTime)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(MEAL_TIME_LABELS) as DanceNutritionMealTime[]).map(
                    (k) => (
                      <SelectItem key={k} value={k} className="text-xs">
                        {MEAL_TIME_LABELS[k]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 메뉴명 */}
          <div className="space-y-1">
            <Label className="text-xs">메뉴명</Label>
            <Input
              value={form.menuName}
              onChange={(e) => set("menuName", e.target.value)}
              placeholder="예) 닭가슴살 샐러드"
              className="h-7 text-xs"
            />
          </div>

          {/* 칼로리 + 단백질 + 탄수화물 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">칼로리(kcal)</Label>
              <Input
                type="number"
                min={0}
                value={form.calories}
                onChange={(e) => set("calories", e.target.value)}
                placeholder="0"
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">단백질(g)</Label>
              <Input
                type="number"
                min={0}
                value={form.protein}
                onChange={(e) => set("protein", e.target.value)}
                placeholder="0"
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">탄수화물(g)</Label>
              <Input
                type="number"
                min={0}
                value={form.carbs}
                onChange={(e) => set("carbs", e.target.value)}
                placeholder="0"
                className="h-7 text-xs"
              />
            </div>
          </div>

          {/* 수분 섭취 */}
          <div className="space-y-1">
            <Label className="text-xs">수분 섭취(ml)</Label>
            <Input
              type="number"
              min={0}
              value={form.water}
              onChange={(e) => set("water", e.target.value)}
              placeholder="0"
              className="h-7 text-xs"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              value={form.memo}
              onChange={(e) => set("memo", e.target.value)}
              placeholder="추가 메모 (선택)"
              className="text-xs resize-none h-16"
            />
          </div>
        </div>
        <DialogFooter className="gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- 목표 설정 다이얼로그 ----
function GoalDialog({
  open,
  onClose,
  current,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  current: { targetCalories: number; targetWater: number };
  onSubmit: (cal: number, water: number) => void;
}) {
  const [cal, setCal] = useState(String(current.targetCalories));
  const [water, setWater] = useState(String(current.targetWater));

  function handleSubmit() {
    const c = parseInt(cal);
    const w = parseInt(water);
    if (!c || c <= 0) {
      toast.error("목표 칼로리를 올바르게 입력해주세요.");
      return;
    }
    if (!w || w <= 0) {
      toast.error("목표 수분을 올바르게 입력해주세요.");
      return;
    }
    onSubmit(c, w);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">목표 설정</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">목표 칼로리 (kcal/일)</Label>
            <Input
              type="number"
              min={1}
              value={cal}
              onChange={(e) => setCal(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">목표 수분 섭취 (ml/일)</Label>
            <Input
              type="number"
              min={1}
              value={water}
              onChange={(e) => setWater(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        </div>
        <DialogFooter className="gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- 식사 시간별 칼로리 바 차트 ----
function MealCaloriesBar({
  mealCalories,
  totalCalories,
}: {
  mealCalories: Record<DanceNutritionMealTime, number>;
  totalCalories: number;
}) {
  const meals = Object.entries(mealCalories) as [
    DanceNutritionMealTime,
    number
  ][];

  if (totalCalories === 0) {
    return (
      <p className="text-[10px] text-muted-foreground text-center py-2">
        오늘 기록된 식단이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {meals.map(([mealTime, cal]) => {
        const pct = totalCalories > 0 ? Math.round((cal / totalCalories) * 100) : 0;
        return (
          <div key={mealTime} className="flex items-center gap-2">
            <span className="w-10 text-[10px] text-muted-foreground shrink-0">
              {MEAL_TIME_LABELS[mealTime]}
            </span>
            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${MEAL_TIME_COLORS[mealTime]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-16 text-[10px] text-right shrink-0">
              {cal > 0 ? `${cal} kcal` : "-"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---- 달성률 프로그레스 바 ----
function GoalProgress({
  label,
  current,
  target,
  unit,
  icon,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  icon: React.ReactNode;
}) {
  const pct = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const color = progressColor(pct);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {current} / {target} {unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-right text-muted-foreground">{pct}% 달성</p>
    </div>
  );
}

// ---- 메인 컴포넌트 ----
export function DanceNutritionCard({ memberId }: { memberId: string }) {
  const {
    data,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    updateGoal,
    getEntriesByDate,
    getMealCaloriesByDate,
    getTotalCaloriesByDate,
    getTotalWaterByDate,
    getLast7Days,
    getWeeklyAvgCalories,
    getWeeklyAvgProtein,
  } = useDanceNutrition(memberId);

  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [isOpen, setIsOpen] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DanceNutritionEntry | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const todayEntries = getEntriesByDate(selectedDate);
  const mealCalories = getMealCaloriesByDate(selectedDate);
  const totalCalories = getTotalCaloriesByDate(selectedDate);
  const totalWater = getTotalWaterByDate(selectedDate);
  const weeklyAvgCal = getWeeklyAvgCalories();
  const weeklyAvgProtein = getWeeklyAvgProtein();
  const last7Days = getLast7Days();

  function handleAddSubmit(form: EntryFormData) {
    addEntry({
      date: form.date,
      mealTime: form.mealTime,
      menuName: form.menuName.trim(),
      calories: toNum(form.calories),
      protein: toNum(form.protein),
      carbs: toNum(form.carbs),
      water: toNum(form.water),
      memo: form.memo.trim(),
    });
    setAddDialogOpen(false);
    toast.success("식단이 기록되었습니다.");
  }

  function handleEditSubmit(form: EntryFormData) {
    if (!editTarget) return;
    updateEntry(editTarget.id, {
      date: form.date,
      mealTime: form.mealTime,
      menuName: form.menuName.trim(),
      calories: toNum(form.calories),
      protein: toNum(form.protein),
      carbs: toNum(form.carbs),
      water: toNum(form.water),
      memo: form.memo.trim(),
    });
    setEditTarget(null);
    toast.success("식단이 수정되었습니다.");
  }

  function handleDelete(id: string) {
    deleteEntry(id);
    setDeleteTargetId(null);
    toast.success("식단 기록이 삭제되었습니다.");
  }

  function handleGoalSubmit(cal: number, water: number) {
    updateGoal({ targetCalories: cal, targetWater: water });
    setGoalDialogOpen(false);
    toast.success("목표가 저장되었습니다.");
  }

  function entryToForm(entry: DanceNutritionEntry): EntryFormData {
    return {
      date: entry.date,
      mealTime: entry.mealTime,
      menuName: entry.menuName,
      calories: String(entry.calories),
      protein: String(entry.protein),
      carbs: String(entry.carbs),
      water: String(entry.water),
      memo: entry.memo,
    };
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <p className="text-xs text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="rounded-lg border bg-card shadow-sm">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors rounded-t-lg">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold">영양 관리</span>
                <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 border-0">
                  오늘 {totalCalories} kcal
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGoalDialogOpen(true);
                  }}
                >
                  <Target className="h-3 w-3 mr-1" />
                  목표
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddDialogOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  추가
                </Button>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4">
              {/* 날짜 선택 탭 (최근 7일) */}
              <div className="flex gap-1 overflow-x-auto pb-1">
                {last7Days.map((day) => {
                  const dayCal = getTotalCaloriesByDate(day);
                  const isSelected = day === selectedDate;
                  const isToday = day === today;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(day)}
                      className={`flex flex-col items-center px-2.5 py-1.5 rounded-md text-[10px] shrink-0 transition-colors border ${
                        isSelected
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-muted/50 hover:bg-muted border-transparent"
                      }`}
                    >
                      <span className="font-medium">{formatMonthDay(day)}</span>
                      {isToday && (
                        <span
                          className={`text-[9px] ${isSelected ? "text-emerald-100" : "text-emerald-500"}`}
                        >
                          오늘
                        </span>
                      )}
                      {dayCal > 0 && (
                        <span
                          className={`text-[9px] ${isSelected ? "text-emerald-100" : "text-muted-foreground"}`}
                        >
                          {dayCal}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 목표 달성률 */}
              <div className="space-y-2 rounded-md bg-muted/30 p-3">
                <GoalProgress
                  label="칼로리"
                  current={totalCalories}
                  target={data.goal.targetCalories}
                  unit="kcal"
                  icon={<Flame className="h-3 w-3 text-orange-400" />}
                />
                <GoalProgress
                  label="수분 섭취"
                  current={totalWater}
                  target={data.goal.targetWater}
                  unit="ml"
                  icon={<Droplets className="h-3 w-3 text-blue-400" />}
                />
              </div>

              {/* 식사 시간별 칼로리 분포 */}
              <div>
                <p className="text-xs font-medium mb-2 text-muted-foreground">
                  식사별 칼로리 분포
                </p>
                <MealCaloriesBar
                  mealCalories={mealCalories}
                  totalCalories={totalCalories}
                />
              </div>

              {/* 주간 통계 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-orange-50 border border-orange-100 px-3 py-2 text-center">
                  <p className="text-[10px] text-muted-foreground">주간 평균 칼로리</p>
                  <p className="text-sm font-bold text-orange-600">
                    {weeklyAvgCal > 0 ? `${weeklyAvgCal}` : "-"}
                    <span className="text-[10px] font-normal ml-0.5">kcal</span>
                  </p>
                </div>
                <div className="rounded-md bg-sky-50 border border-sky-100 px-3 py-2 text-center">
                  <p className="text-[10px] text-muted-foreground">주간 평균 단백질</p>
                  <p className="text-sm font-bold text-sky-600">
                    {weeklyAvgProtein > 0 ? `${weeklyAvgProtein}` : "-"}
                    <span className="text-[10px] font-normal ml-0.5">g</span>
                  </p>
                </div>
              </div>

              {/* 당일 식단 기록 목록 */}
              <div>
                <p className="text-xs font-medium mb-2 text-muted-foreground">
                  {formatMonthDay(selectedDate)} 식단 기록
                  <span className="ml-1 text-[10px]">({todayEntries.length}건)</span>
                </p>
                {todayEntries.length === 0 ? (
                  <div className="rounded-md border border-dashed py-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      기록된 식단이 없습니다.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs mt-1"
                      onClick={() => setAddDialogOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      식단 추가
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {todayEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start justify-between rounded-md border bg-background px-3 py-2 gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${MEAL_TIME_BADGE_COLORS[entry.mealTime]}`}
                            >
                              {MEAL_TIME_LABELS[entry.mealTime]}
                            </span>
                            <span className="text-xs font-medium truncate">
                              {entry.menuName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-orange-500 flex items-center gap-0.5">
                              <Flame className="h-2.5 w-2.5" />
                              {entry.calories} kcal
                            </span>
                            {entry.protein > 0 && (
                              <span className="text-[10px] text-sky-500 flex items-center gap-0.5">
                                <Beef className="h-2.5 w-2.5" />
                                단백질 {entry.protein}g
                              </span>
                            )}
                            {entry.carbs > 0 && (
                              <span className="text-[10px] text-amber-500">
                                탄수 {entry.carbs}g
                              </span>
                            )}
                            {entry.water > 0 && (
                              <span className="text-[10px] text-blue-400 flex items-center gap-0.5">
                                <Droplets className="h-2.5 w-2.5" />
                                {entry.water}ml
                              </span>
                            )}
                          </div>
                          {entry.memo && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                              {entry.memo}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setEditTarget(entry)}
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setDeleteTargetId(entry.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* 당일 합계 */}
                    <div className="rounded-md bg-muted/40 px-3 py-1.5 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-medium">
                        합계
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-orange-500">
                          {totalCalories} kcal
                        </span>
                        <span className="text-[10px] text-sky-500">
                          단백질 {todayEntries.reduce((s, e) => s + e.protein, 0)}g
                        </span>
                        <span className="text-[10px] text-blue-400">
                          수분 {totalWater}ml
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* 추가 다이얼로그 */}
      <EntryFormDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAddSubmit}
        initial={{ ...EMPTY_FORM, date: selectedDate }}
        title="식단 기록 추가"
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <EntryFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditSubmit}
          initial={entryToForm(editTarget)}
          title="식단 기록 수정"
        />
      )}

      {/* 목표 설정 다이얼로그 */}
      <GoalDialog
        open={goalDialogOpen}
        onClose={() => setGoalDialogOpen(false)}
        current={data.goal}
        onSubmit={handleGoalSubmit}
      />

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={!!deleteTargetId}
        onOpenChange={(v) => !v && setDeleteTargetId(null)}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">식단 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground py-1">
            이 식단 기록을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.
          </p>
          <DialogFooter className="gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setDeleteTargetId(null)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              onClick={() => deleteTargetId && handleDelete(deleteTargetId)}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
