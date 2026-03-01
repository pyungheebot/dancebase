"use client";

import { useReducer, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAsyncAction } from "@/hooks/use-async-action";
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

// ── State / Action 타입 ────────────────────────────────────────────────────

type FormState = {
  type: "income" | "expense";
  categoryId: string;
  paidBy: string;
  amount: string;
  title: string;
  description: string;
  date: string;
  amountError: string | null;
  titleError: string | null;
};

type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: FormState[keyof FormState] }
  | { type: "RESET" }
  | { type: "SET_INITIAL"; state: Partial<FormState> };

const todayStr = () => new Date().toISOString().split("T")[0];

const INITIAL_STATE: FormState = {
  type: "income",
  categoryId: "",
  paidBy: "",
  amount: "",
  title: "",
  description: "",
  date: todayStr(),
  amountError: null,
  titleError: null,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return { ...INITIAL_STATE, date: todayStr() };
    case "SET_INITIAL":
      return { ...state, ...action.state };
    default:
      return state;
  }
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────

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

  const [internalOpen, dispatchOpen] = useReducer(
    (_: boolean, v: boolean) => v,
    false
  );
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || ((v: boolean) => dispatchOpen(v));

  const [state, dispatch] = useReducer(formReducer, INITIAL_STATE);
  const { pending, execute } = useAsyncAction();
  const supabase = createClient();
  const { user } = useAuth();

  // 헬퍼
  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    dispatch({ type: "SET_FIELD", field, value });

  // 선택된 카테고리의 fee_rate 계산
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === state.categoryId) ?? null,
    [categories, state.categoryId]
  );
  const feeRate = selectedCategory?.fee_rate ?? 0;

  // 수수료 / 실수령액 계산
  const amountNum = parseFloat(state.amount) || 0;
  const feeAmount = feeRate > 0 ? Math.round((amountNum * feeRate) / 100) : 0;
  const netAmount = amountNum - feeAmount;

  // Edit mode: initialize from data
  useEffect(() => {
    if (open && isEdit && initialData) {
      dispatch({
        type: "SET_INITIAL",
        state: {
          type: initialData.type,
          categoryId: initialData.category_id || "",
          paidBy: initialData.paid_by || "",
          amount: initialData.amount.toString(),
          title: initialData.title,
          description: initialData.description || "",
          date: initialData.transaction_date,
          amountError: null,
          titleError: null,
        },
      });
    }
    if (open && !isEdit) {
      dispatch({ type: "RESET" });
    }
  }, [open, isEdit, initialData]);

  const validateForm = (): boolean => {
    const newAmountError = validatePositiveNumber(state.amount);
    const newTitleError = validateRequired(state.title, "제목");
    setField("amountError", newAmountError);
    setField("titleError", newTitleError);
    return !newAmountError && !newTitleError;
  };

  const isFormValid =
    !validatePositiveNumber(state.amount) &&
    !validateRequired(state.title, "제목");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    await execute(async () => {
      if (isEdit && initialData) {
        const { error } = await supabase
          .from("finance_transactions")
          .update({
            type: state.type,
            category_id: state.categoryId || null,
            paid_by:
              state.type === "income" &&
              state.paidBy &&
              state.paidBy !== "none"
                ? state.paidBy
                : null,
            amount: parseInt(state.amount),
            title: state.title,
            description: state.description || null,
            transaction_date: state.date,
          })
          .eq("id", initialData.id);

        if (error) {
          toast.error("거래 수정에 실패했습니다");
          return;
        }
        setOpen(false);
        onSuccess();
      } else {
        const { error } = await supabase.from("finance_transactions").insert({
          group_id: groupId,
          project_id: projectId || null,
          category_id: state.categoryId || null,
          type: state.type,
          paid_by:
            state.type === "income" &&
            state.paidBy &&
            state.paidBy !== "none"
              ? state.paidBy
              : null,
          amount: parseInt(state.amount),
          title: state.title,
          description: state.description || null,
          transaction_date: state.date,
          created_by: user?.id,
        });

        if (error) {
          toast.error("거래 추가에 실패했습니다");
          return;
        }
        dispatch({ type: "RESET" });
        setOpen(false);
        onSuccess();
      }
    });
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
        <Tabs
          value={state.type}
          onValueChange={(v) => setField("type", v as "income" | "expense")}
        >
          <TabsList className="w-full h-8">
            <TabsTrigger value="income" className="flex-1 text-xs">
              입금
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex-1 text-xs">
              출금
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-1">
          <Label className="text-xs">카테고리</Label>
          <Select
            value={state.categoryId}
            onValueChange={(v) => setField("categoryId", v)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="선택사항" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span>{cat.name}</span>
                  {cat.fee_rate > 0 && (
                    <span className="ml-1.5 text-[10px] text-orange-600">
                      ({cat.fee_rate}% 수수료)
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 납부자 선택: 수입 거래이고 멤버 목록이 있을 때만 표시 */}
        {state.type === "income" && members && members.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs">납부자 (선택)</Label>
            <Select
              value={state.paidBy}
              onValueChange={(v) => setField("paidBy", v)}
            >
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
            value={state.amount}
            onChange={(e) => {
              setField("amount", e.target.value);
              setField("amountError", validatePositiveNumber(e.target.value));
            }}
            onBlur={() =>
              setField("amountError", validatePositiveNumber(state.amount))
            }
            required
            className={`h-8 text-sm${
              state.amountError
                ? " border-destructive focus-visible:ring-destructive"
                : ""
            }`}
          />
          {state.amountError && (
            <p className="text-xs text-destructive">{state.amountError}</p>
          )}
          {/* 수수료 자동 계산 표시 (fee_rate > 0이고 금액이 입력된 경우) */}
          {feeRate > 0 && amountNum > 0 && (
            <div className="rounded-md bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 px-2.5 py-1.5 space-y-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-orange-700 dark:text-orange-400">
                  수수료 ({feeRate}%)
                </span>
                <span className="font-medium text-orange-700 dark:text-orange-400 tabular-nums">
                  -{feeAmount.toLocaleString("ko-KR")}원
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">실수령액</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {netAmount.toLocaleString("ko-KR")}원
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs">
            제목 <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="거래 내용"
            value={state.title}
            onChange={(e) => {
              setField("title", e.target.value);
              setField("titleError", validateRequired(e.target.value, "제목"));
            }}
            onBlur={() =>
              setField("titleError", validateRequired(state.title, "제목"))
            }
            required
            className={`h-8 text-sm${
              state.titleError
                ? " border-destructive focus-visible:ring-destructive"
                : ""
            }`}
          />
          {state.titleError && (
            <p className="text-xs text-destructive">{state.titleError}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs">설명 (선택)</Label>
          <Textarea
            placeholder="상세 설명"
            value={state.description}
            onChange={(e) => setField("description", e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">날짜</Label>
          <Input
            type="date"
            value={state.date}
            onChange={(e) => setField("date", e.target.value)}
            required
            className="h-8 text-sm"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-8 text-sm"
          disabled={pending || !isFormValid}
        >
          {pending ? "저장 중..." : isEdit ? "수정" : "저장"}
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
