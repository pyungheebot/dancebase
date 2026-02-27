"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CalendarView } from "@/components/schedule/calendar-view";
import { ScheduleForm } from "@/components/schedule/schedule-form";
import { IndependentToggle } from "@/components/shared/independent-toggle";
import type { EntityContext } from "@/types/entity-context";
import type { Schedule } from "@/types";

type ScheduleContentProps = {
  ctx: EntityContext;
  schedules: Schedule[];
  schedulesLoading: boolean;
  refetch: () => void;
};

export function ScheduleContent({
  ctx,
  schedules,
  schedulesLoading,
  refetch,
}: ScheduleContentProps) {
  const router = useRouter();

  if (schedulesLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <IndependentToggle ctx={ctx} feature="schedule" featureLabel="일정" />
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-medium">일정</h2>
        {ctx.permissions.canEdit && (
          <ScheduleForm
            groupId={ctx.groupId}
            projectId={ctx.projectId}
            onCreated={refetch}
          />
        )}
      </div>

      <CalendarView
        schedules={schedules}
        onSelectSchedule={(schedule) =>
          router.push(`${ctx.basePath}/attendance?schedule=${schedule.id}`)
        }
        canEdit={ctx.permissions.canEdit}
        onScheduleUpdated={refetch}
      />
    </>
  );
}
