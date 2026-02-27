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
  Medal,
  Filter,
  Calendar,
  User,
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
import { useBattleScoreboard } from "@/hooks/use-battle-scoreboard";
import type { BattleMatch, BattleStats, BattleType } from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

const PRESET_STYLES = [
  "프리스타일",
  "힙합",
  "팝핀",
  "락킹",
  "하우스",
  "왁킹",
  "비보잉",
  "크럼프",
  "기타",
] as const;

const TYPE_LABELS: Record<BattleType, string> = {
  solo: "솔로",
  team: "팀",
};

const TYPE_BADGE_CLASS: Record<BattleType, string> = {
  solo: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  team: "bg-blue-100 text-blue-700 hover:bg-blue-100",
};

// 순위 메타 (TOP 3)
const RANK_META = [
  {
    Icon: Crown,
    color: "text-yellow-500",
    bg: "bg-yellow-50 border-yellow-200",
    badgeCls: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    label: "금",
  },
  {
    Icon: Medal,
    color: "text-slate-400",
    bg: "bg-slate-50 border-slate-200",
    badgeCls: "bg-slate-100 text-slate-600 hover:bg-slate-100",
    label: "은",
  },
  {
    Icon: Trophy,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    badgeCls: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    label: "동",
  },
] as const;

// 승률에 따른 CSS 바 색상
function winRateBarClass(rate: number): string {
  if (rate >= 70) return "bg-emerald-500";
  if (rate >= 40) return "bg-blue-400";
  return "bg-gray-300";
}

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── 매치 추가 다이얼로그 ─────────────────────────────────────

interface AddMatchDialogProps {
  onAdd: ReturnType<typeof useBattleScoreboard>["addMatch"];
}

function AddMatchDialog({ onAdd }: AddMatchDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [type, setType] = useState<BattleType>("solo");
  const [participant1, setParticipant1] = useState("");
  const [participant2, setParticipant2] = useState("");
  // "draw" | participant1 name | participant2 name
  const [winnerKey, setWinnerKey] = useState<"draw" | "p1" | "p2">("draw");
  const [style, setStyle] = useState<string>(PRESET_STYLES[0]);
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!participant1.trim()) {
      toast.error("참가자 1 이름을 입력해주세요.");
      return;
    }
    if (!participant2.trim()) {
      toast.error("참가자 2 이름을 입력해주세요.");
      return;
    }
    if (participant1.trim() === participant2.trim()) {
      toast.error("참가자 이름이 동일합니다.");
      return;
    }
    if (!date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }

    const p1 = participant1.trim();
    const p2 = participant2.trim();
    const winner =
      winnerKey === "draw" ? null : winnerKey === "p1" ? p1 : p2;

    const ok = onAdd({
      date,
      type,
      participant1: p1,
      participant2: p2,
      winner,
      style,
      note: note.trim(),
    });

    if (ok) {
      toast.success("매치가 기록되었습니다.");
      // 폼 초기화
      setDate(todayStr());
      setType("solo");
      setParticipant1("");
      setParticipant2("");
      setWinnerKey("draw");
      setStyle(PRESET_STYLES[0]);
      setNote("");
      setDialogOpen(false);
    } else {
      toast.error("매치 기록에 실패했습니다.");
    }
  };

  const winnerOptions: { key: "draw" | "p1" | "p2"; label: string }[] = [
    { key: "draw", label: "무승부" },
    {
      key: "p1",
      label: participant1.trim() ? `${participant1.trim()} 승` : "참가자 1 승",
    },
    {
      key: "p2",
      label: participant2.trim() ? `${participant2.trim()} 승` : "참가자 2 승",
    },
  ];

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
        >
          <Plus className="mr-1 h-3 w-3" />
          배틀 기록
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Swords className="h-4 w-4 text-red-500" />
            배틀 매치 기록
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 날짜 + 타입 */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                <Calendar className="mr-0.5 inline h-3 w-3" />
                날짜
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                배틀 유형
              </label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as BattleType)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo" className="text-xs">
                    솔로
                  </SelectItem>
                  <SelectItem value="team" className="text-xs">
                    팀
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 참가자 */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                <User className="mr-0.5 inline h-3 w-3" />
                참가자 1
              </label>
              <Input
                value={participant1}
                onChange={(e) => setParticipant1(e.target.value.slice(0, 20))}
                placeholder="이름 또는 팀명"
                className="h-8 text-xs"
              />
            </div>
            <span className="mb-1.5 shrink-0 text-xs font-bold text-gray-400">
              VS
            </span>
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                <User className="mr-0.5 inline h-3 w-3" />
                참가자 2
              </label>
              <Input
                value={participant2}
                onChange={(e) => setParticipant2(e.target.value.slice(0, 20))}
                placeholder="이름 또는 팀명"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 승자 선택 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              결과 (승자)
            </label>
            <Select
              value={winnerKey}
              onValueChange={(v) => setWinnerKey(v as "draw" | "p1" | "p2")}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {winnerOptions.map(({ key, label }) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 스타일 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              댄스 스타일
            </label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESET_STYLES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 메모 */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              메모 (선택)
            </label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 100))}
              placeholder="간단한 메모..."
              className="h-8 text-xs"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="h-7 flex-1 bg-red-500 text-xs hover:bg-red-600"
              onClick={handleSubmit}
            >
              <Plus className="mr-1 h-3 w-3" />
              기록 추가
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setDialogOpen(false)}
            >
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 스타일 필터 탭 ───────────────────────────────────────────

