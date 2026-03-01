"use client";

import { memo } from "react";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import type { MediaPressKitOutlet } from "@/types";
import { OUTLET_TYPE_CONFIG } from "./types";

interface OutletTagProps {
  outlet: MediaPressKitOutlet;
  onToggle: () => void;
  onDelete: () => void;
}

export const OutletTag = memo(function OutletTag({
  outlet,
  onToggle,
  onDelete,
}: OutletTagProps) {
  const typeConf = OUTLET_TYPE_CONFIG[outlet.type];
  return (
    <div
      className="flex items-center gap-1 rounded-md border bg-card px-2 py-1"
      role="listitem"
    >
      <button
        onClick={onToggle}
        className="shrink-0"
        aria-label={outlet.published ? "게재 취소" : "게재 완료 표시"}
        aria-pressed={outlet.published}
      >
        {outlet.published ? (
          <CheckCircle2 className="h-3 w-3 text-green-500" aria-hidden="true" />
        ) : (
          <Circle className="h-3 w-3 text-gray-300" aria-hidden="true" />
        )}
      </button>
      <span
        className={`text-[10px] px-1 py-0 rounded border ${typeConf.color}`}
        aria-label={`유형: ${typeConf.label}`}
      >
        {typeConf.label}
      </span>
      <span className="text-xs text-gray-700 truncate max-w-[80px]">
        {outlet.name}
      </span>
      <button
        onClick={onDelete}
        className="ml-0.5 text-gray-300 hover:text-red-400 transition-colors"
        aria-label={`${outlet.name} 매체 삭제`}
      >
        <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
      </button>
    </div>
  );
});
