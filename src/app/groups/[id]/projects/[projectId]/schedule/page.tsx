"use client";

import { use } from "react";
import { useProjectEntity } from "@/hooks/use-entity-data";
import { useSchedules } from "@/hooks/use-schedule";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityHeader } from "@/components/layout/entity-header";
import { EntityNav } from "@/components/layout/entity-nav";
import { ScheduleContent } from "@/components/schedule/schedule-content";
import { RehearsalScheduleCard } from "@/components/projects/rehearsal-schedule-card";

export default function ProjectSchedulePage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = use(params);
  const { ctx, loading } = useProjectEntity(id, projectId);
  const { schedules, loading: schedulesLoading, refetch } = useSchedules(id, projectId);

  return (
    <EntityPageLayout ctx={ctx} loading={loading} notFoundMessage="프로젝트를 찾을 수 없습니다">
      {(ctx) => {
        const memberNames = ctx.members.map(
          (m) => m.nickname ?? m.profile.name ?? ""
        ).filter(Boolean);

        return (
          <>
            <EntityHeader ctx={ctx} leaderLabel="일정 관리자" />
            <EntityNav ctx={ctx} />
            {ctx.projectId && (
              <div className="mt-4">
                <RehearsalScheduleCard
                  groupId={ctx.groupId}
                  projectId={ctx.projectId}
                  memberNames={memberNames}
                />
              </div>
            )}
            <ScheduleContent ctx={ctx} schedules={schedules} schedulesLoading={schedulesLoading} refetch={refetch} />
          </>
        );
      }}
    </EntityPageLayout>
  );
}
