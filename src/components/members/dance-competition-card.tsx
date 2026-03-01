"use client";

import { useState, useMemo } from "react";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import { toast } from "sonner";
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  X,
  Calendar,
  MapPin,
  Music2,
  BarChart2,
  Filter,
  Users,
  StickyNote,
  Medal,
  Link,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useDanceCompetition,
  COMPETITION_TEAM_OR_SOLO_LABELS,
  COMPETITION_TEAM_OR_SOLO_COLORS,
  SUGGESTED_COMPETITION_GENRES,
  SUGGESTED_PLACEMENTS,
} from "@/hooks/use-dance-competition";
import type { DanceCompetitionRecord } from "@/types";

// ============================================================
// Props
// ============================================================

interface DanceCompetitionCardProps {
  memberId: string;
}

// ============================================================
// 폼 상태
// ============================================================

type FormState = {
  competitionName: string;
  date: string;
  location: string;
  category: string;
  placement: string;
  teamOrSolo: "solo" | "team" | "duo";
  teamName: string;
  genre: string;
  notes: string;
  certificateUrl: string;
};

const EMPTY_FORM: FormState = {
  competitionName: "",
  date: "",
  location: "",
  category: "",
  placement: "",
  teamOrSolo: "solo",
  teamName: "",
  genre: "",
  notes: "",
  certificateUrl: "",
};

function recordToForm(r: DanceCompetitionRecord): FormState {
  return {
    competitionName: r.competitionName,
    date: r.date,
    location: r.location ?? "",
    category: r.category ?? "",
    placement: r.placement ?? "",
    teamOrSolo: r.teamOrSolo,
    teamName: r.teamName ?? "",
    genre: r.genre ?? "",
    notes: r.notes,
    certificateUrl: r.certificateUrl ?? "",
  };
}

// ============================================================
// 입상 여부 판별
// ============================================================

function isPlacement(placement: string | null): boolean {
  if (!placement || placement === "" || placement === "예선탈락") return false;
  return true;
}

// ============================================================
// 참가 유형 배지
// ============================================================

