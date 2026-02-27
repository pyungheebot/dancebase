"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, LogOut } from "lucide-react";
import type { AttendanceStatus, GroupMemberWithProfile, MemberCategory } from "@/types";
import { getCategoryColorClasses } from "@/types";

type AttendanceStatsProps = {
  attendance: { user_id: string; status: AttendanceStatus }[];
  totalMembers: number;
  members?: GroupMemberWithProfile[];
  categories?: MemberCategory[];
  categoryColorMap?: Record<string, string>;
};

export function AttendanceStats({
  attendance,
  totalMembers,
  members,
  categories,
  categoryColorMap,
}: AttendanceStatsProps) {
  const present = attendance.filter((a) => a.status === "present").length;
  const late = attendance.filter((a) => a.status === "late").length;
  const earlyLeave = attendance.filter((a) => a.status === "early_leave").length;
  const absent = totalMembers - present - late - earlyLeave;
  const rate = totalMembers > 0 ? Math.round(((present + late + earlyLeave) / totalMembers) * 100) : 0;

  const showCategoryStats = members && categories && categories.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs border rounded px-3 py-2 flex-wrap">
        <span className="text-muted-foreground">출석률</span>
        <span className="text-sm font-semibold tabular-nums">{rate}%</span>
        <span className="flex items-center gap-1 text-muted-foreground ml-auto">
          <CheckCircle className="h-3 w-3 text-green-500" />
          출석
        </span>
        <span className="font-medium tabular-nums">{present}</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3 text-yellow-500" />
          지각
        </span>
        <span className="font-medium tabular-nums">{late}</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <LogOut className="h-3 w-3 text-orange-500" />
          조퇴
        </span>
        <span className="font-medium tabular-nums">{earlyLeave}</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <XCircle className="h-3 w-3 text-red-500" />
          결석
        </span>
        <span className="font-medium tabular-nums">{absent}</span>
      </div>

      {showCategoryStats && (
        <div className="rounded border p-2.5 space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground mb-1.5">카테고리별 출석률</p>
          {categories.map((cat) => {
            const catMembers = members.filter((m) => m.category_id === cat.id);
            if (catMembers.length === 0) return null;
            const catUserIds = new Set(catMembers.map((m) => m.user_id));
            const catAttendance = attendance.filter((a) => catUserIds.has(a.user_id));
            const catPresent = catAttendance.filter((a) => a.status === "present").length;
            const catLate = catAttendance.filter((a) => a.status === "late").length;
            const catEarlyLeave = catAttendance.filter((a) => a.status === "early_leave").length;
            const catAbsent = catMembers.length - catPresent - catLate - catEarlyLeave;
            const catRate = catMembers.length > 0
              ? Math.round(((catPresent + catLate + catEarlyLeave) / catMembers.length) * 100)
              : 0;
            const cc = getCategoryColorClasses(categoryColorMap?.[catMembers[0]?.user_id] || cat.color || "gray");

            return (
              <div key={cat.id} className="flex items-center gap-3 text-xs">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 shrink-0 ${cc.bg} ${cc.text} ${cc.border}`}
                >
                  {cat.name}
                </Badge>
                <span className="font-medium w-10 text-right tabular-nums">{catRate}%</span>
                <span className="text-muted-foreground text-[11px]">
                  출석{catPresent} 지각{catLate} 조퇴{catEarlyLeave} 결석{catAbsent}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
