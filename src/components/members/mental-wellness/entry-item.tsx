"use client";

import { memo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatYearMonthDay } from "@/lib/date-utils";
import type { MentalWellnessEntry } from "@/types";
import { MOOD_CONFIG, SLIDER_CONFIG } from "./types";

type EntryItemProps = {
  entry: MentalWellnessEntry;
  onEdit: (entry: MentalWellnessEntry) => void;
  onDelete: (id: string) => void;
};

export const EntryItem = memo(function EntryItem({
  entry,
  onEdit,
  onDelete,
}: EntryItemProps) {
  const moodCfg = MOOD_CONFIG[entry.overallMood];
  const formattedDate = formatYearMonthDay(entry.date);

  return (
    <article
      className="rounded-lg border p-2.5 bg-card space-y-1.5"
      aria-label={`${formattedDate} 심리 상태 기록`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <time
            dateTime={entry.date}
            className="text-xs font-medium text-gray-800"
          >
            {formattedDate}
          </time>
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0 border",
              moodCfg.bg,
              moodCfg.color,
              moodCfg.border
            )}
          >
            <span aria-hidden="true">{moodCfg.emoji}</span>{" "}
            {moodCfg.label}
          </Badge>
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="기록 관리">
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0"
            onClick={() => onEdit(entry)}
            aria-label={`${formattedDate} 기록 수정`}
          >
            <Pencil className="h-2.5 w-2.5 text-muted-foreground" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(entry.id)}
            aria-label={`${formattedDate} 기록 삭제`}
          >
            <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 수치 배지 */}
      <dl className="flex flex-wrap gap-1">
        {SLIDER_CONFIG.map((cfg) => (
          <div key={cfg.key}>
            <dt className="sr-only">{cfg.label}</dt>
            <dd>
              <Badge className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-700 border-slate-200">
                {cfg.label}{" "}
                <span aria-label={`${entry[cfg.key]}점`}>{entry[cfg.key]}</span>
              </Badge>
            </dd>
          </div>
        ))}
      </dl>

      {/* 대처 전략 */}
      {entry.copingStrategies && entry.copingStrategies.length > 0 && (
        <ul className="flex flex-wrap gap-1" aria-label="대처 전략" role="list">
          {entry.copingStrategies.map((s) => (
            <li key={s} role="listitem">
              <Badge className="text-[10px] px-1.5 py-0 bg-violet-50 text-violet-600 border-violet-100">
                {s}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {/* 일기 메모 */}
      {entry.journalNote && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {entry.journalNote}
        </p>
      )}
    </article>
  );
});
