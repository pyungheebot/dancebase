import type {
  MentalCoachingTopic,
  MentalCoachingStatus,
} from "@/types";

// ============================================================
// 필터 타입
// ============================================================

export type FilterTopic = "전체" | MentalCoachingTopic;
export type FilterStatus = "전체" | MentalCoachingStatus;

// ============================================================
// 상수
// ============================================================

export const TOPICS: MentalCoachingTopic[] = [
  "자신감",
  "무대 공포증",
  "동기부여",
  "팀워크",
  "스트레스 관리",
  "목표 설정",
];

export const TOPIC_BADGE: Record<MentalCoachingTopic, string> = {
  자신감: "bg-yellow-100 text-yellow-700",
  "무대 공포증": "bg-red-100 text-red-700",
  동기부여: "bg-green-100 text-green-700",
  팀워크: "bg-blue-100 text-blue-700",
  "스트레스 관리": "bg-purple-100 text-purple-700",
  "목표 설정": "bg-orange-100 text-orange-700",
};

export const STATUS_LABEL: Record<MentalCoachingStatus, string> = {
  진행중: "진행중",
  개선됨: "개선됨",
  해결됨: "해결됨",
};

export const STATUS_BADGE: Record<MentalCoachingStatus, string> = {
  진행중: "bg-blue-100 text-blue-700",
  개선됨: "bg-yellow-100 text-yellow-700",
  해결됨: "bg-green-100 text-green-700",
};

export const ENERGY_EMOJI: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};

export const ENERGY_LABEL: Record<number, string> = {
  1: "매우 낮음",
  2: "낮음",
  3: "보통",
  4: "높음",
  5: "매우 높음",
};

// ============================================================
// 유틸
// ============================================================

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
