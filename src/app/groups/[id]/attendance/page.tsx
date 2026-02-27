"use client";

import { use } from "react";
import { useGroupEntity } from "@/hooks/use-entity-data";
import { useSchedules } from "@/hooks/use-schedule";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityHeader } from "@/components/layout/entity-header";
import { EntityNav } from "@/components/layout/entity-nav";
import { AttendanceContent } from "@/components/attendance/attendance-content";

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ctx, loading } = useGroupEntity(id);
  const { schedules, loading: schedulesLoading, refetch: refetchSchedules } = useSchedules(id);

  return (
    <EntityPageLayout ctx={ctx} loading={loading || schedulesLoading} notFoundMessage="그룹을 찾을 수 없습니다">
      {(ctx) => (
        <>
          <EntityHeader ctx={ctx} leaderLabel="출석 관리자" />
          <EntityNav ctx={ctx} />
          <h2 className="text-xs font-medium mb-2">출석 관리</h2>
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
