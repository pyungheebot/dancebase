import type { GroupBudgetTransaction } from "@/types";

// ============================================================
// 필터 타입
// ============================================================

export type FilterType = "all" | "income" | "expense";

export const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "income", label: "수입" },
  { value: "expense", label: "지출" },
];

// ============================================================
// 거래 폼 타입
// ============================================================

export type TransactionFormData = {
  type: "income" | "expense";
  category: string;
  description: string;
  amount: string;
  date: string;
  paidBy: string;
  receiptNote: string;
};

export const EMPTY_FORM: TransactionFormData = {
  type: "expense",
  category: "",
  description: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  paidBy: "",
  receiptNote: "",
};

export function buildFormFromTransaction(
  tx: GroupBudgetTransaction
): TransactionFormData {
  return {
    type: tx.type,
    category: tx.category,
    description: tx.description,
    amount: String(tx.amount),
    date: tx.date,
    paidBy: tx.paidBy ?? "",
    receiptNote: tx.receiptNote ?? "",
  };
}

// ============================================================
// 유효성 검증
// ============================================================

export type ValidationError = string | null;

export function validateTransactionForm(
  form: TransactionFormData
): ValidationError {
  if (!form.category) return "카테고리를 선택해주세요";
  if (!form.description.trim()) return "거래 내용을 입력해주세요";
  const parsed = parseInt(form.amount.replace(/,/g, ""), 10);
  if (!parsed || parsed <= 0) return "올바른 금액을 입력해주세요";
  if (!form.date) return "날짜를 선택해주세요";
  return null;
}

export function parseFormAmount(amount: string): number {
  return parseInt(amount.replace(/,/g, ""), 10);
}

// ============================================================
// 차트 색상
// ============================================================

export const CHART_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-green-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-yellow-500",
  "bg-red-500",
] as const;

// ============================================================
// 헬퍼
// ============================================================

export function formatAmount(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

// 거래 목록 최대 표시 수
export const TRANSACTION_PAGE_SIZE = 8;
