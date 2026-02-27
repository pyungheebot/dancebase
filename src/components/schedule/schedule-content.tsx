"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CalendarDays } from "lucide-react";
import { CalendarView } from "@/components/schedule/calendar-view";
import { ScheduleForm } from "@/components/schedule/schedule-form";
import { ScheduleTemplateList } from "@/components/schedule/schedule-template-list";
import { IndependentToggle } from "@/components/shared/independent-toggle";
import { EmptyState } from "@/components/shared/empty-state";
import type { EntityContext } from "@/types/entity-context";
import type { Schedule, ScheduleTemplate } from "@/types";

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
  const [formOpen, setFormOpen] = useState(false);
  const [templateSheetOpen, setTemplateSheetOpen] = useState(false);
  const [templatePrefill, setTemplatePrefill] = useState<Partial<{
    title: string;
    description: string;
    location: string;
  }> | null>(null);

  const handleSelectTemplate = (template: ScheduleTemplate) => {
    setTemplatePrefill({
      title: template.title,
      description: template.description ?? "",
      location: template.location ?? "",
    });
    setFormOpen(true);
  };

  const entityType = ctx.projectId ? "project" : "group";
  const entityId = ctx.projectId ?? ctx.groupId;

  if (schedulesLoading) {
    return (
      <div
        className="flex justify-center py-24"
        role="status"
        aria-label="일정 불러오는 중"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return (
    <section aria-label="일정 관리">
      <IndependentToggle ctx={ctx} feature="schedule" featureLabel="일정" />
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-medium">일정</h2>
        <div className="flex items-center gap-1.5">
          <ScheduleTemplateList
            entityType={entityType}
            entityId={entityId}
            canEdit={ctx.permissions.canEdit}
            open={templateSheetOpen}
            onOpenChange={setTemplateSheetOpen}
            onSelectTemplate={handleSelectTemplate}
          />
          {ctx.permissions.canEdit && (
            <ScheduleForm
              groupId={ctx.groupId}
              projectId={ctx.projectId}
              onCreated={() => {
                setTemplatePrefill(null);
                refetch();
              }}
              open={formOpen}
              onOpenChange={(v) => {
                setFormOpen(v);
                if (!v) setTemplatePrefill(null);
              }}
              prefill={templatePrefill}
            />
          )}
        </div>
      </div>

      {schedules.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="등록된 일정이 없습니다"
          description="첫 번째 일정을 추가하고 팀원들과 일정을 공유해보세요."
          action={
            ctx.permissions.canEdit
              ? { label: "일정 추가", onClick: () => setFormOpen(true) }
              : undefined
          }
        />
      ) : (
        <CalendarView
          schedules={schedules}
          onSelectSchedule={(schedule) =>
            router.push(`${ctx.basePath}/attendance?schedule=${schedule.id}`)
          }
          canEdit={ctx.permissions.canEdit}
          onScheduleUpdated={refetch}
        />
      )}
    </section>
  );
}
