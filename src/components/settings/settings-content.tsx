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
import { Loader2, Save, RefreshCw, X, Check, ArrowUpRight, Plus, Share2, AlertTriangle, UserPlus, Camera, LayoutList, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { EntityContext } from "@/types/entity-context";
import type {
  Group,
  Project,
  FinanceRole,
  JoinRequestWithProfile,
  BoardCategoryRow,
} from "@/types";
import {
  GroupFormFields,
  DEFAULT_GROUP_FORM_VALUES,
  type GroupFormValues,
} from "@/components/groups/group-form-fields";
import {
  ProjectFormFields,
  DEFAULT_PROJECT_FORM_VALUES,
  type ProjectFormValues,
} from "@/components/projects/project-form-fields";
import { useSharedGroups } from "@/hooks/use-projects";
import { useGroups } from "@/hooks/use-groups";
import { useBoardCategories } from "@/hooks/use-board";
import { invalidateBoardCategories } from "@/lib/swr/invalidate";

type SettingsContentProps = {
  ctx: EntityContext;
  group?: Group | null;
  financeRole?: FinanceRole | null;
  project?: Project | null;
};

export function SettingsContent({
  ctx,
  group,
  financeRole,
  project,
}: SettingsContentProps) {
  const isGroup = !ctx.projectId;
  const router = useRouter();
  const supabase = createClient();

  // 공통 state
  const [saving, setSaving] = useState(false);
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

  // 프로젝트 폼 state
  const [projectForm, setProjectForm] = useState<ProjectFormValues>(DEFAULT_PROJECT_FORM_VALUES);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 그룹 탈퇴/해산 state
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);
  const [dissolveNameInput, setDissolveNameInput] = useState("");
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [dissolvingGroup, setDissolvingGroup] = useState(false);

  // 공유 그룹 관리 (프로젝트 전용)
  const sharedGroupsHook = useSharedGroups(ctx.projectId ?? "");
  const { groups: allGroups } = useGroups();

  // 게시판 카테고리 관리 (그룹 전용)
  const { categories: boardCategoryList, refetch: refetchBoardCategories } = useBoardCategories(ctx.groupId);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<BoardCategoryRow | null>(null);

  // 그룹 초기화
  useEffect(() => {
    if (isGroup && group) {
      setGroupForm({
        name: group.name,
        description: group.description || "",
        groupType: group.group_type || "기타",
        visibility: group.visibility,
        joinPolicy: group.join_policy,
        danceGenre: group.dance_genre || [],
        maxMembers: group.max_members?.toString() || "",
      });
      // 초대 코드 설정 초기화
      setInviteCodeEnabled(group.invite_code_enabled ?? true);
      if (group.invite_code_expires_at) {
        // 만료일이 설정된 경우 "custom"으로 표시 (현재는 preset만 지원하므로 none으로 초기화)
        setInviteCodeExpiry("none");
      } else {
        setInviteCodeExpiry("none");
      }
    }
  }, [isGroup, group]);

  // 프로젝트 초기화
  useEffect(() => {
    if (!isGroup && project) {
      setProjectForm({
        name: project.name,
        description: project.description || "",
        type: project.type,
        status: project.status,
        visibility: project.visibility ?? "private",
        features: (['board', 'schedule', 'attendance', 'finance'] as const).filter(f => ctx.features[f]),
      });
    }
  }, [isGroup, project]);

  // 가입 신청 목록 불러오기 (그룹 전용)
  useEffect(() => {
    if (!isGroup || !ctx.permissions.canEdit) return;
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
  }, [supabase, ctx.groupId, isGroup, ctx.permissions.canEdit]);

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
    const { data: { user } } = await supabase.auth.getUser();
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
    setProcessingRequest(null);
  };

  const handleRejectRequest = async (request: JoinRequestWithProfile) => {
    setProcessingRequest(request.id);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from("join_requests")
      .update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: user?.id })
      .eq("id", request.id);
    setJoinRequests((prev) => prev.filter((r) => r.id !== request.id));
    toast.success(`${request.profiles.name}님의 신청을 거부했습니다.`);
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
    // 만료일 계산
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
    const { data: { user } } = await supabase.auth.getUser();
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
  // 프로젝트 핸들러
  // ============================================

  const handleProjectFieldChange = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => {
    setProjectForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDelete = async () => {
    if (!ctx.projectId) return;
    setDeleting(true);
    const { error } = await supabase.from("projects").delete().eq("id", ctx.projectId);
    if (error) {
      toast.error("프로젝트 삭제에 실패했습니다");
      setDeleting(false);
      return;
    }
    router.push(`/groups/${ctx.groupId}/projects`);
  };

  // ============================================
  // 공통 저장 핸들러
  // ============================================

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    if (ctx.projectId) {
      // 프로젝트 기본 정보 저장
      const { error } = await supabase
        .from("projects")
        .update({
          name: projectForm.name.trim(),
          description: projectForm.description.trim() || null,
          type: projectForm.type,
          status: projectForm.status,
          visibility: projectForm.visibility,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ctx.projectId);

      // 기능 토글 저장: entity_features 테이블 반영
      const allFeatures = ["board", "schedule", "attendance", "finance"] as const;
      const featureUpdates = allFeatures.map((f) =>
        supabase
          .from("entity_features")
          .update({ enabled: projectForm.features.includes(f) })
          .eq("entity_type", "project")
          .eq("entity_id", ctx.projectId!)
          .eq("feature", f)
      );
      const featureResults = await Promise.all(featureUpdates);
      const featureError = featureResults.some((r) => r.error);

      if (error || featureError) {
        toast.error("프로젝트 저장에 실패했습니다");
      } else {
        toast.success("프로젝트가 저장되었습니다");
      }
    } else {
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
    }
    setSaving(false);
  };

  // ============================================
  // 렌더링
  // ============================================

  const { features } = ctx;

  // 현재 로그인 사용자의 그룹 내 역할 판별
  // ctx.permissions.canEdit이 true이면 leader로 간주 (그룹 설정에서만 유효)
  const myGroupRole = isGroup
    ? (ctx.permissions.canEdit ? "leader" : "member")
    : null;
  const isGroupLeader = myGroupRole === "leader";

  return (
    <>
      {/* 가입 신청 관리 (그룹 전용, join_policy가 approval인 경우 항상 표시) */}
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
                        {new Date(req.requested_at).toLocaleDateString("ko-KR")}
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
      {isGroup && ctx.parentGroupId && ctx.breadcrumbs.length > 0 && (
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

      <h2 className="text-xs font-medium mb-2">
        {isGroup ? "그룹 설정" : "프로젝트 설정"}
      </h2>

      {/* 그룹 메시지 표시 */}
      {isGroup && message && (
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

      {isGroup ? (
        /* ============================================ */
        /* 그룹 설정 */
        /* ============================================ */
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

          {/* 초대 코드 (설정 전용) */}
          {features.memberInvite && group && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-semibold">초대 코드</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 초대 코드 표시 + 재생성 */}
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

                {/* 비활성화 시 안내 메시지 */}
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

                {/* 저장 버튼 */}
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

                {/* 카테고리 목록 */}
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

                {/* 카테고리 추가 */}
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

          {/* 그룹 해산 확인 다이얼로그 (이름 입력 이중 확인) */}
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
      ) : (
        /* ============================================ */
        /* 프로젝트 설정 */
        /* ============================================ */
        <div className="max-w-md space-y-3">
          <ProjectFormFields
            values={projectForm}
            onChange={handleProjectFieldChange}
            showStatus
          />

          {/* 그룹 공유 (설정 전용) */}
          {ctx.permissions.canEdit && ctx.projectId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-semibold flex items-center gap-1">
                  <Share2 className="h-3.5 w-3.5" />
                  그룹 공유
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sharedGroupsHook.sharedGroups.length > 0 ? (
                  <div className="space-y-1.5">
                    {sharedGroupsHook.sharedGroups.map((sg) => (
                      <div key={sg.group_id} className="flex items-center justify-between p-2 rounded-lg border">
                        <span className="text-sm">{sg.groups?.name ?? sg.group_id}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs text-destructive"
                          onClick={async () => {
                            const { error } = await sharedGroupsHook.removeSharedGroup(sg.group_id);
                            if (error) toast.error("공유 해제에 실패했습니다");
                            else toast.success("공유가 해제되었습니다");
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          해제
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">공유된 그룹이 없습니다</p>
                )}
                {(() => {
                  const sharedIds = new Set(sharedGroupsHook.sharedGroups.map((sg) => sg.group_id));
                  const available = allGroups.filter(
                    (g) => g.id !== ctx.groupId && !sharedIds.has(g.id)
                  );
                  if (available.length === 0) return null;
                  return (
                    <div>
                      <Label className="text-xs">그룹 추가</Label>
                      <div className="mt-1.5 space-y-1">
                        {available.map((g) => (
                          <button
                            key={g.id}
                            onClick={async () => {
                              const { error } = await sharedGroupsHook.addSharedGroup(g.id);
                              if (error) toast.error("공유 추가에 실패했습니다");
                              else toast.success(`${g.name}에 공유되었습니다`);
                            }}
                            className="flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded-md border text-sm hover:bg-muted transition-colors"
                          >
                            <Plus className="h-3 w-3 text-muted-foreground" />
                            {g.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving || !projectForm.name.trim()}
          >
            {saving ? "저장 중..." : "저장"}
          </Button>

          {/* 삭제 (프로젝트 전용) */}
          {features.deletable && (
            <>
              <Separator />
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
              >
                {deleting ? "삭제 중..." : "프로젝트 삭제"}
              </Button>
              <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="프로젝트 삭제"
                description="정말 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                onConfirm={handleDelete}
                destructive
              />
            </>
          )}
        </div>
      )}
    </>
  );
}
