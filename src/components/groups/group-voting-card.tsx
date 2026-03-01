"use client";

import { useState, useId } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Vote,
  CheckSquare,
  Clock,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupVoting } from "@/hooks/use-group-voting";
import type { GroupVoteCardItem } from "@/types";

// ── 더미 사용자 ID (실제 프로젝트에서는 인증 컨텍스트에서 가져옴) ──
const DUMMY_USER_ID = "local-user";

// ── 날짜 포매터 ────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "마감";
  if (diffDays === 0) return "오늘 마감";
  if (diffDays === 1) return "내일 마감";
  return `${diffDays}일 남음`;
}

// ── 결과 바 차트 ───────────────────────────────────────────────────

function OptionBar({
  label,
  count,
  percent,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  count: number;
  percent: number;
  selected: boolean;
  onClick?: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left rounded-md border transition-colors ${
        selected
          ? "border-blue-400 bg-blue-50"
          : "border-gray-200 bg-gray-50 hover:bg-gray-100"
      } ${disabled ? "cursor-default" : "cursor-pointer"} p-2`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700 truncate pr-2">
          {label}
        </span>
        <span className="text-[10px] text-gray-500 shrink-0">
          {count}표 ({percent}%)
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            selected ? "bg-blue-500" : "bg-gray-400"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </button>
  );
}

// ── 투표 카드 아이템 ───────────────────────────────────────────────

function VoteItem({
  vote,
  onCastVote,
  onDelete,
  getMyVotes,
  isExpired,
  getOptionStats,
}: {
  vote: GroupVoteCardItem;
  onCastVote: (voteId: string, optionIds: string[], userId: string) => boolean;
  onDelete: (voteId: string) => boolean;
  getMyVotes: (voteId: string, userId: string) => string[];
  isExpired: (vote: GroupVoteCardItem) => boolean;
  getOptionStats: (
    vote: GroupVoteCardItem
  ) => Array<{ id: string; label: string; count: number; percent: number; voterIds: string[] }>;
}) {
  const expired = isExpired(vote);
  const myVotes = getMyVotes(vote.id, DUMMY_USER_ID);
  const optionStats = getOptionStats(vote);
  const totalVoters = new Set(vote.options.flatMap((o) => o.voterIds)).size;

  // 복수 선택 상태
  const [multiSelected, setMultiSelected] = useState<string[]>(myVotes);

  const handleSingleVote = (optionId: string) => {
    if (expired) return;
    const success = onCastVote(vote.id, [optionId], DUMMY_USER_ID);
    if (!success) {
      toast.error("투표할 수 없습니다.");
    }
  };

  const handleMultiToggle = (optionId: string) => {
    setMultiSelected((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleMultiSubmit = () => {
    if (multiSelected.length === 0) {
      toast.error("하나 이상의 선택지를 선택하세요.");
      return;
    }
    const success = onCastVote(vote.id, multiSelected, DUMMY_USER_ID);
    if (success) {
      toast.success("투표가 반영되었습니다.");
    } else {
      toast.error("투표할 수 없습니다.");
    }
  };

  const handleDelete = () => {
    const success = onDelete(vote.id);
    if (success) {
      toast.success("투표가 삭제되었습니다.");
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  };

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-white">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-gray-800 truncate">
              {vote.title}
            </span>
            {expired ? (
              <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border-gray-200">
                마감
              </Badge>
            ) : (
              <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                진행중
              </Badge>
            )}
            {vote.multipleChoice && (
              <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200">
                복수선택
              </Badge>
            )}
            {vote.anonymous && (
              <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200">
                익명
              </Badge>
            )}
          </div>
          {vote.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
              {vote.description}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 shrink-0"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* 메타 정보 */}
      <div className="flex items-center gap-3 text-[10px] text-gray-400">
        <span className="flex items-center gap-0.5">
          <Users className="h-3 w-3" />
          {totalVoters}명 참여
        </span>
        {vote.deadline && (
          <span className="flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {expired
              ? formatDate(vote.deadline)
              : formatDeadline(vote.deadline)}
          </span>
        )}
        <span>{formatDate(vote.createdAt)}</span>
      </div>

      <Separator />

      {/* 선택지 */}
      <div className="space-y-1.5">
        {optionStats.map((opt) => {
          const isSelected = myVotes.includes(opt.id);
          const isMultiSelected = multiSelected.includes(opt.id);

          if (vote.multipleChoice) {
            return (
              <div key={opt.id} className="flex items-center gap-2">
                <Checkbox
                  id={`opt-${opt.id}`}
                  checked={isMultiSelected}
                  disabled={expired}
                  onCheckedChange={() => handleMultiToggle(opt.id)}
                  className="shrink-0"
                />
                <div className="flex-1">
                  <OptionBar
                    label={opt.label}
                    count={opt.count}
                    percent={opt.percent}
                    selected={isSelected}
                    disabled={expired}
                  />
                </div>
              </div>
            );
          }

          return (
            <OptionBar
              key={opt.id}
              label={opt.label}
              count={opt.count}
              percent={opt.percent}
              selected={isSelected}
              onClick={() => handleSingleVote(opt.id)}
              disabled={expired}
            />
          );
        })}
      </div>

      {/* 복수 선택 제출 버튼 */}
      {vote.multipleChoice && !expired && (
        <Button
          size="sm"
          className="h-7 text-xs w-full"
          onClick={handleMultiSubmit}
        >
          <CheckSquare className="h-3 w-3 mr-1" />
          투표 확인
        </Button>
      )}
    </div>
  );
}

// ── 투표 생성 다이얼로그 ────────────────────────────────────────────

function CreateVoteDialog({
  onAdd,
}: {
  onAdd: (
    partial: Omit<GroupVoteCardItem, "id" | "createdAt" | "options" | "createdBy"> & {
      optionLabels: string[];
    },
    userId: string
  ) => void;
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [deadline, setDeadline] = useState("");
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [anonymous, setAnonymous] = useState(false);

  const reset = () => {
    setTitle("");
    setDescription("");
    setOptions(["", ""]);
    setDeadline("");
    setMultipleChoice(false);
    setAnonymous(false);
  };

  const addOption = () => {
    if (options.length >= 6) {
      toast.error("선택지는 최대 6개까지 추가할 수 있습니다.");
      return;
    }
    setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) {
      toast.error("선택지는 최소 2개 이상이어야 합니다.");
      return;
    }
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? value : o)));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("투표 제목을 입력하세요.");
      return;
    }
    const filledOptions = options.map((o) => o.trim()).filter(Boolean);
    if (filledOptions.length < 2) {
      toast.error("선택지를 2개 이상 입력하세요.");
      return;
    }
    onAdd(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        optionLabels: filledOptions,
        deadline: deadline || undefined,
        multipleChoice,
        anonymous,
      },
      DUMMY_USER_ID
    );
    toast.success("투표가 생성되었습니다.");
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          투표 만들기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">새 투표 만들기</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {/* 제목 */}
          <div className="space-y-1">
            <Label htmlFor={`${uid}-title`} className="text-xs">
              투표 제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${uid}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex) 다음 정기 공연 날짜를 결정해 주세요"
              className="h-8 text-xs"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label htmlFor={`${uid}-desc`} className="text-xs">
              설명 (선택)
            </Label>
            <Textarea
              id={`${uid}-desc`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="투표에 대한 부연 설명을 입력하세요"
              className="text-xs min-h-[60px] resize-none"
            />
          </div>

          {/* 선택지 */}
          <div className="space-y-1">
            <Label className="text-xs">
              선택지 <span className="text-red-500">*</span>
              <span className="text-gray-400 ml-1">(2~6개)</span>
            </Label>
            <div className="space-y-1.5">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`선택지 ${idx + 1}`}
                    className="h-8 text-xs flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                    onClick={() => removeOption(idx)}
                    disabled={options.length <= 2}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {options.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs w-full"
                  onClick={addOption}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  선택지 추가
                </Button>
              )}
            </div>
          </div>

          {/* 마감일 */}
          <div className="space-y-1">
            <Label htmlFor={`${uid}-deadline`} className="text-xs">
              마감일 (선택)
            </Label>
            <Input
              id={`${uid}-deadline`}
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 옵션 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${uid}-multi`} className="text-xs cursor-pointer">
                복수 선택 허용
              </Label>
              <Switch
                id={`${uid}-multi`}
                checked={multipleChoice}
                onCheckedChange={setMultipleChoice}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`${uid}-anon`} className="text-xs cursor-pointer">
                익명 투표
              </Label>
              <Switch
                id={`${uid}-anon`}
                checked={anonymous}
                onCheckedChange={setAnonymous}
              />
            </div>
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
            투표 만들기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────

