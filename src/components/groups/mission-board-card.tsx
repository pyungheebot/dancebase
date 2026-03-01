"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Flag,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Trophy,
  Crown,
  Medal,
  Star,
  CheckCircle2,
  Calendar,
  Users,
  Zap,
  PowerOff,
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
import { useMissionBoard } from "@/hooks/use-mission-board";
import type { MissionDifficulty } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ─── 상수 ────────────────────────────────────────────────────

const DIFFICULTY_LABELS: Record<MissionDifficulty, string> = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
  extreme: "극한",
};

const DIFFICULTY_BADGE_CLASS: Record<MissionDifficulty, string> = {
  easy: "bg-green-100 text-green-700 hover:bg-green-100",
  medium: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  hard: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  extreme: "bg-red-100 text-red-700 hover:bg-red-100",
};

// 1~3위 메달 메타
const RANK_META = [
  {
    Icon: Crown,
    color: "text-yellow-500",
    bg: "bg-yellow-50 border-yellow-200",
    badgeCls: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    label: "1위",
  },
  {
    Icon: Medal,
    color: "text-slate-400",
    bg: "bg-slate-50 border-slate-200",
    badgeCls: "bg-slate-100 text-slate-600 hover:bg-slate-100",
    label: "2위",
  },
  {
    Icon: Trophy,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    badgeCls: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    label: "3위",
  },
] as const;

// ─── 헬퍼 함수 ───────────────────────────────────────────────

function calcDday(deadline: string): { label: string; urgent: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: `D+${Math.abs(diff)}`, urgent: false };
  if (diff === 0) return { label: "D-Day", urgent: true };
  return { label: `D-${diff}`, urgent: diff <= 3 };
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── 미션 추가 다이얼로그 ─────────────────────────────────────

interface AddMissionDialogProps {
  memberNames: string[];
  onAdd: ReturnType<typeof useMissionBoard>["addMission"];
}

function AddMissionDialog({ memberNames, onAdd }: AddMissionDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<MissionDifficulty>("medium");
  const [points, setPoints] = useState("10");
  const [deadline, setDeadline] = useState("");
  const [maxCompletions, setMaxCompletions] = useState("");
  const [createdBy, setCreatedBy] = useState(memberNames[0] ?? "");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("미션 제목을 입력해주세요.");
      return;
    }
    if (!description.trim()) {
      toast.error("미션 설명을 입력해주세요.");
      return;
    }
    const pts = parseInt(points, 10);
    if (isNaN(pts) || pts <= 0) {
      toast.error("포인트는 1 이상의 숫자를 입력해주세요.");
      return;
    }
    const maxComp = maxCompletions ? parseInt(maxCompletions, 10) : undefined;
    if (maxCompletions && (isNaN(maxComp!) || maxComp! <= 0)) {
      toast.error("최대 완료 수는 1 이상의 숫자를 입력해주세요.");
      return;
    }

    onAdd(
      title.trim(),
      description.trim(),
      difficulty,
      pts,
      deadline || undefined,
      maxComp,
      createdBy || undefined
    );

    toast.success("미션이 추가되었습니다.");
    setTitle("");
    setDescription("");
    setDifficulty("medium");
    setPoints("10");
    setDeadline("");
    setMaxCompletions("");
    setCreatedBy(memberNames[0] ?? "");
    setOpen(false);
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
          미션 추가
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Flag className="h-4 w-4 text-indigo-500" />
            새 미션 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 제목 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              미션 제목 *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 50))}
              placeholder="예: 연속 5일 연습 참여"
              className="h-8 text-xs"
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              미션 설명 *
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder="미션 내용을 자세히 설명해주세요"
              className="h-8 text-xs"
            />
          </div>

          {/* 난이도 + 포인트 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                난이도
              </label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as MissionDifficulty)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["easy", "medium", "hard", "extreme"] as MissionDifficulty[]).map(
                    (d) => (
                      <SelectItem key={d} value={d} className="text-xs">
                        {DIFFICULTY_LABELS[d]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                포인트
              </label>
              <Input
                type="number"
                min={1}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="10"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 마감일 + 최대 완료 수 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                <Calendar className="mr-0.5 inline h-3 w-3" />
                마감일 (선택)
              </label>
              <input
                type="date"
                value={deadline}
                min={todayStr()}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
            <div className="w-24">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                <Users className="mr-0.5 inline h-3 w-3" />
                최대 완료 수
              </label>
              <Input
                type="number"
                min={1}
                value={maxCompletions}
                onChange={(e) => setMaxCompletions(e.target.value)}
                placeholder="제한 없음"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 작성자 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              작성자
            </label>
            {memberNames.length > 0 ? (
              <Select value={createdBy} onValueChange={setCreatedBy}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="작성자 선택" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value.slice(0, 30))}
                placeholder="작성자 이름"
                className="h-8 text-xs"
              />
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="h-7 flex-1 bg-indigo-500 text-xs hover:bg-indigo-600"
              onClick={handleSubmit}
            >
              <Plus className="mr-1 h-3 w-3" />
              미션 추가
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

// ─── 리더보드 ─────────────────────────────────────────────────

function LeaderboardSection({
  leaderboard,
}: {
  leaderboard: ReturnType<ReturnType<typeof useMissionBoard>["getLeaderboard"]>;
}) {
  const top5 = leaderboard.slice(0, 5);

  if (top5.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-5 text-gray-400">
        <Star className="h-7 w-7 opacity-25" />
        <p className="text-xs">아직 완료된 미션이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {top5.map((entry, idx) => {
        const meta = idx < 3 ? RANK_META[idx] : null;
        const IconComp = meta?.Icon;
        return (
          <div
            key={entry.memberName}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
              meta ? meta.bg : "border-gray-100 bg-white"
            }`}
          >
            {/* 순위 아이콘 */}
            <div className="flex w-6 shrink-0 items-center justify-center">
              {IconComp ? (
                <IconComp className={`h-4 w-4 ${meta!.color}`} />
              ) : (
                <span className="text-xs font-bold text-gray-400">
                  {idx + 1}
                </span>
              )}
            </div>

            {/* 이름 + 메달 뱃지 */}
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="truncate text-xs font-semibold text-gray-800">
                {entry.memberName}
              </span>
              {meta && (
                <Badge className={`shrink-0 text-[10px] px-1 py-0 ${meta.badgeCls}`}>
                  {meta.label}
                </Badge>
              )}
            </div>

            {/* 완료 수 */}
            <span className="shrink-0 text-[10px] text-gray-400">
              {entry.completedCount}개 완료
            </span>

            {/* 포인트 */}
            <div className="flex shrink-0 items-center gap-0.5">
              <Zap className="h-3 w-3 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-600">
                {entry.totalPoints}pt
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 미션 목록 ────────────────────────────────────────────────

