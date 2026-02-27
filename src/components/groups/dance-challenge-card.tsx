"use client";

import { useState } from "react";
import {
  Flame,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Users,
  Trophy,
  Calendar,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDanceChallenge } from "@/hooks/use-dance-challenge";
import type { ChallengeCategory, DanceChallenge } from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  technique: "테크닉",
  freestyle: "프리스타일",
  cover: "커버댄스",
  flexibility: "유연성",
  endurance: "체력",
  creativity: "창작",
};

const CATEGORY_BADGE_CLASS: Record<ChallengeCategory, string> = {
  technique: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  freestyle: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  cover: "bg-pink-100 text-pink-700 hover:bg-pink-100",
  flexibility: "bg-green-100 text-green-700 hover:bg-green-100",
  endurance: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  creativity: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
};

const STATUS_FILTER_TABS = [
  { key: "all", label: "전체" },
  { key: "upcoming", label: "예정" },
  { key: "active", label: "진행중" },
  { key: "ended", label: "종료" },
] as const;

type StatusFilter = "all" | "upcoming" | "active" | "ended";

// ─── 헬퍼 ────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function calcDDay(endDate: string): string {
  const today = new Date(todayStr());
  const end = new Date(endDate);
  const diff = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return "종료";
  if (diff === 0) return "D-Day";
  return `D-${diff}`;
}

function calcCompletionRate(challenge: DanceChallenge): number {
  const total = challenge.participants.length;
  if (total === 0) return 0;
  const completed = challenge.participants.filter(
    (p) => p.progress === 100
  ).length;
  return Math.round((completed / total) * 100);
}

function progressBarColor(progress: number): string {
  if (progress >= 100) return "bg-emerald-500";
  if (progress >= 60) return "bg-blue-400";
  if (progress >= 30) return "bg-yellow-400";
  return "bg-gray-300";
}

// ─── 챌린지 추가 다이얼로그 ───────────────────────────────────

interface AddChallengeDialogProps {
  onAdd: ReturnType<typeof useDanceChallenge>["addChallenge"];
}

