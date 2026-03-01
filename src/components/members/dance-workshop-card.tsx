"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Star,
  MapPin,
  User,
  Calendar,
  DollarSign,
  Filter,
  BarChart2,
  Pencil,
  X,
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
  useDanceWorkshop,
  WORKSHOP_LEVEL_LABELS,
  WORKSHOP_LEVEL_ORDER,
  WORKSHOP_LEVEL_COLORS,
  SUGGESTED_WORKSHOP_GENRES,
} from "@/hooks/use-dance-workshop";
import type { DanceWorkshopEntry, DanceWorkshopLevel } from "@/types";

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
            className={`p-0 leading-none transition-colors ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
          >
            <Star
              className={`${iconClass} transition-colors ${filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
            />
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// 워크숍 카드 Props
// ============================================================

interface DanceWorkshopCardProps {
  memberId: string;
}

// ============================================================
// 기본 폼 상태
// ============================================================

type FormState = {
  workshopName: string;
  instructor: string;
  venue: string;
  date: string;
  genre: string;
  customGenre: string;
  level: DanceWorkshopLevel | "";
  cost: string;
  rating: number;
  notes: string;
};

const defaultForm: FormState = {
  workshopName: "",
  instructor: "",
  venue: "",
  date: "",
  genre: "",
  customGenre: "",
  level: "",
  cost: "",
  rating: 0,
  notes: "",
};

// ============================================================
// 메인 컴포넌트
// ============================================================

export function DanceWorkshopCard({ memberId }: DanceWorkshopCardProps) {
  const {
    entries,
    loading,
    genres,
    totalCost,
    avgRating,
    levelStats,
    addEntry,
    updateEntry,
    deleteEntry,
  } = useDanceWorkshop(memberId);

  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const { pending: submitting, execute } = useAsyncAction();
  const [form, setForm] = useState<FormState>(defaultForm);

  // 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(defaultForm);

  // 필터
  const [filterGenre, setFilterGenre] = useState("all");
  const [filterLevel, setFilterLevel] = useState<DanceWorkshopLevel | "all">("all");

  // ──────────────────────────────────────
  // 필터된 목록
  // ──────────────────────────────────────

  const filteredEntries = useMemo(() => {
    let result = [...entries];
    if (filterGenre !== "all") {
      result = result.filter((e) => e.genre === filterGenre);
    }
    if (filterLevel !== "all") {
      result = result.filter((e) => e.level === filterLevel);
    }
    // 날짜 내림차순 정렬
    result.sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [entries, filterGenre, filterLevel]);

  const totalCount = entries.length;
  const maxLevelCount = Math.max(...Object.values(levelStats), 1);

  // ──────────────────────────────────────
  // 유효성 검사
  // ──────────────────────────────────────

  function validateForm(f: FormState): string | null {
    if (!f.workshopName.trim()) return "워크숍명을 입력하세요.";
    if (!f.instructor.trim()) return "강사명을 입력하세요.";
    if (!f.venue.trim()) return "장소를 입력하세요.";
    if (!f.date) return "날짜를 선택하세요.";
    const finalGenre = f.genre === "__custom__" ? f.customGenre.trim() : f.genre;
    if (!finalGenre) return "장르를 선택하거나 직접 입력하세요.";
    if (!f.level) return "레벨을 선택하세요.";
    if (f.rating === 0) return "평가 별점을 선택하세요.";
    return null;
  }

  // ──────────────────────────────────────
  // 추가 폼 제출
  // ──────────────────────────────────────

  function resetForm() {
    setForm(defaultForm);
  }

  async function handleSubmit() {
    const error = validateForm(form);
    if (error) {
      toast.error(error);
      return;
    }
    const finalGenre = form.genre === "__custom__" ? form.customGenre.trim() : form.genre;

    await execute(async () => {
      addEntry({
        workshopName: form.workshopName.trim(),
        instructor: form.instructor.trim(),
        venue: form.venue.trim(),
        date: form.date,
        genre: finalGenre,
        level: form.level as DanceWorkshopLevel,
        cost: Number(form.cost) || 0,
        rating: form.rating,
        notes: form.notes.trim(),
      });
      toast.success(`'${form.workshopName.trim()}' 워크숍이 추가되었습니다.`);
      resetForm();
      setFormOpen(false);
    });
  }

  // ──────────────────────────────────────
  // 편집 핸들러
  // ──────────────────────────────────────

  function startEdit(entry: DanceWorkshopEntry) {
    setEditingId(entry.id);
    setEditForm({
      workshopName: entry.workshopName,
      instructor: entry.instructor,
      venue: entry.venue,
      date: entry.date,
      genre: entry.genre,
      customGenre: "",
      level: entry.level,
      cost: entry.cost > 0 ? String(entry.cost) : "",
      rating: entry.rating,
      notes: entry.notes,
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
      editForm.genre === "__custom__" ? editForm.customGenre.trim() : editForm.genre;
    try {
      updateEntry(entryId, {
        workshopName: editForm.workshopName.trim(),
        instructor: editForm.instructor.trim(),
        venue: editForm.venue.trim(),
        date: editForm.date,
        genre: finalGenre,
        level: editForm.level as DanceWorkshopLevel,
        cost: Number(editForm.cost) || 0,
        rating: editForm.rating,
        notes: editForm.notes.trim(),
      });
      toast.success("워크숍 이력이 수정되었습니다.");
      cancelEdit();
    } catch {
      toast.error("워크숍 수정 중 오류가 발생했습니다.");
    }
  }

  // ──────────────────────────────────────
  // 삭제 핸들러
  // ──────────────────────────────────────

  function handleDelete(entryId: string, name: string) {
    try {
      deleteEntry(entryId);
      toast.success(`'${name}' 이력이 삭제되었습니다.`);
    } catch {
      toast.error("워크숍 삭제 중 오류가 발생했습니다.");
    }
  }

  // ──────────────────────────────────────
  // 날짜 포매터
  // ──────────────────────────────────────

  function formatDate(iso: string) {
    return iso.replace(/-/g, ".");
  }

  function formatCost(cost: number) {
    if (cost === 0) return "무료";
    return cost.toLocaleString("ko-KR") + "원";
  }

  // ──────────────────────────────────────
  // JSX
  // ──────────────────────────────────────

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                <CardTitle className="text-sm font-semibold">
                  댄스 워크숍 이력
                </CardTitle>
                <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-indigo-300">
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
                  워크숍 추가
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
              <WorkshopForm
                form={form}
                setForm={setForm}
                onSubmit={handleSubmit}
                onCancel={() => {
                  resetForm();
                  setFormOpen(false);
                }}
                submitting={submitting}
                title="신규 워크숍 등록"
                submitLabel="등록"
              />
            )}

            {/* 통계 요약 */}
            {totalCount > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <StatBadge
                  icon={<BookOpen className="h-3 w-3 text-indigo-500" />}
                  label="총 참석"
                  value={`${totalCount}회`}
                  color="indigo"
                />
                <StatBadge
                  icon={<DollarSign className="h-3 w-3 text-emerald-500" />}
                  label="총 비용"
                  value={totalCost === 0 ? "무료" : `${totalCost.toLocaleString("ko-KR")}원`}
                  color="emerald"
                />
                <StatBadge
                  icon={<Star className="h-3 w-3 text-yellow-500" />}
                  label="평균 평가"
                  value={`${avgRating} / 5`}
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
                  {WORKSHOP_LEVEL_ORDER.map((lv) => {
                    const count = levelStats[lv];
                    const pct = Math.round((count / maxLevelCount) * 100);
                    return (
                      <div key={lv} className="flex items-center gap-2">
                        <span className={`text-[10px] w-14 shrink-0 font-medium ${WORKSHOP_LEVEL_COLORS[lv].text}`}>
                          {WORKSHOP_LEVEL_LABELS[lv]}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${WORKSHOP_LEVEL_COLORS[lv].bar}`}
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
                {genres.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFilterGenre(g === filterGenre ? "all" : g)}
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                      filterGenre === g
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {g}
                  </button>
                ))}
                {/* 레벨 필터 */}
                <span className="text-[10px] text-muted-foreground mx-0.5">|</span>
                {WORKSHOP_LEVEL_ORDER.map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setFilterLevel(lv === filterLevel ? "all" : lv)}
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                      filterLevel === lv
                        ? `${WORKSHOP_LEVEL_COLORS[lv].badge} border-current`
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {WORKSHOP_LEVEL_LABELS[lv]}
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
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">참석한 워크숍 이력이 없습니다.</p>
                <p className="text-[11px] mt-0.5">위 버튼으로 첫 워크숍을 등록하세요.</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-xs">필터에 맞는 워크숍이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEntries.map((entry) =>
                  editingId === entry.id ? (
                    <div key={entry.id} className="rounded-lg border bg-muted/20 p-3">
                      <WorkshopForm
                        form={editForm}
                        setForm={setEditForm}
                        onSubmit={() => handleUpdate(entry.id)}
                        onCancel={cancelEdit}
                        submitting={false}
                        title="워크숍 수정"
                        submitLabel="저장"
                      />
                    </div>
                  ) : (
                    <WorkshopRow
                      key={entry.id}
                      entry={entry}
                      onEdit={() => startEdit(entry)}
                      onDelete={() => handleDelete(entry.id, entry.workshopName)}
                      formatDate={formatDate}
                      formatCost={formatCost}
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
    indigo: "bg-indigo-50 border-indigo-200",
    emerald: "bg-emerald-50 border-emerald-200",
    yellow: "bg-yellow-50 border-yellow-200",
  };
  return (
    <div className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 ${colorMap[color] ?? "bg-muted/30 border-border"}`}>
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

// ============================================================
// 워크숍 행 서브컴포넌트
// ============================================================

interface WorkshopRowProps {
  entry: DanceWorkshopEntry;
  onEdit: () => void;
  onDelete: () => void;
  formatDate: (iso: string) => string;
  formatCost: (cost: number) => string;
}

function WorkshopRow({ entry, onEdit, onDelete, formatDate, formatCost }: WorkshopRowProps) {
  const colors = WORKSHOP_LEVEL_COLORS[entry.level];

  return (
    <div className="rounded-lg border bg-background hover:bg-muted/20 transition-colors p-3 space-y-2">
      {/* 헤더 행 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-xs font-semibold truncate">{entry.workshopName}</span>
          <Badge className={`text-[10px] px-1.5 py-0 border shrink-0 ${colors.badge}`}>
            {WORKSHOP_LEVEL_LABELS[entry.level]}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
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
          <MapPin className="h-3 w-3" />
          {entry.venue}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDate(entry.date)}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <DollarSign className="h-3 w-3" />
          {formatCost(entry.cost)}
        </span>
        <StarRating value={entry.rating} readOnly size="sm" />
      </div>

      {/* 메모 */}
      {entry.notes && (
        <p className="text-[11px] text-muted-foreground bg-muted/40 rounded px-2 py-1 leading-relaxed">
          {entry.notes}
        </p>
      )}
    </div>
  );
}

// ============================================================
// 워크숍 폼 서브컴포넌트
// ============================================================

interface WorkshopFormProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  title: string;
  submitLabel: string;
}

function WorkshopForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitting,
  title,
  submitLabel,
}: WorkshopFormProps) {
  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* 워크숍명 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">워크숍명 *</label>
        <Input
          placeholder="워크숍 또는 마스터클래스 이름"
          value={form.workshopName}
          onChange={(e) => setField("workshopName", e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* 강사 / 장소 */}
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
          <label className="text-xs text-muted-foreground">장소 *</label>
          <Input
            placeholder="스튜디오, 강의장 등"
            value={form.venue}
            onChange={(e) => setField("venue", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* 날짜 / 비용 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">날짜 *</label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setField("date", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">비용 (원)</label>
          <Input
            type="number"
            min={0}
            placeholder="0 (무료)"
            value={form.cost}
            onChange={(e) => setField("cost", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* 장르 선택 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">장르 *</label>
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_WORKSHOP_GENRES.map((g) => (
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
          {WORKSHOP_LEVEL_ORDER.map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => setField("level", lv)}
              className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                form.level === lv
                  ? `${WORKSHOP_LEVEL_COLORS[lv].badge} border-current`
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {WORKSHOP_LEVEL_LABELS[lv]}
            </button>
          ))}
        </div>
      </div>

      {/* 평가 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">평가 *</label>
        <div className="flex items-center gap-2">
          <StarRating
            value={form.rating}
            onChange={(v) => setField("rating", v)}
          />
          {form.rating > 0 && (
            <span className="text-xs text-muted-foreground">{form.rating} / 5</span>
          )}
        </div>
      </div>

      {/* 배운 내용 메모 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">배운 내용 메모 (선택)</label>
        <Textarea
          placeholder="워크숍에서 배운 주요 내용, 느낀 점 등을 기록하세요."
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          className="min-h-[60px] text-xs resize-none"
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
          <BookOpen className="h-3 w-3 mr-1" />
          {submitting ? "처리 중..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
