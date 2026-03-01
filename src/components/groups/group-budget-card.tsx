"use client";

import { useState, useMemo } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Filter,
  Settings2,
  X,
  Calendar,
  Tag,
  User,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupBudget } from "@/hooks/use-group-budget";
import type { GroupBudgetTransaction, GroupBudgetCategory } from "@/types";
import { formatMonthDay } from "@/lib/date-utils";

// ============================================================
// 헬퍼
// ============================================================

function formatAmount(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

// ============================================================
// 거래 추가/수정 폼
// ============================================================

type TransactionFormData = {
  type: "income" | "expense";
  category: string;
  description: string;
  amount: string;
  date: string;
  paidBy: string;
  receiptNote: string;
};

const EMPTY_FORM: TransactionFormData = {
  type: "expense",
  category: "",
  description: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  paidBy: "",
  receiptNote: "",
};

type TransactionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<GroupBudgetTransaction, "id" | "createdAt">) => Promise<void>;
  categories: GroupBudgetCategory[];
  initial?: GroupBudgetTransaction | null;
};

function TransactionDialog({
  open,
  onClose,
  onSubmit,
  categories,
  initial,
}: TransactionDialogProps) {
  const [form, setForm] = useState<TransactionFormData>(
    initial
      ? {
          type: initial.type,
          category: initial.category,
          description: initial.description,
          amount: String(initial.amount),
          date: initial.date,
          paidBy: initial.paidBy ?? "",
          receiptNote: initial.receiptNote ?? "",
        }
      : EMPTY_FORM
  );
  const { pending: saving, execute } = useAsyncAction();

  const isEdit = !!initial;

  const _filteredCategories = categories.filter((c) =>
    form.type === "income"
      ? ["회비", "기타수입"].includes(c.name)
      : !["기타수입"].includes(c.name) || c.name === "기타수입"
  );

  async function handleSubmit() {
    if (!form.category) {
      toast.error(TOAST.GROUP_BUDGET.CATEGORY_REQUIRED);
      return;
    }
    if (!form.description.trim()) {
      toast.error(TOAST.GROUP_BUDGET.CONTENT_REQUIRED);
      return;
    }
    const parsedAmount = parseInt(form.amount.replace(/,/g, ""), 10);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error(TOAST.GROUP_BUDGET.AMOUNT_INVALID);
      return;
    }
    if (!form.date) {
      toast.error(TOAST.GROUP_BUDGET.DATE_REQUIRED);
      return;
    }

    await execute(async () => {
      try {
        await onSubmit({
          type: form.type,
          category: form.category,
          description: form.description.trim(),
          amount: parsedAmount,
          date: form.date,
          paidBy: form.paidBy.trim() || null,
          receiptNote: form.receiptNote.trim() || null,
        });
        toast.success(isEdit ? "거래가 수정되었습니다" : "거래가 추가되었습니다");
        onClose();
      } catch {
        toast.error(TOAST.SAVE_ERROR);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {isEdit ? "거래 수정" : "거래 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* 유형 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: "income", category: "" }))}
              className={cn(
                "rounded-md border py-2 text-xs font-medium transition-colors",
                form.type === "income"
                  ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                  : "border-muted text-muted-foreground hover:border-green-400"
              )}
            >
              <TrendingUp className="mx-auto mb-0.5 h-3.5 w-3.5" />
              수입
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: "expense", category: "" }))}
              className={cn(
                "rounded-md border py-2 text-xs font-medium transition-colors",
                form.type === "expense"
                  ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                  : "border-muted text-muted-foreground hover:border-red-400"
              )}
            >
              <TrendingDown className="mx-auto mb-0.5 h-3.5 w-3.5" />
              지출
            </button>
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs">카테고리</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name} className="text-xs">
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 내용 */}
          <div className="space-y-1">
            <Label className="text-xs">내용</Label>
            <Input
              className="h-8 text-xs"
              placeholder="거래 내용을 입력하세요"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* 금액 */}
          <div className="space-y-1">
            <Label className="text-xs">금액 (원)</Label>
            <Input
              className="h-8 text-xs"
              type="number"
              placeholder="0"
              min={0}
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>

          {/* 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs">날짜</Label>
            <Input
              className="h-8 text-xs"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>

          {/* 납부자 (선택) */}
          <div className="space-y-1">
            <Label className="text-xs">납부자 / 결제자 (선택)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="이름 입력"
              value={form.paidBy}
              onChange={(e) => setForm((f) => ({ ...f, paidBy: e.target.value }))}
            />
          </div>

          {/* 메모 (선택) */}
          <div className="space-y-1">
            <Label className="text-xs">영수증 메모 (선택)</Label>
            <Textarea
              className="min-h-[56px] resize-none text-xs"
              placeholder="영수증 내용이나 메모"
              value={form.receiptNote}
              onChange={(e) =>
                setForm((f) => ({ ...f, receiptNote: e.target.value }))
              }
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 카테고리 관리 다이얼로그
// ============================================================

