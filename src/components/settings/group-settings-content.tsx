"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Save,
  RefreshCw,
  X,
  Check,
  ArrowUpRight,
  Plus,
  AlertTriangle,
  UserPlus,
  Camera,
  LayoutList,
  Trash2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import { useAsyncAction } from "@/hooks/use-async-action";
import { formatYearMonthDay } from "@/lib/date-utils";
import type { EntityContext } from "@/types/entity-context";
import type {
  Group,
  JoinRequestWithProfile,
  BoardCategoryRow,
} from "@/types";
import {
  GroupFormFields,
  DEFAULT_GROUP_FORM_VALUES,
  type GroupFormValues,
} from "@/components/groups/group-form-fields";
import { useBoardCategories } from "@/hooks/use-board";
import { invalidateBoardCategories, invalidateGroup } from "@/lib/swr/invalidate";
import { createNotification } from "@/lib/notifications";
import { useAuth } from "@/hooks/use-auth";
import { ActivityLogSection } from "@/components/settings/activity-log-section";
import { ReminderSettingsSection } from "@/components/settings/reminder-settings-section";
import { PermissionAuditSection } from "@/components/settings/permission-audit-section";
import { NotificationPreferencesSection } from "@/components/settings/notification-preferences-section";
import { NotificationRulesBuilder } from "@/components/settings/notification-rules-builder";
import { GroupRulesEditor } from "@/components/groups/group-rules-editor";
import { PaymentMethodManager } from "@/components/finance/payment-method-manager";
import { ShareButton } from "@/components/shared/share-button";

type GroupSettingsContentProps = {
  ctx: EntityContext;
  group: Group;
};

