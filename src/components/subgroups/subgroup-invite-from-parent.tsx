"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParentGroupMembers } from "@/hooks/use-subgroups";
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
import { invalidateGroup } from "@/lib/swr/invalidate";

interface SubgroupInviteFromParentProps {
  subgroupId: string;
  parentGroupId: string;
  currentMemberIds: Set<string>;
  onInvited?: () => void;
}

export function SubgroupInviteFromParent({
  subgroupId,
  parentGroupId,
  currentMemberIds,
  onInvited,
}: SubgroupInviteFromParentProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const { members, loading } = useParentGroupMembers(open ? parentGroupId : null);

  const availableMembers = members.filter((m) => !currentMemberIds.has(m.user_id));

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
      setSelected(new Set(availableMembers.map((m) => m.user_id)));
    }
  };

  const handleInvite = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);

    const supabase = createClient();
    const rows = Array.from(selected).map((userId) => ({
      group_id: subgroupId,
      user_id: userId,
      role: "member" as const,
    }));

    const { error } = await supabase
      .from("group_members")
      .insert(rows);

    if (error) {
      toast.error("멤버 추가에 실패했습니다");
    } else {
      toast.success(`${selected.size}명의 멤버를 추가했습니다`);
      invalidateGroup(subgroupId);
      setSelected(new Set());
      setOpen(false);
      onInvited?.();
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
          상위 그룹에서 초대
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">상위 그룹에서 멤버 초대</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : availableMembers.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              초대할 수 있는 상위 그룹 멤버가 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {availableMembers.length}명 초대 가능
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
                const displayName = member.nickname || member.profiles.name;
                return (
                  <label
                    key={member.user_id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
                  >
                    <Checkbox
                      checked={selected.has(member.user_id)}
                      onCheckedChange={() => toggleSelect(member.user_id)}
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
                  추가 중...
                </>
              ) : (
                `${selected.size > 0 ? `${selected.size}명 ` : ""}추가하기`
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
