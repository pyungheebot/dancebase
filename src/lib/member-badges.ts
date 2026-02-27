import type { LucideIcon } from "lucide-react";
import { Trophy, PenLine, Star, Shield } from "lucide-react";

// ============================================
// 뱃지 타입 정의
// ============================================

export type BadgeId = "attendance_king" | "active_writer" | "veteran" | "leader";

export type MemberBadge = {
  id: BadgeId;
  label: string;
  description: string;
  icon: LucideIcon;
  colorClass: string; // Tailwind 색상 클래스
};

// ============================================
// 뱃지 정의
// ============================================

export const MEMBER_BADGES: Record<BadgeId, MemberBadge> = {
  attendance_king: {
    id: "attendance_king",
    label: "출석왕",
    description: "출석률 80% 이상",
    icon: Trophy,
    colorClass: "text-yellow-500",
  },
  active_writer: {
    id: "active_writer",
    label: "활발한 작성자",
    description: "게시글 10개 이상 작성",
    icon: PenLine,
    colorClass: "text-blue-500",
  },
  veteran: {
    id: "veteran",
    label: "원년 멤버",
    description: "가입 6개월 이상",
    icon: Star,
    colorClass: "text-purple-500",
  },
  leader: {
    id: "leader",
    label: "리더",
    description: "그룹 리더 또는 서브리더",
    icon: Shield,
    colorClass: "text-green-500",
  },
};

// ============================================
// 뱃지 계산에 필요한 통계 타입
// ============================================

export type MemberBadgeStats = {
  /** 총 일정 수 */
  totalSchedules: number;
  /** 출석(present 또는 late) 횟수 */
  attendedCount: number;
  /** 게시글 수 */
  postCount: number;
};

// ============================================
// 뱃지 계산 함수
// ============================================

/**
 * 멤버 정보와 통계를 기반으로 뱃지 목록을 계산합니다.
 *
 * @param joinedAt - 가입일 (ISO 문자열)
 * @param role - 그룹 내 역할
 * @param stats - 출석/게시글 통계
 * @returns 획득한 뱃지 배열
 */
export function computeBadges(
  joinedAt: string | null | undefined,
  role: string,
  stats: MemberBadgeStats
): MemberBadge[] {
  const badges: MemberBadge[] = [];

  // 리더 뱃지
  if (role === "leader" || role === "sub_leader") {
    badges.push(MEMBER_BADGES.leader);
  }

  // 출석왕 뱃지 — 총 일정이 1개 이상이고 출석률 80% 이상
  if (stats.totalSchedules > 0) {
    const rate = stats.attendedCount / stats.totalSchedules;
    if (rate >= 0.8) {
      badges.push(MEMBER_BADGES.attendance_king);
    }
  }

  // 활발한 작성자 뱃지 — 게시글 10개 이상
  if (stats.postCount >= 10) {
    badges.push(MEMBER_BADGES.active_writer);
  }

  // 원년 멤버 뱃지 — 가입 6개월 이상
  if (joinedAt) {
    const joined = new Date(joinedAt);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    if (joined <= sixMonthsAgo) {
      badges.push(MEMBER_BADGES.veteran);
    }
  }

  return badges;
}
