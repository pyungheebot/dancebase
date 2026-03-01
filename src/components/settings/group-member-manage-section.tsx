"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Check, X, ShieldCheck, Users, UserPlus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { formatYearMonthDay } from "@/lib/date-utils";
import type { EntityContext } from "@/types/entity-context";
import type { JoinRequestWithProfile } from "@/types";

type GroupMemberManageSectionProps = {
  ctx: EntityContext;
  joinRequests: JoinRequestWithProfile[];
  processingRequest: string | null;
  updatingRoleUserId: string | null;
  currentUserId: string | undefined;
  isGroupLeader: boolean;
  showJoinRequests: boolean;
  onApproveRequest: (request: JoinRequestWithProfile) => void;
  onRejectRequest: (request: JoinRequestWithProfile) => void;
  onRoleChange: (userId: string, role: "leader" | "sub_leader" | "member") => void;
};

export function GroupMemberManageSection({
  ctx,
  joinRequests,
  processingRequest,
  updatingRoleUserId,
  currentUserId,
  isGroupLeader,
  showJoinRequests,
  onApproveRequest,
  onRejectRequest,
  onRoleChange,
}: GroupMemberManageSectionProps) {
  return (
    <div className="space-y-4">
      {/* 가입 신청 관리 */}
      {showJoinRequests && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-semibold">
              가입 신청 ({joinRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {joinRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
                <UserPlus className="h-8 w-8 opacity-30" />
                <p className="text-xs">현재 대기 중인 가입 신청이 없습니다</p>
              </div>
            ) : (
              joinRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      name={req.profiles.name || "U"}
                      size="md"
                      className="h-8 w-8"
                    />
                    <div>
                      <p className="text-sm font-medium">{req.profiles.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatYearMonthDay(req.requested_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={processingRequest === req.id}
                      onClick={() => onApproveRequest(req)}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      승인
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive"
                      disabled={processingRequest === req.id}
                      onClick={() => onRejectRequest(req)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      거부
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* 권한 관리 (리더 전용) */}
      {isGroupLeader && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              권한 관리
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-[11px] text-muted-foreground mb-3">
              멤버의 역할을 변경합니다. 리더 본인의 역할은 변경할 수 없습니다.
            </p>
            {ctx.members.length === 0 ? (
              <EmptyState
                icon={Users}
                title="멤버가 없습니다"
                description="그룹에 멤버를 초대해보세요"
                className="border-0 bg-transparent"
              />
            ) : (
              ctx.members.map((member) => {
                const isSelf = member.userId === currentUserId;
                const isUpdating = updatingRoleUserId === member.userId;
                return (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between px-2.5 py-2 rounded-md border bg-muted/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar
                        name={member.profile.name || "U"}
                        avatarUrl={member.profile.avatar_url}
                        size="sm"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">
                          {member.nickname || member.profile.name}
                          {isSelf && (
                            <span className="ml-1 text-[10px] text-muted-foreground">(나)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isUpdating && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                      <Select
                        value={member.role}
                        onValueChange={(val) =>
                          onRoleChange(member.userId, val as "leader" | "sub_leader" | "member")
                        }
                        disabled={isSelf || isUpdating}
                      >
                        <SelectTrigger className="h-7 text-xs w-[90px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="leader" className="text-xs">리더</SelectItem>
                          <SelectItem value="sub_leader" className="text-xs">서브리더</SelectItem>
                          <SelectItem value="member" className="text-xs">멤버</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