function StyleFilterTabs({
  styles,
  selected,
  onSelect,
}: {
  styles: string[];
  selected: string;
  onSelect: (s: string) => void;
}) {
  const tabs = ["전체", ...styles];
  return (
    <div className="flex flex-wrap gap-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onSelect(tab)}
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors ${
            selected === tab
              ? "border-orange-400 bg-orange-500 text-white"
              : "border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ─── 랭킹 테이블 ─────────────────────────────────────────────

function RankingTable({ ranking }: { ranking: BattleStats[] }) {
  if (ranking.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-6 text-gray-400">
        <Trophy className="h-8 w-8 opacity-30" />
        <p className="text-xs">아직 배틀 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* 헤더 행 */}
      <div className="flex items-center gap-2 px-3 pb-1 text-[10px] font-medium text-gray-400">
        <span className="w-6 shrink-0 text-center">#</span>
        <span className="min-w-0 flex-1">이름</span>
        <span className="w-24 shrink-0 text-center">전적</span>
        <span className="w-28 shrink-0 text-right">승률</span>
      </div>

      {ranking.map((stat, idx) => {
        const meta = idx < 3 ? RANK_META[idx] : null;
        const IconComp = meta?.Icon;

        return (
          <div
            key={stat.name}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
              meta ? meta.bg : "border-gray-100 bg-white"
            }`}
          >
            {/* 순위 */}
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
            <div className="min-w-0 flex-1 flex items-center gap-1.5">
              <span className="truncate text-xs font-semibold text-gray-800">
                {stat.name}
              </span>
              {meta && (
                <Badge
                  className={`shrink-0 text-[10px] px-1 py-0 ${meta.badgeCls}`}
                >
                  {meta.label}
                </Badge>
              )}
            </div>

            {/* 전적 */}
            <div className="flex w-24 shrink-0 items-center justify-center gap-1 text-[10px]">
              <span className="text-emerald-600 font-semibold">
                {stat.wins}승
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-red-500 font-semibold">
                {stat.losses}패
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-400">{stat.draws}무</span>
            </div>

            {/* 승률 CSS 바 + 수치 */}
            <div className="flex w-28 shrink-0 items-center gap-1.5">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all ${winRateBarClass(
                    stat.winRate
                  )}`}
                  style={{ width: `${stat.winRate}%` }}
                />
              </div>
              <span
                className={`w-9 shrink-0 text-right text-xs font-bold ${
                  stat.winRate >= 60
                    ? "text-emerald-600"
                    : stat.winRate >= 40
                    ? "text-gray-700"
                    : "text-red-500"
                }`}
              >
                {stat.winRate}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 최근 매치 이력 목록 ──────────────────────────────────────

function MatchHistoryList({
  matches,
  onDelete,
}: {
  matches: BattleMatch[];
  onDelete: (id: string) => void;
}) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-6 text-gray-400">
        <Swords className="h-8 w-8 opacity-30" />
        <p className="text-xs">표시할 매치 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {matches.map((match) => {
        const isDraw = match.winner === null;
        const p1Win = !isDraw && match.winner === match.participant1;
        const p2Win = !isDraw && match.winner === match.participant2;

        return (
          <div
            key={match.id}
            className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 group"
          >
            {/* 날짜 */}
            <span className="w-[72px] shrink-0 text-[10px] text-gray-400">
              {formatDate(match.date)}
            </span>

            {/* 타입 배지 */}
            <Badge
              className={`shrink-0 text-[10px] px-1.5 py-0 ${TYPE_BADGE_CLASS[match.type]}`}
            >
              {TYPE_LABELS[match.type]}
            </Badge>

            {/* 스타일 배지 */}
            {match.style && (
              <Badge className="hidden sm:inline-flex shrink-0 bg-orange-100 text-[10px] px-1.5 py-0 text-orange-700 hover:bg-orange-100">
                {match.style}
              </Badge>
            )}

            {/* 대진 */}
            <div className="min-w-0 flex-1 flex items-center gap-1 text-[11px]">
              <span
                className={`font-semibold truncate ${p1Win ? "text-emerald-600" : "text-gray-700"}`}
              >
                {match.participant1}
              </span>
              <span className="shrink-0 text-gray-400">vs</span>
              <span
                className={`font-semibold truncate ${p2Win ? "text-emerald-600" : "text-gray-700"}`}
              >
                {match.participant2}
              </span>
            </div>

            {/* 결과 배지 */}
            {isDraw ? (
              <Badge className="shrink-0 bg-gray-100 text-[10px] px-1.5 py-0 text-gray-500 hover:bg-gray-100">
                무승부
              </Badge>
            ) : (
              <Badge className="shrink-0 bg-emerald-100 text-[10px] px-1.5 py-0 text-emerald-700 hover:bg-emerald-100">
                {match.winner} 승
              </Badge>
            )}

            {/* 삭제 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 shrink-0 p-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"
              onClick={() => onDelete(match.id)}
              title="삭제"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface BattleScoreboardCardProps {
  groupId: string;
}

export function BattleScoreboardCard({ groupId }: BattleScoreboardCardProps) {
  const [open, setOpen] = useState(true);
  const [styleFilter, setStyleFilter] = useState("전체");

  const {
    ranking,
    totalBattles,
    styles,
    avgWinRate,
    addMatch,
    deleteMatch,
    getMatchesByStyle,
    getRecentMatches,
  } = useBattleScoreboard(groupId);

  // 스타일 필터가 적용된 최근 매치 (최대 10개)
  const recentMatches =
    styleFilter === "전체"
      ? getRecentMatches(10)
      : getMatchesByStyle(styleFilter).slice(0, 10);

  const handleDelete = (id: string) => {
    const ok = deleteMatch(id);
    if (ok) {
      toast.success("매치가 삭제되었습니다.");
    } else {
      toast.error("매치 삭제에 실패했습니다.");
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-red-500" />
          <span className="text-sm font-semibold text-gray-800">
            댄스 배틀 스코어보드
          </span>
          {/* 전체 배틀 수 배지 */}
          {totalBattles > 0 && (
            <Badge className="bg-red-100 text-[10px] px-1.5 py-0 text-red-600 hover:bg-red-100">
              {totalBattles}경기
            </Badge>
          )}
          {/* 평균 승률 배지 */}
          {ranking.length > 0 && (
            <Badge className="bg-emerald-100 text-[10px] px-1.5 py-0 text-emerald-600 hover:bg-emerald-100">
              평균 승률 {avgWinRate}%
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <AddMatchDialog onAdd={addMatch} />
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
          {totalBattles === 0 ? (
            /* 데이터 없음 */
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-400">
              <Swords className="h-10 w-10 opacity-20" />
              <p className="text-xs">아직 기록된 배틀 매치가 없습니다.</p>
              <p className="text-[11px]">
                상단의 &ldquo;배틀 기록&rdquo; 버튼으로 첫 매치를 등록하세요.
              </p>
            </div>
          ) : (
            <>
              {/* ── 스타일 필터 탭 ── */}
              {styles.length > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1 text-[11px] text-gray-500">
                    <Filter className="h-3 w-3" />
                    스타일 필터
                  </div>
                  <StyleFilterTabs
                    styles={styles}
                    selected={styleFilter}
                    onSelect={setStyleFilter}
                  />
                </div>
              )}

              {/* ── 랭킹 테이블 ── */}
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-xs font-semibold text-gray-700">
                    참가자 랭킹
                  </span>
                  <Badge className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-500 hover:bg-gray-100">
                    {ranking.length}명
                  </Badge>
                </div>
                <RankingTable ranking={ranking} />
              </div>

              <Separator />

              {/* ── 최근 매치 이력 ── */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Swords className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-700">
                      최근 매치 이력
                    </span>
                    <Badge className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-500 hover:bg-gray-100">
                      최대 10경기
                    </Badge>
                  </div>
                  {styleFilter !== "전체" && (
                    <span className="text-[10px] text-orange-500">
                      {styleFilter} 필터 적용 중
                    </span>
                  )}
                </div>
                <MatchHistoryList
                  matches={recentMatches}
                  onDelete={handleDelete}
                />
                {totalBattles > 10 && styleFilter === "전체" && (
                  <p className="mt-2 text-center text-[10px] text-gray-400">
                    전체 {totalBattles}경기 중 최근 10경기를 표시합니다.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
