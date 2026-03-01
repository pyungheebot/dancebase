"use client";

import { useState, useCallback, memo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPopoverMenu } from "@/components/user/user-popover-menu";
import { MemberBadgeIcons } from "@/components/members/member-badge-icons";
import { UserMinus, Pencil, Check, X, IdCard } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MemberNotePopover } from "@/components/members/member-note-popover";
import { PracticePlanSheet } from "@/components/members/practice-plan-sheet";
import { MemberIntroCardDialog } from "@/components/members/member-intro-card-dialog";
import { PeerFeedbackSendDialog } from "@/components/members/peer-feedback-dialog";
import { useMemberIntroCards } from "@/hooks/use-member-intro-cards";
import type { GroupMemberWithProfile, MemberCategory } from "@/types";
import { getCategoryColorClasses } from "@/types";

type MemberListItemProps = {
  member: GroupMemberWithProfile;
  myRole: "leader" | "sub_leader" | "member" | null;
  currentUserId: string;
  groupId: string;
  categories: MemberCategory[];
  selectable: boolean;
  isSelected: boolean;
  isEditing: boolean;
  nicknameValue: string;
  updating: string | null;
  hasCard: (userId: string) => boolean;
  onToggleSelect?: (memberId: string) => void;
  onRoleChange: (memberId: string, newRole: string) => void;
  onCategoryChange: (memberId: string, categoryId: string) => void;
  onStartEdit: (member: GroupMemberWithProfile) => void;
  onSaveNickname: (memberId: string) => void;
  onCancelEdit: () => void;
  onNicknameChange: (value: string) => void;
  onRemoveRequest: (memberId: string) => void;
  onIntroCardOpen: (member: GroupMemberWithProfile) => void;
};

