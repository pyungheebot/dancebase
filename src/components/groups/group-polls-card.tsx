"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Crown,
  CheckSquare,
  Circle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupPolls } from "@/hooks/use-group-polls";
import type { GroupPoll } from "@/types";

// ── 투표 생성 다이얼로그 ────────────────────────────────────

function CreatePollDialog({
  onSubmit,
}: {
  onSubmit: (params: {
    title: string;
    options: string[];
    type: "single" | "multiple";
    anonymous: boolean;
    expiresAt: string | null;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [multiSelect, setMultiSelect] = useState(false);

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions((prev) => [...prev, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const handleSubmit = () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      toast.error(TOAST.GROUP_POLLS.QUESTION_REQUIRED);
      return;
    }
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      toast.error(TOAST.GROUP_POLLS.OPTIONS_MIN);
      return;
    }

    onSubmit({
      title: trimmedQuestion,
      options: validOptions,
      type: multiSelect ? "multiple" : "single",
      anonymous: false,
      expiresAt: null,
    });

    toast.success(TOAST.GROUP_VOTE.CREATED);
    setOpen(false);
    setQuestion("");
    setOptions(["", ""]);
    setMultiSelect(false);
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setQuestion("");
      setOptions(["", ""]);
      setMultiSelect(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          투표 생성
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">새 투표 만들기</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 질문 */}
          <div className="space-y-1.5">
            <Label className="text-xs">투표 질문</Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예: 다음 연습 장소는 어디가 좋을까요?"
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") e.preventDefault();
              }}
            />
          </div>

          {/* 선택지 */}
          <div className="space-y-1.5">
            <Label className="text-xs">선택지 (2~6개)</Label>
            <div className="space-y-1.5">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-1.5">
                  <Input
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`선택지 ${idx + 1}`}
                    className="h-7 text-xs"
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 shrink-0"
                      onClick={() => handleRemoveOption(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full"
                onClick={handleAddOption}
              >
                <Plus className="h-3 w-3 mr-1" />
                선택지 추가
              </Button>
            )}
          </div>

          {/* 다중 선택 여부 */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="multi-select"
              checked={multiSelect}
              onCheckedChange={(checked) => setMultiSelect(checked === true)}
            />
            <Label htmlFor="multi-select" className="text-xs cursor-pointer">
              복수 선택 허용
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleOpenChange(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 투표 옵션 행 ────────────────────────────────────────────

function PollOptionBar({
  text,
  voteCount,
  totalVoters,
  isSelected,
  isTop,
  isClosed,
  onClick,
}: {
  text: string;
  voteCount: number;
  totalVoters: number;
  isSelected: boolean;
  isTop: boolean;
  isClosed: boolean;
  onClick: () => void;
}) {
  const percent = totalVoters === 0 ? 0 : Math.round((voteCount / totalVoters) * 100);
  const isInteractive = !isClosed;

  return (
    <button
      type="button"
      className={[
        "w-full text-left rounded border relative overflow-hidden transition-colors",
        isInteractive ? "hover:border-primary/50 cursor-pointer" : "cursor-default",
        isSelected ? "border-primary" : "border-border",
        isClosed && isTop ? "border-amber-400" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={isInteractive ? onClick : undefined}
      disabled={!isInteractive}
    >
      {/* 투표 바 배경 */}
      <div
        className={[
          "absolute inset-0 transition-all duration-300",
          isClosed && isTop
            ? "bg-blue-500/20"
            : isSelected
              ? "bg-primary/10"
              : "bg-muted/50",
        ].join(" ")}
        style={{ width: `${percent}%` }}
      />

      <div className="relative flex items-center justify-between gap-2 px-2.5 py-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {isClosed && isTop && (
            <Crown className="h-3 w-3 text-amber-500 shrink-0" />
          )}
          {!isClosed && (
            isSelected ? (
              <CheckSquare className="h-3 w-3 text-primary shrink-0" />
            ) : (
              <Circle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            )
          )}
          <span className="text-xs truncate">{text}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-muted-foreground">
            {voteCount}표
          </span>
          {(isClosed || totalVoters > 0) && (
            <span className="text-[10px] text-muted-foreground">
              ({percent}%)
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── 단일 투표 카드 ──────────────────────────────────────────

function PollItem({
  poll,
  currentUserId,
  onVote,
  onUnvote,
  onDelete,
  getMyVotedOptionIds,
  hasVoted,
  getTotalVoters,
  getTopOptionId,
  isPollExpired,
  canManage,
}: {
  poll: GroupPoll;
  currentUserId: string | null;
  onVote: (pollId: string, optionIds: string[]) => void;
  onUnvote: (pollId: string) => void;
  onDelete: (pollId: string) => void;
  getMyVotedOptionIds: (pollId: string) => string[];
  hasVoted: (pollId: string) => boolean;
  getTotalVoters: (poll: GroupPoll) => number;
  getTopOptionId: (poll: GroupPoll) => string | null;
  isPollExpired: (poll: GroupPoll) => boolean;
  canManage: boolean;
}) {
  const closed = isPollExpired(poll);
  const voted = hasVoted(poll.id);
  const myVotedIds = getMyVotedOptionIds(poll.id);
  const totalVoters = getTotalVoters(poll);
  const topOptionId = getTopOptionId(poll);

  // 복수 선택 임시 상태
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  const handleOptionClick = (optionId: string) => {
    if (closed || voted) return;

    if (poll.type === "single") {
      onVote(poll.id, [optionId]);
      toast.success(TOAST.GROUP_POLLS.VOTED);
    } else {
      setPendingIds((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleMultiSubmit = () => {
    if (pendingIds.length === 0) {
      toast.error(TOAST.GROUP_POLLS.OPTION_REQUIRED);
      return;
    }
    onVote(poll.id, pendingIds);
    setPendingIds([]);
    toast.success(TOAST.GROUP_POLLS.VOTED);
  };

  const isOptionSelected = (optionId: string): boolean => {
    if (voted) return myVotedIds.includes(optionId);
    return pendingIds.includes(optionId);
  };

  const canDelete =
    canManage || (currentUserId !== null && poll.creatorId === currentUserId);

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-card">
      {/* 헤더 */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-tight">{poll.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge
              className={[
                "text-[10px] px-1.5 py-0",
                closed
                  ? "bg-gray-100 text-gray-600 border-gray-200"
                  : "bg-green-100 text-green-700 border-green-200",
              ].join(" ")}
              variant="outline"
            >
              {closed ? "마감" : "진행 중"}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {poll.type === "multiple" ? "복수 선택" : "단일 선택"}
            </span>
          </div>
        </div>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => {
              onDelete(poll.id);
              toast.success(TOAST.GROUP_POLLS.DELETED);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* 선택지 목록 */}
      <div className="space-y-1">
        {poll.options.map((opt) => (
          <PollOptionBar
            key={opt.id}
            text={opt.text}
            voteCount={opt.voterIds.length}
            totalVoters={totalVoters}
            isSelected={isOptionSelected(opt.id)}
            isTop={Boolean(closed && topOptionId === opt.id && opt.voterIds.length > 0)}
            isClosed={closed || voted}
            onClick={() => handleOptionClick(opt.id)}
          />
        ))}
      </div>

      {/* 복수 선택 제출 */}
      {!closed && !voted && poll.type === "multiple" && (
        <Button
          size="sm"
          className="h-7 text-xs w-full"
          onClick={handleMultiSubmit}
          disabled={pendingIds.length === 0}
        >
          투표하기 {pendingIds.length > 0 && `(${pendingIds.length}개 선택)`}
        </Button>
      )}

      {/* 투표 취소 */}
      {!closed && voted && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs w-full text-muted-foreground"
          onClick={() => {
            onUnvote(poll.id);
            toast.success(TOAST.GROUP_POLLS.CANCELLED);
          }}
        >
          투표 취소
        </Button>
      )}

      {/* 총 투표 수 */}
      <p className="text-[10px] text-muted-foreground text-right">
        총 {totalVoters}명 투표
      </p>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────

type GroupPollsCardProps = {
  groupId: string;
  canManage?: boolean;
};

export function GroupPollsCard({
  groupId,
  canManage = false,
}: GroupPollsCardProps) {
  const [open, setOpen] = useState(true);

  const {
    activePolls,
    expiredPolls,
    loading,
    currentUserId,
    createPoll,
    vote,
    unvote,
    deletePoll,
    getMyVotedOptionIds,
    hasVoted,
    getTotalVoters,
    getTopOptionId,
    isPollExpired,
  } = useGroupPolls(groupId);

  const totalPolls = activePolls.length + expiredPolls.length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 카드 헤더 */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 border-b bg-muted/30">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              <BarChart2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-medium">그룹 투표/설문</span>
              {activePolls.length > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200 border">
                  {activePolls.length}개 진행 중
                </Badge>
              )}
              {open ? (
                <ChevronUp className="h-3 w-3 text-muted-foreground ml-auto" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
              )}
            </button>
          </CollapsibleTrigger>
          <div className="ml-2 shrink-0">
            <CreatePollDialog onSubmit={createPoll} />
          </div>
        </div>

        <CollapsibleContent>
          <div className="p-3">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <p className="text-xs text-muted-foreground">불러오는 중...</p>
              </div>
            ) : totalPolls === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-1">
                <BarChart2 className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">
                  등록된 투표가 없습니다
                </p>
                <p className="text-[10px] text-muted-foreground/60">
                  투표 생성 버튼으로 첫 번째 투표를 만들어보세요
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 진행 중인 투표 */}
                {activePolls.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        진행 중 ({activePolls.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {activePolls.map((poll) => (
                        <PollItem
                          key={poll.id}
                          poll={poll}
                          currentUserId={currentUserId}
                          onVote={vote}
                          onUnvote={unvote}
                          onDelete={deletePoll}
                          getMyVotedOptionIds={getMyVotedOptionIds}
                          hasVoted={hasVoted}
                          getTotalVoters={getTotalVoters}
                          getTopOptionId={getTopOptionId}
                          isPollExpired={isPollExpired}
                          canManage={canManage}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 마감된 투표 */}
                {expiredPolls.length > 0 && (
                  <div className="space-y-2">
                    {activePolls.length > 0 && (
                      <div className="border-t" />
                    )}
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        마감된 투표 ({expiredPolls.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {expiredPolls.map((poll) => (
                        <PollItem
                          key={poll.id}
                          poll={poll}
                          currentUserId={currentUserId}
                          onVote={vote}
                          onUnvote={unvote}
                          onDelete={deletePoll}
                          getMyVotedOptionIds={getMyVotedOptionIds}
                          hasVoted={hasVoted}
                          getTotalVoters={getTotalVoters}
                          getTopOptionId={getTopOptionId}
                          isPollExpired={isPollExpired}
                          canManage={canManage}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
