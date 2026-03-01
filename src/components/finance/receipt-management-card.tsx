"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Receipt,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckCircle2,
  XCircle,
  Banknote,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useReceiptManagement } from "@/hooks/use-receipt-management";
import type { ReceiptCategory, ReceiptStatus } from "@/types";

// ============================================
// 상수 / 설정
// ============================================

const CATEGORY_CONFIG: Record<
  ReceiptCategory,
  { label: string; colorClass: string; barClass: string }
> = {
  venue: {
    label: "장소",
    colorClass:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/40",
    barClass: "bg-blue-500",
  },
  costume: {
    label: "의상",
    colorClass:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700/40",
    barClass: "bg-purple-500",
  },
  equipment: {
    label: "장비",
    colorClass:
      "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-700/40",
    barClass: "bg-cyan-500",
  },
  food: {
    label: "식비",
    colorClass:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700/40",
    barClass: "bg-orange-500",
  },
  transport: {
    label: "교통",
    colorClass:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/40",
    barClass: "bg-green-500",
  },
  marketing: {
    label: "홍보",
    colorClass:
      "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-700/40",
    barClass: "bg-pink-500",
  },
  other: {
    label: "기타",
    colorClass:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/40",
    barClass: "bg-gray-400",
  },
};

const STATUS_CONFIG: Record<
  ReceiptStatus,
  { label: string; colorClass: string }
> = {
  pending: {
    label: "대기",
    colorClass:
      "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/40",
  },
  approved: {
    label: "승인",
    colorClass:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/40",
  },
  rejected: {
    label: "거절",
    colorClass:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/40",
  },
  reimbursed: {
    label: "환급",
    colorClass:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/40",
  },
};

const ALL_CATEGORIES: ReceiptCategory[] = [
  "venue",
  "costume",
  "equipment",
  "food",
  "transport",
  "marketing",
  "other",
];

const ALL_STATUSES: ReceiptStatus[] = [
  "pending",
  "approved",
  "rejected",
  "reimbursed",
];

// ============================================
// 금액 포맷
// ============================================

function formatKRW(amount: number): string {
  return `₩${amount.toLocaleString("ko-KR")}`;
}

// ============================================
// 영수증 등록 다이얼로그
// ============================================

type AddDialogProps = {
  onAdd: (
    title: string,
    amount: number,
    category: ReceiptCategory,
    date: string,
    submittedBy: string,
    vendor?: string,
    notes?: string
  ) => boolean;
};

