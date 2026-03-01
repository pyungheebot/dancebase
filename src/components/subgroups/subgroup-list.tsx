"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSubgroups } from "@/hooks/use-subgroups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SubgroupCreateDialog } from "./subgroup-create-dialog";
import { SubgroupEditDialog } from "./subgroup-edit-dialog";
import { Loader2, Users, ChevronRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { invalidateSubgroups } from "@/lib/swr/invalidate";

interface SubgroupListProps {
  groupId: string;
  canManage: boolean;
}

type SubgroupItem = {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  visibility: string;
  member_count: number;
};

export function SubgroupList({ groupId, canManage }: SubgroupListProps) {
  const { subgroups, loading, refetch } = useSubgroups(groupId);

  const [editTarget, setEditTarget] = useState<SubgroupItem | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", deleteTargetId);

    if (error) {
      toast.error("하위그룹 삭제에 실패했습니다");
    } else {
      toast.success("하위그룹이 삭제되었습니다");
      invalidateSubgroups(groupId);
      refetch();
    }
    setDeleting(false);
    setDeleteTargetId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">하위그룹</h2>
        {canManage && (
          <SubgroupCreateDialog parentGroupId={groupId} onCreated={refetch} />
        )}
      </div>

      {subgroups.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">하위그룹이 없습니다</p>
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {subgroups.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between px-3 py-2.5"
            >
              <Link
                href={`/groups/${sub.id}`}
                className="flex items-center justify-between flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{sub.name}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 font-normal border-0 bg-muted"
                    >
                      {sub.group_type || "기타"}
                    </Badge>
                  </div>
                  {sub.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {sub.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground mr-2">
                  <Users className="h-3 w-3" />
                  {sub.member_count}
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </Link>

              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={(e) => e.preventDefault()}
                      aria-label="더보기"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-28">
                    <DropdownMenuItem
                      className="text-xs gap-2"
                      onClick={() => setEditTarget(sub as SubgroupItem)}
                    >
                      <Pencil className="h-3 w-3" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-xs gap-2 text-destructive focus:text-destructive"
                      onClick={() => setDeleteTargetId(sub.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      )}

      {editTarget && (
        <SubgroupEditDialog
          open={!!editTarget}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          subgroup={editTarget}
          parentGroupId={groupId}
          onUpdated={refetch}
        />
      )}

      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        title="하위그룹 삭제"
        description="이 하위그룹을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다."
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
