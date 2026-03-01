"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  X,
  Calendar,
  Building2,
  Music2,
  BarChart2,
  Filter,
  MessageSquare,
  StickyNote,
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
  useDanceAudition,
  AUDITION_RESULT_LABELS,
  AUDITION_RESULT_ORDER,
  AUDITION_RESULT_COLORS,
  SUGGESTED_AUDITION_GENRES,
} from "@/hooks/use-dance-audition";
import type { DanceAuditionRecord, DanceAuditionResult } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================================
// Props
// ============================================================

interface DanceAuditionCardProps {
  memberId: string;
}

// ============================================================
// 폼 상태
// ============================================================

type FormState = {
  auditionName: string;
  organizer: string;
  date: string;
  genre: string;
  customGenre: string;
  result: DanceAuditionResult | "";
  prepSong: string;
  judgesFeedback: string;
  personalNote: string;
};

const defaultForm: FormState = {
  auditionName: "",
  organizer: "",
  date: "",
  genre: "",
  customGenre: "",
  result: "",
  prepSong: "",
  judgesFeedback: "",
  personalNote: "",
};

// ============================================================
// 메인 컴포넌트
// ============================================================

export function DanceAuditionCard({ memberId }: DanceAuditionCardProps) {
  const {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    getStats,
  } = useDanceAudition(memberId);

  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const { pending: submitting, execute } = useAsyncAction();
  const [form, setForm] = useState<FormState>(defaultForm);

  // 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(defaultForm);

  // 필터
  const [filterResult, setFilterResult] = useState<
    DanceAuditionResult | "all"
  >("all");
  const [filterGenre, setFilterGenre] = useState("all");

  // ──────────────────────────────────────
  // 파생 데이터
  // ──────────────────────────────────────

  const stats = useMemo(() => getStats(), [getStats]);
  const totalCount = records.length;

  const filteredRecords = useMemo(() => {
    let result = [...records];
    if (filterResult !== "all") {
      result = result.filter((r) => r.result === filterResult);
    }
    if (filterGenre !== "all") {
      result = result.filter((r) => r.genre === filterGenre);
    }
    return result;
  }, [records, filterResult, filterGenre]);

  // ──────────────────────────────────────
  // 유효성 검사
  // ──────────────────────────────────────

  function validateForm(f: FormState): string | null {
    if (!f.auditionName.trim()) return "오디션명을 입력하세요.";
    if (!f.organizer.trim()) return "주최사/주최자를 입력하세요.";
    if (!f.date) return "오디션 날짜를 선택하세요.";
    const finalGenre =
      f.genre === "__custom__" ? f.customGenre.trim() : f.genre;
    if (!finalGenre) return "장르를 선택하거나 직접 입력하세요.";
    if (!f.result) return "결과를 선택하세요.";
    return null;
  }

  // ──────────────────────────────────────
  // 추가 핸들러
  // ──────────────────────────────────────

  function resetForm() {
    setForm(defaultForm);
  }

  async function handleSubmit() {
    const err = validateForm(form);
    if (err) {
      toast.error(err);
      return;
    }
    const finalGenre =
      form.genre === "__custom__" ? form.customGenre.trim() : form.genre;

    await execute(async () => {
      addRecord({
        auditionName: form.auditionName.trim(),
        organizer: form.organizer.trim(),
        date: form.date,
        genre: finalGenre,
        result: form.result as DanceAuditionResult,
        prepSong: form.prepSong.trim(),
        judgesFeedback: form.judgesFeedback.trim(),
        personalNote: form.personalNote.trim(),
      });
      toast.success(`'${form.auditionName.trim()}' 오디션 기록이 추가되었습니다.`);
      resetForm();
      setFormOpen(false);
    });
  }

  // ──────────────────────────────────────
  // 편집 핸들러
  // ──────────────────────────────────────

  function startEdit(record: DanceAuditionRecord) {
    setEditingId(record.id);
    setEditForm({
      auditionName: record.auditionName,
      organizer: record.organizer,
      date: record.date,
      genre: record.genre,
      customGenre: "",
      result: record.result,
      prepSong: record.prepSong,
      judgesFeedback: record.judgesFeedback,
      personalNote: record.personalNote,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(defaultForm);
  }

  async function handleUpdate(recordId: string) {
    const err = validateForm(editForm);
    if (err) {
      toast.error(err);
      return;
    }
    const finalGenre =
      editForm.genre === "__custom__"
        ? editForm.customGenre.trim()
        : editForm.genre;
    try {
      updateRecord(recordId, {
        auditionName: editForm.auditionName.trim(),
        organizer: editForm.organizer.trim(),
        date: editForm.date,
        genre: finalGenre,
        result: editForm.result as DanceAuditionResult,
        prepSong: editForm.prepSong.trim(),
        judgesFeedback: editForm.judgesFeedback.trim(),
        personalNote: editForm.personalNote.trim(),
      });
      toast.success(TOAST.MEMBERS.AUDITION_UPDATED);
      cancelEdit();
    } catch {
      toast.error(TOAST.MEMBERS.AUDITION_EDIT_ERROR);
    }
  }

  // ──────────────────────────────────────
  // 삭제 핸들러
  // ──────────────────────────────────────

  function handleDelete(recordId: string, name: string) {
    try {
      deleteRecord(recordId);
      toast.success(`'${name}' 오디션 기록이 삭제되었습니다.`);
    } catch {
      toast.error(TOAST.MEMBERS.AUDITION_DELETE_ERROR);
    }
  }

  // ──────────────────────────────────────
  // 날짜 포매터
  // ──────────────────────────────────────

  
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
                <Trophy className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold">
                  댄스 오디션 기록
                </CardTitle>
                <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-300">
                  {totalCount}건
                </Badge>
                {totalCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-300">
                    합격률 {stats.passRate}%
                  </Badge>
                )}
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
                  오디션 추가
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
              <AuditionForm
                form={form}
                setForm={setForm}
                onSubmit={handleSubmit}
                onCancel={() => {
                  resetForm();
                  setFormOpen(false);
                }}
                submitting={submitting}
                title="신규 오디션 등록"
                submitLabel="등록"
              />
            )}

            {/* 통계 요약 */}
            {totalCount > 0 && (
              <div className="grid grid-cols-4 gap-2">
                <StatBadge
                  label="전체"
                  value={`${stats.total}회`}
                  colorClass="bg-amber-50 border-amber-200"
                />
                <StatBadge
                  label="합격"
                  value={`${stats.pass}회`}
                  colorClass="bg-green-50 border-green-200"
                />
                <StatBadge
                  label="불합격"
                  value={`${stats.fail}회`}
                  colorClass="bg-red-50 border-red-200"
                />
                <StatBadge
                  label="대기"
                  value={`${stats.pending}회`}
                  colorClass="bg-yellow-50 border-yellow-200"
                />
              </div>
            )}

            {/* 합격률 바 */}
            {stats.pass + stats.fail > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    <BarChart2 className="h-3 w-3" />
                    합격률 (결과 확정 기준)
                  </span>
                  <span className="text-xs font-semibold text-green-600">
                    {stats.passRate}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${stats.passRate}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  합격 {stats.pass}회 / 불합격 {stats.fail}회 (취소 {stats.cancelled}회 제외)
                </p>
              </div>
            )}

            {/* 필터 */}
            {totalCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Filter className="h-3 w-3 text-muted-foreground shrink-0" />
                {/* 결과 필터 */}
                <button
                  type="button"
                  onClick={() => setFilterResult("all")}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                    filterResult === "all"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-accent"
                  }`}
                >
                  전체 결과
                </button>
                {AUDITION_RESULT_ORDER.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() =>
                      setFilterResult(r === filterResult ? "all" : r)
                    }
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                      filterResult === r
                        ? `${AUDITION_RESULT_COLORS[r].badge} border-current`
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {AUDITION_RESULT_LABELS[r]}
                  </button>
                ))}
                {/* 장르 필터 */}
                {stats.genres.length > 0 && (
                  <>
                    <span className="text-[10px] text-muted-foreground mx-0.5">
                      |
                    </span>
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
                  </>
                )}
              </div>
            )}

            {/* 목록 */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-md" />
                ))}
              </div>
            ) : totalCount === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">참가한 오디션 이력이 없습니다.</p>
                <p className="text-[11px] mt-0.5">
                  위 버튼으로 첫 오디션 기록을 등록하세요.
                </p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-xs">필터에 맞는 오디션 기록이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRecords.map((record) =>
                  editingId === record.id ? (
                    <div
                      key={record.id}
                      className="rounded-lg border bg-muted/20 p-3"
                    >
                      <AuditionForm
                        form={editForm}
                        setForm={setEditForm}
                        onSubmit={() => handleUpdate(record.id)}
                        onCancel={cancelEdit}
                        submitting={false}
                        title="오디션 기록 수정"
                        submitLabel="저장"
                      />
                    </div>
                  ) : (
                    <AuditionRow
                      key={record.id}
                      record={record}
                      onEdit={() => startEdit(record)}
                      onDelete={() =>
                        handleDelete(record.id, record.auditionName)
                      }
                      formatYearMonthDay={formatYearMonthDay}
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
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string;
  colorClass: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 ${colorClass}`}
    >
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

