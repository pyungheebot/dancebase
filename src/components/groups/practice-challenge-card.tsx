"use client";

import { useState } from "react";
import {
  Target,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Users,
  Trophy,
  Calendar,
  Medal,
  CheckCircle2,
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
import { usePracticeChallenge } from "@/hooks/use-practice-challenge";
import type { PracticeChallengeEntry, PracticeChallengeStatus } from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

const STATUS_LABELS: Record<PracticeChallengeStatus, string> = {
  upcoming: "예정",
  active: "진행중",
  completed: "완료",
  cancelled: "취소",
};

const STATUS_BADGE_CLASS: Record<PracticeChallengeStatus, string> = {
  upcoming: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  active: "bg-green-100 text-green-700 hover:bg-green-100",
  completed: "bg-gray-100 text-gray-500 hover:bg-gray-100",
  cancelled: "bg-red-100 text-red-400 hover:bg-red-100",
};

const STATUS_FILTER_TABS = [
  { key: "all", label: "전체" },
  { key: "active", label: "진행중" },
  { key: "upcoming", label: "예정" },
  { key: "completed", label: "완료" },
] as const;

type StatusFilter = "all" | "active" | "upcoming" | "completed";

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

function progressBarColor(progress: number): string {
  if (progress >= 100) return "bg-emerald-500";
  if (progress >= 60) return "bg-blue-400";
  if (progress >= 30) return "bg-yellow-400";
  return "bg-gray-300";
}

function calcGroupProgress(challenge: PracticeChallengeEntry): number {
  const total = challenge.participants.length;
  if (total === 0) return 0;
  const sum = challenge.participants.reduce((acc, p) => acc + p.progress, 0);
  return Math.round(sum / total);
}

// ─── 도전 추가 다이얼로그 ─────────────────────────────────────

interface AddChallengeDialogProps {
  onAdd: ReturnType<typeof usePracticeChallenge>["addChallenge"];
  currentMemberName?: string;
}

function AddChallengeDialog({
  onAdd,
  currentMemberName,
}: AddChallengeDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("10");
  const [unit, setUnit] = useState("회");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState("");
  const [reward, setReward] = useState("");

  const handleSubmit = () => {
    const ok = onAdd({
      title,
      description,
      targetValue: Number(targetValue),
      unit,
      startDate,
      endDate,
      reward,
      createdBy: currentMemberName ?? "관리자",
    });
    if (ok) {
      setTitle("");
      setDescription("");
      setTargetValue("10");
      setUnit("회");
      setStartDate(todayStr());
      setEndDate("");
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
          className="h-7 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
        >
          <Plus className="mr-1 h-3 w-3" />
          도전 추가
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-indigo-500" />
            새 연습 도전 과제
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
              placeholder="예: 이번 달 연습 50회 달성"
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
              placeholder="도전 과제에 대한 간략한 설명"
              className="h-8 text-xs"
            />
          </div>

          {/* 목표값 + 단위 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                <Target className="mr-0.5 inline h-3 w-3" />
                목표값
              </label>
              <Input
                type="number"
                min={1}
                max={99999}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="예: 50"
                className="h-8 text-xs"
              />
            </div>
            <div className="w-20">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                단위
              </label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value.slice(0, 10))}
                placeholder="예: 회"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 기간 */}
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
                className="w-full rounded-md border border-gray-200 bg-background px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
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
                className="w-full rounded-md border border-gray-200 bg-background px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
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
              className="h-7 flex-1 bg-indigo-500 text-xs hover:bg-indigo-600"
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
              ? "border-indigo-400 bg-indigo-500 text-white"
              : "border-gray-200 bg-background text-gray-500 hover:border-indigo-300 hover:text-indigo-500"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── 도전 아이템 ──────────────────────────────────────────────

interface ChallengeItemProps {
  challenge: PracticeChallengeEntry;
  memberNames?: string[];
  currentMemberName?: string;
  onDelete: (id: string) => void;
  onJoin: ReturnType<typeof usePracticeChallenge>["joinChallenge"];
  onUpdateProgress: ReturnType<typeof usePracticeChallenge>["updateProgress"];
  onComplete: ReturnType<typeof usePracticeChallenge>["completeChallenge"];
}

function ChallengeItem({
  challenge,
  memberNames,
  currentMemberName,
  onDelete,
  onJoin,
  onUpdateProgress,
  onComplete,
}: ChallengeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [joinName, setJoinName] = useState(currentMemberName ?? "");
  const [progressInput, setProgressInput] = useState<Record<string, string>>({});

  const groupProgress = calcGroupProgress(challenge);
  const dday = calcDDay(challenge.endDate);

  const isCurrentMemberJoined =
    currentMemberName &&
    challenge.participants.some(
      (p) => p.memberName.toLowerCase() === currentMemberName.toLowerCase()
    );

  const handleJoin = () => {
    if (!joinName.trim()) return;
    const ok = onJoin(challenge.id, joinName);
    if (ok && !currentMemberName) setJoinName("");
  };

  const handleProgressSubmit = (memberName: string) => {
    const val = progressInput[memberName];
    if (val === undefined) return;
    const num = Math.max(0, Math.min(100, Math.round(Number(val))));
    onUpdateProgress(challenge.id, memberName, num);
    setProgressInput((prev) => {
      const next = { ...prev };
      delete next[memberName];
      return next;
    });
  };

  return (
    <div className="rounded-lg border border-gray-100 bg-card overflow-hidden">
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
              className={`shrink-0 text-[10px] px-1.5 py-0 ${STATUS_BADGE_CLASS[challenge.status]}`}
            >
              {STATUS_LABELS[challenge.status]}
            </Badge>
          </div>
          {/* 그룹 평균 진행률 바 */}
          <div className="flex items-center gap-1.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${progressBarColor(groupProgress)}`}
                style={{ width: `${groupProgress}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] text-gray-400">
              {groupProgress}%
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
                  : "text-indigo-500"
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
            {challenge.description && <p>{challenge.description}</p>}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              <span>
                <Calendar className="mr-0.5 inline h-3 w-3" />
                {challenge.startDate} ~ {challenge.endDate}
              </span>
              <span>
                <Target className="mr-0.5 inline h-3 w-3" />
                목표 {challenge.targetValue} {challenge.unit}
              </span>
              {challenge.reward && (
                <span>
                  <Trophy className="mr-0.5 inline h-3 w-3" />
                  {challenge.reward}
                </span>
              )}
            </div>
          </div>

          {/* 참가 등록 */}
          {challenge.status === "active" && !isCurrentMemberJoined && (
            <div className="flex gap-1.5">
              {memberNames && memberNames.length > 0 ? (
                <select
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  className="flex-1 rounded-md border border-gray-200 bg-background px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                >
                  <option value="">멤버 선택</option>
                  {memberNames
                    .filter(
                      (name) =>
                        !challenge.participants.some(
                          (p) => p.memberName.toLowerCase() === name.toLowerCase()
                        )
                    )
                    .map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                </select>
              ) : (
                <Input
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value.slice(0, 20))}
                  placeholder="이름 입력 후 참가"
                  className="h-7 flex-1 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleJoin();
                  }}
                />
              )}
              <Button
                size="sm"
                className="h-7 shrink-0 bg-indigo-500 text-xs hover:bg-indigo-600"
                onClick={handleJoin}
                disabled={!joinName.trim()}
              >
                참가
              </Button>
            </div>
          )}

          {/* 참여자 목록 */}
          {challenge.participants.length === 0 ? (
            <p className="text-center text-[10px] text-gray-400 py-2">
              아직 참가자가 없습니다.
            </p>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                <Users className="h-3 w-3" />
                참가자 ({challenge.participants.length}명)
              </div>
              {challenge.participants.map((p) => (
                <div
                  key={p.memberName}
                  className="rounded-md border border-gray-100 bg-background px-2.5 py-2 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-20 shrink-0 truncate text-xs font-medium text-gray-700">
                      {p.memberName}
                    </span>
                    <div className="flex-1 flex items-center gap-1.5">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all ${progressBarColor(p.progress)}`}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span
                        className={`w-9 shrink-0 text-right text-xs font-bold ${
                          p.progress >= 100
                            ? "text-emerald-600"
                            : p.progress >= 60
                              ? "text-blue-500"
                              : "text-gray-500"
                        }`}
                      >
                        {p.progress}%
                      </span>
                    </div>
                    {p.progress >= 100 && (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    )}
                  </div>

                  {/* 진행률 직접 입력 (현재 사용자 or 전체) */}
                  {challenge.status === "active" &&
                    (currentMemberName
                      ? p.memberName === currentMemberName
                      : true) && (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={
                            progressInput[p.memberName] !== undefined
                              ? Number(progressInput[p.memberName])
                              : p.progress
                          }
                          onChange={(e) =>
                            setProgressInput((prev) => ({
                              ...prev,
                              [p.memberName]: e.target.value,
                            }))
                          }
                          onMouseUp={() => handleProgressSubmit(p.memberName)}
                          onTouchEnd={() => handleProgressSubmit(p.memberName)}
                          className="flex-1 accent-indigo-500"
                          title={`${p.memberName} 진행률`}
                        />
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={
                            progressInput[p.memberName] !== undefined
                              ? progressInput[p.memberName]
                              : p.progress
                          }
                          onChange={(e) =>
                            setProgressInput((prev) => ({
                              ...prev,
                              [p.memberName]: e.target.value,
                            }))
                          }
                          onBlur={() => handleProgressSubmit(p.memberName)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleProgressSubmit(p.memberName);
                          }}
                          className="h-6 w-14 shrink-0 text-center text-xs"
                        />
                        <span className="shrink-0 text-[10px] text-gray-400">%</span>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}

          {/* 완료 처리 버튼 */}
          {challenge.status === "active" && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300"
                onClick={() => onComplete(challenge.id)}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                완료 처리
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 리더보드 ─────────────────────────────────────────────────

interface LeaderboardProps {
  topParticipants: Array<{
    memberName: string;
    progress: number;
    completedAt?: string;
    challengeTitle: string;
  }>;
}

function Leaderboard({ topParticipants }: LeaderboardProps) {
  if (topParticipants.length === 0) return null;

  const rankColors = [
    "text-yellow-500",
    "text-gray-400",
    "text-amber-600",
    "text-gray-500",
    "text-gray-500",
  ];

  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700">
        <Medal className="h-3.5 w-3.5" />
        리더보드 (상위 5명)
      </div>
      <div className="space-y-1">
        {topParticipants.map((p, idx) => (
          <div
            key={`${p.memberName}-${idx}`}
            className="flex items-center gap-2 rounded-md bg-background px-2.5 py-1.5"
          >
            <span
              className={`w-5 shrink-0 text-center text-xs font-bold ${rankColors[idx] ?? "text-gray-500"}`}
            >
              {idx + 1}
            </span>
            <span className="flex-1 truncate text-xs font-medium text-gray-700">
              {p.memberName}
            </span>
            <span className="shrink-0 text-[10px] text-gray-400 truncate max-w-[80px]">
              {p.challengeTitle}
            </span>
            <div className="flex items-center gap-1">
              <div className="h-1 w-16 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${progressBarColor(p.progress)}`}
                  style={{ width: `${p.progress}%` }}
                />
              </div>
              <span
                className={`w-8 text-right text-[10px] font-bold ${
                  p.progress >= 100 ? "text-emerald-600" : "text-gray-500"
                }`}
              >
                {p.progress}%
              </span>
              {p.progress >= 100 && (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface PracticeChallengeCardProps {
  groupId: string;
  memberNames?: string[];
  currentMemberName?: string;
}

export function PracticeChallengeCard({
  groupId,
  memberNames,
  currentMemberName,
}: PracticeChallengeCardProps) {
  const [open, setOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const {
    challenges,
    addChallenge,
    deleteChallenge,
    joinChallenge,
    updateProgress,
    completeChallenge,
    stats,
  } = usePracticeChallenge(groupId);

  const filtered =
    statusFilter === "all"
      ? challenges
      : challenges.filter((c) => c.status === statusFilter);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800">
            연습 도전 과제
          </span>
          {stats.activeChallenges > 0 && (
            <Badge className="bg-green-100 text-[10px] px-1.5 py-0 text-green-600 hover:bg-green-100">
              진행중 {stats.activeChallenges}
            </Badge>
          )}
          {stats.completedChallenges > 0 && (
            <Badge className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-500 hover:bg-gray-100">
              완료 {stats.completedChallenges}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <AddChallengeDialog
            onAdd={addChallenge}
            currentMemberName={currentMemberName}
          />
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
        <div className="rounded-b-lg border border-gray-200 bg-card p-4 space-y-4">
          {challenges.length === 0 ? (
            /* 데이터 없음 */
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-400">
              <Target className="h-10 w-10 opacity-20" />
              <p className="text-xs">아직 등록된 도전 과제가 없습니다.</p>
              <p className="text-[11px]">
                상단의 &ldquo;도전 추가&rdquo; 버튼으로 첫 도전을 만들어보세요.
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

              {/* ── 도전 목록 ── */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1 py-6 text-gray-400">
                  <Target className="h-8 w-8 opacity-20" />
                  <p className="text-xs">해당 상태의 도전 과제가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((challenge) => (
                    <ChallengeItem
                      key={challenge.id}
                      challenge={challenge}
                      memberNames={memberNames}
                      currentMemberName={currentMemberName}
                      onDelete={deleteChallenge}
                      onJoin={joinChallenge}
                      onUpdateProgress={updateProgress}
                      onComplete={completeChallenge}
                    />
                  ))}
                </div>
              )}

              {/* ── 리더보드 ── */}
              <Leaderboard topParticipants={stats.topParticipants} />
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
