"use client";

import { use } from "react";
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
import { LightingCueCard } from "@/components/projects/lighting-cue-card";
import { CostumeChangeCard } from "@/components/projects/costume-change-card";
import { PhotoCallCard } from "@/components/projects/photo-call-card";
import { StageBlockingCard } from "@/components/projects/stage-blocking-card";
import { PostShowReportCard } from "@/components/projects/post-show-report-card";
import { LiveShowFeedCard } from "@/components/projects/live-show-feed-card";
import { VipGuestCard } from "@/components/projects/vip-guest-card";
import { SocialPostPlannerCard } from "@/components/projects/social-post-planner-card";
import { StageSetupChecklistCard } from "@/components/projects/stage-setup-checklist-card";
import { ShowCreditsCard } from "@/components/projects/show-credits-card";
import { DressRehearsalCard } from "@/components/projects/dress-rehearsal-card";
import { StageRiskCard } from "@/components/projects/stage-risk-card";
import { SoundCueCard } from "@/components/projects/sound-cue-card";
import { StageTransitionCard } from "@/components/projects/stage-transition-card";

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
        </>
      )}
    </EntityPageLayout>
  );
}