// ============================================================
// 오디션 행 서브컴포넌트
// ============================================================

interface AuditionRowProps {
  record: DanceAuditionRecord;
  onEdit: () => void;
  onDelete: () => void;
  formatYearMonthDay: (iso: string) => string;
}

function AuditionRow({
  record,
  onEdit,
  onDelete,
  formatYearMonthDay,
}: AuditionRowProps) {
  const colors = AUDITION_RESULT_COLORS[record.result];

  return (
    <div className="rounded-lg border bg-background hover:bg-muted/20 transition-colors p-3 space-y-2">
      {/* 헤더 행 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-xs font-semibold truncate">
            {record.auditionName}
          </span>
          <Badge
            className={`text-[10px] px-1.5 py-0 border shrink-0 ${colors.badge}`}
          >
            {AUDITION_RESULT_LABELS[record.result]}
          </Badge>
          {record.genre && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 shrink-0"
            >
              {record.genre}
            </Badge>
          )}
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
          <Building2 className="h-3 w-3" />
          {record.organizer}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatYearMonthDay(record.date)}
        </span>
        {record.prepSong && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Music2 className="h-3 w-3" />
            {record.prepSong}
          </span>
        )}
      </div>

      {/* 심사위원 피드백 */}
      {record.judgesFeedback && (
        <div className="flex items-start gap-1.5 bg-blue-50 border border-blue-100 rounded px-2 py-1.5">
          <MessageSquare className="h-3 w-3 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-blue-700 leading-relaxed">
            {record.judgesFeedback}
          </p>
        </div>
      )}

      {/* 개인 소감 */}
      {record.personalNote && (
        <div className="flex items-start gap-1.5 bg-muted/40 rounded px-2 py-1.5">
          <StickyNote className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {record.personalNote}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 오디션 폼 서브컴포넌트
// ============================================================

interface AuditionFormProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  title: string;
  submitLabel: string;
}

function AuditionForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitting,
  title,
  submitLabel,
}: AuditionFormProps) {
  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
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

      {/* 오디션명 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">오디션명 *</label>
        <Input
          placeholder="오디션 또는 공모전 이름"
          value={form.auditionName}
          onChange={(e) => setField("auditionName", e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* 주최사 / 날짜 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">주최사/주최자 *</label>
          <Input
            placeholder="주최 기관 또는 이름"
            value={form.organizer}
            onChange={(e) => setField("organizer", e.target.value)}
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

      {/* 장르 선택 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">장르 *</label>
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_AUDITION_GENRES.map((g) => (
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

      {/* 결과 선택 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">결과 *</label>
        <div className="flex flex-wrap gap-1.5">
          {AUDITION_RESULT_ORDER.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setField("result", r)}
              className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                form.result === r
                  ? `${AUDITION_RESULT_COLORS[r].badge} border-current`
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {AUDITION_RESULT_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* 준비한 곡 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">
          준비한 곡 (선택)
        </label>
        <Input
          placeholder="오디션에서 사용한 곡명"
          value={form.prepSong}
          onChange={(e) => setField("prepSong", e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* 심사위원 피드백 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">
          심사위원 피드백 (선택)
        </label>
        <Textarea
          placeholder="심사위원으로부터 받은 평가나 피드백을 기록하세요."
          value={form.judgesFeedback}
          onChange={(e) => setField("judgesFeedback", e.target.value)}
          className="min-h-[60px] text-xs resize-none"
        />
      </div>

      {/* 개인 소감 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">
          개인 소감 메모 (선택)
        </label>
        <Textarea
          placeholder="오디션을 마치며 느낀 점, 개선할 점 등을 자유롭게 기록하세요."
          value={form.personalNote}
          onChange={(e) => setField("personalNote", e.target.value)}
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
          <Trophy className="h-3 w-3 mr-1" />
          {submitting ? "처리 중..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
