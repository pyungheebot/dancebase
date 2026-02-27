"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Schedule } from "@/types";

type ScheduleConflictWarningProps = {
  conflicts: Schedule[];
};

/**
 * 일정 충돌 경고 인라인 컴포넌트
 * conflicts 배열이 비어있으면 렌더링하지 않음
 */
export function ScheduleConflictWarning({ conflicts }: ScheduleConflictWarningProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="rounded-md bg-yellow-50 border border-yellow-200 p-2 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-yellow-600" />
        <p className="text-xs font-medium text-yellow-800">
          시간이 겹치는 일정이 있습니다
        </p>
      </div>
      <ul className="space-y-1 pl-5">
        {conflicts.map((s) => (
          <li key={s.id} className="flex items-center gap-1 text-[11px] text-yellow-700 list-disc">
            <span className="font-medium">{s.title}</span>
            <span className="text-yellow-600 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {format(new Date(s.starts_at), "M/d HH:mm")}
              {" ~ "}
              {format(new Date(s.ends_at), "HH:mm")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