interface MissionListProps {
  missions: ReturnType<typeof useMissionBoard>["missions"];
  currentMemberName?: string;
  onComplete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
}

function MissionList({
  missions,
  currentMemberName,
  onComplete,
  onToggleActive,
  onDelete,
}: MissionListProps) {
  if (missions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-5 text-gray-400">
        <Flag className="h-7 w-7 opacity-25" />
        <p className="text-xs">등록된 미션이 없습니다.</p>
      </div>
    );
  }

  // 활성 미션 먼저, 그 다음 비활성
  const sorted = [...missions].sort((a, b) => {
    if (a.isActive === b.isActive) return 0;
    return a.isActive ? -1 : 1;
  });

  return (
    <div className="space-y-2">
      {sorted.map((mission) => {
        const alreadyCompleted =
          currentMemberName
            ? mission.completedBy.some((c) => c.memberName === currentMemberName)
            : false;
        const isFull =
          mission.maxCompletions !== undefined &&
          mission.completedBy.length >= mission.maxCompletions;
        const canComplete =
          currentMemberName &&
          mission.isActive &&
          !alreadyCompleted &&
          !isFull;

        const dday = mission.deadline ? calcDday(mission.deadline) : null;

        return (
          <div
            key={mission.id}
            className={`group rounded-lg border px-3 py-2.5 transition-opacity ${
              mission.isActive
                ? "border-gray-200 bg-white"
                : "border-gray-100 bg-gray-50 opacity-50"
            }`}
          >
            {/* 상단 행: 제목 + 난이도 + 포인트 + 버튼들 */}
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`text-xs font-semibold ${
                      mission.isActive ? "text-gray-800" : "text-gray-500"
                    }`}
                  >
                    {mission.title}
                  </span>
                  <Badge
                    className={`text-[10px] px-1.5 py-0 ${DIFFICULTY_BADGE_CLASS[mission.difficulty]}`}
                  >
                    {DIFFICULTY_LABELS[mission.difficulty]}
                  </Badge>
                  <div className="flex items-center gap-0.5">
                    <Zap className="h-3 w-3 text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-600">
                      {mission.points}pt
                    </span>
                  </div>
                </div>
                <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-2">
                  {mission.description}
                </p>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex shrink-0 items-center gap-1">
                {/* 완료 버튼 */}
                {currentMemberName && mission.isActive && (
                  <Button
                    size="sm"
                    variant={alreadyCompleted ? "ghost" : "outline"}
                    disabled={alreadyCompleted || isFull}
                    className={`h-6 text-[10px] px-2 ${
                      alreadyCompleted
                        ? "text-green-500 border-green-200 bg-green-50 hover:bg-green-50"
                        : isFull
                        ? "text-gray-400 border-gray-200"
                        : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    }`}
                    onClick={() => canComplete && onComplete(mission.id)}
                    title={
                      alreadyCompleted
                        ? "이미 완료"
                        : isFull
                        ? "정원 초과"
                        : "완료 처리"
                    }
                  >
                    {alreadyCompleted ? (
                      <>
                        <CheckCircle2 className="mr-0.5 h-3 w-3" />
                        완료
                      </>
                    ) : isFull ? (
                      "마감"
                    ) : (
                      "완료!"
                    )}
                  </Button>
                )}

                {/* 활성/비활성 토글 */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-orange-500 transition-opacity"
                  onClick={() => onToggleActive(mission.id)}
                  title={mission.isActive ? "비활성화" : "활성화"}
                >
                  <PowerOff className="h-3 w-3" />
                </Button>

                {/* 삭제 버튼 */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"
                  onClick={() => onDelete(mission.id)}
                  title="삭제"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* 하단 행: 마감일 + 완료 현황 + 작성자 */}
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
              {dday && (
                <span
                  className={`flex items-center gap-0.5 font-medium ${
                    dday.urgent ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  <Calendar className="h-3 w-3" />
                  {formatYearMonthDay(mission.deadline!)} ({dday.label})
                </span>
              )}
              <span className="flex items-center gap-0.5">
                <Users className="h-3 w-3" />
                {mission.completedBy.length}
                {mission.maxCompletions !== undefined
                  ? `/${mission.maxCompletions}`
                  : ""}
                명 완료
              </span>
              <span>by {mission.createdBy}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface MissionBoardCardProps {
  groupId: string;
  memberNames: string[];
  currentMemberName?: string;
}

export function MissionBoardCard({
  groupId,
  memberNames,
  currentMemberName,
}: MissionBoardCardProps) {
  const [open, setOpen] = useState(true);

  const {
    missions,
    addMission,
    completeMission,
    toggleActive,
    deleteMission,
    getLeaderboard,
    stats,
  } = useMissionBoard(groupId);

  const leaderboard = getLeaderboard();

  const handleComplete = (id: string) => {
    if (!currentMemberName) {
      toast.error("완료 처리를 위해 멤버 이름이 필요합니다.");
      return;
    }
    const result = completeMission(id, currentMemberName);
    if (result.ok) {
      toast.success("미션을 완료했습니다!");
    } else {
      toast.error(result.reason ?? "미션 완료 처리에 실패했습니다.");
    }
  };

  const handleToggleActive = (id: string) => {
    const mission = missions.find((m) => m.id === id);
    const ok = toggleActive(id);
    if (ok) {
      toast.success(
        mission?.isActive ? "미션이 비활성화되었습니다." : "미션이 활성화되었습니다."
      );
    } else {
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  const handleDelete = (id: string) => {
    const ok = deleteMission(id);
    if (ok) {
      toast.success("미션이 삭제되었습니다.");
    } else {
      toast.error("미션 삭제에 실패했습니다.");
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800">
            그룹 미션 보드
          </span>
          {stats.activeMissions > 0 && (
            <Badge className="bg-indigo-100 text-[10px] px-1.5 py-0 text-indigo-600 hover:bg-indigo-100">
              활성 {stats.activeMissions}개
            </Badge>
          )}
          {stats.totalCompletions > 0 && (
            <Badge className="bg-green-100 text-[10px] px-1.5 py-0 text-green-600 hover:bg-green-100">
              총 {stats.totalCompletions}회 완료
            </Badge>
          )}
          {stats.topScorer && (
            <Badge className="hidden sm:inline-flex bg-yellow-100 text-[10px] px-1.5 py-0 text-yellow-700 hover:bg-yellow-100">
              <Crown className="mr-0.5 h-2.5 w-2.5" />
              {stats.topScorer}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <AddMissionDialog memberNames={memberNames} onAdd={addMission} />
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
          {stats.totalMissions === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-400">
              <Flag className="h-10 w-10 opacity-20" />
              <p className="text-xs">아직 등록된 미션이 없습니다.</p>
              <p className="text-[11px]">
                상단의 &ldquo;미션 추가&rdquo; 버튼으로 첫 미션을 만들어보세요.
              </p>
            </div>
          ) : (
            <>
              {/* ── 포인트 리더보드 ── */}
              {leaderboard.length > 0 && (
                <>
                  <div>
                    <div className="mb-2 flex items-center gap-1.5">
                      <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                      <span className="text-xs font-semibold text-gray-700">
                        포인트 리더보드
                      </span>
                      <Badge className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-500 hover:bg-gray-100">
                        TOP {Math.min(leaderboard.length, 5)}
                      </Badge>
                    </div>
                    <LeaderboardSection leaderboard={leaderboard} />
                  </div>
                  <Separator />
                </>
              )}

              {/* ── 미션 목록 ── */}
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-xs font-semibold text-gray-700">
                    미션 목록
                  </span>
                  <Badge className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-500 hover:bg-gray-100">
                    {stats.totalMissions}개
                  </Badge>
                </div>
                <MissionList
                  missions={missions}
                  currentMemberName={currentMemberName}
                  onComplete={handleComplete}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                />
              </div>
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
