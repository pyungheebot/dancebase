"use client";

// ============================================================
// 동선 노트 카드 행 - 접을 수 있는 단일 노트 카드
// ============================================================

import { memo, useState } from "react";
import {
  ChevronRight,
  AlertTriangle,
  Timer,
  Hash,
  MapPin,
  AlignLeft,
  Pencil,
  Trash2,
  MoreVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MemberMoveRow } from "./stage-blocking-member-move-row";
import { getMemberColor } from "./stage-blocking-types";
import type { StageBlockingNote } from "@/types";

type BlockingNoteRowProps = {
  note: StageBlockingNote;
  allMemberNames: string[];
  isFirst: boolean;
  isLast: boolean;
  onEdit: (note: StageBlockingNote) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
};

/**
 * 동선 노트 한 건을 접을 수 있는 카드 행으로 표시합니다.
 * - 헤더: 순서번호, 곡/장면, 시간/카운트, 포메이션, 주의사항 유무, 멤버 수
 * - 상세(열었을 때): 멤버별 동선, 주의사항, 추가 메모
 * React.memo 적용으로 다른 행 상태 변경 시 불필요한 리렌더링을 방지합니다.
 */
export const BlockingNoteRow = memo(function BlockingNoteRow({
  note,
  allMemberNames,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: BlockingNoteRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className="rounded-lg border bg-card hover:bg-muted/10 transition-colors"
        role="listitem"
        aria-label={`동선: ${note.songTitle}${note.sceneNumber ? ` (${note.sceneNumber})` : ""}`}
      >
        {/* ── 헤더 행 ── */}
        <CollapsibleTrigger asChild>
          <div
            className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
            aria-expanded={open}
            aria-controls={`blocking-detail-${note.id}`}
          >
            {/* 펼침/접기 아이콘 */}
            <ChevronRight
              className={`h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0 ${
                open ? "rotate-90" : ""
              }`}
              aria-hidden="true"
            />

            {/* 순서 번호 */}
            <span
              className="text-[10px] font-bold text-muted-foreground w-4 text-center shrink-0"
              aria-label={`순서 ${note.order}`}
            >
              {note.order}
            </span>

            {/* 곡/장면 정보 */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
              <span className="text-sm font-medium truncate">{note.songTitle}</span>

              {note.sceneNumber && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0">
                  {note.sceneNumber}
                </Badge>
              )}

              {/* 시간 구간 */}
              {(note.timeStart || note.timeEnd) && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Timer className="h-2.5 w-2.5" aria-hidden="true" />
                  <span aria-label="시간 구간">
                    {note.timeStart ?? "?"}{note.timeEnd ? ` ~ ${note.timeEnd}` : ""}
                  </span>
                </span>
              )}

              {/* 카운트 구간 */}
              {(note.countStart !== undefined || note.countEnd !== undefined) && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Hash className="h-2.5 w-2.5" aria-hidden="true" />
                  <span aria-label="카운트 구간">
                    {note.countStart ?? "?"} ~ {note.countEnd ?? "?"}
                  </span>
                </span>
              )}

              {/* 포메이션 */}
              {note.formation && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 rounded px-1 py-0">
                  <MapPin className="h-2 w-2" aria-hidden="true" />
                  {note.formation}
                </span>
              )}

              {/* 주의사항 존재 표시 */}
              {note.caution && (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] text-yellow-600"
                  aria-label="주의사항 있음"
                >
                  <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
                  주의
                </span>
              )}
            </div>

            {/* 멤버 수 */}
            {note.memberMoves.length > 0 && (
              <span
                className="text-[10px] text-muted-foreground shrink-0"
                aria-label={`${note.memberMoves.length}명 동선`}
              >
                {note.memberMoves.length}명
              </span>
            )}

            {/* 드롭다운 액션 메뉴 */}
            <div
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    aria-label="동선 노트 메뉴"
                  >
                    <MoreVertical className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs">
                  <DropdownMenuItem
                    className="text-xs gap-1.5"
                    onClick={() => onEdit(note)}
                  >
                    <Pencil className="h-3 w-3" aria-hidden="true" />
                    수정
                  </DropdownMenuItem>
                  {!isFirst && (
                    <DropdownMenuItem
                      className="text-xs gap-1.5"
                      onClick={() => onMoveUp(note.id)}
                    >
                      <ArrowUp className="h-3 w-3" aria-hidden="true" />
                      위로 이동
                    </DropdownMenuItem>
                  )}
                  {!isLast && (
                    <DropdownMenuItem
                      className="text-xs gap-1.5"
                      onClick={() => onMoveDown(note.id)}
                    >
                      <ArrowDown className="h-3 w-3" aria-hidden="true" />
                      아래로 이동
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-xs gap-1.5 text-red-600 focus:text-red-600"
                    onClick={() => onDelete(note.id)}
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* ── 상세 내용 (열었을 때) ── */}
        <CollapsibleContent id={`blocking-detail-${note.id}`}>
          <div className="px-4 pb-3 space-y-3 border-t bg-muted/5">
            {/* 멤버별 동선 목록 */}
            {note.memberMoves.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  멤버 동선
                </span>
                <div
                  className="space-y-1"
                  role="list"
                  aria-label="멤버별 동선 목록"
                >
                  {note.memberMoves.map((move, idx) => (
                    <MemberMoveRow
                      key={idx}
                      move={move}
                      memberColor={getMemberColor(move.memberName, allMemberNames)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 주의사항 */}
            {note.caution && (
              <div
                className="flex items-start gap-1.5 rounded-md bg-yellow-50 border border-yellow-200 px-2.5 py-2"
                role="alert"
                aria-label="주의사항"
              >
                <AlertTriangle
                  className="h-3 w-3 text-yellow-600 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-[11px] text-yellow-700">{note.caution}</span>
              </div>
            )}

            {/* 추가 메모 */}
            {note.memo && (
              <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <AlignLeft className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
                <span className="whitespace-pre-wrap">{note.memo}</span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});
