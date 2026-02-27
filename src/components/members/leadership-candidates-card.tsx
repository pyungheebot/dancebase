"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Star, X } from "lucide-react";
import { useLeadershipCandidates } from "@/hooks/use-leadership-candidates";
import { toast } from "sonner";

interface Props {
  groupId: string;
}

interface ScoreBarProps {
  label: string;
  score: number;
  color: string;
}

function ScoreBar({ label, score, color }: ScoreBarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-[10px] text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-6 text-[10px] text-right text-muted-foreground shrink-0">
        {score}
      </span>
    </div>
  );
}

export function LeadershipCandidatesCard({ groupId }: Props) {
  const [open, setOpen] = useState(true);
  const { candidates, loading, dismissCandidate } = useLeadershipCandidates(groupId);

  function handleDismiss(userId: string, displayName: string) {
    dismissCandidate(userId);
    toast.success(`${displayName} 추천을 해제했습니다.`);
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    return "text-muted-foreground";
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">리더십 후보 탐지</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">리더십 후보 탐지</span>
        </div>
        <p className="text-xs text-muted-foreground">
          지난 90일간 활동 데이터를 분석 중이거나 기준(60점 이상)을 충족하는 멤버가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/40 transition-colors rounded-lg">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">리더십 후보 탐지</span>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700"
              >
                {candidates.length}명
              </Badge>
            </div>
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            <p className="text-[10px] text-muted-foreground">
              지난 90일 출석·게시글·댓글 활동 기반 자동 추천 (출석 40% + 게시글 35% + 댓글 25%)
            </p>
            {candidates.map((candidate) => (
              <div
                key={candidate.userId}
                className="flex items-start gap-3 p-3 rounded-md border bg-muted/20"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs bg-yellow-100 text-yellow-700">
                    {candidate.displayName.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium truncate">
                      {candidate.displayName}
                    </span>
                    <span
                      className={`text-[10px] font-bold tabular-nums ${getScoreColor(
                        candidate.totalScore
                      )}`}
                    >
                      {candidate.totalScore}점
                    </span>
                  </div>
                  <div className="space-y-1">
                    <ScoreBar
                      label="출석"
                      score={candidate.attendanceScore}
                      color="bg-blue-500"
                    />
                    <ScoreBar
                      label="게시글"
                      score={candidate.postScore}
                      color="bg-orange-500"
                    />
                    <ScoreBar
                      label="댓글"
                      score={candidate.commentScore}
                      color="bg-green-500"
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDismiss(candidate.userId, candidate.displayName)}
                  title="추천 해제"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
