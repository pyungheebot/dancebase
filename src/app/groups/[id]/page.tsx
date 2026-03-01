"use client";

import { use, useState } from "react";
import dynamic from "next/dynamic";
import { CardErrorBoundary } from "@/components/shared/card-error-boundary";
import { useGroupEntity } from "@/hooks/use-entity-data";
import { useAuth } from "@/hooks/use-auth";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityNav } from "@/components/layout/entity-nav";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { InviteModal } from "@/components/groups/invite-modal";
import { GroupStatsCards } from "@/components/groups/group-stats-cards";
import { GroupRulesBanner } from "@/components/groups/group-rules-banner";
import { RoleOnboardingChecklist } from "@/components/groups/role-onboarding-checklist";
import { MemberOnboardingChecklist } from "@/components/members/member-onboarding-checklist";
import { MonthlyReportDialog } from "@/components/groups/monthly-report-dialog";
import { GroupActivityFeed } from "@/components/groups/group-activity-feed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeaderInfo } from "@/components/ui/leader-info";
import { BarChart3, Globe } from "lucide-react";
import Link from "next/link";

const GroupHealthCard = dynamic(() => import("@/components/groups/group-health-card").then(m => ({ default: m.GroupHealthCard })));
const GroupLinksSection = dynamic(() => import("@/components/groups/group-links-section").then(m => ({ default: m.GroupLinksSection })));
const PracticePlaylistSection = dynamic(() => import("@/components/groups/practice-playlist-section").then(m => ({ default: m.PracticePlaylistSection })));
const PerformanceRecordSection = dynamic(() => import("@/components/groups/performance-record-section").then(m => ({ default: m.PerformanceRecordSection })));
const GroupPollsCard = dynamic(() => import("@/components/groups/group-polls-card").then(m => ({ default: m.GroupPollsCard })));
const MeetingMinutesCard = dynamic(() => import("@/components/groups/meeting-minutes-card").then(m => ({ default: m.MeetingMinutesCard })));
const TimeCapsuleCard = dynamic(() => import("@/components/groups/time-capsule-card").then(m => ({ default: m.TimeCapsuleCard })));
const AppreciationCardCard = dynamic(() => import("@/components/groups/appreciation-card-card").then(m => ({ default: m.AppreciationCardCard })));
const MemberAttendanceStatsCard = dynamic(() => import("@/components/groups/member-attendance-stats-card").then(m => ({ default: m.MemberAttendanceStatsCard })));
const MonthlyHighlightCard = dynamic(() => import("@/components/groups/monthly-highlight-card").then(m => ({ default: m.MonthlyHighlightCard })));
const MentalCoachingCard = dynamic(() => import("@/components/groups/mental-coaching-card").then(m => ({ default: m.MentalCoachingCard })));
const EventCalendarCard = dynamic(() => import("@/components/groups/event-calendar-card").then(m => ({ default: m.EventCalendarCard })));
const GrowthJournalCard = dynamic(() => import("@/components/groups/growth-journal-card").then(m => ({ default: m.GrowthJournalCard })));
const PracticeRoomBookingCard = dynamic(() => import("@/components/groups/practice-room-booking-card").then(m => ({ default: m.PracticeRoomBookingCard })));
const TeamBuildingCard = dynamic(() => import("@/components/groups/team-building-card").then(m => ({ default: m.TeamBuildingCard })));
const QrCheckInCard = dynamic(() => import("@/components/groups/qr-check-in-card").then(m => ({ default: m.QrCheckInCard })));
const GroupBudgetCard = dynamic(() => import("@/components/groups/group-budget-card").then(m => ({ default: m.GroupBudgetCard })));
const GroupAnnouncementCard = dynamic(() => import("@/components/groups/group-announcement-card").then(m => ({ default: m.GroupAnnouncementCard })));
const AttendanceBookCard = dynamic(() => import("@/components/groups/attendance-book-card").then(m => ({ default: m.AttendanceBookCard })));
const GroupEquipmentCard = dynamic(() => import("@/components/groups/group-equipment-card").then(m => ({ default: m.GroupEquipmentCard })));
const MeetingVoteCard = dynamic(() => import("@/components/groups/meeting-vote-card").then(m => ({ default: m.MeetingVoteCard })));
const MemberBirthdayCard = dynamic(() => import("@/components/groups/member-birthday-card").then(m => ({ default: m.MemberBirthdayCard })));
const SharedFilesCard = dynamic(() => import("@/components/groups/shared-files-card").then(m => ({ default: m.SharedFilesCard })));
const MediaGalleryCard = dynamic(() => import("@/components/groups/media-gallery-card").then(m => ({ default: m.MediaGalleryCard })));
const GroupAnniversaryCard = dynamic(() => import("@/components/groups/group-anniversary-card").then(m => ({ default: m.GroupAnniversaryCard })));
const GroupRulebookCard = dynamic(() => import("@/components/groups/group-rulebook-card").then(m => ({ default: m.GroupRulebookCard })));
const MembershipFeeCard = dynamic(() => import("@/components/groups/membership-fee-card").then(m => ({ default: m.MembershipFeeCard })));
const GroupMusicLibraryCard = dynamic(() => import("@/components/groups/group-music-library-card").then(m => ({ default: m.GroupMusicLibraryCard })));
const GroupPracticeFeedbackCard = dynamic(() => import("@/components/groups/group-practice-feedback-card").then(m => ({ default: m.GroupPracticeFeedbackCard })));
const GroupMentorCard = dynamic(() => import("@/components/groups/group-mentor-card").then(m => ({ default: m.GroupMentorCard })));
const GroupChallengeCard = dynamic(() => import("@/components/groups/group-challenge-card").then(m => ({ default: m.GroupChallengeCard })));
const GroupWishlistCard = dynamic(() => import("@/components/groups/group-wishlist-card").then(m => ({ default: m.GroupWishlistCard })));
const GroupStreakCard = dynamic(() => import("@/components/groups/group-streak-card").then(m => ({ default: m.GroupStreakCard })));
const GroupFaqCard = dynamic(() => import("@/components/groups/group-faq-card").then(m => ({ default: m.GroupFaqCard })));
const GroupDuesTrackerCard = dynamic(() => import("@/components/groups/group-dues-tracker-card").then(m => ({ default: m.GroupDuesTrackerCard })));
const GroupNoticeboardCard = dynamic(() => import("@/components/groups/group-noticeboard-card").then(m => ({ default: m.GroupNoticeboardCard })));
const GroupVotingCard = dynamic(() => import("@/components/groups/group-voting-card").then(m => ({ default: m.GroupVotingCard })));
const GroupCarPoolCard = dynamic(() => import("@/components/groups/group-carpool-card").then(m => ({ default: m.GroupCarPoolCard })));
const GroupFeedbackBoxCard = dynamic(() => import("@/components/groups/group-feedback-box-card").then(m => ({ default: m.GroupFeedbackBoxCard })));
const GroupSkillShareCard = dynamic(() => import("@/components/groups/group-skill-share-card").then(m => ({ default: m.GroupSkillShareCard })));
const GroupPenaltyCard = dynamic(() => import("@/components/groups/group-penalty-card").then(m => ({ default: m.GroupPenaltyCard })));
const GroupTimelineCard = dynamic(() => import("@/components/groups/group-timeline-card").then(m => ({ default: m.GroupTimelineCard })));
const GroupLostFoundCard = dynamic(() => import("@/components/groups/group-lost-found-card").then(m => ({ default: m.GroupLostFoundCard })));
const PracticeStatsCard = dynamic(() => import("@/components/groups/practice-stats-card").then(m => ({ default: m.PracticeStatsCard })));

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { ctx, loading } = useGroupEntity(id);
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <EntityPageLayout ctx={ctx} loading={loading} notFoundMessage="그룹을 찾을 수 없습니다">
      {(ctx) => (
        <>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                {ctx.header.name}
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                  {ctx.header.badge || "기타"}
                </Badge>
              </h1>
              {ctx.header.description && (
                <p className="text-sm text-muted-foreground mt-1">{ctx.header.description}</p>
              )}
              <LeaderInfo
                label="그룹장"
                leaderNames={ctx.members.filter((m) => m.role === "leader").map((m) => m.nickname || m.profile.name)}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <GroupActivityFeed groupId={ctx.groupId} />
              {ctx.raw.group?.visibility === "public" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  asChild
                >
                  <Link href={`/groups/${ctx.groupId}/portfolio`}>
                    <Globe className="h-3 w-3 mr-1" />
                    포트폴리오
                  </Link>
                </Button>
              )}
              {(ctx.permissions.canEdit || ctx.permissions.canManageMembers) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setReportOpen(true)}
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  월별 리포트
                </Button>
              )}
              {ctx.permissions.canEdit && <InviteModal inviteCode={ctx.inviteCode || ""} />}
            </div>
          </div>

          {ctx.raw.group?.dance_genre && ctx.raw.group.dance_genre.length > 0 ? (
            <div className="flex flex-wrap gap-1 mb-3">
              {ctx.raw.group.dance_genre.map((genre) => (
                <Badge key={genre} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">{genre}</Badge>
              ))}
            </div>
          ) : (
            <div className="mb-3" />
          )}

          <GroupRulesBanner groupId={ctx.groupId} />

          <RoleOnboardingChecklist
            groupId={ctx.groupId}
            role={
              ctx.permissions.canEdit
                ? "leader"
                : ctx.permissions.canManageMembers
                  ? "sub_leader"
                  : "member"
            }
          />

          {user && (() => {
            const myMember = ctx.members.find((m) => m.userId === user.id);
            return (
              <MemberOnboardingChecklist
                groupId={ctx.groupId}
                userId={user.id}
                joinedAt={myMember?.joinedAt ?? null}
              />
            );
          })()}

          <CardErrorBoundary cardName="GroupStatsCards">
            <GroupStatsCards groupId={ctx.groupId} memberCount={ctx.members.length} />
          </CardErrorBoundary>

          <CardErrorBoundary cardName="GroupHealthCard">
            <GroupHealthCard groupId={ctx.groupId} />
          </CardErrorBoundary>

          <CardErrorBoundary cardName="PracticeStatsCard">
            <PracticeStatsCard groupId={ctx.groupId} />
          </CardErrorBoundary>

          <CardErrorBoundary cardName="GroupPollsCard">
            <GroupPollsCard
              groupId={ctx.groupId}
              canManage={ctx.permissions.canEdit || ctx.permissions.canManageMembers}
            />
          </CardErrorBoundary>

          <CardErrorBoundary cardName="MeetingMinutesCard">
            <MeetingMinutesCard
              groupId={ctx.groupId}
              memberNames={ctx.members.map((m) => m.nickname || m.profile.name)}
            />
          </CardErrorBoundary>

          <GroupLinksSection
            groupId={ctx.groupId}
            canEdit={ctx.permissions.canEdit || ctx.permissions.canManageMembers}
          />

          <PracticePlaylistSection groupId={ctx.groupId} />

          <PerformanceRecordSection
            groupId={ctx.groupId}
            canEdit={ctx.permissions.canEdit || ctx.permissions.canManageMembers}
          />

          <TimeCapsuleCard groupId={ctx.groupId} />

          <AppreciationCardCard
            groupId={ctx.groupId}
            memberNames={ctx.members.map((m) => m.nickname || m.profile.name)}
          />

          <MemberAttendanceStatsCard groupId={ctx.groupId} />

          <MonthlyHighlightCard groupId={ctx.groupId} />

          <MentalCoachingCard
            groupId={ctx.groupId}
            memberNames={ctx.members.map((m) => m.nickname || m.profile.name)}
          />

          <EventCalendarCard groupId={ctx.groupId} />

          <GrowthJournalCard
            groupId={ctx.groupId}
            memberNames={ctx.members.map((m) => m.nickname || m.profile.name)}
          />

          <PracticeRoomBookingCard groupId={ctx.groupId} />

          <TeamBuildingCard
            groupId={ctx.groupId}
            memberNames={ctx.members.map((m) => m.nickname || m.profile.name)}
          />

          <QrCheckInCard
            groupId={ctx.groupId}
            memberNames={ctx.members.map((m) => m.nickname || m.profile.name)}
          />

          <GroupBudgetCard groupId={ctx.groupId} />

          <GroupAnnouncementCard groupId={ctx.groupId} />

          <AttendanceBookCard
            groupId={ctx.groupId}
            memberNames={ctx.members.map((m) => m.nickname || m.profile.name)}
          />

          <GroupEquipmentCard groupId={ctx.groupId} />

          <MeetingVoteCard groupId={ctx.groupId} />

          <MemberBirthdayCard groupId={ctx.groupId} />

          <SharedFilesCard groupId={ctx.groupId} />

          <MediaGalleryCard groupId={ctx.groupId} />

          <GroupAnniversaryCard groupId={ctx.groupId} />

          <GroupRulebookCard groupId={ctx.groupId} />

          <MembershipFeeCard
            groupId={ctx.groupId}
            memberNames={ctx.members.map((m) => m.nickname || m.profile.name)}
          />

          <GroupMusicLibraryCard groupId={ctx.groupId} />

          <GroupPracticeFeedbackCard groupId={ctx.groupId} />

          <GroupMentorCard groupId={ctx.groupId} />

          <GroupChallengeCard groupId={ctx.groupId} />

          <GroupWishlistCard groupId={ctx.groupId} />

          <GroupStreakCard groupId={ctx.groupId} />

          <GroupFaqCard groupId={ctx.groupId} />

          <GroupDuesTrackerCard groupId={ctx.groupId} />

          <GroupNoticeboardCard groupId={ctx.groupId} />

          <GroupVotingCard groupId={ctx.groupId} />

          <GroupCarPoolCard groupId={ctx.groupId} />

          <GroupFeedbackBoxCard groupId={ctx.groupId} />

          <GroupSkillShareCard groupId={ctx.groupId} />

          <GroupPenaltyCard groupId={ctx.groupId} />

          <GroupTimelineCard groupId={ctx.groupId} />

          <GroupLostFoundCard groupId={ctx.groupId} />

          <EntityNav ctx={ctx} />
          <DashboardContent ctx={ctx} />

          <MonthlyReportDialog
            open={reportOpen}
            onOpenChange={setReportOpen}
            groupId={ctx.groupId}
          />
        </>
      )}
    </EntityPageLayout>
  );
}
