"use client";

import { use } from "react";
import { useProjectEntity } from "@/hooks/use-entity-data";
import { useSchedules } from "@/hooks/use-schedule";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityHeader } from "@/components/layout/entity-header";
import { EntityNav } from "@/components/layout/entity-nav";
import { AttendanceContent } from "@/components/attendance/attendance-content";

export default function ProjectAttendancePage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = use(params);
  const { ctx, loading } = useProjectEntity(id, projectId);
  const { schedules, loading: schedulesLoading, refetch: refetchSchedules } = useSchedules(id, projectId);

  return (
    <EntityPageLayout ctx={ctx} loading={loading || schedulesLoading} notFoundMessage="프로젝트를 찾을 수 없습니다">
      {(ctx) => (
        <>
          <EntityHeader ctx={ctx} leaderLabel="출석 관리자" />
          <EntityNav ctx={ctx} />
          <AttendanceContent
            ctx={ctx}
            schedules={schedules}
            schedulesLoading={schedulesLoading}
            refetchSchedules={refetchSchedules}
            categories={ctx.raw.categories}
            categoryMap={ctx.raw.categoryMap}
            categoryColorMap={ctx.raw.categoryColorMap}
          />
        </>
      )}
    </EntityPageLayout>
  );
}
