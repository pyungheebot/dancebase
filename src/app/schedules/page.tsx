"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MapPin,
  FolderOpen,
  ClipboardCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { Schedule } from "@/types";

type ScheduleWithDetails = Schedule & {
  groups: { id: string; name: string };
  projects: { id: string; name: string } | null;
  attendance: { status: string }[];
  member_count: number;
};

function ScheduleRow({ schedule }: { schedule: ScheduleWithDetails }) {
  const href = schedule.projects
    ? `/groups/${schedule.group_id}/projects/${schedule.projects.id}/attendance?schedule=${schedule.id}`
    : `/groups/${schedule.group_id}/attendance?schedule=${schedule.id}`;

  const now = new Date();
  const started = new Date(schedule.starts_at) <= now;
  const ended = new Date(schedule.ends_at) <= now;
  const hasAttendance = schedule.attendance_method !== "none";
  const presentCount = schedule.attendance.filter(
    (a) => a.status === "present" || a.status === "late" || a.status === "early_leave"
  ).length;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted transition-colors"
    >
      {/* 날짜 + 시간 */}
      <div className="text-xs text-muted-foreground w-32 shrink-0">
        <div>{format(new Date(schedule.starts_at), "M/d (EEE)", { locale: ko })}</div>
        <div>
          {format(new Date(schedule.starts_at), "HH:mm")}
          {" - "}
          {format(new Date(schedule.ends_at), "HH:mm")}
        </div>
      </div>

      {/* 제목 + 장소 */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{schedule.title}</div>
        {(schedule.location || schedule.address) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {schedule.location}
              {schedule.location && schedule.address && " · "}
              {schedule.address}
            </span>
          </div>
        )}
      </div>

      {/* 출석 현황 */}
      {hasAttendance && started && (
        <div className="flex items-center gap-1 text-xs shrink-0">
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className={ended ? "text-muted-foreground" : "font-medium"}>
            {presentCount}/{schedule.member_count}
          </span>
        </div>
      )}

      {/* 출석체크 가능 표시 */}
      {hasAttendance && !ended && (
        <Badge
          variant={started ? "default" : "outline"}
          className="text-xs shrink-0 gap-1"
        >
          <ClipboardCheck className="h-3 w-3" />
          {started ? "출석중" : "출석"}
        </Badge>
      )}

      {/* 그룹 + 프로젝트 */}
      <Badge variant="secondary" className="text-xs shrink-0">
        {schedule.groups.name}
      </Badge>
      {schedule.projects && (
        <Badge
          variant="outline"
          className="text-xs shrink-0 hidden sm:flex items-center gap-1"
        >
          <FolderOpen className="h-3 w-3" />
          {schedule.projects.name}
        </Badge>
      )}
    </Link>
  );
}

export default function AllSchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchSchedules = useCallback(async () => {
    const { data } = await supabase
      .from("schedules")
      .select(
        "*, groups(id, name), projects(id, name), attendance(status)"
      )
      .order("starts_at", { ascending: true });

    if (data) {
      // 그룹별 멤버 수 캐싱
      const memberCounts: Record<string, number> = {};
      const withCounts = await Promise.all(
        (data as (ScheduleWithDetails & { attendance: { status: string }[] })[]).map(
          async (s) => {
            const groupId = s.project_id
              ? `project:${s.project_id}`
              : `group:${s.group_id}`;
            if (!(groupId in memberCounts)) {
              if (s.project_id) {
                const { count } = await supabase
                  .from("project_members")
                  .select("*", { count: "exact", head: true })
                  .eq("project_id", s.project_id);
                memberCounts[groupId] = count ?? 0;
              } else {
                const { count } = await supabase
                  .from("group_members")
                  .select("*", { count: "exact", head: true })
                  .eq("group_id", s.group_id);
                memberCounts[groupId] = count ?? 0;
              }
            }
            return { ...s, member_count: memberCounts[groupId] };
          }
        )
      );
      setSchedules(withCounts);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const now = new Date();
  const upcoming = schedules.filter((s) => new Date(s.starts_at) >= now);
  const ongoing = schedules.filter(
    (s) => new Date(s.starts_at) < now && new Date(s.ends_at) >= now
  );
  const past = schedules
    .filter((s) => new Date(s.ends_at) < now)
    .sort(
      (a, b) =>
        new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
    );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-6">
        <h1 className="text-xl font-bold mb-4">전체 일정</h1>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : schedules.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">
            등록된 일정이 없습니다
          </p>
        ) : (
          <div className="space-y-4">
            {ongoing.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-primary mb-1 px-3">
                  진행 중 ({ongoing.length})
                </h2>
                <div className="divide-y border rounded-lg">
                  {ongoing.map((s) => (
                    <ScheduleRow key={s.id} schedule={s} />
                  ))}
                </div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-1 px-3">
                  다가오는 일정 ({upcoming.length})
                </h2>
                <div className="divide-y">
                  {upcoming.map((s) => (
                    <ScheduleRow key={s.id} schedule={s} />
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-1 px-3">
                  지난 일정 ({past.length})
                </h2>
                <div className="divide-y opacity-60">
                  {past.map((s) => (
                    <ScheduleRow key={s.id} schedule={s} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
