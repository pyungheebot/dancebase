"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  Circle,
  Banknote,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { usePerformanceFee } from "@/hooks/use-performance-fee";
import type {
  PerformanceFeeRole,
  PerformanceFeeAdjustmentType,
  PerformanceFeeEntry,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const ROLE_LABELS: Record<PerformanceFeeRole, string> = {
  main: "메인",
  sub: "서브",
  extra: "엑스트라",
  staff: "스태프",
};

const ROLE_COLORS: Record<PerformanceFeeRole, string> = {
  main: "bg-purple-100 text-purple-700 border-purple-200",
  sub: "bg-blue-100 text-blue-700 border-blue-200",
  extra: "bg-orange-100 text-orange-700 border-orange-200",
  staff: "bg-gray-100 text-gray-600 border-gray-200",
};

const ROLE_ORDER: PerformanceFeeRole[] = ["main", "sub", "extra", "staff"];

const ADJ_TYPE_LABELS: Record<PerformanceFeeAdjustmentType, string> = {
  rehearsal: "리허설 수당",
  overtime: "초과근무 수당",
  transport: "교통비 공제",
  meal: "식비 공제",
  other: "기타",
};

const ADJ_TYPES_ALLOWANCE: PerformanceFeeAdjustmentType[] = [
  "rehearsal",
  "overtime",
  "other",
];
const ADJ_TYPES_DEDUCTION: PerformanceFeeAdjustmentType[] = [
  "transport",
  "meal",
  "other",
];

function formatKRW(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

// ============================================================
// 멤버 추가/수정 폼 타입
// ============================================================

type EntryFormData = {
  memberName: string;
  role: PerformanceFeeRole;
  baseFee: string;
  notes: string;
};

const EMPTY_ENTRY_FORM: EntryFormData = {
  memberName: "",
  role: "sub",
  baseFee: "",
  notes: "",
};

// ============================================================
// 수당/공제 항목 폼 타입
// ============================================================

type AdjFormData = {
  kind: "allowance" | "deduction";
  type: PerformanceFeeAdjustmentType;
  label: string;
  amount: string;
};

const EMPTY_ADJ_FORM: AdjFormData = {
  kind: "allowance",
  type: "rehearsal",
  label: "",
  amount: "",
};

// ============================================================
// 멤버 추가/수정 다이얼로그
// ============================================================

function EntryDialog({
  open,
  onClose,
  onSubmit,
  initial,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EntryFormData) => void;
  initial?: EntryFormData;
  title: string;
}) {
  const [form, setForm] = useState<EntryFormData>(initial ?? EMPTY_ENTRY_FORM);

  if (!open) return null;

  function set<K extends keyof EntryFormData>(key: K, value: EntryFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.memberName.trim()) {
      toast.error("멤버 이름을 입력해주세요.");
      return;
    }
    const fee = parseInt(form.baseFee.replace(/,/g, ""), 10);
    if (isNaN(fee) || fee < 0) {
      toast.error("올바른 기본 출연료를 입력해주세요.");
      return;
    }
    onSubmit({ ...form, baseFee: String(fee) });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">멤버 이름 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="이름 입력"
              value={form.memberName}
              onChange={(e) => set("memberName", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">역할 *</Label>
              <Select
                value={form.role}
                onValueChange={(v) => set("role", v as PerformanceFeeRole)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_ORDER.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">기본 출연료 (원) *</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 100000"
                value={form.baseFee}
                onChange={(e) =>
                  set("baseFee", e.target.value.replace(/[^0-9]/g, ""))
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              className="text-xs min-h-[60px] resize-none"
              placeholder="추가 메모"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
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

// ============================================================
// 수당/공제 항목 추가 다이얼로그
// ============================================================

function AdjDialog({
  open,
  onClose,
  onSubmit,
  memberName,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AdjFormData) => void;
  memberName: string;
}) {
  const [form, setForm] = useState<AdjFormData>(EMPTY_ADJ_FORM);

  if (!open) return null;

  function set<K extends keyof AdjFormData>(key: K, value: AdjFormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // kind 변경 시 type 초기화
      if (key === "kind") {
        next.type =
          value === "allowance" ? "rehearsal" : "transport";
      }
      return next;
    });
  }

  function handleSubmit() {
    const amt = parseInt(form.amount.replace(/,/g, ""), 10);
    if (isNaN(amt) || amt <= 0) {
      toast.error("올바른 금액을 입력해주세요.");
      return;
    }
    const label = form.label.trim() || ADJ_TYPE_LABELS[form.type];
    onSubmit({ ...form, label, amount: String(amt) });
  }

  const typeOptions =
    form.kind === "allowance" ? ADJ_TYPES_ALLOWANCE : ADJ_TYPES_DEDUCTION;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            항목 추가 — {memberName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">구분 *</Label>
            <Select
              value={form.kind}
              onValueChange={(v) =>
                set("kind", v as "allowance" | "deduction")
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allowance" className="text-xs">
                  추가 수당
                </SelectItem>
                <SelectItem value="deduction" className="text-xs">
                  공제 항목
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">항목 유형 *</Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                set("type", v as PerformanceFeeAdjustmentType)
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {ADJ_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">설명 (선택)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="항목 설명 (비워두면 유형명 사용)"
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">금액 (원) *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 30000"
              value={form.amount}
              onChange={(e) =>
                set("amount", e.target.value.replace(/[^0-9]/g, ""))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 멤버 행 컴포넌트
// ============================================================

function EntryRow({
  entry,
  onEdit,
  onDelete,
  onToggleSettle,
  onAddAdj,
  onDeleteAdj,
}: {
  entry: PerformanceFeeEntry;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSettle: () => void;
  onAddAdj: () => void;
  onDeleteAdj: (adjId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSettled = entry.status === "settled";

  const allowances = entry.adjustments.filter((a) => a.amount > 0);
  const deductions = entry.adjustments.filter((a) => a.amount < 0);

  return (
    <div className="border rounded-md overflow-hidden">
      {/* 헤더 행 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-background">
        {/* 정산 상태 아이콘 */}
        <button
          type="button"
          onClick={onToggleSettle}
          className="flex-shrink-0"
          title={isSettled ? "정산 완료 (클릭 시 취소)" : "미정산 (클릭 시 완료 처리)"}
        >
          {isSettled ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* 이름 & 역할 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-medium truncate ${
                isSettled ? "line-through text-muted-foreground" : ""
              }`}
            >
              {entry.memberName}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[entry.role]}`}
            >
              {ROLE_LABELS[entry.role]}
            </Badge>
            {isSettled && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
              >
                정산완료
              </Badge>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <span>기본 {formatKRW(entry.baseFee)}</span>
            {entry.adjustments.length > 0 && (
              <>
                <span>·</span>
                <span
                  className={
                    entry.finalAmount >= entry.baseFee
                      ? "text-blue-600"
                      : "text-red-500"
                  }
                >
                  최종 {formatKRW(entry.finalAmount)}
                </span>
              </>
            )}
            {entry.settledAt && (
              <>
                <span>·</span>
                <span>{entry.settledAt} 정산</span>
              </>
            )}
          </div>
        </div>

        {/* 최종 금액 */}
        <span className="text-xs font-semibold flex-shrink-0 tabular-nums">
          {formatKRW(entry.finalAmount)}
        </span>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setExpanded((v) => !v)}
            title="상세 보기"
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onEdit}
            title="수정"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 펼침 영역: 수당/공제 상세 */}
      {expanded && (
        <div className="border-t bg-muted/20 px-3 py-2 space-y-2">
          {/* 수당 */}
          {allowances.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">
                추가 수당
              </p>
              {allowances.map((adj) => (
                <div
                  key={adj.id}
                  className="flex items-center justify-between gap-1"
                >
                  <span className="text-xs text-blue-700 flex-1 truncate">
                    + {adj.label}
                  </span>
                  <span className="text-xs text-blue-700 tabular-nums flex-shrink-0">
                    {formatKRW(adj.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteAdj(adj.id)}
                    className="text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 공제 */}
          {deductions.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">
                공제 항목
              </p>
              {deductions.map((adj) => (
                <div
                  key={adj.id}
                  className="flex items-center justify-between gap-1"
                >
                  <span className="text-xs text-red-600 flex-1 truncate">
                    - {adj.label}
                  </span>
                  <span className="text-xs text-red-600 tabular-nums flex-shrink-0">
                    {formatKRW(Math.abs(adj.amount))}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteAdj(adj.id)}
                    className="text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 합계 */}
          {entry.adjustments.length > 0 && (
            <div className="flex items-center justify-between pt-1 border-t">
              <span className="text-[10px] font-medium text-muted-foreground">
                최종 정산 금액
              </span>
              <span className="text-xs font-semibold tabular-nums">
                {formatKRW(entry.finalAmount)}
              </span>
            </div>
          )}

          {/* 메모 */}
          {entry.notes && (
            <p className="text-[10px] text-muted-foreground pt-1 border-t">
              {entry.notes}
            </p>
          )}

          {/* 항목 추가 버튼 */}
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] w-full"
            onClick={onAddAdj}
          >
            <Plus className="h-3 w-3 mr-1" />
            수당/공제 항목 추가
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

export function PerformanceFeeCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    addAdjustment,
    deleteAdjustment,
    settleEntry,
    unsettleEntry,
    stats,
  } = usePerformanceFee(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PerformanceFeeEntry | null>(null);
  const [adjTarget, setAdjTarget] = useState<PerformanceFeeEntry | null>(null);

  // 멤버 추가
  function handleAdd(data: EntryFormData) {
    addEntry({
      memberName: data.memberName.trim(),
      role: data.role,
      baseFee: parseInt(data.baseFee, 10),
      notes: data.notes.trim() || undefined,
    });
    setAddDialogOpen(false);
    toast.success("멤버가 추가되었습니다.");
  }

  // 멤버 수정
  function handleEdit(data: EntryFormData) {
    if (!editTarget) return;
    const ok = updateEntry(editTarget.id, {
      memberName: data.memberName.trim(),
      role: data.role,
      baseFee: parseInt(data.baseFee, 10),
      notes: data.notes.trim() || undefined,
    });
    if (ok) {
      toast.success("정보가 수정되었습니다.");
    } else {
      toast.error(TOAST.UPDATE_ERROR);
    }
    setEditTarget(null);
  }

  // 멤버 삭제
  function handleDelete(entryId: string, memberName: string) {
    const ok = deleteEntry(entryId);
    if (ok) {
      toast.success(`"${memberName}" 항목이 삭제되었습니다.`);
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // 정산 토글
  function handleToggleSettle(entry: PerformanceFeeEntry) {
    if (entry.status === "settled") {
      const ok = unsettleEntry(entry.id);
      if (ok) {
        toast.success("정산이 취소되었습니다.");
      } else {
        toast.error("정산 취소에 실패했습니다.");
      }
    } else {
      const ok = settleEntry(entry.id);
      if (ok) {
        toast.success("정산 완료로 처리했습니다.");
      } else {
        toast.error("정산 처리에 실패했습니다.");
      }
    }
  }

  // 수당/공제 추가
  function handleAddAdj(data: AdjFormData) {
    if (!adjTarget) return;
    const rawAmount = parseInt(data.amount, 10);
    const finalAmount =
      data.kind === "deduction" ? -Math.abs(rawAmount) : Math.abs(rawAmount);
    const ok = addAdjustment(adjTarget.id, {
      type: data.type,
      label: data.label.trim() || ADJ_TYPE_LABELS[data.type],
      amount: finalAmount,
    });
    if (ok) {
      toast.success("항목이 추가되었습니다.");
    } else {
      toast.error("항목 추가에 실패했습니다.");
    }
    setAdjTarget(null);
  }

  // 수당/공제 삭제
  function handleDeleteAdj(entryId: string, adjId: string) {
    const ok = deleteAdjustment(entryId, adjId);
    if (!ok) toast.error("항목 삭제에 실패했습니다.");
  }

  // 편집 초기 폼 생성
  function buildEditForm(e: PerformanceFeeEntry): EntryFormData {
    return {
      memberName: e.memberName,
      role: e.role,
      baseFee: String(e.baseFee),
      notes: e.notes ?? "",
    };
  }

  // 역할별 그룹핑
  const entriesByRole = ROLE_ORDER.reduce(
    (acc, role) => {
      acc[role] = entries.filter((e) => e.role === role);
      return acc;
    },
    {} as Record<PerformanceFeeRole, PerformanceFeeEntry[]>
  );

  return (
    <>
      <Card className="overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Banknote className="h-4 w-4 text-green-600" />
                  공연 출연료 정산
                  {entries.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {entries.length}명
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {stats.totalAmount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {formatKRW(stats.totalAmount)}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {/* 요약 통계 */}
              {entries.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md bg-muted/40 px-2 py-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground">전체</p>
                    <p className="text-xs font-semibold">
                      {formatKRW(stats.totalAmount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {stats.totalCount}명
                    </p>
                  </div>
                  <div className="rounded-md bg-green-50 px-2 py-1.5 text-center">
                    <p className="text-[10px] text-green-600">정산완료</p>
                    <p className="text-xs font-semibold text-green-700">
                      {formatKRW(stats.settledAmount)}
                    </p>
                    <p className="text-[10px] text-green-600">
                      {stats.settledCount}명
                    </p>
                  </div>
                  <div className="rounded-md bg-orange-50 px-2 py-1.5 text-center">
                    <p className="text-[10px] text-orange-600">미정산</p>
                    <p className="text-xs font-semibold text-orange-700">
                      {formatKRW(stats.pendingAmount)}
                    </p>
                    <p className="text-[10px] text-orange-600">
                      {stats.pendingCount}명
                    </p>
                  </div>
                </div>
              )}

              {/* 멤버 목록 */}
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : entries.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Banknote className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">등록된 출연료 정산 항목이 없습니다.</p>
                  <p className="text-[10px] mt-1">
                    아래 버튼을 눌러 멤버를 추가해보세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ROLE_ORDER.filter(
                    (role) => entriesByRole[role].length > 0
                  ).map((role) => (
                    <div key={role} className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[role]}`}
                        >
                          {ROLE_LABELS[role]}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {entriesByRole[role].length}명 ·{" "}
                          {formatKRW(
                            entriesByRole[role].reduce(
                              (s, e) => s + e.finalAmount,
                              0
                            )
                          )}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {entriesByRole[role].map((entry) => (
                          <EntryRow
                            key={entry.id}
                            entry={entry}
                            onEdit={() => setEditTarget(entry)}
                            onDelete={() =>
                              handleDelete(entry.id, entry.memberName)
                            }
                            onToggleSettle={() => handleToggleSettle(entry)}
                            onAddAdj={() => setAdjTarget(entry)}
                            onDeleteAdj={(adjId) =>
                              handleDeleteAdj(entry.id, adjId)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 멤버 추가 버튼 */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                멤버 추가
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 멤버 추가 다이얼로그 */}
      <EntryDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAdd}
        title="출연료 정산 멤버 추가"
      />

      {/* 멤버 수정 다이얼로그 */}
      {editTarget && (
        <EntryDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          initial={buildEditForm(editTarget)}
          title="출연료 정산 멤버 수정"
        />
      )}

      {/* 수당/공제 항목 추가 다이얼로그 */}
      {adjTarget && (
        <AdjDialog
          open={!!adjTarget}
          onClose={() => setAdjTarget(null)}
          onSubmit={handleAddAdj}
          memberName={adjTarget.memberName}
        />
      )}
    </>
  );
}