function AddReceiptDialog({ onAdd }: AddDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ReceiptCategory>("other");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submittedBy, setSubmittedBy] = useState("");
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit() {
    if (!title.trim()) {
      toast.error(TOAST.FINANCE.RECEIPT_TITLE_REQUIRED);
      return;
    }
    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error(TOAST.FINANCE.RECEIPT_AMOUNT_REQUIRED);
      return;
    }
    if (!submittedBy.trim()) {
      toast.error(TOAST.FINANCE.RECEIPT_SUBMITTER_REQUIRED);
      return;
    }
    if (!date) {
      toast.error(TOAST.FINANCE.RECEIPT_DATE_REQUIRED);
      return;
    }

    const result = onAdd(
      title,
      parsedAmount,
      category,
      date,
      submittedBy,
      vendor || undefined,
      notes || undefined
    );

    if (result) {
      toast.success(TOAST.FINANCE.RECEIPT_REGISTERED);
      setTitle("");
      setAmount("");
      setCategory("other");
      setDate(new Date().toISOString().slice(0, 10));
      setSubmittedBy("");
      setVendor("");
      setNotes("");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          영수증 등록
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">영수증 등록</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs">제목 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 연습실 대여비"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          {/* 금액 */}
          <div className="space-y-1">
            <Label className="text-xs">금액 (원) *</Label>
            <Input
              className="h-8 text-xs"
              type="number"
              min={0}
              placeholder="예: 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs">카테고리 *</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ReceiptCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {CATEGORY_CONFIG[cat].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs">날짜 *</Label>
            <Input
              className="h-8 text-xs"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          {/* 제출자 */}
          <div className="space-y-1">
            <Label className="text-xs">제출자 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 홍길동"
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
            />
          </div>
          {/* 업체 */}
          <div className="space-y-1">
            <Label className="text-xs">업체 (선택)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: OO댄스스튜디오"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
          </div>
          {/* 비고 */}
          <div className="space-y-1">
            <Label className="text-xs">비고 (선택)</Label>
            <Textarea
              className="text-xs resize-none"
              rows={2}
              placeholder="추가 메모..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button className="w-full h-8 text-xs" onClick={handleSubmit}>
            등록
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 승인자 이름 입력 미니 폼
// ============================================

type ApproveInlineProps = {
  onApprove: (approverName: string) => void;
};

function ApproveInline({ onApprove }: ApproveInlineProps) {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        <CheckCircle2 className="h-3 w-3" />
        승인
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        className="h-5 text-[10px] w-20 px-1"
        placeholder="승인자"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <button
        onClick={() => {
          if (!name.trim()) return;
          onApprove(name.trim());
          setOpen(false);
          setName("");
        }}
        className="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400"
      >
        확인
      </button>
      <button
        onClick={() => setOpen(false)}
        className="text-[10px] text-gray-400 hover:text-gray-600"
      >
        취소
      </button>
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

type Props = {
  groupId: string;
};

export function ReceiptManagementCard({ groupId }: Props) {
  const [open, setOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<ReceiptCategory | "all">("all");

  const {
    receipts,
    addReceipt,
    deleteReceipt,
    approveReceipt,
    rejectReceipt,
    reimburseReceipt,
    totalReceipts,
    totalAmount,
    pendingAmount,
    approvedAmount,
    reimbursedAmount,
    categoryBreakdown,
  } = useReceiptManagement(groupId);

  // 필터 적용
  const filtered = receipts.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    return true;
  });

  // 카테고리 바 차트 최대값
  const maxCategoryAmount = Math.max(
    ...ALL_CATEGORIES.map((c) => categoryBreakdown[c]),
    1
  );

  function handleApprove(id: string, approverName: string) {
    approveReceipt(id, approverName);
    toast.success(TOAST.FINANCE.RECEIPT_APPROVED);
  }

  function handleReject(id: string) {
    rejectReceipt(id);
    toast.success(TOAST.FINANCE.RECEIPT_REJECTED);
  }

  function handleReimburse(id: string) {
    reimburseReceipt(id);
    toast.success(TOAST.FINANCE.RECEIPT_REFUNDED);
  }

  function handleDelete(id: string) {
    deleteReceipt(id);
    toast.success(TOAST.FINANCE.RECEIPT_DELETED);
  }

  return (
    <Card className="border border-border/60 shadow-sm">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">비용 영수증 관리</span>
              <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border">
                {totalReceipts}건
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <AddReceiptDialog onAdd={addReceipt} />
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4 space-y-4">
            {/* 금액 통계 */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatBox label="전체 금액" value={formatKRW(totalAmount)} color="text-foreground" />
              <StatBox label="대기 금액" value={formatKRW(pendingAmount)} color="text-yellow-600 dark:text-yellow-400" />
              <StatBox label="승인 금액" value={formatKRW(approvedAmount)} color="text-blue-600 dark:text-blue-400" />
              <StatBox label="환급 금액" value={formatKRW(reimbursedAmount)} color="text-green-600 dark:text-green-400" />
            </div>

            {/* 카테고리별 지출 분포 */}
            {totalAmount > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground">카테고리별 지출</p>
                <div className="space-y-1.5">
                  {ALL_CATEGORIES.filter((c) => categoryBreakdown[c] > 0).map(
                    (cat) => {
                      const cfg = CATEGORY_CONFIG[cat];
                      const pct = Math.round(
                        (categoryBreakdown[cat] / maxCategoryAmount) * 100
                      );
                      return (
                        <div key={cat} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-10 shrink-0">
                            {cfg.label}
                          </span>
                          <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${cfg.barClass} transition-all duration-300`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-20 text-right shrink-0">
                            {formatKRW(categoryBreakdown[cat])}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* 필터 영역 */}
            <div className="flex flex-wrap items-center gap-2">
              {/* 상태 필터 탭 */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    statusFilter === "all"
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/40"
                  }`}
                >
                  전체
                </button>
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      statusFilter === s
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/40"
                    }`}
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>

              {/* 카테고리 필터 */}
              <Select
                value={categoryFilter}
                onValueChange={(v) =>
                  setCategoryFilter(v as ReceiptCategory | "all")
                }
              >
                <SelectTrigger className="h-6 text-[10px] w-24 ml-auto">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">전체 카테고리</SelectItem>
                  {ALL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {CATEGORY_CONFIG[cat].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 영수증 목록 */}
            {filtered.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                {totalReceipts === 0
                  ? "등록된 영수증이 없습니다."
                  : "조건에 맞는 영수증이 없습니다."}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((entry) => {
                  const catCfg = CATEGORY_CONFIG[entry.category];
                  const stsCfg = STATUS_CONFIG[entry.status];
                  return (
                    <div
                      key={entry.id}
                      className="border border-border/50 rounded-lg px-3 py-2.5 bg-card hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        {/* 좌측 정보 */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-medium truncate">
                              {entry.title}
                            </span>
                            <Badge
                              className={`text-[10px] px-1.5 py-0 border ${catCfg.colorClass}`}
                            >
                              {catCfg.label}
                            </Badge>
                            <Badge
                              className={`text-[10px] px-1.5 py-0 border ${stsCfg.colorClass}`}
                            >
                              {stsCfg.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                            <span className="font-semibold text-xs text-foreground">
                              {formatKRW(entry.amount)}
                            </span>
                            <span>{entry.date}</span>
                            <span>제출: {entry.submittedBy}</span>
                            {entry.vendor && <span>업체: {entry.vendor}</span>}
                            {entry.approvedBy && (
                              <span>승인: {entry.approvedBy}</span>
                            )}
                          </div>
                          {entry.notes && (
                            <p className="text-[10px] text-muted-foreground/80 line-clamp-1">
                              {entry.notes}
                            </p>
                          )}
                        </div>

                        {/* 우측 액션 */}
                        <div className="flex items-center gap-1 shrink-0">
                          {entry.status === "pending" && (
                            <>
                              <ApproveInline
                                onApprove={(name) => handleApprove(entry.id, name)}
                              />
                              <button
                                onClick={() => handleReject(entry.id)}
                                className="inline-flex items-center gap-0.5 text-[10px] text-red-500 hover:text-red-600 dark:text-red-400"
                              >
                                <XCircle className="h-3 w-3" />
                                거절
                              </button>
                            </>
                          )}
                          {entry.status === "approved" && (
                            <button
                              onClick={() => handleReimburse(entry.id)}
                              className="inline-flex items-center gap-0.5 text-[10px] text-green-600 hover:text-green-700 dark:text-green-400"
                            >
                              <Banknote className="h-3 w-3" />
                              환급
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors ml-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================
// 통계 박스 (내부 컴포넌트)
// ============================================

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-muted/40 rounded-lg px-3 py-2 space-y-0.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-xs font-semibold ${color}`}>{value}</p>
    </div>
  );
}
