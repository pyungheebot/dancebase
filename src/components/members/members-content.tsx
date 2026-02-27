"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MemberList } from "@/components/groups/member-list";
import { InviteModal } from "@/components/groups/invite-modal";
import { MemberCategoryManager } from "@/components/groups/member-category-manager";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPopoverMenu } from "@/components/user/user-popover-menu";
import { Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getCategoryColorClasses } from "@/types";
import type { EntityContext, EntityMember } from "@/types/entity-context";
import type { GroupMemberWithProfile, MemberCategory, Profile } from "@/types";

type MembersContentProps = {
  ctx: EntityContext;
  currentUserId: string;
  categories?: MemberCategory[];
  categoryMap?: Record<string, string>;
  categoryColorMap?: Record<string, string>;
  inviteCode?: string;
  parentMembers?: EntityMember[];
  onUpdate: () => void;
};

export function MembersContent({
  ctx,
  currentUserId,
  categories = [],
  categoryMap = {},
  categoryColorMap = {},
  inviteCode,
  parentMembers = [],
  onUpdate,
}: MembersContentProps) {
  const isGroup = ctx.entityType === "group";

  if (isGroup) {
    return (
      <GroupMembersContent
        ctx={ctx}
        currentUserId={currentUserId}
        categories={categories}
        inviteCode={inviteCode}
        onUpdate={onUpdate}
      />
    );
  }

  return (
    <ProjectMembersContent
      ctx={ctx}
      currentUserId={currentUserId}
      parentMembers={parentMembers}
      onUpdate={onUpdate}
    />
  );
}

// ============================================
// 그룹 멤버 콘텐츠
// ============================================

function GroupMembersContent({
  ctx,
  currentUserId,
  categories,
  inviteCode,
  onUpdate,
}: {
  ctx: EntityContext;
  currentUserId: string;
  categories: MemberCategory[];
  inviteCode?: string;
  onUpdate: () => void;
}) {
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // NormalizedMember → GroupMemberWithProfile 역변환
  const allMembersForList: GroupMemberWithProfile[] = ctx.members.map((m) => ({
    id: m.id,
    group_id: ctx.groupId,
    user_id: m.userId,
    role: m.role,
    joined_at: m.joinedAt,
    nickname: m.nickname,
    category_id: m.categoryId ?? null,
    profiles: {
      ...({} as Profile),
      id: m.profile.id,
      name: m.profile.name,
      avatar_url: m.profile.avatar_url,
      dance_genre: m.profile.dance_genre ?? [],
    },
  }));

  const filteredMembers =
    selectedCategory === "all"
      ? allMembersForList
      : selectedCategory === "none"
        ? allMembersForList.filter(
            (m) => !m.category_id || !categories.some((c) => c.id === m.category_id)
          )
        : allMembersForList.filter((m) => m.category_id === selectedCategory);

  const isGrouped = selectedCategory === "all";
  const myRole = ctx.permissions.canEdit ? "leader" : "member";

  return (
    <>
      {ctx.permissions.canEdit && (
        <div className="flex items-center justify-end gap-1 mb-2">
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] px-2"
            onClick={() => setCategoryManagerOpen(true)}
          >
            <Tags className="h-3 w-3 mr-0.5" />
            카테고리
          </Button>
          {inviteCode && <InviteModal inviteCode={inviteCode} />}
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-medium">멤버 관리</h2>
        {categories.length > 0 && (
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-28 h-6 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="none">카테고리 없음</SelectItem>
              {categories.map((cat) => {
                const cc = getCategoryColorClasses(cat.color || "gray");
                return (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${cc.bg} ${cc.border} border`}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>

      <MemberList
        members={filteredMembers}
        myRole={myRole}
        currentUserId={currentUserId}
        groupId={ctx.groupId}
        categories={categories}
        grouped={isGrouped}
        onUpdate={onUpdate}
      />

      <MemberCategoryManager
        groupId={ctx.groupId}
        categories={categories}
        members={allMembersForList}
        open={categoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
        onUpdate={onUpdate}
      />
    </>
  );
}

// ============================================
// 프로젝트 멤버 콘텐츠
// ============================================

function ProjectMembersContent({
  ctx,
  currentUserId,
  parentMembers,
  onUpdate,
}: {
  ctx: EntityContext;
  currentUserId: string;
  parentMembers: EntityMember[];
  onUpdate: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const projectMemberIds = new Set(ctx.members.map((m) => m.userId));
  const availableMembers = parentMembers.filter((m) => !projectMemberIds.has(m.userId));

  const handleAddMember = async () => {
    if (!selectedUserId || !ctx.projectId) return;
    setSubmitting(true);

    await supabase.from("project_members").insert({
      project_id: ctx.projectId,
      user_id: selectedUserId,
      role: "member",
    });

    setSelectedUserId("");
    setSubmitting(false);
    setAddOpen(false);
    onUpdate();
  };

  const handleRemoveMember = async (userId: string) => {
    if (!ctx.projectId) return;
    if (!window.confirm("이 멤버를 제거하시겠습니까?")) return;
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", ctx.projectId)
      .eq("user_id", userId);
    if (error) {
      toast.error("멤버 제거에 실패했습니다");
      return;
    }
    onUpdate();
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    await supabase
      .from("project_members")
      .update({ role: newRole })
      .eq("id", memberId);
    onUpdate();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold">멤버 ({ctx.members.length})</h2>
        {ctx.permissions.canEdit && availableMembers.length > 0 && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                멤버 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>멤버 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="멤버를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.nickname || m.profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  onClick={handleAddMember}
                  disabled={!selectedUserId || submitting}
                >
                  {submitting ? "추가 중..." : "추가"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-lg border divide-y">
        {ctx.members.map((member) => {
          const displayName = member.nickname || member.profile.name;
          return (
            <div key={member.id} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {displayName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <UserPopoverMenu
                  userId={member.userId}
                  displayName={displayName}
                  groupId={ctx.groupId}
                  className="text-sm truncate hover:underline text-left"
                >
                  {displayName}
                </UserPopoverMenu>
                {member.role === "leader" && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    프로젝트장
                  </Badge>
                )}
              </div>
              {ctx.permissions.canEdit && (
                <div className="flex items-center gap-1 shrink-0">
                  <Select
                    value={member.role}
                    onValueChange={(val) => handleRoleChange(member.id, val)}
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
                    onClick={() => handleRemoveMember(member.userId)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
