"use client";

import { memo } from "react";
import { Edit2, Trash2, Clock, User, FileText, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SocialCalendarPost } from "@/types";
import {
  PLATFORM_BADGE,
  PLATFORM_LABEL,
  STATUS_BADGE,
  STATUS_LABEL,
  MEDIA_TYPE_LABEL,
  getNextStatus,
} from "./types";

// ============================================================
// Props
// ============================================================

type PostListItemProps = {
  post: SocialCalendarPost;
  onEdit: (post: SocialCalendarPost) => void;
  onDelete: (id: string) => void;
  onAdvanceStatus: (post: SocialCalendarPost) => void;
};

// ============================================================
// 컴포넌트
// ============================================================

export const PostListItem = memo(function PostListItem({
  post,
  onEdit,
  onDelete,
  onAdvanceStatus,
}: PostListItemProps) {
  const nextStatus = getNextStatus(post.status);

  return (
    <article
      className="border rounded-md p-2.5 space-y-1.5 bg-card"
      aria-label={`${PLATFORM_LABEL[post.platform]} 게시물: ${post.title}`}
    >
      {/* 상단: 플랫폼 배지 + 제목 + 액션 */}
      <div className="flex items-start gap-2">
        <Badge
          className={cn(
            "text-[10px] px-1.5 py-0 shrink-0",
            PLATFORM_BADGE[post.platform]
          )}
        >
          {PLATFORM_LABEL[post.platform]}
        </Badge>
        <span className="text-xs font-medium flex-1 leading-tight">
          {post.title}
        </span>
        <div
          className="flex items-center gap-1 shrink-0"
          role="group"
          aria-label="게시물 액션"
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500"
            onClick={() => onEdit(post)}
            aria-label={`${post.title} 수정`}
          >
            <Edit2 className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
            onClick={() => onDelete(post.id)}
            aria-label={`${post.title} 삭제`}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 메타 정보 */}
      <dl className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div>
          <dt className="sr-only">상태</dt>
          <dd>
            <Badge
              className={cn(
                "text-[10px] px-1.5 py-0",
                STATUS_BADGE[post.status]
              )}
            >
              {STATUS_LABEL[post.status]}
            </Badge>
          </dd>
        </div>
        {post.mediaType && (
          <div>
            <dt className="sr-only">미디어 유형</dt>
            <dd className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <FileText className="h-3 w-3" aria-hidden="true" />
              {MEDIA_TYPE_LABEL[post.mediaType]}
            </dd>
          </div>
        )}
        {post.scheduledTime && (
          <div>
            <dt className="sr-only">예약 시간</dt>
            <dd className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <time>{post.scheduledTime}</time>
            </dd>
          </div>
        )}
        {post.assignee && (
          <div>
            <dt className="sr-only">담당자</dt>
            <dd className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <User className="h-3 w-3" aria-hidden="true" />
              {post.assignee}
            </dd>
          </div>
        )}
      </dl>

      {/* 해시태그 */}
      {post.hashtags.length > 0 && (
        <div
          className="flex flex-wrap gap-1"
          role="list"
          aria-label="해시태그 목록"
        >
          {post.hashtags.map((tag) => (
            <span
              key={tag}
              role="listitem"
              className="text-[10px] text-purple-600 flex items-center gap-0.5"
            >
              <Hash className="h-2.5 w-2.5" aria-hidden="true" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 상태 진행 버튼 */}
      {nextStatus && (
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[10px] w-full"
          onClick={() => onAdvanceStatus(post)}
          aria-label={`상태를 "${STATUS_LABEL[nextStatus]}"(으)로 변경`}
        >
          {STATUS_LABEL[nextStatus]}(으)로 변경
        </Button>
      )}
    </article>
  );
});
