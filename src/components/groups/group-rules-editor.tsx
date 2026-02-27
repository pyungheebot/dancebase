"use client";

import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GroupRulesCard } from "@/components/groups/group-rules-card";

type GroupRulesEditorProps = {
  groupId: string;
  canEdit: boolean;
  memberNames?: string[];
  currentMemberName?: string;
};

export function GroupRulesEditor({
  groupId,
  memberNames = [],
  currentMemberName,
}: GroupRulesEditorProps) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          그룹 규칙 관리
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3 px-0 pb-0">
        <GroupRulesCard
          groupId={groupId}
          memberNames={memberNames}
          currentMemberName={currentMemberName}
        />
      </CardContent>
    </Card>
  );
}
