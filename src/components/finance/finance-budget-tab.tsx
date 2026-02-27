"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useFinanceBudget } from "@/hooks/use-finance-budget";
import { invalidateFinanceBudget } from "@/lib/swr/invalidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Settings, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { EntityContext } from "@/types/entity-context";
import type { FinanceTransactionWithDetails } from "@/types";

type Props = {
  ctx: EntityContext;
  canManage: boolean;
  transactions: FinanceTransactionWithDetails[];
};

// 최근 12개월 옵션 생성
function buildMonthOptions(): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(format(d, "yyyy-MM"));
  }
  return options;
}

// 월 레이블 포맷: "2026-02" → "2026년 2월"
function formatMonthLabel(ym: string) {
  const [year, month] = ym.split("-");
  return `${year}년 ${parseInt(month, 10)}월`;
}

// 진행률 바 색상 결정
function getProgressColor(ratio: number): string {
  if (ratio >= 1.0) return "bg-red-500";
  if (ratio >= 0.8) return "bg-orange-400";
  return "bg-blue-500";
}

export function FinanceBudgetTab({ ctx, canManage, transactions }: Props) {
  const supabase = createClient();
  const currentMonth = format(new Date(), "yyyy-MM");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formIncome, setFormIncome] = useState<string>("");
  const [formExpense, setFormExpense] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const entityType = ctx.projectId ? "project" : "group";
  const entityId = ctx.projectId ?? ctx.groupId;

  const { budget, loading, refetch } = useFinanceBudget(entityType, entityId, selectedMonth);

  const monthOptions = buildMonthOptions();

  // 선택된 월의 실제 수입/지출 계산
  const monthlyActual = (() => {
    const filtered = transactions.filter((t) =>
      t.transaction_date?.startsWith(selectedMonth)
    );
    const income = filtered
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filtered
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense };
  })();

  // 예산 설정 다이얼로그 열기
  const handleOpenDialog = () => {
    setFormIncome(budget ? String(budget.budget_income) : "");
    setFormExpense(budget ? String(budget.budget_expense) : "");
    setDialogOpen(true);
  };

  // 예산 저장 (upsert)
  const handleSave = async () => {
    const incomeVal = parseInt(formIncome.replace(/,/g, ""), 10);
    const expenseVal = parseInt(formExpense.replace(/,/g, ""), 10);

    if (isNaN(incomeVal) || incomeVal < 0) {
      toast.error("올바른 수입 예산 금액을 입력해주세요");
      return;
    }
    if (isNaN(expenseVal) || expenseVal < 0) {
      toast.error("올바른 지출 예산 금액을 입력해주세요");
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("로그인이 필요합니다");
        return;
      }

      const payload = {
        entity_type: entityType,
        entity_id: entityId,
        year_month: selectedMonth,
        budget_income: incomeVal,
        budget_expense: expenseVal,
        created_by: user.id,
      };

      const { error } = await supabase
        .from("finance_budgets")
        .upsert(payload, { onConflict: "entity_type,entity_id,year_month" });

      if (error) {
        toast.error("예산 저장에 실패했습니다");
        return;
      }

      toast.success("예산이 저장되었습니다");
      invalidateFinanceBudget(entityType, entityId, selectedMonth);
      refetch();
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // 예산 삭제
  const handleDelete = async () => {
    if (!budget) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("finance_budgets")
        .delete()
        .eq("id", budget.id);

      if (error) {
        toast.error("예산 삭제에 실패했습니다");
        return;
      }

      toast.success("예산이 삭제되었습니다");
      invalidateFinanceBudget(entityType, entityId, selectedMonth);
      refetch();
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const incomeRatio =
    budget && budget.budget_income > 0
      ? monthlyActual.income / budget.budget_income
      : null;

  const expenseRatio =
    budget && budget.budget_expense > 0
      ? monthlyActual.expense / budget.budget_expense
      : null;

  return (
    <div>
      {/* 월 선택 + 예산 설정 버튼 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-muted-foreground">월별 예산 관리</h2>
        <div className="flex items-center gap-1.5">
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[11px] px-2 gap-1"
              onClick={handleOpenDialog}
            >
              <Settings className="h-3 w-3" />
              예산 설정
            </Button>
          )}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="h-6 w-28 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((ym) => (
                <SelectItem key={ym} value={ym}>
                  {formatMonthLabel(ym)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 예산 비교 카드 */}
      {loading ? (
        <div className="text-xs text-muted-foreground text-center py-8">불러오는 중...</div>
      ) : (
        <div className="space-y-3">
          {/* 수입 예산 카드 */}
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                <span className="text-xs font-medium">수입 예산</span>
              </div>
              {budget && budget.budget_income > 0 ? (
                incomeRatio !== null && incomeRatio >= 1.0 ? (
                  <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200">
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                    초과
                  </Badge>
                ) : (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                    달성 중
                  </Badge>
                )
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                  미설정
                </Badge>
              )}
            </div>

            <div className="flex items-end justify-between mb-1.5">
              <div>
                <p className="text-[10px] text-muted-foreground">실제 수입</p>
                <p className="text-sm font-semibold text-green-600 tabular-nums">
                  +{monthlyActual.income.toLocaleString("ko-KR")}원
                </p>
              </div>
              {budget && budget.budget_income > 0 && (
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">예산</p>
                  <p className="text-sm font-semibold tabular-nums text-muted-foreground">
                    {budget.budget_income.toLocaleString("ko-KR")}원
                  </p>
                </div>
              )}
            </div>

            {budget && budget.budget_income > 0 && incomeRatio !== null && (
              <>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(incomeRatio)}`}
                    style={{ width: `${Math.min(incomeRatio * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 text-right">
                  {Math.round(incomeRatio * 100)}% 달성
                </p>
              </>
            )}
          </div>

          {/* 지출 예산 카드 */}
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                <span className="text-xs font-medium">지출 예산</span>
              </div>
              {budget && budget.budget_expense > 0 ? (
                expenseRatio !== null && expenseRatio >= 1.0 ? (
                  <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200">
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                    초과
                  </Badge>
                ) : expenseRatio !== null && expenseRatio >= 0.8 ? (
                  <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200">
                    주의
                  </Badge>
                ) : (
                  <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200">
                    정상
                  </Badge>
                )
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                  미설정
                </Badge>
              )}
            </div>

            <div className="flex items-end justify-between mb-1.5">
              <div>
                <p className="text-[10px] text-muted-foreground">실제 지출</p>
                <p className="text-sm font-semibold text-red-600 tabular-nums">
                  -{monthlyActual.expense.toLocaleString("ko-KR")}원
                </p>
              </div>
              {budget && budget.budget_expense > 0 && (
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">예산</p>
                  <p className="text-sm font-semibold tabular-nums text-muted-foreground">
                    {budget.budget_expense.toLocaleString("ko-KR")}원
                  </p>
                </div>
              )}
            </div>

            {budget && budget.budget_expense > 0 && expenseRatio !== null && (
              <>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(expenseRatio)}`}
                    style={{ width: `${Math.min(expenseRatio * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p
                    className={`text-[10px] ${
                      expenseRatio >= 1.0 ? "text-red-600 font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {expenseRatio >= 1.0 && (
                      <span>
                        초과: {(monthlyActual.expense - budget.budget_expense).toLocaleString("ko-KR")}원
                      </span>
                    )}
                    {expenseRatio < 1.0 && (
                      <span>
                        잔여: {(budget.budget_expense - monthlyActual.expense).toLocaleString("ko-KR")}원
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {Math.round(expenseRatio * 100)}% 사용
                  </p>
                </div>
              </>
            )}
          </div>

          {/* 예산 미설정 안내 */}
          {!budget && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {formatMonthLabel(selectedMonth)} 예산이 설정되지 않았습니다.
              {canManage && " 위의 예산 설정 버튼을 눌러 설정해주세요."}
            </p>
          )}
        </div>
      )}

      {/* 예산 설정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              예산 설정 — {formatMonthLabel(selectedMonth)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">수입 예산 (원)</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={formIncome}
                onChange={(e) => setFormIncome(e.target.value)}
                className="h-8 text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                이번 달 목표 수입 금액을 입력하세요
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">지출 예산 (원)</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={formExpense}
                onChange={(e) => setFormExpense(e.target.value)}
                className="h-8 text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                이번 달 허용 지출 한도를 입력하세요
              </p>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center gap-2 sm:flex-row">
            {budget && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive mr-auto"
                onClick={handleDelete}
                disabled={saving}
              >
                예산 삭제
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                취소
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
