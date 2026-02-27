"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { FinanceCategory, FinanceTransaction } from "@/types";
import {
  validateRequired,
  validatePositiveNumber,
  formatCurrency,
} from "@/lib/validation";

type MemberOption = {
  id: string;
  name: string;
};

type Props = {
  groupId: string;
  projectId?: string | null;
  categories: FinanceCategory[];
  members?: MemberOption[];
  onSuccess: () => void;
  mode?: "create" | "edit";
  initialData?: FinanceTransaction;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function FinanceTransactionForm({
  groupId,
  projectId,
  categories,
  members,
  onSuccess,
  mode = "create",
  initialData,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: Props) {
  const isEdit = mode === "edit";

  const triggerRef = useRef<HTMLButtonElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const [type, setType] = useState<"income" | "expense">("income");
  const [categoryId, setCategoryId] = useState("");
  const [paidBy, setPaidBy] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const supabase = createClient();

  // Edit mode: initialize from data
  useEffect(() => {
    if (open && isEdit && initialData) {
      setType(initialData.type);
      setCategoryId(initialData.category_id || "");
      setPaidBy(initialData.paid_by || "");
      setAmount(initialData.amount.toString());
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setDate(initialData.transaction_date);
    }
    if (open && !isEdit) {
      reset();
    }
  }, [open, isEdit, initialData]);

  const reset = () => {
    setType("income");
    setCategoryId("");
    setPaidBy("");
    setAmount("");
    setTitle("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setAmountError(null);
    setTitleError(null);
  };

  const validateForm = (): boolean => {
    const newAmountError = validatePositiveNumber(amount);
    const newTitleError = validateRequired(title, "제목");
    setAmountError(newAmountError);
    setTitleError(newTitleError);
    return !newAmountError && !newTitleError;
  };

  const isFormValid =
    !validatePositiveNumber(amount) &&
    !validateRequired(title, "제목");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    if (isEdit && initialData) {
      const { error } = await supabase
        .from("finance_transactions")
        .update({
          type,
          category_id: categoryId || null,
          paid_by: (type === "income" && paidBy && paidBy !== "none") ? paidBy : null,
          amount: parseInt(amount),
          title,
          description: description || null,
          transaction_date: date,
        })
        .eq("id", initialData.id);

      setLoading(false);
      if (!error) {
        setOpen(false);
        onSuccess();
      } else {
        toast.error("거래 수정에 실패했습니다");
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("finance_transactions").insert({
        group_id: groupId,
        project_id: projectId || null,
        category_id: categoryId || null,
        type,
        paid_by: (type === "income" && paidBy && paidBy !== "none") ? paidBy : null,
        amount: parseInt(amount),
        title,
        description: description || null,
        transaction_date: date,
        created_by: user?.id,
      });

      setLoading(false);
      if (!error) {
        reset();
        setOpen(false);
        onSuccess();
      } else {
        toast.error("거래 추가에 실패했습니다");
      }
    }
  };

  const dialogContent = (
    <DialogContent
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        amountInputRef.current?.focus();
      }}
      onCloseAutoFocus={(e) => {
        e.preventDefault();
        triggerRef.current?.focus();
      }}
    >
      <DialogHeader>
        <DialogTitle>{isEdit ? "거래 수정" : "거래 추가"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Tabs value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
          <TabsList className="w-full h-8">
            <TabsTrigger value="income" className="flex-1 text-xs">입금</TabsTrigger>
            <TabsTrigger value="expense" className="flex-1 text-xs">출금</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-1">
          <Label className="text-xs">카테고리</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="선택사항" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 납부자 선택: 수입 거래이고 멤버 목록이 있을 때만 표시 */}
        {type === "income" && members && members.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs">납부자 (선택)</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="납부자 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">선택 안함</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs">
            금액 (원) <span className="text-destructive">*</span>
          </Label>
          <Input
            ref={amountInputRef}
            type="number"
            min="1"
            placeholder="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setAmountError(validatePositiveNumber(e.target.value));
            }}
            onBlur={() => setAmountError(validatePositiveNumber(amount))}
            required
            className={`h-8 text-sm${amountError ? " border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {amountError && (
            <p className="text-xs text-destructive">{amountError}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs">
            제목 <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="거래 내용"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleError(validateRequired(e.target.value, "제목"));
            }}
            onBlur={() => setTitleError(validateRequired(title, "제목"))}
            required
            className={`h-8 text-sm${titleError ? " border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {titleError && (
            <p className="text-xs text-destructive">{titleError}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs">설명 (선택)</Label>
          <Textarea
            placeholder="상세 설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">날짜</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="h-8 text-sm"
          />
        </div>

        <Button type="submit" className="w-full h-8 text-sm" disabled={loading || !isFormValid}>
          {loading ? "저장 중..." : isEdit ? "수정" : "저장"}
        </Button>
      </form>
    </DialogContent>
  );

  if (isEdit) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button ref={triggerRef} size="sm" className="h-7 text-xs px-2.5">
          <Plus className="h-3 w-3 mr-1" />
          추가
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
