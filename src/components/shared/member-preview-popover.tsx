"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { User, Calendar, BarChart3, ExternalLink, FileText, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMemberPreview } from "@/hooks/use-member-preview";
import type { GroupMemberRole } from "@/types";

// ============================================
// 상수
// ============================================

const ROLE_LABELS: Record<GroupMemberRole, string> = {
  leader: "그룹장",
  sub_leader: "부그룹장",
  member: "멤버",
};

const ROLE_BADGE_CLASS: Record<GroupMemberRole, string> = {
  leader: "bg-blue-100 text-blue-700 border-blue-200",
  sub_leader: "bg-purple-100 text-purple-700 border-purple-200",
  member: "bg-gray-100 text-gray-600 border-gray-200",
};

// ============================================
// 유틸리티
// ============================================

function formatDaysAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 30) return `${diffDays}일 전`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months}개월 전`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years}년 전`;
}

function getInitials(name: string): string {
  if (!name) return "?";
  return name.slice(0, 1).toUpperCase();
}

// ============================================
// 로딩 스켈레톤
// ============================================

function MemberPreviewSkeleton() {
  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      {/* 내용 */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

// ============================================
// 팝오버 내용 컴포넌트 (데이터 로드 후 렌더)
// ============================================

function MemberPreviewContent({
  userId,
  groupId,
}: {
  userId: string;
  groupId?: string | null;
}) {
  const { preview, loading } = useMemberPreview(userId, groupId);

  if (loading) {
    return <MemberPreviewSkeleton />;
  }

  if (!preview) {
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        <User className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">프로필 정보를 불러올 수 없습니다</p>
      </div>
    );
  }

  const initials = getInitials(preview.name);

  return (
    <div className="space-y-3">
      {/* 헤더: 아바타 + 이름 + 역할 배지 */}
      <div className="flex items-center gap-2.5">
        {/* 아바타 */}
        {preview.avatarUrl ? (
          <img
            src={preview.avatarUrl}
            alt={preview.name}
            className="h-9 w-9 rounded-full object-cover shrink-0 border border-border"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
            <span className="text-sm font-medium text-muted-foreground">{initials}</span>
          </div>
        )}

        {/* 이름 + 역할 */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium truncate">{preview.name}</span>
            {preview.role && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 border ${ROLE_BADGE_CLASS[preview.role]}`}
              >
                {ROLE_LABELS[preview.role]}
              </Badge>
            )}
          </div>
          {/* 가입일 */}
          {preview.joinedAt && (
            <div className="flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {formatDaysAgo(preview.joinedAt)} 가입
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 한줄 소개 */}
      {preview.bio && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 border-t border-border pt-2.5">
          {preview.bio}
        </p>
      )}

      {/* 출석률 미니 바 */}
      {preview.attendanceRate !== null && (
        <div className={`space-y-1 ${!preview.bio ? "border-t border-border pt-2.5" : ""}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">최근 30일 출석률</span>
            </div>
            <span
              className={`text-[10px] font-medium ${
                preview.attendanceRate >= 80
                  ? "text-green-600"
                  : preview.attendanceRate >= 50
                  ? "text-yellow-600"
                  : "text-red-500"
              }`}
            >
              {preview.attendanceRate}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                preview.attendanceRate >= 80
                  ? "bg-green-500"
                  : preview.attendanceRate >= 50
                  ? "bg-yellow-500"
                  : "bg-red-400"
              }`}
              style={{ width: `${preview.attendanceRate}%` }}
            />
          </div>
        </div>
      )}

      {/* 최근 활동 */}
      <div
        className={`flex items-center gap-3 ${
          preview.attendanceRate === null && !preview.bio
            ? "border-t border-border pt-2.5"
            : ""
        }`}
      >
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            게시글{" "}
            <span className="font-medium text-foreground">{preview.postCount}</span>개
          </span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            댓글{" "}
            <span className="font-medium text-foreground">{preview.commentCount}</span>개
          </span>
        </div>
      </div>

      {/* 프로필 보기 링크 */}
      <div className="border-t border-border pt-2">
        <Link
          href={`/users/${userId}`}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ExternalLink className="h-3 w-3" />
          프로필 보기
        </Link>
      </div>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

type MemberPreviewPopoverProps = {
  userId: string;
  groupId?: string | null;
  children: React.ReactNode;
};

export function MemberPreviewPopover({
  userId,
  groupId,
  children,
}: MemberPreviewPopoverProps) {
  const [open, setOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 데스크탑: hover로 열기 / 모바일: 클릭으로 열기
  const handleMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => {
      setOpen(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          className="cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => setOpen((prev) => !prev)}
        >
          {children}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="max-w-xs w-72 p-3"
        onMouseEnter={() => {
          if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
          }
          setOpen(true);
        }}
        onMouseLeave={handleMouseLeave}
        side="top"
        align="start"
        sideOffset={6}
      >
        {open && (
          <MemberPreviewContent userId={userId} groupId={groupId} />
        )}
      </PopoverContent>
    </Popover>
  );
}
