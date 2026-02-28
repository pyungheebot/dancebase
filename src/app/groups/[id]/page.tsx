"use client";

import { use, useState } from "react";
import { useGroupEntity } from "@/hooks/use-entity-data";
import { useAuth } from "@/hooks/use-auth";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityNav } from "@/components/layout/entity-nav";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { InviteModal } from "@/components/groups/invite-modal";
import { GroupStatsCards } from "@/components/groups/group-stats-cards";
import { GroupHealthCard } from "@/components/groups/group-health-card";
import { GroupLinksSection } from "@/components/groups/group-links-section";
import { GroupRulesBanner } from "@/components/groups/group-rules-banner";
import { PracticePlaylistSection } from "@/components/groups/practice-playlist-section";
import { PerformanceRecordSection } from "@/components/groups/performance-record-section";
import { RoleOnboardingChecklist } from "@/components/groups/role-onboarding-checklist";
import { MemberOnboardingChecklist } from "@/components/members/member-onboarding-checklist";
import { MonthlyReportDialog } from "@/components/groups/monthly-report-dialog";
import { GroupActivityFeed } from "@/components/groups/group-activity-feed";
import { PracticeStatsCard } from "@/components/groups/practice-stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeaderInfo } from "@/components/ui/leader-info";
import { GroupPollsCard } from "@/components/groups/group-polls-card";
import { MeetingMinutesCard } from "@/components/groups/meeting-minutes-card";
import { TimeCapsuleCard } from "@/components/groups/time-capsule-card";
import { AppreciationCardCard } from "@/components/groups/appreciation-card-card";
import { MemberAttendanceStatsCard } from "@/components/groups/member-attendance-stats-card";
import { MonthlyHighlightCard } from "@/components/groups/monthly-highlight-card";
import { MentalCoachingCard } from "@/components/groups/mental-coaching-card";
import { EventCalendarCard } from "@/components/groups/event-calendar-card";
import { GrowthJournalCard } from "@/components/groups/growth-journal-card";
import { PracticeRoomBookingCard } from "@/components/groups/practice-room-booking-card";
import { TeamBuildingCard } from "@/components/groups/team-building-card";
import { QrCheckInCard } from "@/components/groups/qr-check-in-card";
import { GroupBudgetCard } from "@/components/groups/group-budget-card";
import { GroupAnnouncementCard } from "@/components/groups/group-announcement-card";
import { AttendanceBookCard } from "@/components/groups/attendance-book-card";
import { GroupEquipmentCard } from "@/components/groups/group-equipment-card";
import { MeetingVoteCard } from "@/components/groups/meeting-vote-card";
import { MemberBirthdayCard } from "@/components/groups/member-birthday-card";
import { SharedFilesCard } from "@/components/groups/shared-files-card";
import { MediaGalleryCard } from "@/components/groups/media-gallery-card";
import { GroupAnniversaryCard } from "@/components/groups/group-anniversary-card";
import { GroupRulebookCard } from "@/components/groups/group-rulebook-card";
import { MembershipFeeCard } from "@/components/groups/membership-fee-card";
import { GroupMusicLibraryCard } from "@/components/groups/group-music-library-card";
import { GroupPracticeFeedbackCard } from "@/components/groups/group-practice-feedback-card";
import { GroupMentorCard } from "@/components/groups/group-mentor-card";
import { GroupChallengeCard } from "@/components/groups/group-challenge-card";
import { GroupWishlistCard } from "@/components/groups/group-wishlist-card";
import { GroupStreakCard } from "@/components/groups/group-streak-card";
import { GroupFaqCard } from "@/components/groups/group-faq-card";
import { GroupDuesTrackerCard } from "@/components/groups/group-dues-tracker-card";
import { GroupNoticeboardCard } from "@/components/groups/group-noticeboard-card";
import { GroupVotingCard } from "@/components/groups/group-voting-card";
import { GroupCarPoolCard } from "@/components/groups/group-carpool-card";
import { GroupFeedbackBoxCard } from "@/components/groups/group-feedback-box-card";
import { BarChart3, Globe } from "lucide-react";
import Link from "next/link";

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

          <GroupStatsCards groupId={ctx.groupId} memberCount={ctx.members.length} />

          <GroupHealthCard groupId={ctx.groupId} />

          <PracticeStatsCard groupId={ctx.groupId} />

          <GroupPollsCard
            groupId={ctx.groupId}
            canManage={ctx.permissions.canEdit || ctx.permissions.canManageMembers}
          />

          <MeetingMinutesCard
            groupId={ctx.groupId}
            memberNames={ctx.members.map((m) => m.nickname || m.profile.name)}
          />

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
