"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { AttendanceStats } from "@/components/attendance/attendance-stats";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScheduleForm } from "@/components/schedule/schedule-form";
import { Loader2, MapPin, Clock, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { EntityContext } from "@/types/entity-context";
import type {
  Schedule,
  AttendanceWithProfile,
  GroupMemberWithProfile,
  MemberCategory,
  Profile,
} from "@/types";

const attendanceMethodLabels: Record<string, string> = {
  admin: "관리자 입력",
  location: "위치기반",
  none: "안함",
};

type AttendanceContentProps = {
  ctx: EntityContext;
  schedules: Schedule[];
  schedulesLoading: boolean;
  refetchSchedules: () => void;
  categories?: MemberCategory[];
  categoryMap?: Record<string, string>;
  categoryColorMap?: Record<string, string>;
};

export function AttendanceContent({
  ctx,
  schedules,
  schedulesLoading,
  refetchSchedules,
  categories,
  categoryMap,
  categoryColorMap,
}: AttendanceContentProps) {
  const searchParams = useSearchParams();
  const initialScheduleId = searchParams.get("schedule");

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(
    initialScheduleId || ""
  );
  const [attendance, setAttendance] = useState<AttendanceWithProfile[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const supabase = createClient();

  // NormalizedMember → GroupMemberWithProfile 역변환
  const membersForTable: GroupMemberWithProfile[] = ctx.members.map((m) => ({
    id: m.id,
    group_id: ctx.groupId,
    user_id: m.userId,
    role: m.role,
    joined_at: m.joinedAt,
    nickname: m.nickname,
    category_id: m.categoryId ?? null,
    profiles: {
      ...({} as Profile),
      id: m.profile.id,
      name: m.profile.name,
      avatar_url: m.profile.avatar_url,
      dance_genre: m.profile.dance_genre ?? [],
    },
  }));

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    if (!selectedScheduleId && schedules.length > 0 && !initialScheduleId) {
      const now = new Date();
      const upcoming = schedules
        .filter((s) => new Date(s.starts_at) >= now)
        .sort(
          (a, b) =>
            new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
        );
      if (upcoming.length > 0) {
        setSelectedScheduleId(upcoming[0].id);
      } else if (schedules.length > 0) {
        setSelectedScheduleId(schedules[schedules.length - 1].id);
      }
    }
  }, [schedules, selectedScheduleId, initialScheduleId]);

  const fetchAttendance = useCallback(async () => {
    if (!selectedScheduleId) return;
    setLoadingAttendance(true);
    const { data } = await supabase
      .from("attendance")
      .select("*, profiles(*)")
      .eq("schedule_id", selectedScheduleId);
    if (data) setAttendance(data as AttendanceWithProfile[]);
    setLoadingAttendance(false);
  }, [supabase, selectedScheduleId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleBulkStatus = useCallback(async (status: "present" | "absent" | "undecided") => {
    if (!selectedScheduleId) return;
    setBulkUpdating(true);
    try {
      const userIds = membersForTable.map((m) => m.user_id);

      if (status === "undecided") {
        // 전체 미정: 출석 레코드 삭제
        const { error } = await supabase
          .from("attendance")
          .delete()
          .eq("schedule_id", selectedScheduleId)
          .in("user_id", userIds);
        if (error) { toast.error("일괄 처리에 실패했습니다"); return; }
      } else {
        // 기존 레코드 업데이트 (upsert)
        const now = new Date().toISOString();
        const upsertData = userIds.map((userId) => ({
          schedule_id: selectedScheduleId,
          user_id: userId,
          status,
          checked_at: now,
        }));
        const { error } = await supabase
          .from("attendance")
          .upsert(upsertData, { onConflict: "schedule_id,user_id" });
        if (error) { toast.error("일괄 처리에 실패했습니다"); return; }
      }

      toast.success(
        status === "present" ? "전체 출석 처리되었습니다" :
        status === "absent" ? "전체 결석 처리되었습니다" :
        "전체 미정 처리되었습니다"
      );
      await fetchAttendance();
    } finally {
      setBulkUpdating(false);
    }
  }, [selectedScheduleId, membersForTable, supabase, fetchAttendance]);

  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">등록된 일정이 없습니다</p>
        <Button asChild className="mt-4">
          <Link href={`${ctx.basePath}/schedule`}>일정 등록하기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Select
          value={selectedScheduleId}
          onValueChange={setSelectedScheduleId}
        >
          <SelectTrigger>
            <SelectValue placeholder="일정을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {schedules.map((schedule) => (
              <SelectItem key={schedule.id} value={schedule.id}>
                {schedule.title} -{" "}
                {format(new Date(schedule.starts_at), "M/d (EEE) HH:mm", {
                  locale: ko,
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedSchedule && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(selectedSchedule.starts_at), "HH:mm")} -{" "}
              {format(new Date(selectedSchedule.ends_at), "HH:mm")}
            </span>
            {selectedSchedule.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {selectedSchedule.location}
              </span>
            )}
            <Badge variant="outline" className="text-xs">
              출석:{" "}
              {attendanceMethodLabels[selectedSchedule.attendance_method] ||
                "관리자 입력"}
            </Badge>
            {ctx.permissions.canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                수정
              </Button>
            )}
          </div>
        )}
        {selectedSchedule && ctx.permissions.canEdit && (
          <ScheduleForm
            mode="edit"
            groupId={selectedSchedule.group_id}
            schedule={selectedSchedule}
            open={editOpen}
            onOpenChange={setEditOpen}
            onCreated={() => {
              refetchSchedules();
              fetchAttendance();
            }}
          />
        )}
      </div>

      {selectedScheduleId && selectedSchedule && (
        <>
          {selectedSchedule.attendance_method === "none" ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                이 일정은 출석 체크를 사용하지 않습니다
              </p>
            </div>
          ) : (
            <>
              <AttendanceStats
                attendance={attendance}
                totalMembers={membersForTable.length}
                members={membersForTable}
                categories={categories}
                categoryColorMap={categoryColorMap}
              />

              {ctx.permissions.canEdit && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-1">일괄 처리:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={bulkUpdating || loadingAttendance}
                    onClick={() => handleBulkStatus("present")}
                  >
                    {bulkUpdating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    전체 출석
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={bulkUpdating || loadingAttendance}
                    onClick={() => handleBulkStatus("absent")}
                  >
                    전체 결석
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={bulkUpdating || loadingAttendance}
                    onClick={() => handleBulkStatus("undecided")}
                  >
                    전체 미정
                  </Button>
                </div>
              )}

              {loadingAttendance ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <AttendanceTable
                  schedule={selectedSchedule}
                  members={membersForTable}
                  attendance={attendance}
                  myRole={ctx.permissions.canEdit ? "leader" : "member"}
                  currentUserId={currentUserId}
                  groupId={ctx.groupId}
                  categoryMap={categoryMap}
                  categoryColorMap={categoryColorMap}
                  onUpdate={fetchAttendance}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
