"use client";

// ============================================================
// 무대 평면도 - 캔버스 아이템 컴포넌트 (React.memo 적용)
// ============================================================

import { memo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { StageLayoutItem } from "@/types";
import {
  ITEM_TYPE_COLORS,
  ITEM_TYPE_BADGE_COLORS,
  ITEM_TYPE_ICONS,
  ITEM_TYPE_LABELS,
  DEFAULT_ITEM_SIZE,
} from "./stage-layout-types";

interface StageItemProps {
  item: StageLayoutItem;
  isActive: boolean;
  onActivate: (id: string) => void;
  onEdit: (item: StageLayoutItem) => void;
  onDelete: (id: string) => void;
}

export const StageItem = memo(function StageItem({
  item,
  isActive,
  onActivate,
  onEdit,
  onDelete,
}: StageItemProps) {
  const w = item.width ?? DEFAULT_ITEM_SIZE;
  const h = item.height ?? DEFAULT_ITEM_SIZE;
  const rotation = item.rotation ?? 0;

  const typeLabel = ITEM_TYPE_LABELS[item.type];
  const ariaLabel = `${typeLabel} ${item.label} - X ${item.x.toFixed(0)}%, Y ${item.y.toFixed(0)}% 위치`;

  return (
    <Popover open={isActive} onOpenChange={(open) => !open && onActivate("")}>
      <PopoverTrigger asChild>
        {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
        <div
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-pressed={isActive}
          className={`absolute flex flex-col items-center justify-center rounded border cursor-pointer transition-all hover:opacity-90 hover:scale-105 shadow-sm ${
            ITEM_TYPE_COLORS[item.type]
          } ${isActive ? "ring-2 ring-white ring-offset-1 scale-110 z-20" : "z-10"}`}
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: `${w}%`,
            height: `${h * (16 / 9)}%`,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onActivate(item.id);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onActivate(item.id);
            }
          }}
          title={item.label}
        >
          <div className="flex flex-col items-center gap-0.5 px-0.5" aria-hidden="true">
            <span className="[&>svg]:h-2.5 [&>svg]:w-2.5">
              {ITEM_TYPE_ICONS[item.type]}
            </span>
            <span
              className="text-[8px] leading-tight text-center font-medium truncate max-w-full"
              style={{ fontSize: "clamp(6px, 0.7vw, 9px)" }}
            >
              {item.label}
            </span>
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-52 p-2"
        side="top"
        aria-label={`${item.label} 상세 정보 및 편집`}
      >
        <div className="space-y-2">
          {/* 헤더 */}
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                ITEM_TYPE_BADGE_COLORS[item.type]
              }`}
              aria-label={typeLabel}
            >
              {ITEM_TYPE_ICONS[item.type]}
              {typeLabel}
            </span>
            <span className="text-xs font-semibold">{item.label}</span>
          </div>

          {/* 정보 */}
          <dl className="text-[10px] text-muted-foreground space-y-0.5">
            <div>
              <dt className="sr-only">위치</dt>
              <dd>
                위치: X {item.x.toFixed(1)}% / Y {item.y.toFixed(1)}%
              </dd>
            </div>
            {rotation !== 0 && (
              <div>
                <dt className="sr-only">회전</dt>
                <dd>회전: {rotation}°</dd>
              </div>
            )}
            {item.notes && (
              <div>
                <dt className="sr-only">메모</dt>
                <dd className="text-foreground bg-muted rounded px-1.5 py-1">
                  {item.notes}
                </dd>
              </div>
            )}
          </dl>

          {/* 버튼 */}
          <div className="flex gap-1" role="group" aria-label="아이템 편집 옵션">
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] flex-1"
              onClick={() => onEdit(item)}
              aria-label={`${item.label} 편집`}
            >
              <Pencil className="h-2.5 w-2.5 mr-1" aria-hidden="true" />
              편집
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] text-destructive hover:text-destructive flex-1"
              onClick={() => onDelete(item.id)}
              aria-label={`${item.label} 삭제`}
            >
              <Trash2 className="h-2.5 w-2.5 mr-1" aria-hidden="true" />
              삭제
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
