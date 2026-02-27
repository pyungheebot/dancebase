"use client";

import Link from "next/link";
import { useSubgroups } from "@/hooks/use-subgroups";
import { Badge } from "@/components/ui/badge";
import { Network, ChevronRight, Users } from "lucide-react";

interface SubgroupsCardProps {
  groupId: string;
  basePath: string;
}

export function SubgroupsCard({ groupId, basePath }: SubgroupsCardProps) {
  const { subgroups } = useSubgroups(groupId);

  if (subgroups.length === 0) return null;

  const displayed = subgroups.slice(0, 5);

  return (
    <div className="rounded border">
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b bg-muted/30">
        <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <Network className="h-3 w-3" />
          하위그룹
        </span>
        <Link
          href={`${basePath}/subgroups`}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          전체 <ChevronRight className="h-2.5 w-2.5 inline" />
        </Link>
      </div>
      <div className="divide-y">
        {displayed.map((sub) => (
          <Link
            key={sub.id}
            href={`/groups/${sub.id}`}
            className="flex items-center justify-between px-2.5 py-1.5 hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-medium truncate">{sub.name}</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal shrink-0">
                {sub.group_type || "기타"}
              </Badge>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-[10px] text-muted-foreground">
              <Users className="h-2.5 w-2.5" />
              {sub.member_count}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
