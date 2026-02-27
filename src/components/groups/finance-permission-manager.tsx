"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield } from "lucide-react";
import type { GroupMemberWithProfile } from "@/types";

type Props = {
  groupId: string;
  members: GroupMemberWithProfile[];
  onSuccess: () => void;
};

type MemberRole = "none" | "viewer" | "manager";

export function FinancePermissionManager({
  groupId,
  members,
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<Record<string, MemberRole>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const supabase = createClient();

  // 리더가 아닌 멤버만 표시
  const nonLeaderMembers = members.filter((m) => m.role !== "leader");

  // entity_permissions에서 현재 권한 로드
  useEffect(() => {
    if (!open) return;

    const fetchPermissions = async () => {
      setFetching(true);
      const { data } = await supabase
        .from("entity_permissions")
        .select("user_id, permission")
        .eq("entity_type", "group")
        .eq("entity_id", groupId)
        .in("permission", ["finance_manage", "finance_view"]);

      const initial: Record<string, MemberRole> = {};
      for (const m of nonLeaderMembers) {
        initial[m.user_id] = "none";
      }
      for (const row of data ?? []) {
        if (row.permission === "finance_manage") {
          initial[row.user_id] = "manager";
        } else if (row.permission === "finance_view" && initial[row.user_id] !== "manager") {
          initial[row.user_id] = "viewer";
        }
      }
      setRoles(initial);
      setFetching(false);
    };

    fetchPermissions();
  }, [open, groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setLoading(true);

    // 기존 finance 권한 모두 삭제
    await supabase
      .from("entity_permissions")
      .delete()
      .eq("entity_type", "group")
      .eq("entity_id", groupId)
      .in("permission", ["finance_manage", "finance_view"]);

    // 새 권한 삽입
    const inserts: { entity_type: string; entity_id: string; user_id: string; permission: string }[] = [];
    for (const [userId, role] of Object.entries(roles)) {
      if (role === "manager") {
        inserts.push({
          entity_type: "group",
          entity_id: groupId,
          user_id: userId,
          permission: "finance_manage",
        });
      } else if (role === "viewer") {
        inserts.push({
          entity_type: "group",
          entity_id: groupId,
          user_id: userId,
          permission: "finance_view",
        });
      }
    }

    if (inserts.length > 0) {
      await supabase.from("entity_permissions").insert(inserts);
    }

    setLoading(false);
    setOpen(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
          <Shield className="h-3 w-3 mr-1" />
          권한
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>회비 권한 관리</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            그룹장은 항상 전체 권한을 가집니다.
          </p>

          {fetching ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              로딩 중...
            </p>
          ) : nonLeaderMembers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              멤버가 없습니다
            </p>
          ) : (
            <div className="rounded-lg border divide-y">
              {nonLeaderMembers.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between gap-3 px-3 py-1.5">
                  <span className="text-sm truncate">
                    {m.profiles.name}
                  </span>
                  <Select
                    value={roles[m.user_id] ?? "none"}
                    onValueChange={(v) =>
                      setRoles((prev) => ({ ...prev, [m.user_id]: v as MemberRole }))
                    }
                  >
                    <SelectTrigger className="w-[100px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">권한 없음</SelectItem>
                      <SelectItem value="viewer">열람</SelectItem>
                      <SelectItem value="manager">관리</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          <Button onClick={handleSave} className="w-full h-8 text-sm" disabled={loading || fetching}>
            {loading ? "저장 중..." : "저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
