"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Loader2, Save, RefreshCw, X, Check, ArrowUpRight, Plus, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { EntityContext } from "@/types/entity-context";
import type {
  Group,
  Project,
  FinanceRole,
  JoinRequestWithProfile,
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

  // 그룹 폼 state
  const [groupForm, setGroupForm] = useState<GroupFormValues>(DEFAULT_GROUP_FORM_VALUES);
  const [regenerating, setRegenerating] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequestWithProfile[]>([]);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  // 프로젝트 폼 state
  const [projectForm, setProjectForm] = useState<ProjectFormValues>(DEFAULT_PROJECT_FORM_VALUES);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 공유 그룹 관리 (프로젝트 전용)
  const sharedGroupsHook = useSharedGroups(ctx.projectId ?? "");
  const { groups: allGroups } = useGroups();

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
      .update({ invite_code: newCode })
      .eq("id", ctx.groupId);
    if (error) {
      setMessage({ type: "error", text: "초대 코드 재생성에 실패했습니다" });
    } else {
      setMessage({ type: "success", text: `새 초대 코드: ${newCode}` });
    }
    setRegenerating(false);
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

  return (
    <>
      {/* 가입 신청 관리 (그룹 전용) */}
      {features.joinRequests && joinRequests.length > 0 && (
        <Card className="mb-3 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-xs font-semibold">가입 신청 ({joinRequests.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {joinRequests.map((req) => (
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
            ))}
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
          <GroupFormFields values={groupForm} onChange={handleGroupFieldChange} />

          {/* 초대 코드 (설정 전용) */}
          {features.memberInvite && group && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xs font-semibold">초대 코드</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input value={group.invite_code} readOnly className="font-mono" />
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
                  재생성하면 기존 초대 코드는 무효화됩니다
                </p>
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
