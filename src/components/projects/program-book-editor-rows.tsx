"use client";

import { memo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Users,
  Music2,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type { ProgramBookItem, ProgramBookCast } from "@/types";
import { itemTypeLabel, itemTypeBadgeClass } from "./program-book-editor-dialogs";

// ============================================================
// 프로그램 아이템 행
// ============================================================

export interface ItemRowProps {
  item: ProgramBookItem;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ItemRow = memo(function ItemRow({
  item,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: ItemRowProps) {
  return (
    <div className="flex items-start gap-2 py-2.5 border-b last:border-b-0">
      {/* 순서 번호 */}
      <span className="text-[10px] text-muted-foreground w-5 text-center flex-shrink-0 pt-0.5 font-mono">
        {item.order}
      </span>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span
            className={`inline-flex items-center text-[10px] px-1.5 py-0 rounded-full border ${itemTypeBadgeClass(item.type)}`}
          >
            {itemTypeLabel(item.type)}
          </span>
          <span className="text-xs font-semibold truncate">{item.title}</span>
        </div>

        {/* 출연진 */}
        {item.performers.length > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Users className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate">
              {item.performers.join(", ")}
            </span>
          </div>
        )}

        {/* 음악 & 소요 시간 */}
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {item.musicTitle && (
            <div className="flex items-center gap-1">
              <Music2 className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
              <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                {item.musicTitle}
              </span>
            </div>
          )}
          {item.duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                {item.duration}
              </span>
            </div>
          )}
        </div>

        {/* 설명 */}
        {item.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          onClick={onMoveUp}
          disabled={isFirst}
          title="위로"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          onClick={onMoveDown}
          disabled={isLast}
          title="아래로"
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600"
          onClick={onEdit}
          title="편집"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          title="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
});

// ============================================================
// 출연진 행
// ============================================================

export interface CastRowProps {
  cast: ProgramBookCast;
  onEdit: () => void;
  onDelete: () => void;
}

export const CastRow = memo(function CastRow({
  cast,
  onEdit,
  onDelete,
}: CastRowProps) {
  return (
    <div className="flex items-start gap-2 py-2.5 border-b last:border-b-0">
      {/* 아바타 자리 */}
      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-semibold">{cast.name}</span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 text-pink-600 border-pink-200 dark:text-pink-400 dark:border-pink-800"
          >
            {cast.role}
          </Badge>
        </div>
        {cast.bio && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {cast.bio}
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600"
          onClick={onEdit}
          title="편집"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          title="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
});
