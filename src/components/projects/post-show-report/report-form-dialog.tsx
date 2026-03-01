"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { PostShowReportEntry, PostShowReportSectionScore } from "@/types";
import { SectionScoreRow } from "./section-score-row";
import { makeInitialForm, type ReportFormData } from "./types";

/**
 * 보고서 추가/수정 다이얼로그
 *
 * 접근성: DialogTitle, fieldset/legend, htmlFor/id 매칭,
 *         aria-required, aria-describedby
 */
export function ReportFormDialog({
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
  const [form, setForm] = useState<ReportFormData>(() =>
    makeInitialForm(initial)
  );

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
    const audienceCountNum = form.audienceCount
      ? parseInt(form.audienceCount)
      : undefined;
    if (
      audienceCountNum !== undefined &&
      (isNaN(audienceCountNum) || audienceCountNum < 0)
    ) {
      toast.error(TOAST.POST_SHOW_REPORT.AUDIENCE_REQUIRED);
      return;
    }
    const revenueNum = form.revenue ? parseInt(form.revenue) : undefined;
    if (
      revenueNum !== undefined &&
      (isNaN(revenueNum) || revenueNum < 0)
    ) {
      toast.error(TOAST.POST_SHOW_REPORT.REVENUE_REQUIRED);
      return;
    }
    onSubmit(form);
  }

  const dialogId = mode === "add" ? "report-add-dialog" : "report-edit-dialog";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        aria-labelledby={`${dialogId}-title`}
      >
        <DialogHeader>
          <DialogTitle id={`${dialogId}-title`} className="text-sm">
            {mode === "add"
              ? "사후 분석 보고서 작성"
              : "사후 분석 보고서 수정"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 기본 정보 */}
          <fieldset className="space-y-3 border-0 p-0 m-0">
            <legend className="sr-only">기본 정보</legend>

            <div className="space-y-1">
              <Label htmlFor={`${dialogId}-title-input`} className="text-xs">
                보고서 제목{" "}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </Label>
              <Input
                id={`${dialogId}-title-input`}
                placeholder="예: 2024 봄 정기공연 사후 분석"
                value={form.title}
                aria-required="true"
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label
                  htmlFor={`${dialogId}-date`}
                  className="text-xs"
                >
                  공연 날짜{" "}
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </Label>
                <Input
                  id={`${dialogId}-date`}
                  type="date"
                  value={form.performanceDate}
                  aria-required="true"
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      performanceDate: e.target.value,
                    }))
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${dialogId}-author`} className="text-xs">
                  작성자{" "}
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </Label>
                <Input
                  id={`${dialogId}-author`}
                  placeholder="이름 입력"
                  value={form.author}
                  aria-required="true"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, author: e.target.value }))
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </fieldset>

          {/* 총평 */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-review`} className="text-xs">
              총평{" "}
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            </Label>
            <Textarea
              id={`${dialogId}-review`}
              placeholder="공연 전반에 대한 종합 평가를 작성해주세요."
              value={form.overallReview}
              aria-required="true"
              onChange={(e) =>
                setForm((p) => ({ ...p, overallReview: e.target.value }))
              }
              className="text-xs resize-none"
              rows={3}
            />
          </div>

          {/* 섹션별 평가 */}
          <fieldset className="space-y-2 border-0 p-0 m-0">
            <legend className="text-xs font-semibold">
              섹션별 평가 (1~5점)
            </legend>
            <div className="space-y-2">
              {form.sectionScores.map((ss) => (
                <SectionScoreRow
                  key={ss.section}
                  sectionScore={ss}
                  onChange={handleSectionChange}
                />
              ))}
            </div>
          </fieldset>

          {/* 잘된 점 */}
          <div className="space-y-1">
            <Label
              htmlFor={`${dialogId}-highlights`}
              className="text-xs text-green-700"
            >
              잘된 점 (줄바꿈으로 구분)
            </Label>
            <Textarea
              id={`${dialogId}-highlights`}
              placeholder={"팀원 호흡이 잘 맞았다\n의상이 무대와 잘 어울렸다"}
              value={form.highlights}
              aria-label="잘된 점 목록, 줄바꿈으로 항목 구분"
              onChange={(e) =>
                setForm((p) => ({ ...p, highlights: e.target.value }))
              }
              className="text-xs resize-none"
              rows={3}
            />
          </div>

          {/* 개선할 점 */}
          <div className="space-y-1">
            <Label
              htmlFor={`${dialogId}-improvements`}
              className="text-xs text-red-700"
            >
              개선할 점 (줄바꿈으로 구분)
            </Label>
            <Textarea
              id={`${dialogId}-improvements`}
              placeholder={
                "음향 볼륨 밸런스 조정 필요\n대형 전환 시 간격 조정 필요"
              }
              value={form.improvements}
              aria-label="개선할 점 목록, 줄바꿈으로 항목 구분"
              onChange={(e) =>
                setForm((p) => ({ ...p, improvements: e.target.value }))
              }
              className="text-xs resize-none"
              rows={3}
            />
          </div>

          {/* 다음 공연 제안 */}
          <div className="space-y-1">
            <Label
              htmlFor={`${dialogId}-suggestions`}
              className="text-xs text-blue-700"
            >
              다음 공연 제안 (줄바꿈으로 구분)
            </Label>
            <Textarea
              id={`${dialogId}-suggestions`}
              placeholder={"무대 리허설 횟수 늘리기\n의상 피팅 일정 앞당기기"}
              value={form.nextSuggestions}
              aria-label="다음 공연 제안 목록, 줄바꿈으로 항목 구분"
              onChange={(e) =>
                setForm((p) => ({ ...p, nextSuggestions: e.target.value }))
              }
              className="text-xs resize-none"
              rows={3}
            />
          </div>

          {/* 관객 수 & 매출 */}
          <fieldset className="grid grid-cols-2 gap-3 border-0 p-0 m-0">
            <legend className="sr-only">관객 수 및 매출 (선택)</legend>
            <div className="space-y-1">
              <Label
                htmlFor={`${dialogId}-audience`}
                className="text-xs"
              >
                관객 수 (선택)
              </Label>
              <Input
                id={`${dialogId}-audience`}
                type="number"
                min={0}
                placeholder="0"
                value={form.audienceCount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, audienceCount: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${dialogId}-revenue`} className="text-xs">
                매출 (원, 선택)
              </Label>
              <Input
                id={`${dialogId}-revenue`}
                type="number"
                min={0}
                placeholder="0"
                value={form.revenue}
                onChange={(e) =>
                  setForm((p) => ({ ...p, revenue: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
          </fieldset>

          {/* 비고 */}
          <div className="space-y-1">
            <Label htmlFor={`${dialogId}-notes`} className="text-xs">
              비고 (선택)
            </Label>
            <Input
              id={`${dialogId}-notes`}
              placeholder="추가 메모"
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
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
