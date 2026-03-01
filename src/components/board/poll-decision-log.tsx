"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatKo } from "@/lib/date-utils";
import { Gavel, BookOpen, Link, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { usePollDecisions } from "@/hooks/use-poll-decisions";
import { EmptyState } from "@/components/shared/empty-state";
import type { PollDecision } from "@/types";

// ============================================================
// 결정 채택 버튼 (투표 결과 옆에 배치)
// ============================================================

interface AdoptDecisionButtonProps {
  groupId: string;
  pollId: string;
  postId: string;
  question: string;
  winningOption: string;
  decidedBy: string;
  isExpired: boolean;
}

export function AdoptDecisionButton({
  groupId,
  pollId,
  postId,
  question,
  winningOption,
  decidedBy,
  isExpired,
}: AdoptDecisionButtonProps) {
  const { isDecided, adoptDecision, revokeDecision } = usePollDecisions(groupId);

  const decided = isDecided(pollId);

  const handleToggle = () => {
    if (decided) {
      revokeDecision(pollId);
      toast.success("결정 채택이 해제되었습니다");
    } else {
      if (!isExpired) {
        toast.error("마감된 투표만 결정으로 채택할 수 있습니다");
        return;
      }
      adoptDecision({
        pollId,
        postId,
        question,
        winningOption,
        decisionSummary: "",
        decidedBy,
      });
      toast.success("결정으로 채택했습니다");
    }
  };

  return (
    <Button
      variant={decided ? "default" : "outline"}
      size="sm"
      className={`h-6 text-[11px] gap-1 ${
        decided
          ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
          : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
      }`}
      onClick={handleToggle}
    >
      <Gavel className="h-3 w-3" />
      {decided ? "채택됨" : "결정으로 채택"}
    </Button>
  );
}

// ============================================================
// 결정 히스토리 목록 (Sheet)
// ============================================================

interface PollDecisionLogProps {
  groupId: string;
  basePath: string;
}

export function PollDecisionLog({ groupId, basePath }: PollDecisionLogProps) {
  const { decisions, loading, updateSummary } = usePollDecisions(groupId);
  const router = useRouter();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          의사결정 기록
          {decisions.length > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1 py-0 h-4 min-w-4 flex items-center justify-center"
            >
              {decisions.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-indigo-600" />
            <SheetTitle className="text-sm font-semibold">의사결정 기록</SheetTitle>
            {decisions.length > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-600 border-indigo-200"
              >
                총 {decisions.length}건
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12 text-xs text-muted-foreground">
              불러오는 중...
            </div>
          ) : decisions.length === 0 ? (
            <EmptyState
              icon={Gavel}
              title="채택된 결정이 없습니다"
              description='마감된 투표에서 "결정으로 채택" 버튼을 눌러 의사결정 기록을 남겨보세요.'
              className="m-4"
            />
          ) : (
            <div className="divide-y">
              {decisions.map((decision) => (
                <DecisionItem
                  key={decision.id}
                  decision={decision}
                  basePath={basePath}
                  onUpdateSummary={updateSummary}
                  onNavigate={(path) => router.push(path)}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// 개별 결정 항목
// ============================================================

interface DecisionItemProps {
  decision: PollDecision;
  basePath: string;
  onUpdateSummary: (id: string, summary: string) => void;
  onNavigate: (path: string) => void;
}

function DecisionItem({
  decision,
  basePath,
  onUpdateSummary,
  onNavigate,
}: DecisionItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(decision.decisionSummary);

  const handleSave = () => {
    onUpdateSummary(decision.id, draft.trim());
    setEditing(false);
    toast.success("요약이 저장되었습니다");
  };

  const handleCancel = () => {
    setDraft(decision.decisionSummary);
    setEditing(false);
  };

  const postPath = `${basePath}/${decision.postId}`;

  return (
    <div className="px-4 py-3 space-y-1.5 hover:bg-accent/30 transition-colors">
      {/* 날짜 */}
      <p className="text-[10px] text-muted-foreground">
        {formatKo(new Date(decision.decidedAt), "yyyy년 M월 d일 HH:mm")}
      </p>

      {/* 투표 제목 + 이동 버튼 */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-snug flex-1 min-w-0 line-clamp-2">
          {decision.question}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => onNavigate(postPath)}
          aria-label="원본 게시글로 이동"
        >
          <Link className="h-3 w-3" />
        </Button>
      </div>

      {/* 결정 옵션 배지 */}
      <div className="flex items-center gap-1.5">
        <Gavel className="h-3 w-3 text-indigo-500 shrink-0" />
        <Badge
          className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-normal"
          variant="outline"
        >
          {decision.winningOption}
        </Badge>
      </div>

      {/* 결정 요약 인라인 편집 */}
      {editing ? (
        <div className="flex items-center gap-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="결정 요약 입력..."
            className="h-7 text-xs flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
            onClick={handleSave}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground"
            onClick={handleCancel}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div
          className="flex items-center gap-1 group cursor-pointer"
          onClick={() => setEditing(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setEditing(true)}
        >
          {decision.decisionSummary ? (
            <p className="text-[11px] text-muted-foreground flex-1 line-clamp-2">
              {decision.decisionSummary}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground/50 italic flex-1">
              요약 추가...
            </p>
          )}
          <Pencil className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
      )}
    </div>
  );
}

