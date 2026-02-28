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
