"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { EntityMember } from "@/types/entity-context";

interface InviteGroupMembersDialogProps {
  projectId: string;
  /** 이미 프로젝트에 참여 중인 userId Set */
  projectMemberIds: Set<string>;
  /** 그룹 전체 멤버 목록 (EntityMember) */
  groupMembers: EntityMember[];
  onInvited: () => void;
}

export function InviteGroupMembersDialog({
  projectId,
  projectMemberIds,
  groupMembers,
  onInvited,
}: InviteGroupMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // 이미 프로젝트에 있는 멤버를 제외한 초대 가능 목록
  const availableMembers = groupMembers.filter(
    (m) => !projectMemberIds.has(m.userId)
  );

  const toggleSelect = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === availableMembers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(availableMembers.map((m) => m.userId)));
    }
  };

  const handleInvite = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);

    const supabase = createClient();
    const rows = Array.from(selected).map((userId) => ({
      project_id: projectId,
      user_id: userId,
      role: "member" as const,
    }));

    const { error } = await supabase.from("project_members").insert(rows);

    if (error) {
      toast.error("멤버 초대에 실패했습니다");
    } else {
      toast.success(`${selected.size}명의 멤버를 초대했습니다`);
      setSelected(new Set());
      setOpen(false);
      onInvited();
    }
    setSubmitting(false);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSelected(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs">
          <UserPlus className="h-3 w-3 mr-1" />
          그룹 멤버 초대
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">그룹 멤버 초대</DialogTitle>
        </DialogHeader>

        {availableMembers.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              초대할 수 있는 그룹 멤버가 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                초대할 멤버 선택 ({availableMembers.length}명 초대 가능)
              </span>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs text-primary hover:underline"
              >
                {selected.size === availableMembers.length ? "전체 해제" : "전체 선택"}
              </button>
            </div>

            <div className="rounded-lg border divide-y max-h-64 overflow-y-auto">
              {availableMembers.map((member) => {
                const displayName = member.nickname || member.profile.name;
                return (
                  <label
                    key={member.userId}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                  >
                    <Checkbox
                      checked={selected.has(member.userId)}
                      onCheckedChange={() => toggleSelect(member.userId)}
                    />
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="text-xs">
                        {displayName?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate flex-1">{displayName}</span>
                    {member.role === "leader" && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        그룹장
                      </Badge>
                    )}
                    {member.role === "sub_leader" && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        부그룹장
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>

            <Button
              className="w-full"
              disabled={selected.size === 0 || submitting}
              onClick={handleInvite}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  초대 중...
                </>
              ) : (
                `${selected.size > 0 ? `${selected.size}명 ` : ""}초대`
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
