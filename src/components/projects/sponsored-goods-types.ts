import type { SponsoredGoodsStatus } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

export const STATUS_LABELS: Record<SponsoredGoodsStatus, string> = {
  pending: "대기",
  received: "수령",
  distributed: "배분완료",
  returned: "반납",
};

export const STATUS_COLORS: Record<SponsoredGoodsStatus, string> = {
  pending: "bg-blue-100 text-blue-700 border-blue-300",
  received: "bg-green-100 text-green-700 border-green-300",
  distributed: "bg-purple-100 text-purple-700 border-purple-300",
  returned: "bg-gray-100 text-gray-600 border-gray-300",
};

export const STATUS_OPTIONS: SponsoredGoodsStatus[] = [
  "pending",
  "received",
  "distributed",
  "returned",
];

export const STATUS_FILTER_OPTIONS: Array<{
  value: SponsoredGoodsStatus | "all";
  label: string;
}> = [
  { value: "all", label: "전체" },
  { value: "pending", label: "대기" },
  { value: "received", label: "수령" },
  { value: "distributed", label: "배분완료" },
  { value: "returned", label: "반납" },
];

// ============================================================
// 아이템 폼 타입
// ============================================================

export type ItemFormData = {
  itemName: string;
  sponsor: string;
  quantity: string;
  status: SponsoredGoodsStatus;
  estimatedValue: string;
  receivedDate: string;
  returnDueDate: string;
  category: string;
  notes: string;
};

export function emptyItemForm(): ItemFormData {
  return {
    itemName: "",
    sponsor: "",
    quantity: "1",
    status: "pending",
    estimatedValue: "",
    receivedDate: "",
    returnDueDate: "",
    category: "",
    notes: "",
  };
}

// ============================================================
// 유효성 검증
// ============================================================

export type ItemFormErrors = {
  itemName?: string;
  sponsor?: string;
  quantity?: string;
};

export function validateItemForm(form: ItemFormData): ItemFormErrors {
  const errors: ItemFormErrors = {};
  if (!form.itemName.trim()) errors.itemName = "물품명을 입력하세요.";
  if (!form.sponsor.trim()) errors.sponsor = "스폰서명을 입력하세요.";
  const qty = parseInt(form.quantity, 10);
  if (isNaN(qty) || qty < 1) errors.quantity = "수량은 1 이상이어야 합니다.";
  return errors;
}

// ============================================================
// D-day 계산 유틸
// ============================================================

export function calcDday(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDday(dday: number): string {
  if (dday === 0) return "D-Day";
  if (dday > 0) return `D-${dday}`;
  return `D+${Math.abs(dday)}`;
}
