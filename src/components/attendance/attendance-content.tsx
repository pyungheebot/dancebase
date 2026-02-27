"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { AttendanceStats } from "@/components/attendance/attendance-stats";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttendanceAnalytics } from "@/components/attendance/attendance-analytics";
import { ScheduleForm } from "@/components/schedule/schedule-form";
import { Loader2, MapPin, Clock, Pencil, Users, CalendarDays, Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import type { EntityContext } from "@/types/entity-context";
import type {
  Schedule,
  AttendanceWithProfile,
  GroupMemberWithProfile,
  MemberCategory,
  Profile,
  AttendanceStatus,
} from "@/types";

const attendanceMethodLabels: Record<string, string> = {
  admin: "관리자 입력",
  location: "위치기반",
  none: "안함",
};

// 기간 필터 옵션
type PeriodFilter = "this_month" | "last_month" | "last_3_months" | "all";

const periodFilterLabels: Record<PeriodFilter, string> = {
  this_month: "이번 달",
  last_month: "지난 달",
  last_3_months: "최근 3개월",
  all: "전체",
};

// 멤버별 집계 결과 타입
type MemberAttendanceStat = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  present: number;
  late: number;
  earlyLeave: number;
  absent: number;
  total: number;
  rate: number;
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

  // 멤버별 보기 상태
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("this_month");
  const [memberStats, setMemberStats] = useState<MemberAttendanceStat[]>([]);
  const [loadingMemberStats, setLoadingMemberStats] = useState(false);

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

  // 기간 범위 계산
  const getPeriodRange = useCallback((period: PeriodFilter): { from: string; to: string } | null => {
    const now = new Date();
    if (period === "all") return null;
    if (period === "this_month") {
      return {
        from: startOfMonth(now).toISOString(),
        to: endOfMonth(now).toISOString(),
      };
    }
    if (period === "last_month") {
      const lastMonth = subMonths(now, 1);
      return {
        from: startOfMonth(lastMonth).toISOString(),
        to: endOfMonth(lastMonth).toISOString(),
      };
    }
    if (period === "last_3_months") {
      return {
        from: startOfMonth(subMonths(now, 2)).toISOString(),
        to: endOfMonth(now).toISOString(),
      };
    }
    return null;
  }, []);

  // 멤버별 출석 통계 조회
  const fetchMemberStats = useCallback(async () => {
    if (ctx.members.length === 0) return;
    setLoadingMemberStats(true);
    try {
      const range = getPeriodRange(periodFilter);

      // 1단계: 기간 내 schedules 조회
      let schedulesQuery = supabase
        .from("schedules")
        .select("id")
        .eq("group_id", ctx.groupId)
        .neq("attendance_method", "none");

      if (ctx.projectId) {
        schedulesQuery = schedulesQuery.eq("project_id", ctx.projectId);
      }

      if (range) {
        schedulesQuery = schedulesQuery
          .gte("starts_at", range.from)
          .lte("starts_at", range.to);
      }

      const { data: scheduleRows, error: schedErr } = await schedulesQuery;
      if (schedErr) {
        toast.error("일정 데이터를 불러오지 못했습니다");
        return;
      }

      const scheduleIds = (scheduleRows ?? []).map((s: { id: string }) => s.id);
      const totalSchedules = scheduleIds.length;

      // 2단계: 해당 schedules의 attendance 조회
      let attendanceRows: { user_id: string; status: AttendanceStatus }[] = [];
      if (scheduleIds.length > 0) {
        const { data: attData, error: attErr } = await supabase
          .from("attendance")
          .select("user_id, status")
          .in("schedule_id", scheduleIds);
        if (attErr) {
          toast.error("출석 데이터를 불러오지 못했습니다");
          return;
        }
        attendanceRows = (attData ?? []) as { user_id: string; status: AttendanceStatus }[];
      }

      // 3단계: 클라이언트에서 멤버별 집계
      const stats: MemberAttendanceStat[] = ctx.members.map((member) => {
        const memberAttendance = attendanceRows.filter(
          (a) => a.user_id === member.userId
        );
        const present = memberAttendance.filter((a) => a.status === "present").length;
        const late = memberAttendance.filter((a) => a.status === "late").length;
        const earlyLeave = memberAttendance.filter((a) => a.status === "early_leave").length;
        const absent = totalSchedules - present - late - earlyLeave;
        const rate =
          totalSchedules > 0
            ? Math.round(((present + late) / totalSchedules) * 100)
            : 0;

        return {
          userId: member.userId,
          name: member.nickname || member.profile.name,
          avatarUrl: member.profile.avatar_url,
          present,
          late,
          earlyLeave,
          absent: Math.max(0, absent),
          total: totalSchedules,
          rate,
        };
      });

      // 출석률 내림차순 정렬
      stats.sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name));
      setMemberStats(stats);
    } finally {
      setLoadingMemberStats(false);
    }
  }, [supabase, ctx.groupId, ctx.projectId, ctx.members, periodFilter, getPeriodRange]);

  const handleBulkStatus = useCallback(async (status: "present" | "absent" | "undecided") => {
    if (!selectedScheduleId) return;
    setBulkUpdating(true);
    try {
      const userIds = membersForTable.map((m) => m.user_id);

      if (status === "undecided") {
        const { error } = await supabase
          .from("attendance")
          .delete()
          .eq("schedule_id", selectedScheduleId)
          .in("user_id", userIds);
        if (error) { toast.error("일괄 처리에 실패했습니다"); return; }
      } else {
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

  const handleDownloadMemberStatsCsv = () => {
    const dateStr = format(new Date(), "yyyy-MM");
    const filename = `출석현황_${dateStr}.csv`;

    const headers = ["멤버이름", "출석", "지각", "조퇴", "결석", "전체", "출석률(%)"];
    const rows = memberStats.map((stat) => [
      stat.name,
      String(stat.present),
      String(stat.late),
      String(stat.earlyLeave),
      String(stat.absent),
      String(stat.total),
      String(stat.rate),
    ]);

    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);

  if (schedules.length === 0 && !schedulesLoading) {
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
    <Tabs
      defaultValue="by-schedule"
      onValueChange={(val) => {
        if (val === "by-member") {
          fetchMemberStats();
        }
      }}
    >
      <TabsList className="mb-4">
        <TabsTrigger value="by-schedule" className="gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          일정별 보기
        </TabsTrigger>
        <TabsTrigger value="by-member" className="gap-1.5">
          <Users className="h-3.5 w-3.5" />
          멤버별 보기
        </TabsTrigger>
        <TabsTrigger value="analytics" className="gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          분석
        </TabsTrigger>
      </TabsList>

      {/* ===== 일정별 보기 ===== */}
      <TabsContent value="by-schedule">
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
      </TabsContent>

      {/* ===== 멤버별 보기 ===== */}
      <TabsContent value="by-member">
        <div className="space-y-4">
          {/* 기간 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">기간:</span>
            <Select
              value={periodFilter}
              onValueChange={(val) => {
                setPeriodFilter(val as PeriodFilter);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(periodFilterLabels) as PeriodFilter[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {periodFilterLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={fetchMemberStats}
              disabled={loadingMemberStats}
            >
              {loadingMemberStats ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              조회
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={handleDownloadMemberStatsCsv}
              disabled={memberStats.length === 0 || loadingMemberStats}
            >
              <Download className="h-3 w-3" />
              CSV 다운로드
            </Button>
          </div>

          {/* 멤버별 통계 테이블 */}
          {loadingMemberStats ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : memberStats.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">
                해당 기간에 출석 데이터가 없습니다
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">멤버</TableHead>
                    <TableHead className="text-xs text-center w-16">출석</TableHead>
                    <TableHead className="text-xs text-center w-16">지각</TableHead>
                    <TableHead className="text-xs text-center w-16">조퇴</TableHead>
                    <TableHead className="text-xs text-center w-16">결석</TableHead>
                    <TableHead className="text-xs text-center w-20">전체</TableHead>
                    <TableHead className="text-xs text-right w-24">출석률</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberStats.map((stat) => (
                    <TableRow key={stat.userId}>
                      <TableCell className="text-sm font-medium py-2.5">
                        {stat.name}
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <span className="text-sm tabular-nums text-green-600 font-medium">
                          {stat.present}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <span className="text-sm tabular-nums text-yellow-600 font-medium">
                          {stat.late}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <span className="text-sm tabular-nums text-orange-600 font-medium">
                          {stat.earlyLeave}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <span className="text-sm tabular-nums text-red-500 font-medium">
                          {stat.absent}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {stat.total}회
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                stat.rate >= 80
                                  ? "bg-green-500"
                                  : stat.rate >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${stat.rate}%` }}
                            />
                          </div>
                          <span
                            className={`text-sm font-semibold tabular-nums w-10 text-right ${
                              stat.rate >= 80
                                ? "text-green-600"
                                : stat.rate >= 50
                                ? "text-yellow-600"
                                : "text-red-500"
                            }`}
                          >
                            {stat.rate}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* 기준 설명 */}
          {memberStats.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              * 출석률 = (출석 + 지각) / 전체 일정 수 × 100. 조퇴는 결석으로 집계됩니다.
            </p>
          )}
        </div>
      </TabsContent>

      {/* ===== 분석 탭 ===== */}
      <TabsContent value="analytics">
        <AttendanceAnalytics ctx={ctx} />
      </TabsContent>
    </Tabs>
  );
}
