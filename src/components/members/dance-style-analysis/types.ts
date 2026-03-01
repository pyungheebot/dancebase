import type { DanceStyleSnapshot, DanceStyleTraitScores } from "@/types";
import { toDateStr, DEFAULT_TRAIT_SCORES } from "@/hooks/use-dance-style-analysis";

// ============================================================
// 폼 상태 타입
// ============================================================

export type SnapshotFormState = {
  date: string;
  primaryGenres: string[];
  secondaryGenres: string[];
  strengths: string[];
  weaknesses: string[];
  traitScores: DanceStyleTraitScores;
  notes: string;
};

// ============================================================
// 폼 초기값 생성 헬퍼
// ============================================================

export function makeDefaultForm(): SnapshotFormState {
  return {
    date: toDateStr(new Date()),
    primaryGenres: [],
    secondaryGenres: [],
    strengths: [],
    weaknesses: [],
    traitScores: { ...DEFAULT_TRAIT_SCORES },
    notes: "",
  };
}

export function snapshotToForm(snap: DanceStyleSnapshot): SnapshotFormState {
  return {
    date: snap.date,
    primaryGenres: [...snap.primaryGenres],
    secondaryGenres: [...snap.secondaryGenres],
    strengths: [...snap.strengths],
    weaknesses: [...snap.weaknesses],
    traitScores: { ...snap.traitScores },
    notes: snap.notes,
  };
}
