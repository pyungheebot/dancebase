"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Swords,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Trophy,
  Crown,
  Play,
  CheckCircle2,
  Users,
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
import { useBattleTournament } from "@/hooks/use-battle-tournament";
import type {
  BattleTournamentEntry,
  TournamentFormat,
  TournamentMatch,
  TournamentStatus,
} from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elimination: "단판 토너먼트",
  double_elimination: "더블 엘리미네이션",
  round_robin: "리그전",
};

const FORMAT_BADGE_CLASS: Record<TournamentFormat, string> = {
  single_elimination: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  double_elimination: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  round_robin: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
};

const STATUS_BADGE_CLASS: Record<TournamentStatus, string> = {
  upcoming: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  in_progress: "bg-green-100 text-green-700 hover:bg-green-100",
  completed: "bg-blue-100 text-blue-700 hover:bg-blue-100",
};

const STATUS_LABELS: Record<TournamentStatus, string> = {
  upcoming: "예정",
  in_progress: "진행 중",
  completed: "완료",
};

// ─── 헬퍼 ────────────────────────────────────────────────────

function getRoundsFromMatches(matches: TournamentMatch[]): number[] {
  const roundSet = new Set(matches.map((m) => m.round));
  return Array.from(roundSet).sort((a, b) => a - b);
}

// ─── 토너먼트 생성 다이얼로그 ─────────────────────────────────

interface CreateTournamentDialogProps {
  memberNames: string[];
  onCreate: (
    name: string,
    format: TournamentFormat,
    participants: string[],
    createdBy: string
  ) => void;
}

