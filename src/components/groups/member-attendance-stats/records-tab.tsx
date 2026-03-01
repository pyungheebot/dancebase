"use client";

import { Users } from "lucide-react";
import type { MemberAttendStatRecord } from "@/types";
import { RecordRow } from "./record-row";

export interface RecordsTabProps {
  records: MemberAttendStatRecord[];
  recentRecords: MemberAttendStatRecord[];
  onDelete: (id: string) => boolean;
}

export function RecordsTab({
  records,
  recentRecords,
  onDelete,
}: RecordsTabProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <Users className="h-3 w-3 text-gray-400" aria-hidden="true" />
        <span
          className="text-[11px] font-semibold text-gray-600"
          id="records-heading"
        >
          최근 출석 기록
        </span>
        {records.length > 30 && (
          <span className="text-[10px] text-gray-400">(최근 30건)</span>
        )}
      </div>
      {recentRecords.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-8 text-gray-400"
          role="status"
          aria-live="polite"
        >
          <Users className="h-8 w-8 mb-2 opacity-30" aria-hidden="true" />
          <p className="text-xs">기록 추가 버튼으로 출석을 기록하세요.</p>
        </div>
      ) : (
        <div
          className="space-y-1"
          role="list"
          aria-labelledby="records-heading"
          aria-live="polite"
        >
          {recentRecords.map((record) => (
            <RecordRow key={record.id} record={record} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
