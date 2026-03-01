"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Star,
  User,
  Calendar,
  Clock,
  Filter,
  BarChart2,
  Pencil,
  X,
  Tag,
  BookOpen,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useDanceClassLog,
  CLASS_LOG_LEVEL_LABELS,
  CLASS_LOG_LEVEL_ORDER,
  CLASS_LOG_LEVEL_COLORS,
  CLASS_LOG_SOURCE_LABELS,
  CLASS_LOG_SOURCE_COLORS,
  SUGGESTED_CLASS_GENRES,
} from "@/hooks/use-dance-class-log";
import type {
  DanceClassLogEntry,
  DanceClassLogLevel,
  DanceClassLogSource,
} from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================================
// 별점 컴포넌트
// ============================================================

function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const iconClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = readOnly ? n <= value : n <= (hovered || value);
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            onMouseEnter={() => !readOnly && setHovered(n)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            className={`p-0 leading-none transition-colors ${
              readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
          >
            <Star
              className={`${iconClass} transition-colors ${
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/40"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Props
// ============================================================

interface DanceClassLogCardProps {
  memberId: string;
}

// ============================================================
// 폼 상태 타입
// ============================================================

type FormState = {
  className: string;
  instructor: string;
  date: string;
  startTime: string;
  durationMin: string;
  source: DanceClassLogSource | "";
  genre: string;
  customGenre: string;
  level: DanceClassLogLevel | "";
  summary: string;
  skillsInput: string;
  selfRating: number;
  notes: string;
};

const defaultForm: FormState = {
  className: "",
  instructor: "",
  date: "",
  startTime: "",
  durationMin: "",
  source: "",
  genre: "",
  customGenre: "",
  level: "",
  summary: "",
  skillsInput: "",
  selfRating: 0,
  notes: "",
};

// ============================================================
// 메인 컴포넌트
// ============================================================

export function DanceClassLogCard({ memberId }: DanceClassLogCardProps) {
  const {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    getStats,
  } = useDanceClassLog(memberId);

  const stats = useMemo(() => getStats(), [getStats]);

  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const { pending: submitting, execute } = useAsyncAction();
  const [form, setForm] = useState<FormState>(defaultForm);

  // 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(defaultForm);

  // 필터
  const [filterGenre, setFilterGenre] = useState("all");
  const [filterSource, setFilterSource] = useState<
    DanceClassLogSource | "all"
  >("all");
  const [filterLevel, setFilterLevel] = useState<DanceClassLogLevel | "all">(
    "all"
  );

  // ──────────────────────────────────────────
  // 필터된 목록
  // ──────────────────────────────────────────

  const filteredEntries = useMemo(() => {
    let result = [...entries];
    if (filterGenre !== "all") {
      result = result.filter((e) => e.genre === filterGenre);
    }
    if (filterSource !== "all") {
      result = result.filter((e) => e.source === filterSource);
    }
    if (filterLevel !== "all") {
      result = result.filter((e) => e.level === filterLevel);
    }
    result.sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [entries, filterGenre, filterSource, filterLevel]);

  const totalCount = entries.length;

  // ──────────────────────────────────────────
  // 유효성 검사
  // ──────────────────────────────────────────

  function validateForm(f: FormState): string | null {
    if (!f.className.trim()) return "수업명을 입력하세요.";
    if (!f.instructor.trim()) return "강사명을 입력하세요.";
    if (!f.date) return "날짜를 선택하세요.";
    if (!f.source) return "수업 출처를 선택하세요.";
    const finalGenre =
      f.genre === "__custom__" ? f.customGenre.trim() : f.genre;
    if (!finalGenre) return "장르를 선택하거나 직접 입력하세요.";
    if (!f.level) return "레벨을 선택하세요.";
    if (f.selfRating === 0) return "자가 평가 별점을 선택하세요.";
    return null;
  }

  // ──────────────────────────────────────────
  // 추가 폼 제출
  // ──────────────────────────────────────────

  function resetForm() {
    setForm(defaultForm);
  }

  function parseSkills(input: string): string[] {
    return input
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleSubmit() {
    const error = validateForm(form);
    if (error) {
      toast.error(error);
      return;
    }
    const finalGenre =
      form.genre === "__custom__" ? form.customGenre.trim() : form.genre;

    await execute(async () => {
      addEntry({
        memberId,
        className: form.className.trim(),
        instructor: form.instructor.trim(),
        date: form.date,
        startTime: form.startTime || undefined,
        durationMin: form.durationMin ? Number(form.durationMin) : undefined,
        source: form.source as DanceClassLogSource,
        genre: finalGenre,
        level: form.level as DanceClassLogLevel,
        summary: form.summary.trim() || undefined,
        skills: parseSkills(form.skillsInput),
        selfRating: form.selfRating,
        notes: form.notes.trim() || undefined,
      });
      toast.success(`'${form.className.trim()}' 수업이 기록되었습니다.`);
      resetForm();
      setFormOpen(false);
    });
  }

  // ──────────────────────────────────────────
  // 편집 핸들러
  // ──────────────────────────────────────────

  function startEdit(entry: DanceClassLogEntry) {
    setEditingId(entry.id);
    setEditForm({
      className: entry.className,
      instructor: entry.instructor,
      date: entry.date,
      startTime: entry.startTime ?? "",
      durationMin: entry.durationMin ? String(entry.durationMin) : "",
      source: entry.source,
      genre: entry.genre,
      customGenre: "",
      level: entry.level,
      summary: entry.summary ?? "",
      skillsInput: entry.skills.join(", "),
      selfRating: entry.selfRating,
      notes: entry.notes ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(defaultForm);
  }

  async function handleUpdate(entryId: string) {
    const error = validateForm(editForm);
    if (error) {
      toast.error(error);
      return;
    }
    const finalGenre =
      editForm.genre === "__custom__"
        ? editForm.customGenre.trim()
        : editForm.genre;
    try {
      updateEntry(entryId, {
        className: editForm.className.trim(),
        instructor: editForm.instructor.trim(),
        date: editForm.date,
        startTime: editForm.startTime || undefined,
        durationMin: editForm.durationMin
          ? Number(editForm.durationMin)
          : undefined,
        source: editForm.source as DanceClassLogSource,
        genre: finalGenre,
        level: editForm.level as DanceClassLogLevel,
        summary: editForm.summary.trim() || undefined,
        skills: parseSkills(editForm.skillsInput),
        selfRating: editForm.selfRating,
        notes: editForm.notes.trim() || undefined,
      });
      toast.success(TOAST.MEMBERS.CLASS_LOG_UPDATED);
      cancelEdit();
    } catch {
      toast.error(TOAST.MEMBERS.CLASS_LOG_EDIT_ERROR);
    }
  }

  // ──────────────────────────────────────────
  // 삭제 핸들러
  // ──────────────────────────────────────────

  function handleDelete(entryId: string, name: string) {
    try {
      deleteEntry(entryId);
      toast.success(`'${name}' 수업 기록이 삭제되었습니다.`);
    } catch {
      toast.error(TOAST.MEMBERS.CLASS_LOG_DELETE_ERROR);
    }
  }

  // ──────────────────────────────────────────
  // 유틸
  // ──────────────────────────────────────────

  
  function formatDuration(min?: number) {
    if (!min) return null;
    if (min < 60) return `${min}분`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  }

  // ──────────────────────────────────────────
  // JSX
  // ──────────────────────────────────────────

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-teal-500" />
                <CardTitle className="text-sm font-semibold">
                  댄스 수업 수강 기록
                </CardTitle>
                <Badge className="text-[10px] px-1.5 py-0 bg-teal-100 text-teal-700 border-teal-300">
                  {totalCount}건
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!open) setOpen(true);
                    setFormOpen((prev) => !prev);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  수업 추가
                </Button>
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
            {/* 추가 폼 */}
            {formOpen && (
              <ClassLogForm
                form={form}
                setForm={setForm}
                onSubmit={handleSubmit}
                onCancel={() => {
                  resetForm();
                  setFormOpen(false);
                }}
                submitting={submitting}
                title="신규 수업 기록"
                submitLabel="등록"
              />
            )}

            {/* 통계 요약 */}
            {totalCount > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <StatBadge
                  icon={<GraduationCap className="h-3 w-3 text-teal-500" />}
                  label="총 수업"
                  value={`${totalCount}회`}
                  color="teal"
                />
                <StatBadge
                  icon={<Clock className="h-3 w-3 text-blue-500" />}
                  label="최근 30일"
                  value={`${stats.recentMonthCount}회`}
                  color="blue"
                />
                <StatBadge
                  icon={<Star className="h-3 w-3 text-yellow-500" />}
                  label="평균 평가"
                  value={`${stats.avgRating} / 5`}
                  color="yellow"
                />
              </div>
            )}

            {/* 레벨별 분포 */}
            {totalCount > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  <BarChart2 className="h-3 w-3" />
                  레벨 분포
                </div>
                <div className="space-y-1.5">
                  {CLASS_LOG_LEVEL_ORDER.map((lv) => {
                    const count = stats.byLevel[lv];
                    const maxCount = Math.max(...Object.values(stats.byLevel), 1);
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={lv} className="flex items-center gap-2">
                        <span
                          className={`text-[10px] w-14 shrink-0 font-medium ${CLASS_LOG_LEVEL_COLORS[lv].text}`}
                        >
                          {CLASS_LOG_LEVEL_LABELS[lv]}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${CLASS_LOG_LEVEL_COLORS[lv].bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] w-4 text-right text-muted-foreground shrink-0">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 필터 */}
            {totalCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Filter className="h-3 w-3 text-muted-foreground shrink-0" />

                {/* 출처 필터 */}
                {(["all", "internal", "external"] as const).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setFilterSource(src)}
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                      filterSource === src
                        ? src === "all"
                          ? "bg-primary text-primary-foreground border-primary"
                          : `${CLASS_LOG_SOURCE_COLORS[src].badge} border-current`
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {src === "all"
                      ? "전체 출처"
                      : CLASS_LOG_SOURCE_LABELS[src]}
                  </button>
                ))}

                <span className="text-[10px] text-muted-foreground mx-0.5">
                  |
                </span>

                {/* 장르 필터 */}
                <button
                  type="button"
                  onClick={() => setFilterGenre("all")}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                    filterGenre === "all"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-accent"
                  }`}
                >
                  전체 장르
                </button>
                {stats.genres.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() =>
                      setFilterGenre(g === filterGenre ? "all" : g)
                    }
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                      filterGenre === g
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {g}
                  </button>
                ))}

                <span className="text-[10px] text-muted-foreground mx-0.5">
                  |
                </span>

                {/* 레벨 필터 */}
                {CLASS_LOG_LEVEL_ORDER.map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() =>
                      setFilterLevel(lv === filterLevel ? "all" : lv)
                    }
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                      filterLevel === lv
                        ? `${CLASS_LOG_LEVEL_COLORS[lv].badge} border-current`
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {CLASS_LOG_LEVEL_LABELS[lv]}
                  </button>
                ))}
              </div>
            )}

            {/* 목록 */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-md" />
                ))}
              </div>
            ) : totalCount === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">수강한 댄스 수업 기록이 없습니다.</p>
                <p className="text-[11px] mt-0.5">
                  위 버튼으로 첫 수업을 기록하세요.
                </p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-xs">필터에 맞는 수업 기록이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEntries.map((entry) =>
                  editingId === entry.id ? (
                    <div
                      key={entry.id}
                      className="rounded-lg border bg-muted/20 p-3"
                    >
                      <ClassLogForm
                        form={editForm}
                        setForm={setEditForm}
                        onSubmit={() => handleUpdate(entry.id)}
                        onCancel={cancelEdit}
                        submitting={false}
                        title="수업 기록 수정"
                        submitLabel="저장"
                      />
                    </div>
                  ) : (
                    <ClassLogRow
                      key={entry.id}
                      entry={entry}
                      onEdit={() => startEdit(entry)}
                      onDelete={() =>
                        handleDelete(entry.id, entry.className)
                      }
                      formatYearMonthDay={formatYearMonthDay}
                      formatDuration={formatDuration}
                    />
                  )
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================================
// 통계 배지 서브컴포넌트
// ============================================================

function StatBadge({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    teal: "bg-teal-50 border-teal-200",
    blue: "bg-blue-50 border-blue-200",
    yellow: "bg-yellow-50 border-yellow-200",
  };
  return (
    <div
      className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 ${
        colorMap[color] ?? "bg-muted/30 border-border"
      }`}
    >
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

// ============================================================
// 수업 행 서브컴포넌트
// ============================================================

interface ClassLogRowProps {
  entry: DanceClassLogEntry;
  onEdit: () => void;
  onDelete: () => void;
  formatYearMonthDay: (iso: string) => string;
  formatDuration: (min?: number) => string | null;
}

function ClassLogRow({
  entry,
  onEdit,
  onDelete,
  formatYearMonthDay,
  formatDuration,
}: ClassLogRowProps) {
  const levelColors = CLASS_LOG_LEVEL_COLORS[entry.level];
  const sourceColors = CLASS_LOG_SOURCE_COLORS[entry.source];
  const duration = formatDuration(entry.durationMin);

  return (
    <div className="rounded-lg border bg-background hover:bg-muted/20 transition-colors p-3 space-y-2">
      {/* 헤더 행 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-xs font-semibold truncate">
            {entry.className}
          </span>
          <Badge
            className={`text-[10px] px-1.5 py-0 border shrink-0 ${levelColors.badge}`}
          >
            {CLASS_LOG_LEVEL_LABELS[entry.level]}
          </Badge>
          <Badge
            className={`text-[10px] px-1.5 py-0 border shrink-0 ${sourceColors.badge}`}
          >
            {CLASS_LOG_SOURCE_LABELS[entry.source]}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 shrink-0"
          >
            {entry.genre}
          </Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
            onClick={onEdit}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 메타 정보 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <User className="h-3 w-3" />
          {entry.instructor}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatYearMonthDay(entry.date)}
          {entry.startTime && (
            <span className="ml-0.5">{entry.startTime}</span>
          )}
        </span>
        {duration && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {duration}
          </span>
        )}
        <StarRating value={entry.selfRating} readOnly size="sm" />
      </div>

      {/* 내용 요약 */}
      {entry.summary && (
        <p className="text-[11px] text-foreground/80 bg-muted/40 rounded px-2 py-1 leading-relaxed">
          <BookOpen className="h-2.5 w-2.5 inline mr-1 text-muted-foreground" />
          {entry.summary}
        </p>
      )}

      {/* 배운 기술 태그 */}
      {entry.skills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <Tag className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
          {entry.skills.map((skill) => (
            <span
              key={skill}
              className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100/60 text-teal-700 border border-teal-200"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* 추가 메모 */}
      {entry.notes && (
        <p className="text-[11px] text-muted-foreground bg-muted/30 rounded px-2 py-1 leading-relaxed">
          {entry.notes}
        </p>
      )}
    </div>
  );
}

// ============================================================
// 수업 폼 서브컴포넌트
// ============================================================

interface ClassLogFormProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  title: string;
  submitLabel: string;
}

function ClassLogForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitting,
  title,
  submitLabel,
}: ClassLogFormProps) {
  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      {/* 타이틀 */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={onCancel}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* 수업명 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">수업명 *</label>
        <Input
          placeholder="수업 또는 클래스 이름"
          value={form.className}
          onChange={(e) => setField("className", e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* 강사 / 날짜 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">강사 *</label>
          <Input
            placeholder="강사 이름"
            value={form.instructor}
            onChange={(e) => setField("instructor", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">날짜 *</label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setField("date", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* 시작 시간 / 수업 시간 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">시작 시간</label>
          <Input
            type="time"
            value={form.startTime}
            onChange={(e) => setField("startTime", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            수업 시간 (분)
          </label>
          <Input
            type="number"
            min={1}
            placeholder="예: 60"
            value={form.durationMin}
            onChange={(e) => setField("durationMin", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* 출처 선택 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">수업 출처 *</label>
        <div className="flex gap-2">
          {(["internal", "external"] as DanceClassLogSource[]).map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => setField("source", src)}
              className={`text-[11px] px-3 py-1 rounded-md border font-medium transition-colors ${
                form.source === src
                  ? `${CLASS_LOG_SOURCE_COLORS[src].badge} border-current`
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {CLASS_LOG_SOURCE_LABELS[src]}
            </button>
          ))}
        </div>
      </div>

      {/* 장르 선택 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">장르 *</label>
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_CLASS_GENRES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                setField("genre", g);
                setField("customGenre", "");
              }}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                form.genre === g
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {g}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setField("genre", "__custom__")}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
              form.genre === "__custom__"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            직접 입력
          </button>
        </div>
        {form.genre === "__custom__" && (
          <Input
            placeholder="장르 직접 입력"
            value={form.customGenre}
            onChange={(e) => setField("customGenre", e.target.value)}
            className="h-8 text-xs mt-1"
          />
        )}
      </div>

      {/* 레벨 선택 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">레벨 *</label>
        <div className="flex flex-wrap gap-1.5">
          {CLASS_LOG_LEVEL_ORDER.map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => setField("level", lv)}
              className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                form.level === lv
                  ? `${CLASS_LOG_LEVEL_COLORS[lv].badge} border-current`
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {CLASS_LOG_LEVEL_LABELS[lv]}
            </button>
          ))}
        </div>
      </div>

      {/* 내용 요약 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">
          수업 내용 요약 (선택)
        </label>
        <Textarea
          placeholder="오늘 수업에서 다룬 주요 내용을 요약하세요."
          value={form.summary}
          onChange={(e) => setField("summary", e.target.value)}
          className="min-h-[52px] text-xs resize-none"
        />
      </div>

      {/* 배운 기술 태그 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">
          배운 기술 (선택, 쉼표로 구분)
        </label>
        <Input
          placeholder="예: 힙합 기초, 웨이브, 슬라이드"
          value={form.skillsInput}
          onChange={(e) => setField("skillsInput", e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* 자가 평가 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">자가 평가 *</label>
        <div className="flex items-center gap-2">
          <StarRating
            value={form.selfRating}
            onChange={(v) => setField("selfRating", v)}
          />
          {form.selfRating > 0 && (
            <span className="text-xs text-muted-foreground">
              {form.selfRating} / 5
            </span>
          )}
        </div>
      </div>

      {/* 추가 메모 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">
          추가 메모 (선택)
        </label>
        <Textarea
          placeholder="느낀 점, 개선할 점, 다음에 연습할 내용 등을 자유롭게 적으세요."
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          className="min-h-[52px] text-xs resize-none"
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 justify-end pt-1">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={onCancel}
          disabled={submitting}
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={onSubmit}
          disabled={submitting}
        >
          <GraduationCap className="h-3 w-3 mr-1" />
          {submitting ? "처리 중..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
