"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Clock, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useScheduleWaitlist } from "@/hooks/use-schedule-waitlist";
import type { Schedule } from "@/types";

type ScheduleWaitlistSectionProps = {
  schedule: Schedule;
  /** RSVP "going" 인원 수 */
  goingCount: number;
};

export function ScheduleWaitlistSection({
  schedule,
  goingCount,
}: ScheduleWaitlistSectionProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { waitlist, loading, joinWaitlist, leaveWaitlist } =
    useScheduleWaitlist(schedule.max_attendees != null ? schedule.id : null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  // max_attendees 미설정 시 섹션 숨김
  if (schedule.max_attendees == null) return null;

  const maxAttendees = schedule.max_attendees;
  const isFull = goingCount >= maxAttendees;
  const myWaitlistEntry = waitlist.find((w) => w.user_id === currentUserId);
  const isOnWaitlist = !!myWaitlistEntry;

  const handleJoin = async () => {
    setSubmitting(true);
    try {
      await joinWaitlist();
      toast.success("대기 명단에 등록되었습니다");
    } catch {
      toast.error("대기 등록에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeave = async () => {
    setSubmitting(true);
    try {
      await leaveWaitlist();
      toast.success("대기 명단에서 취소되었습니다");
    } catch {
      toast.error("대기 취소에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* 정원 현황 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">정원</span>
        </div>
        <Badge
          className={`text-[10px] px-1.5 py-0 ${
            isFull
              ? "bg-red-100 text-red-700 border-red-200"
              : "bg-green-100 text-green-700 border-green-200"
          }`}
          variant="outline"
        >
          참석 {goingCount}/{maxAttendees}명
          {isFull && " (정원 마감)"}
        </Badge>
      </div>

      {/* 대기 명단 */}
      {waitlist.length > 0 && (
        <div className="rounded border p-2 space-y-1.5">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground">
              대기 중 ({waitlist.length}명)
            </span>
          </div>
          <div className="space-y-1">
            {loading ? (
              <div className="h-5 bg-muted animate-pulse rounded" />
            ) : (
              waitlist.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-1.5"
                >
                  <span className="text-[10px] text-muted-foreground w-4 shrink-0 text-right">
                    {entry.position}.
                  </span>
                  <Avatar className="h-4 w-4 shrink-0">
                    <AvatarImage src={entry.profiles.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[8px]">
                      {entry.profiles.name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate">{entry.profiles.name}</span>
                  {entry.user_id === currentUserId && (
                    <Badge className="text-[8px] px-1 py-0 ml-auto shrink-0 bg-blue-100 text-blue-700 border-blue-200" variant="outline">
                      나
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 대기 등록 / 취소 버튼 */}
      {isFull && (
        <div>
          {isOnWaitlist ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs w-full"
              disabled={submitting}
              onClick={handleLeave}
            >
              <Clock className="h-3 w-3 mr-1" />
              대기 취소 (현재 {myWaitlistEntry.position}번)
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs w-full"
              disabled={submitting || !currentUserId}
              onClick={handleJoin}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              대기 등록
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
