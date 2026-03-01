import type { DanceClassDifficulty } from "@/types";

// ============================================================
// 폼 상태 타입
// ============================================================

export type FormState = {
  className: string;
  instructorName: string;
  date: string;
  rating: number;
  difficulty: DanceClassDifficulty | "";
  genre: string;
  customGenre: string;
  takeaways: string;
  wouldRepeat: boolean;
  cost: string;
};

export const defaultForm: FormState = {
  className: "",
  instructorName: "",
  date: "",
  rating: 0,
  difficulty: "",
  genre: "",
  customGenre: "",
  takeaways: "",
  wouldRepeat: false,
  cost: "",
};

// ============================================================
// 컴포넌트 Props 타입
// ============================================================

export interface DanceClassReviewCardProps {
  memberId: string;
}

export interface ReviewRowProps {
  review: import("@/types").DanceClassReview;
  onEdit: () => void;
  onDelete: () => void;
  formatYearMonthDay: (iso: string) => string;
  formatCost: (cost: number | null) => string | null;
}

export interface ReviewFormProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  title: string;
  submitLabel: string;
}
