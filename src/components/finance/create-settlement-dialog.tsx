"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useSettlementRequests } from "@/hooks/use-settlement-requests";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loader2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
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

  function resetForm() {
    setTitle("");
    setMemo("");
    setAmount("");
    setDueDate("");
    setPaymentMethodId("none");
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

  const parsedAmount = parseInt(amount.replace(/,/g, ""), 10) || 0;

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요");
      return;
    }
    if (parsedAmount <= 0) {
      toast.error("금액을 입력해주세요");
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error("최소 1명 이상의 멤버를 선택해주세요");
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
        toast.error("정산 요청 발송에 실패했습니다");
      } else {
        toast.success("정산 요청이 발송되었습니다");
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
            <div className="space-y-1.5">
              <Label className="text-xs">제목 *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 3월 연습비 정산"
                className="h-7 text-xs"
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">금액 (원) *</Label>
              <Input
                value={amount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setAmount(raw ? Number(raw).toLocaleString("ko-KR") : "");
                }}
                placeholder="0"
                className="h-7 text-xs"
              />
              {parsedAmount > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {parsedAmount.toLocaleString("ko-KR")}원
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">메모</Label>
              <Input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="추가 안내 사항"
                className="h-7 text-xs"
                maxLength={200}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">마감일</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-7 text-xs"
              />
            </div>

            {paymentMethods.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">정산 수단</Label>
                <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                  <SelectTrigger className="h-7 text-xs">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  대상 멤버 ({selectedMembers.length}명 선택)
                </Label>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-[10px] px-1.5"
                    onClick={handleSelectAll}
                  >
                    전체 선택
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-[10px] px-1.5"
                    onClick={handleDeselectAll}
                  >
                    전체 해제
                  </Button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border p-2">
                {eligibleMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    대상 멤버가 없습니다
                  </p>
                ) : (
                  eligibleMembers.map((member) => {
                    const name =
                      nicknameMap[member.user_id] || member.profiles.name;
                    const checked = selectedMembers.includes(member.user_id);
                    return (
                      <div
                        key={member.user_id}
                        className="flex items-center gap-2 px-1 py-0.5 rounded cursor-pointer hover:bg-muted/50"
                        onClick={() => handleToggleMember(member.user_id)}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => handleToggleMember(member.user_id)}
                          className="h-3.5 w-3.5"
                        />
                        <span className="text-xs">{name}</span>
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
            >
              {submitting && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              정산 요청 발송
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
