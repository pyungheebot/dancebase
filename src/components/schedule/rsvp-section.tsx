"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useScheduleRsvp } from "@/hooks/use-schedule-rsvp";
import { useAuth } from "@/hooks/use-auth";
import { useFormSubmission } from "@/hooks/use-form-submission";
import { ScheduleWaitlistSection } from "./schedule-waitlist-section";
import type { Schedule, ScheduleRsvpResponse } from "@/types";

// RSVP + 대기 명단 통합 섹션
export function RsvpSectionWithWaitlist({ schedule }: { schedule: Schedule }) {
  const { rsvp, loading, submitRsvp, cancelRsvp } = useScheduleRsvp(schedule.id);
  // useFormSubmission: pending 관리 + 에러 시 toast.error 자동 처리
  const { pending: submitting, submit } = useFormSubmission();
  const { user } = useAuth();

  const handleRsvp = async (response: ScheduleRsvpResponse) => {
    if (!user) {
      toast.error(TOAST.SCHEDULE.LOGIN_REQUIRED);
      return;
    }

    const labels: Record<ScheduleRsvpResponse, string> = {
      going: "참석",
      not_going: "불참",
      maybe: "미정",
    };

    if (rsvp?.my_response === response) {
      // 같은 응답 클릭 시 취소
      await submit(async () => {
        await cancelRsvp(user.id).catch(() => {
          throw new Error(TOAST.SCHEDULE.RSVP_CANCEL_ERROR);
        });
        toast.success(TOAST.SCHEDULE.RSVP_CANCELLED);
      });
      return;
    }

    // 새 응답 제출
    await submit(async () => {
      await submitRsvp(user.id, response).catch(() => {
        throw new Error(TOAST.SCHEDULE.RSVP_ERROR);
      });
      toast.success(`"${labels[response]}"으로 응답했습니다`);
    });
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">참석 여부</p>
        <div className="h-7 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">참석 여부</p>
          {rsvp && (
            <span className="text-[10px] text-muted-foreground">
              참석 {rsvp.going} · 불참 {rsvp.not_going} · 미정 {rsvp.maybe}
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            className="h-7 text-xs flex-1"
            variant={rsvp?.my_response === "going" ? "default" : "outline"}
            disabled={submitting}
            onClick={() => handleRsvp("going")}
          >
            참석{rsvp && rsvp.going > 0 ? ` ${rsvp.going}` : ""}
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs flex-1"
            variant={rsvp?.my_response === "not_going" ? "default" : "outline"}
            disabled={submitting}
            onClick={() => handleRsvp("not_going")}
          >
            불참{rsvp && rsvp.not_going > 0 ? ` ${rsvp.not_going}` : ""}
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs flex-1"
            variant={rsvp?.my_response === "maybe" ? "default" : "outline"}
            disabled={submitting}
            onClick={() => handleRsvp("maybe")}
          >
            미정{rsvp && rsvp.maybe > 0 ? ` ${rsvp.maybe}` : ""}
          </Button>
        </div>
      </div>

      {/* 대기 명단 섹션 */}
      <ScheduleWaitlistSection
        schedule={schedule}
        goingCount={rsvp?.going ?? 0}
      />
    </div>
  );
}
