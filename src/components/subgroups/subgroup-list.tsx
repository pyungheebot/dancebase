"use client";

import Link from "next/link";
import { useSubgroups } from "@/hooks/use-subgroups";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, ChevronRight } from "lucide-react";
import { SubgroupCreateDialog } from "./subgroup-create-dialog";

interface SubgroupListProps {
  groupId: string;
  canManage: boolean;
}

export function SubgroupList({ groupId, canManage }: SubgroupListProps) {
  const { subgroups, loading, refetch } = useSubgroups(groupId);

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
            <Link
              key={sub.id}
              href={`/groups/${sub.id}`}
              className="flex items-center justify-between px-3 py-2.5 hover:bg-accent transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{sub.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal border-0 bg-muted">
                    {sub.group_type || "기타"}
                  </Badge>
                </div>
                {sub.description && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {sub.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {sub.member_count}
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
