import { createClient } from "@/lib/supabase/server";
import { schedulesToIcs } from "@/lib/ics";
import type { Schedule } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;

  if (!groupId) {
    return new Response("그룹 ID가 필요합니다.", { status: 400 });
  }

  const supabase = await createClient();

  // 그룹 존재 여부 확인
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, name")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return new Response("그룹을 찾을 수 없습니다.", { status: 404 });
  }

  // 해당 그룹의 일정 조회 (미래 + 과거 1년 이내)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const { data: schedules, error: schedulesError } = await supabase
    .from("schedules")
    .select(
      "id, group_id, project_id, title, description, location, address, latitude, longitude, attendance_method, starts_at, ends_at, created_by, late_threshold, attendance_deadline, require_checkout, recurrence_id, max_attendees"
    )
    .eq("group_id", groupId)
    .gte("starts_at", oneYearAgo.toISOString())
    .order("starts_at", { ascending: true });

  if (schedulesError) {
    return new Response("일정 조회 중 오류가 발생했습니다.", { status: 500 });
  }

  const icsContent = schedulesToIcs((schedules ?? []) as Schedule[]);
  const filename = `dancebase-${groupId}.ics`;

  return new Response(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
