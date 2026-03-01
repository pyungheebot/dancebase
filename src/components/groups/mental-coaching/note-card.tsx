"use client";

import { memo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { MentalCoachingNote, MentalCoachingStatus } from "@/types";
import {
  TOPIC_BADGE,
  STATUS_BADGE,
  STATUS_LABEL,
  ENERGY_EMOJI,
  ENERGY_LABEL,
} from "./types";

// ============================================================
// 개별 노트 카드
// ============================================================

export type NoteCardProps = {
  note: MentalCoachingNote;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAction: (actionId: string) => void;
  onStatusChange: (status: MentalCoachingStatus) => void;
};

export const NoteCard = memo(function NoteCard({
  note,
  onEdit,
  onDelete,
  onToggleAction,
  onStatusChange,
}: NoteCardProps) {
  const [expanded, setExpanded] = useState(false);

  const doneCount = note.actionItems.filter((a) => a.done).length;
  const totalCount = note.actionItems.length;

  const statusCycle: Record<MentalCoachingStatus, MentalCoachingStatus> = {
    진행중: "개선됨",
    개선됨: "해결됨",
    해결됨: "진행중",
  };

  return (
    <article
      className="rounded-lg border bg-card p-3 space-y-2"
      aria-label={`${note.memberName} 코칭 노트`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          <span className="text-xs font-medium truncate max-w-[100px]">
            {note.memberName}
          </span>
          <span className="text-[10px] text-muted-foreground" aria-hidden="true">
            /
          </span>
          <span className="text-[10px] text-muted-foreground truncate">
            {note.coachName}
          </span>
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0",
              TOPIC_BADGE[note.topic]
            )}
            aria-label={`주제: ${note.topic}`}
          >
            {note.topic}
          </Badge>
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0 cursor-pointer",
              STATUS_BADGE[note.status]
            )}
            onClick={() => onStatusChange(statusCycle[note.status])}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onStatusChange(statusCycle[note.status]);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`상태: ${STATUS_LABEL[note.status]} (클릭하여 변경)`}
            aria-pressed={false}
          >
            {STATUS_LABEL[note.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600"
            onClick={onEdit}
            aria-label={`${note.memberName} 코칭 노트 수정`}
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
            onClick={onDelete}
            aria-label={`${note.memberName} 코칭 노트 삭제`}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 날짜 + 에너지 */}
      <dl className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <div className="flex gap-1">
          <dt className="sr-only">날짜</dt>
          <dd>
            <time dateTime={note.date}>{note.date}</time>
          </dd>
        </div>
        <div className="flex gap-1">
          <dt className="sr-only">에너지 레벨</dt>
          <dd aria-label={`에너지: ${ENERGY_LABEL[note.energyLevel]}`}>
            <span aria-hidden="true">{ENERGY_EMOJI[note.energyLevel]}</span>{" "}
            {ENERGY_LABEL[note.energyLevel]}
          </dd>
        </div>
        {totalCount > 0 && (
          <div className="flex gap-1">
            <dt className="sr-only">액션 아이템 완료</dt>
            <dd className="text-blue-600" aria-label={`액션 아이템 ${doneCount}/${totalCount} 완료`}>
              액션 {doneCount}/{totalCount}
            </dd>
          </div>
        )}
      </dl>

      {/* 내용 */}
      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
        {note.content}
      </p>

      {/* 액션 아이템 */}
      {totalCount > 0 && (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800"
              aria-expanded={expanded}
              aria-controls={`action-list-${note.id}`}
            >
              <CheckSquare className="h-3 w-3" aria-hidden="true" />
              액션 아이템 {expanded ? "접기" : "펼치기"}
              {expanded ? (
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul
              id={`action-list-${note.id}`}
              className="mt-1.5 space-y-1"
              role="list"
              aria-label="액션 아이템 목록"
            >
              {note.actionItems.map((a) => (
                <li
                  key={a.id}
                  role="listitem"
                  className="flex items-center gap-1.5 cursor-pointer group"
                  onClick={() => onToggleAction(a.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onToggleAction(a.id);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`${a.text} - ${a.done ? "완료" : "미완료"}. 클릭하여 전환`}
                >
                  {a.done ? (
                    <CheckSquare className="h-3 w-3 text-green-500 shrink-0" aria-hidden="true" />
                  ) : (
                    <Square className="h-3 w-3 text-gray-400 shrink-0" aria-hidden="true" />
                  )}
                  <span
                    className={cn(
                      "text-[11px] flex-1",
                      a.done
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    )}
                  >
                    {a.text}
                  </span>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
    </article>
  );
});
