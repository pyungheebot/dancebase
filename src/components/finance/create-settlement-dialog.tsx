"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useSettlementRequests } from "@/hooks/use-settlement-requests";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
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
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { validateField, VALIDATION } from "@/lib/validation-rules";
import type { GroupMemberWithProfile } from "@/types";

type Props = {
  groupId: string;
  groupMembers: GroupMemberWithProfile[];
  nicknameMap: Record<string, string>;
  currentUserId: string;
};

export function CreateSettlementDialog({
  groupId,
  groupMembers,
  nicknameMap,
  currentUserId,
}: Props) {
  const [open, setOpen] = useState(false);
  const { createRequest } = useSettlementRequests(groupId);
  const { paymentMethods } = usePaymentMethods(groupId);

  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("none");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    groupMembers.filter((m) => m.user_id !== currentUserId).map((m) => m.user_id)
  );
  const { pending: submitting, execute } = useAsyncAction();

  // 인라인 에러 상태
  const [titleError, setTitleError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const parsedAmount = parseInt(amount.replace(/,/g, ""), 10) || 0;

  function resetForm() {
    setTitle("");
    setMemo("");
    setAmount("");
    setDueDate("");
    setPaymentMethodId("none");
    setTitleError(null);
    setAmountError(null);
    setSelectedMembers(
      groupMembers.filter((m) => m.user_id !== currentUserId).map((m) => m.user_id)
    );
  }

  function handleToggleMember(userId: string) {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function handleSelectAll() {
    const all = groupMembers
      .filter((m) => m.user_id !== currentUserId)
      .map((m) => m.user_id);
    setSelectedMembers(all);
  }

  function handleDeselectAll() {
    setSelectedMembers([]);
  }

  // 제목 blur 시 검증
  const handleTitleBlur = () => {
    setTitleError(validateField(title, VALIDATION.title));
  };

  // 금액 blur 시 검증
  const handleAmountBlur = () => {
    if (parsedAmount <= 0) {
      setAmountError("금액을 입력해주세요");
    } else if (parsedAmount > VALIDATION.amount.max) {
      setAmountError(VALIDATION.amount.message);
    } else {
      setAmountError(null);
    }
  };

  async function handleSubmit() {
    // 최종 제출 전 검증
    const titleErr = validateField(title, VALIDATION.title);
    setTitleError(titleErr);

    let amountErr: string | null = null;
    if (parsedAmount <= 0) {
      amountErr = "금액을 입력해주세요";
    } else if (parsedAmount > VALIDATION.amount.max) {
      amountErr = VALIDATION.amount.message;
    }
    setAmountError(amountErr);

    if (titleErr || amountErr) return;

    if (!title.trim()) {
      toast.error(TOAST.FINANCE.SETTLEMENT_TITLE_REQUIRED);
      return;
    }
    if (parsedAmount <= 0) {
      toast.error(TOAST.FINANCE.SETTLEMENT_AMOUNT_REQUIRED);
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error(TOAST.FINANCE.SETTLEMENT_MEMBER_REQUIRED);
      return;
    }

    await execute(async () => {
      const { error } = await createRequest({
        title: title.trim(),
        memo: memo.trim() || undefined,
        amount: parsedAmount,
        due_date: dueDate || undefined,
        payment_method_id: paymentMethodId === "none" ? undefined : paymentMethodId,
        member_ids: selectedMembers,
      });

      if (error) {
        toast.error(TOAST.FINANCE.SETTLEMENT_SEND_ERROR);
      } else {
        toast.success(TOAST.FINANCE.SETTLEMENT_SENT);
        resetForm();
        setOpen(false);
      }
    });
  }

  const eligibleMembers = groupMembers.filter((m) => m.user_id !== currentUserId);

  return (
    <>
      <Button
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => setOpen(true)}
        aria-label="정산 요청 발송 다이얼로그 열기"
      >
        <Plus className="h-3 w-3" />
        정산 요청
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">정산 요청 발송</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* 제목 */}
            <FormField
              label="제목"
              htmlFor="settlement-title"
              required
              error={titleError}
            >
              <Input
                id="settlement-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError(validateField(e.target.value, VALIDATION.title));
                }}
                onBlur={handleTitleBlur}
                placeholder="예: 3월 연습비 정산"
                className="h-7 text-xs"
                maxLength={100}
                aria-invalid={!!titleError}
                aria-required="true"
              />
            </FormField>

            {/* 금액 */}
            <FormField
              label="금액 (원)"
              htmlFor="settlement-amount"
              required
              error={amountError}
            >
              <Input
                id="settlement-amount"
                value={amount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setAmount(raw ? Number(raw).toLocaleString("ko-KR") : "");
                  if (amountError) setAmountError(null);
                }}
                onBlur={handleAmountBlur}
                placeholder="0"
                className="h-7 text-xs"
                aria-invalid={!!amountError}
                aria-required="true"
              />
              {parsedAmount > 0 && !amountError && (
                <p className="text-[11px] text-muted-foreground">
                  {parsedAmount.toLocaleString("ko-KR")}원
                </p>
              )}
            </FormField>

            {/* 메모 */}
            <FormField
              label="메모"
              htmlFor="settlement-memo"
              description="200자 이내 추가 안내 사항"
            >
              <Input
                id="settlement-memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="추가 안내 사항"
                className="h-7 text-xs"
                maxLength={200}
                aria-label="정산 메모 (선택)"
              />
            </FormField>

            {/* 마감일 */}
            <FormField
              label="마감일"
              htmlFor="settlement-due-date"
            >
              <Input
                id="settlement-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-7 text-xs"
                aria-label="정산 마감일 (선택)"
              />
            </FormField>

            {/* 정산 수단 */}
            {paymentMethods.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="settlement-payment-method" className="text-xs">
                  정산 수단
                </Label>
                <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                  <SelectTrigger
                    id="settlement-payment-method"
                    className="h-7 text-xs"
                    aria-label="정산 수단 선택"
                  >
                    <SelectValue placeholder="선택 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">선택 안함</SelectItem>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 대상 멤버 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" aria-hidden="true" />
                  대상 멤버 ({selectedMembers.length}명 선택)
                </Label>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-[10px] px-1.5"
                    onClick={handleSelectAll}
                    aria-label="전체 멤버 선택"
                    type="button"
                  >
                    전체 선택
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-[10px] px-1.5"
                    onClick={handleDeselectAll}
                    aria-label="전체 멤버 선택 해제"
                    type="button"
                  >
                    전체 해제
                  </Button>
                </div>
              </div>

              <div
                className="max-h-48 overflow-y-auto space-y-1 rounded-md border p-2"
                role="group"
                aria-label="정산 대상 멤버 목록"
              >
                {eligibleMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    대상 멤버가 없습니다
                  </p>
                ) : (
                  eligibleMembers.map((member) => {
                    const name =
                      nicknameMap[member.user_id] || member.profiles.name;
                    const checked = selectedMembers.includes(member.user_id);
                    const checkId = `settlement-member-${member.user_id}`;
                    return (
                      <div
                        key={member.user_id}
                        className="flex items-center gap-2 px-1 py-0.5 rounded cursor-pointer hover:bg-muted/50"
                        onClick={() => handleToggleMember(member.user_id)}
                      >
                        <Checkbox
                          id={checkId}
                          checked={checked}
                          onCheckedChange={() => handleToggleMember(member.user_id)}
                          className="h-3.5 w-3.5"
                          aria-label={`${name} 선택`}
                        />
                        <label
                          htmlFor={checkId}
                          className="text-xs cursor-pointer"
                        >
                          {name}
                        </label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
              disabled={submitting}
              aria-label="정산 요청 발송"
            >
              {submitting && <Loader2 className="h-3 w-3 animate-spin mr-1" aria-hidden="true" />}
              정산 요청 발송
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
