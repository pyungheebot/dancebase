"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { X, Plus, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useAsyncAction } from "@/hooks/use-async-action";
import type { EntityContext } from "@/types/entity-context";
import type { Project } from "@/types";
import {
  ProjectFormFields,
  DEFAULT_PROJECT_FORM_VALUES,
  type ProjectFormValues,
} from "@/components/projects/project-form-fields";
import { useSharedGroups } from "@/hooks/use-projects";
import { useGroups } from "@/hooks/use-groups";
import { ReminderSettingsSection } from "@/components/settings/reminder-settings-section";

type ProjectSettingsContentProps = {
  ctx: EntityContext;
  project: Project;
};

export function ProjectSettingsContent({ ctx, project }: ProjectSettingsContentProps) {
  const router = useRouter();
  const supabase = createClient();

  const { pending: saving, execute: executeSave } = useAsyncAction();
  const { pending: deleting, execute: executeDelete } = useAsyncAction();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [projectForm, setProjectForm] = useState<ProjectFormValues>(DEFAULT_PROJECT_FORM_VALUES);

  // 공유 그룹 관리
  const sharedGroupsHook = useSharedGroups(ctx.projectId ?? "");
  const { groups: allGroups } = useGroups();

  // 프로젝트 초기화
  useEffect(() => {
    if (project) {
      setProjectForm({
        name: project.name,
        description: project.description || "",
        type: project.type,
        status: project.status,
        visibility: project.visibility ?? "private",
        features: (["board", "schedule", "attendance", "finance"] as const).filter(
          (f) => ctx.features[f]
        ),
        start_date: project.start_date ?? "",
        end_date: project.end_date ?? "",
      });
    }
  }, [project, ctx.features]);

  // ============================================
  // 핸들러
  // ============================================

  const handleProjectFieldChange = <K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K]
  ) => {
    setProjectForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await executeSave(async () => {
      if (!ctx.projectId) return;

      const { error } = await supabase
        .from("projects")
        .update({
          name: projectForm.name.trim(),
          description: projectForm.description.trim() || null,
          type: projectForm.type,
          status: projectForm.status,
          visibility: projectForm.visibility,
          start_date: projectForm.start_date || null,
          end_date: projectForm.end_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ctx.projectId);

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
    });
  };

  const handleDelete = async () => {
    if (!ctx.projectId) return;
    await executeDelete(async () => {
      const { error } = await supabase.from("projects").delete().eq("id", ctx.projectId!);
      if (error) {
        toast.error("프로젝트 삭제에 실패했습니다");
        return;
      }
      router.push(`/groups/${ctx.groupId}/projects`);
    });
  };

  // ============================================
  // 렌더링
  // ============================================

  const { features } = ctx;

  return (
    <>
      <h2 className="text-xs font-medium mb-2">프로젝트 설정</h2>

      <div className="max-w-md space-y-3">
        <ProjectFormFields
          values={projectForm}
          onChange={handleProjectFieldChange}
          showStatus
        />

        {/* 그룹 공유 */}
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

        {/* 알림 설정 (리더 전용) */}
        {ctx.permissions.canEdit && ctx.projectId && (
          <ReminderSettingsSection entityType="project" entityId={ctx.projectId} />
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
    </>
  );
}
