"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProjects } from "@/hooks/use-projects";
import { useGroupDetail } from "@/hooks/use-groups";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check } from "lucide-react";

interface InviteToProjectDialogProps {
  userId: string;
  userName: string;
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteToProjectDialog({
  userId,
  userName,
  groupId,
  open,
  onOpenChange,
}: InviteToProjectDialogProps) {
  const { projects, loading: projectsLoading } = useProjects(groupId);
  const { myRole: myGroupRole } = useGroupDetail(groupId);
  const [memberProjectIds, setMemberProjectIds] = useState<Set<string>>(new Set());
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const supabase = createClient();

  // 대상 유저가 이미 가입된 프로젝트 확인
  useEffect(() => {
    if (!open) return;
    const fetchMemberships = async () => {
      setLoadingMemberships(true);
      const projectIds = projects.map((p) => p.id);
      if (projectIds.length === 0) {
        setLoadingMemberships(false);
        return;
      }
      const { data } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", userId)
        .in("project_id", projectIds);
      if (data) {
        setMemberProjectIds(new Set(data.map((m: { project_id: string }) => m.project_id)));
      }
      setLoadingMemberships(false);
    };
    fetchMemberships();
  }, [supabase, userId, open, projects]);

  // 내가 리더인 프로젝트만 표시 (그룹 리더면 전부)
  const [myProjectLeaderIds, setMyProjectLeaderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    const fetchMyRoles = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const projectIds = projects.map((p) => p.id);
      if (projectIds.length === 0) return;
      const { data } = await supabase
        .from("project_members")
        .select("project_id, role")
        .eq("user_id", user.id)
        .in("project_id", projectIds);
      if (data) {
        setMyProjectLeaderIds(
          new Set(data.filter((m: { role: string; project_id: string }) => m.role === "leader").map((m: { project_id: string }) => m.project_id))
        );
      }
    };
    fetchMyRoles();
  }, [supabase, open, projects]);

  const isGroupLeader = myGroupRole === "leader";
  const availableProjects = projects.filter(
    (p) => isGroupLeader || myProjectLeaderIds.has(p.id)
  );

  const handleInvite = async (projectId: string) => {
    setInviting(projectId);
    await supabase.from("project_members").insert({
      project_id: projectId,
      user_id: userId,
      role: "member",
    });
    setInviting(null);
    setInvited((prev) => new Set(prev).add(projectId));
    setMemberProjectIds((prev) => new Set(prev).add(projectId));
  };

  const loading = projectsLoading || loadingMemberships;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{userName}님을 프로젝트에 초대</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : availableProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            초대할 수 있는 프로젝트가 없습니다
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {availableProjects.map((project) => {
              const isMember = memberProjectIds.has(project.id);
              const justInvited = invited.has(project.id);

              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg border"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.type} · {project.status}
                    </p>
                  </div>
                  {isMember ? (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {justInvited ? (
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          초대됨
                        </span>
                      ) : (
                        "이미 멤버"
                      )}
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs shrink-0"
                      onClick={() => handleInvite(project.id)}
                      disabled={inviting === project.id}
                    >
                      {inviting === project.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "초대"
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
