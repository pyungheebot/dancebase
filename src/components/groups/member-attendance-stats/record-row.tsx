"use client";

import React from "react";
import { X, CheckCircle2, Clock, LogOut, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  MemberAttendStatRecord,
  MemberAttendStatStatus,
} from "@/types";
import { STATUS_BADGE_CLASS, STATUS_LABEL } from "./types";

const STATUS_ICON_NODE: Record<MemberAttendStatStatus, React.ReactNode> = {
  present: <CheckCircle2 className="h-3 w-3" aria-hidden="true" />,
  late: <Clock className="h-3 w-3" aria-hidden="true" />,
  early_leave: <LogOut className="h-3 w-3" aria-hidden="true" />,
  absent: <XCircle className="h-3 w-3" aria-hidden="true" />,
};

export interface RecordRowProps {
  record: MemberAttendStatRecord;
  onDelete: (id: string) => boolean;
}

export const RecordRow = React.memo(function RecordRow({
  record,
  onDelete,
}: RecordRowProps) {
  return (
    <div
      className="flex items-center justify-between rounded-lg bg-gray-50 px-2.5 py-1.5 gap-2"
      role="listitem"
    >
      <div className="flex items-center gap-2 min-w-0">
        <time
          dateTime={record.date}
          className="text-[10px] text-gray-400 shrink-0"
        >
          {record.date}
        </time>
        <span className="text-[11px] font-semibold text-gray-700 truncate">
          {record.memberName}
        </span>
        {record.notes && (
          <span
            className="text-[10px] text-gray-400 italic truncate max-w-[80px]"
            title={record.notes}
          >
            {record.notes}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Badge
          className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${STATUS_BADGE_CLASS[record.status]}`}
        >
          {STATUS_ICON_NODE[record.status]}
          {STATUS_LABEL[record.status]}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-gray-300 hover:text-red-400"
          onClick={() => onDelete(record.id)}
          aria-label={`${record.date} ${record.memberName} 출석 기록 삭제`}
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
});
