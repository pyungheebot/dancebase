"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { Group } from "@/types";

type GroupCardProps = {
  group: Group & { member_count: number; my_role: string };
};

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`}>
      <div className="flex items-center gap-3 rounded-sm px-3 py-2.5 hover:bg-accent transition-colors cursor-pointer">
        <div className="flex items-center justify-center h-8 w-8 rounded-sm bg-muted text-muted-foreground text-xs font-medium shrink-0">
          {group.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{group.name}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal shrink-0">
              {group.group_type || "기타"}
            </Badge>
          </div>
          {group.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {group.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            {group.member_count}
          </span>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 font-normal"
          >
            {group.my_role === "leader" ? "그룹장" : "멤버"}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
