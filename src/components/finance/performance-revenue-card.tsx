"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  Users,
  CheckCircle,
  Divide,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CircleDot,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { usePerformanceRevenue } from "@/hooks/use-performance-revenue";
import type { RevenueSplitMethod, RevenueParticipant } from "@/types";

// ──────────────────────────────────────────
// 숫자 포맷
// ──────────────────────────────────────────
function formatKRW(amount: number) {
  return amount.toLocaleString("ko-KR") + "원";
}

// ──────────────────────────────────────────
// 분배 방식 배지
// ──────────────────────────────────────────
function SplitMethodBadge({ method }: { method: RevenueSplitMethod }) {
  if (method === "equal") {
    return (
      <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
        <Divide className="h-2.5 w-2.5 mr-0.5" />
        균등
      </Badge>
    );
  }
  return (
    <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0">
      <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
      가중치
    </Badge>
  );
}

// ──────────────────────────────────────────
// 참여자 행 (분배 미리보기 포함)
// ──────────────────────────────────────────
type ParticipantRowProps = {
  participant: RevenueParticipant;
  splitMethod: RevenueSplitMethod;
  onTogglePaid?: () => void;
  onRemove?: () => void;
  readOnly?: boolean;
};

function ParticipantRow({
  participant,
  splitMethod,
  onTogglePaid,
  onRemove,
  readOnly = false,
}: ParticipantRowProps) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      {/* 지급 체크박스 */}
      {!readOnly && onTogglePaid && (
        <button
          onClick={onTogglePaid}
          className={`shrink-0 transition-colors ${
            participant.paid
              ? "text-green-500"
              : "text-muted-foreground/40 hover:text-muted-foreground"
          }`}
          aria-label={participant.paid ? "지급 완료" : "미지급"}
        >
          <CheckCircle className="h-3.5 w-3.5" />
        </button>
      )}
      {readOnly && (
        <CircleDot className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
      )}

      {/* 멤버명 */}
      <span className="text-xs flex-1 truncate">{participant.memberName}</span>

      {/* 가중치 (weighted 모드) */}
      {splitMethod === "weighted" && (
        <Badge
          variant="outline"
          className="text-[9px] px-1 py-0 shrink-0 tabular-nums"
        >
          x{participant.weight}
        </Badge>
      )}

      {/* 분배 금액 */}
      <span
        className={`text-xs font-semibold tabular-nums shrink-0 ${
          participant.paid ? "text-green-600" : "text-foreground"
        }`}
      >
        {formatKRW(participant.amount)}
      </span>

      {/* 삭제 버튼 */}
      {!readOnly && onRemove && (
        <button
          onClick={onRemove}
          className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors"
          aria-label="참여자 삭제"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────
// 수익 등록 폼
// ──────────────────────────────────────────
type AddFormState = {
  eventName: string;
  eventDate: string;
  totalAmount: string;
  deductions: string;
  splitMethod: RevenueSplitMethod;
  note: string;
  newMemberName: string;
  newMemberWeight: string;
  participants: Omit<RevenueParticipant, "amount">[];
};

const INITIAL_FORM: AddFormState = {
  eventName: "",
  eventDate: "",
  totalAmount: "",
  deductions: "0",
  splitMethod: "equal",
  note: "",
  newMemberName: "",
  newMemberWeight: "1",
  participants: [],
};

type AddRevenueFormProps = {
  groupId: string;
  onSave: (params: {
    eventName: string;
    eventDate: string;
    totalAmount: number;
    deductions: number;
    splitMethod: RevenueSplitMethod;
    note: string;
    participants: Omit<RevenueParticipant, "amount">[];
  }) => void;
  onCancel: () => void;
  previewSplit: (
    totalAmount: number,
    deductions: number,
    splitMethod: RevenueSplitMethod,
    participants: Omit<RevenueParticipant, "amount">[]
  ) => RevenueParticipant[];
};

function AddRevenueForm({
  onSave,
  onCancel,
  previewSplit,
}: AddRevenueFormProps) {
  const [form, setForm] = useState<AddFormState>(INITIAL_FORM);

  const netAmount =
    Math.max(0, (parseFloat(form.totalAmount) || 0) - (parseFloat(form.deductions) || 0));

  const preview = previewSplit(
    parseFloat(form.totalAmount) || 0,
    parseFloat(form.deductions) || 0,
    form.splitMethod,
    form.participants
  );

  function handleAddParticipant() {
    const name = form.newMemberName.trim();
    if (!name) {
      toast.error(TOAST.FINANCE.REVENUE_MEMBER_NAME_REQUIRED);
      return;
    }
    const weight = parseFloat(form.newMemberWeight) || 1;
    if (weight <= 0) {
      toast.error(TOAST.FINANCE.REVENUE_WEIGHT_REQUIRED);
      return;
    }
    const alreadyExists = form.participants.some((p) => p.memberName === name);
    if (alreadyExists) {
      toast.error(TOAST.FINANCE.REVENUE_MEMBER_DUPLICATE);
      return;
    }
    setForm((prev) => ({
      ...prev,
      newMemberName: "",
      newMemberWeight: "1",
      participants: [
        ...prev.participants,
        {
          memberId: crypto.randomUUID(),
          memberName: name,
          weight,
          paid: false,
        },
      ],
    }));
  }

  function handleRemoveParticipant(memberId: string) {
    setForm((prev) => ({
      ...prev,
      participants: prev.participants.filter((p) => p.memberId !== memberId),
    }));
  }

  function handleSubmit() {
    if (!form.eventName.trim()) {
      toast.error(TOAST.FINANCE.REVENUE_EVENT_NAME_REQUIRED);
      return;
    }
    if (!form.eventDate) {
      toast.error(TOAST.FINANCE.REVENUE_DATE_REQUIRED);
      return;
    }
    const totalAmount = parseFloat(form.totalAmount);
    if (!totalAmount || totalAmount <= 0) {
      toast.error(TOAST.FINANCE.REVENUE_AMOUNT_REQUIRED);
      return;
    }
    if (form.participants.length === 0) {
      toast.error(TOAST.FINANCE.REVENUE_PARTICIPANT_REQUIRED);
      return;
    }
    onSave({
      eventName: form.eventName.trim(),
      eventDate: form.eventDate,
      totalAmount,
      deductions: parseFloat(form.deductions) || 0,
      splitMethod: form.splitMethod,
      note: form.note.trim(),
      participants: form.participants,
    });
  }

  return (
    <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
      {/* 이벤트명 */}
      <div className="space-y-1">
        <Label className="text-[11px]">이벤트명</Label>
        <Input
          value={form.eventName}
          onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
          placeholder="예: 봄 정기공연, 대회 입상"
          className="h-7 text-xs"
        />
      </div>

      {/* 날짜 + 총 수익 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px]">날짜</Label>
          <Input
            type="date"
            value={form.eventDate}
            onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">총 수익 (원)</Label>
          <Input
            type="number"
            min="0"
            value={form.totalAmount}
            onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
            placeholder="0"
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* 공제액 + 분배 방식 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px]">공제액 (원)</Label>
          <Input
            type="number"
            min="0"
            value={form.deductions}
            onChange={(e) => setForm((f) => ({ ...f, deductions: e.target.value }))}
            placeholder="0"
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">분배 방식</Label>
          <Select
            value={form.splitMethod}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, splitMethod: v as RevenueSplitMethod }))
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equal">균등 분배</SelectItem>
              <SelectItem value="weighted">가중치 분배</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 실 분배액 표시 */}
      {form.totalAmount && (
        <div className="text-[11px] text-muted-foreground bg-background rounded px-2 py-1 flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          <span>
            실 분배액:{" "}
            <span className="font-medium text-foreground">
              {formatKRW(netAmount)}
            </span>
            {parseFloat(form.deductions) > 0 && (
              <span className="ml-1 text-orange-500">
                (공제 {formatKRW(parseFloat(form.deductions) || 0)})
              </span>
            )}
          </span>
        </div>
      )}

      {/* 메모 */}
      <div className="space-y-1">
        <Label className="text-[11px]">메모 (선택)</Label>
        <Input
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          placeholder="출연료, 상금 등 수익 출처"
          className="h-7 text-xs"
        />
      </div>

      <Separator />

      {/* 참여자 추가 */}
      <div className="space-y-1">
        <Label className="text-[11px]">참여자 추가</Label>
        <div className="flex gap-1">
          <Input
            value={form.newMemberName}
            onChange={(e) => setForm((f) => ({ ...f, newMemberName: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
            placeholder="멤버 이름"
            className="h-7 text-xs flex-1"
          />
          {form.splitMethod === "weighted" && (
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={form.newMemberWeight}
              onChange={(e) =>
                setForm((f) => ({ ...f, newMemberWeight: e.target.value }))
              }
              placeholder="가중치"
              className="h-7 text-xs w-16"
            />
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2"
            onClick={handleAddParticipant}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 분배 미리보기 */}
      {form.participants.length > 0 && (
        <div className="space-y-0.5 rounded-lg border bg-background p-2">
          <p className="text-[10px] text-muted-foreground mb-1 font-medium">
            분배 미리보기
          </p>
          {preview.map((p) => (
            <ParticipantRow
              key={p.memberId}
              participant={p}
              splitMethod={form.splitMethod}
              readOnly
              onRemove={() => handleRemoveParticipant(p.memberId)}
            />
          ))}
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-1.5 justify-end">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
        <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
          등록
        </Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// 수익 항목 카드
// ──────────────────────────────────────────
type RevenueItemProps = {
  entry: ReturnType<typeof usePerformanceRevenue>["entries"][0];
  onTogglePaid: (memberId: string) => void;
  onToggleSettled: () => void;
  onRemove: () => void;
  onRemoveParticipant: (memberId: string) => void;
};

function RevenueItem({
  entry,
  onTogglePaid,
  onToggleSettled,
  onRemove,
  onRemoveParticipant,
}: RevenueItemProps) {
  const [open, setOpen] = useState(false);

  const paidCount = entry.participants.filter((p) => p.paid).length;
  const totalCount = entry.participants.length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card">
        {/* 헤더 행 */}
        <div className="flex items-center gap-2 px-3 py-2">
          <CollapsibleTrigger asChild>
            <button className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              {open ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </CollapsibleTrigger>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium truncate">
                {entry.eventName}
              </span>
              <SplitMethodBadge method={entry.splitMethod} />
              {entry.settled && (
                <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                  정산완료
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
              <span>{entry.eventDate}</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="font-medium text-foreground">
                {formatKRW(entry.totalAmount)}
              </span>
              {entry.deductions > 0 && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-orange-500">
                    공제 {formatKRW(entry.deductions)}
                  </span>
                </>
              )}
              <span className="text-muted-foreground/40">·</span>
              <span className="flex items-center gap-0.5">
                <Users className="h-2.5 w-2.5" />
                {paidCount}/{totalCount}명 지급
              </span>
            </div>
          </div>

          {/* 정산 완료 버튼 + 삭제 */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant={entry.settled ? "secondary" : "outline"}
              className={`h-6 text-[10px] px-1.5 ${
                entry.settled
                  ? "text-green-600 bg-green-50 dark:bg-green-900/20"
                  : ""
              }`}
              onClick={onToggleSettled}
            >
              <CheckCircle className="h-3 w-3 mr-0.5" />
              {entry.settled ? "완료" : "정산"}
            </Button>
            <button
              onClick={onRemove}
              className="text-muted-foreground/40 hover:text-destructive transition-colors"
              aria-label="수익 삭제"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* 펼쳐지는 상세 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-1">
            <Separator className="mb-2" />

            {/* 메모 */}
            {entry.note && (
              <p className="text-[11px] text-muted-foreground italic mb-2">
                {entry.note}
              </p>
            )}

            {/* 참여자 목록 */}
            {entry.participants.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-1">
                참여자가 없습니다
              </p>
            ) : (
              entry.participants.map((p) => (
                <ParticipantRow
                  key={p.memberId}
                  participant={p}
                  splitMethod={entry.splitMethod}
                  onTogglePaid={() => onTogglePaid(p.memberId)}
                  onRemove={
                    !entry.settled
                      ? () => onRemoveParticipant(p.memberId)
                      : undefined
                  }
                />
              ))
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ──────────────────────────────────────────
// 메인 카드
// ──────────────────────────────────────────
type PerformanceRevenueCardProps = {
  groupId: string;
};

export function PerformanceRevenueCard({ groupId }: PerformanceRevenueCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "unsettled" | "settled">("all");

  const {
    entries,
    addEntry,
    removeEntry,
    removeParticipant,
    togglePaid,
    toggleSettled,
    previewSplit,
    stats,
  } = usePerformanceRevenue(groupId);

  const filteredEntries = entries.filter((e) => {
    if (filter === "unsettled") return !e.settled;
    if (filter === "settled") return e.settled;
    return true;
  });

  function handleAddEntry(params: {
    eventName: string;
    eventDate: string;
    totalAmount: number;
    deductions: number;
    splitMethod: RevenueSplitMethod;
    note: string;
    participants: Omit<RevenueParticipant, "amount">[];
  }) {
    addEntry(params);
    setShowAddForm(false);
    toast.success(TOAST.FINANCE.REVENUE_REGISTERED);
  }

  function handleRemoveEntry(entryId: string) {
    removeEntry(entryId);
    toast.success(TOAST.FINANCE.REVENUE_DELETED);
  }

  return (
    <Card className="mt-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="py-2 px-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 text-left">
                <DollarSign className="h-3.5 w-3.5 text-green-600" />
                <CardTitle className="text-xs font-medium">
                  공연 수익 분배
                </CardTitle>
                {stats.unsettledCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0 gap-0.5">
                    <AlertCircle className="h-2.5 w-2.5" />
                    미정산 {stats.unsettledCount}건
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>

            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2 gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddForm((v) => !v);
                if (!isOpen) setIsOpen(true);
              }}
            >
              <Plus className="h-3 w-3" />
              수익 등록
            </Button>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-0 space-y-3">
            {/* 통계 요약 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border bg-muted/30 px-2.5 py-2 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  총 수익
                </p>
                <p className="text-xs font-semibold tabular-nums text-green-600">
                  {formatKRW(stats.totalRevenue)}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-2.5 py-2 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  총 분배액
                </p>
                <p className="text-xs font-semibold tabular-nums text-blue-600">
                  {formatKRW(stats.totalDistributed)}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-2.5 py-2 text-center">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  미정산
                </p>
                <p
                  className={`text-xs font-semibold tabular-nums ${
                    stats.unsettledCount > 0
                      ? "text-orange-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {stats.unsettledCount}건
                </p>
              </div>
            </div>

            {/* 수익 등록 폼 */}
            {showAddForm && (
              <AddRevenueForm
                groupId={groupId}
                previewSplit={previewSplit}
                onSave={(params) => {
                  handleAddEntry(params);
                }}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            {/* 필터 탭 */}
            <div className="flex items-center rounded-md border overflow-hidden w-fit">
              {(
                [
                  { value: "all", label: "전체" },
                  { value: "unsettled", label: "미정산" },
                  { value: "settled", label: "완료" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-3 h-6 text-[11px] transition-colors ${
                    filter === opt.value
                      ? "bg-muted text-foreground font-medium"
                      : "bg-background text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* 수익 목록 */}
            {filteredEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                {filter === "all"
                  ? "등록된 수익이 없습니다"
                  : filter === "unsettled"
                  ? "미정산 수익이 없습니다"
                  : "완료된 정산이 없습니다"}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredEntries.map((entry) => (
                  <RevenueItem
                    key={entry.id}
                    entry={entry}
                    onTogglePaid={(memberId) => togglePaid(entry.id, memberId)}
                    onToggleSettled={() => toggleSettled(entry.id)}
                    onRemove={() => handleRemoveEntry(entry.id)}
                    onRemoveParticipant={(memberId) =>
                      removeParticipant(entry.id, memberId)
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