function TeamOrSoloBadge({
  value,
}: {
  value: DanceCompetitionRecord["teamOrSolo"];
}) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium ${COMPETITION_TEAM_OR_SOLO_COLORS[value]}`}
    >
      {COMPETITION_TEAM_OR_SOLO_LABELS[value]}
    </span>
  );
}

// ============================================================
// 기록 다이얼로그 (추가/수정)
// ============================================================

function RecordDialog({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: FormState;
  onClose: () => void;
  onSave: (form: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(initial);

  // open 상태가 바뀔 때 폼 초기화
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setForm(initial);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.competitionName.trim()) {
      toast.error("대회명을 입력해주세요.");
      return;
    }
    if (!form.date) {
      toast.error("날짜를 입력해주세요.");
      return;
    }
    onSave(form);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-lg bg-background shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">
            {initial.competitionName ? "대회 기록 수정" : "대회 기록 추가"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 본문 */}
        <div className="max-h-[70vh] overflow-y-auto px-4 py-4 space-y-3">
          {/* 대회명 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              대회명 <span className="text-red-500">*</span>
            </label>
            <Input
              className="h-8 text-xs"
              placeholder="예) 2024 전국댄스컴피티션"
              value={form.competitionName}
              onChange={(e) => set("competitionName", e.target.value)}
            />
          </div>

          {/* 날짜 / 장소 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                날짜 <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                장소
              </label>
              <Input
                className="h-8 text-xs"
                placeholder="예) 올림픽공원"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
          </div>

          {/* 참가 유형 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              참가 유형
            </label>
            <div className="flex gap-2">
              {(["solo", "team", "duo"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set("teamOrSolo", type)}
                  className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                    form.teamOrSolo === type
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {COMPETITION_TEAM_OR_SOLO_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* 팀명 (팀/듀오 선택 시) */}
          {form.teamOrSolo !== "solo" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                팀명
              </label>
              <Input
                className="h-8 text-xs"
                placeholder="예) 크루 네온"
                value={form.teamName}
                onChange={(e) => set("teamName", e.target.value)}
              />
            </div>
          )}

          {/* 장르 / 부문 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                장르
              </label>
              <Input
                className="h-8 text-xs"
                placeholder="예) 힙합"
                value={form.genre}
                onChange={(e) => set("genre", e.target.value)}
                list="competition-genres"
              />
              <datalist id="competition-genres">
                {SUGGESTED_COMPETITION_GENRES.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                부문/카테고리
              </label>
              <Input
                className="h-8 text-xs"
                placeholder="예) 오픈부, 고등부"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              />
            </div>
          </div>

          {/* 결과 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              결과/순위
            </label>
            <Input
              className="h-8 text-xs"
              placeholder="예) 1위, 결선진출, 예선탈락"
              value={form.placement}
              onChange={(e) => set("placement", e.target.value)}
              list="competition-placements"
            />
            <datalist id="competition-placements">
              {SUGGESTED_PLACEMENTS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            {/* 빠른 선택 */}
            <div className="flex flex-wrap gap-1 pt-1">
              {SUGGESTED_PLACEMENTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("placement", p)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                    form.placement === p
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 수상 증명서 URL */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              수상 증명서 URL (선택)
            </label>
            <Input
              className="h-8 text-xs"
              placeholder="https://..."
              value={form.certificateUrl}
              onChange={(e) => set("certificateUrl", e.target.value)}
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              메모
            </label>
            <Textarea
              className="min-h-[60px] text-xs resize-none"
              placeholder="대회 소감, 준비 과정, 기억할 내용..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {initial.competitionName ? "수정" : "추가"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 타임라인 기록 아이템
// ============================================================

function RecordItem({
  record,
  onEdit,
  onDelete,
}: {
  record: DanceCompetitionRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const placed = isPlacement(record.placement);

  return (
    <div className="relative flex gap-3">
      {/* 타임라인 선 */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
            placed
              ? "border-yellow-400 bg-yellow-50 text-yellow-600"
              : "border-border bg-muted text-muted-foreground"
          }`}
        >
          {placed ? (
            <Trophy className="h-3.5 w-3.5" />
          ) : (
            <Medal className="h-3.5 w-3.5" />
          )}
        </div>
        <div className="w-px flex-1 bg-border" />
      </div>

      {/* 콘텐츠 */}
      <div className="mb-4 flex-1 rounded-lg border bg-card p-3 shadow-sm">
        {/* 상단: 대회명 + 배지들 + 액션 버튼 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-sm font-semibold leading-tight">
                {record.competitionName}
              </span>
              {placed && record.placement && (
                <span className="inline-flex items-center gap-0.5 rounded border border-yellow-300 bg-yellow-50 px-1.5 py-0 text-[10px] font-medium text-yellow-700">
                  <Trophy className="h-2.5 w-2.5" />
                  {record.placement}
                </span>
              )}
              {!placed && record.placement && (
                <span className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0 text-[10px] text-muted-foreground">
                  {record.placement}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <TeamOrSoloBadge value={record.teamOrSolo} />
              {record.teamName && (
                <span className="text-[10px] text-muted-foreground">
                  {record.teamName}
                </span>
              )}
              {record.genre && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4"
                >
                  {record.genre}
                </Badge>
              )}
              {record.category && (
                <span className="text-[10px] text-muted-foreground">
                  {record.category}
                </span>
              )}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* 메타 정보 */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {record.date}
          </span>
          {record.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {record.location}
            </span>
          )}
          {record.certificateUrl && (
            <a
              href={record.certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-500 hover:underline"
            >
              <Link className="h-3 w-3" />
              증명서
            </a>
          )}
        </div>

        {/* 메모 */}
        {record.notes && (
          <p className="mt-2 flex items-start gap-1 rounded-md bg-muted/50 px-2 py-1.5 text-[11px] text-muted-foreground leading-relaxed">
            <StickyNote className="mt-0.5 h-3 w-3 shrink-0" />
            {record.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 통계 섹션
// ============================================================

function StatsSection({
  stats,
  years,
  genres,
}: {
  stats: ReturnType<typeof useDanceCompetition>["stats"];
  years: string[];
  genres: string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
        <div className="text-lg font-bold tabular-nums">{stats.totalRecords}</div>
        <div className="text-[10px] text-muted-foreground">총 참가</div>
      </div>
      <div className="rounded-lg border bg-yellow-50 p-2.5 text-center">
        <div className="text-lg font-bold tabular-nums text-yellow-600">
          {stats.placementCount}
        </div>
        <div className="text-[10px] text-muted-foreground">입상 횟수</div>
      </div>
      <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
        <div className="text-lg font-bold tabular-nums">{years.length}</div>
        <div className="text-[10px] text-muted-foreground">활동 연도</div>
      </div>
      <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
        <div className="text-lg font-bold tabular-nums">{genres.length}</div>
        <div className="text-[10px] text-muted-foreground">도전 장르</div>
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function DanceCompetitionCard({ memberId }: DanceCompetitionCardProps) {
  const {
    records,
    loading,
    genres,
    years,
    stats,
    addRecord,
    updateRecord,
    deleteRecord,
  } = useDanceCompetition(memberId);

  const [isOpen, setIsOpen] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<DanceCompetitionRecord | null>(
    null
  );
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [showStats, setShowStats] = useState(false);
  const deleteConfirm = useDeleteConfirm<DanceCompetitionRecord>();

  // 필터 적용
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const yearMatch =
        filterYear === "all" || r.date.startsWith(filterYear);
      const genreMatch =
        filterGenre === "all" || r.genre === filterGenre;
      return yearMatch && genreMatch;
    });
  }, [records, filterYear, filterGenre]);

  function handleAdd() {
    setEditTarget(null);
    setShowDialog(true);
  }

  function handleEdit(record: DanceCompetitionRecord) {
    setEditTarget(record);
    setShowDialog(true);
  }

  function handleDelete(record: DanceCompetitionRecord) {
    deleteConfirm.request(record);
  }

  function confirmDelete() {
    const target = deleteConfirm.confirm();
    if (!target) return;
    deleteRecord(target.id);
    toast.success("기록이 삭제되었습니다.");
  }

  function handleSave(form: FormState) {
    if (editTarget) {
      updateRecord(editTarget.id, {
        competitionName: form.competitionName.trim(),
        date: form.date,
        location: form.location.trim() || null,
        category: form.category.trim() || null,
        placement: form.placement.trim() || null,
        teamOrSolo: form.teamOrSolo,
        teamName: form.teamName.trim() || null,
        genre: form.genre.trim() || null,
        notes: form.notes.trim(),
        certificateUrl: form.certificateUrl.trim() || null,
      });
      toast.success("기록이 수정되었습니다.");
    } else {
      addRecord({
        competitionName: form.competitionName.trim(),
        date: form.date,
        location: form.location.trim() || null,
        category: form.category.trim() || null,
        placement: form.placement.trim() || null,
        teamOrSolo: form.teamOrSolo,
        teamName: form.teamName.trim() || null,
        genre: form.genre.trim() || null,
        notes: form.notes.trim(),
        certificateUrl: form.certificateUrl.trim() || null,
      });
      toast.success("대회 기록이 추가되었습니다.");
    }
    setShowDialog(false);
  }

  return (
    <>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-2">
            <CollapsibleTrigger asChild>
              <div className="flex cursor-pointer items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  댄스 대회 참가 기록
                  {records.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4"
                    >
                      {records.length}
                    </Badge>
                  )}
                  {stats.placementCount > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 h-4 bg-yellow-100 text-yellow-700 border border-yellow-300">
                      입상 {stats.placementCount}회
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdd();
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    추가
                  </Button>
                  {isOpen ? (
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
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : records.length === 0 ? (
                /* 빈 상태 */
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Trophy className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      아직 대회 참가 기록이 없어요
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      참가한 댄스 대회/컴피티션 이력을 기록해 보세요
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleAdd}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    첫 기록 추가
                  </Button>
                </div>
              ) : (
                <>
                  {/* 통계 토글 */}
                  <button
                    type="button"
                    onClick={() => setShowStats((v) => !v)}
                    className="flex w-full items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <BarChart2 className="h-3.5 w-3.5" />
                      통계 보기
                    </span>
                    {showStats ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {showStats && (
                    <div className="space-y-3">
                      <StatsSection
                        stats={stats}
                        years={years}
                        genres={genres}
                      />
                      {/* 연도별 분포 */}
                      {years.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                            연도별 참가
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {years.map((yr) => (
                              <div
                                key={yr}
                                className="flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1 text-[10px]"
                              >
                                <span className="font-medium">{yr}년</span>
                                <span className="text-muted-foreground">
                                  {stats.yearlyDistribution[yr] ?? 0}회
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* 장르별 분포 */}
                      {genres.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                            장르별 참가
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {genres.map((g) => (
                              <div
                                key={g}
                                className="flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1 text-[10px]"
                              >
                                <Music2 className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">{g}</span>
                                <span className="text-muted-foreground">
                                  {stats.genreDistribution[g] ?? 0}회
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 필터 */}
                  {(years.length > 1 || genres.length > 1) && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {years.length > 1 && (
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setFilterYear("all")}
                            className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                              filterYear === "all"
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            전체 연도
                          </button>
                          {years.map((yr) => (
                            <button
                              key={yr}
                              type="button"
                              onClick={() => setFilterYear(yr)}
                              className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                                filterYear === yr
                                  ? "border-primary bg-primary/10 text-primary font-medium"
                                  : "border-border text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {yr}
                            </button>
                          ))}
                        </div>
                      )}
                      {genres.length > 1 && (
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setFilterGenre("all")}
                            className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                              filterGenre === "all"
                                ? "border-secondary bg-secondary/10 text-secondary-foreground font-medium"
                                : "border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            전체 장르
                          </button>
                          {genres.map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setFilterGenre(g)}
                              className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                                filterGenre === g
                                  ? "border-secondary bg-secondary/10 text-secondary-foreground font-medium"
                                  : "border-border text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 필터 결과 없음 */}
                  {filteredRecords.length === 0 && (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      해당 조건의 기록이 없습니다.
                    </p>
                  )}

                  {/* 타임라인 */}
                  {filteredRecords.length > 0 && (
                    <div className="pt-1">
                      {filteredRecords.map((record, idx) => (
                        <div key={record.id} className="relative">
                          <RecordItem
                            record={record}
                            onEdit={() => handleEdit(record)}
                            onDelete={() => handleDelete(record)}
                          />
                          {/* 마지막 아이템은 타임라인 선 숨김 */}
                          {idx === filteredRecords.length - 1 && (
                            <style>{`
                              #competition-last-line { display: none; }
                            `}</style>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 다이얼로그 */}
      <RecordDialog
        open={showDialog}
        initial={editTarget ? recordToForm(editTarget) : EMPTY_FORM}
        onClose={() => setShowDialog(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="기록 삭제"
        description={`"${deleteConfirm.target?.competitionName}" 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={confirmDelete}
        destructive
      />
    </>
  );
}
