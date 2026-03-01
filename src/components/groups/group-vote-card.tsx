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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Vote,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Trash2,
  Play,
  Square,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupVote } from "@/hooks/use-group-vote";
import type { GroupVoteEntry, GroupVoteType } from "@/types";

// ── D-day 계산 ────────────────────────────────────────────────

function calcDday(deadline: string): string {
  const now = new Date();
  const target = new Date(deadline);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "마감됨";
  if (diffDays === 0) return "D-day";
  return `D-${diffDays}`;
}

// ── 유형 레이블 ───────────────────────────────────────────────

function voteTypeLabel(type: GroupVoteType): string {
  if (type === "single") return "단일 선택";
  if (type === "multiple") return "복수 선택";
  return "순위 선택";
}

// ── 상태 배지 ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: GroupVoteEntry["status"] }) {
  if (status === "draft") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border-gray-200"
      >
        초안
      </Badge>
    );
  }
  if (status === "active") {
    return (
      <Badge
        variant="outline"
        className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200"
      >
        진행 중
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200"
    >
      종료
    </Badge>
  );
}

// ── 투표 만들기 다이얼로그 ─────────────────────────────────────

function CreateVoteDialog({
  onSubmit,
}: {
  onSubmit: (params: {
    title: string;
    description: string;
    type: GroupVoteType;
    optionLabels: string[];
    anonymous: boolean;
    deadline: string | undefined;
    createdBy: string;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<GroupVoteType>("single");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [anonymous, setAnonymous] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [createdBy, setCreatedBy] = useState("");

  const handleAddOption = () => {
    if (options.length < 8) setOptions((prev) => [...prev, ""]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleOptionChange = (idx: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? value : o)));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("single");
    setOptions(["", ""]);
    setAnonymous(false);
    setDeadline("");
    setCreatedBy("");
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) resetForm();
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(TOAST.GROUP_VOTE_CARD.TITLE_REQUIRED);
      return;
    }
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      toast.error(TOAST.GROUP_VOTE_CARD.OPTIONS_MIN);
      return;
    }
    if (!createdBy.trim()) {
      toast.error(TOAST.GROUP_VOTE_CARD.AUTHOR_REQUIRED);
      return;
    }

    onSubmit({
      title,
      description,
      type,
      optionLabels: validOptions,
      anonymous,
      deadline: deadline || undefined,
      createdBy,
    });

    toast.success(TOAST.GROUP_VOTE_CARD.CREATED);
    setOpen(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          투표 만들기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">새 투표 만들기</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 제목 */}
          <div className="space-y-1.5">
            <Label className="text-xs">제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="투표 제목을 입력하세요"
              className="h-8 text-xs"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1.5">
            <Label className="text-xs">설명 (선택)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="투표에 대한 설명을 입력하세요"
              className="text-xs min-h-[60px] resize-none"
            />
          </div>

          {/* 유형 */}
          <div className="space-y-1.5">
            <Label className="text-xs">투표 유형</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as GroupVoteType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single" className="text-xs">
                  단일 선택 (1개만 선택)
                </SelectItem>
                <SelectItem value="multiple" className="text-xs">
                  복수 선택 (여러 개 선택)
                </SelectItem>
                <SelectItem value="ranking" className="text-xs">
                  순위 선택 (순위 지정)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 선택지 */}
          <div className="space-y-1.5">
            <Label className="text-xs">선택지 (2~8개) *</Label>
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
            {options.length < 8 && (
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

          {/* 마감일 */}
          <div className="space-y-1.5">
            <Label className="text-xs">마감일 (선택)</Label>
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 익명 여부 */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="anonymous"
              checked={anonymous}
              onCheckedChange={(v) => setAnonymous(v === true)}
            />
            <Label htmlFor="anonymous" className="text-xs cursor-pointer">
              익명 투표
            </Label>
          </div>

          {/* 작성자 */}
          <div className="space-y-1.5">
            <Label className="text-xs">작성자 이름 *</Label>
            <Input
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="내 이름을 입력하세요"
              className="h-8 text-xs"
            />
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

// ── 결과 바 (종료된 투표용) ──────────────────────────────────

function ResultBar({
  label,
  voteCount,
  percent,
  isTop,
}: {
  label: string;
  voteCount: number;
  percent: number;
  isTop: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs truncate ${isTop ? "font-medium text-blue-700" : "text-foreground"}`}
        >
          {label}
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {voteCount}표 ({percent}%)
        </span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isTop ? "bg-blue-500" : "bg-muted-foreground/30"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// ── 단일 투표 아이템 ─────────────────────────────────────────

function VoteItem({
  vote,
  currentMemberName,
  onActivate,
  onClose,
  onDelete,
  onCastBallot,
  getResults,
  hasVoted,
  getMySelectedIds,
}: {
  vote: GroupVoteEntry;
  currentMemberName: string;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  onDelete: (id: string) => void;
  onCastBallot: (
    voteId: string,
    voterName: string,
    selectedOptionIds: string[]
  ) => boolean;
  getResults: (voteId: string) => {
    optionId: string;
    label: string;
    voteCount: number;
    percent: number;
  }[];
  hasVoted: (voteId: string, voterName: string) => boolean;
  getMySelectedIds: (voteId: string, voterName: string) => string[];
}) {
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [voterName, setVoterName] = useState(currentMemberName);

  const voted = currentMemberName
    ? hasVoted(vote.id, currentMemberName)
    : false;
  const myIds = currentMemberName ? getMySelectedIds(vote.id, currentMemberName) : [];
  const results = getResults(vote.id);
  const maxVoteCount = Math.max(...results.map((r) => r.voteCount), 0);

  const handleOptionToggle = (optionId: string) => {
    if (vote.type === "single") {
      setPendingIds([optionId]);
    } else {
      setPendingIds((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleVote = () => {
    const name = voterName.trim();
    if (!name) {
      toast.error(TOAST.GROUP_VOTE_CARD.NAME_REQUIRED);
      return;
    }
    if (pendingIds.length === 0) {
      toast.error(TOAST.GROUP_VOTE_CARD.OPTION_REQUIRED);
      return;
    }
    const ok = onCastBallot(vote.id, name, pendingIds);
    if (!ok) {
      toast.error(TOAST.GROUP_VOTE_CARD.ALREADY_VOTED);
      return;
    }
    setPendingIds([]);
    toast.success(TOAST.GROUP_VOTE_CARD.COMPLETED);
  };

  const participationCount = vote.ballots.length;
  const isDeadlinePassed =
    vote.deadline && new Date(vote.deadline) < new Date();

  return (
    <div className="border rounded-lg p-3 space-y-2.5 bg-card">
      {/* 헤더 */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-xs font-medium leading-tight">{vote.title}</p>
          {vote.description && (
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {vote.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={vote.status} />
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200"
            >
              {voteTypeLabel(vote.type)}
            </Badge>
            {vote.deadline && (
              <span
                className={`text-[10px] font-medium ${
                  isDeadlinePassed
                    ? "text-red-500"
                    : "text-orange-600"
                }`}
              >
                {calcDday(vote.deadline)}
              </span>
            )}
            {vote.anonymous && (
              <span className="text-[10px] text-muted-foreground">익명</span>
            )}
          </div>
        </div>

        {/* 관리 버튼 */}
        <div className="flex items-center gap-1 shrink-0">
          {vote.status === "draft" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              title="투표 시작"
              onClick={() => {
                onActivate(vote.id);
                toast.success(TOAST.GROUP_VOTE_CARD.STARTED);
              }}
            >
              <Play className="h-3 w-3" />
            </Button>
          )}
          {vote.status === "active" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title="투표 종료"
              onClick={() => {
                onClose(vote.id);
                toast.success(TOAST.GROUP_VOTE.ENDED);
              }}
            >
              <Square className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            title="삭제"
            onClick={() => {
              onDelete(vote.id);
              toast.success(TOAST.GROUP_VOTE_CARD.DELETED);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* draft: 아직 시작 전 안내 */}
      {vote.status === "draft" && (
        <p className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
          투표가 아직 시작되지 않았습니다. 시작 버튼을 눌러 진행하세요.
        </p>
      )}

      {/* active: 투표 UI */}
      {vote.status === "active" && (
        <div className="space-y-2">
          {voted ? (
            <div className="flex items-center gap-1.5 text-green-600 bg-green-50 rounded px-2 py-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-medium">투표 완료</span>
              {myIds.length > 0 && (
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {myIds
                    .map(
                      (id) =>
                        vote.options.find((o) => o.id === id)?.label ?? ""
                    )
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
            </div>
          ) : (
            <>
              {/* 이름 입력 (currentMemberName 없을 때) */}
              {!currentMemberName && (
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    이름
                  </Label>
                  <Input
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    className="h-7 text-xs"
                  />
                </div>
              )}

              {/* 선택지 */}
              <div className="space-y-1">
                {vote.options.map((opt) => {
                  const isChecked = pendingIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded border text-left transition-colors ${
                        isChecked
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40 hover:bg-muted/30"
                      }`}
                      onClick={() => handleOptionToggle(opt.id)}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className="text-xs">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              <Button
                size="sm"
                className="h-7 text-xs w-full"
                onClick={handleVote}
                disabled={pendingIds.length === 0}
              >
                투표하기
                {pendingIds.length > 0 && vote.type !== "single" && (
                  <span className="ml-1 text-[10px]">
                    ({pendingIds.length}개 선택)
                  </span>
                )}
              </Button>
            </>
          )}
        </div>
      )}

      {/* closed: 결과 바 차트 */}
      {vote.status === "closed" && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">
              참여자가 없습니다
            </p>
          ) : (
            results.map((r) => (
              <ResultBar
                key={r.optionId}
                label={r.label}
                voteCount={r.voteCount}
                percent={r.percent}
                isTop={r.voteCount > 0 && r.voteCount === maxVoteCount}
              />
            ))
          )}
        </div>
      )}

      {/* 참여율 */}
      <p className="text-[10px] text-muted-foreground text-right">
        참여 {participationCount}명
        {vote.deadline && (
          <span className="ml-1.5">
            · 마감{" "}
            {new Date(vote.deadline).toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </p>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────

type FilterTab = "all" | "active" | "closed" | "draft";

type GroupVoteCardProps = {
  groupId: string;
  currentMemberName?: string;
};

export function GroupVoteCard({
  groupId,
  currentMemberName = "",
}: GroupVoteCardProps) {
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");

  const {
    votes,
    loading,
    totalVotes,
    activeVotes,
    closedVotes,
    draftVotes,
    averageParticipation,
    createVote,
    activateVote,
    closeVote,
    deleteVote,
    castBallot,
    getResults,
    hasVoted,
    getMySelectedIds,
  } = useGroupVote(groupId);

  const filteredVotes = votes.filter((v) => {
    if (filter === "all") return true;
    return v.status === filter;
  });

  const FILTER_TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "전체", count: totalVotes },
    { key: "active", label: "진행중", count: activeVotes },
    { key: "closed", label: "종료", count: closedVotes },
    { key: "draft", label: "초안", count: draftVotes },
  ];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-lg bg-card overflow-hidden">
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b bg-muted/30">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              <Vote className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-medium">그룹 투표</span>
              {activeVotes > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 border">
                  {activeVotes}개 진행 중
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
            <CreateVoteDialog
              onSubmit={(params) => {
                const ok = createVote(
                  params.title,
                  params.description,
                  params.type,
                  params.optionLabels,
                  params.anonymous,
                  params.deadline,
                  params.createdBy
                );
                if (!ok) {
                  toast.error(TOAST.GROUP_VOTE_CARD.CREATE_ERROR);
                }
              }}
            />
          </div>
        </div>

        <CollapsibleContent>
          <div className="p-3 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <p className="text-xs text-muted-foreground">불러오는 중...</p>
              </div>
            ) : (
              <>
                {/* 통계 요약 */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 bg-muted/40 rounded-lg">
                    <p className="text-sm font-semibold">{totalVotes}</p>
                    <p className="text-[10px] text-muted-foreground">전체</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <p className="text-sm font-semibold text-green-700">
                      {activeVotes}
                    </p>
                    <p className="text-[10px] text-green-600">진행중</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-700">
                      {closedVotes}
                    </p>
                    <p className="text-[10px] text-blue-600">종료</p>
                  </div>
                  <div className="text-center p-2 bg-muted/40 rounded-lg">
                    <p className="text-sm font-semibold">
                      {averageParticipation}
                    </p>
                    <p className="text-[10px] text-muted-foreground">평균참여</p>
                  </div>
                </div>

                {/* 필터 탭 */}
                <div className="flex gap-1">
                  {FILTER_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                        filter === tab.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                      onClick={() => setFilter(tab.key)}
                    >
                      {tab.label}
                      <span
                        className={`text-[9px] ${
                          filter === tab.key
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground/60"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* 투표 목록 */}
                {filteredVotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-1">
                    <Vote className="h-6 w-6 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">
                      {filter === "all"
                        ? "등록된 투표가 없습니다"
                        : `${FILTER_TABS.find((t) => t.key === filter)?.label} 투표가 없습니다`}
                    </p>
                    {filter === "all" && (
                      <p className="text-[10px] text-muted-foreground/60">
                        투표 만들기 버튼으로 첫 번째 투표를 만들어보세요
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredVotes.map((vote) => (
                      <VoteItem
                        key={vote.id}
                        vote={vote}
                        currentMemberName={currentMemberName}
                        onActivate={activateVote}
                        onClose={closeVote}
                        onDelete={deleteVote}
                        onCastBallot={castBallot}
                        getResults={getResults}
                        hasVoted={hasVoted}
                        getMySelectedIds={getMySelectedIds}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
