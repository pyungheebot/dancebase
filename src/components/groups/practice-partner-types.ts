/**
 * 연습 파트너 매칭 카드 - 공유 타입 및 상수
 *
 * 여러 서브컴포넌트에서 공통으로 사용하는 타입/상수를 한 곳에 정의합니다.
 */

import type {
  PracticePartnerMember,
  PracticePartnerMatch,
  PracticePartnerSkillLevel,
} from "@/types";

// ============================================
// 타입 재내보내기 (서브컴포넌트에서 단일 경로로 임포트)
// ============================================

export type {
  PracticePartnerMember,
  PracticePartnerMatch,
  PracticePartnerSkillLevel,
};

// ============================================
// 연습 가능 시간 선택 옵션
// ============================================

export const AVAILABLE_TIME_OPTIONS: string[] = [
  "월 오전",
  "월 오후",
  "월 저녁",
  "화 오전",
  "화 오후",
  "화 저녁",
  "수 오전",
  "수 오후",
  "수 저녁",
  "목 오전",
  "목 오후",
  "목 저녁",
  "금 오전",
  "금 오후",
  "금 저녁",
  "토 오전",
  "토 오후",
  "토 저녁",
  "일 오전",
  "일 오후",
  "일 저녁",
];

// ============================================
// 평가 다이얼로그 열기 상태 타입
// ============================================

export interface RatingState {
  matchId: string;
  raterId: string;
  raterName: string;
  targetName: string;
}
