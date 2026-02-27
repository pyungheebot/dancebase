"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useGroups } from "@/hooks/use-groups";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check } from "lucide-react";

interface InviteToGroupDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteToGroupDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: InviteToGroupDialogProps) {
  const { groups, loading: groupsLoading } = useGroups();
  const [memberGroupIds, setMemberGroupIds] = useState<Set<string>>(new Set());
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const supabase = createClient();

  // 내가 리더인 그룹만
  const leaderGroups = groups.filter((g) => g.my_role === "leader");

  // 대상 유저가 이미 가입된 그룹 확인
  useEffect(() => {
    if (!open) return;
    const fetchMemberships = async () => {
      setLoadingMemberships(true);
      const { data } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId);
      if (data) {
        setMemberGroupIds(new Set(data.map((m: { group_id: string }) => m.group_id)));
      }
      setLoadingMemberships(false);
    };
    fetchMemberships();
  }, [supabase, userId, open]);

  const handleInvite = async (groupId: string) => {
    setInviting(groupId);
    await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: userId,
      role: "member",
    });
    setInviting(null);
    setInvited((prev) => new Set(prev).add(groupId));
    setMemberGroupIds((prev) => new Set(prev).add(groupId));
  };

  const loading = groupsLoading || loadingMemberships;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{userName}님을 그룹에 초대</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : leaderGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            내가 리더인 그룹이 없습니다
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {leaderGroups.map((group) => {
              const isMember = memberGroupIds.has(group.id);
              const justInvited = invited.has(group.id);

              return (
                <div
                  key={group.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg border"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.member_count}명
                    </p>
                  </div>
                  {isMember ? (
                    <Badge
                      variant="secondary"
                      className="text-[10px] shrink-0"
                    >
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
                      onClick={() => handleInvite(group.id)}
                      disabled={inviting === group.id}
                    >
                      {inviting === group.id ? (
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
