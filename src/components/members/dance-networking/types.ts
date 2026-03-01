// ============================================
// dance-networking/types.ts
// 타입, 상수, 유틸리티 함수
// ============================================

import type {
  DanceNetworkingEntry,
  DanceNetworkingRole,
  DanceNetworkingSns,
} from "@/types";

// ============================================
// FormState 타입
// ============================================

export type NetworkingFormState = {
  name: string;
  affiliation: string;
  genres: string[];
  phone: string;
  email: string;
  snsAccounts: DanceNetworkingSns[];
  metAt: string;
  metDate: string;
  role: DanceNetworkingRole;
  notes: string;
};

// ============================================
// 날짜 유틸
// ============================================

export function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ============================================
// 폼 초기값 생성
// ============================================

export function makeEmptyForm(): NetworkingFormState {
  return {
    name: "",
    affiliation: "",
    genres: [],
    phone: "",
    email: "",
    snsAccounts: [],
    metAt: "",
    metDate: getTodayStr(),
    role: "dancer",
    notes: "",
  };
}

export function entryToForm(entry: DanceNetworkingEntry): NetworkingFormState {
  return {
    name: entry.name,
    affiliation: entry.affiliation ?? "",
    genres: [...entry.genres],
    phone: entry.phone ?? "",
    email: entry.email ?? "",
    snsAccounts: entry.snsAccounts.map((s) => ({ ...s })),
    metAt: entry.metAt ?? "",
    metDate: entry.metDate ?? getTodayStr(),
    role: entry.role,
    notes: entry.notes ?? "",
  };
}
