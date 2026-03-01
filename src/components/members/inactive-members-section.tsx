"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BellRing, Clock, MessageSquarePlus, UserX } from "lucide-react";
import { toast } from "sonner";
import { createNotification } from "@/lib/notifications";
import { useMemberEngagement } from "@/hooks/use-member-engagement";
import { WinBackMessageDialog } from "@/components/members/win-back-message-dialog";
import type { EntityContext } from "@/types/entity-context";
import type { WinBackRecipient } from "@/lib/win-back-message";

type InactiveMembersSectionProps = {
  ctx: EntityContext;
};

/**
 * 비활성 멤버 섹션 (리더 전용)
 *
 * - 30일 이상 활동 없는 멤버를 표시
 * - "활동 독려 알림" 버튼으로 해당 멤버에게 알림 발송
 * - 체크박스로 멤버 선택 후 "복귀 메시지 보내기" 기능
 * - 비활성 멤버가 없으면 섹션 자체를 렌더링하지 않음
 */
export function InactiveMembersSection({ ctx }: InactiveMembersSectionProps) {
  const { inactiveMembers, loading } = useMemberEngagement(ctx.groupId, ctx.members);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  // 선택된 멤버 ID 집합
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // WinBackMessageDialog 열림 상태
  const [winBackOpen, setWinBackOpen] = useState(false);

  // 리더 권한 확인
  if (!ctx.permissions.canEdit) return null;

  // 로딩 중이거나 비활성 멤버 없으면 숨김
  if (loading || inactiveMembers.length === 0) return null;

  // ============================================
  // 체크박스 핸들러
  // ============================================

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === inactiveMembers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(inactiveMembers.map((e) => e.member.userId)));
    }
  };

  const isAllSelected =
    inactiveMembers.length > 0 &&
    selectedIds.size === inactiveMembers.length;

  const isPartialSelected = selectedIds.size > 0 && !isAllSelected;

  // 선택된 멤버를 WinBackRecipient 형태로 변환
  const selectedRecipients: WinBackRecipient[] = inactiveMembers
    .filter((e) => selectedIds.has(e.member.userId))
    .map((e) => ({
      userId: e.member.userId,
      name: e.member.nickname || e.member.profile.name,
    }));

  // ============================================
  // 알림 발송 핸들러
  // ============================================

  const handleSendNotification = async (userId: string, name: string) => {
    setSendingIds((prev) => new Set(prev).add(userId));
    try {
      await createNotification({
        userId,
        type: "attendance",
        title: "활동 독려 알림",
        message: `${ctx.header.name} 그룹에서 오랫동안 활동이 없었습니다. 그룹에 방문해 멤버들과 소통해보세요!`,
        link: `/groups/${ctx.groupId}`,
      });
      setSentIds((prev) => new Set(prev).add(userId));
      toast.success(`${name}님에게 활동 독려 알림을 발송했습니다`);
    } catch {
      toast.error("알림 발송에 실패했습니다");
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleSendAll = async () => {
    const targets = inactiveMembers.filter((e) => !sentIds.has(e.member.userId));
    if (targets.length === 0) return;

    for (const engagement of targets) {
      const { userId } = engagement.member;
      const _name = engagement.member.nickname || engagement.member.profile.name;
      setSendingIds((prev) => new Set(prev).add(userId));
      try {
        await createNotification({
          userId,
          type: "attendance",
          title: "활동 독려 알림",
          message: `${ctx.header.name} 그룹에서 오랫동안 활동이 없었습니다. 그룹에 방문해 멤버들과 소통해보세요!`,
          link: `/groups/${ctx.groupId}`,
        });
        setSentIds((prev) => new Set(prev).add(userId));
      } catch {
        // 개별 실패는 전체 발송을 중단하지 않음
      } finally {
        setSendingIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    }
    toast.success(`${targets.length}명에게 활동 독려 알림을 발송했습니다`);
  };

  return (
    <div className="mt-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <UserX className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-xs font-medium text-muted-foreground">비활성 멤버</h2>
          <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200">
            {inactiveMembers.length}명
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          {/* 복귀 메시지 버튼 (선택된 멤버가 있을 때만 활성화) */}
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] px-2"
            onClick={() => setWinBackOpen(true)}
            disabled={selectedIds.size === 0}
          >
            <MessageSquarePlus className="h-3 w-3 mr-0.5" />
            복귀 메시지
            {selectedIds.size > 0 && (
              <Badge className="text-[10px] px-1 py-0 ml-1 bg-blue-100 text-blue-700 border-blue-200">
                {selectedIds.size}
              </Badge>
            )}
          </Button>
          {/* 전체 알림 발송 버튼 */}
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] px-2"
            onClick={handleSendAll}
            disabled={
              sendingIds.size > 0 ||
              inactiveMembers.every((e) => sentIds.has(e.member.userId))
            }
          >
            <BellRing className="h-3 w-3 mr-0.5" />
            전체 알림 발송
          </Button>
        </div>
      </div>

      <div className="rounded-lg border divide-y">
        {/* 전체 선택 헤더 행 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30">
          <Checkbox
            id="inactive-select-all"
            checked={isAllSelected ? true : isPartialSelected ? "indeterminate" : false}
            onCheckedChange={toggleSelectAll}
            className="h-3.5 w-3.5"
          />
          <label
            htmlFor="inactive-select-all"
            className="text-[11px] text-muted-foreground cursor-pointer select-none"
          >
            {isAllSelected
              ? "전체 선택 해제"
              : `전체 선택 (${inactiveMembers.length}명)`}
          </label>
        </div>

        {/* 멤버 행 */}
        {inactiveMembers.map(({ member, lastActivityAt, inactiveDays }) => {
          const displayName = member.nickname || member.profile.name;
          const isSending = sendingIds.has(member.userId);
          const isSent = sentIds.has(member.userId);
          const isSelected = selectedIds.has(member.userId);

          return (
            <div
              key={member.id}
              className="flex items-center justify-between px-3 py-2"
            >
              {/* 왼쪽: 체크박스 + 아바타 + 정보 */}
              <div className="flex items-center gap-2 min-w-0">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelect(member.userId)}
                  className="h-3.5 w-3.5 shrink-0"
                />
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarFallback className="text-xs">
                    {displayName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{displayName}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                    <span className="text-[10px] text-muted-foreground">
                      마지막 활동:{" "}
                      {lastActivityAt
                        ? new Date(lastActivityAt).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "기록 없음"}
                    </span>
                    <Badge className="text-[10px] px-1 py-0 bg-gray-100 text-gray-600 border-gray-200 ml-1">
                      {inactiveDays === 9999 ? "활동 없음" : `${inactiveDays}일 비활성`}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 개별 알림 버튼 */}
              <Button
                variant={isSent ? "secondary" : "outline"}
                size="sm"
                className="h-6 text-[11px] px-2 shrink-0 ml-2"
                onClick={() => handleSendNotification(member.userId, displayName)}
                disabled={isSending || isSent}
              >
                <BellRing className="h-3 w-3 mr-0.5" />
                {isSending ? "발송 중..." : isSent ? "발송 완료" : "알림 보내기"}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground mt-1.5 px-0.5">
        30일 이상 출석, 게시글, 댓글 활동이 없는 멤버입니다.
      </p>

      {/* 복귀 메시지 다이얼로그 */}
      <WinBackMessageDialog
        open={winBackOpen}
        onOpenChange={setWinBackOpen}
        recipients={selectedRecipients}
      />
    </div>
  );
}
