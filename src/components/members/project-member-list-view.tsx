"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPopoverMenu } from "@/components/user/user-popover-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { Trash2, Users } from "lucide-react";
import type { EntityMember } from "@/types/entity-context";

// ============================================
// Props
// ============================================

type ProjectMemberListViewProps = {
  /** 화면에 표시할 (필터된) 멤버 목록 */
  displayedMembers: EntityMember[];
  /** 원본 전체 멤버 수 (빈 상태 구분용) */
  totalMemberCount: number;
  /** 그룹 ID (UserPopoverMenu용) */
  groupId: string;
  /** 편집 권한 여부 */
  canEdit: boolean;
  /** 멤버 추가 버튼 표시 여부 (빈 상태 CTA용) */
  canAddMember: boolean;
  /** 역할 변경 핸들러 */
  onRoleChange: (memberId: string, newRole: string) => void;
  /** 멤버 제거 핸들러 (userId 전달) */
  onRemove: (userId: string) => void;
  /** 멤버 추가 다이얼로그 열기 */
  onAddOpen: () => void;
};

// ============================================
// 컴포넌트
// ============================================

/**
 * 프로젝트 멤버 목록 뷰.
 * 필터된 멤버 행 렌더링, 빈 상태 처리, 역할 변경/삭제 컨트롤을 담당합니다.
 */
export function ProjectMemberListView({
  displayedMembers,
  totalMemberCount,
  groupId,
  canEdit,
  canAddMember,
  onRoleChange,
  onRemove,
  onAddOpen,
}: ProjectMemberListViewProps) {
  // 전체 멤버가 없는 경우 (초기 빈 상태)
  if (displayedMembers.length === 0 && totalMemberCount === 0) {
    return (
      <EmptyState
        icon={Users}
        title="프로젝트 멤버가 없습니다"
        description="그룹 멤버를 추가해 프로젝트에 참여시켜보세요."
        action={
          canAddMember
            ? { label: "멤버 추가", onClick: onAddOpen }
            : undefined
        }
      />
    );
  }

  // 필터 결과가 없는 경우
  if (displayedMembers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="검색 결과가 없습니다"
        description="검색어나 필터를 변경해보세요."
      />
    );
  }

  return (
    <div className="rounded-lg border divide-y">
      {displayedMembers.map((member) => {
        const displayName = member.nickname || member.profile.name;
        return (
          <div key={member.id} className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* 아바타 */}
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {displayName?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              {/* 이름 (프로필 팝오버 포함) */}
              <UserPopoverMenu
                userId={member.userId}
                displayName={displayName}
                groupId={groupId}
                className="text-sm truncate hover:underline text-left"
              >
                {displayName}
              </UserPopoverMenu>

              {/* 프로젝트장 배지 */}
              {member.role === "leader" && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  프로젝트장
                </Badge>
              )}
            </div>

            {/* 편집 컨트롤 */}
            {canEdit && (
              <div className="flex items-center gap-1 shrink-0">
                <Select
                  value={member.role}
                  onValueChange={(val) => onRoleChange(member.id, val)}
                >
                  <SelectTrigger className="h-6 w-20 text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leader">리더</SelectItem>
                    <SelectItem value="member">멤버</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(member.userId)}
                  aria-label="멤버 삭제"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
