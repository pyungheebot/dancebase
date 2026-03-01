"use client";

import { useState } from "react";
import { formatKo } from "@/lib/date-utils";
import { ShieldAlert, EyeOff, Trash2, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useContentReports } from "@/hooks/use-content-reports";
import { invalidateContentReports } from "@/lib/swr/invalidate";
import { invalidateBoard, invalidateBoardPost } from "@/lib/swr/invalidate";

const REASON_LABELS: Record<string, string> = {
  spam: "스팸",
  harassment: "괴롭힘",
  inappropriate: "부적절한 내용",
  other: "기타",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "미처리",
  reviewed: "처리됨",
  dismissed: "무시됨",
};

interface ContentModerationPanelProps {
  groupId: string;
}

export function ContentModerationPanel({ groupId }: ContentModerationPanelProps) {
  const [open, setOpen] = useState(false);
  const { reports, pendingCount, loading, refetch } = useContentReports(groupId);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { user } = useAuth();

  const supabase = createClient();

  // 신고 상태 업데이트 헬퍼
  const updateReportStatus = async (
    reportId: string,
    status: "reviewed" | "dismissed"
  ) => {
    const { error } = await supabase
      .from("content_reports")
      .update({
        status,
        reviewed_by: user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    return error;
  };

  // 숨김 처리
  const handleHide = async (reportId: string, commentId: string) => {
    if (processingId) return;
    setProcessingId(reportId);

    const { error: hideError } = await supabase
      .from("board_comments")
      .update({ is_hidden: true })
      .eq("id", commentId);

    if (hideError) {
      toast.error("숨김 처리에 실패했습니다");
      setProcessingId(null);
      return;
    }

    const statusError = await updateReportStatus(reportId, "reviewed");
    if (statusError) {
      toast.error("신고 상태 업데이트에 실패했습니다");
      setProcessingId(null);
      return;
    }

    toast.success("댓글이 숨김 처리되었습니다");
    invalidateContentReports(groupId);
    refetch();
    setProcessingId(null);
  };

  // 삭제 처리
  const handleDelete = async (
    reportId: string,
    targetType: "post" | "comment",
    targetId: string
  ) => {
    if (processingId) return;
    setProcessingId(reportId);

    const table = targetType === "post" ? "board_posts" : "board_comments";

    let deleteError;
    if (targetType === "post") {
      // 소프트 삭제
      const { error } = await supabase
        .from("board_posts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", targetId);
      deleteError = error;
    } else {
      const { error } = await supabase.from(table).delete().eq("id", targetId);
      deleteError = error;
    }

    if (deleteError) {
      toast.error(TOAST.DELETE_ERROR);
      setProcessingId(null);
      return;
    }

    const statusError = await updateReportStatus(reportId, "reviewed");
    if (statusError) {
      toast.error("신고 상태 업데이트에 실패했습니다");
      setProcessingId(null);
      return;
    }

    toast.success(`${targetType === "post" ? "게시글" : "댓글"}이 삭제되었습니다`);
    invalidateContentReports(groupId);
    invalidateBoard(groupId);
    if (targetType === "post") invalidateBoardPost(targetId);
    refetch();
    setProcessingId(null);
  };

  // 무시 처리
  const handleDismiss = async (reportId: string) => {
    if (processingId) return;
    setProcessingId(reportId);

    const statusError = await updateReportStatus(reportId, "dismissed");
    if (statusError) {
      toast.error("처리에 실패했습니다");
      setProcessingId(null);
      return;
    }

    toast.success("신고가 무시 처리되었습니다");
    invalidateContentReports(groupId);
    refetch();
    setProcessingId(null);
  };

  const pendingReports = reports.filter((r) => r.status === "pending");
  const reviewedReports = reports.filter((r) => r.status !== "pending");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 relative"
        >
          <ShieldAlert className="h-3 w-3" />
          신고 관리
          {pendingCount > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-red-500 hover:bg-red-500 ml-0.5">
              {pendingCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle className="text-sm flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            신고 관리
            {pendingCount > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-red-500 hover:bg-red-500">
                {pendingCount}건 미처리
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="divide-y px-4 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="py-3 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <ShieldAlert className="h-8 w-8 opacity-30" />
              <p className="text-xs">신고된 콘텐츠가 없습니다</p>
            </div>
          ) : (
            <div className="divide-y">
              {/* 미처리 신고 */}
              {pendingReports.length > 0 && (
                <>
                  <div className="px-4 py-1.5 bg-muted/50">
                    <p className="text-[10px] font-medium text-muted-foreground">
                      미처리 ({pendingReports.length}건)
                    </p>
                  </div>
                  {pendingReports.map((report) => (
                    <div key={report.id} className="px-4 py-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {report.target_type === "post" ? "게시글" : "댓글"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {REASON_LABELS[report.reason] ?? report.reason}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatKo(new Date(report.created_at), "M/d HH:mm")}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            신고자:{" "}
                            {report.reporter_profile?.name ?? "알 수 없음"}
                          </p>
                          {(report.post_title || report.comment_content) && (
                            <p className="text-xs bg-muted rounded px-2 py-1 line-clamp-2">
                              {report.post_title ?? report.comment_content}
                            </p>
                          )}
                          {report.description && (
                            <p className="text-[11px] text-muted-foreground italic">
                              &quot;{report.description}&quot;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap">
                        {report.target_type === "comment" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] px-2 gap-0.5"
                            onClick={() =>
                              handleHide(report.id, report.target_id)
                            }
                            disabled={processingId === report.id}
                          >
                            <EyeOff className="h-2.5 w-2.5" />
                            숨김 처리
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] px-2 gap-0.5 text-destructive hover:text-destructive"
                          onClick={() =>
                            handleDelete(
                              report.id,
                              report.target_type,
                              report.target_id
                            )
                          }
                          disabled={processingId === report.id}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                          삭제
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] px-2 gap-0.5 text-muted-foreground"
                          onClick={() => handleDismiss(report.id)}
                          disabled={processingId === report.id}
                        >
                          <X className="h-2.5 w-2.5" />
                          무시
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* 처리된 신고 */}
              {reviewedReports.length > 0 && (
                <>
                  <div className="px-4 py-1.5 bg-muted/50">
                    <p className="text-[10px] font-medium text-muted-foreground">
                      처리 완료 ({reviewedReports.length}건)
                    </p>
                  </div>
                  {reviewedReports.map((report) => (
                    <div key={report.id} className="px-4 py-3 space-y-1 opacity-60">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {report.target_type === "post" ? "게시글" : "댓글"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {REASON_LABELS[report.reason] ?? report.reason}
                        </Badge>
                        <Badge
                          variant={
                            report.status === "reviewed" ? "default" : "secondary"
                          }
                          className="text-[10px] px-1.5 py-0"
                        >
                          {STATUS_LABELS[report.status] ?? report.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatKo(new Date(report.created_at), "M/d")}
                        </span>
                      </div>
                      {(report.post_title || report.comment_content) && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {report.post_title ?? report.comment_content}
                        </p>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {reports.length > 0 && (
          <div className="px-4 py-2 border-t shrink-0">
            <p className="text-[10px] text-muted-foreground">
              전체 {reports.length}건 (미처리 {pendingCount}건)
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
