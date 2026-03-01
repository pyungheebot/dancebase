// ============================================================
// 공연 후원/스폰서 관리 — 타입, 상수, 유틸
// ============================================================

import type { PerfSponsorTier } from "@/types";

// ── 등급 ──────────────────────────────────────────────────

export const TIER_ORDER: PerfSponsorTier[] = [
  "platinum",
  "gold",
  "silver",
  "bronze",
  "supporter",
];

export const TIER_LABELS: Record<PerfSponsorTier, string> = {
  platinum: "플래티넘",
  gold: "골드",
  silver: "실버",
  bronze: "브론즈",
  supporter: "서포터",
};

export const TIER_BADGE_CLASS: Record<PerfSponsorTier, string> = {
  platinum: "bg-purple-100 text-purple-700 border-purple-300",
  gold: "bg-yellow-100 text-yellow-700 border-yellow-300",
  silver: "bg-gray-100 text-gray-600 border-gray-300",
  bronze: "bg-orange-100 text-orange-800 border-orange-300",
  supporter: "bg-cyan-100 text-cyan-700 border-cyan-300",
};

// ── 상태 ──────────────────────────────────────────────────

export type SponsorStatus = "confirmed" | "pending" | "declined";

export const STATUS_LABELS: Record<SponsorStatus, string> = {
  confirmed: "확정",
  pending: "보류",
  declined: "거절",
};

export const STATUS_BADGE_CLASS: Record<SponsorStatus, string> = {
  confirmed: "bg-green-100 text-green-700 border-green-300",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  declined: "bg-gray-100 text-gray-500 border-gray-300",
};

// ── 폼 데이터 ──────────────────────────────────────────────

export type SponsorFormData = {
  name: string;
  contactPerson: string;
  contactEmail: string;
  tier: PerfSponsorTier;
  amount: string;
  inKind: string;
  logoPlacement: string;
  benefitsRaw: string;
  status: SponsorStatus;
  notes: string;
};

export const EMPTY_FORM: SponsorFormData = {
  name: "",
  contactPerson: "",
  contactEmail: "",
  tier: "gold",
  amount: "",
  inKind: "",
  logoPlacement: "",
  benefitsRaw: "",
  status: "pending",
  notes: "",
};

// ── 유효성 검증 ───────────────────────────────────────────

export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateSponsorForm(form: SponsorFormData): ValidationResult {
  if (!form.name.trim()) {
    return { ok: false, message: "스폰서명을 입력하세요." };
  }
  if (form.amount) {
    const amount = Number(form.amount.replace(/,/g, ""));
    if (isNaN(amount) || amount < 0) {
      return { ok: false, message: "후원 금액은 0 이상의 숫자여야 합니다." };
    }
  }
  return { ok: true };
}

export function validateGoalAmount(value: string): ValidationResult {
  if (!value.trim()) return { ok: true }; // 빈 값은 목표 해제
  const num = Number(value.replace(/,/g, ""));
  if (isNaN(num) || num < 0) {
    return { ok: false, message: "목표 금액은 0 이상의 숫자여야 합니다." };
  }
  return { ok: true };
}

// ── 변환 유틸 ──────────────────────────────────────────────

import type { PerfSponsorEntry } from "@/types";

export function sponsorToForm(s: PerfSponsorEntry): SponsorFormData {
  return {
    name: s.name,
    contactPerson: s.contactPerson ?? "",
    contactEmail: s.contactEmail ?? "",
    tier: s.tier,
    amount: s.amount > 0 ? String(s.amount) : "",
    inKind: s.inKind ?? "",
    logoPlacement: s.logoPlacement ?? "",
    benefitsRaw: s.benefits.join(", "),
    status: s.status,
    notes: s.notes,
  };
}

export function formToSponsorParams(
  form: SponsorFormData
): Omit<PerfSponsorEntry, "id" | "createdAt"> {
  return {
    name: form.name.trim(),
    contactPerson: form.contactPerson.trim() || null,
    contactEmail: form.contactEmail.trim() || null,
    tier: form.tier,
    amount: Number(form.amount.replace(/,/g, "")) || 0,
    inKind: form.inKind.trim() || null,
    logoPlacement: form.logoPlacement.trim() || null,
    benefits: form.benefitsRaw
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean),
    status: form.status,
    notes: form.notes.trim(),
  };
}

// ── 포맷 유틸 ──────────────────────────────────────────────

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}
