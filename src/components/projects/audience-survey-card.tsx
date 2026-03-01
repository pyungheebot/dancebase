"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Star,
  BarChart2,
  Users,
  MessageSquare,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { useAudienceSurvey } from "@/hooks/use-audience-survey";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import type {
  AudienceSurveyEntry,
  AudienceSurveyQuestion,
  AudienceSurveyQuestionStat,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const QUESTION_LABELS: Record<AudienceSurveyQuestion, string> = {
  overall: "전체 만족도",
  stage: "무대 연출",
  choreography: "안무",
  music: "음악",
  costume: "의상",
  revisit: "재방문 의향",
};

const QUESTIONS: AudienceSurveyQuestion[] = [
  "overall",
  "stage",
  "choreography",
  "music",
  "costume",
  "revisit",
];

const QUESTION_COLORS: Record<AudienceSurveyQuestion, string> = {
  overall: "text-purple-600",
  stage: "text-blue-600",
  choreography: "text-pink-600",
  music: "text-orange-600",
  costume: "text-cyan-600",
  revisit: "text-green-600",
};

const SCORE_LABELS: Record<number, string> = {
  1: "매우 불만족",
  2: "불만족",
  3: "보통",
  4: "만족",
  5: "매우 만족",
};

function scoreColor(avg: number): string {
  if (avg >= 4.5) return "text-green-600";
  if (avg >= 3.5) return "text-blue-600";
  if (avg >= 2.5) return "text-yellow-600";
  return "text-red-600";
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3 w-3 ${
            n <= Math.round(value)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </span>
  );
}

// ============================================================
// 점수 입력 행
// ============================================================

function ScoreInputRow({
  question,
  avg,
  count,
  onChange,
}: {
  question: AudienceSurveyQuestion;
  avg: number;
  count: number;
  onChange: (q: AudienceSurveyQuestion, avg: number, count: number) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
      <span className={`text-xs font-medium ${QUESTION_COLORS[question]}`}>
        {QUESTION_LABELS[question]}
      </span>
      <div className="flex items-center gap-1">
        <Label className="text-[10px] text-muted-foreground w-12 text-right">
          평균점수
        </Label>
        <Input
          type="number"
          min={1}
          max={5}
          step={0.1}
          value={avg}
          onChange={(e) => onChange(question, parseFloat(e.target.value) || 1, count)}
          className="h-7 w-16 text-xs text-center"
        />
      </div>
      <div className="flex items-center gap-1">
        <Label className="text-[10px] text-muted-foreground w-10 text-right">
          응답 수
        </Label>
        <Input
          type="number"
          min={0}
          value={count}
          onChange={(e) => onChange(question, avg, parseInt(e.target.value) || 0)}
          className="h-7 w-16 text-xs text-center"
        />
      </div>
    </div>
  );
}

// ============================================================
// 폼 초기값
// ============================================================

function makeInitialStats(): AudienceSurveyQuestionStat[] {
  return QUESTIONS.map((q) => ({ question: q, avg: 3, count: 0 }));
}

// ============================================================
// 추가/수정 다이얼로그
// ============================================================

type EntryFormData = {
  title: string;
  date: string;
  responseCount: number;
  questionStats: AudienceSurveyQuestionStat[];
  freeComments: string;
  notes: string;
};

function SurveyFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  mode,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: AudienceSurveyEntry;
  onSubmit: (data: EntryFormData) => void;
  mode: "add" | "edit";
}) {
  const [form, setForm] = useState<EntryFormData>(() => ({
    title: initial?.title ?? "",
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    responseCount: initial?.responseCount ?? 0,
    questionStats: initial?.questionStats ?? makeInitialStats(),
    freeComments: initial?.freeComments.join("\n") ?? "",
    notes: initial?.notes ?? "",
  }));

  function handleStatChange(
    q: AudienceSurveyQuestion,
    avg: number,
    count: number
  ) {
    setForm((prev) => ({
      ...prev,
      questionStats: prev.questionStats.map((s) =>
        s.question === q ? { ...s, avg: Math.min(5, Math.max(1, avg)), count } : s
      ),
    }));
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!form.date) {
      toast.error("수집 날짜를 선택해주세요.");
      return;
    }
    if (form.responseCount < 0) {
      toast.error("응답 수는 0 이상이어야 합니다.");
      return;
    }
    onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {mode === "add" ? "설문 결과 추가" : "설문 결과 수정"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">제목</Label>
              <Input
                placeholder="예: 1회차 공연 설문"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">수집 날짜</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">총 응답 수</Label>
              <Input
                type="number"
                min={0}
                value={form.responseCount}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    responseCount: parseInt(e.target.value) || 0,
                  }))
                }
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 항목별 점수 */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">항목별 평균 점수 (1~5)</Label>
            <div className="space-y-2 rounded-md border p-3">
              {form.questionStats.map((stat) => (
                <ScoreInputRow
                  key={stat.question}
                  question={stat.question}
                  avg={stat.avg}
                  count={stat.count}
                  onChange={handleStatChange}
                />
              ))}
            </div>
          </div>

          {/* 자유 의견 */}
          <div className="space-y-1">
            <Label className="text-xs">자유 의견 (줄바꿈으로 구분)</Label>
            <Textarea
              placeholder={"공연이 정말 훌륭했어요!\n다음에도 꼭 오고 싶습니다."}
              value={form.freeComments}
              onChange={(e) =>
                setForm((p) => ({ ...p, freeComments: e.target.value }))
              }
              className="text-xs resize-none"
              rows={4}
            />
          </div>

          {/* 비고 */}
          <div className="space-y-1">
            <Label className="text-xs">비고 (선택)</Label>
            <Input
              placeholder="추가 메모"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 엔트리 행
