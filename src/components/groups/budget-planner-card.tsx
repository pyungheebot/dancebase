"use client";

import { useState, useMemo } from "react";
import {
  DollarSign,
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useBudgetPlanner } from "@/hooks/use-budget-planner";
import type { BudgetPlannerCategory, BudgetPlannerItem, BudgetPlannerPlan } from "@/types";

// ============================================================
// 상수 / 헬퍼
// ============================================================

const CATEGORY_LABELS: Record<BudgetPlannerCategory, string> = {
  costume: "의상",
  venue: "장소",
  equipment: "장비",
  food: "식비",
  transportation: "교통",
  promotion: "홍보",
  education: "교육",
  other: "기타",
};

const CATEGORY_COLORS: Record<
  BudgetPlannerCategory,
  { badge: string; bar: string; dot: string }
> = {
  costume: {
    badge: "bg-purple-100 text-purple-700",
    bar: "bg-purple-400",
    dot: "bg-purple-400",
  },
  venue: {
    badge: "bg-blue-100 text-blue-700",
    bar: "bg-blue-400",
    dot: "bg-blue-400",
  },
  equipment: {
    badge: "bg-cyan-100 text-cyan-700",
    bar: "bg-cyan-400",
    dot: "bg-cyan-400",
  },
  food: {
    badge: "bg-orange-100 text-orange-700",
    bar: "bg-orange-400",
    dot: "bg-orange-400",
  },
  transportation: {
    badge: "bg-green-100 text-green-700",
    bar: "bg-green-400",
    dot: "bg-green-400",
  },
  promotion: {
    badge: "bg-pink-100 text-pink-700",
    bar: "bg-pink-400",
    dot: "bg-pink-400",
  },
  education: {
    badge: "bg-indigo-100 text-indigo-700",
    bar: "bg-indigo-400",
    dot: "bg-indigo-400",
  },
  other: {
    badge: "bg-gray-100 text-gray-600",
    bar: "bg-gray-400",
    dot: "bg-gray-400",
  },
};

const ALL_CATEGORIES: BudgetPlannerCategory[] = [
  "costume",
  "venue",
  "equipment",
  "food",
  "transportation",
  "promotion",
  "education",
  "other",
];

function formatKRW(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ============================================================
// 서브 컴포넌트: 예산 진행률 바
// ============================================================

function BudgetBar({
  planned,
  actual,
  barClass,
}: {
  planned: number;
  actual: number;
  barClass: string;
}) {
  const ratio = planned > 0 ? Math.min(actual / planned, 1) : 0;
  const overBudget = planned > 0 && actual > planned;
  const pct = Math.round(ratio * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            overBudget ? "bg-red-400" : barClass
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          "text-[10px] font-medium w-8 text-right",
          overBudget ? "text-red-500" : "text-gray-500"
        )}
      >
        {pct}%
      </span>
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 계획 추가/편집 다이얼로그
// ============================================================

type PlanDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (title: string, year: number) => void;
  initialTitle?: string;
  initialYear?: number;
};

