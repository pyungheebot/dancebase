"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemberInteractionScore } from "@/hooks/use-member-interaction-score";
import { ChevronDown, ChevronUp, TrendingUp, Minus, TrendingDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const LEVEL_CONFIG = {
  active: { label: "활발함", color: "text-green-600 bg-green-50 border-green-200" },
  normal: { label: "보통", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  low: { label: "저조", color: "text-red-600 bg-red-50 border-red-200" },
} as const;

const MEDALS = ["🥇", "🥈", "🥉"];

const BAR_COLORS = {
  post: "bg-blue-500",
  comment: "bg-purple-500",
  attendance: "bg-green-500",
  rsvp: "bg-amber-500",
};

export function MemberInteractionCard({ groupId }: { groupId: string }) {
  const { data, loading } = useMemberInteractionScore(groupId);
  const [open, setOpen] = useState(true);

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  const levelCfg = LEVEL_CONFIG[data.activityLevel];
  const top10 = data.members.slice(0, 10);
  const maxScore = top10.length > 0 ? Math.max(...top10.map((m) => m.totalScore), 1) : 1;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">멤버 상호작용 분석</CardTitle>
              <Badge variant="outline" className={levelCfg.color}>{levelCfg.label}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">평균 {data.averageScore}점</span>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3">
            {!data.hasData && (
              <p className="text-sm text-muted-foreground text-center py-4">최근 30일 활동 데이터가 없습니다.</p>
            )}

            {/* 범례 */}
            {data.hasData && (
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />게시글(15)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" />댓글(5)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />출석(10)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />RSVP(3)</span>
              </div>
            )}

            {/* TOP 10 */}
            {top10.map((member) => (
              <div key={member.userId} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-5 text-center">
                      {member.rank <= 3 ? MEDALS[member.rank - 1] : member.rank}
                    </span>
                    <span className="text-sm font-medium truncate max-w-[120px]">{member.name}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{member.totalScore}점</span>
                </div>
                {/* 스택 바 */}
                <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                  {(["post", "comment", "attendance", "rsvp"] as const).map((key) => {
                    const scoreKey = `${key}Score` as keyof typeof member.breakdown;
                    const score = member.breakdown[scoreKey] as number;
                    const width = maxScore > 0 ? (score / maxScore) * 100 : 0;
                    if (width === 0) return null;
                    return (
                      <div
                        key={key}
                        className={`${BAR_COLORS[key]} transition-all`}
                        style={{ width: `${width}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
