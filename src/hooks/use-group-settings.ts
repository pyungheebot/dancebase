"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAuth } from "@/hooks/use-auth";
import { useBoardCategories } from "@/hooks/use-board";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { invalidateBoardCategories, invalidateGroup } from "@/lib/swr/invalidate";
import { createNotification } from "@/lib/notifications";
import {
  DEFAULT_GROUP_FORM_VALUES,
  type GroupFormValues,
} from "@/components/groups/group-form-fields";
import type { EntityContext } from "@/types/entity-context";
import type { Group, JoinRequestWithProfile } from "@/types";
import type { BoardCategoryRow } from "@/types";

export function useGroupSettings(ctx: EntityContext, group: Group) {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();

  // 공통
  const { pending: saving, execute: executeSave } = useAsyncAction();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 아바타
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // 폼
  const [groupForm, setGroupForm] = useState<GroupFormValues>(DEFAULT_GROUP_FORM_VALUES);
  const [regenerating, setRegenerating] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequestWithProfile[]>([]);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  // 초대 코드
  const [inviteCodeEnabled, setInviteCodeEnabled] = useState(true);
  const [inviteCodeExpiry, setInviteCodeExpiry] = useState<string>("none");
  const [savingInviteSettings, setSavingInviteSettings] = useState(false);

  // 탈퇴/해산
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [dissolvingGroup, setDissolvingGroup] = useState(false);

  // 역할 변경
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);

  // 게시판 카테고리
  const { categories: boardCategoryList, refetch: refetchBoardCategories } = useBoardCategories(ctx.groupId);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  // 확인 다이얼로그 (카테고리 삭제 / 탈퇴 / 해산)
  const deleteCategoryDialog = useConfirmDialog<string>();
  const leaveGroupDialog = useConfirmDialog<"leave">();
  const dissolveGroupDialog = useConfirmDialog<"dissolve">();

  // 그룹 초기화
  useEffect(() => {
    if (group) {
      setGroupForm({
        name: group.name,
        description: group.description || "",
        groupType: group.group_type || "기타",
        visibility: group.visibility,
        joinPolicy: group.join_policy,
        danceGenre: group.dance_genre || [],
        maxMembers: group.max_members?.toString() || "",
      });
      setInviteCodeEnabled(group.invite_code_enabled ?? true);
      setInviteCodeExpiry("none");
    }
  }, [group]);

  // 가입 신청 목록
  useEffect(() => {
    if (!ctx.permissions.canEdit) return;
    const fetchJoinRequests = async () => {
      const { data } = await supabase
        .from("join_requests")
        .select("*, profiles(id, name, avatar_url)")
        .eq("group_id", ctx.groupId)
        .eq("status", "pending")
        .order("requested_at", { ascending: true });
      if (data) setJoinRequests(data as JoinRequestWithProfile[]);
    };
    fetchJoinRequests();
  }, [supabase, ctx.groupId, ctx.permissions.canEdit]);

  // 역할 변경
  const handleRoleChange = async (targetUserId: string, newRole: "leader" | "sub_leader" | "member") => {
    setUpdatingRoleUserId(targetUserId);
    const { error } = await supabase
      .from("group_members")
      .update({ role: newRole })
      .eq("group_id", ctx.groupId)
      .eq("user_id", targetUserId);
    if (error) {
      toast.error("역할 변경에 실패했습니다");
    } else {
      const roleLabel = newRole === "leader" ? "리더" : newRole === "sub_leader" ? "서브리더" : "멤버";
      toast.success(`역할이 ${roleLabel}로 변경되었습니다`);
      invalidateGroup(ctx.groupId);
    }
    setUpdatingRoleUserId(null);
  };

  // 카테고리 추가
  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setAddingCategory(true);
    const { error } = await supabase.from("board_categories").insert({
      group_id: ctx.groupId,
      name,
      sort_order: boardCategoryList.length,
    });
    if (error) {
      toast.error(error.code === "23505" ? "이미 존재하는 카테고리 이름입니다" : "카테고리 추가에 실패했습니다");
    } else {
      toast.success(`"${name}" 카테고리가 추가되었습니다`);
      setNewCategoryName("");
      invalidateBoardCategories(ctx.groupId);
      refetchBoardCategories();
    }
    setAddingCategory(false);
  };

  // 카테고리 삭제 요청 (확인 다이얼로그 열기)
  const handleDeleteCategoryRequest = (category: BoardCategoryRow) => {
    deleteCategoryDialog.requestConfirm(category.id, `"${category.name}"`);
  };

  // 카테고리 삭제 실행
  const handleDeleteCategoryConfirm = async () => {
    const categoryId = deleteCategoryDialog.confirm();
    if (!categoryId) return;
    setDeletingCategoryId(categoryId);
    const { error } = await supabase.from("board_categories").delete().eq("id", categoryId);
    if (error) {
      toast.error("카테고리 삭제에 실패했습니다");
    } else {
      toast.success("카테고리가 삭제되었습니다");
      invalidateBoardCategories(ctx.groupId);
      refetchBoardCategories();
    }
    setDeletingCategoryId(null);
  };

  // 아바타 변경
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("파일 크기는 2MB 이하여야 합니다");
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `group-${ctx.groupId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) {
        toast.error("이미지 업로드에 실패했습니다");
        setAvatarPreview(null);
        return;
      }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from("groups")
        .update({ avatar_url: publicUrl })
        .eq("id", ctx.groupId);
      if (updateError) {
        toast.error("그룹 이미지 저장에 실패했습니다");
        return;
      }
      setAvatarPreview(publicUrl);
      toast.success("그룹 이미지가 변경되었습니다");
    } finally {
      setAvatarUploading(false);
    }
  };

  // 가입 신청 승인
  const handleApproveRequest = async (request: JoinRequestWithProfile) => {
    setProcessingRequest(request.id);
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: request.group_id,
      user_id: request.user_id,
      role: "member",
    });
    if (memberError) {
      toast.error("멤버 추가에 실패했습니다.");
      setProcessingRequest(null);
      return;
    }
    await supabase
      .from("join_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
      .eq("id", request.id);
    setJoinRequests((prev) => prev.filter((r) => r.id !== request.id));
    toast.success(`${request.profiles.name}님을 승인했습니다.`);
    await createNotification({
      userId: request.user_id,
      type: "join_approved",
      title: "가입 승인",
      message: `${group?.name ?? "그룹"} 가입이 승인되었습니다`,
      link: `/groups/${request.group_id}`,
    });
    setProcessingRequest(null);
  };

  // 가입 신청 거부
  const handleRejectRequest = async (request: JoinRequestWithProfile) => {
    setProcessingRequest(request.id);
    await supabase
      .from("join_requests")
      .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
      .eq("id", request.id);
    setJoinRequests((prev) => prev.filter((r) => r.id !== request.id));
    toast.success(`${request.profiles.name}님의 신청을 거부했습니다.`);
    await createNotification({
      userId: request.user_id,
      type: "join_rejected",
      title: "가입 거부",
      message: `${group?.name ?? "그룹"} 가입 신청이 거부되었습니다`,
    });
    setProcessingRequest(null);
  };

  // 초대 코드 재생성
  const handleRegenerateInviteCode = async () => {
    setRegenerating(true);
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const { error } = await supabase
      .from("groups")
      .update({ invite_code: newCode, invite_code_expires_at: null, invite_code_enabled: true })
      .eq("id", ctx.groupId);
    if (error) {
      toast.error("초대 코드 재생성에 실패했습니다");
    } else {
      setInviteCodeExpiry("none");
      setInviteCodeEnabled(true);
      toast.success("초대 코드가 재생성되었습니다");
    }
    setRegenerating(false);
  };

  // 초대 코드 설정 저장
  const handleSaveInviteSettings = async () => {
    setSavingInviteSettings(true);
    let expiresAt: string | null = null;
    if (inviteCodeExpiry !== "none") {
      const days = parseInt(inviteCodeExpiry, 10);
      const d = new Date();
      d.setDate(d.getDate() + days);
      expiresAt = d.toISOString();
    }
    const { error } = await supabase
      .from("groups")
      .update({ invite_code_enabled: inviteCodeEnabled, invite_code_expires_at: expiresAt })
      .eq("id", ctx.groupId);
    if (error) {
      toast.error("초대 코드 설정 저장에 실패했습니다");
    } else {
      toast.success("초대 코드 설정이 저장되었습니다");
    }
    setSavingInviteSettings(false);
  };

  // 그룹 탈퇴 요청 (확인 다이얼로그 열기)
  const handleLeaveGroupRequest = () => {
    leaveGroupDialog.requestConfirm("leave", group.name);
  };

  // 그룹 탈퇴 실행
  const handleLeaveGroupConfirm = async () => {
    leaveGroupDialog.confirm();
    setLeavingGroup(true);
    if (!user) {
      toast.error("로그인이 필요합니다.");
      setLeavingGroup(false);
      return;
    }
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", ctx.groupId)
      .eq("user_id", user.id);
    if (error) {
      toast.error("그룹 탈퇴에 실패했습니다.");
      setLeavingGroup(false);
      return;
    }
    toast.success("그룹에서 탈퇴했습니다.");
    router.push("/dashboard");
  };

  // 그룹 해산 요청 (확인 다이얼로그 열기)
  const handleDissolveGroupRequest = () => {
    dissolveGroupDialog.requestConfirm("dissolve", group.name);
  };

  // 그룹 해산 실행
  const handleDissolveGroupConfirm = async () => {
    dissolveGroupDialog.confirm();
    setDissolvingGroup(true);
    const { error } = await supabase.from("groups").delete().eq("id", ctx.groupId);
    if (error) {
      toast.error("그룹 해산에 실패했습니다.");
      setDissolvingGroup(false);
      return;
    }
    toast.success("그룹이 해산되었습니다.");
    router.push("/dashboard");
  };

  // 기본 정보 저장
  const handleSave = async () => {
    setMessage(null);
    await executeSave(async () => {
      const { error } = await supabase
        .from("groups")
        .update({
          name: groupForm.name,
          description: groupForm.description || null,
          group_type: groupForm.groupType,
          visibility: groupForm.visibility,
          join_policy: groupForm.joinPolicy,
          dance_genre: groupForm.danceGenre,
          max_members: groupForm.maxMembers ? parseInt(groupForm.maxMembers, 10) : null,
        })
        .eq("id", ctx.groupId);
      if (error) {
        setMessage({ type: "error", text: "설정 저장에 실패했습니다" });
      } else {
        setMessage({ type: "success", text: "설정이 저장되었습니다" });
      }
    });
  };

  const myGroupRole =
    ctx.members.find((m) => m.userId === user?.id)?.role ??
    (ctx.permissions.canEdit ? "leader" : "member");

  return {
    user,
    saving,
    message,
    avatarPreview,
    avatarUploading,
    groupForm,
    setGroupForm,
    regenerating,
    joinRequests,
    processingRequest,
    inviteCodeEnabled,
    setInviteCodeEnabled,
    inviteCodeExpiry,
    setInviteCodeExpiry,
    savingInviteSettings,
    leavingGroup,
    dissolvingGroup,
    updatingRoleUserId,
    boardCategoryList,
    newCategoryName,
    setNewCategoryName,
    addingCategory,
    deletingCategoryId,
    isGroupLeader: myGroupRole === "leader",
    // 확인 다이얼로그 상태 (외부 노출용)
    deleteCategoryDialog,
    leaveGroupDialog,
    dissolveGroupDialog,
    handleRoleChange,
    handleAddCategory,
    // 카테고리 삭제: GroupCategorySection이 자체 ConfirmDialog를 가지므로 직접 실행 버전도 유지
    handleDeleteCategory: handleDeleteCategoryConfirm,
    handleDeleteCategoryRequest,
    handleDeleteCategoryConfirm,
    handleAvatarChange,
    handleApproveRequest,
    handleRejectRequest,
    handleRegenerateInviteCode,
    handleSaveInviteSettings,
    // 탈퇴/해산: GroupDangerSection이 자체 다이얼로그를 가지므로 실행 버전도 유지
    handleLeaveGroup: handleLeaveGroupConfirm,
    handleLeaveGroupRequest,
    handleLeaveGroupConfirm,
    handleDissolveGroup: handleDissolveGroupConfirm,
    handleDissolveGroupRequest,
    handleDissolveGroupConfirm,
    handleSave,
  };
}
