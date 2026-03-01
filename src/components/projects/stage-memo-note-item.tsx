"use client";

// ============================================================
// 무대 메모 카드 — 메모 아이템 (React.memo)
// ============================================================

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import type { StageMemoNote } from "@/types";
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_DOT_COLORS,
  PRIORITY_NOTE_BG,
} from "./stage-memo-types";

interface NoteItemProps {
  note: StageMemoNote;
  onToggleResolved: () => void;
  onDelete: () => void;
}

export const NoteItem = memo(function NoteItem({
  note,
  onToggleResolved,
  onDelete,
}: NoteItemProps) {
  const resolvedLabel = note.isResolved ? "미해결로 변경" : "해결됨으로 표시";

  return (
    <article
      className={[
        "rounded-lg border px-3 py-2 space-y-1.5 transition-colors",
        note.isResolved
          ? "bg-muted/30 border-border/30 opacity-60"
          : PRIORITY_NOTE_BG[note.priority],
      ].join(" ")}
      aria-label={`메모: ${note.content}${note.isResolved ? " (해결됨)" : ""}`}
    >
      <div className="flex items-start gap-2">
        {/* 해결 토글 버튼 */}
        <button
          type="button"
          onClick={onToggleResolved}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={resolvedLabel}
          aria-pressed={note.isResolved}
        >
          {note.isResolved ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
          ) : (
            <Circle className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>

        {/* 내용 */}
        <p
          className={[
            "text-xs flex-1 leading-relaxed",
            note.isResolved ? "line-through text-muted-foreground" : "",
          ].join(" ")}
        >
          {note.content}
        </p>

        {/* 삭제 버튼 */}
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
          aria-label="메모 삭제"
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>

      {/* 메타 정보 */}
      <div
        className="flex flex-wrap items-center gap-1 pl-5"
        aria-label="메모 정보"
      >
        <Badge
          className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLORS[note.priority]}`}
          aria-label={`우선순위: ${PRIORITY_LABELS[note.priority]}`}
        >
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${PRIORITY_DOT_COLORS[note.priority]}`}
            aria-hidden="true"
          />
          {PRIORITY_LABELS[note.priority]}
        </Badge>

        {note.author && (
          <span className="text-[10px] text-muted-foreground" aria-label={`작성자: ${note.author}`}>
            {note.author}
          </span>
        )}

        {note.tags.length > 0 && (
          <span className="sr-only">태그: {note.tags.join(", ")}</span>
        )}
        {note.tags.map((tag, i) => (
          <span
            key={i}
            className="text-[9px] px-1 py-0 rounded bg-muted/50 text-muted-foreground"
            aria-hidden="true"
          >
            #{tag}
          </span>
        ))}
      </div>
    </article>
  );
});
