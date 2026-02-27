"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPopoverMenu } from "@/components/user/user-popover-menu";
import { UserMinus, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { GroupMemberWithProfile, MemberCategory } from "@/types";
import { getCategoryColorClasses } from "@/types";

type MemberListProps = {
  members: GroupMemberWithProfile[];
  myRole: "leader" | "sub_leader" | "member" | null;
  currentUserId: string;
  groupId: string;
  categories: MemberCategory[];
  grouped?: boolean;
  onUpdate: () => void;
};

export function MemberList({ members, myRole, currentUserId, groupId, categories, grouped = true, onUpdate }: MemberListProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [nicknameValue, setNicknameValue] = useState("");
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const supabase = createClient();

  const ROLE_LABELS: Record<string, string> = {
    leader: "그룹장",
    sub_leader: "부그룹장",
    member: "멤버",
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setUpdating(memberId);
    const { error } = await supabase
      .from("group_members")
      .update({ role: newRole })
      .eq("id", memberId);
    if (error) { toast.error("역할 변경에 실패했습니다"); setUpdating(null); return; }
    toast.success(`역할이 ${ROLE_LABELS[newRole] ?? newRole}(으)로 변경되었습니다`);
    onUpdate();
    setUpdating(null);
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase.from("group_members").delete().eq("id", memberId);
    if (error) { toast.error("멤버 제거에 실패했습니다"); return; }
    onUpdate();
  };

  const startEditNickname = (member: GroupMemberWithProfile) => {
    setEditingNickname(member.id);
    setNicknameValue(member.nickname || "");
  };

  const saveNickname = async (memberId: string) => {
    const trimmed = nicknameValue.trim();
    const { error } = await supabase
      .from("group_members")
      .update({ nickname: trimmed || null })
      .eq("id", memberId);
    if (error) { toast.error("닉네임 저장에 실패했습니다"); return; }
    setEditingNickname(null);
    setNicknameValue("");
    onUpdate();
  };

  const cancelEditNickname = () => {
    setEditingNickname(null);
    setNicknameValue("");
  };

  const handleCategoryChange = async (memberId: string, categoryId: string) => {
    const { error } = await supabase
      .from("group_members")
      .update({ category_id: categoryId === "none" ? null : categoryId })
      .eq("id", memberId);
    if (error) { toast.error("카테고리 변경에 실패했습니다"); return; }
    onUpdate();
  };

  const getCategoryForMember = (member: GroupMemberWithProfile) => {
    if (!member.category_id) return null;
    return categories.find((c) => c.id === member.category_id) || null;
  };

  const getDisplayName = (member: GroupMemberWithProfile) =>
    member.nickname || member.profiles.name;

  const renderMember = (member: GroupMemberWithProfile) => {
    const isMe = member.user_id === currentUserId;
    const isEditingThis = editingNickname === member.id;
    const displayName = getDisplayName(member);
    const category = getCategoryForMember(member);
    const colorClasses = category ? getCategoryColorClasses(category.color || "gray") : null;

    return (
      <div
        key={member.id}
        className="flex items-center justify-between px-2.5 py-1.5 rounded border"
      >
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback>
              {displayName?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            {isEditingThis ? (
              <div className="flex items-center gap-1.5">
                <Input
                  value={nicknameValue}
                  onChange={(e) => setNicknameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveNickname(member.id);
                    if (e.key === "Escape") cancelEditNickname();
                  }}
                  onBlur={() => saveNickname(member.id)}
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
                  onClick={() => saveNickname(member.id)}
                  aria-label="확인"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={cancelEditNickname}
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
                {isMe && (
                  <button
                    onClick={() => startEditNickname(member)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
            {member.nickname && !isEditingThis && (
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
              {categories.length > 0 && (
                <Select
                  value={member.category_id || "none"}
                  onValueChange={(value) => handleCategoryChange(member.id, value)}
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
                onValueChange={(value) => handleRoleChange(member.id, value)}
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
                onClick={() => setRemoveMemberId(member.id)}
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
                onClick={() => setRemoveMemberId(member.id)}
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
  };

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

  // 카테고리가 없거나 그룹핑 비활성화 시 flat list
  if (categories.length === 0 || !grouped) {
    return <>{confirmDialog}<div className="space-y-1.5">{members.map(renderMember)}</div></>;
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
    <>{confirmDialog}<div className="space-y-4">
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
              {group.members.map(renderMember)}
            </div>
          </div>
        );
      })}
    </div></>
  );
}
