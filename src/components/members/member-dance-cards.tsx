"use client";

import { lazyLoad } from "@/lib/dynamic-import";

// ============================================
// Dynamic imports — 댄스 개인 카드 섹션
// 대형 컴포넌트들을 한 곳에 모아 초기 번들에서 분리
// ============================================

const SkillTreeCard             = lazyLoad(() => import("@/components/members/skill-tree-card").then(m => ({ default: m.SkillTreeCard })), { skeletonHeight: "h-32" });
const DanceWorkshopCard         = lazyLoad(() => import("@/components/members/dance-workshop-card").then(m => ({ default: m.DanceWorkshopCard })), { skeletonHeight: "h-32" });
const DanceAuditionCard         = lazyLoad(() => import("@/components/members/dance-audition-card").then(m => ({ default: m.DanceAuditionCard })), { skeletonHeight: "h-32" });
const DanceClassLogCard         = lazyLoad(() => import("@/components/members/dance-class-log-card").then(m => ({ default: m.DanceClassLogCard })), { skeletonHeight: "h-32" });
const DanceNetworkingCard       = lazyLoad(() => import("@/components/members/dance-networking-card").then(m => ({ default: m.DanceNetworkingCard })), { skeletonHeight: "h-32" });
const InjuryLogCard             = lazyLoad(() => import("@/components/members/injury-log-card").then(m => ({ default: m.InjuryLogCard })), { skeletonHeight: "h-32" });
const DanceStyleAnalysisCard    = lazyLoad(() => import("@/components/members/dance-style-analysis-card").then(m => ({ default: m.DanceStyleAnalysisCard })), { skeletonHeight: "h-32" });
const RoutineBuilderCard        = lazyLoad(() => import("@/components/members/routine-builder-card").then(m => ({ default: m.RoutineBuilderCard })), { skeletonHeight: "h-32" });
const InspirationBoardCard      = lazyLoad(() => import("@/components/members/inspiration-board-card").then(m => ({ default: m.InspirationBoardCard })), { skeletonHeight: "h-32" });
const DanceMusicCard            = lazyLoad(() => import("@/components/members/dance-music-card").then(m => ({ default: m.DanceMusicCard })), { skeletonHeight: "h-32" });
const DanceGoalCard             = lazyLoad(() => import("@/components/members/dance-goal-card").then(m => ({ default: m.DanceGoalCard })), { skeletonHeight: "h-32" });
const DanceConditionJournalCard = lazyLoad(() => import("@/components/members/dance-condition-journal-card").then(m => ({ default: m.DanceConditionJournalCard })), { skeletonHeight: "h-32" });
const DanceVideoPortfolioCard   = lazyLoad(() => import("@/components/members/dance-video-portfolio-card").then(m => ({ default: m.DanceVideoPortfolioCard })), { skeletonHeight: "h-32" });
const DanceClassReviewCard      = lazyLoad(() => import("@/components/members/dance-class-review-card").then(m => ({ default: m.DanceClassReviewCard })), { skeletonHeight: "h-32" });
const DanceCompetitionCard      = lazyLoad(() => import("@/components/members/dance-competition-card").then(m => ({ default: m.DanceCompetitionCard })), { skeletonHeight: "h-32" });
const DanceStyleProfileCard     = lazyLoad(() => import("@/components/members/dance-style-profile-card").then(m => ({ default: m.DanceStyleProfileCard })), { skeletonHeight: "h-32" });
const DanceDiaryCard            = lazyLoad(() => import("@/components/members/dance-diary-card").then(m => ({ default: m.DanceDiaryCard })), { skeletonHeight: "h-32" });
const DanceCertificationCard    = lazyLoad(() => import("@/components/members/dance-certification-card").then(m => ({ default: m.DanceCertificationCard })), { skeletonHeight: "h-32" });
const DancePlaylistCard         = lazyLoad(() => import("@/components/members/dance-playlist-card").then(m => ({ default: m.DancePlaylistCard })), { skeletonHeight: "h-32" });
const DanceFlexibilityCard      = lazyLoad(() => import("@/components/members/dance-flexibility-card").then(m => ({ default: m.DanceFlexibilityCard })), { skeletonHeight: "h-32" });
const DanceMoodBoardCard        = lazyLoad(() => import("@/components/members/dance-mood-board-card").then(m => ({ default: m.DanceMoodBoardCard })), { skeletonHeight: "h-32" });
const DanceNutritionCard        = lazyLoad(() => import("@/components/members/dance-nutrition-card").then(m => ({ default: m.DanceNutritionCard })), { skeletonHeight: "h-32" });

// ============================================
// Props
// ============================================

type MemberDanceCardsProps = {
  /** 현재 사용자 ID (개인 카드 데이터 기준) */
  userId: string;
  /** 그룹 ID */
  groupId: string;
  /** 편집 권한 여부 */
  canEdit: boolean;
};

// ============================================
// 컴포넌트
// ============================================

/**
 * 개인 댄스 카드 모음.
 * 스킬 트리, 워크숍, 오디션, 수업 기록 등 22개의 댄스 관련 개인 카드를 렌더링합니다.
 * 모든 카드는 dynamic import로 초기 번들에서 분리되어 있습니다.
 */
export function MemberDanceCards({ userId, groupId, canEdit }: MemberDanceCardsProps) {
  return (
    <>
      {/* 스킬 트리 (개인 스킬 성장 시각화) */}
      <SkillTreeCard groupId={groupId} userId={userId} canEdit={canEdit} />

      {/* 댄스 관련 개인 기록 카드 */}
      <DanceWorkshopCard memberId={userId} />
      <DanceAuditionCard memberId={userId} />
      <DanceClassLogCard memberId={userId} />
      <DanceNetworkingCard memberId={userId} />
      <InjuryLogCard memberId={userId} />
      <DanceStyleAnalysisCard memberId={userId} />
      <RoutineBuilderCard memberId={userId} />
      <InspirationBoardCard memberId={userId} />
      <DanceMusicCard memberId={userId} />
      <DanceGoalCard memberId={userId} />
      <DanceConditionJournalCard memberId={userId} />
      <DanceVideoPortfolioCard memberId={userId} />
      <DanceClassReviewCard memberId={userId} />
      <DanceCompetitionCard memberId={userId} />
      <DanceStyleProfileCard memberId={userId} />
      <DanceDiaryCard memberId={userId} />
      <DanceCertificationCard memberId={userId} />
      <DancePlaylistCard memberId={userId} />
      <DanceFlexibilityCard memberId={userId} />
      <DanceMoodBoardCard memberId={userId} />
      <DanceNutritionCard memberId={userId} />
    </>
  );
}
