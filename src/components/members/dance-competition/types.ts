import type { DanceCompetitionRecord } from "@/types";

// ============================================================
// 폼 상태
// ============================================================

export type FormState = {
  competitionName: string;
  date: string;
  location: string;
  category: string;
  placement: string;
  teamOrSolo: "solo" | "team" | "duo";
  teamName: string;
  genre: string;
  notes: string;
  certificateUrl: string;
};

export const EMPTY_FORM: FormState = {
  competitionName: "",
  date: "",
  location: "",
  category: "",
  placement: "",
  teamOrSolo: "solo",
  teamName: "",
  genre: "",
  notes: "",
  certificateUrl: "",
};

export function recordToForm(r: DanceCompetitionRecord): FormState {
  return {
    competitionName: r.competitionName,
    date: r.date,
    location: r.location ?? "",
    category: r.category ?? "",
    placement: r.placement ?? "",
    teamOrSolo: r.teamOrSolo,
    teamName: r.teamName ?? "",
    genre: r.genre ?? "",
    notes: r.notes,
    certificateUrl: r.certificateUrl ?? "",
  };
}

// ============================================================
// 입상 여부 판별
// ============================================================

export function isPlacement(placement: string | null): boolean {
  if (!placement || placement === "" || placement === "예선탈락") return false;
  return true;
}