const MemberListItem = memo(function MemberListItem({
  member,
  myRole,
  currentUserId,
  groupId,
  categories,
  selectable,
  isSelected,
  isEditing,
  nicknameValue,
  updating,
  hasCard,
  onToggleSelect,
  onRoleChange,
  onCategoryChange,
  onStartEdit,
  onSaveNickname,
  onCancelEdit,
  onNicknameChange,
  onRemoveRequest,
  onIntroCardOpen,
}: MemberListItemProps) {
  const isMe = member.user_id === currentUserId;
  const displayName = member.nickname || member.profiles.name;
  const category = member.category_id
    ? categories.find((c) => c.id === member.category_id) || null
    : null;
  const colorClasses = category ? getCategoryColorClasses(category.color || "gray") : null;

  return (
    <div
      className={`flex items-center justify-between px-2.5 py-1.5 rounded border ${isSelected ? "bg-accent/40" : ""}`}
    >
      <div className="flex items-center gap-2">
        {selectable && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect?.(member.id)}
            disabled={isMe}
            className="shrink-0"
          />
        )}
        <Avatar className="h-6 w-6">
          <AvatarFallback>
            {displayName?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={nicknameValue}
                onChange={(e) => onNicknameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveNickname(member.id);
                  if (e.key === "Escape") onCancelEdit();
                }}
                onBlur={() => onSaveNickname(member.id)}
                placeholder={member.profiles.name}
                className="h-7 w-32 text-sm"
                maxLength={50}
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSaveNickname(member.id)}
                aria-label="확인"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onMouseDown={(e) => e.preventDefault()}
                onClick={onCancelEdit}
                aria-label="취소"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {category && colorClasses && (
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`}
                >
                  {category.name}
                </Badge>
              )}
              <UserPopoverMenu
                userId={member.user_id}
                displayName={displayName}
                groupId={groupId}
                className="font-medium hover:underline text-left"
              >
                {displayName}
              </UserPopoverMenu>
              <MemberBadgeIcons
                groupId={groupId}
                userId={member.user_id}
                joinedAt={member.joined_at}
                role={member.role}
              />
              <button
                onClick={() => onIntroCardOpen(member)}
                className={
                  hasCard(member.user_id)
                    ? "text-primary hover:text-primary/80"
                    : "text-muted-foreground hover:text-foreground"
                }
                title="자기소개 카드"
              >
                <IdCard className="h-3 w-3" />
              </button>
              {(myRole === "leader" || myRole === "sub_leader") && (
                <MemberNotePopover
                  groupId={groupId}
                  targetUserId={member.user_id}
                  targetName={displayName}
                />
              )}
              {!isMe && (
                <PeerFeedbackSendDialog
                  groupId={groupId}
                  currentUserId={currentUserId}
                  receiverId={member.user_id}
                  receiverName={displayName}
                />
              )}
              {isMe && (
                <button
                  onClick={() => onStartEdit(member)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
          {member.nickname && !isEditing && (
            <p className="text-xs text-muted-foreground">{member.profiles.name}</p>
          )}
          {member.profiles.dance_genre?.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {member.profiles.dance_genre.join(", ")}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {myRole === "leader" ? (
          <>
            <PracticePlanSheet
              groupId={groupId}
              userId={member.user_id}
              memberName={displayName}
              memberAvatarUrl={member.profiles.avatar_url}
              currentUserId={currentUserId}
              isLeader={true}
            />
            {categories.length > 0 && (
              <Select
                value={member.category_id || "none"}
                onValueChange={(value) => onCategoryChange(member.id, value)}
              >
                <SelectTrigger className="w-20 h-7 text-xs">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">없음</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={member.role}
              onValueChange={(value) => onRoleChange(member.id, value)}
              disabled={updating === member.id}
            >
              <SelectTrigger className="w-24 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leader">그룹장</SelectItem>
                <SelectItem value="sub_leader">부그룹장</SelectItem>
                <SelectItem value="member">멤버</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemoveRequest(member.id)}
              aria-label="멤버 제거"
            >
              <UserMinus className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </>
        ) : myRole === "sub_leader" && member.role === "member" ? (
          <>
            <Badge variant="secondary">멤버</Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemoveRequest(member.id)}
              aria-label="멤버 제거"
            >
              <UserMinus className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </>
        ) : (
          <Badge
            variant={
              member.role === "leader"
                ? "default"
                : member.role === "sub_leader"
                ? "outline"
                : "secondary"
            }
            className={member.role === "sub_leader" ? "border-blue-300 text-blue-700 bg-blue-50 text-[10px] px-1.5 py-0" : ""}
          >
            {member.role === "leader" ? "그룹장" : member.role === "sub_leader" ? "부그룹장" : "멤버"}
          </Badge>
        )}
      </div>
    </div>
  );
});

const ROLE_LABELS: Record<string, string> = {
  leader: "그룹장",
  sub_leader: "부그룹장",
  member: "멤버",
};

type MemberListProps = {
  members: GroupMemberWithProfile[];
  myRole: "leader" | "sub_leader" | "member" | null;
  currentUserId: string;
  groupId: string;
  categories: MemberCategory[];
  grouped?: boolean;
  onUpdate: () => void;
  // 일괄 선택 관련
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (memberId: string) => void;
};

export function MemberList({
  members,
  myRole,
  currentUserId,
  groupId,
  categories,
  grouped = true,
  onUpdate,
  selectable = false,
  selectedIds = new Set(),
  onToggleSelect,
}: MemberListProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [nicknameValue, setNicknameValue] = useState("");
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [introCardTarget, setIntroCardTarget] = useState<GroupMemberWithProfile | null>(null);
  const supabase = createClient();
  const { hasCard } = useMemberIntroCards(groupId);

  const handleRoleChange = useCallback(async (memberId: string, newRole: string) => {
    setUpdating(memberId);
    const { error } = await supabase
      .from("group_members")
      .update({ role: newRole })
      .eq("id", memberId);
    if (error) { toast.error("역할 변경에 실패했습니다"); setUpdating(null); return; }
    toast.success(`역할이 ${ROLE_LABELS[newRole] ?? newRole}(으)로 변경되었습니다`);
    onUpdate();
    setUpdating(null);
  }, [onUpdate, supabase]);

  const handleRemoveMember = useCallback(async (memberId: string) => {
    const { error } = await supabase.from("group_members").delete().eq("id", memberId);
    if (error) { toast.error("멤버 제거에 실패했습니다"); return; }
    onUpdate();
  }, [onUpdate, supabase]);

  const startEditNickname = useCallback((member: GroupMemberWithProfile) => {
    setEditingNickname(member.id);
    setNicknameValue(member.nickname || "");
  }, []);

  const saveNickname = useCallback(async (memberId: string) => {
    const trimmed = nicknameValue.trim();
    const { error } = await supabase
      .from("group_members")
      .update({ nickname: trimmed || null })
      .eq("id", memberId);
    if (error) { toast.error("닉네임 저장에 실패했습니다"); return; }
    setEditingNickname(null);
    setNicknameValue("");
    onUpdate();
  }, [nicknameValue, onUpdate, supabase]);

  const cancelEditNickname = useCallback(() => {
    setEditingNickname(null);
    setNicknameValue("");
  }, []);

  const handleCategoryChange = useCallback(async (memberId: string, categoryId: string) => {
    const { error } = await supabase
      .from("group_members")
      .update({ category_id: categoryId === "none" ? null : categoryId })
      .eq("id", memberId);
    if (error) { toast.error("카테고리 변경에 실패했습니다"); return; }
    onUpdate();
  }, [onUpdate, supabase]);

  const handleRemoveRequest = useCallback((memberId: string) => {
    setRemoveMemberId(memberId);
  }, []);

  const handleIntroCardOpen = useCallback((member: GroupMemberWithProfile) => {
    setIntroCardTarget(member);
  }, []);

  const confirmDialog = (
    <ConfirmDialog
      open={!!removeMemberId}
      onOpenChange={(open) => { if (!open) setRemoveMemberId(null); }}
      title="멤버 제거"
      description="정말 이 멤버를 제거하시겠습니까?"
      onConfirm={() => { if (removeMemberId) { handleRemoveMember(removeMemberId); setRemoveMemberId(null); } }}
      destructive
    />
  );

  const introCardDialog = introCardTarget ? (
    <MemberIntroCardDialog
      open={!!introCardTarget}
      onOpenChange={(open) => { if (!open) setIntroCardTarget(null); }}
      groupId={groupId}
      targetUserId={introCardTarget.user_id}
      targetUserName={introCardTarget.nickname || introCardTarget.profiles.name}
      targetUserRole={introCardTarget.role}
      currentUserId={currentUserId}
    />
  ) : null;

  const renderItem = (member: GroupMemberWithProfile) => (
    <MemberListItem
      key={member.id}
      member={member}
      myRole={myRole}
      currentUserId={currentUserId}
      groupId={groupId}
      categories={categories}
      selectable={selectable}
      isSelected={selectedIds.has(member.id)}
      isEditing={editingNickname === member.id}
      nicknameValue={nicknameValue}
      updating={updating}
      hasCard={hasCard}
      onToggleSelect={onToggleSelect}
      onRoleChange={handleRoleChange}
      onCategoryChange={handleCategoryChange}
      onStartEdit={startEditNickname}
      onSaveNickname={saveNickname}
      onCancelEdit={cancelEditNickname}
      onNicknameChange={setNicknameValue}
      onRemoveRequest={handleRemoveRequest}
      onIntroCardOpen={handleIntroCardOpen}
    />
  );

  // 카테고리가 없거나 그룹핑 비활성화 시 flat list
  if (categories.length === 0 || !grouped) {
    return <>{confirmDialog}{introCardDialog}<div className="space-y-1.5">{members.map(renderItem)}</div></>;
  }

  // 카테고리별 그룹핑
  const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);
  const grouped_members: { category: MemberCategory | null; members: GroupMemberWithProfile[] }[] = [];

  for (const cat of sortedCategories) {
    const catMembers = members.filter((m) => m.category_id === cat.id);
    if (catMembers.length > 0) {
      grouped_members.push({ category: cat, members: catMembers });
    }
  }

  const uncategorized = members.filter((m) => !m.category_id || !categories.some((c) => c.id === m.category_id));
  if (uncategorized.length > 0) {
    grouped_members.push({ category: null, members: uncategorized });
  }

  return (
    <>{confirmDialog}{introCardDialog}<div className="space-y-4">
      {grouped_members.map((group) => {
        const colorClasses = group.category
          ? getCategoryColorClasses(group.category.color || "gray")
          : null;

        return (
          <div key={group.category?.id || "uncategorized"}>
            <div className="flex items-center gap-2 mb-2">
              {group.category && colorClasses ? (
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-0.5 ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`}
                >
                  {group.category.name}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  카테고리 없음
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{group.members.length}명</span>
            </div>
            <div className="space-y-1.5">
              {group.members.map(renderItem)}
            </div>
          </div>
        );
      })}
    </div></>
  );
}
