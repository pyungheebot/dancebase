"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  Calculator,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useBudgetScenario } from "@/hooks/use-budget-scenario";
import type { BudgetScenario } from "@/types";

// ---- 유틸 ----

function formatKRW(value: number): string {
  return value.toLocaleString("ko-KR");
}

// 숫자 입력 필드의 빈 문자열 처리용 파싱
function parseNum(value: string): number {
  const n = parseFloat(value.replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

// ---- 기본값 ----

const EMPTY_FORM: Omit<BudgetScenario, "id" | "createdAt"> = {
  name: "",
  monthlyFee: 0,
  memberCount: 0,
  venueRentPerMonth: 0,
  performanceCount: 0,
  avgPerformanceIncome: 0,
  otherExpenses: 0,
  otherIncome: 0,
};

// ---- 입력 폼 ----

type ScenarioFormProps = {
  initial?: Omit<BudgetScenario, "id" | "createdAt">;
  onSubmit: (values: Omit<BudgetScenario, "id" | "createdAt">) => void;
  onCancel: () => void;
  submitLabel: string;
};

function ScenarioForm({
  initial = EMPTY_FORM,
  onSubmit,
  onCancel,
  submitLabel,
}: ScenarioFormProps) {
  const [values, setValues] = useState<Omit<BudgetScenario, "id" | "createdAt">>(
    initial
  );

  function set<K extends keyof typeof values>(
    key: K,
    raw: string
  ) {
    setValues((prev) => ({
      ...prev,
      [key]: key === "name" ? raw : parseNum(raw),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      toast.error(TOAST.FINANCE.SCENARIO_NAME_REQUIRED);
      return;
    }
    onSubmit(values);
  }

  const inputCls =
    "h-7 text-xs";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 시나리오 이름 */}
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground">시나리오 이름</Label>
        <Input
          className={inputCls}
          placeholder="예: 회비 인상 시나리오"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* 수입 항목 */}
        <div className="space-y-2 rounded-lg border border-green-200 bg-green-50/40 dark:bg-green-950/10 dark:border-green-900/30 p-2">
          <p className="text-[10px] font-medium text-green-700 dark:text-green-400">
            수입 항목
          </p>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              월 회비 (원)
            </Label>
            <Input
              className={inputCls}
              type="number"
              min={0}
              placeholder="30000"
              value={values.monthlyFee === 0 ? "" : values.monthlyFee}
              onChange={(e) => set("monthlyFee", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              예상 멤버 수 (명)
            </Label>
            <Input
              className={inputCls}
              type="number"
              min={0}
              placeholder="20"
              value={values.memberCount === 0 ? "" : values.memberCount}
              onChange={(e) => set("memberCount", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              월 공연 횟수 (회)
            </Label>
            <Input
              className={inputCls}
              type="number"
              min={0}
              placeholder="2"
              value={values.performanceCount === 0 ? "" : values.performanceCount}
              onChange={(e) => set("performanceCount", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              공연당 평균 수입 (원)
            </Label>
            <Input
              className={inputCls}
              type="number"
              min={0}
              placeholder="100000"
              value={
                values.avgPerformanceIncome === 0
                  ? ""
                  : values.avgPerformanceIncome
              }
              onChange={(e) => set("avgPerformanceIncome", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              기타 월 수입 (원)
            </Label>
            <Input
              className={inputCls}
              type="number"
              min={0}
              placeholder="0"
              value={values.otherIncome === 0 ? "" : values.otherIncome}
              onChange={(e) => set("otherIncome", e.target.value)}
            />
          </div>
        </div>

        {/* 지출 항목 */}
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50/40 dark:bg-red-950/10 dark:border-red-900/30 p-2">
          <p className="text-[10px] font-medium text-red-700 dark:text-red-400">
            지출 항목
          </p>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              월 장소 대여비 (원)
            </Label>
            <Input
              className={inputCls}
              type="number"
              min={0}
              placeholder="200000"
              value={
                values.venueRentPerMonth === 0 ? "" : values.venueRentPerMonth
              }
              onChange={(e) => set("venueRentPerMonth", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              기타 월 지출 (원)
            </Label>
            <Input
              className={inputCls}
              type="number"
              min={0}
              placeholder="50000"
              value={values.otherExpenses === 0 ? "" : values.otherExpenses}
              onChange={(e) => set("otherExpenses", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          <X className="h-3 w-3 mr-1" />
          취소
        </Button>
        <Button type="submit" size="sm" className="h-7 text-xs">
          <Check className="h-3 w-3 mr-1" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

// ---- 시나리오 단일 카드 ----

type ScenarioItemProps = {
  scenario: BudgetScenario;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyProfit: number;
  annualProfit: number;
  onEdit: () => void;
  onDelete: () => void;
  maxAbsProfit: number;
};

function ScenarioItem({
  scenario,
  monthlyIncome,
  monthlyExpense,
  monthlyProfit,
  annualProfit,
  onEdit,
  onDelete,
  maxAbsProfit,
}: ScenarioItemProps) {
  const profitPositive = monthlyProfit >= 0;
  const barWidth =
    maxAbsProfit > 0 ? Math.round((Math.abs(monthlyProfit) / maxAbsProfit) * 100) : 0;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold truncate">{scenario.name}</p>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
            aria-label="시나리오 수정"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label="시나리오 삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 수입/지출/순이익 수치 */}
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="rounded bg-green-50 dark:bg-green-950/20 px-1.5 py-1">
          <p className="text-[9px] text-muted-foreground mb-0.5">월 수입</p>
          <p className="text-[11px] font-semibold text-green-600 tabular-nums">
            +{formatKRW(monthlyIncome)}
          </p>
        </div>
        <div className="rounded bg-red-50 dark:bg-red-950/20 px-1.5 py-1">
          <p className="text-[9px] text-muted-foreground mb-0.5">월 지출</p>
          <p className="text-[11px] font-semibold text-red-600 tabular-nums">
            -{formatKRW(monthlyExpense)}
          </p>
        </div>
        <div
          className={`rounded px-1.5 py-1 ${
            profitPositive
              ? "bg-blue-50 dark:bg-blue-950/20"
              : "bg-orange-50 dark:bg-orange-950/20"
          }`}
        >
          <p className="text-[9px] text-muted-foreground mb-0.5">월 순이익</p>
          <p
            className={`text-[11px] font-semibold tabular-nums ${
              profitPositive ? "text-blue-600" : "text-red-600"
            }`}
          >
            {profitPositive ? "+" : ""}
            {formatKRW(monthlyProfit)}
          </p>
        </div>
      </div>

      {/* 연간 환산 */}
      <p className="text-[10px] text-muted-foreground text-right">
        연간 환산:{" "}
        <span
          className={`font-semibold tabular-nums ${
            annualProfit >= 0 ? "text-blue-600" : "text-red-600"
          }`}
        >
          {annualProfit >= 0 ? "+" : ""}
          {formatKRW(annualProfit)}원
        </span>
      </p>

      {/* CSS 바 차트 */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-muted-foreground w-10 shrink-0 text-right">
            순이익
          </span>
          <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                profitPositive ? "bg-blue-500" : "bg-red-500"
              }`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <span
            className={`text-[9px] tabular-nums font-medium w-14 shrink-0 ${
              profitPositive ? "text-blue-600" : "text-red-600"
            }`}
          >
            {profitPositive ? "+" : ""}
            {formatKRW(monthlyProfit)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---- 비교 테이블 ----

type CompareTableProps = {
  scenarios: BudgetScenario[];
  results: Array<{
    scenarioId: string;
    monthlyIncome: number;
    monthlyExpense: number;
    monthlyProfit: number;
    annualProfit: number;
  }>;
};

function CompareTable({ scenarios, results }: CompareTableProps) {
  if (scenarios.length < 2) return null;

  const rows: Array<{
    label: string;
    getValue: (s: BudgetScenario, r: (typeof results)[number]) => string;
    isHighlight?: boolean;
  }> = [
    {
      label: "월 회비",
      getValue: (s) => `${formatKRW(s.monthlyFee)}원`,
    },
    {
      label: "예상 멤버",
      getValue: (s) => `${s.memberCount}명`,
    },
    {
      label: "월 공연 횟수",
      getValue: (s) => `${s.performanceCount}회`,
    },
    {
      label: "월 장소 대여비",
      getValue: (s) => `${formatKRW(s.venueRentPerMonth)}원`,
    },
    {
      label: "월 수입 합계",
      getValue: (_, r) => `${formatKRW(r.monthlyIncome)}원`,
      isHighlight: true,
    },
    {
      label: "월 지출 합계",
      getValue: (_, r) => `${formatKRW(r.monthlyExpense)}원`,
      isHighlight: true,
    },
    {
      label: "월 순이익",
      getValue: (_, r) =>
        `${r.monthlyProfit >= 0 ? "+" : ""}${formatKRW(r.monthlyProfit)}원`,
      isHighlight: true,
    },
    {
      label: "연간 순이익",
      getValue: (_, r) =>
        `${r.annualProfit >= 0 ? "+" : ""}${formatKRW(r.annualProfit)}원`,
      isHighlight: true,
    },
  ];

  return (
    <div className="overflow-x-auto mt-3">
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr>
            <th className="text-left px-2 py-1.5 text-muted-foreground font-medium bg-muted/50 rounded-tl-md border-b w-24">
              항목
            </th>
            {scenarios.map((s) => (
              <th
                key={s.id}
                className="text-center px-2 py-1.5 text-foreground font-semibold bg-muted/50 border-b last:rounded-tr-md"
              >
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={row.label}
              className={`${
                rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20"
              } ${row.isHighlight ? "font-semibold" : ""}`}
            >
              <td className="px-2 py-1.5 text-muted-foreground border-b border-border/40">
                {row.label}
              </td>
              {scenarios.map((s, sIdx) => {
                const r = results[sIdx];
                const cellValue = row.getValue(s, r);
                const isProfit =
                  row.label === "월 순이익" || row.label === "연간 순이익";
                const isPositive = !cellValue.startsWith("-");
                return (
                  <td
                    key={s.id}
                    className={`px-2 py-1.5 text-center border-b border-border/40 tabular-nums ${
                      isProfit
                        ? isPositive
                          ? "text-blue-600"
                          : "text-red-600"
                        : ""
                    }`}
                  >
                    {cellValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- 시나리오별 순이익 바 차트 ----

type ProfitBarChartProps = {
  scenarios: BudgetScenario[];
  results: Array<{
    scenarioId: string;
    monthlyProfit: number;
  }>;
};

function ProfitBarChart({ scenarios, results }: ProfitBarChartProps) {
  if (scenarios.length === 0) return null;

  const maxAbs = Math.max(...results.map((r) => Math.abs(r.monthlyProfit)), 1);

  return (
    <div className="space-y-2 mt-3">
      <p className="text-[10px] font-medium text-muted-foreground">
        시나리오별 월 순이익 비교
      </p>
      {scenarios.map((s, idx) => {
        const r = results[idx];
        const positive = r.monthlyProfit >= 0;
        const widthPct = Math.round((Math.abs(r.monthlyProfit) / maxAbs) * 100);

        return (
          <div key={s.id} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground truncate w-20 shrink-0">
              {s.name}
            </span>
            <div className="flex-1 h-4 rounded bg-muted overflow-hidden relative">
              <div
                className={`h-full rounded transition-all duration-300 ${
                  positive ? "bg-blue-500" : "bg-red-500"
                }`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span
              className={`text-[10px] tabular-nums font-semibold w-20 shrink-0 text-right ${
                positive ? "text-blue-600" : "text-red-600"
              }`}
            >
              {positive ? "+" : ""}
              {formatKRW(r.monthlyProfit)}원
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---- 메인 컴포넌트 ----

type BudgetScenarioCardProps = {
  groupId: string;
};

export function BudgetScenarioCard({ groupId }: BudgetScenarioCardProps) {
  const { scenarios, results, canAdd, maxScenarios, addScenario, updateScenario, deleteScenario } =
    useBudgetScenario(groupId);

  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const maxAbsProfit = Math.max(
    ...results.map((r) => Math.abs(r.monthlyProfit)),
    1
  );

  function handleAdd(values: Omit<BudgetScenario, "id" | "createdAt">) {
    const { error } = addScenario(values);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(TOAST.FINANCE.SCENARIO_ADDED);
    setShowAddForm(false);
  }

  function handleUpdate(
    id: string,
    values: Omit<BudgetScenario, "id" | "createdAt">
  ) {
    const { error } = updateScenario(id, values);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(TOAST.FINANCE.SCENARIO_UPDATED);
    setEditingId(null);
  }

  function handleDelete(id: string) {
    deleteScenario(id);
    toast.success(TOAST.FINANCE.SCENARIO_DELETED);
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="mt-3">
        <CardHeader className="py-2 px-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full text-left">
              <div className="flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                <CardTitle className="text-xs font-semibold">
                  예산 시나리오 플래너
                </CardTitle>
                {scenarios.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    ({scenarios.length}/{maxScenarios})
                  </span>
                )}
              </div>
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-0 space-y-3">
            {/* 시나리오 목록 */}
            {scenarios.length === 0 && !showAddForm && (
              <p className="text-xs text-muted-foreground text-center py-4">
                시나리오를 추가하여 재정 계획을 세워보세요.
              </p>
            )}

            {scenarios.map((scenario, idx) => {
              const r = results[idx];
              if (editingId === scenario.id) {
                return (
                  <div
                    key={scenario.id}
                    className="rounded-lg border bg-muted/20 p-3"
                  >
                    <p className="text-[10px] font-medium text-muted-foreground mb-2">
                      시나리오 수정
                    </p>
                    <ScenarioForm
                      initial={{
                        name: scenario.name,
                        monthlyFee: scenario.monthlyFee,
                        memberCount: scenario.memberCount,
                        venueRentPerMonth: scenario.venueRentPerMonth,
                        performanceCount: scenario.performanceCount,
                        avgPerformanceIncome: scenario.avgPerformanceIncome,
                        otherExpenses: scenario.otherExpenses,
                        otherIncome: scenario.otherIncome,
                      }}
                      onSubmit={(values) => handleUpdate(scenario.id, values)}
                      onCancel={() => setEditingId(null)}
                      submitLabel="수정 완료"
                    />
                  </div>
                );
              }

              return (
                <ScenarioItem
                  key={scenario.id}
                  scenario={scenario}
                  monthlyIncome={r.monthlyIncome}
                  monthlyExpense={r.monthlyExpense}
                  monthlyProfit={r.monthlyProfit}
                  annualProfit={r.annualProfit}
                  onEdit={() => {
                    setShowAddForm(false);
                    setEditingId(scenario.id);
                  }}
                  onDelete={() => handleDelete(scenario.id)}
                  maxAbsProfit={maxAbsProfit}
                />
              );
            })}

            {/* 추가 폼 */}
            {showAddForm && (
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-[10px] font-medium text-muted-foreground mb-2">
                  새 시나리오 추가
                </p>
                <ScenarioForm
                  onSubmit={handleAdd}
                  onCancel={() => setShowAddForm(false)}
                  submitLabel="추가"
                />
              </div>
            )}

            {/* 추가 버튼 */}
            {!showAddForm && canAdd && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full gap-1"
                onClick={() => {
                  setEditingId(null);
                  setShowAddForm(true);
                }}
              >
                <Plus className="h-3 w-3" />
                시나리오 추가 ({scenarios.length}/{maxScenarios})
              </Button>
            )}

            {!canAdd && !showAddForm && (
              <p className="text-[10px] text-muted-foreground text-center">
                최대 {maxScenarios}개의 시나리오를 등록했습니다.
              </p>
            )}

            {/* 시나리오별 순이익 바 차트 */}
            {scenarios.length > 0 && (
              <ProfitBarChart scenarios={scenarios} results={results} />
            )}

            {/* 비교 테이블 (2개 이상) */}
            {scenarios.length >= 2 && (
              <CompareTable scenarios={scenarios} results={results} />
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