function AddChallengeDialog({ onAdd }: AddChallengeDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ChallengeCategory>("technique");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState("");
  const [targetCount, setTargetCount] = useState("10");
  const [reward, setReward] = useState("");

  const handleSubmit = () => {
    const ok = onAdd({
      title,
      description,
      category,
      startDate,
      endDate,
      targetCount: Number(targetCount),
      reward,
    });
    if (ok) {
      setTitle("");
      setDescription("");
      setCategory("technique");
      setStartDate(todayStr());
      setEndDate("");
      setTargetCount("10");
      setReward("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-orange-200 text-orange-600 hover:bg-orange-50"
        >
          <Plus className="mr-1 h-3 w-3" />
          챌린지 추가
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Flame className="h-4 w-4 text-orange-500" />
            새 챌린지 생성
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 제목 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              제목
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 50))}
              placeholder="챌린지 제목을 입력하세요"
              className="h-8 text-xs"
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              설명 (선택)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 100))}
              placeholder="챌린지에 대한 간략한 설명"
              className="h-8 text-xs"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              카테고리
            </label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ChallengeCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(CATEGORY_LABELS) as [
                    ChallengeCategory,
                    string,
                  ][]
                ).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 시작일 / 종료일 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                <Calendar className="mr-0.5 inline h-3 w-3" />
                시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
          </div>

          {/* 목표 횟수 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              <Target className="mr-0.5 inline h-3 w-3" />
              목표 횟수
            </label>
            <Input
              type="number"
              min={1}
              max={9999}
              value={targetCount}
              onChange={(e) => setTargetCount(e.target.value)}
              placeholder="예: 30"
              className="h-8 text-xs"
            />
          </div>

          {/* 보상 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              <Trophy className="mr-0.5 inline h-3 w-3" />
              보상 (선택)
            </label>
            <Input
              value={reward}
              onChange={(e) => setReward(e.target.value.slice(0, 80))}
              placeholder="완료 시 보상 내용"
              className="h-8 text-xs"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="h-7 flex-1 bg-orange-500 text-xs hover:bg-orange-600"
              onClick={handleSubmit}
            >
              <Plus className="mr-1 h-3 w-3" />
              생성
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 상태 필터 탭 ─────────────────────────────────────────────

function StatusFilterTabs({
  selected,
  onSelect,
}: {
  selected: StatusFilter;
  onSelect: (v: StatusFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {STATUS_FILTER_TABS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
            selected === key
              ? "border-orange-400 bg-orange-500 text-white"
              : "border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── 챌린지 아이템 ────────────────────────────────────────────

interface ChallengeItemProps {
  challenge: DanceChallenge;
  onDelete: (id: string) => void;
  onJoin: ReturnType<typeof useDanceChallenge>["joinChallenge"];
  onUpdateProgress: ReturnType<typeof useDanceChallenge>["updateProgress"];
}

function ChallengeItem({
  challenge,
  onDelete,
  onJoin,
  onUpdateProgress,
}: ChallengeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [joinName, setJoinName] = useState("");
  const completionRate = calcCompletionRate(challenge);
  const dday = calcDDay(challenge.endDate);

  const statusBadgeClass =
    challenge.status === "active"
      ? "bg-green-100 text-green-700 hover:bg-green-100"
      : challenge.status === "upcoming"
        ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
        : "bg-gray-100 text-gray-500 hover:bg-gray-100";

  const statusLabel =
    challenge.status === "active"
      ? "진행중"
      : challenge.status === "upcoming"
        ? "예정"
        : "종료";

  const handleJoin = () => {
    if (!joinName.trim()) return;
    const ok = onJoin(challenge.id, joinName);
    if (ok) setJoinName("");
  };

  return (
    <div className="rounded-lg border border-gray-100 bg-white overflow-hidden">
      {/* 요약 행 */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* 제목 영역 */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-800 truncate">
              {challenge.title}
            </span>
            <Badge
              className={`shrink-0 text-[10px] px-1.5 py-0 ${CATEGORY_BADGE_CLASS[challenge.category]}`}
            >
              {CATEGORY_LABELS[challenge.category]}
            </Badge>
            <Badge
              className={`shrink-0 text-[10px] px-1.5 py-0 ${statusBadgeClass}`}
            >
              {statusLabel}
            </Badge>
          </div>
          {/* 완료율 프로그레스 바 */}
          <div className="flex items-center gap-1.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${progressBarColor(completionRate)}`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] text-gray-400">
              {completionRate}%
            </span>
          </div>
        </div>

        {/* 우측 메타 */}
        <div className="flex shrink-0 items-center gap-2 text-[10px] text-gray-400">
          <span className="flex items-center gap-0.5">
            <Users className="h-3 w-3" />
            {challenge.participants.length}명
          </span>
          <span
            className={`font-semibold ${
              dday === "종료"
                ? "text-gray-400"
                : dday === "D-Day"
                  ? "text-red-500"
                  : "text-orange-500"
            }`}
          >
            {dday}
          </span>
        </div>

        {/* 삭제 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 shrink-0 p-0 text-gray-300 hover:text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(challenge.id);
          }}
          title="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>

        {/* 펼침 아이콘 */}
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        )}
      </div>

      {/* 확장 영역 */}
      {expanded && (
        <div className="border-t border-gray-100 px-3 pb-3 pt-2 space-y-3 bg-gray-50">
          {/* 설명 / 기간 / 목표 / 보상 */}
          <div className="space-y-1 text-[11px] text-gray-500">
            {challenge.description && (
              <p>{challenge.description}</p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span>
                <Calendar className="mr-0.5 inline h-3 w-3" />
                {challenge.startDate} ~ {challenge.endDate}
              </span>
              <span>
                <Target className="mr-0.5 inline h-3 w-3" />
                목표 {challenge.targetCount}회
              </span>
              {challenge.reward && (
                <span>
                  <Trophy className="mr-0.5 inline h-3 w-3" />
                  {challenge.reward}
                </span>
              )}
            </div>
          </div>

          {/* 참여 등록 */}
          {challenge.status !== "ended" && (
            <div className="flex gap-1.5">
              <Input
                value={joinName}
                onChange={(e) => setJoinName(e.target.value.slice(0, 20))}
                placeholder="이름 입력 후 참여"
                className="h-7 flex-1 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoin();
                }}
              />
              <Button
                size="sm"
                className="h-7 shrink-0 bg-orange-500 text-xs hover:bg-orange-600"
                onClick={handleJoin}
                disabled={!joinName.trim()}
              >
                참여
              </Button>
            </div>
          )}

          {/* 참여자 목록 */}
          {challenge.participants.length === 0 ? (
            <p className="text-center text-[10px] text-gray-400 py-2">
              아직 참여자가 없습니다.
            </p>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                <Users className="h-3 w-3" />
                참여자 ({challenge.participants.length}명)
              </div>
              {challenge.participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 rounded-md border border-gray-100 bg-white px-2.5 py-1.5"
                >
                  <span className="w-20 shrink-0 truncate text-xs font-medium text-gray-700">
                    {p.name}
                  </span>

                  {/* 진행률 슬라이더 */}
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={p.progress}
                    onChange={(e) =>
                      onUpdateProgress(
                        challenge.id,
                        p.id,
                        Number(e.target.value)
                      )
                    }
                    className="flex-1 accent-orange-500"
                    title={`${p.name} 진행률`}
                  />

                  {/* 진행률 수치 */}
                  <span
                    className={`w-9 shrink-0 text-right text-xs font-bold ${
                      p.progress === 100
                        ? "text-emerald-600"
                        : p.progress >= 60
                          ? "text-blue-500"
                          : "text-gray-500"
                    }`}
                  >
                    {p.progress}%
                  </span>

                  {/* 완료 배지 */}
                  {p.progress === 100 && (
                    <Badge className="shrink-0 bg-emerald-100 text-[10px] px-1.5 py-0 text-emerald-700 hover:bg-emerald-100">
                      완료
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface DanceChallengeCardProps {
  groupId: string;
  userId: string;
}

export function DanceChallengeCard({ groupId }: DanceChallengeCardProps) {
  const [open, setOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const {
    challenges,
    addChallenge,
    deleteChallenge,
    joinChallenge,
    updateProgress,
    activeChallenges,
    totalParticipants,
    completionRate,
  } = useDanceChallenge(groupId);

  const filtered =
    statusFilter === "all"
      ? challenges
      : challenges.filter((c) => c.status === statusFilter);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-semibold text-gray-800">
            댄스 챌린지
          </span>
          {activeChallenges > 0 && (
            <Badge className="bg-orange-100 text-[10px] px-1.5 py-0 text-orange-600 hover:bg-orange-100">
              진행중 {activeChallenges}
            </Badge>
          )}
          {totalParticipants > 0 && (
            <Badge className="bg-blue-100 text-[10px] px-1.5 py-0 text-blue-600 hover:bg-blue-100">
              <Users className="mr-0.5 inline h-2.5 w-2.5" />
              {totalParticipants}명
            </Badge>
          )}
          {challenges.length > 0 && (
            <Badge className="bg-emerald-100 text-[10px] px-1.5 py-0 text-emerald-600 hover:bg-emerald-100">
              완료율 {completionRate}%
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <AddChallengeDialog onAdd={addChallenge} />
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              {open ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      {/* ── 본문 ── */}
      <CollapsibleContent>
        <div className="rounded-b-lg border border-gray-200 bg-white p-4 space-y-4">
          {challenges.length === 0 ? (
            /* 데이터 없음 */
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-400">
              <Flame className="h-10 w-10 opacity-20" />
              <p className="text-xs">아직 등록된 챌린지가 없습니다.</p>
              <p className="text-[11px]">
                상단의 &ldquo;챌린지 추가&rdquo; 버튼으로 첫 챌린지를 만들어보세요.
              </p>
            </div>
          ) : (
            <>
              {/* ── 상태 필터 탭 ── */}
              <StatusFilterTabs
                selected={statusFilter}
                onSelect={setStatusFilter}
              />

              <Separator />

              {/* ── 챌린지 목록 ── */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1 py-6 text-gray-400">
                  <Flame className="h-8 w-8 opacity-20" />
                  <p className="text-xs">해당 상태의 챌린지가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((challenge) => (
                    <ChallengeItem
                      key={challenge.id}
                      challenge={challenge}
                      onDelete={deleteChallenge}
                      onJoin={joinChallenge}
                      onUpdateProgress={updateProgress}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
