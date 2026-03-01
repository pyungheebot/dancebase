import type { TicketMgmtType } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

export const TYPE_META: Record<
  TicketMgmtType,
  { label: string; badgeClass: string; barColor: string }
> = {
  vip: {
    label: "VIP",
    badgeClass: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    barColor: "bg-purple-400",
  },
  general: {
    label: "일반",
    badgeClass: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    barColor: "bg-blue-400",
  },
  student: {
    label: "학생",
    badgeClass: "bg-green-100 text-green-700 hover:bg-green-100",
    barColor: "bg-green-400",
  },
  early_bird: {
    label: "얼리버드",
    badgeClass: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    barColor: "bg-orange-400",
  },
  free: {
    label: "무료",
    badgeClass: "bg-gray-100 text-gray-600 hover:bg-gray-100",
    barColor: "bg-gray-400",
  },
};

export const TYPE_OPTIONS: TicketMgmtType[] = [
  "vip",
  "general",
  "student",
  "early_bird",
  "free",
];

// ============================================================
// 유틸리티
// ============================================================

export function formatPrice(amount: number): string {
  if (amount === 0) return "무료";
  return amount.toLocaleString("ko-KR") + "원";
}

export function formatDateTime(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
