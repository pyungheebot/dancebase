"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { useProjectEntity } from "@/hooks/use-entity-data";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityHeader } from "@/components/layout/entity-header";
import { EntityNav } from "@/components/layout/entity-nav";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { MeetingMinutesSection } from "@/components/projects/meeting-minutes-section";
import { ProjectTaskBoard } from "@/components/projects/project-task-board";
import { ProjectNoticeFeed } from "@/components/projects/project-notice-feed";
import { ProjectProgressOverview } from "@/components/projects/project-progress-overview";
import { RoleAssignmentBoard } from "@/components/projects/role-assignment-board";

const LightingCueCard = dynamic(() => import("@/components/projects/lighting-cue-card").then(m => ({ default: m.LightingCueCard })));
const CostumeChangeCard = dynamic(() => import("@/components/projects/costume-change-card").then(m => ({ default: m.CostumeChangeCard })));
const PhotoCallCard = dynamic(() => import("@/components/projects/photo-call-card").then(m => ({ default: m.PhotoCallCard })));
const StageBlockingCard = dynamic(() => import("@/components/projects/stage-blocking-card").then(m => ({ default: m.StageBlockingCard })));
const PostShowReportCard = dynamic(() => import("@/components/projects/post-show-report-card").then(m => ({ default: m.PostShowReportCard })));
const LiveShowFeedCard = dynamic(() => import("@/components/projects/live-show-feed-card").then(m => ({ default: m.LiveShowFeedCard })));
const VipGuestCard = dynamic(() => import("@/components/projects/vip-guest-card").then(m => ({ default: m.VipGuestCard })));
const SocialPostPlannerCard = dynamic(() => import("@/components/projects/social-post-planner-card").then(m => ({ default: m.SocialPostPlannerCard })));
const StageSetupChecklistCard = dynamic(() => import("@/components/projects/stage-setup-checklist-card").then(m => ({ default: m.StageSetupChecklistCard })));
const ShowCreditsCard = dynamic(() => import("@/components/projects/show-credits-card").then(m => ({ default: m.ShowCreditsCard })));
const DressRehearsalCard = dynamic(() => import("@/components/projects/dress-rehearsal-card").then(m => ({ default: m.DressRehearsalCard })));
const StageRiskCard = dynamic(() => import("@/components/projects/stage-risk-card").then(m => ({ default: m.StageRiskCard })));
const SoundCueCard = dynamic(() => import("@/components/projects/sound-cue-card").then(m => ({ default: m.SoundCueCard })));
const StageTransitionCard = dynamic(() => import("@/components/projects/stage-transition-card").then(m => ({ default: m.StageTransitionCard })));
const StageFormationCard = dynamic(() => import("@/components/projects/stage-formation-card").then(m => ({ default: m.StageFormationCard })));
const PerformanceTicketCard = dynamic(() => import("@/components/projects/performance-ticket-card").then(m => ({ default: m.PerformanceTicketCard })));
const BackstageLogCard = dynamic(() => import("@/components/projects/backstage-log-card").then(m => ({ default: m.BackstageLogCard })));
const PerformanceSponsorCard = dynamic(() => import("@/components/projects/performance-sponsor-card").then(m => ({ default: m.PerformanceSponsorCard })));
const ProgramBookEditorCard = dynamic(() => import("@/components/projects/program-book-editor-card").then(m => ({ default: m.ProgramBookEditorCard })));
const MarketingCampaignCard = dynamic(() => import("@/components/projects/marketing-campaign-card").then(m => ({ default: m.MarketingCampaignCard })));
const RehearsalScheduleCard = dynamic(() => import("@/components/projects/rehearsal-schedule-card").then(m => ({ default: m.RehearsalScheduleCard })));
const AudienceFeedbackCard = dynamic(() => import("@/components/projects/audience-feedback-card").then(m => ({ default: m.AudienceFeedbackCard })));
const StageSafetyCard = dynamic(() => import("@/components/projects/stage-safety-card").then(m => ({ default: m.StageSafetyCard })));
const CostumeFittingCard = dynamic(() => import("@/components/projects/costume-fitting-card").then(m => ({ default: m.CostumeFittingCard })));
const PerformanceSetlistCard = dynamic(() => import("@/components/projects/performance-setlist-card").then(m => ({ default: m.PerformanceSetlistCard })));
const StagePropCard = dynamic(() => import("@/components/projects/stage-prop-card").then(m => ({ default: m.StagePropCard })));
const ConsentFormCard = dynamic(() => import("@/components/projects/consent-form-card").then(m => ({ default: m.ConsentFormCard })));
const PhotoShootCard = dynamic(() => import("@/components/projects/photo-shoot-card").then(m => ({ default: m.PhotoShootCard })));
const VenueManagementCard = dynamic(() => import("@/components/projects/venue-management-card").then(m => ({ default: m.VenueManagementCard })));
const MakeupHairCard = dynamic(() => import("@/components/projects/makeup-hair-card").then(m => ({ default: m.MakeupHairCard })));
const EmergencyContactCard = dynamic(() => import("@/components/projects/emergency-contact-card").then(m => ({ default: m.EmergencyContactCard })));
const StageEffectCard = dynamic(() => import("@/components/projects/stage-effect-card").then(m => ({ default: m.StageEffectCard })));
const CueSheetCard = dynamic(() => import("@/components/projects/cue-sheet-card").then(m => ({ default: m.CueSheetCard })));
const WardrobeTrackerCard = dynamic(() => import("@/components/projects/wardrobe-tracker-card").then(m => ({ default: m.WardrobeTrackerCard })));
const IntercomCard = dynamic(() => import("@/components/projects/intercom-card").then(m => ({ default: m.IntercomCard })));
const StageWeatherCard = dynamic(() => import("@/components/projects/stage-weather-card").then(m => ({ default: m.StageWeatherCard })));
const StageRundownCard = dynamic(() => import("@/components/projects/stage-rundown-card").then(m => ({ default: m.StageRundownCard })));
const ArtistRiderCard = dynamic(() => import("@/components/projects/artist-rider-card").then(m => ({ default: m.ArtistRiderCard })));
const TicketSalesCard = dynamic(() => import("@/components/projects/ticket-sales-card").then(m => ({ default: m.TicketSalesCard })));
const StageAccessCard = dynamic(() => import("@/components/projects/stage-access-card").then(m => ({ default: m.StageAccessCard })));
const SetChangeLogCard = dynamic(() => import("@/components/projects/set-change-log-card").then(m => ({ default: m.SetChangeLogCard })));
const ShowDayChecklistCard = dynamic(() => import("@/components/projects/show-day-checklist-card").then(m => ({ default: m.ShowDayChecklistCard })));

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = use(params);
  const { ctx, loading } = useProjectEntity(id, projectId);

  return (
    <EntityPageLayout ctx={ctx} loading={loading} notFoundMessage="프로젝트를 찾을 수 없습니다">
      {(ctx) => (
        <>
          <EntityHeader ctx={ctx} leaderLabel="프로젝트장" />
          <EntityNav ctx={ctx} />
          <DashboardContent ctx={ctx} />
          {ctx.projectId && (
            <ProjectProgressOverview
              projectId={ctx.projectId}
              groupId={ctx.groupId}
              basePath={ctx.basePath}
            />
          )}
          <ProjectNoticeFeed ctx={ctx} />
          <ProjectTaskBoard ctx={ctx} />
          {ctx.projectId && (
            <RoleAssignmentBoard
              groupId={ctx.groupId}
              projectId={ctx.projectId}
              canEdit={ctx.permissions.canEdit}
            />
          )}
          <MeetingMinutesSection ctx={ctx} />
          {ctx.projectId && (
            <LightingCueCard
              groupId={ctx.groupId}
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <CostumeChangeCard
              groupId={ctx.groupId}
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <PhotoCallCard
              groupId={ctx.groupId}
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <StageBlockingCard
              groupId={ctx.groupId}
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <LiveShowFeedCard
              groupId={ctx.groupId}
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <PostShowReportCard
              groupId={ctx.groupId}
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <VipGuestCard
              groupId={ctx.groupId}
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <SocialPostPlannerCard
              groupId={ctx.groupId}
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <StageSetupChecklistCard
              groupId={ctx.groupId}
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <ShowCreditsCard
              groupId={ctx.groupId}
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <DressRehearsalCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <StageRiskCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <SoundCueCard
              groupId={ctx.groupId}
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <StageTransitionCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <StageFormationCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <PerformanceTicketCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <BackstageLogCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <PerformanceSponsorCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <ProgramBookEditorCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <MarketingCampaignCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <RehearsalScheduleCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <AudienceFeedbackCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <StageSafetyCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <CostumeFittingCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <PerformanceSetlistCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <StagePropCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <ConsentFormCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <PhotoShootCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <VenueManagementCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <MakeupHairCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <EmergencyContactCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <StageEffectCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <CueSheetCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <WardrobeTrackerCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <IntercomCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <StageWeatherCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <StageRundownCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <ArtistRiderCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <TicketSalesCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <StageAccessCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <SetChangeLogCard
              projectId={ctx.projectId}
            />
          )}
          {ctx.projectId && (
            <ShowDayChecklistCard
              projectId={ctx.projectId}
            />
          )}
        </>
      )}
    </EntityPageLayout>
  );
}