function PlanDialog({
  open,
  onClose,
  onSave,
  initialTitle = "",
  initialYear,
}: PlanDialogProps) {
  const currentYear = new Date().getFullYear();
  const [title, setTitle] = useState(initialTitle);
  const [year, setYear] = useState(initialYear ?? currentYear);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("계획 이름을 입력해주세요.");
      return;
    }
    onSave(title.trim(), year);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {initialTitle ? "예산 계획 수정" : "새 예산 계획"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">계획 이름</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 2026년 연간 예산"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">연도</Label>
            <Select
              value={String(year)}
              onValueChange={(v) => setYear(Number(v))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-xs">
                    {y}년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 서브 컴포넌트: 아이템 추가/편집 다이얼로그
// ============================================================

type ItemDialogMode = "add" | "edit";

type ItemDialogProps = {
  open: boolean;
  mode: ItemDialogMode;
  onClose: () => void;
  onSave: (item: Omit<BudgetPlannerItem, "id">) => void;
  initial?: BudgetPlannerItem;
};

function ItemDialog({ open, mode, onClose, onSave, initial }: ItemDialogProps) {
  const [category, setCategory] = useState<BudgetPlannerCategory>(
    initial?.category ?? "other"
  );
  const [label, setLabel] = useState(initial?.label ?? "");
  const [plannedAmount, setPlannedAmount] = useState(
    initial?.plannedAmount != null ? String(initial.plannedAmount) : ""
  );
  const [actualAmount, setActualAmount] = useState(
    initial?.actualAmount != null ? String(initial.actualAmount) : ""
  );
  const [period, setPeriod] = useState(initial?.period ?? getCurrentYearMonth());
  const [note, setNote] = useState(initial?.note ?? "");

  const handleSave = () => {
    if (!label.trim()) {
      toast.error("항목 이름을 입력해주세요.");
      return;
    }
    const planned = Number(plannedAmount);
    const actual = Number(actualAmount);
    if (isNaN(planned) || planned < 0) {
      toast.error("유효한 예산 금액을 입력해주세요.");
      return;
    }
    if (isNaN(actual) || actual < 0) {
      toast.error("유효한 실제 지출 금액을 입력해주세요.");
      return;
    }
    onSave({
      category,
      label: label.trim(),
      plannedAmount: planned,
      actualAmount: actual,
      period,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {mode === "add" ? "예산 항목 추가" : "예산 항목 수정"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as BudgetPlannerCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">항목 이름</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 공연 의상 제작"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">예산 (원)</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min={0}
                placeholder="0"
                value={plannedAmount}
                onChange={(e) => setPlannedAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">실제 지출 (원)</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min={0}
                placeholder="0"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">기간 (YYYY-MM)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="2026-02"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">메모 (선택)</Label>
            <Textarea
              className="text-xs min-h-[56px] resize-none"
              placeholder="관련 메모를 입력하세요"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function BudgetPlannerCard({ groupId }: { groupId: string }) {
  const {
    plans,
    loading,
    addPlan,
    updatePlan,
    deletePlan,
    addItem,
    updateItem,
    deleteItem,
    computeStats,
  } = useBudgetPlanner(groupId);

  const [open, setOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // 다이얼로그 상태
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planDialogEdit, setPlanDialogEdit] = useState<BudgetPlannerPlan | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemDialogEdit, setItemDialogEdit] = useState<BudgetPlannerItem | null>(null);

  // 선택된 계획
  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? plans[0] ?? null,
    [plans, selectedPlanId]
  );

  const stats = useMemo(
    () => (selectedPlan ? computeStats(selectedPlan.id) : null),
    [selectedPlan, computeStats]
  );

  // ── 핸들러: 계획 ───────────────────────────────────────────

  const handleAddPlan = (title: string, year: number) => {
    const plan = addPlan(title, year);
    setSelectedPlanId(plan.id);
    toast.success("예산 계획이 추가되었습니다.");
  };

  const handleUpdatePlan = (title: string, year: number) => {
    if (!planDialogEdit) return;
    updatePlan(planDialogEdit.id, { title, year });
    toast.success("예산 계획이 수정되었습니다.");
  };

  const handleDeletePlan = (planId: string) => {
    if (!confirm("이 예산 계획을 삭제하시겠습니까?")) return;
    deletePlan(planId);
    setSelectedPlanId(null);
    toast.success("예산 계획이 삭제되었습니다.");
  };

  // ── 핸들러: 아이템 ─────────────────────────────────────────

  const handleAddItem = (item: Omit<BudgetPlannerItem, "id">) => {
    if (!selectedPlan) return;
    addItem(selectedPlan.id, item);
    toast.success("예산 항목이 추가되었습니다.");
  };

  const handleUpdateItem = (item: Omit<BudgetPlannerItem, "id">) => {
    if (!selectedPlan || !itemDialogEdit) return;
    updateItem(selectedPlan.id, itemDialogEdit.id, item);
    toast.success("예산 항목이 수정되었습니다.");
  };

  const handleDeleteItem = (itemId: string) => {
    if (!selectedPlan) return;
    if (!confirm("이 항목을 삭제하시겠습니까?")) return;
    deleteItem(selectedPlan.id, itemId);
    toast.success("항목이 삭제되었습니다.");
  };

  // ── 렌더링 ─────────────────────────────────────────────────

  const overallPct = stats
    ? Math.round(stats.overallRatio * 100)
    : 0;
  const overBudget = stats ? stats.totalActual > stats.totalPlanned && stats.totalPlanned > 0 : false;

  return (
    <>
      <Card className="w-full">
        <Collapsible open={open} onOpenChange={setOpen}>
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors rounded-t-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold text-gray-800">
                  그룹 예산 플래너
                </span>
                {plans.length > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    {plans.length}개 계획
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {stats && stats.totalPlanned > 0 && (
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      overBudget ? "text-red-500" : "text-gray-500"
                    )}
                  >
                    {overallPct}% 집행
                  </span>
                )}
                {open ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {/* 계획 선택 & 관리 */}
              <div className="flex items-center gap-2">
                <Select
                  value={selectedPlan?.id ?? ""}
                  onValueChange={(v) => setSelectedPlanId(v)}
                  disabled={plans.length === 0}
                >
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="예산 계획을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.title} ({p.year}년)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPlan && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setPlanDialogEdit(selectedPlan);
                        setPlanDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-500"
                      onClick={() => handleDeletePlan(selectedPlan.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs shrink-0"
                  onClick={() => {
                    setPlanDialogEdit(null);
                    setPlanDialogOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  새 계획
                </Button>
              </div>

              {loading && (
                <p className="text-xs text-gray-400 text-center py-4">
                  불러오는 중...
                </p>
              )}

              {!loading && !selectedPlan && (
                <div className="text-center py-6 text-xs text-gray-400">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                  <p>예산 계획을 추가해보세요.</p>
                </div>
              )}

              {selectedPlan && stats && (
                <>
                  {/* 전체 예산 요약 */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">
                        전체 예산 진행률
                      </span>
                      <div className="flex items-center gap-1.5">
                        {overBudget ? (
                          <TrendingUp className="h-3 w-3 text-red-500" />
                        ) : stats.remainingBudget === 0 ? (
                          <Minus className="h-3 w-3 text-gray-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-emerald-500" />
                        )}
                        <span
                          className={cn(
                            "text-xs font-bold",
                            overBudget ? "text-red-500" : "text-emerald-600"
                          )}
                        >
                          {overallPct}%
                        </span>
                      </div>
                    </div>

                    {/* 전체 진행률 바 */}
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          overBudget ? "bg-red-400" : "bg-emerald-400"
                        )}
                        style={{ width: `${Math.min(overallPct, 100)}%` }}
                      />
                    </div>

                    {/* 금액 요약 */}
                    <div className="grid grid-cols-3 gap-2 text-center mt-1">
                      <div>
                        <p className="text-[10px] text-gray-400">예산</p>
                        <p className="text-xs font-semibold text-gray-700">
                          {formatKRW(stats.totalPlanned)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">지출</p>
                        <p
                          className={cn(
                            "text-xs font-semibold",
                            overBudget ? "text-red-500" : "text-gray-700"
                          )}
                        >
                          {formatKRW(stats.totalActual)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">잔여</p>
                        <p
                          className={cn(
                            "text-xs font-semibold",
                            stats.remainingBudget < 0
                              ? "text-red-500"
                              : "text-emerald-600"
                          )}
                        >
                          {formatKRW(Math.abs(stats.remainingBudget))}
                          {stats.remainingBudget < 0 && " 초과"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 카테고리별 차트 */}
                  {stats.categoryBreakdown.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                        카테고리별 현황
                      </p>
                      {stats.categoryBreakdown.map((b) => (
                        <div key={b.category} className="space-y-0.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  CATEGORY_COLORS[b.category].dot
                                )}
                              />
                              <span className="text-xs text-gray-600">{b.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400">
                                {formatKRW(b.actualAmount)}
                              </span>
                              <span className="text-[10px] text-gray-300">/</span>
                              <span className="text-[10px] text-gray-500">
                                {formatKRW(b.plannedAmount)}
                              </span>
                            </div>
                          </div>
                          <BudgetBar
                            planned={b.plannedAmount}
                            actual={b.actualAmount}
                            barClass={CATEGORY_COLORS[b.category].bar}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* 항목 목록 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                        예산 항목 ({selectedPlan.items.length}개)
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => {
                          setItemDialogEdit(null);
                          setItemDialogOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-0.5" />
                        항목 추가
                      </Button>
                    </div>

                    {selectedPlan.items.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-3">
                        예산 항목을 추가해보세요.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {selectedPlan.items.map((item) => {
                          const isOver = item.actualAmount > item.plannedAmount && item.plannedAmount > 0;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-2 rounded-md border border-gray-100 px-2.5 py-1.5 hover:bg-gray-50 group"
                            >
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full shrink-0",
                                  CATEGORY_COLORS[item.category].dot
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium text-gray-700 truncate">
                                    {item.label}
                                  </span>
                                  <Badge
                                    className={cn(
                                      "text-[9px] px-1 py-0 shrink-0",
                                      CATEGORY_COLORS[item.category].badge
                                    )}
                                  >
                                    {CATEGORY_LABELS[item.category]}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="text-[10px] text-gray-400">
                                    {item.period}
                                  </span>
                                  <span className="text-[10px] text-gray-300">·</span>
                                  <span className={cn("text-[10px]", isOver ? "text-red-500 font-medium" : "text-gray-500")}>
                                    {formatKRW(item.actualAmount)}
                                  </span>
                                  <span className="text-[10px] text-gray-300">/</span>
                                  <span className="text-[10px] text-gray-400">
                                    {formatKRW(item.plannedAmount)}
                                  </span>
                                  {isOver && (
                                    <Badge className="text-[9px] px-1 py-0 bg-red-50 text-red-500 hover:bg-red-50">
                                      초과
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  onClick={() => {
                                    setItemDialogEdit(item);
                                    setItemDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 text-red-400 hover:text-red-500"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 계획 다이얼로그 */}
      <PlanDialog
        open={planDialogOpen}
        onClose={() => {
          setPlanDialogOpen(false);
          setPlanDialogEdit(null);
        }}
        onSave={planDialogEdit ? handleUpdatePlan : handleAddPlan}
        initialTitle={planDialogEdit?.title}
        initialYear={planDialogEdit?.year}
      />

      {/* 아이템 다이얼로그 */}
      <ItemDialog
        open={itemDialogOpen}
        mode={itemDialogEdit ? "edit" : "add"}
        onClose={() => {
          setItemDialogOpen(false);
          setItemDialogEdit(null);
        }}
        onSave={itemDialogEdit ? handleUpdateItem : handleAddItem}
        initial={itemDialogEdit ?? undefined}
      />
    </>
  );
}
