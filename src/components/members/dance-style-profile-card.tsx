"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Star,
  Music,
  User,
  Clock,
  BarChart2,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { useDanceStyleProfileV2 } from "@/hooks/use-dance-style-profile-v2";
import type {
  DanceProfileGenreEntry,
  DanceProfileInspirationEntry,
  DanceProfilePosition,
  DanceProfilePracticeTime,
  DanceProfileSkillStar,
} from "@/types";
import { cn } from "@/lib/utils";

// ============================================================
// 상수
// ============================================================

const PRESET_GENRES = [
  "힙합",
  "팝핑",
  "왁킹",
  "보깅",
  "브레이킹",
  "크럼프",
  "하우스",
  "컨템포러리",
  "재즈",
  "락킹",
  "소울",
  "비보잉",
];

const POSITION_META: Record<DanceProfilePosition, { label: string; color: string }> = {
  center: { label: "센터", color: "bg-amber-100 text-amber-700 border-amber-200" },
  side: { label: "사이드", color: "bg-sky-100 text-sky-700 border-sky-200" },
  back: { label: "백", color: "bg-green-100 text-green-700 border-green-200" },
};

const PRACTICE_TIME_META: Record<
  DanceProfilePracticeTime,
  { label: string; icon: string; color: string }
> = {
  morning: { label: "아침", icon: "🌅", color: "bg-orange-100 text-orange-700 border-orange-200" },
  afternoon: { label: "오후", icon: "☀️", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  evening: { label: "저녁", icon: "🌆", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  midnight: { label: "심야", icon: "🌙", color: "bg-slate-100 text-slate-700 border-slate-200" },
};

const PRACTICE_TIME_ORDER: DanceProfilePracticeTime[] = [
  "morning",
  "afternoon",
  "evening",
  "midnight",
];

const STAR_COLORS: Record<DanceProfileSkillStar, string> = {
  1: "text-slate-400",
  2: "text-blue-400",
  3: "text-green-400",
  4: "text-amber-400",
  5: "text-rose-500",
};

const STAR_LABELS: Record<DanceProfileSkillStar, string> = {
  1: "입문",
  2: "초급",
  3: "중급",
  4: "고급",
  5: "전문가",
};

// ============================================================
// 별점 선택 컴포넌트
// ============================================================

function StarSelector({
  value,
  onChange,
}: {
  value: DanceProfileSkillStar;
  onChange: (v: DanceProfileSkillStar) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {([1, 2, 3, 4, 5] as DanceProfileSkillStar[]).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="hover:scale-110 transition-transform"
          aria-label={`${n}점`}
        >
          <Star
            className={cn(
              "h-4 w-4 transition-colors",
              n <= value
                ? `fill-current ${STAR_COLORS[value]}`
                : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
      <span className="ml-1.5 text-[10px] text-muted-foreground">
        {STAR_LABELS[value]}
      </span>
    </div>
  );
}

// ============================================================
// 장르 추가/편집 다이얼로그
// ============================================================

interface GenreDialogProps {
  initial?: DanceProfileGenreEntry;
  existingGenres: string[];
  onSave: (entry: DanceProfileGenreEntry) => Promise<void>;
  trigger: React.ReactNode;
}

function GenreDialog({ initial, existingGenres, onSave, trigger }: GenreDialogProps) {
  const [open, setOpen] = useState(false);
  const [genre, setGenre] = useState(initial?.genre ?? "");
  const [stars, setStars] = useState<DanceProfileSkillStar>(initial?.stars ?? 3);
  const { pending: saving, execute: executeSave } = useAsyncAction();

  function handleOpen(value: boolean) {
    if (value) {
      setGenre(initial?.genre ?? "");
      setStars(initial?.stars ?? 3);
    }
    setOpen(value);
  }

  async function handleSave() {
    const trimmed = genre.trim();
    if (!trimmed) {
      toast.error("장르 이름을 입력해주세요.");
      return;
    }
    if (!initial && existingGenres.includes(trimmed)) {
      toast.error("이미 추가된 장르입니다.");
      return;
    }
    await executeSave(async () => {
      await onSave({ genre: trimmed, stars });
      toast.success(initial ? "장르가 수정되었습니다." : "장르가 추가되었습니다.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {initial ? "장르 수정" : "선호 장르 추가"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {/* 장르 이름 */}
          <div className="space-y-1.5">
            <Label className="text-xs">장르 이름</Label>
            {initial ? (
              <p className="text-xs font-medium px-3 py-2 bg-muted/30 rounded-md">
                {initial.genre}
              </p>
            ) : (
              <>
                <Input
                  placeholder="직접 입력하거나 아래에서 선택"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {PRESET_GENRES.filter((g) => !existingGenres.includes(g)).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenre(g)}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                        genre === g
                          ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                          : "bg-muted/30 text-muted-foreground border-border hover:border-indigo-300 hover:text-indigo-600"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 숙련도 */}
          <div className="space-y-2">
            <Label className="text-xs">숙련도</Label>
            <StarSelector value={stars} onChange={setStars} />
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
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSave}
              disabled={saving}
            >
              <Check className="h-3 w-3 mr-1" />
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 영감 댄서 다이얼로그
// ============================================================

interface InspirationDialogProps {
  initial?: DanceProfileInspirationEntry;
  existingNames: string[];
  onSave: (entry: DanceProfileInspirationEntry) => Promise<void>;
  trigger: React.ReactNode;
}

function InspirationDialog({
  initial,
  existingNames,
  onSave,
  trigger,
}: InspirationDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const { pending: saving, execute: executeInsp } = useAsyncAction();

  function handleOpen(value: boolean) {
    if (value) {
      setName(initial?.name ?? "");
      setMemo(initial?.memo ?? "");
    }
    setOpen(value);
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("댄서 이름을 입력해주세요.");
      return;
    }
    if (!initial && existingNames.includes(trimmedName)) {
      toast.error("이미 추가된 댄서입니다.");
      return;
    }
    await executeInsp(async () => {
      await onSave({ name: trimmedName, memo: memo.trim() || undefined });
      toast.success(initial ? "댄서 정보가 수정되었습니다." : "댄서가 추가되었습니다.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {initial ? "댄서 정보 수정" : "영감 받은 댄서 추가"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs">댄서 이름</Label>
            <Input
              placeholder="예: Michael Jackson, Salah..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!!initial}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">메모 (선택)</Label>
            <Textarea
              placeholder="어떤 점에서 영감을 받았나요?"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="text-xs min-h-[60px] resize-none"
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
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSave}
              disabled={saving}
            >
              <Check className="h-3 w-3 mr-1" />
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 바 차트 (장르별 숙련도)
// ============================================================

function GenreBarChart({ genres }: { genres: DanceProfileGenreEntry[] }) {
  if (genres.length === 0) return null;

  const BAR_COLORS = [
    "bg-indigo-500",
    "bg-violet-500",
    "bg-pink-500",
    "bg-amber-500",
    "bg-teal-500",
    "bg-sky-500",
    "bg-rose-500",
    "bg-emerald-500",
  ];

  return (
    <div className="space-y-1.5">
      {genres.map((entry, idx) => {
        const pct = (entry.stars / 5) * 100;
        const barColor = BAR_COLORS[idx % BAR_COLORS.length];
        return (
          <div key={entry.genre} className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground w-16 shrink-0 truncate">
              {entry.genre}
            </span>
            <div className="flex-1 h-2.5 rounded-full bg-muted/50 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {([1, 2, 3, 4, 5] as DanceProfileSkillStar[]).map((n) => (
                <Star
                  key={n}
                  className={cn(
                    "h-2.5 w-2.5",
                    n <= entry.stars
                      ? `fill-current ${STAR_COLORS[entry.stars]}`
                      : "text-muted-foreground/20"
                  )}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function DanceStyleProfileCard({ memberId }: { memberId: string }) {
  const [open, setOpen] = useState(true);
  const [bpmEditing, setBpmEditing] = useState(false);
  const [bpmDraft, setBpmDraft] = useState<[number, number]>([80, 140]);

  const {
    profile,
    addGenre,
    updateGenre,
    removeGenre,
    setPosition,
    setBio,
    addInspiration,
    updateInspiration,
    removeInspiration,
    togglePracticeTime,
    setBpmRange,
    stats,
  } = useDanceStyleProfileV2(memberId);

  // ── 자기소개 인라인 편집 상태 ─────────────────────────────
  const [bioEditing, setBioEditing] = useState(false);
  const [bioDraft, setBioDraft] = useState("");

  function startBioEdit() {
    setBioDraft(profile.bio);
    setBioEditing(true);
  }

  async function saveBio() {
    try {
      await setBio(bioDraft);
      toast.success("자기소개가 저장되었습니다.");
      setBioEditing(false);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    }
  }

  // ── BPM 편집 ─────────────────────────────────────────────
  function startBpmEdit() {
    setBpmDraft([profile.bpmRange.min, profile.bpmRange.max]);
    setBpmEditing(true);
  }

  async function saveBpm() {
    try {
      await setBpmRange({ min: bpmDraft[0], max: bpmDraft[1] });
      toast.success("BPM 범위가 저장되었습니다.");
      setBpmEditing(false);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    }
  }

  // ── 포지션 변경 ───────────────────────────────────────────
  async function handlePositionChange(pos: string) {
    try {
      await setPosition(pos === "none" ? null : (pos as DanceProfilePosition));
      toast.success("포지션이 저장되었습니다.");
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    }
  }

  // ── 장르 삭제 ─────────────────────────────────────────────
  async function handleRemoveGenre(genreName: string) {
    try {
      await removeGenre(genreName);
      toast.success(`"${genreName}" 장르를 삭제했습니다.`);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // ── 영감 댄서 삭제 ────────────────────────────────────────
  async function handleRemoveInspiration(name: string) {
    try {
      await removeInspiration(name);
      toast.success(`"${name}"을 삭제했습니다.`);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // ── 연습 시간 토글 ────────────────────────────────────────
  async function handlePracticeTimeToggle(time: DanceProfilePracticeTime) {
    try {
      await togglePracticeTime(time);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    }
  }

  const hasContent =
    profile.genres.length > 0 ||
    profile.position !== null ||
    profile.bio ||
    profile.inspirations.length > 0 ||
    profile.practiceTimes.length > 0;

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-indigo-100">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                </div>
                <CardTitle className="text-sm font-semibold">
                  댄스 스타일 프로필
                </CardTitle>
                {stats.totalGenres > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-600 border-indigo-200"
                  >
                    {stats.totalGenres}개 장르
                  </Badge>
                )}
              </div>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-5">
            {/* 빈 상태 */}
            {!hasContent && (
              <p className="text-[11px] text-muted-foreground text-center py-4 border border-dashed rounded-md">
                아직 등록된 정보가 없습니다. 장르, 포지션 등을 추가해보세요.
              </p>
            )}

            {/* ── 1. 선호 장르 + 숙련도 ──────────────────────────── */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <BarChart2 className="h-3 w-3" />
                  선호 장르 &amp; 숙련도
                </span>
                <GenreDialog
                  existingGenres={profile.genres.map((g) => g.genre)}
                  onSave={addGenre}
                  trigger={
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2">
                      <Plus className="h-3 w-3 mr-0.5" />
                      장르 추가
                    </Button>
                  }
                />
              </div>

              {profile.genres.length > 0 ? (
                <div className="space-y-3">
                  {/* 바 차트 */}
                  <div className="rounded-md border bg-muted/10 px-3 py-2.5">
                    <GenreBarChart genres={profile.genres} />
                  </div>

                  {/* 장르 행 목록 */}
                  <div className="space-y-1.5">
                    {profile.genres.map((entry) => (
                      <div
                        key={entry.genre}
                        className="flex items-center justify-between rounded-md border px-2.5 py-1.5 bg-muted/20 hover:bg-muted/40 transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium truncate">
                            {entry.genre}
                          </span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            {([1, 2, 3, 4, 5] as DanceProfileSkillStar[]).map((n) => (
                              <Star
                                key={n}
                                className={cn(
                                  "h-3 w-3 transition-colors",
                                  n <= entry.stars
                                    ? `fill-current ${STAR_COLORS[entry.stars]}`
                                    : "text-muted-foreground/20"
                                )}
                              />
                            ))}
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 shrink-0 bg-muted/30"
                          >
                            {STAR_LABELS[entry.stars]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GenreDialog
                            initial={entry}
                            existingGenres={[]}
                            onSave={async (updated) => {
                              await updateGenre(entry.genre, updated);
                              toast.success("장르가 수정되었습니다.");
                            }}
                            trigger={
                              <button
                                type="button"
                                className="p-1 hover:text-blue-600 transition-colors"
                                aria-label="장르 편집"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            }
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGenre(entry.genre)}
                            className="p-1 hover:text-red-600 transition-colors"
                            aria-label="장르 삭제"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground text-center py-2.5 border border-dashed rounded-md">
                  선호 장르를 추가해보세요.
                </p>
              )}
            </section>

            {/* ── 2. 선호 포지션 ───────────────────────────────────── */}
            <section className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                선호 포지션
              </span>
              <div className="flex items-center gap-2">
                <Select
                  value={profile.position ?? "none"}
                  onValueChange={handlePositionChange}
                >
                  <SelectTrigger className="h-8 text-xs w-36">
                    <SelectValue placeholder="포지션 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">
                      미설정
                    </SelectItem>
                    {(["center", "side", "back"] as DanceProfilePosition[]).map(
                      (pos) => (
                        <SelectItem key={pos} value={pos} className="text-xs">
                          {POSITION_META[pos].label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                {profile.position && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      POSITION_META[profile.position].color
                    )}
                  >
                    {POSITION_META[profile.position].label}
                  </Badge>
                )}
              </div>
            </section>

            {/* ── 3. 자기소개 ─────────────────────────────────────── */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  한줄 자기소개
                </span>
                {!bioEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] px-1.5"
                    onClick={startBioEdit}
                  >
                    <Pencil className="h-2.5 w-2.5 mr-0.5" />
                    편집
                  </Button>
                )}
              </div>
              {bioEditing ? (
                <div className="space-y-1.5">
                  <Textarea
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value)}
                    placeholder="춤에 대한 한줄 소개를 입력하세요."
                    className="text-xs min-h-[60px] resize-none"
                  />
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setBioEditing(false)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      취소
                    </Button>
                    <Button size="sm" className="h-7 text-xs" onClick={saveBio}>
                      <Check className="h-3 w-3 mr-1" />
                      저장
                    </Button>
                  </div>
                </div>
              ) : profile.bio ? (
                <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-md px-3 py-2">
                  {profile.bio}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={startBioEdit}
                  className="w-full text-[11px] text-muted-foreground text-center py-2 border border-dashed rounded-md hover:border-indigo-300 hover:text-indigo-500 transition-colors"
                >
                  + 자기소개 추가
                </button>
              )}
            </section>

            {/* ── 4. 영감 받은 댄서 ───────────────────────────────── */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  영감 받은 댄서
                </span>
                <InspirationDialog
                  existingNames={profile.inspirations.map((i) => i.name)}
                  onSave={addInspiration}
                  trigger={
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2">
                      <Plus className="h-3 w-3 mr-0.5" />
                      댄서 추가
                    </Button>
                  }
                />
              </div>

              {profile.inspirations.length > 0 ? (
                <div className="space-y-1.5">
                  {profile.inspirations.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-start justify-between rounded-md border px-2.5 py-1.5 bg-muted/20 group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{item.name}</p>
                        {item.memo && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {item.memo}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <InspirationDialog
                          initial={item}
                          existingNames={[]}
                          onSave={async (updated) => {
                            await updateInspiration(item.name, updated);
                            toast.success("댄서 정보가 수정되었습니다.");
                          }}
                          trigger={
                            <button
                              type="button"
                              className="p-1 hover:text-blue-600 transition-colors"
                              aria-label="댄서 편집"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          }
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveInspiration(item.name)}
                          className="p-1 hover:text-red-600 transition-colors"
                          aria-label="댄서 삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground text-center py-2.5 border border-dashed rounded-md">
                  영감 받은 댄서를 추가해보세요.
                </p>
              )}
            </section>

            {/* ── 5. 연습 시간 선호도 ──────────────────────────────── */}
            <section className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                연습 시간 선호도
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRACTICE_TIME_ORDER.map((time) => {
                  const meta = PRACTICE_TIME_META[time];
                  const selected = profile.practiceTimes.includes(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handlePracticeTimeToggle(time)}
                      className={cn(
                        "flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-colors",
                        selected
                          ? meta.color
                          : "bg-muted/20 text-muted-foreground border-border hover:border-muted-foreground/40"
                      )}
                    >
                      <span>{meta.icon}</span>
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── 6. BPM 범위 ──────────────────────────────────────── */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Music className="h-3 w-3" />
                  선호 음악 BPM 범위
                </span>
                {!bpmEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] px-1.5"
                    onClick={startBpmEdit}
                  >
                    <Pencil className="h-2.5 w-2.5 mr-0.5" />
                    편집
                  </Button>
                )}
              </div>
              {bpmEditing ? (
                <div className="space-y-3 px-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{bpmDraft[0]} BPM</span>
                    <span className="text-[10px]">~</span>
                    <span>{bpmDraft[1]} BPM</span>
                  </div>
                  <Slider
                    min={40}
                    max={220}
                    step={5}
                    value={bpmDraft}
                    onValueChange={(v) => {
                      if (v.length === 2) setBpmDraft([v[0], v[1]]);
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setBpmEditing(false)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      취소
                    </Button>
                    <Button size="sm" className="h-7 text-xs" onClick={saveBpm}>
                      <Check className="h-3 w-3 mr-1" />
                      저장
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 bg-violet-50 text-violet-700 border-violet-200"
                  >
                    {profile.bpmRange.min} BPM
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">~</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 bg-violet-50 text-violet-700 border-violet-200"
                  >
                    {profile.bpmRange.max} BPM
                  </Badge>
                  {profile.bpmRange.max - profile.bpmRange.min > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      ({profile.bpmRange.max - profile.bpmRange.min} 폭)
                    </span>
                  )}
                </div>
              )}
            </section>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
