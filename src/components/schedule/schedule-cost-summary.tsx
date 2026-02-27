"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Wallet,
  Plus,
  Trash2,
  Receipt,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useScheduleCost, CATEGORY_LABELS } from "@/hooks/use-schedule-cost";

type ScheduleCostSummaryProps = {
  scheduleId: string;
  /** RSVP going 수 (기본 참석 인원으로 사용) */
  defaultAttendeeCount?: number;
  /** 리더/매니저 여부 */
  canEdit?: boolean;
};

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  venue: "bg-purple-100 text-purple-700",
  drink: "bg-cyan-100 text-cyan-700",
  transport: "bg-orange-100 text-orange-700",
  food: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-700",
};

export function ScheduleCostSummary({
  scheduleId,
  defaultAttendeeCount = 0,
  canEdit = false,
}: ScheduleCostSummaryProps) {
  const { expenses, addExpense, deleteExpense, totalAmount, perPerson, byCategory } =
    useScheduleCost(scheduleId);

  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // 폼 상태
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [category, setCategory] = useState("other");

  // 참석 인원 (수동 override 가능)
  const [attendeeCount, setAttendeeCount] = useState<number>(defaultAttendeeCount);

  const handleAdd = () => {
    const trimmedTitle = title.trim();
    const parsedAmount = Number(amount);

    if (!trimmedTitle) {
      toast.error("항목명을 입력해주세요");
      return;
    }
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("올바른 금액을 입력해주세요");
      return;
    }
    if (!paidBy.trim()) {
      toast.error("결제자를 입력해주세요");
      return;
    }

    addExpense(trimmedTitle, parsedAmount, paidBy.trim(), category);
    toast.success("지출을 추가했습니다");

    // 폼 초기화
    setTitle("");
    setAmount("");
    setPaidBy("");
    setCategory("other");
    setShowForm(false);
  };

  const handleDelete = (id: string, expenseTitle: string) => {
    deleteExpense(id);
    toast.success(`"${expenseTitle}" 항목을 삭제했습니다`);
  };

  const categoryEntries = Object.entries(byCategory).filter(([, v]) => v > 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full text-left group">
          <div className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">비용 정산</span>
            {totalAmount > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-0">
                {totalAmount.toLocaleString("ko-KR")}원
              </Badge>
            )}
          </div>
          {open ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 space-y-2">
          {/* 지출 목록 */}
          {expenses.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-1">
              등록된 지출이 없습니다
            </p>
          ) : (
            <div className="space-y-1">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center gap-1.5 rounded border px-2 py-1.5"
                >
                  <Receipt className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-xs font-medium truncate">
                    {expense.title}
                  </span>
                  <span className="font-mono text-xs shrink-0">
                    {expense.amount.toLocaleString("ko-KR")}원
                  </span>
                  <Badge
                    className={`text-[10px] px-1.5 py-0 border-0 shrink-0 ${
                      CATEGORY_BADGE_COLORS[expense.category] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {CATEGORY_LABELS[expense.category] ?? expense.category}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {expense.paidBy}
                  </span>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(expense.id, expense.title)}
                      aria-label={`${expense.title} 삭제`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 요약 섹션 */}
          {expenses.length > 0 && (
            <div className="rounded border bg-muted/30 px-3 py-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">총 지출</span>
                <span className="font-mono font-medium">
                  {totalAmount.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>참석 인원</span>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    value={attendeeCount === 0 ? "" : attendeeCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setAttendeeCount(isNaN(val) || val < 0 ? 0 : val);
                    }}
                    className="h-5 w-14 text-xs text-right px-1.5 py-0"
                    placeholder="명"
                  />
                  <span className="text-muted-foreground">명</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs border-t pt-1.5">
                <span className="text-muted-foreground">1인당</span>
                <span className="font-mono font-semibold text-blue-600">
                  {attendeeCount > 0
                    ? `${perPerson(attendeeCount).toLocaleString("ko-KR")}원`
                    : "-"}
                </span>
              </div>
            </div>
          )}

          {/* 카테고리별 소계 */}
          {categoryEntries.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {categoryEntries.map(([cat, sum]) => (
                <span
                  key={cat}
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    CATEGORY_BADGE_COLORS[cat] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {CATEGORY_LABELS[cat] ?? cat}&nbsp;
                  <span className="font-mono">{sum.toLocaleString("ko-KR")}원</span>
                </span>
              ))}
            </div>
          )}

          {/* 지출 추가 폼 */}
          {canEdit && (
            <>
              {showForm ? (
                <div className="rounded border px-3 py-2.5 space-y-2 bg-muted/20">
                  <p className="text-xs font-medium">지출 추가</p>
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          항목명 *
                        </Label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="예: 스튜디오 대관"
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          금액 (원) *
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0"
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          결제자 *
                        </Label>
                        <Input
                          value={paidBy}
                          onChange={(e) => setPaidBy(e.target.value)}
                          placeholder="이름"
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          카테고리
                        </Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key} className="text-xs">
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 pt-0.5">
                    <Button
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={handleAdd}
                    >
                      추가
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setShowForm(false);
                        setTitle("");
                        setAmount("");
                        setPaidBy("");
                        setCategory("other");
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs w-full gap-1"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-3 w-3" />
                  지출 추가
                </Button>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
