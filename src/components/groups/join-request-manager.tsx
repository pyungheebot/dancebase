"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { useJoinRequests } from "@/hooks/use-join-requests";
import {
  invalidateJoinRequests,
  invalidatePendingJoinRequestCount,
} from "@/lib/swr/invalidate";
import { createNotification } from "@/lib/notifications";
import type { JoinRequestWithProfile, JoinRequestStatus } from "@/types";

type TabStatus = "all" | JoinRequestStatus;

const STATUS_LABELS: Record<JoinRequestStatus, { label: string; className: string }> = {
  pending: { label: "대기", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  approved: { label: "승인", className: "bg-green-100 text-green-700 border-green-300" },
  rejected: { label: "거절", className: "bg-gray-100 text-gray-600 border-gray-300" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

type Props = {
  groupId: string;
  groupName: string;
};

export function JoinRequestManager({ groupId, groupName }: Props) {
  const [activeTab, setActiveTab] = useState<TabStatus>("pending");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const { requests, loading, refetch } = useJoinRequests(groupId, activeTab);

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === "pending"),
    [requests]
  );

  const tabCounts = useMemo(() => {
    if (activeTab === "all") {
      const all = requests;
      return {
        all: all.length,
        pending: all.filter((r) => r.status === "pending").length,
        approved: all.filter((r) => r.status === "approved").length,
        rejected: all.filter((r) => r.status === "rejected").length,
      };
    }
    return null;
  }, [requests, activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabStatus);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const selectableRequests = requests.filter((r) => r.status === "pending");
    if (selectedIds.size === selectableRequests.length && selectableRequests.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableRequests.map((r) => r.id)));
    }
  };

  const processRequest = async (
    request: JoinRequestWithProfile,
    action: "approve" | "reject"
  ) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (action === "approve") {
      const { error: memberError } = await supabase.from("group_members").insert({
        group_id: request.group_id,
        user_id: request.user_id,
        role: "member",
      });
      if (memberError) {
        if (memberError.code === "23505") {
          // 이미 멤버인 경우 상태만 업데이트
        } else {
          throw new Error("멤버 추가 실패");
        }
      }
      await supabase
        .from("join_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", request.id);

      await createNotification({
        userId: request.user_id,
        type: "join_approved",
        title: "가입 승인",
        message: `${groupName} 가입이 승인되었습니다`,
        link: `/groups/${request.group_id}`,
      });
    } else {
      await supabase
        .from("join_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", request.id);

      await createNotification({
        userId: request.user_id,
        type: "join_rejected",
        title: "가입 거부",
        message: `${groupName} 가입 신청이 거부되었습니다`,
      });
    }
  };

  const handleSingleAction = async (
    request: JoinRequestWithProfile,
    action: "approve" | "reject"
  ) => {
    setProcessingIds((prev) => new Set(prev).add(request.id));
    try {
      await processRequest(request, action);
      toast.success(
        action === "approve"
          ? `${request.profiles.name}님을 승인했습니다.`
          : `${request.profiles.name}님의 신청을 거부했습니다.`
      );
      invalidateJoinRequests(groupId);
      invalidatePendingJoinRequestCount(groupId);
      refetch();
    } catch {
      toast.error(
        action === "approve" ? "승인 처리에 실패했습니다." : "거부 처리에 실패했습니다."
      );
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  const handleBulkAction = async (action: "approve" | "reject") => {
    const targets = requests.filter(
      (r) => r.status === "pending" && selectedIds.has(r.id)
    );
    if (targets.length === 0) return;

    setBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    await Promise.all(
      targets.map(async (req) => {
        try {
          await processRequest(req, action);
          successCount++;
        } catch {
          failCount++;
        }
      })
    );

    if (successCount > 0) {
      toast.success(
        action === "approve"
          ? `${successCount}명을 일괄 승인했습니다.`
          : `${successCount}명을 일괄 거부했습니다.`
      );
    }
    if (failCount > 0) {
      toast.error(`${failCount}건 처리에 실패했습니다.`);
    }

    setSelectedIds(new Set());
    invalidateJoinRequests(groupId);
    invalidatePendingJoinRequestCount(groupId);
    refetch();
    setBulkProcessing(false);
  };

  const pendingSelectableCount = requests.filter((r) => r.status === "pending").length;
  const allPendingSelected =
    pendingSelectableCount > 0 && selectedIds.size === pendingSelectableCount;

  return (
    <div className="space-y-4">
      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="h-8">
          <TabsTrigger value="pending" className="text-xs h-7 px-3">
            대기
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-xs h-7 px-3">
            승인
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs h-7 px-3">
            거절
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs h-7 px-3">
            전체
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 일괄 처리 바 - 대기 탭에서 체크박스 선택 시 표시 */}
      {(activeTab === "pending" || activeTab === "all") &&
        pendingSelectableCount > 0 && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={allPendingSelected}
                onCheckedChange={toggleSelectAll}
                className="h-3.5 w-3.5"
              />
              <label htmlFor="select-all" className="text-xs text-muted-foreground cursor-pointer">
                {selectedIds.size > 0
                  ? `${selectedIds.size}명 선택됨`
                  : "대기 중 전체 선택"}
              </label>
            </div>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  disabled={bulkProcessing}
                  onClick={() => handleBulkAction("approve")}
                >
                  {bulkProcessing ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  일괄 승인
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  disabled={bulkProcessing}
                  onClick={() => handleBulkAction("reject")}
                >
                  {bulkProcessing ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <X className="h-3 w-3 mr-1" />
                  )}
                  일괄 거절
                </Button>
              </div>
            )}
          </div>
        )}

      {/* 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
          {activeTab === "pending" ? (
            <>
              <UserPlus className="h-8 w-8 opacity-30" />
              <p className="text-xs">대기 중인 가입 신청이 없습니다</p>
            </>
          ) : (
            <>
              <Users className="h-8 w-8 opacity-30" />
              <p className="text-xs">신청 내역이 없습니다</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => {
            const isPending = req.status === "pending";
            const isProcessing = processingIds.has(req.id);
            const isSelected = selectedIds.has(req.id);
            const statusInfo = STATUS_LABELS[req.status];

            return (
              <div
                key={req.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/30"
              >
                {/* 체크박스 (대기 상태만) */}
                <div className="w-4 shrink-0">
                  {isPending && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(req.id)}
                      disabled={isProcessing || bulkProcessing}
                      className="h-3.5 w-3.5"
                    />
                  )}
                </div>

                {/* 프로필 아바타 */}
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={req.profiles.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {req.profiles.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>

                {/* 이름 + 신청일 */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{req.profiles.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    신청일: {formatDate(req.requested_at)}
                    {req.reviewed_at && ` · 처리일: ${formatDate(req.reviewed_at)}`}
                  </p>
                </div>

                {/* 상태 배지 */}
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 shrink-0 ${statusInfo.className}`}
                >
                  {statusInfo.label}
                </Badge>

                {/* 승인/거절 버튼 (대기 상태만) */}
                {isPending && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      disabled={isProcessing || bulkProcessing}
                      onClick={() => handleSingleAction(req, "approve")}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      승인
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      disabled={isProcessing || bulkProcessing}
                      onClick={() => handleSingleAction(req, "reject")}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3 mr-1" />
                      )}
                      거절
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 전체 탭 통계 */}
      {activeTab === "all" && tabCounts && requests.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2">
          <p className="text-[10px] text-muted-foreground">
            전체 {tabCounts.all}건 · 대기 {tabCounts.pending} · 승인 {tabCounts.approved} · 거절 {tabCounts.rejected}
          </p>
        </div>
      )}
    </div>
  );
}
