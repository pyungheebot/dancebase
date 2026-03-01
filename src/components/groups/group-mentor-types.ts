// 그룹 멘토 카드 공유 타입, 상수, 헬퍼 함수

import type {
  GroupMentorField,
  GroupMentorStatus,
} from "@/types";

// ============================================================
// 상수
// ============================================================

/** 멘토링 가능한 분야 목록 */
export const FIELDS: GroupMentorField[] = ["기술", "안무", "체력", "무대매너"];

/** 분야별 배지 색상 */
export const FIELD_COLOR: Record<GroupMentorField, string> = {
  기술: "bg-blue-100 text-blue-700",
  안무: "bg-purple-100 text-purple-700",
  체력: "bg-orange-100 text-orange-700",
  무대매너: "bg-pink-100 text-pink-700",
};

/** 상태 옵션 목록 */
export const STATUS_OPTIONS: GroupMentorStatus[] = ["진행중", "완료", "중단"];

/** 상태별 배지 색상 */
export const STATUS_COLOR: Record<GroupMentorStatus, string> = {
  진행중: "bg-green-100 text-green-700",
  완료: "bg-gray-100 text-gray-600",
  중단: "bg-red-100 text-red-600",
};

// ============================================================
// 공유 타입
// ============================================================

/** 필터: 전체 또는 특정 상태 */
export type FilterStatus = "전체" | GroupMentorStatus;

/** 필터: 전체 또는 특정 분야 */
export type FilterField = "전체" | GroupMentorField;

/** 매칭 생성/수정 폼 데이터 */
export type MatchFormData = {
  mentorName: string;
  menteeName: string;
  field: GroupMentorField;
  startDate: string;
  endDate: string;
  status: GroupMentorStatus;
};

// ============================================================
// 헬퍼 함수
// ============================================================

/** 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
export function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}
