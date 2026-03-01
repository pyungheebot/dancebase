// ============================================
// 회의록 카드 - 공유 타입, 상수, 유틸 함수
// ============================================

import type { MeetingMinutesType } from "@/types";

// 회의 유형별 표시 메타데이터
export const TYPE_META: Record<
  MeetingMinutesType,
  { label: string; color: string; bgColor: string }
> = {
  regular: {
    label: "정기회의",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  emergency: {
    label: "긴급회의",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
  planning: {
    label: "기획회의",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  review: {
    label: "리뷰회의",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  other: {
    label: "기타",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  },
};

// 회의 유형 선택 옵션 목록
export const TYPE_OPTIONS: { value: MeetingMinutesType; label: string }[] = [
  { value: "regular", label: "정기회의" },
  { value: "emergency", label: "긴급회의" },
  { value: "planning", label: "기획회의" },
  { value: "review", label: "리뷰회의" },
  { value: "other", label: "기타" },
];

// 안건 편집 폼에서 사용하는 드래프트 타입
export type AgendaItemDraft = {
  id: string;
  title: string;
  discussion: string;
  decision: string;
  actionItems: { assignee: string; task: string; deadline: string }[];
};

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
export function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
