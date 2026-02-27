"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CalendarDays, CalendarCheck, Copy, CalendarSearch, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarView } from "@/components/schedule/calendar-view";
import { ScheduleYearlyCalendar } from "@/components/schedule/schedule-yearly-calendar";
import { ScheduleForm } from "@/components/schedule/schedule-form";
import { ScheduleTemplateList } from "@/components/schedule/schedule-template-list";
import { OptimalTimeHint } from "@/components/schedule/optimal-time-hint";
import { BulkRsvpDialog } from "@/components/schedule/bulk-rsvp-dialog";
import { ScheduleCopyDialog } from "@/components/schedule/schedule-copy-dialog";
import { AvailabilityPollDialog } from "@/components/schedule/availability-poll-dialog";
import { PreRsvpPoll } from "@/components/schedule/pre-rsvp-poll";
import { ScheduleIcsSubscribe } from "@/components/schedule/schedule-ics-subscribe";
import { IndependentToggle } from "@/components/shared/independent-toggle";
import { EmptyState } from "@/components/shared/empty-state";
import { usePreRsvp } from "@/hooks/use-pre-rsvp";
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
  const [bulkRsvpOpen, setBulkRsvpOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [availabilityPollOpen, setAvailabilityPollOpen] = useState(false);
  const [preRsvpOpen, setPreRsvpOpen] = useState(false);
  const { poll: preRsvpPoll } = usePreRsvp(ctx.groupId);
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
          <ScheduleIcsSubscribe groupId={ctx.groupId} />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 relative"
            onClick={() => setPreRsvpOpen(true)}
          >
            <ClipboardCheck className="h-3 w-3" />
            의향 조사
            {preRsvpPoll?.status === "open" && (
              <Badge className="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 flex items-center justify-center text-[9px] bg-orange-500 border-0">
                {preRsvpPoll.responses.length}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setAvailabilityPollOpen(true)}
          >
            <CalendarSearch className="h-3 w-3" />
            가용 시간
          </Button>
          {schedules.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setBulkRsvpOpen(true)}
            >
              <CalendarCheck className="h-3 w-3" />
              일괄 RSVP
            </Button>
          )}
          {ctx.permissions.canEdit && ctx.projectId && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setCopyOpen(true)}
            >
              <Copy className="h-3 w-3" />
              일정 복사
            </Button>
          )}
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
              existingSchedules={schedules}
            />
          )}
        </div>
      </div>

      {ctx.permissions.canEdit && (
        <div className="mb-3">
          <OptimalTimeHint groupId={ctx.groupId} projectId={ctx.projectId} />
        </div>
      )}

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="h-7 mb-3">
          <TabsTrigger value="monthly" className="text-xs h-6 px-2.5">
            월별
          </TabsTrigger>
          <TabsTrigger value="yearly" className="text-xs h-6 px-2.5">
            연간
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
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
              groupId={ctx.groupId}
            />
          )}
        </TabsContent>

        <TabsContent value="yearly">
          <ScheduleYearlyCalendar groupId={ctx.groupId} />
        </TabsContent>
      </Tabs>

      {/* 일괄 RSVP 다이얼로그 */}
      <BulkRsvpDialog
        open={bulkRsvpOpen}
        onOpenChange={setBulkRsvpOpen}
        groupId={ctx.groupId}
        schedules={schedules}
      />

      {/* 일정 복사 다이얼로그 */}
      {ctx.permissions.canEdit && ctx.projectId && (
        <ScheduleCopyDialog
          open={copyOpen}
          onOpenChange={setCopyOpen}
          groupId={ctx.groupId}
          currentProjectId={ctx.projectId}
          onCopied={refetch}
        />
      )}

      {/* 가용 시간 투표 다이얼로그 */}
      <AvailabilityPollDialog
        open={availabilityPollOpen}
        onOpenChange={setAvailabilityPollOpen}
        groupId={ctx.groupId}
        canEdit={ctx.permissions.canEdit}
      />

      {/* 참여 의향 조사 다이얼로그 */}
      <PreRsvpPoll
        open={preRsvpOpen}
        onOpenChange={setPreRsvpOpen}
        groupId={ctx.groupId}
        canEdit={ctx.permissions.canEdit}
      />
    </section>
  );
}
