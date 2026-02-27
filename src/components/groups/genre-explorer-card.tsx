"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Music,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Star,
  ListMusic,
  Lightbulb,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useGenreExplorer } from "@/hooks/use-genre-explorer";
import type { DanceGenreType, GenreExplorerEntry } from "@/types";

// ─── 장르 메타 ────────────────────────────────────────────────
const ALL_GENRES: DanceGenreType[] = [
  "hiphop", "kpop", "ballet", "jazz", "contemporary",
  "latin", "waacking", "locking", "popping", "breaking", "other",
];

const GENRE_META: Record<DanceGenreType, { label: string; color: string; bg: string }> = {
  hiphop:       { label: "힙합",        color: "text-purple-700", bg: "bg-purple-100" },
  kpop:         { label: "K-POP",       color: "text-pink-700",   bg: "bg-pink-100" },
  ballet:       { label: "발레",         color: "text-blue-700",   bg: "bg-blue-100" },
  jazz:         { label: "재즈",         color: "text-yellow-700", bg: "bg-yellow-100" },
  contemporary: { label: "컨템포러리",   color: "text-teal-700",   bg: "bg-teal-100" },
  latin:        { label: "라틴",         color: "text-orange-700", bg: "bg-orange-100" },
  waacking:     { label: "왁킹",         color: "text-fuchsia-700",bg: "bg-fuchsia-100" },
  locking:      { label: "락킹",         color: "text-amber-700",  bg: "bg-amber-100" },
  popping:      { label: "팝핑",         color: "text-red-700",    bg: "bg-red-100" },
  breaking:     { label: "브레이킹",     color: "text-indigo-700", bg: "bg-indigo-100" },
  other:        { label: "기타",         color: "text-gray-700",   bg: "bg-gray-100" },
};

// ─── 별표 난이도 표시 ─────────────────────────────────────────
function DifficultyStars({ level }: { level: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < level ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </span>
  );
}

