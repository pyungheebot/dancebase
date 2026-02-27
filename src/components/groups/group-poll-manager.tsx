"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BarChart2,
  Plus,
  Trash2,
  X,
  CheckSquare,
  Circle,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { useGroupPolls } from "@/hooks/use-group-polls";
import type { GroupPoll } from "@/types";

type GroupPollManagerProps = {
  groupId: string;
  canManage?: boolean;
};

// ── 투표 생성 다이얼로그 ──────────────────────────────────────

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
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [type, setType] = useState<"single" | "multiple">("single");
  const [anonymous, setAnonymous] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");

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
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("투표 제목을 입력해주세요");
      return;
    }
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      toast.error("선택지를 2개 이상 입력해주세요");
      return;
    }

    onSubmit({
      title: trimmedTitle,
      options: validOptions,
      type,
      anonymous,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    });

    toast.success("투표가 생성되었습니다");
    setOpen(false);
    setTitle("");
    setOptions(["", ""]);
    setType("single");
    setAnonymous(false);
    setExpiresAt("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          투표 생성
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">새 투표 만들기</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 제목 */}
          <div className="space-y-1.5">
            <Label className="text-xs">투표 제목</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="투표 주제를 입력하세요"
              className="h-8 text-xs"
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

          {/* 투표 유형 */}
          <div className="space-y-1.5">
            <Label className="text-xs">투표 유형</Label>
            <div className="flex gap-2">
              <Button
                variant={type === "single" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => setType("single")}
              >
                <Circle className="h-3 w-3 mr-1" />
                단일 선택
              </Button>
              <Button
                variant={type === "multiple" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => setType("multiple")}
              >
                <CheckSquare className="h-3 w-3 mr-1" />
                복수 선택
              </Button>
            </div>
          </div>

          {/* 마감 시간 */}
          <div className="space-y-1.5">
            <Label className="text-xs">마감 시간 (선택)</Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 익명 여부 */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">익명 투표</Label>
            <Switch
              checked={anonymous}
              onCheckedChange={setAnonymous}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
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

// ── 투표 옵션 항목 ──────────────────────────────────────────

function PollOptionRow({
  optionId,
  text,
  voterCount,
  percent,
  isSelected,
  isTop,
  isExpired,
  onSelect,
}: {
  optionId: string;
  text: string;
  voterCount: number;
  percent: number;
  isSelected: boolean;
  isTop: boolean;
  isExpired: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      className={[
        "w-full text-left rounded-md border p-2 transition-colors relative overflow-hidden",
        isExpired
          ? "cursor-default"
          : "hover:border-primary/50 cursor-pointer",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-background",
        isTop && isExpired ? "border-amber-400 bg-amber-50/50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => !isExpired && onSelect(optionId)}
      disabled={isExpired}
    >
      {/* 비율 바 */}
      <div
        className={[
          "absolute inset-0 opacity-15 transition-all",
          isTop && isExpired ? "bg-amber-400" : "bg-primary",
        ].join(" ")}
        style={{ width: `${percent}%` }}
      />

      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isTop && isExpired && (
            <Crown className="h-3 w-3 text-amber-500 shrink-0" />
          )}
          <span className="text-xs truncate">{text}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isSelected && (
            <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
              내 선택
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground">
            {voterCount}표 ({percent}%)
          </span>
        </div>
      </div>
    </button>
  );
}

// ── 단일 투표 카드 ─────────────────────────────────────────

function PollCard({
  poll,
  currentUserId,
  onVote,
  onUnvote,
  onDelete,
  getMyVotedOptionIds,
  hasVoted,
  getTotalVoters,
  getOptionPercent,
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
  getOptionPercent: (poll: GroupPoll, optionId: string) => number;
  getTopOptionId: (poll: GroupPoll) => string | null;
  isPollExpired: (poll: GroupPoll) => boolean;
  canManage: boolean;
}) {
  const expired = isPollExpired(poll);
  const myVotedIds = getMyVotedOptionIds(poll.id);
  const voted = hasVoted(poll.id);
  const totalVoters = getTotalVoters(poll);
  const topOptionId = getTopOptionId(poll);

  // 복수 선택 임시 상태
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  const handleOptionSelect = (optionId: string) => {
    if (expired || voted) return;

    if (poll.type === "single") {
      onVote(poll.id, [optionId]);
    } else {
      // 복수 선택: 토글
      setPendingIds((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleSubmitMultiple = () => {
    if (pendingIds.length === 0) {
      toast.error("선택지를 하나 이상 선택해주세요");
      return;
    }
    onVote(poll.id, pendingIds);
    setPendingIds([]);
  };

  const isOptionSelected = (optionId: string): boolean => {
    if (voted) return myVotedIds.includes(optionId);
    return pendingIds.includes(optionId);
  };

  const canDelete =
    canManage || (currentUserId && poll.creatorId === currentUserId);

  return (
    <div className="border rounded-lg p-3 space-y-2.5 bg-card">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <p className="text-xs font-medium leading-tight truncate">
            {poll.title}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {poll.anonymous ? "익명 투표" : `${poll.creatorName} 생성`}
            {" · "}
            {poll.type === "single" ? "단일 선택" : "복수 선택"}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge
            className={[
              "text-[10px] px-1.5 py-0",
              expired
                ? "bg-gray-100 text-gray-600"
                : "bg-green-100 text-green-700",
            ].join(" ")}
          >
            {expired ? "마감" : "진행 중"}
          </Badge>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(poll.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* 마감 시간 표시 */}
      {poll.expiresAt && (
        <p className="text-[10px] text-muted-foreground">
          {expired ? "마감됨: " : "마감: "}
          {new Date(poll.expiresAt).toLocaleString("ko-KR", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}

      {/* 선택지 목록 */}
      <div className="space-y-1.5">
        {poll.options.map((opt) => (
          <PollOptionRow
            key={opt.id}
            optionId={opt.id}
            text={opt.text}
            voterCount={opt.voterIds.length}
            percent={getOptionPercent(poll, opt.id)}
            isSelected={isOptionSelected(opt.id)}
            isTop={expired && topOptionId === opt.id}
            isExpired={expired || voted}
            onSelect={handleOptionSelect}
          />
        ))}
      </div>

      {/* 복수 선택 제출 버튼 */}
      {!expired && !voted && poll.type === "multiple" && (
        <Button
          size="sm"
          className="h-7 text-xs w-full"
          onClick={handleSubmitMultiple}
          disabled={pendingIds.length === 0}
        >
          투표하기
        </Button>
      )}

      {/* 투표 취소 버튼 (진행 중이고 이미 투표한 경우) */}
      {!expired && voted && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs w-full text-muted-foreground"
          onClick={() => onUnvote(poll.id)}
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

export function GroupPollManager({
  groupId,
  canManage = false,
}: GroupPollManagerProps) {
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
    getOptionPercent,
    getTopOptionId,
    isPollExpired,
  } = useGroupPolls(groupId);

  const activePollCount = activePolls.length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <BarChart2 className="h-3 w-3" />
          투표
          {activePollCount > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-0 ml-0.5">
              {activePollCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full max-w-sm p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm">그룹 투표</SheetTitle>
            <CreatePollDialog onSubmit={createPoll} />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs text-muted-foreground">불러오는 중...</p>
            </div>
          ) : activePolls.length === 0 && expiredPolls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <BarChart2 className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                등록된 투표가 없습니다
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                투표 생성 버튼을 눌러 첫 투표를 만들어보세요
              </p>
            </div>
          ) : (
            <>
              {/* 진행 중인 투표 */}
              {activePolls.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      진행 중 ({activePolls.length})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {activePolls.map((poll) => (
                      <PollCard
                        key={poll.id}
                        poll={poll}
                        currentUserId={currentUserId}
                        onVote={vote}
                        onUnvote={unvote}
                        onDelete={deletePoll}
                        getMyVotedOptionIds={getMyVotedOptionIds}
                        hasVoted={hasVoted}
                        getTotalVoters={getTotalVoters}
                        getOptionPercent={getOptionPercent}
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
                <>
                  {activePolls.length > 0 && <Separator />}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        마감된 투표 ({expiredPolls.length})
                      </p>
                    </div>
                    <div className="space-y-2">
                      {expiredPolls.map((poll) => (
                        <PollCard
                          key={poll.id}
                          poll={poll}
                          currentUserId={currentUserId}
                          onVote={vote}
                          onUnvote={unvote}
                          onDelete={deletePoll}
                          getMyVotedOptionIds={getMyVotedOptionIds}
                          hasVoted={hasVoted}
                          getTotalVoters={getTotalVoters}
                          getOptionPercent={getOptionPercent}
                          getTopOptionId={getTopOptionId}
                          isPollExpired={isPollExpired}
                          canManage={canManage}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
