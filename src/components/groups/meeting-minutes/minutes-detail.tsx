"use client";

// ============================================
// 회의록 상세 보기 패널
// ============================================

import {
  Clock,
  MapPin,
  Users,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  CalendarIcon,
} from "lucide-react";
import { formatYearMonthDay } from "@/lib/date-utils";
import type { MeetingMinutesEntry } from "@/types";

type MinutesDetailProps = {
  entry: MeetingMinutesEntry;
};

export function MinutesDetail({ entry }: MinutesDetailProps) {
  return (
    <div className="space-y-2.5 pt-1">
      {/* 기본 정보 - 시간/장소/참석 요약 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Clock className="h-2.5 w-2.5" />
          {entry.startTime} ~ {entry.endTime}
        </span>
        {entry.location && (
          <span className="flex items-center gap-0.5">
            <MapPin className="h-2.5 w-2.5" />
            {entry.location}
          </span>
        )}
        <span className="flex items-center gap-0.5">
          <Users className="h-2.5 w-2.5" />
          참석 {entry.attendees.length}명
          {entry.absentees.length > 0 &&
            ` · 불참 ${entry.absentees.length}명`}
        </span>
        <span>기록: {entry.recorder}</span>
      </div>

      {/* 참석자 / 불참자 배지 목록 */}
      {entry.attendees.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.attendees.map((name) => (
            <span
              key={name}
              className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100"
            >
              {name}
            </span>
          ))}
          {entry.absentees.map((name) => (
            <span
              key={name}
              className="text-[9px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-100 line-through"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* 안건 목록 */}
      {entry.agendaItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
            <ClipboardList className="h-2.5 w-2.5" />
            안건 ({entry.agendaItems.length}건)
          </p>
          <ul role="list" className="space-y-2">
            {entry.agendaItems.map((agenda, idx) => (
              <li
                key={agenda.id}
                role="listitem"
                className="bg-muted/30 rounded-md px-2.5 py-2 space-y-1.5"
              >
                {/* 안건 제목 */}
                <p className="text-xs font-semibold">
                  {idx + 1}. {agenda.title}
                </p>

                {/* 논의 내용 */}
                {agenda.discussion && (
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {agenda.discussion}
                  </p>
                )}

                {/* 결정사항 - 강조 표시 */}
                {agenda.decision && (
                  <div className="flex items-start gap-1.5 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1.5">
                    <CheckCircle2 className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wide block mb-0.5">
                        결정사항
                      </span>
                      <p className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                        {agenda.decision}
                      </p>
                    </div>
                  </div>
                )}

                {/* 실행과제 목록 */}
                {agenda.actionItems.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[9px] font-semibold text-muted-foreground flex items-center gap-0.5">
                      <AlertCircle className="h-2.5 w-2.5" />
                      실행과제
                    </p>
                    {agenda.actionItems.map((ai, aiIdx) => (
                      <div
                        key={aiIdx}
                        className="flex items-center gap-1.5 bg-background/60 rounded px-2 py-1"
                      >
                        <span className="text-[9px] font-semibold text-blue-600 shrink-0 w-14 truncate">
                          {ai.assignee || "담당자"}
                        </span>
                        <span className="text-[10px] flex-1">{ai.task}</span>
                        {ai.deadline && (
                          <span className="text-[9px] text-muted-foreground shrink-0">
                            ~{formatYearMonthDay(ai.deadline)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 비고 */}
      {entry.generalNotes && (
        <div className="bg-muted/20 rounded-md px-2.5 py-1.5">
          <p className="text-[9px] font-semibold text-muted-foreground mb-0.5">
            비고
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {entry.generalNotes}
          </p>
        </div>
      )}

      {/* 다음 회의 날짜 */}
      {entry.nextMeetingDate && (
        <div className="flex items-center gap-1 text-[10px] text-green-700">
          <CalendarIcon className="h-2.5 w-2.5" />
          <span>
            다음 회의:{" "}
            <span className="font-semibold">
              {formatYearMonthDay(entry.nextMeetingDate)}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
