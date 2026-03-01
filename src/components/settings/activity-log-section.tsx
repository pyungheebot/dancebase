"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardList } from "lucide-react";
import { useActivityLog } from "@/hooks/use-activity-log";
import { ACTIVITY_ACTION_LABELS } from "@/types";
import type { ActivityLogAction } from "@/types";

type ActivityLogSectionProps = {
  entityType: "group" | "project";
  entityId: string;
};

// 액션별 배지 색상
function getActionBadgeClass(action: string): string {
  switch (action as ActivityLogAction) {
    case "member_joined":
    case "member_approved":
      return "bg-green-100 text-green-700 border-green-200";
    case "member_left":
    case "member_removed":
    case "member_rejected":
      return "bg-red-100 text-red-700 border-red-200";
    case "role_changed":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "settings_changed":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "post_deleted":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "project_created":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "project_deleted":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

// 액션 한글 레이블 (알 수 없는 액션도 처리)
function getActionLabel(action: string): string {
  return ACTIVITY_ACTION_LABELS[action as ActivityLogAction] ?? action;
}

// 상세 내용 요약 텍스트
function getDetailsSummary(action: string, details: Record<string, unknown> | null): string | null {
  if (!details) return null;

  switch (action as ActivityLogAction) {
    case "member_joined":
    case "member_approved":
      if (details.member_name) return `멤버: ${details.member_name}`;
      break;
    case "member_left":
    case "member_removed":
    case "member_rejected":
      if (details.member_name) return `멤버: ${details.member_name}`;
      break;
    case "role_changed":
      if (details.member_name && details.new_role) {
        const roleLabel = details.new_role === "leader"
          ? "리더"
          : details.new_role === "sub_leader"
          ? "부리더"
          : "멤버";
        return `${details.member_name} → ${roleLabel}`;
      }
      break;
    case "settings_changed":
      if (details.changed_fields && Array.isArray(details.changed_fields)) {
        return `변경 항목: ${(details.changed_fields as string[]).join(", ")}`;
      }
      break;
    case "post_deleted":
      if (details.post_title) return `게시글: ${details.post_title}`;
      break;
    case "project_created":
    case "project_deleted":
      if (details.project_name) return `프로젝트: ${details.project_name}`;
      break;
  }
  return null;
}

// 날짜/시간 포맷
function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityLogSection({ entityType, entityId }: ActivityLogSectionProps) {
  const { logs, loading } = useActivityLog(entityType, entityId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <ClipboardList className="h-3.5 w-3.5" />
          활동 기록
          {!loading && logs.length > 0 && (
            <span className="text-muted-foreground font-normal">
              (최근 {logs.length}개)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">불러오는 중...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
            <ClipboardList className="h-8 w-8 opacity-30" />
            <p className="text-xs">기록된 활동이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const summary = getDetailsSummary(log.action, log.details);
              const actorName = log.profiles?.name ?? "알 수 없음";
              const actorAvatar = log.profiles?.avatar_url ?? null;
              const actorInitial = actorName.charAt(0).toUpperCase();

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-2.5 p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  {/* 아바타 */}
                  <UserAvatar
                    name={actorName}
                    avatarUrl={actorAvatar}
                    size="sm"
                    className="flex-shrink-0 mt-0.5"
                  />

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-medium truncate">{actorName}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 border ${getActionBadgeClass(log.action)}`}
                      >
                        {getActionLabel(log.action)}
                      </Badge>
                    </div>
                    {summary && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {summary}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {formatDateTime(log.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