type CategoryManagerDialogProps = {
  open: boolean;
  onClose: () => void;
  categories: GroupBudgetCategory[];
  onAdd: (cat: GroupBudgetCategory) => Promise<void>;
  onRemove: (name: string) => Promise<void>;
};

function CategoryManagerDialog({
  open,
  onClose,
  categories,
  onAdd,
  onRemove,
}: CategoryManagerDialogProps) {
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📌");

  async function handleAdd() {
    if (!newName.trim()) {
      toast.error(TOAST.GROUP_BUDGET.CATEGORY_NAME_REQUIRED);
      return;
    }
    await onAdd({ name: newName.trim(), icon: newIcon });
    toast.success(TOAST.GROUP_BUDGET.CATEGORY_ADDED);
    setNewName("");
    setNewIcon("📌");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">카테고리 관리</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* 기존 카테고리 목록 */}
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between rounded-md border px-2 py-1.5"
              >
                <span className="text-xs">
                  {cat.icon} {cat.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                  onClick={() => onRemove(cat.name)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          {/* 새 카테고리 추가 */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">새 카테고리</p>
            <div className="flex gap-2">
              <Input
                className="h-8 w-14 text-center text-base"
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                maxLength={2}
              />
              <Input
                className="h-8 flex-1 text-xs"
                placeholder="카테고리명"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleAdd}
              >
                추가
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 예산 한도 설정 다이얼로그
// ============================================================

type BudgetLimitDialogProps = {
  open: boolean;
  onClose: () => void;
  currentLimit: number | null;
  onSave: (limit: number | null) => Promise<void>;
};

function BudgetLimitDialog({
  open,
  onClose,
  currentLimit,
  onSave,
}: BudgetLimitDialogProps) {
  const [value, setValue] = useState<string>(
    currentLimit !== null ? String(currentLimit) : ""
  );

  async function handleSave() {
    if (value === "") {
      await onSave(null);
      toast.success(TOAST.GROUP_BUDGET.BUDGET_LIMIT_RELEASED);
    } else {
      const parsed = parseInt(value, 10);
      if (!parsed || parsed <= 0) {
        toast.error(TOAST.GROUP_BUDGET.AMOUNT_INVALID);
        return;
      }
      await onSave(parsed);
      toast.success(TOAST.GROUP_BUDGET.MONTHLY_BUDGET_SET);
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">월별 예산 한도 설정</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            이번 달 지출 한도를 설정하면 진행률 바가 표시됩니다. 비워두면 한도
            없음으로 처리됩니다.
          </p>
          <Input
            className="h-8 text-xs"
            type="number"
            min={0}
            placeholder="예: 500000"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
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
// 카테고리별 지출 차트 (CSS div 기반)
// ============================================================

type CategoryChartProps = {
  breakdown: Array<{
    category: string;
    icon: string;
    amount: number;
    ratio: number;
  }>;
};

const CHART_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-green-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-yellow-500",
  "bg-red-500",
];

function CategoryChart({ breakdown }: CategoryChartProps) {
  if (breakdown.length === 0) {
    return (
      <p className="py-2 text-center text-xs text-muted-foreground">
        지출 내역이 없습니다
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {/* 가로 스택 바 */}
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
        {breakdown.map((item, idx) => (
          <div
            key={item.category}
            className={cn("h-full transition-all", CHART_COLORS[idx % CHART_COLORS.length])}
            style={{ width: `${item.ratio}%` }}
            title={`${item.category}: ${item.ratio}%`}
          />
        ))}
      </div>

      {/* 범례 */}
      <div className="space-y-1">
        {breakdown.map((item, idx) => (
          <div key={item.category} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  CHART_COLORS[idx % CHART_COLORS.length]
                )}
              />
              <span className="text-xs">
                {item.icon} {item.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{item.ratio}%</span>
              <span className="text-xs font-medium">{formatAmount(item.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type FilterType = "all" | "income" | "expense";

export function GroupBudgetCard({ groupId }: { groupId: string }) {
  const {
    data,
    loading,
    stats,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    removeCategory,
    setMonthlyLimit,
  } = useGroupBudget(groupId);

  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupBudgetTransaction | null>(null);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showAll, setShowAll] = useState(false);
  const [showChart, setShowChart] = useState(false);

  // 필터링된 거래 목록
  const filteredTransactions = useMemo(() => {
    const txs = [...data.transactions].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    if (filter === "all") return txs;
    return txs.filter((t) => t.type === filter);
  }, [data.transactions, filter]);

  const displayedTransactions = showAll
    ? filteredTransactions
    : filteredTransactions.slice(0, 8);

  // 월별 예산 진행률
  const budgetProgress = useMemo(() => {
    if (!data.monthlyBudgetLimit || data.monthlyBudgetLimit <= 0) return null;
    const pct = Math.min(
      100,
      Math.round((stats.monthlySpending / data.monthlyBudgetLimit) * 100)
    );
    return { pct, isOver: pct >= 100, isWarning: pct >= 80 };
  }, [data.monthlyBudgetLimit, stats.monthlySpending]);

  async function handleAddTransaction(
    payload: Omit<GroupBudgetTransaction, "id" | "createdAt">
  ) {
    if (editTarget) {
      await updateTransaction(editTarget.id, payload);
    } else {
      await addTransaction(payload);
    }
  }

  function openEditDialog(tx: GroupBudgetTransaction) {
    setEditTarget(tx);
    setTxDialogOpen(true);
  }

  function closeDialog() {
    setTxDialogOpen(false);
    setEditTarget(null);
  }

  async function handleDelete(txId: string) {
    const ok = await deleteTransaction(txId);
    if (ok) {
      toast.success(TOAST.GROUP_BUDGET.TRANSACTION_DELETED);
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <p className="text-xs text-muted-foreground">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-1.5 text-sm">
              <Wallet className="h-4 w-4 text-blue-500" />
              그룹 예산 트래커
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setLimitDialogOpen(true)}
              >
                <Settings2 className="mr-1 h-3 w-3" />
                한도
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setCatDialogOpen(true)}
              >
                <Tag className="mr-1 h-3 w-3" />
                카테고리
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setEditTarget(null);
                  setTxDialogOpen(true);
                }}
              >
                <Plus className="mr-1 h-3 w-3" />
                추가
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 요약 카드 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border bg-green-50 p-2.5 dark:bg-green-950/40">
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingUp className="h-3 w-3" />
                <span className="text-[10px] font-medium">총 수입</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-green-700 dark:text-green-300">
                {formatAmount(stats.totalIncome)}
              </p>
            </div>
            <div className="rounded-lg border bg-red-50 p-2.5 dark:bg-red-950/40">
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <TrendingDown className="h-3 w-3" />
                <span className="text-[10px] font-medium">총 지출</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-red-700 dark:text-red-300">
                {formatAmount(stats.totalExpense)}
              </p>
            </div>
            <div
              className={cn(
                "rounded-lg border p-2.5",
                stats.balance >= 0
                  ? "bg-blue-50 dark:bg-blue-950/40"
                  : "bg-orange-50 dark:bg-orange-950/40"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-1",
                  stats.balance >= 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-orange-600 dark:text-orange-400"
                )}
              >
                <Wallet className="h-3 w-3" />
                <span className="text-[10px] font-medium">잔액</span>
              </div>
              <p
                className={cn(
                  "mt-1 text-sm font-semibold",
                  stats.balance >= 0
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-orange-700 dark:text-orange-300"
                )}
              >
                {formatAmount(stats.balance)}
              </p>
            </div>
          </div>

          {/* 월별 예산 한도 진행률 */}
          {budgetProgress && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">이번 달 예산 사용률</span>
                <span
                  className={cn(
                    "text-xs font-medium",
                    budgetProgress.isOver
                      ? "text-red-600"
                      : budgetProgress.isWarning
                      ? "text-orange-600"
                      : "text-muted-foreground"
                  )}
                >
                  {formatAmount(stats.monthlySpending)} / {formatAmount(data.monthlyBudgetLimit!)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    budgetProgress.isOver
                      ? "bg-red-500"
                      : budgetProgress.isWarning
                      ? "bg-orange-500"
                      : "bg-blue-500"
                  )}
                  style={{ width: `${budgetProgress.pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0원</span>
                <span>{budgetProgress.pct}% 사용</span>
                <span>{formatAmount(data.monthlyBudgetLimit!)}</span>
              </div>
              {budgetProgress.isOver && (
                <p className="text-[10px] font-medium text-red-600">
                  월 예산 한도를 초과했습니다
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* 카테고리별 지출 분포 토글 */}
          {stats.categoryBreakdown.length > 0 && (
            <div>
              <button
                type="button"
                className="flex w-full items-center justify-between text-xs font-medium hover:text-foreground/80"
                onClick={() => setShowChart((v) => !v)}
              >
                <span>카테고리별 지출 분포</span>
                {showChart ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              {showChart && (
                <div className="mt-2">
                  <CategoryChart breakdown={stats.categoryBreakdown} />
                </div>
              )}
            </div>
          )}

          {stats.categoryBreakdown.length > 0 && <Separator />}

          {/* 거래 내역 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">거래 내역</span>
              <div className="flex items-center gap-1">
                <Filter className="h-3 w-3 text-muted-foreground" />
                {(["all", "income", "expense"] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] transition-colors",
                      filter === f
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {f === "all" ? "전체" : f === "income" ? "수입" : "지출"}
                  </button>
                ))}
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Wallet className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  {filter === "all"
                    ? "아직 거래 내역이 없습니다"
                    : filter === "income"
                    ? "수입 내역이 없습니다"
                    : "지출 내역이 없습니다"}
                </p>
                {filter === "all" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setEditTarget(null);
                      setTxDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    거래 추가하기
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {displayedTransactions.map((tx) => {
                  const catDef = data.categories.find((c) => c.name === tx.category);
                  return (
                    <div
                      key={tx.id}
                      className="group flex items-start justify-between rounded-md border px-2.5 py-2 hover:bg-muted/40"
                    >
                      <div className="flex items-start gap-2 overflow-hidden">
                        <span className="mt-0.5 text-base leading-none">
                          {catDef?.icon ?? "💸"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">
                            {tx.description}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <Calendar className="h-2.5 w-2.5" />
                              {formatMonthDay(tx.date)}
                            </span>
                            <Badge
                              variant="secondary"
                              className="h-4 px-1 text-[9px]"
                            >
                              {tx.category}
                            </Badge>
                            {tx.paidBy && (
                              <span className="flex items-center gap-0.5">
                                <User className="h-2.5 w-2.5" />
                                {tx.paidBy}
                              </span>
                            )}
                            {tx.receiptNote && (
                              <span className="flex items-center gap-0.5">
                                <FileText className="h-2.5 w-2.5" />
                                메모
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            tx.type === "income"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          )}
                        >
                          {tx.type === "income" ? "+" : "-"}
                          {formatAmount(tx.amount)}
                        </span>
                        <div className="hidden items-center gap-0.5 group-hover:flex">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditDialog(tx)}
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                            onClick={() => handleDelete(tx.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredTransactions.length > 8 && (
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowAll((v) => !v)}
                  >
                    {showAll ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        접기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        {filteredTransactions.length - 8}개 더 보기
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 거래 추가/수정 다이얼로그 */}
      {txDialogOpen && (
        <TransactionDialog
          open={txDialogOpen}
          onClose={closeDialog}
          onSubmit={handleAddTransaction}
          categories={data.categories}
          initial={editTarget}
        />
      )}

      {/* 카테고리 관리 다이얼로그 */}
      <CategoryManagerDialog
        open={catDialogOpen}
        onClose={() => setCatDialogOpen(false)}
        categories={data.categories}
        onAdd={addCategory}
        onRemove={removeCategory}
      />

      {/* 예산 한도 설정 다이얼로그 */}
      <BudgetLimitDialog
        open={limitDialogOpen}
        onClose={() => setLimitDialogOpen(false)}
        currentLimit={data.monthlyBudgetLimit}
        onSave={setMonthlyLimit}
      />
    </>
  );
}
