"use client";

// ============================================================
// 댄스 수업 수강 기록 카드 (메인 컴포넌트)
// ============================================================

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useDanceClassLog } from "@/hooks/use-dance-class-log";
import type {
  DanceClassLogEntry,
  DanceClassLogLevel,
  DanceClassLogSource,
} from "@/types";

// 서브컴포넌트 임포트
import {
  defaultForm,
  validateClassLogForm,
  parseSkillsInput,
  type FormState,
} from "./dance-class-log-types";
import { ClassLogSummaryStats, ClassLogLevelChart } from "./dance-class-log-stats";
import { ClassLogFilterBar } from "./dance-class-log-filter";
import { ClassLogRow } from "./dance-class-log-row";
import { ClassLogForm } from "./dance-class-log-form";

// ──────────────────────────────────────────
// Props
// ──────────────────────────────────────────

interface DanceClassLogCardProps {
  memberId: string;
}

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

  // 통계 메모이제이션
  const stats = useMemo(() => getStats(), [getStats]);

  // ── 카드 열림/닫힘, 추가 폼 표시 상태 ──
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const { pending: submitting, execute } = useAsyncAction();

  // ── 추가 폼 상태 ──
  const [form, setForm] = useState<FormState>(defaultForm);

  // ── 편집 상태 ──
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(defaultForm);

  // ── 필터 상태 ──
  const [filterGenre, setFilterGenre] = useState("all");
  const [filterSource, setFilterSource] = useState<DanceClassLogSource | "all">("all");
  const [filterLevel, setFilterLevel] = useState<DanceClassLogLevel | "all">("all");

  const totalCount = entries.length;

  // ──────────────────────────────────────────
  // 필터된 목록 (날짜 역순)
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

  // ──────────────────────────────────────────
  // 추가 폼 핸들러
  // ──────────────────────────────────────────

  function resetForm() {
    setForm(defaultForm);
  }

  async function handleSubmit() {
    const error = validateClassLogForm(form);
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
        skills: parseSkillsInput(form.skillsInput),
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
    const error = validateClassLogForm(editForm);
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
        durationMin: editForm.durationMin ? Number(editForm.durationMin) : undefined,
        source: editForm.source as DanceClassLogSource,
        genre: finalGenre,
        level: editForm.level as DanceClassLogLevel,
        summary: editForm.summary.trim() || undefined,
        skills: parseSkillsInput(editForm.skillsInput),
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
  // JSX
  // ──────────────────────────────────────────

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            {/* 카드 헤더: 타이틀, 건수 배지, 수업 추가 버튼, 토글 아이콘 */}
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              aria-expanded={open}
              aria-label="댄스 수업 수강 기록"
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-teal-500" aria-hidden="true" />
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
                  aria-label="새 수업 기록 추가"
                  onClick={(e) => {
                    e.stopPropagation();
                    // 닫혀 있으면 먼저 열기
                    if (!open) setOpen(true);
                    setFormOpen((prev) => !prev);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  수업 추가
                </Button>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* 신규 수업 추가 폼 */}
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

            {/* 통계 요약 배지 */}
            {totalCount > 0 && (
              <ClassLogSummaryStats totalCount={totalCount} stats={stats} />
            )}

            {/* 레벨별 분포 바 차트 */}
            {totalCount > 0 && <ClassLogLevelChart stats={stats} />}

            {/* 필터 바 */}
            {totalCount > 0 && (
              <ClassLogFilterBar
                filterGenre={filterGenre}
                filterSource={filterSource}
                filterLevel={filterLevel}
                onGenreChange={setFilterGenre}
                onSourceChange={setFilterSource}
                onLevelChange={setFilterLevel}
                stats={stats}
              />
            )}

            {/* 수업 기록 목록 */}
            {loading ? (
              // 로딩 스켈레톤
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-md" />
                ))}
              </div>
            ) : totalCount === 0 ? (
              // 빈 상태 안내
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-30" aria-hidden="true" />
                <p className="text-xs">수강한 댄스 수업 기록이 없습니다.</p>
                <p className="text-[11px] mt-0.5">위 버튼으로 첫 수업을 기록하세요.</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              // 필터 결과 없음
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-xs">필터에 맞는 수업 기록이 없습니다.</p>
              </div>
            ) : (
              // 수업 기록 리스트
              <div className="space-y-2" role="list" aria-label="수업 기록 목록">
                {filteredEntries.map((entry) =>
                  editingId === entry.id ? (
                    // 편집 모드: 해당 행 대신 폼 표시
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
                    // 일반 모드: 수업 행 카드
                    <ClassLogRow
                      key={entry.id}
                      entry={entry}
                      onEdit={() => startEdit(entry)}
                      onDelete={() => handleDelete(entry.id, entry.className)}
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