function CreateTournamentDialog({
  memberNames,
  onCreate,
}: CreateTournamentDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("single_elimination");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );

  const toggleParticipant = (member: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(member)
        ? prev.filter((m) => m !== member)
        : [...prev, member]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("토너먼트 이름을 입력해주세요.");
      return;
    }
    if (selectedParticipants.length < 2) {
      toast.error("참가자를 2명 이상 선택해주세요.");
      return;
    }
    onCreate(name.trim(), format, selectedParticipants, "관리자");
    toast.success("토너먼트가 생성되었습니다.");
    setName("");
    setFormat("single_elimination");
    setSelectedParticipants([]);
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
          토너먼트 생성
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Swords className="h-4 w-4 text-indigo-500" />
            토너먼트 생성
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 이름 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              토너먼트 이름
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="예) 3월 배틀 토너먼트"
              className="h-8 text-xs"
            />
          </div>

          {/* 포맷 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              토너먼트 형식
            </label>
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as TournamentFormat)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_elimination" className="text-xs">
                  단판 토너먼트
                </SelectItem>
                <SelectItem value="double_elimination" className="text-xs">
                  더블 엘리미네이션
                </SelectItem>
                <SelectItem value="round_robin" className="text-xs">
                  리그전
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 참가자 체크박스 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              참가자 선택{" "}
              <span className="text-gray-400">
                ({selectedParticipants.length}명 선택됨)
              </span>
            </label>
            {memberNames.length === 0 ? (
              <p className="text-[11px] text-gray-400 py-2">
                그룹에 멤버가 없습니다.
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto rounded-md border border-gray-200 p-2 space-y-1">
                {memberNames.map((member) => {
                  const checked = selectedParticipants.includes(member);
                  return (
                    <label
                      key={member}
                      className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleParticipant(member)}
                        className="h-3.5 w-3.5 accent-indigo-500"
                      />
                      <span className="text-xs text-gray-700">{member}</span>
                    </label>
                  );
                })}
              </div>
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

// ─── 매치 카드 ────────────────────────────────────────────────

interface MatchCardProps {
  match: TournamentMatch;
  editable: boolean;
  onRecord: (
    matchId: string,
    winner: string,
    score1?: number,
    score2?: number
  ) => void;
}

function MatchCard({ match, editable, onRecord }: MatchCardProps) {
  const [score1, setScore1] = useState<string>(
    match.score1 !== undefined ? String(match.score1) : ""
  );
  const [score2, setScore2] = useState<string>(
    match.score2 !== undefined ? String(match.score2) : ""
  );

  const isDone = !!match.winner;
  const isBye = match.player2 === "부전승";

  const handleWinner = (winner: string) => {
    const s1 = score1 !== "" ? Number(score1) : undefined;
    const s2 = score2 !== "" ? Number(score2) : undefined;
    onRecord(match.id, winner, s1, s2);
  };

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        isDone
          ? "border-gray-100 bg-gray-50"
          : "border-indigo-100 bg-card shadow-sm"
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Player 1 */}
        <div className="flex min-w-0 flex-1 flex-col items-center">
          <span
            className={`truncate text-xs font-semibold ${
              match.winner === match.player1
                ? "text-green-600"
                : isDone
                ? "text-gray-400"
                : "text-gray-800"
            }`}
          >
            {match.player1}
          </span>
          {editable && !isDone && !isBye && (
            <Input
              type="number"
              min={0}
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
              placeholder="점수"
              className="mt-1 h-6 w-14 text-center text-[11px]"
            />
          )}
          {isDone && match.score1 !== undefined && (
            <span className="mt-0.5 text-[11px] font-bold text-gray-500">
              {match.score1}점
            </span>
          )}
        </div>

        {/* VS */}
        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <span className="text-[10px] font-bold text-gray-400">VS</span>
          {isDone && (
            <Badge className="bg-green-100 text-[10px] px-1.5 py-0 text-green-700 hover:bg-green-100">
              {match.winner === "부전승" ? "부전승" : `${match.winner} 승`}
            </Badge>
          )}
        </div>

        {/* Player 2 */}
        <div className="flex min-w-0 flex-1 flex-col items-center">
          <span
            className={`truncate text-xs font-semibold ${
              match.winner === match.player2
                ? "text-green-600"
                : isDone
                ? "text-gray-400"
                : isBye
                ? "text-gray-400 italic"
                : "text-gray-800"
            }`}
          >
            {match.player2}
          </span>
          {editable && !isDone && !isBye && (
            <Input
              type="number"
              min={0}
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
              placeholder="점수"
              className="mt-1 h-6 w-14 text-center text-[11px]"
            />
          )}
          {isDone && match.score2 !== undefined && (
            <span className="mt-0.5 text-[11px] font-bold text-gray-500">
              {match.score2}점
            </span>
          )}
        </div>
      </div>

      {/* 승자 선택 버튼 (편집 가능하고 미완료일 때) */}
      {editable && !isDone && !isBye && (
        <div className="mt-2 flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-6 flex-1 border-green-200 text-[10px] text-green-600 hover:bg-green-50"
            onClick={() => handleWinner(match.player1)}
          >
            {match.player1} 승
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 flex-1 border-green-200 text-[10px] text-green-600 hover:bg-green-50"
            onClick={() => handleWinner(match.player2)}
          >
            {match.player2} 승
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── 활성 토너먼트 대진표 ─────────────────────────────────────

interface ActiveTournamentViewProps {
  tournament: BattleTournamentEntry;
  onRecord: (
    tournamentId: string,
    matchId: string,
    winner: string,
    score1?: number,
    score2?: number
  ) => void;
  onComplete: (id: string) => void;
}

function ActiveTournamentView({
  tournament,
  onRecord,
  onComplete,
}: ActiveTournamentViewProps) {
  const rounds = getRoundsFromMatches(tournament.matches);
  const allDone = tournament.matches.every((m) => !!m.winner);

  return (
    <div className="space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/30 p-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-3.5 w-3.5 text-indigo-500" />
          <span className="text-xs font-semibold text-indigo-700">
            {tournament.name}
          </span>
          <Badge
            className={`text-[10px] px-1.5 py-0 ${FORMAT_BADGE_CLASS[tournament.format]}`}
          >
            {FORMAT_LABELS[tournament.format]}
          </Badge>
        </div>
        {allDone && (
          <Button
            size="sm"
            className="h-6 bg-blue-500 text-[10px] hover:bg-blue-600"
            onClick={() => onComplete(tournament.id)}
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            토너먼트 완료
          </Button>
        )}
      </div>

      {/* 참가자 */}
      <div className="flex flex-wrap gap-1">
        {tournament.participants.map((p) => (
          <Badge
            key={p}
            className="bg-background text-[10px] px-1.5 py-0 text-gray-600 border border-gray-200 hover:bg-background"
          >
            {p}
          </Badge>
        ))}
      </div>

      {/* 라운드별 매치 */}
      {rounds.map((round) => {
        const roundMatches = tournament.matches.filter(
          (m) => m.round === round
        );
        return (
          <div key={round}>
            <p className="mb-1.5 text-[11px] font-semibold text-gray-500">
              {round}라운드
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {roundMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  editable={tournament.status === "in_progress"}
                  onRecord={(matchId, winner, s1, s2) =>
                    onRecord(tournament.id, matchId, winner, s1, s2)
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 토너먼트 목록 아이템 ─────────────────────────────────────

interface TournamentListItemProps {
  tournament: BattleTournamentEntry;
  onStart: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (t: BattleTournamentEntry) => void;
  isSelected: boolean;
}

function TournamentListItem({
  tournament,
  onStart,
  onDelete,
  onSelect,
  isSelected,
}: TournamentListItemProps) {
  return (
    <div
      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors hover:bg-gray-50 ${
        isSelected ? "border-indigo-300 bg-indigo-50" : "border-gray-100 bg-card"
      }`}
      onClick={() => onSelect(tournament)}
    >
      {/* 이름 + 배지 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-gray-800 truncate">
            {tournament.name}
          </span>
          <Badge
            className={`text-[10px] px-1.5 py-0 ${STATUS_BADGE_CLASS[tournament.status]}`}
          >
            {STATUS_LABELS[tournament.status]}
          </Badge>
          <Badge
            className={`text-[10px] px-1.5 py-0 ${FORMAT_BADGE_CLASS[tournament.format]}`}
          >
            {FORMAT_LABELS[tournament.format]}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-400">
          <span className="flex items-center gap-0.5">
            <Users className="h-2.5 w-2.5" />
            {tournament.participants.length}명
          </span>
          {tournament.champion && (
            <span className="flex items-center gap-0.5 text-yellow-600">
              <Crown className="h-2.5 w-2.5" />
              {tournament.champion}
            </span>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div
        className="flex shrink-0 items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {tournament.status === "upcoming" && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 border-green-200 text-[10px] text-green-600 hover:bg-green-50"
            onClick={() => onStart(tournament.id)}
          >
            <Play className="mr-0.5 h-2.5 w-2.5" />
            시작
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-300 hover:text-red-500"
          onClick={() => onDelete(tournament.id)}
          title="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface BattleTournamentCardProps {
  groupId: string;
  memberNames: string[];
}

export function BattleTournamentCard({
  groupId,
  memberNames,
}: BattleTournamentCardProps) {
  const [open, setOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    tournaments,
    loading,
    createTournament,
    startTournament,
    recordResult,
    completeTournament,
    deleteTournament,
    stats,
  } = useBattleTournament(groupId);

  const selectedTournament =
    tournaments.find((t) => t.id === selectedId) ?? null;

  // 활성 토너먼트 자동 선택
  const activeTournament = stats.activeTournament;

  const handleCreate = (
    name: string,
    format: TournamentFormat,
    participants: string[],
    createdBy: string
  ) => {
    createTournament(name, format, participants, createdBy);
  };

  const handleStart = (id: string) => {
    const ok = startTournament(id);
    if (ok) {
      toast.success("토너먼트가 시작되었습니다.");
      setSelectedId(id);
    } else {
      toast.error("토너먼트 시작에 실패했습니다.");
    }
  };

  const handleRecord = (
    tournamentId: string,
    matchId: string,
    winner: string,
    score1?: number,
    score2?: number
  ) => {
    const ok = recordResult(tournamentId, matchId, winner, score1, score2);
    if (ok) {
      toast.success("결과가 기록되었습니다.");
    } else {
      toast.error("결과 기록에 실패했습니다.");
    }
  };

  const handleComplete = (id: string) => {
    const ok = completeTournament(id);
    if (ok) {
      toast.success("토너먼트가 완료되었습니다.");
    } else {
      toast.error("토너먼트 완료에 실패했습니다.");
    }
  };

  const handleDelete = (id: string) => {
    const ok = deleteTournament(id);
    if (ok) {
      toast.success("토너먼트가 삭제되었습니다.");
      if (selectedId === id) setSelectedId(null);
    } else {
      toast.error("토너먼트 삭제에 실패했습니다.");
    }
  };

  const handleSelect = (t: BattleTournamentEntry) => {
    setSelectedId((prev) => (prev === t.id ? null : t.id));
  };

  // 표시할 대진표: 선택된 토너먼트 또는 진행 중인 토너먼트
  const viewTournament = selectedTournament ?? activeTournament;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800">
            배틀 토너먼트
          </span>
          {stats.totalTournaments > 0 && (
            <Badge className="bg-indigo-100 text-[10px] px-1.5 py-0 text-indigo-600 hover:bg-indigo-100">
              {stats.totalTournaments}개
            </Badge>
          )}
          {activeTournament && (
            <Badge className="bg-green-100 text-[10px] px-1.5 py-0 text-green-600 hover:bg-green-100">
              진행 중
            </Badge>
          )}
          {stats.recentChampion && !activeTournament && (
            <Badge className="bg-yellow-100 text-[10px] px-1.5 py-0 text-yellow-600 hover:bg-yellow-100">
              <Crown className="mr-0.5 inline h-2.5 w-2.5" />
              {stats.recentChampion}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <CreateTournamentDialog
            memberNames={memberNames}
            onCreate={handleCreate}
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
          {loading ? (
            <div className="flex items-center justify-center py-8 text-xs text-gray-400">
              불러오는 중...
            </div>
          ) : tournaments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-400">
              <Swords className="h-10 w-10 opacity-20" />
              <p className="text-xs">아직 생성된 토너먼트가 없습니다.</p>
              <p className="text-[11px]">
                상단의 &ldquo;토너먼트 생성&rdquo; 버튼으로 첫 토너먼트를
                만들어보세요.
              </p>
            </div>
          ) : (
            <>
              {/* ── 토너먼트 목록 ── */}
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-xs font-semibold text-gray-700">
                    토너먼트 목록
                  </span>
                </div>
                <div className="space-y-1.5">
                  {tournaments.map((t) => (
                    <TournamentListItem
                      key={t.id}
                      tournament={t}
                      onStart={handleStart}
                      onDelete={handleDelete}
                      onSelect={handleSelect}
                      isSelected={selectedId === t.id}
                    />
                  ))}
                </div>
              </div>

              {/* ── 대진표 ── */}
              {viewTournament && (
                <>
                  <Separator />
                  <div>
                    <div className="mb-2 flex items-center gap-1.5">
                      <Swords className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="text-xs font-semibold text-gray-700">
                        대진표
                      </span>
                      {viewTournament.status === "completed" && (
                        <Badge className="bg-blue-100 text-[10px] px-1.5 py-0 text-blue-700 hover:bg-blue-100">
                          완료
                        </Badge>
                      )}
                    </div>
                    <ActiveTournamentView
                      tournament={viewTournament}
                      onRecord={handleRecord}
                      onComplete={handleComplete}
                    />
                  </div>
                </>
              )}

              {/* ── 최근 챔피언 ── */}
              {stats.recentChampion && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 rounded-lg border border-yellow-100 bg-yellow-50 px-3 py-2">
                    <Crown className="h-4 w-4 text-yellow-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-yellow-600">
                        최근 챔피언
                      </p>
                      <p className="text-sm font-bold text-yellow-700">
                        {stats.recentChampion}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
