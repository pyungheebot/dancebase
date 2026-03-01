"use client";

import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { CostumeDesignEntry, CostumeDesignStatus } from "@/types";
import { ColorChip } from "./color-chip";
import { StatusBadge } from "./status-badge";
import { DesignDetail } from "./design-detail";

// ============================================================
// 디자인 그리드 카드 아이템
// ============================================================

interface DesignGridItemProps {
  design: CostumeDesignEntry;
  memberNames: string[];
  currentUser: string;
  onChangeStatus: (id: string, status: CostumeDesignStatus) => void;
  onToggleVote: (id: string, memberName: string) => void;
  onDelete: (id: string) => void;
  onAddComment: (designId: string, author: string, text: string) => void;
  onDeleteComment: (designId: string, commentId: string) => void;
}

export const DesignGridItem = memo(function DesignGridItem({
  design,
  memberNames,
  currentUser,
  onChangeStatus,
  onToggleVote,
  onDelete,
  onAddComment,
  onDeleteComment,
}: DesignGridItemProps) {
  const [expanded, setExpanded] = useState(false);
  const hasVoted = design.votes.includes(currentUser);

  return (
    <article
      className="border border-border/50 rounded-lg overflow-hidden bg-background"
      aria-label={`디자인: ${design.title}`}
    >
      {/* 카드 헤더 영역 */}
      <div className="p-2.5 space-y-2">
        {/* 제목 행 */}
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate leading-tight">
              {design.title}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {design.designedBy}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-destructive hover:text-destructive shrink-0"
            onClick={() => {
              onDelete(design.id);
              toast.success(TOAST.COSTUME_DESIGN.DESIGN_DELETED);
            }}
            aria-label={`${design.title} 삭제`}
          >
            <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
          </Button>
        </div>

        {/* 카테고리 + 상태 */}
        <div className="flex items-center gap-1 flex-wrap">
          <Badge className="text-[10px] px-1.5 py-0 bg-pink-100 text-pink-700">
            {design.category}
          </Badge>
          <StatusBadge status={design.status} />
        </div>

        {/* 색상 팔레트 */}
        {design.colorScheme.length > 0 && (
          <div
            className="flex items-center gap-1 flex-wrap"
            role="list"
            aria-label="색상 팔레트"
          >
            {design.colorScheme.map((color, i) => (
              <span key={i} role="listitem">
                <ColorChip colorName={color} />
              </span>
            ))}
          </div>
        )}

        {/* 투표 + 댓글 수 + 상세 토글 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`flex items-center gap-1 text-[10px] transition-colors ${
                hasVoted
                  ? "text-pink-600 font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                onToggleVote(design.id, currentUser);
                if (hasVoted) {
                  toast.success(TOAST.COSTUME_DESIGN.VOTE_CANCELLED);
                } else {
                  toast.success(TOAST.COSTUME_DESIGN.VOTED);
                }
              }}
              aria-pressed={hasVoted}
              aria-label={`투표 ${design.votes.length}표${hasVoted ? " (투표함)" : ""}`}
            >
              <ThumbsUp className="h-3 w-3" aria-hidden="true" />
              {design.votes.length}
            </button>
            {design.comments.length > 0 && (
              <span
                className="flex items-center gap-1 text-[10px] text-muted-foreground"
                aria-label={`댓글 ${design.comments.length}개`}
              >
                <MessageSquare className="h-3 w-3" aria-hidden="true" />
                {design.comments.length}
              </span>
            )}
          </div>
          <button
            type="button"
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={`design-detail-${design.id}`}
            aria-label={expanded ? "상세 접기" : "상세 펼치기"}
          >
            상세{" "}
            {expanded ? (
              <ChevronUp className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* 상세 패널 */}
      {expanded && (
        <div
          id={`design-detail-${design.id}`}
          className="px-2.5 pb-2.5"
        >
          <DesignDetail
            design={design}
            memberNames={memberNames}
            currentUser={currentUser}
            onChangeStatus={onChangeStatus}
            onToggleVote={onToggleVote}
            onDelete={onDelete}
            onAddComment={onAddComment}
            onDeleteComment={onDeleteComment}
          />
        </div>
      )}
    </article>
  );
});