// ─── 장르 정보 카드 (단일) ────────────────────────────────────
function EntryCard({
  entry,
  onDelete,
}: {
  entry: GenreExplorerEntry;
  onDelete: () => void;
}) {
  const meta = GENRE_META[entry.genre];
  return (
    <div className="rounded-lg border p-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-[10px] px-1.5 py-0 ${meta.bg} ${meta.color} border-0`}>
            {meta.label}
          </Badge>
          <span className="text-sm font-medium">{entry.title}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 shrink-0"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* 난이도 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">난이도</span>
        <DifficultyStars level={entry.difficulty} />
      </div>

      {/* 설명 */}
      <p className="text-xs text-muted-foreground leading-relaxed">{entry.description}</p>

      {/* 추천곡 */}
      {entry.recommendedSongs.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
            <ListMusic className="h-3 w-3" />
            추천곡
          </div>
          <ul className="space-y-0.5">
            {entry.recommendedSongs.map((song, i) => (
              <li key={i} className="text-xs text-foreground pl-2 before:content-['•'] before:mr-1.5 before:text-muted-foreground">
                {song}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 팁 */}
      {entry.tips.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
            <Lightbulb className="h-3 w-3" />
            팁
          </div>
          <ul className="space-y-0.5">
            {entry.tips.map((tip, i) => (
              <li key={i} className="text-xs text-foreground pl-2 before:content-['•'] before:mr-1.5 before:text-muted-foreground">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 작성자 */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <User className="h-3 w-3" />
        {entry.addedBy}
      </div>
    </div>
  );
}

// ─── 장르 정보 추가 다이얼로그 ───────────────────────────────
function AddEntryDialog({
  onAdd,
}: {
  onAdd: (
    genre: DanceGenreType,
    title: string,
    description: string,
    difficulty: 1 | 2 | 3 | 4 | 5,
    recommendedSongs: string[],
    tips: string[],
    addedBy: string
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const [genre, setGenre] = useState<DanceGenreType>("hiphop");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [songsRaw, setSongsRaw] = useState("");
  const [tipsRaw, setTipsRaw] = useState("");
  const [addedBy, setAddedBy] = useState("");

  function resetForm() {
    setGenre("hiphop");
    setTitle("");
    setDescription("");
    setDifficulty(3);
    setSongsRaw("");
    setTipsRaw("");
    setAddedBy("");
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!description.trim()) {
      toast.error("설명을 입력해주세요.");
      return;
    }
    const songs = songsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const tips = tipsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onAdd(genre, title, description, difficulty, songs, tips, addedBy);
    toast.success("장르 정보가 추가되었습니다.");
    resetForm();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          장르 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">장르 정보 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {/* 장르 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">장르</Label>
            <Select
              value={genre}
              onValueChange={(v) => setGenre(v as DanceGenreType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_GENRES.map((g) => (
                  <SelectItem key={g} value={g} className="text-xs">
                    {GENRE_META[g].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs">제목</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 힙합 기초 스텝"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label className="text-xs">설명</Label>
            <Textarea
              className="text-xs resize-none"
              rows={3}
              placeholder="장르에 대한 설명을 입력하세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* 난이도 */}
          <div className="space-y-1">
            <Label className="text-xs">난이도 (1~5)</Label>
            <Select
              value={String(difficulty)}
              onValueChange={(v) => setDifficulty(Number(v) as 1 | 2 | 3 | 4 | 5)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-xs">
                    {"★".repeat(n)}{"☆".repeat(5 - n)} ({n}단계)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 추천곡 */}
          <div className="space-y-1">
            <Label className="text-xs">추천곡 (쉼표로 구분)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: HUMBLE., Goosebumps, Money"
              value={songsRaw}
              onChange={(e) => setSongsRaw(e.target.value)}
            />
          </div>

          {/* 팁 */}
          <div className="space-y-1">
            <Label className="text-xs">팁 (쉼표로 구분)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 그루브를 살릴 것, 리듬 먼저"
              value={tipsRaw}
              onChange={(e) => setTipsRaw(e.target.value)}
            />
          </div>

          {/* 작성자 */}
          <div className="space-y-1">
            <Label className="text-xs">작성자</Label>
            <Input
              className="h-8 text-xs"
              placeholder="이름 (선택)"
              value={addedBy}
              onChange={(e) => setAddedBy(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 관심 장르 설정 다이얼로그 ───────────────────────────────
function InterestDialog({
  memberNames,
  interests,
  onSet,
  onRemove,
}: {
  memberNames: string[];
  interests: ReturnType<typeof useGenreExplorer>["interests"];
  onSet: (memberName: string, genre: DanceGenreType, experienceLevel: 1 | 2 | 3 | 4 | 5) => void;
  onRemove: (memberName: string, genre: DanceGenreType) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(memberNames[0] ?? "");
  const [selectedGenre, setSelectedGenre] = useState<DanceGenreType>("hiphop");
  const [expLevel, setExpLevel] = useState<1 | 2 | 3 | 4 | 5>(1);

  function handleSet() {
    if (!selectedMember) {
      toast.error("멤버를 선택해주세요.");
      return;
    }
    onSet(selectedMember, selectedGenre, expLevel);
    toast.success(`${selectedMember}의 관심 장르가 등록되었습니다.`);
  }

  function handleRemove() {
    if (!selectedMember) return;
    const exists = interests.find(
      (i) => i.memberName === selectedMember && i.genre === selectedGenre && i.interest
    );
    if (!exists) {
      toast.error("등록된 관심 장르가 없습니다.");
      return;
    }
    onRemove(selectedMember, selectedGenre);
    toast.success("관심 장르가 해제되었습니다.");
  }

  const currentInterest = interests.find(
    (i) => i.memberName === selectedMember && i.genre === selectedGenre && i.interest
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <User className="h-3 w-3" />
          관심 장르 설정
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">내 관심 장르 설정</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {/* 멤버 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">멤버</Label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="멤버 선택" />
              </SelectTrigger>
              <SelectContent>
                {memberNames.map((m) => (
                  <SelectItem key={m} value={m} className="text-xs">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 장르 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">장르</Label>
            <Select
              value={selectedGenre}
              onValueChange={(v) => setSelectedGenre(v as DanceGenreType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_GENRES.map((g) => (
                  <SelectItem key={g} value={g} className="text-xs">
                    {GENRE_META[g].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 경험 레벨 */}
          <div className="space-y-1">
            <Label className="text-xs">경험 레벨 (1~5)</Label>
            <Select
              value={String(currentInterest?.experienceLevel ?? expLevel)}
              onValueChange={(v) => setExpLevel(Number(v) as 1 | 2 | 3 | 4 | 5)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-xs">
                    {"★".repeat(n)}{"☆".repeat(5 - n)} (레벨 {n})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentInterest && (
            <p className="text-[10px] text-green-600">
              현재 경험 레벨: {currentInterest.experienceLevel}
            </p>
          )}

          <div className="flex justify-between gap-2 pt-1">
            {currentInterest && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-red-500 hover:text-red-600"
                onClick={handleRemove}
              >
                관심 해제
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setOpen(false)}
              >
                닫기
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={handleSet}>
                {currentInterest ? "경험 레벨 수정" : "관심 등록"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 장르별 관심도 분포 바 차트 ──────────────────────────────
function GenreDistributionChart({
  distribution,
}: {
  distribution: Record<DanceGenreType, number>;
}) {
  const max = Math.max(...Object.values(distribution), 1);
  const activeGenres = ALL_GENRES.filter((g) => distribution[g] > 0);

  if (activeGenres.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        아직 관심 장르 데이터가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {activeGenres.map((genre) => {
        const count = distribution[genre];
        const pct = Math.round((count / max) * 100);
        const meta = GENRE_META[genre];
        return (
          <div key={genre} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-16 shrink-0">
              {meta.label}
            </span>
            <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${meta.bg}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-5 text-right shrink-0">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── 메인 카드 컴포넌트 ───────────────────────────────────────
export function GenreExplorerCard({
  groupId,
  memberNames,
}: {
  groupId: string;
  memberNames: string[];
}) {
  const [open, setOpen] = useState(false);
  const [activeGenre, setActiveGenre] = useState<DanceGenreType | "all">("all");

  const {
    entries,
    interests,
    addEntry,
    deleteEntry,
    setInterest,
    removeInterest,
    totalEntries,
    genreDistribution,
    mostPopularGenre,
  } = useGenreExplorer(groupId);

  // 필터링된 항목
  const filteredEntries =
    activeGenre === "all"
      ? entries
      : entries.filter((e) => e.genre === activeGenre);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-purple-500" />
                <CardTitle className="text-sm font-semibold">장르 탐색기</CardTitle>
                <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-0">
                  {totalEntries}개
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {mostPopularGenre && (
                  <span className="text-[10px] text-muted-foreground hidden sm:block">
                    인기: {GENRE_META[mostPopularGenre].label}
                  </span>
                )}
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* 액션 버튼 */}
            <div className="flex flex-wrap gap-2">
              <AddEntryDialog onAdd={addEntry} />
              <InterestDialog
                memberNames={memberNames}
                interests={interests}
                onSet={setInterest}
                onRemove={removeInterest}
              />
            </div>

            {/* 장르 필터 칩 */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveGenre("all")}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  activeGenre === "all"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-muted text-muted-foreground border-muted-foreground/30 hover:border-foreground/50"
                }`}
              >
                전체 ({totalEntries})
              </button>
              {ALL_GENRES.map((g) => {
                const count = entries.filter((e) => e.genre === g).length;
                if (count === 0) return null;
                const meta = GENRE_META[g];
                return (
                  <button
                    key={g}
                    onClick={() => setActiveGenre(g)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      activeGenre === g
                        ? `${meta.bg} ${meta.color} border-transparent`
                        : "bg-muted text-muted-foreground border-muted-foreground/30 hover:border-foreground/50"
                    }`}
                  >
                    {meta.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* 장르 정보 목록 */}
            {filteredEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                {activeGenre === "all"
                  ? "아직 등록된 장르 정보가 없습니다."
                  : `${GENRE_META[activeGenre].label} 장르 정보가 없습니다.`}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={() => {
                      deleteEntry(entry.id);
                      toast.success("장르 정보가 삭제되었습니다.");
                    }}
                  />
                ))}
              </div>
            )}

            {/* 장르 관심도 분포 */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                장르 관심도 분포 (멤버 수)
              </p>
              <GenreDistributionChart distribution={genreDistribution} />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
