"use client";

import { useState } from "react";
import {
  Vote,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Lock,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useDecisionPoll } from "@/hooks/use-decision-poll";
import type { DecisionPoll, PollVoteChoice } from "@/types";

// ─── 투표 선택지 메타 ─────────────────────────────────────────

const CHOICE_META: Record<
  PollVoteChoice,
  {
    label: string;
    icon: React.ReactNode;
    bg: string;
    text: string;
    border: string;
    bar: string;
    activeBg: string;
  }
> = {
  agree: {
    label: "찬성",
    icon: <CheckCircle2 className="h-3 w-3" />,
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    bar: "bg-green-500",
    activeBg: "bg-green-100 border-green-400 text-green-800",
  },
  disagree: {
    label: "반대",
    icon: <XCircle className="h-3 w-3" />,
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    bar: "bg-red-500",
    activeBg: "bg-red-100 border-red-400 text-red-800",
  },
  abstain: {
    label: "보류",
    icon: <MinusCircle className="h-3 w-3" />,
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    bar: "bg-gray-400",
    activeBg: "bg-gray-100 border-gray-400 text-gray-700",
  },
};

const RESULT_LABELS: Record<PollVoteChoice, string> = {
  agree: "찬성 가결",
  disagree: "반대 부결",
  abstain: "동수 보류",
};

// ─── D-day 계산 ───────────────────────────────────────────────

function calcDday(deadline: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(deadline);
  end.setHours(0, 0, 0, 0);
  const diff = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "D-day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
}

// ─── 투표 생성 다이얼로그 ─────────────────────────────────────

interface CreatePollDialogProps {
  hook: ReturnType<typeof useDecisionPoll>;
}

