"use client";

import { use } from "react";
import { useGroupEntity } from "@/hooks/use-entity-data";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityNav } from "@/components/layout/entity-nav";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { InviteModal } from "@/components/groups/invite-modal";
import { GroupStatsCards } from "@/components/groups/group-stats-cards";
import { GroupHealthCard } from "@/components/groups/group-health-card";
import { GroupLinksSection } from "@/components/groups/group-links-section";
import { RoleOnboardingChecklist } from "@/components/groups/role-onboarding-checklist";
import { Badge } from "@/components/ui/badge";
import { LeaderInfo } from "@/components/ui/leader-info";

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { ctx, loading } = useGroupEntity(id);

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
            {ctx.permissions.canEdit && <InviteModal inviteCode={ctx.inviteCode || ""} />}
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

          <GroupStatsCards groupId={ctx.groupId} memberCount={ctx.members.length} />

          <GroupHealthCard groupId={ctx.groupId} />

          <GroupLinksSection
            groupId={ctx.groupId}
            canEdit={ctx.permissions.canEdit || ctx.permissions.canManageMembers}
          />

          <EntityNav ctx={ctx} />
          <DashboardContent ctx={ctx} />
        </>
      )}
    </EntityPageLayout>
  );
}