// ============================================================

function SurveyEntryRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: AudienceSurveyEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  const overallStat = entry.questionStats.find((s) => s.question === "overall");
  const overallAvg = overallStat?.avg ?? 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-md border bg-card hover:bg-accent/30 transition-colors">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium truncate">{entry.title}</span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 shrink-0"
                >
                  {entry.date}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 shrink-0 bg-blue-50 text-blue-700 border-blue-200"
                >
                  <Users className="h-2.5 w-2.5 mr-0.5" />
                  {entry.responseCount}명
                </Badge>
                {overallAvg > 0 && (
                  <span className={`text-xs font-semibold ${scoreColor(overallAvg)}`}>
                    {overallAvg.toFixed(1)}점
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              {open ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t pt-2">
            {/* 항목별 점수 */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <BarChart2 className="h-3 w-3" />
                항목별 평균 점수
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {QUESTIONS.map((q) => {
                  const stat = entry.questionStats.find((s) => s.question === q);
                  if (!stat) return null;
                  return (
                    <div key={q} className="flex items-center justify-between">
                      <span className={`text-[10px] ${QUESTION_COLORS[q]}`}>
                        {QUESTION_LABELS[q]}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <StarRating value={stat.avg} />
                        <span className={`text-[10px] font-semibold w-6 text-right ${scoreColor(stat.avg)}`}>
                          {stat.avg.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({stat.count})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 자유 의견 */}
            {entry.freeComments.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  자유 의견 ({entry.freeComments.length}건)
                </p>
                <ul className="space-y-1">
                  {entry.freeComments.map((comment, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-muted-foreground bg-muted/40 rounded px-2 py-1 leading-relaxed"
                    >
                      {comment}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 비고 */}
            {entry.notes && (
              <p className="text-[11px] text-muted-foreground italic">
                비고: {entry.notes}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

export function AudienceSurveyCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const { entries, loading, addEntry, updateEntry, deleteEntry, stats } =
    useAudienceSurvey(groupId, projectId);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AudienceSurveyEntry | null>(null);
  const deleteConfirm = useDeleteConfirm<string>();
  const [isOpen, setIsOpen] = useState(true);

  function handleAdd(data: EntryFormData) {
    const freeComments = data.freeComments
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
    addEntry({
      title: data.title,
      date: data.date,
      responseCount: data.responseCount,
      questionStats: data.questionStats,
      freeComments,
      notes: data.notes || undefined,
    });
    toast.success("설문 결과가 추가되었습니다.");
    setAddOpen(false);
  }

  function handleEdit(data: EntryFormData) {
    if (!editTarget) return;
    const freeComments = data.freeComments
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
    const ok = updateEntry(editTarget.id, {
      title: data.title,
      date: data.date,
      responseCount: data.responseCount,
      questionStats: data.questionStats,
      freeComments,
      notes: data.notes || undefined,
    });
    if (ok) {
      toast.success("설문 결과가 수정되었습니다.");
    } else {
      toast.error("수정에 실패했습니다.");
    }
    setEditTarget(null);
  }

  function handleDelete() {
    const id = deleteConfirm.confirm();
    if (!id) return;
    const ok = deleteEntry(id);
    if (ok) {
      toast.success("설문 결과가 삭제되었습니다.");
    } else {
      toast.error("삭제에 실패했습니다.");
    }
  }

  return (
    <>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer select-none">
                  <ClipboardList className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-sm font-semibold">
                    관객 설문조사
                  </CardTitle>
                  {entries.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200"
                    >
                      {entries.length}건
                    </Badge>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                결과 추가
              </Button>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {/* 통계 요약 */}
              {entries.length > 0 && (
                <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/30 p-3">
                  <div className="text-center space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">총 엔트리</p>
                    <p className="text-sm font-bold text-purple-600">
                      {stats.totalEntries}
                    </p>
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">총 응답 수</p>
                    <p className="text-sm font-bold text-blue-600">
                      {stats.totalResponses}
                    </p>
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">전체 만족도</p>
                    <p className={`text-sm font-bold ${scoreColor(stats.overallAvg)}`}>
                      {stats.overallAvg > 0 ? `${stats.overallAvg.toFixed(1)}점` : "-"}
                    </p>
                  </div>
                </div>
              )}

              {/* 항목별 종합 평균 */}
              {entries.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    항목별 종합 평균
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {QUESTIONS.map((q) => {
                      const avg = stats.questionAvgMap[q];
                      if (avg === undefined) return null;
                      return (
                        <div key={q} className="flex items-center justify-between">
                          <span className={`text-[10px] ${QUESTION_COLORS[q]}`}>
                            {QUESTION_LABELS[q]}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <StarRating value={avg} />
                            <span
                              className={`text-[10px] font-semibold w-6 text-right ${scoreColor(avg)}`}
                            >
                              {avg.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 엔트리 목록 */}
              {loading ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  불러오는 중...
                </p>
              ) : entries.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  등록된 설문 결과가 없습니다.
                  <br />
                  상단 &quot;결과 추가&quot; 버튼으로 추가해보세요.
                </p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <SurveyEntryRow
                      key={entry.id}
                      entry={entry}
                      onEdit={() => setEditTarget(entry)}
                      onDelete={() => deleteConfirm.request(entry.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 추가 다이얼로그 */}
      <SurveyFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="add"
        onSubmit={handleAdd}
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <SurveyFormDialog
          open={!!editTarget}
          onOpenChange={(v) => { if (!v) setEditTarget(null); }}
          mode="edit"
          initial={editTarget}
          onSubmit={handleEdit}
        />
      )}

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="설문 결과 삭제"
        description="이 설문 결과를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