function CreatePollDialog({ hook }: CreatePollDialogProps) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(
    () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  const handleSubmit = () => {
    if (!topic.trim()) {
      toast.error("안건 제목을 입력해주세요.");
      return;
    }
    if (!deadline) {
      toast.error("마감일을 선택해주세요.");
      return;
    }
    const ok = hook.createPoll(topic, description, deadline);
    if (ok) {
      toast.success("투표 안건이 등록되었습니다.");
      setTopic("");
      setDescription("");
      setDeadline(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
      setOpen(false);
    } else {
      toast.error("투표 등록에 실패했습니다.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs bg-violet-500 hover:bg-violet-600">
          <Plus className="mr-1 h-3 w-3" />
          투표 생성
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Vote className="h-4 w-4 text-violet-500" />
            투표 안건 등록
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 안건 제목 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              안건 제목
            </label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value.slice(0, 60))}
              placeholder="예: 다음 공연 날짜 확정"
              className="h-7 text-xs"
            />
            <p className="text-[10px] text-gray-400 text-right">
              {topic.length}/60
            </p>
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              설명 <span className="text-gray-400">(선택)</span>
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              placeholder="안건에 대한 배경이나 세부 내용을 입력해주세요."
              className="text-xs resize-none min-h-[70px]"
            />
            <p className="text-[10px] text-gray-400 text-right">
              {description.length}/300
            </p>
          </div>

          {/* 마감일 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              마감일
            </label>
            <div className="relative">
              <CalendarClock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-7 text-xs pl-6"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs bg-violet-500 hover:bg-violet-600"
            onClick={handleSubmit}
          >
            등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 비율 바 차트 ─────────────────────────────────────────────

interface VoteBarProps {
  votes: DecisionPoll["votes"];
}

function VoteBar({ votes }: VoteBarProps) {
  const total = votes.length;
  const agree = votes.filter((v) => v.choice === "agree").length;
  const disagree = votes.filter((v) => v.choice === "disagree").length;
  const abstain = votes.filter((v) => v.choice === "abstain").length;

  const pct = (n: number) =>
    total === 0 ? 0 : Math.round((n / total) * 100);

  const agreePct = pct(agree);
  const disagreePct = pct(disagree);
  const abstainPct = total === 0 ? 0 : 100 - agreePct - disagreePct;

  return (
    <div className="space-y-1.5">
      {/* 수평 바 */}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
        {agreePct > 0 && (
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${agreePct}%` }}
          />
        )}
        {disagreePct > 0 && (
          <div
            className="bg-red-500 transition-all"
            style={{ width: `${disagreePct}%` }}
          />
        )}
        {abstainPct > 0 && (
          <div
            className="bg-gray-400 transition-all"
            style={{ width: `${abstainPct}%` }}
          />
        )}
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-3">
        {(["agree", "disagree", "abstain"] as PollVoteChoice[]).map((c) => {
          const meta = CHOICE_META[c];
          const count = votes.filter((v) => v.choice === c).length;
          return (
            <div key={c} className="flex items-center gap-1">
              <span className={`text-[10px] ${meta.text}`}>
                {meta.label}
              </span>
              <span className="text-[10px] font-semibold text-gray-700">
                {count}표
              </span>
            </div>
          );
        })}
        <span className="text-[10px] text-gray-400 ml-auto">
          총 {total}표
        </span>
      </div>
    </div>
  );
}

// ─── 투표 행사 폼 ─────────────────────────────────────────────

interface CastVoteFormProps {
  poll: DecisionPoll;
  onCast: (
    pollId: string,
    voterName: string,
    choice: PollVoteChoice,
    reason: string
  ) => void;
}

function CastVoteForm({ poll, onCast }: CastVoteFormProps) {
  const [voterName, setVoterName] = useState("");
  const [choice, setChoice] = useState<PollVoteChoice | null>(null);
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!voterName.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    if (!choice) {
      toast.error("찬성/반대/보류 중 하나를 선택해주세요.");
      return;
    }
    onCast(poll.id, voterName, choice, reason);
  };

  return (
    <div className="mt-2 space-y-2 rounded-lg bg-gray-50 border border-gray-100 p-3">
      {/* 이름 */}
      <Input
        value={voterName}
        onChange={(e) => setVoterName(e.target.value.slice(0, 20))}
        placeholder="이름 입력"
        className="h-7 text-xs"
      />

      {/* 선택지 버튼 3개 */}
      <div className="flex gap-1.5">
        {(["agree", "disagree", "abstain"] as PollVoteChoice[]).map((c) => {
          const meta = CHOICE_META[c];
          const isSelected = choice === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setChoice(c)}
              className={`flex-1 flex items-center justify-center gap-1 h-7 text-[11px] font-medium rounded border transition-colors ${
                isSelected
                  ? meta.activeBg
                  : `${meta.bg} ${meta.text} ${meta.border} hover:opacity-80`
              }`}
            >
              {meta.icon}
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* 이유 */}
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 200))}
        placeholder="의견 또는 이유 (선택)"
        className="text-xs resize-none min-h-[48px]"
      />

      <Button
        size="sm"
        className="h-7 text-xs w-full bg-violet-500 hover:bg-violet-600"
        onClick={handleSubmit}
      >
        투표하기
      </Button>
    </div>
  );
}

// ─── 투표 카드 아이템 ─────────────────────────────────────────

interface PollItemProps {
  poll: DecisionPoll;
  onCastVote: (
    pollId: string,
    voterName: string,
    choice: PollVoteChoice,
    reason: string
  ) => void;
  onClose: (pollId: string) => void;
  onDelete: (pollId: string) => void;
}

function PollItem({ poll, onCastVote, onClose, onDelete }: PollItemProps) {
  const [voteOpen, setVoteOpen] = useState(false);
  const dday = calcDday(poll.deadline);
  const isDdayPast = dday.startsWith("D+");

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3 space-y-2 hover:border-gray-200 transition-colors">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-800">
              {poll.topic}
            </span>
            {poll.isClosed ? (
              <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border-0">
                <Lock className="h-2.5 w-2.5 mr-0.5 inline" />
                종료
              </Badge>
            ) : (
              <Badge
                className={`text-[10px] px-1.5 py-0 border-0 ${
                  isDdayPast
                    ? "bg-red-100 text-red-600"
                    : "bg-violet-100 text-violet-700"
                }`}
              >
                {dday}
              </Badge>
            )}
          </div>
          {poll.description && (
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
              {poll.description}
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 shrink-0">
          {!poll.isClosed && (
            <button
              onClick={() => onClose(poll.id)}
              className="text-[10px] text-gray-400 hover:text-orange-500 transition-colors px-1 py-0.5 rounded border border-gray-200 hover:border-orange-300"
              title="투표 종료"
            >
              종료
            </button>
          )}
          <button
            onClick={() => onDelete(poll.id)}
            className="text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 비율 바 */}
      <VoteBar votes={poll.votes} />

      {/* 종료 시 결과 배지 */}
      {poll.isClosed && poll.result && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">최종 결과:</span>
          <Badge
            className={`text-[10px] px-1.5 py-0 border-0 ${
              poll.result === "agree"
                ? "bg-green-100 text-green-700"
                : poll.result === "disagree"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {RESULT_LABELS[poll.result]}
          </Badge>
        </div>
      )}

      {/* 투표 행사 토글 */}
      {!poll.isClosed && (
        <div>
          <button
            onClick={() => setVoteOpen((v) => !v)}
            className="text-[10px] text-violet-600 hover:text-violet-700 font-medium transition-colors"
          >
            {voteOpen ? "투표 닫기" : "투표 참여"}
          </button>
          {voteOpen && (
            <CastVoteForm
              poll={poll}
              onCast={(pollId, voterName, choice, reason) => {
                onCastVote(pollId, voterName, choice, reason);
                setVoteOpen(false);
              }}
            />
          )}
        </div>
      )}

      {/* 투표 현황 목록 */}
      {poll.votes.length > 0 && (
        <details className="group">
          <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600 list-none">
            <span className="underline underline-offset-2">
              투표 현황 보기 ({poll.votes.length}명)
            </span>
          </summary>
          <div className="mt-1.5 space-y-1 max-h-40 overflow-y-auto pr-1">
            {poll.votes.map((v) => {
              const meta = CHOICE_META[v.choice];
              return (
                <div
                  key={v.id}
                  className={`flex items-start gap-2 text-[10px] rounded px-2 py-1 border ${meta.bg} ${meta.border}`}
                >
                  <span className={`font-semibold shrink-0 ${meta.text}`}>
                    {meta.label}
                  </span>
                  <span className="font-medium text-gray-700 shrink-0">
                    {v.voterName}
                  </span>
                  {v.reason && (
                    <span className="text-gray-500 truncate">{v.reason}</span>
                  )}
                  <span className="text-gray-400 shrink-0 ml-auto">
                    {formatDate(v.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {/* 마감일 */}
      <p className="text-[10px] text-gray-400">
        마감: {poll.deadline} · 등록: {formatDate(poll.createdAt)}
      </p>
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

export function DecisionPollCard({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<"active" | "closed">("active");

  const hook = useDecisionPoll(groupId);

  const activePolls = hook.polls.filter((p) => !p.isClosed);
  const closedPolls = hook.polls.filter((p) => p.isClosed);
  const displayPolls = tab === "active" ? activePolls : closedPolls;

  const handleCastVote = (
    pollId: string,
    voterName: string,
    choice: PollVoteChoice,
    reason: string
  ) => {
    const ok = hook.castVote(pollId, voterName, choice, reason);
    if (ok) {
      toast.success("투표가 완료되었습니다.");
    } else {
      toast.error("투표에 실패했습니다.");
    }
  };

  const handleClose = (pollId: string) => {
    const ok = hook.closePoll(pollId);
    if (ok) {
      toast.success("투표가 종료되었습니다.");
    } else {
      toast.error("투표 종료에 실패했습니다.");
    }
  };

  const handleDelete = (pollId: string) => {
    const ok = hook.deletePoll(pollId);
    if (ok) {
      toast.success("투표가 삭제되었습니다.");
    } else {
      toast.error("삭제에 실패했습니다.");
    }
  };

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2 pt-3 px-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <Vote className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-semibold text-gray-800">
                  의사결정 투표
                </span>
                {/* 전체 투표 수 */}
                <Badge className="text-[10px] px-1.5 py-0 bg-violet-100 text-violet-700 border-0">
                  {hook.totalPolls}개
                </Badge>
                {/* 진행 중 배지 */}
                {hook.activePollsCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-0">
                    진행 {hook.activePollsCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <CreatePollDialog hook={hook} />
                {open ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* 탭: 진행중 / 종료 */}
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as "active" | "closed")}
            >
              <TabsList className="h-7 text-xs w-full">
                <TabsTrigger value="active" className="flex-1 text-xs h-6">
                  진행중{" "}
                  <span className="ml-1 text-[10px] text-gray-500">
                    ({hook.activePollsCount})
                  </span>
                </TabsTrigger>
                <TabsTrigger value="closed" className="flex-1 text-xs h-6">
                  종료{" "}
                  <span className="ml-1 text-[10px] text-gray-500">
                    ({hook.closedPollsCount})
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={tab} className="mt-2">
                {displayPolls.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Vote className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">
                      {tab === "active"
                        ? "진행 중인 투표가 없습니다."
                        : "종료된 투표가 없습니다."}
                    </p>
                    {tab === "active" && (
                      <p className="text-[10px] mt-1">
                        안건을 등록하고 그룹원의 의견을 모아보세요!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayPolls.map((poll) => (
                      <PollItem
                        key={poll.id}
                        poll={poll}
                        onCastVote={handleCastVote}
                        onClose={handleClose}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* 요약 통계 */}
            {hook.totalPolls > 0 && (
              <>
                <Separator />
                <div className="flex items-center gap-4 text-[10px] text-gray-500">
                  <span>
                    전체{" "}
                    <span className="font-semibold text-gray-700">
                      {hook.totalPolls}
                    </span>
                    건
                  </span>
                  <span>
                    진행{" "}
                    <span className="font-semibold text-green-600">
                      {hook.activePollsCount}
                    </span>
                    건
                  </span>
                  <span>
                    종료{" "}
                    <span className="font-semibold text-gray-600">
                      {hook.closedPollsCount}
                    </span>
                    건
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
