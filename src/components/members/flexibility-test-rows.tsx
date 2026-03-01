"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import type { FlexibilityTestEntry } from "@/types";

// ============================================================
// ProgressBar
// ============================================================

export function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const color =
    clampedValue >= 80
      ? "bg-green-500"
      : clampedValue >= 50
      ? "bg-blue-500"
      : clampedValue >= 30
      ? "bg-yellow-500"
      : "bg-rose-400";

  return (
    <div className={`w-full h-1.5 rounded-full bg-muted overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

// ============================================================
// RecordRow
// ============================================================

export interface RecordRowProps {
  record: {
    id: string;
    date: string;
    entries: FlexibilityTestEntry[];
    notes?: string;
  };
  items: Array<{
    id: string;
    name: string;
    unit: string;
  }>;
  onDelete: () => void;
}

export const RecordRow = React.memo(function RecordRow({
  record,
  items,
  onDelete,
}: RecordRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border bg-background overflow-hidden">
      <div
        className="flex items-start justify-between px-3 py-2 gap-2 cursor-pointer"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold">{record.date}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {record.entries.length}개 측정
            </Badge>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            {record.entries.slice(0, 4).map((entry) => {
              const item = items.find((i) => i.id === entry.itemId);
              if (!item) return null;
              return (
                <span key={entry.itemId} className="text-[10px] text-muted-foreground">
                  {item.name.slice(0, 6)}:{" "}
                  <span className="font-medium text-foreground">
                    {entry.value}
                    {item.unit}
                  </span>
                </span>
              );
            })}
            {record.entries.length > 4 && (
              <span className="text-[10px] text-muted-foreground">
                +{record.entries.length - 4}개
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-3 py-2 space-y-1.5 bg-muted/20">
          {record.entries.map((entry) => {
            const item = items.find((i) => i.id === entry.itemId);
            if (!item) return null;
            return (
              <div key={entry.itemId} className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {item.name}
                </span>
                <span className="text-[11px] font-semibold">
                  {entry.value}
                  <span className="font-normal text-muted-foreground ml-0.5">
                    {item.unit}
                  </span>
                </span>
              </div>
            );
          })}
          {record.notes && (
            <div className="rounded-md bg-background border px-2.5 py-1.5 mt-2">
              <p className="text-[10px] text-muted-foreground font-medium mb-0.5">
                메모
              </p>
              <p className="text-xs text-muted-foreground">{record.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
