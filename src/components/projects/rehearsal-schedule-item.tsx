"use client";

import { memo, useState } from "react";
import {
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  MapPin,
  Users,
  StickyNote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type { RehearsalScheduleItem } from "@/types";
import { formatMonthDay } from "@/lib/date-utils";
import {
  TYPE_LABELS,
  TYPE_BADGE_CLASS,
  TYPE_DOT_CLASS,
  STATUS_LABELS,
  STATUS_BADGE_CLASS,
  daysUntil,
  calcChecklistProgress,
} from "./rehearsal-schedule-types";
import { ChecklistSection } from "./rehearsal-schedule-checklist";

// ============================================================
// 타입
// ============================================================

export type RehearsalItemProps = {
  rehearsal: RehearsalScheduleItem;
  onEdit: (rehearsal: RehearsalScheduleItem) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onToggleCheck: (rehearsalId: string, itemId: string) => void;
  onAddCheck: (rehearsalId: string, title: string) => void;
  onRemoveCheck: (rehearsalId: string, itemId: string) => void;
};

// ============================================================
// 리허설 아이템 (타임라인 행) - React.memo 적용
// ============================================================

export const RehearsalItem = memo(function RehearsalItem({
  rehearsal,
  onEdit,
  onDelete,
  onComplete,
  onCancel,
  onToggleCheck,
  onAddCheck,
  onRemoveCheck,
}: RehearsalItemProps) {
  const [expanded, setExpanded] = useState(false);

  const isScheduled = rehearsal.status === "scheduled";
  const isCancelled = rehearsal.status === "cancelled";
  const days = daysUntil(rehearsal.date);

  const checklistTotal = rehearsal.checklist.length;
  const checklistChecked = rehearsal.checklist.filter((i) => i.isChecked).length;
  const checklistProgress = calcChecklistProgress(checklistTotal, checklistChecked);

  return (
    <article
      className={`flex gap-3 py-3 border-b last:border-b-0 ${isCancelled ? "opacity-50" : ""}`}
      aria-label={`${rehearsal.title} 리허설`}
    >
      {/* 타임라인 점 & 선 */}
      <div
        className="flex flex-col items-center flex-shrink-0 pt-1"
        aria-hidden="true"
      >
        <div
          className={`h-2.5 w-2.5 rounded-full ${TYPE_DOT_CLASS[rehearsal.type]} ${
            isCancelled ? "opacity-40" : ""
          }`}
        />
        <div className="w-px flex-1 bg-gray-100 mt-1" />
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        {/* 날짜 + 시간 + D-day */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          <time
            dateTime={rehearsal.date}
            className="text-[10px] text-gray-500 font-mono"
          >
            {formatMonthDay(rehearsal.date)}
          </time>
          <span className="text-[10px] text-gray-400">
            {rehearsal.startTime}
            {rehearsal.endTime ? ` ~ ${rehearsal.endTime}` : ""}
          </span>
          {isScheduled && days >= 0 && (
            <span
              className={`text-[10px] font-semibold ${
                days === 0
                  ? "text-red-500"
                  : days <= 3
                  ? "text-orange-500"
                  : "text-gray-400"
              }`}
              aria-label={days === 0 ? "오늘" : `D-${days}일 후`}
            >
              {days === 0 ? "오늘" : `D-${days}`}
            </span>
          )}
        </div>

        {/* 유형 배지 + 제목 + 상태 배지 */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${TYPE_BADGE_CLASS[rehearsal.type]}`}
          >
            {TYPE_LABELS[rehearsal.type]}
          </Badge>
          <span
            className={`text-xs font-semibold truncate flex-1 ${
              isCancelled ? "line-through text-gray-400" : "text-gray-800"
            }`}
          >
            {rehearsal.title}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 shrink-0 ${STATUS_BADGE_CLASS[rehearsal.status]}`}
          >
            {STATUS_LABELS[rehearsal.status]}
          </Badge>
        </div>

        {/* 메타 정보 */}
        <dl className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400 mb-1">
          {rehearsal.location && (
            <div className="flex items-center gap-0.5">
              <dt className="sr-only">장소</dt>
              <MapPin className="h-3 w-3" aria-hidden="true" />
              <dd>{rehearsal.location}</dd>
            </div>
          )}
          {rehearsal.participants.length > 0 && (
            <div className="flex items-center gap-0.5">
              <dt className="sr-only">참여자</dt>
              <Users className="h-3 w-3" aria-hidden="true" />
              <dd>{rehearsal.participants.join(", ")}</dd>
            </div>
          )}
        </dl>

        {/* 메모 */}
        {rehearsal.notes && (
          <div className="flex items-start gap-1 mb-1">
            <StickyNote
              className="h-3 w-3 text-gray-300 mt-0.5 flex-shrink-0"
              aria-hidden="true"
            />
            <p className="text-[10px] text-gray-400 leading-tight line-clamp-2">
              {rehearsal.notes}
            </p>
          </div>
        )}

        {/* 체크리스트 진행률 미리보기 */}
        {checklistTotal > 0 && (
          <div className="flex items-center gap-1.5 mb-1" role="group" aria-label="체크리스트 진행률">
            <div
              className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={checklistProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`체크리스트 ${checklistProgress}% 완료`}
            >
              <div
                className="h-full bg-green-400 rounded-full transition-all"
                style={{ width: `${checklistProgress}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 shrink-0" aria-hidden="true">
              {checklistProgress}%
            </span>
          </div>
        )}

        {/* 펼치기/접기 + 액션 버튼 */}
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
            aria-expanded={expanded}
            aria-controls={`checklist-${rehearsal.id}`}
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            )}
            체크리스트
          </button>

          <div className="flex items-center gap-1 ml-auto" role="group" aria-label="리허설 액션">
            {isScheduled && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2 text-green-700 border-green-300 hover:bg-green-50"
                  onClick={() => onComplete(rehearsal.id)}
                  aria-label={`${rehearsal.title} 완료 처리`}
                >
                  <CheckCircle2 className="h-3 w-3 mr-0.5" aria-hidden="true" />
                  완료
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2 text-red-600 border-red-300 hover:bg-red-50"
                  onClick={() => onCancel(rehearsal.id)}
                  aria-label={`${rehearsal.title} 취소 처리`}
                >
                  <XCircle className="h-3 w-3 mr-0.5" aria-hidden="true" />
                  취소
                </Button>
              </>
            )}
            <button
              onClick={() => onEdit(rehearsal)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-300"
              aria-label={`${rehearsal.title} 수정`}
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
            </button>
            <button
              onClick={() => onDelete(rehearsal.id)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-red-300"
              aria-label={`${rehearsal.title} 삭제`}
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* 체크리스트 인라인 (펼쳐진 경우) */}
        {expanded && (
          <div id={`checklist-${rehearsal.id}`} aria-live="polite">
            <ChecklistSection
              rehearsal={rehearsal}
              onToggle={onToggleCheck}
              onAdd={onAddCheck}
              onRemove={onRemoveCheck}
            />
          </div>
        )}
      </div>
    </article>
  );
});
