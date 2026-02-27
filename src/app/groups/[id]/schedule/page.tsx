"use client";

import { use } from "react";
import { useGroupEntity } from "@/hooks/use-entity-data";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityHeader } from "@/components/layout/entity-header";
import { EntityNav } from "@/components/layout/entity-nav";
import { ScheduleContent } from "@/components/schedule/schedule-content";
import { useSchedules } from "@/hooks/use-schedule";

export default function SchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { ctx, loading } = useGroupEntity(id);
  const { schedules, loading: schedulesLoading, refetch } = useSchedules(id);

  return (
    <EntityPageLayout ctx={ctx} loading={loading} notFoundMessage="그룹을 찾을 수 없습니다">
      {(ctx) => (
        <>
          <EntityHeader ctx={ctx} leaderLabel="일정 관리자" />
          <EntityNav ctx={ctx} />
          <ScheduleContent
            ctx={ctx}
            schedules={schedules}
            schedulesLoading={schedulesLoading}
            refetch={refetch}
          />
        </>
      )}
    </EntityPageLayout>
  );
}
