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
  FileText,
  Star,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Users,
  DollarSign,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  usePostShowReport,
  makeDefaultSectionScores,
  POST_SHOW_SECTIONS,
} from "@/hooks/use-post-show-report";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import type {
  PostShowReportEntry,
  PostShowReportSection,
  PostShowReportSectionScore,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const SECTION_LABELS: Record<PostShowReportSection, string> = {
  choreography: "안무",
  staging: "무대연출",
  sound: "음향",
  lighting: "조명",
  costume: "의상",
  audience_reaction: "관객반응",
};

const SECTION_COLORS: Record<PostShowReportSection, string> = {
  choreography: "text-pink-600",
  staging: "text-blue-600",
  sound: "text-orange-600",
  lighting: "text-yellow-600",
  costume: "text-purple-600",
  audience_reaction: "text-green-600",
};

function scoreColor(score: number): string {
  if (score >= 4.5) return "text-green-600";
  if (score >= 3.5) return "text-blue-600";
  if (score >= 2.5) return "text-yellow-600";
  return "text-red-600";
}

function StarDisplay({ value }: { value: number }) {
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

function formatRevenue(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

// ============================================================
// 섹션 점수 입력 행
// ============================================================

function SectionScoreRow({
  sectionScore,
  onChange,
}: {
  sectionScore: PostShowReportSectionScore;
  onChange: (updated: PostShowReportSectionScore) => void;
}) {
  return (
    <div className="space-y-1.5 rounded-md border p-2.5">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${SECTION_COLORS[sectionScore.section]}`}>
          {SECTION_LABELS[sectionScore.section]}
        </span>
        <div className="flex items-center gap-1.5">
          <Label className="text-[10px] text-muted-foreground">점수</Label>
          <Input
            type="number"
            min={1}
            max={5}
            step={1}
            value={sectionScore.score}
            onChange={(e) =>
              onChange({
                ...sectionScore,
                score: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)),
              })
            }
            className="h-6 w-12 text-xs text-center"
          />
          <span className="text-[10px] text-muted-foreground">/5</span>
        </div>
      </div>
      <Input
        placeholder="코멘트 (선택)"
        value={sectionScore.comment}
        onChange={(e) => onChange({ ...sectionScore, comment: e.target.value })}
        className="h-7 text-xs"
      />
    </div>
  );
}

// ============================================================
// 폼 데이터 타입
// ============================================================

type ReportFormData = {
  title: string;
  performanceDate: string;
  overallReview: string;
  sectionScores: PostShowReportSectionScore[];
  highlights: string;
  improvements: string;
  nextSuggestions: string;
  audienceCount: string;
  revenue: string;
  author: string;
  notes: string;
};

function makeInitialForm(initial?: PostShowReportEntry): ReportFormData {
  return {
    title: initial?.title ?? "",
    performanceDate: initial?.performanceDate ?? new Date().toISOString().slice(0, 10),
    overallReview: initial?.overallReview ?? "",
    sectionScores: initial?.sectionScores ?? makeDefaultSectionScores(),
    highlights: initial?.highlights.join("\n") ?? "",
    improvements: initial?.improvements.join("\n") ?? "",
    nextSuggestions: initial?.nextSuggestions.join("\n") ?? "",
    audienceCount: initial?.audienceCount?.toString() ?? "",
    revenue: initial?.revenue?.toString() ?? "",
    author: initial?.author ?? "",
    notes: initial?.notes ?? "",
  };
}

// ============================================================
// 추가/수정 다이얼로그
// ============================================================

function ReportFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  mode,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: PostShowReportEntry;
  onSubmit: (data: ReportFormData) => void;
  mode: "add" | "edit";
}) {
  const [form, setForm] = useState<ReportFormData>(() => makeInitialForm(initial));

  function handleSectionChange(updated: PostShowReportSectionScore) {
    setForm((prev) => ({
      ...prev,
      sectionScores: prev.sectionScores.map((s) =>
        s.section === updated.section ? updated : s
      ),
    }));
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error(TOAST.POST_SHOW_REPORT.TITLE_REQUIRED);
      return;
    }
    if (!form.performanceDate) {
      toast.error(TOAST.POST_SHOW_REPORT.DATE_REQUIRED);
      return;
    }
    if (!form.overallReview.trim()) {
      toast.error(TOAST.POST_SHOW_REPORT.SUMMARY_REQUIRED);
      return;
    }
    if (!form.author.trim()) {
      toast.error(TOAST.POST_SHOW_REPORT.AUTHOR_REQUIRED);
      return;
    }
    const audienceCountNum = form.audienceCount ? parseInt(form.audienceCount) : undefined;
    if (audienceCountNum !== undefined && (isNaN(audienceCountNum) || audienceCountNum < 0)) {
      toast.error(TOAST.POST_SHOW_REPORT.AUDIENCE_REQUIRED);
      return;
    }
    const revenueNum = form.revenue ? parseInt(form.revenue) : undefined;
    if (revenueNum !== undefined && (isNaN(revenueNum) || revenueNum < 0)) {
      toast.error(TOAST.POST_SHOW_REPORT.REVENUE_REQUIRED);
      return;
    }
    onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {mode === "add" ? "사후 분석 보고서 작성" : "사후 분석 보고서 수정"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 기본 정보 */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">보고서 제목</Label>
              <Input
                placeholder="예: 2024 봄 정기공연 사후 분석"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">공연 날짜</Label>
                <Input
                  type="date"
                  value={form.performanceDate}
                  onChange={(e) => setForm((p) => ({ ...p, performanceDate: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">작성자</Label>
                <Input
                  placeholder="이름 입력"
                  value={form.author}
                  onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* 총평 */}
          <div className="space-y-1">
            <Label className="text-xs">총평</Label>
            <Textarea
              placeholder="공연 전반에 대한 종합 평가를 작성해주세요."
              value={form.overallReview}
              onChange={(e) => setForm((p) => ({ ...p, overallReview: e.target.value }))}
              className="text-xs resize-none"
              rows={3}
            />
          </div>

          {/* 섹션별 평가 */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">섹션별 평가 (1~5점)</Label>
            <div className="space-y-2">
              {form.sectionScores.map((ss) => (
                <SectionScoreRow
                  key={ss.section}
                  sectionScore={ss}
                  onChange={handleSectionChange}
                />
              ))}
            </div>
          </div>

          {/* 잘된 점 */}
          <div className="space-y-1">
            <Label className="text-xs text-green-700">잘된 점 (줄바꿈으로 구분)</Label>
            <Textarea
              placeholder={"팀원 호흡이 잘 맞았다\n의상이 무대와 잘 어울렸다"}
              value={form.highlights}
              onChange={(e) => setForm((p) => ({ ...p, highlights: e.target.value }))}
              className="text-xs resize-none"
              rows={3}
            />
          </div>

          {/* 개선할 점 */}
          <div className="space-y-1">
            <Label className="text-xs text-red-700">개선할 점 (줄바꿈으로 구분)</Label>
            <Textarea
              placeholder={"음향 볼륨 밸런스 조정 필요\n대형 전환 시 간격 조정 필요"}
              value={form.improvements}
              onChange={(e) => setForm((p) => ({ ...p, improvements: e.target.value }))}
              className="text-xs resize-none"
              rows={3}
            />
          </div>

          {/* 다음 공연 제안 */}
          <div className="space-y-1">
            <Label className="text-xs text-blue-700">다음 공연 제안 (줄바꿈으로 구분)</Label>
            <Textarea
              placeholder={"무대 리허설 횟수 늘리기\n의상 피팅 일정 앞당기기"}
              value={form.nextSuggestions}
              onChange={(e) => setForm((p) => ({ ...p, nextSuggestions: e.target.value }))}
              className="text-xs resize-none"
              rows={3}
            />
          </div>

          {/* 관객 수 & 매출 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">관객 수 (선택)</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.audienceCount}
                onChange={(e) => setForm((p) => ({ ...p, audienceCount: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">매출 (원, 선택)</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.revenue}
                onChange={(e) => setForm((p) => ({ ...p, revenue: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
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
            {mode === "add" ? "작성" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 보고서 행
// ============================================================

function ReportEntryRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: PostShowReportEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  const avgScore =
    entry.sectionScores.length > 0
      ? Math.round(
          (entry.sectionScores.reduce((sum, s) => sum + s.score, 0) /
            entry.sectionScores.length) *
            10
        ) / 10
      : 0;

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
                  {entry.performanceDate}
                </Badge>
                {entry.audienceCount !== undefined && entry.audienceCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 shrink-0 bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <Users className="h-2.5 w-2.5 mr-0.5" />
                    {entry.audienceCount.toLocaleString()}명
                  </Badge>
                )}
                {avgScore > 0 && (
                  <span className={`text-xs font-semibold ${scoreColor(avgScore)}`}>
                    {avgScore.toFixed(1)}점
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                작성자: {entry.author}
              </p>
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
            {/* 총평 */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground">총평</p>
              <p className="text-xs leading-relaxed bg-muted/30 rounded px-2 py-1.5">
                {entry.overallReview}
              </p>
            </div>

            {/* 섹션별 평가 */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <BarChart2 className="h-3 w-3" />
                섹션별 평가
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {POST_SHOW_SECTIONS.map((section) => {
                  const ss = entry.sectionScores.find((s) => s.section === section);
                  if (!ss) return null;
                  return (
                    <div key={section} className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] ${SECTION_COLORS[section]}`}>
                          {SECTION_LABELS[section]}
                        </span>
                        <div className="flex items-center gap-1">
                          <StarDisplay value={ss.score} />
                          <span className={`text-[10px] font-semibold w-4 text-right ${scoreColor(ss.score)}`}>
                            {ss.score}
                          </span>
                        </div>
                      </div>
                      {ss.comment && (
                        <p className="text-[10px] text-muted-foreground pl-1">
                          {ss.comment}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 잘된 점 */}
            {entry.highlights.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-green-700 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  잘된 점 ({entry.highlights.length}개)
                </p>
                <ul className="space-y-0.5">
                  {entry.highlights.map((item, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-muted-foreground bg-green-50 border border-green-100 rounded px-2 py-1 leading-relaxed"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 개선할 점 */}
            {entry.improvements.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-red-700 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  개선할 점 ({entry.improvements.length}개)
                </p>
                <ul className="space-y-0.5">
                  {entry.improvements.map((item, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-muted-foreground bg-red-50 border border-red-100 rounded px-2 py-1 leading-relaxed"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 다음 공연 제안 */}
            {entry.nextSuggestions.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-blue-700 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  다음 공연 제안 ({entry.nextSuggestions.length}개)
                </p>
                <ul className="space-y-0.5">
                  {entry.nextSuggestions.map((item, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-muted-foreground bg-blue-50 border border-blue-100 rounded px-2 py-1 leading-relaxed"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 관객 수 / 매출 */}
            {(entry.audienceCount !== undefined || entry.revenue !== undefined) && (
              <div className="flex items-center gap-4">
                {entry.audienceCount !== undefined && entry.audienceCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-blue-500" />
                    <span className="text-[11px] text-muted-foreground">
                      관객 수: <span className="font-medium text-blue-600">{entry.audienceCount.toLocaleString()}명</span>
                    </span>
                  </div>
                )}
                {entry.revenue !== undefined && entry.revenue > 0 && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-green-500" />
                    <span className="text-[11px] text-muted-foreground">
                      매출: <span className="font-medium text-green-600">{formatRevenue(entry.revenue)}</span>
                    </span>
                  </div>
                )}
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

export function PostShowReportCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const { entries, loading, addEntry, updateEntry, deleteEntry, stats } =
    usePostShowReport(groupId, projectId);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PostShowReportEntry | null>(null);
  const deleteConfirm = useDeleteConfirm<string>();
  const [isOpen, setIsOpen] = useState(true);

  function handleAdd(data: ReportFormData) {
    const toList = (text: string) =>
      text.split("\n").map((s) => s.trim()).filter(Boolean);

    addEntry({
      title: data.title,
      performanceDate: data.performanceDate,
      overallReview: data.overallReview,
      sectionScores: data.sectionScores,
      highlights: toList(data.highlights),
      improvements: toList(data.improvements),
      nextSuggestions: toList(data.nextSuggestions),
      audienceCount: data.audienceCount ? parseInt(data.audienceCount) : undefined,
      revenue: data.revenue ? parseInt(data.revenue) : undefined,
      author: data.author,
      notes: data.notes || undefined,
    });
    toast.success(TOAST.POST_SHOW_REPORT.CREATED);
    setAddOpen(false);
  }

  function handleEdit(data: ReportFormData) {
    if (!editTarget) return;
    const toList = (text: string) =>
      text.split("\n").map((s) => s.trim()).filter(Boolean);

    const ok = updateEntry(editTarget.id, {
      title: data.title,
      performanceDate: data.performanceDate,
      overallReview: data.overallReview,
      sectionScores: data.sectionScores,
      highlights: toList(data.highlights),
      improvements: toList(data.improvements),
      nextSuggestions: toList(data.nextSuggestions),
      audienceCount: data.audienceCount ? parseInt(data.audienceCount) : undefined,
      revenue: data.revenue ? parseInt(data.revenue) : undefined,
      author: data.author,
      notes: data.notes || undefined,
    });
    if (ok) {
      toast.success(TOAST.POST_SHOW_REPORT.UPDATED);
    } else {
      toast.error(TOAST.UPDATE_ERROR);
    }
    setEditTarget(null);
  }

  function handleDelete() {
    const id = deleteConfirm.confirm();
    if (!id) return;
    const ok = deleteEntry(id);
    if (ok) {
      toast.success(TOAST.POST_SHOW_REPORT.DELETED);
    } else {
      toast.error(TOAST.DELETE_ERROR);
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
                  <FileText className="h-4 w-4 text-indigo-500" />
                  <CardTitle className="text-sm font-semibold">
                    공연 사후 분석 보고서
                  </CardTitle>
                  {entries.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200"
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
                보고서 작성
              </Button>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {/* 통계 요약 */}
              {entries.length > 0 && (
                <div className="grid grid-cols-4 gap-2 rounded-md bg-muted/30 p-3">
                  <div className="text-center space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">보고서</p>
                    <p className="text-sm font-bold text-indigo-600">
                      {stats.totalReports}건
                    </p>
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">종합 점수</p>
                    <p className={`text-sm font-bold ${scoreColor(stats.overallAvg)}`}>
                      {stats.overallAvg > 0 ? `${stats.overallAvg.toFixed(1)}점` : "-"}
                    </p>
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">총 관객</p>
                    <p className="text-sm font-bold text-blue-600">
                      {stats.totalAudience > 0
                        ? `${stats.totalAudience.toLocaleString()}명`
                        : "-"}
                    </p>
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">총 매출</p>
                    <p className="text-sm font-bold text-green-600">
                      {stats.totalRevenue > 0
                        ? formatRevenue(stats.totalRevenue)
                        : "-"}
                    </p>
                  </div>
                </div>
              )}

              {/* 섹션별 종합 평균 */}
              {entries.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    섹션별 종합 평균
                  </p>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                    {POST_SHOW_SECTIONS.map((section) => {
                      const avg = stats.sectionAvgMap[section];
                      if (avg === undefined) return null;
                      return (
                        <div key={section} className="flex items-center justify-between">
                          <span className={`text-[10px] ${SECTION_COLORS[section]}`}>
                            {SECTION_LABELS[section]}
                          </span>
                          <div className="flex items-center gap-1">
                            <StarDisplay value={avg} />
                            <span className={`text-[10px] font-semibold w-5 text-right ${scoreColor(avg)}`}>
                              {avg.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 보고서 목록 */}
              {loading ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  불러오는 중...
                </p>
              ) : entries.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  작성된 사후 분석 보고서가 없습니다.
                  <br />
                  상단 &quot;보고서 작성&quot; 버튼으로 추가해보세요.
                </p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <ReportEntryRow
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

      {/* 작성 다이얼로그 */}
      <ReportFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="add"
        onSubmit={handleAdd}
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <ReportFormDialog
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          mode="edit"
          initial={editTarget}
          onSubmit={handleEdit}
        />
      )}

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="보고서 삭제"
        description="이 사후 분석 보고서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