export function GroupSettingsContent({ ctx, group }: GroupSettingsContentProps) {
  const router = useRouter();
  const supabase = createClient();

  // 공통 state
  const { pending: saving, execute: executeSave } = useAsyncAction();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 그룹 아바타 state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // 그룹 폼 state
  const [groupForm, setGroupForm] = useState<GroupFormValues>(DEFAULT_GROUP_FORM_VALUES);
  const [regenerating, setRegenerating] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequestWithProfile[]>([]);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  // 초대 코드 만료/비활성화 state
  const [inviteCodeEnabled, setInviteCodeEnabled] = useState(true);
  const [inviteCodeExpiry, setInviteCodeExpiry] = useState<string>("none");
  const [savingInviteSettings, setSavingInviteSettings] = useState(false);

  // 그룹 탈퇴/해산 state
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);
  const [dissolveNameInput, setDissolveNameInput] = useState("");
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [dissolvingGroup, setDissolvingGroup] = useState(false);

  // 현재 로그인 사용자
  const { user } = useAuth();

  // 역할 변경 state
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);

  // 게시판 카테고리 관리
  const { categories: boardCategoryList, refetch: refetchBoardCategories } = useBoardCategories(ctx.groupId);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<BoardCategoryRow | null>(null);

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

  // 가입 신청 목록 불러오기
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

  // ============================================
  // 역할 관리 핸들러
  // ============================================

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

  // ============================================
  // 게시판 카테고리 핸들러
  // ============================================

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
      if (error.code === "23505") {
        toast.error("이미 존재하는 카테고리 이름입니다");
      } else {
        toast.error("카테고리 추가에 실패했습니다");
      }
    } else {
      toast.success(`"${name}" 카테고리가 추가되었습니다`);
      setNewCategoryName("");
      invalidateBoardCategories(ctx.groupId);
      refetchBoardCategories();
    }
    setAddingCategory(false);
  };

  const handleDeleteCategory = async (category: BoardCategoryRow) => {
    setDeletingCategoryId(category.id);
    const { error } = await supabase
      .from("board_categories")
      .delete()
      .eq("id", category.id);
    if (error) {
      toast.error("카테고리 삭제에 실패했습니다");
    } else {
      toast.success(`"${category.name}" 카테고리가 삭제되었습니다`);
      invalidateBoardCategories(ctx.groupId);
      refetchBoardCategories();
    }
    setDeletingCategoryId(null);
    setCategoryToDelete(null);
  };

  // ============================================
  // 그룹 아바타 핸들러
  // ============================================

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("파일 크기는 2MB 이하여야 합니다");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

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

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

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
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = "";
    }
  };

  // ============================================
  // 그룹 핸들러
  // ============================================

  const handleGroupFieldChange = <K extends keyof GroupFormValues>(key: K, value: GroupFormValues[K]) => {
    setGroupForm((prev) => ({ ...prev, [key]: value }));
  };

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

  const handleRegenerateInviteCode = async () => {
    setRegenerating(true);
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const { error } = await supabase
      .from("groups")
      .update({
        invite_code: newCode,
        invite_code_expires_at: null,
        invite_code_enabled: true,
      })
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
      .update({
        invite_code_enabled: inviteCodeEnabled,
        invite_code_expires_at: expiresAt,
      })
      .eq("id", ctx.groupId);
    if (error) {
      toast.error("초대 코드 설정 저장에 실패했습니다");
    } else {
      toast.success("초대 코드 설정이 저장되었습니다");
    }
    setSavingInviteSettings(false);
  };

  // ============================================
  // 그룹 탈퇴/해산 핸들러
  // ============================================

  const handleLeaveGroup = async () => {
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

  const handleDissolveGroup = async () => {
    setDissolvingGroup(true);
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", ctx.groupId);
    if (error) {
      toast.error("그룹 해산에 실패했습니다.");
      setDissolvingGroup(false);
      return;
    }
    toast.success("그룹이 해산되었습니다.");
    router.push("/dashboard");
  };

  // ============================================
  // 저장 핸들러
  // ============================================

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

  // ============================================
  // 렌더링
  // ============================================

  const { features } = ctx;

  const myGroupRole =
    ctx.members.find((m) => m.userId === user?.id)?.role ??
    (ctx.permissions.canEdit ? "leader" : "member");
  const isGroupLeader = myGroupRole === "leader";

  return (
    <>
      {/* 가입 신청 관리 */}
      {features.joinRequests && group?.join_policy === "approval" && (
        <Card className="mb-3 max-w-2xl">
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
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {req.profiles.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
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
                      onClick={() => handleApproveRequest(req)}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      승인
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive"
                      disabled={processingRequest === req.id}
                      onClick={() => handleRejectRequest(req)}
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

      {/* 상위 그룹 정보 (하위그룹인 경우) */}
      {ctx.parentGroupId && ctx.breadcrumbs.length > 0 && (
        <div className="mb-2 text-xs text-muted-foreground">
          상위 그룹:{" "}
          <Link
            href={ctx.breadcrumbs[ctx.breadcrumbs.length - 1].href}
            className="inline-flex items-center gap-0.5 text-foreground hover:underline"
          >
            {ctx.breadcrumbs[ctx.breadcrumbs.length - 1].label}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      <h2 className="text-xs font-medium mb-2">그룹 설정</h2>

      {/* 메시지 표시 */}
      {message && (
        <div
          className={`mb-2 p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-4 max-w-2xl">
        {/* 그룹 이미지 업로드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-semibold">그룹 이미지</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 rounded-sm">
                  <AvatarImage
                    src={avatarPreview ?? group?.avatar_url ?? undefined}
                    alt={group?.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-sm text-lg">
                    {group?.name?.charAt(0)?.toUpperCase() || "G"}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {avatarUploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Camera className="h-3 w-3" />
                  )}
                </button>
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <p className="text-sm font-medium">그룹 대표 이미지</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, GIF (최대 2MB)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <GroupFormFields values={groupForm} onChange={handleGroupFieldChange} />

        {/* 초대 코드 */}
        {features.memberInvite && group && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-semibold">초대 코드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  value={inviteCodeEnabled ? group.invite_code : "비활성화됨"}
                  readOnly
                  className={`font-mono ${!inviteCodeEnabled ? "text-muted-foreground" : ""}`}
                />
                <Button
                  variant="outline"
                  onClick={handleRegenerateInviteCode}
                  disabled={regenerating}
                >
                  {regenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">재생성</span>
                </Button>
                {inviteCodeEnabled && (
                  <ShareButton
                    title={`${group.name} 그룹 초대`}
                    text={`DanceBase에서 "${group.name}" 그룹에 참여하세요!`}
                    url={`${typeof window !== "undefined" ? window.location.origin : ""}/join/${group.invite_code}`}
                    label="초대 공유"
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                재생성하면 기존 초대 코드는 무효화되며 만료일이 초기화됩니다
              </p>

              <Separator />

              {/* 활성화/비활성화 토글 */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">초대 코드 활성화</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    비활성화하면 기존 코드로 참여할 수 없습니다
                  </p>
                </div>
                <Switch
                  checked={inviteCodeEnabled}
                  onCheckedChange={setInviteCodeEnabled}
                />
              </div>

              {!inviteCodeEnabled && (
                <div className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-[11px] text-yellow-700 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300">
                  초대 코드가 비활성화되어 있습니다. 멤버 초대를 원하면 활성화하세요.
                </div>
              )}

              {/* 만료일 설정 */}
              <div className="space-y-1.5">
                <Label className="text-xs">만료 기간 설정</Label>
                <Select
                  value={inviteCodeExpiry}
                  onValueChange={setInviteCodeExpiry}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="만료 기간 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">만료 없음</SelectItem>
                    <SelectItem value="1" className="text-xs">1일 후 만료</SelectItem>
                    <SelectItem value="7" className="text-xs">7일 후 만료</SelectItem>
                    <SelectItem value="30" className="text-xs">30일 후 만료</SelectItem>
                  </SelectContent>
                </Select>
                {inviteCodeExpiry !== "none" && (
                  <p className="text-[11px] text-muted-foreground">
                    저장 시점부터 {inviteCodeExpiry}일 후에 초대 코드가 만료됩니다
                  </p>
                )}
              </div>

              <Button
                size="sm"
                className="h-7 text-xs w-full"
                onClick={handleSaveInviteSettings}
                disabled={savingInviteSettings}
              >
                {savingInviteSettings ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                초대 코드 설정 저장
              </Button>
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
                  const isSelf = member.userId === user?.id;
                  const isUpdating = updatingRoleUserId === member.userId;
                  return (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between px-2.5 py-2 rounded-md border bg-muted/30"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={member.profile.avatar_url ?? undefined} alt={member.profile.name} />
                          <AvatarFallback className="text-[10px]">
                            {member.profile.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
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
                            handleRoleChange(member.userId, val as "leader" | "sub_leader" | "member")
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

        {/* 게시판 카테고리 관리 (리더 전용) */}
        {isGroupLeader && features.board && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <LayoutList className="h-3.5 w-3.5" />
                게시판 카테고리
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[11px] text-muted-foreground">
                카테고리가 없으면 기본 카테고리(공지사항, 잡담, 정보 등)를 사용합니다.
              </p>

              {boardCategoryList.length > 0 ? (
                <div className="space-y-1">
                  {boardCategoryList.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-md border bg-muted/30"
                    >
                      <span className="text-xs font-medium">{cat.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        disabled={deletingCategoryId === cat.id}
                        onClick={() => setCategoryToDelete(cat)}
                        aria-label="카테고리 삭제"
                      >
                        {deletingCategoryId === cat.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  커스텀 카테고리가 없습니다
                </p>
              )}

              <div className="flex gap-1.5">
                <Input
                  placeholder="새 카테고리 이름"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="h-7 text-xs flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !addingCategory) handleAddCategory();
                  }}
                  maxLength={20}
                />
                <Button
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={handleAddCategory}
                  disabled={addingCategory || !newCategoryName.trim()}
                >
                  {addingCategory ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 정산 수단 관리 (리더 전용) */}
        {isGroupLeader && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                정산 수단 관리
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground mb-3">
                멤버에게 정산 요청 시 표시될 계좌 또는 간편결제 정보를 등록합니다.
              </p>
              <PaymentMethodManager groupId={ctx.groupId} />
            </CardContent>
          </Card>
        )}

        {/* 그룹 규칙/공지 배너 (리더/서브리더) */}
        {(ctx.permissions.canEdit || ctx.permissions.canManageMembers) && (
          <GroupRulesEditor
            groupId={ctx.groupId}
            canEdit={ctx.permissions.canEdit || ctx.permissions.canManageMembers}
          />
        )}

        {/* 알림 설정 (리더 전용) */}
        {isGroupLeader && (
          <ReminderSettingsSection entityType="group" entityId={ctx.groupId} />
        )}

        {/* 개인 알림 구독 설정 (모든 멤버) */}
        <NotificationPreferencesSection
          groupId={ctx.groupId}
          userId={user?.id}
        />

        {/* 알림 규칙 빌더 (리더 전용) */}
        {isGroupLeader && (
          <NotificationRulesBuilder groupId={ctx.groupId} />
        )}

        {/* 활동 기록 (리더 전용) */}
        {isGroupLeader && (
          <ActivityLogSection entityType="group" entityId={ctx.groupId} />
        )}

        {/* 권한 감사 로그 (리더 전용) */}
        {isGroupLeader && (
          <PermissionAuditSection groupId={ctx.groupId} />
        )}

        <Button onClick={handleSave} disabled={saving || !groupForm.name.trim()} className="w-full">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          설정 저장
        </Button>

        {/* 위험 구역 */}
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-xs font-semibold text-destructive">위험 구역</span>
          </div>

          {/* 그룹 탈퇴 (일반 멤버 전용) */}
          {!isGroupLeader && (
            <div className="rounded-lg border border-destructive/30 p-3 space-y-2">
              <div>
                <p className="text-xs font-medium">그룹 탈퇴</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  그룹에서 탈퇴하면 모든 접근 권한을 잃게 됩니다.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setShowLeaveConfirm(true)}
                disabled={leavingGroup}
              >
                {leavingGroup ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                그룹 탈퇴
              </Button>
            </div>
          )}

          {/* 리더인 경우 탈퇴 불가 안내 */}
          {isGroupLeader && (
            <div className="rounded-lg border border-destructive/30 p-3 space-y-2">
              <div>
                <p className="text-xs font-medium">그룹 탈퇴</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  리더는 직접 탈퇴할 수 없습니다. 다른 멤버에게 리더 권한을 위임한 후 탈퇴하세요.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled
              >
                그룹 탈퇴 불가
              </Button>
            </div>
          )}

          {/* 그룹 해산 (리더 전용) */}
          {isGroupLeader && (
            <div className="rounded-lg border border-destructive/30 p-3 space-y-2">
              <div>
                <p className="text-xs font-medium">그룹 해산</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  그룹을 해산하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setDissolveNameInput("");
                  setShowDissolveConfirm(true);
                }}
                disabled={dissolvingGroup}
              >
                {dissolvingGroup ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                그룹 해산
              </Button>
            </div>
          )}
        </div>

        {/* 카테고리 삭제 확인 다이얼로그 */}
        <ConfirmDialog
          open={!!categoryToDelete}
          onOpenChange={(open) => { if (!open) setCategoryToDelete(null); }}
          title="카테고리 삭제"
          description={`"${categoryToDelete?.name}" 카테고리를 삭제하시겠습니까? 기존 게시글의 카테고리 값은 유지됩니다.`}
          onConfirm={() => { if (categoryToDelete) handleDeleteCategory(categoryToDelete); }}
          destructive
        />

        {/* 그룹 탈퇴 확인 다이얼로그 */}
        <ConfirmDialog
          open={showLeaveConfirm}
          onOpenChange={setShowLeaveConfirm}
          title="그룹 탈퇴"
          description="정말 이 그룹을 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          onConfirm={handleLeaveGroup}
          destructive
        />

        {/* 그룹 해산 확인 다이얼로그 */}
        <AlertDialog open={showDissolveConfirm} onOpenChange={setShowDissolveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>그룹 해산</AlertDialogTitle>
              <AlertDialogDescription>
                정말 이 그룹을 해산하시겠습니까? 모든 데이터가 삭제되며 되돌릴 수 없습니다.
                <br />
                확인을 위해 아래에 그룹 이름 <strong>&quot;{group?.name}&quot;</strong>을 입력하세요.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="px-1 pb-2">
              <Input
                placeholder={group?.name ?? "그룹 이름"}
                value={dissolveNameInput}
                onChange={(e) => setDissolveNameInput(e.target.value)}
                className="text-sm"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDissolveNameInput("")}>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDissolveGroup}
                disabled={dissolveNameInput !== group?.name || dissolvingGroup}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {dissolvingGroup ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                해산
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
