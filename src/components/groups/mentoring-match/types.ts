import type { MentoringMatchStatus } from "@/types";

// ============================================================
// 필터 타입
// ============================================================

export type FilterType = "all" | MentoringMatchStatus;

// ============================================================
// 상수
// ============================================================

export const STATUS_LABEL: Record<MentoringMatchStatus, string> = {
  active: "진행 중",
  completed: "완료",
  paused: "일시중지",
};

export const STATUS_BADGE: Record<MentoringMatchStatus, string> = {
  active: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  paused: "bg-yellow-100 text-yellow-700",
};

// ============================================================
// 헬퍼 함수
// ============================================================

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// 세션 추가 다이얼로그 Props
// ============================================================

export type AddSessionDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (session: {
    date: string;
    topic: string;
    durationMinutes: number;
    notes?: string;
    menteeRating?: number;
  }) => void;
};

// ============================================================
// 매칭 생성 다이얼로그 Props
// ============================================================

export type CreatePairDialogProps = {
  open: boolean;
  onClose: () => void;
  memberNames: string[];
  onSave: (data: {
    mentorName: string;
    menteeName: string;
    skillFocus: string[];
    goals: string[];
    startDate: string;
  }) => void;
};

// ============================================================
// 페어 카드 Props
// ============================================================

export type PairCardProps = {
  pair: import("@/types").MentoringMatchPair;
  onDelete: () => void;
  onStatusChange: (status: MentoringMatchStatus) => void;
  onAddSession: () => void;
  onDeleteSession: (sessionId: string) => void;
};