export function GroupVotingCard({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<"active" | "closed">("active");

  const {
    addVote,
    castVote,
    deleteVote,
    getMyVotes,
    isExpired,
    getOptionStats,
    activeVotes,
    closedVotes,
    stats,
    loading,
  } = useGroupVoting(groupId);

  const displayVotes = tab === "active" ? activeVotes : closedVotes;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-xl bg-white shadow-sm">
        {/* 카드 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-t-xl transition-colors">
            <div className="flex items-center gap-2">
              <Vote className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800">
                그룹 투표
              </span>
              <div className="flex items-center gap-1">
                <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                  진행중 {stats.active}
                </Badge>
                <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border-gray-200">
                  마감 {stats.closed}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreateVoteDialog onAdd={addVote} />
              {open ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            <Separator />

            {/* 통계 요약 */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "전체", value: stats.total, color: "text-gray-700" },
                {
                  label: "진행중",
                  value: stats.active,
                  color: "text-green-600",
                },
                { label: "마감", value: stats.closed, color: "text-gray-400" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="text-center p-2 bg-gray-50 rounded-lg border"
                >
                  <p className={`text-base font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-gray-400">{label}</p>
                </div>
              ))}
            </div>

            {/* 탭 */}
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as "active" | "closed")}
            >
              <TabsList className="h-7 text-xs w-full">
                <TabsTrigger value="active" className="flex-1 text-xs h-6">
                  진행중 ({stats.active})
                </TabsTrigger>
                <TabsTrigger value="closed" className="flex-1 text-xs h-6">
                  마감 ({stats.closed})
                </TabsTrigger>
              </TabsList>

              {/* 진행중 탭 */}
              <TabsContent value="active" className="mt-2 space-y-2">
                {loading ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    불러오는 중...
                  </p>
                ) : activeVotes.length === 0 ? (
                  <div className="text-center py-6 space-y-1">
                    <Vote className="h-8 w-8 text-gray-200 mx-auto" />
                    <p className="text-xs text-gray-400">
                      진행중인 투표가 없습니다.
                    </p>
                    <p className="text-[10px] text-gray-300">
                      투표 만들기로 새 투표를 시작하세요.
                    </p>
                  </div>
                ) : (
                  displayVotes.map((vote) => (
                    <VoteItem
                      key={vote.id}
                      vote={vote}
                      onCastVote={castVote}
                      onDelete={deleteVote}
                      getMyVotes={getMyVotes}
                      isExpired={isExpired}
                      getOptionStats={getOptionStats}
                    />
                  ))
                )}
              </TabsContent>

              {/* 마감 탭 */}
              <TabsContent value="closed" className="mt-2 space-y-2">
                {loading ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    불러오는 중...
                  </p>
                ) : closedVotes.length === 0 ? (
                  <div className="text-center py-6 space-y-1">
                    <Clock className="h-8 w-8 text-gray-200 mx-auto" />
                    <p className="text-xs text-gray-400">
                      마감된 투표가 없습니다.
                    </p>
                  </div>
                ) : (
                  displayVotes.map((vote) => (
                    <VoteItem
                      key={vote.id}
                      vote={vote}
                      onCastVote={castVote}
                      onDelete={deleteVote}
                      getMyVotes={getMyVotes}
                      isExpired={isExpired}
                      getOptionStats={getOptionStats}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
