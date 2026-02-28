"use client";

import { useState } from "react";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil, Trash2, Loader2, Landmark, Smartphone } from "lucide-react";
import { toast } from "sonner";
import type { GroupPaymentMethod, PaymentMethodType } from "@/types";

type Props = {
  groupId: string;
};

type FormValues = {
  type: PaymentMethodType;
  label: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  toss_id: string;
  kakao_link: string;
};

const DEFAULT_FORM: FormValues = {
  type: "bank",
  label: "",
  bank_name: "",
  account_number: "",
  account_holder: "",
  toss_id: "",
  kakao_link: "",
};

function typeLabel(type: PaymentMethodType) {
  if (type === "bank") return "계좌이체";
  if (type === "toss") return "토스";
  return "카카오페이";
}

function TypeBadge({ type }: { type: PaymentMethodType }) {
  const cls =
    type === "bank"
      ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40"
      : type === "toss"
      ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40"
      : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/40";
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cls}`}>
      {typeLabel(type)}
    </Badge>
  );
}

function MethodForm({
  values,
  onChange,
}: {
  values: FormValues;
  onChange: (v: FormValues) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">수단 유형</Label>
        <Select
          value={values.type}
          onValueChange={(v) => onChange({ ...values, type: v as PaymentMethodType })}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bank" className="text-xs">계좌이체</SelectItem>
            <SelectItem value="toss" className="text-xs">토스</SelectItem>
            <SelectItem value="kakao" className="text-xs">카카오페이</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">표시 이름</Label>
        <Input
          value={values.label}
          onChange={(e) => onChange({ ...values, label: e.target.value })}
          placeholder="예: 국민은행 정산 계좌"
          className="h-7 text-xs"
          maxLength={50}
        />
      </div>

      {values.type === "bank" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">은행명</Label>
            <Input
              value={values.bank_name}
              onChange={(e) => onChange({ ...values, bank_name: e.target.value })}
              placeholder="예: 국민은행"
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">계좌번호</Label>
            <Input
              value={values.account_number}
              onChange={(e) => onChange({ ...values, account_number: e.target.value })}
              placeholder="예: 123-456-789012"
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">예금주</Label>
            <Input
              value={values.account_holder}
              onChange={(e) => onChange({ ...values, account_holder: e.target.value })}
              placeholder="예: 홍길동"
              className="h-7 text-xs"
            />
          </div>
        </>
      )}

      {values.type === "toss" && (
        <div className="space-y-1.5">
          <Label className="text-xs">토스 ID</Label>
          <Input
            value={values.toss_id}
            onChange={(e) => onChange({ ...values, toss_id: e.target.value })}
            placeholder="예: @tossid"
            className="h-7 text-xs"
          />
        </div>
      )}

      {values.type === "kakao" && (
        <div className="space-y-1.5">
          <Label className="text-xs">카카오페이 송금 링크</Label>
          <Input
            value={values.kakao_link}
            onChange={(e) => onChange({ ...values, kakao_link: e.target.value })}
            placeholder="https://qr.kakaopay.com/..."
            className="h-7 text-xs"
          />
        </div>
      )}
    </div>
  );
}

function MethodIcon({ type }: { type: PaymentMethodType }) {
  if (type === "bank") return <Landmark className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
  return <Smartphone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

export function PaymentMethodManager({ groupId }: Props) {
  const { paymentMethods, loading, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } =
    usePaymentMethods(groupId);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupPaymentMethod | null>(null);
  const [form, setForm] = useState<FormValues>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  function openAdd() {
    setForm(DEFAULT_FORM);
    setAddOpen(true);
  }

  function openEdit(method: GroupPaymentMethod) {
    setForm({
      type: method.type,
      label: method.label,
      bank_name: method.bank_name ?? "",
      account_number: method.account_number ?? "",
      account_holder: method.account_holder ?? "",
      toss_id: method.toss_id ?? "",
      kakao_link: method.kakao_link ?? "",
    });
    setEditTarget(method);
  }

  async function handleAdd() {
    if (!form.label.trim()) {
      toast.error("표시 이름을 입력해주세요");
      return;
    }
    setSubmitting(true);
    const { error } = await createPaymentMethod({
      type: form.type,
      label: form.label.trim(),
      bank_name: form.bank_name.trim() || undefined,
      account_number: form.account_number.trim() || undefined,
      account_holder: form.account_holder.trim() || undefined,
      toss_id: form.toss_id.trim() || undefined,
      kakao_link: form.kakao_link.trim() || undefined,
    });
    setSubmitting(false);
    if (error) {
      toast.error("정산 수단 추가에 실패했습니다");
    } else {
      toast.success("정산 수단이 추가되었습니다");
      setAddOpen(false);
    }
  }

  async function handleEdit() {
    if (!editTarget) return;
    if (!form.label.trim()) {
      toast.error("표시 이름을 입력해주세요");
      return;
    }
    setSubmitting(true);
    const { error } = await updatePaymentMethod(editTarget.id, {
      label: form.label.trim(),
      bank_name: form.bank_name.trim() || undefined,
      account_number: form.account_number.trim() || undefined,
      account_holder: form.account_holder.trim() || undefined,
      toss_id: form.toss_id.trim() || undefined,
      kakao_link: form.kakao_link.trim() || undefined,
    });
    setSubmitting(false);
    if (error) {
      toast.error("정산 수단 수정에 실패했습니다");
    } else {
      toast.success("정산 수단이 수정되었습니다");
      setEditTarget(null);
    }
  }

  async function handleDelete(method: GroupPaymentMethod) {
    const { error } = await deletePaymentMethod(method.id);
    if (error) {
      toast.error("정산 수단 삭제에 실패했습니다");
    } else {
      toast.success("정산 수단이 삭제되었습니다");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {paymentMethods.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          등록된 정산 수단이 없습니다
        </p>
      ) : (
        <div className="space-y-1">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between px-2.5 py-2 rounded-md border bg-muted/30"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MethodIcon type={method.type} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate">{method.label}</span>
                    <TypeBadge type={method.type} />
                  </div>
                  {method.type === "bank" && method.account_number && (
                    <p className="text-[11px] text-muted-foreground">
                      {method.bank_name} {method.account_number}
                    </p>
                  )}
                  {method.type === "toss" && method.toss_id && (
                    <p className="text-[11px] text-muted-foreground">{method.toss_id}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => openEdit(method)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(method)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs w-full gap-1"
        onClick={openAdd}
      >
        <Plus className="h-3 w-3" />
        정산 수단 추가
      </Button>

      {/* 추가 다이얼로그 */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">정산 수단 추가</DialogTitle>
          </DialogHeader>
          <MethodForm values={form} onChange={setForm} />
          <DialogFooter>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleAdd}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">정산 수단 수정</DialogTitle>
          </DialogHeader>
          <MethodForm values={form} onChange={setForm} />
          <DialogFooter>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleEdit}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
