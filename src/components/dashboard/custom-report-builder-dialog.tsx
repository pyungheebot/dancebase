"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BarChart2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Trash2,
  Eye,
  FileBarChart,
} from "lucide-react";
import {
  useCustomReportBuilder,
  REPORT_METRIC_META,
  REPORT_PERIOD_LABELS,
} from "@/hooks/use-custom-report-builder";
import type { ReportMetricType, ReportPeriod, ReportMetricValue } from "@/types";

const ALL_METRICS: ReportMetricType[] = [
  "attendance_rate",
  "total_attendance",
  "post_count",
  "comment_count",
  "member_count",
  "new_member_count",
  "rsvp_rate",
];

const ALL_PERIODS: ReportPeriod[] = ["7d", "30d", "90d", "all"];

type Step = 1 | 2 | 3;

function MetricResultCard({ item }: { item: ReportMetricValue }) {
  const displayValue =
    item.unit === "%" ? `${item.value}%` : `${item.value.toLocaleString()}${item.unit}`;
  return (
    <div className="rounded border bg-muted/30 px-3 py-2">
      <p className="text-[10px] text-muted-foreground mb-0.5">{item.label}</p>
      <p className="text-lg font-bold tabular-nums">{displayValue}</p>
    </div>
  );
}

function MetricResultSkeleton() {
  return (
    <div className="rounded border bg-muted/30 px-3 py-2">
      <Skeleton className="h-2.5 w-16 mb-1.5" />
      <Skeleton className="h-6 w-12" />
    </div>
  );
}

export function CustomReportBuilderDialog({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);

  // 입력 상태
  const [reportName, setReportName] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState<ReportMetricType[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("30d");

  // 미리보기 결과
  const [previewResults, setPreviewResults] = useState<ReportMetricValue[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 저장된 리포트 보기
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);
  const [viewingResults, setViewingResults] = useState<ReportMetricValue[] | null>(null);
  const [viewingLoading, setViewingLoading] = useState(false);

  const {
    reports,
    computing,
    saveReport,
    deleteReport,
    computeReport,
    computeSavedReport,
    canSave,
    maxReports,
  } = useCustomReportBuilder(groupId);

  function resetForm() {
    setStep(1);
    setReportName("");
    setSelectedMetrics([]);
    setSelectedPeriod("30d");
    setPreviewResults(null);
    setPreviewLoading(false);
    setViewingReportId(null);
    setViewingResults(null);
  }

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) resetForm();
  }

  function toggleMetric(metric: ReportMetricType) {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  }

  async function handlePreview() {
    if (selectedMetrics.length < 2) {
      toast.error("지표를 2개 이상 선택해주세요.");
      return;
    }
    setPreviewLoading(true);
    setPreviewResults(null);
    try {
      const results = await computeReport(selectedMetrics, selectedPeriod);
      setPreviewResults(results);
    } catch {
      toast.error("지표 계산에 실패했습니다.");
    } finally {
      setPreviewLoading(false);
    }
  }

  function handleNextStep() {
    if (step === 1) {
      if (!reportName.trim()) {
        toast.error("리포트 이름을 입력해주세요.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedMetrics.length < 2) {
        toast.error("지표를 2개 이상 선택해주세요.");
        return;
      }
      setStep(3);
    }
  }

  async function handleSave() {
    if (!reportName.trim()) {
      toast.error("리포트 이름을 입력해주세요.");
      return;
    }
    if (selectedMetrics.length < 2) {
      toast.error("지표를 2개 이상 선택해주세요.");
      return;
    }

    const result = saveReport({
      name: reportName.trim(),
      metrics: selectedMetrics,
      period: selectedPeriod,
    });

    if (!result.success) {
      toast.error(result.error ?? "저장에 실패했습니다.");
      return;
    }

    toast.success("리포트가 저장되었습니다.");
    resetForm();
  }

  async function handleViewReport(reportId: string) {
    if (viewingReportId === reportId) {
      setViewingReportId(null);
      setViewingResults(null);
      return;
    }
    setViewingReportId(reportId);
    setViewingResults(null);
    setViewingLoading(true);
    try {
      const results = await computeSavedReport(reportId);
      setViewingResults(results);
    } catch {
      toast.error("리포트 조회에 실패했습니다.");
      setViewingReportId(null);
    } finally {
      setViewingLoading(false);
    }
  }

  function handleDeleteReport(reportId: string) {
    deleteReport(reportId);
    if (viewingReportId === reportId) {
      setViewingReportId(null);
      setViewingResults(null);
    }
    toast.success("리포트가 삭제되었습니다.");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs" variant="outline">
          <FileBarChart className="h-3 w-3 mr-1" />
          리포트 생성
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-sm">
            <BarChart2 className="h-4 w-4" />
            커스텀 리포트 빌더
          </DialogTitle>
        </DialogHeader>

        {/* 새 리포트 생성 섹션 */}
        <div className="space-y-4">
          {/* 스텝 인디케이터 */}
          <div className="flex items-center gap-1">
            {([1, 2, 3] as Step[]).map((s) => (
              <div
                key={s}
                className={`flex items-center gap-1 text-[11px] font-medium ${
                  step === s
                    ? "text-foreground"
                    : step > s
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    step === s
                      ? "bg-primary text-primary-foreground"
                      : step > s
                      ? "bg-muted text-muted-foreground"
                      : "border text-muted-foreground/50"
                  }`}
                >
                  {s}
                </span>
                {s === 1 && "이름"}
                {s === 2 && "지표"}
                {s === 3 && "기간"}
                {s < 3 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: 리포트 이름 */}
          {step === 1 && (
            <div className="space-y-2">
              <Label className="text-xs">리포트 이름</Label>
              <Input
                placeholder="예: 4월 출석 분석"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNextStep();
                }}
              />
              <p className="text-[10px] text-muted-foreground">
                저장할 리포트의 이름을 입력하세요.
              </p>
            </div>
          )}

          {/* Step 2: 지표 선택 */}
          {step === 2 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">지표 선택</Label>
                <span className="text-[10px] text-muted-foreground">
                  {selectedMetrics.length}개 선택됨 (최소 2개)
                </span>
              </div>
              <div className="space-y-1.5">
                {ALL_METRICS.map((metric) => {
                  const meta = REPORT_METRIC_META[metric];
                  const checked = selectedMetrics.includes(metric);
                  return (
                    <div
                      key={metric}
                      className="flex items-center gap-2 rounded border px-2.5 py-1.5 hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleMetric(metric)}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleMetric(metric)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-xs">{meta.label}</span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 ml-auto"
                      >
                        {meta.unit}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: 기간 선택 + 미리보기 */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">기간 선택</Label>
                <RadioGroup
                  value={selectedPeriod}
                  onValueChange={(v) => {
                    setSelectedPeriod(v as ReportPeriod);
                    setPreviewResults(null);
                  }}
                  className="grid grid-cols-2 gap-1.5"
                >
                  {ALL_PERIODS.map((period) => (
                    <div
                      key={period}
                      className={`flex items-center gap-2 rounded border px-2.5 py-1.5 cursor-pointer hover:bg-muted/50 ${
                        selectedPeriod === period ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => {
                        setSelectedPeriod(period);
                        setPreviewResults(null);
                      }}
                    >
                      <RadioGroupItem value={period} className="h-3.5 w-3.5" />
                      <Label className="text-xs cursor-pointer">
                        {REPORT_PERIOD_LABELS[period]}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* 미리보기 버튼 */}
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs w-full"
                onClick={handlePreview}
                disabled={previewLoading || computing}
              >
                {previewLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    계산 중...
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    결과 미리보기
                  </>
                )}
              </Button>

              {/* 미리보기 결과 */}
              {previewLoading && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedMetrics.map((m) => (
                    <MetricResultSkeleton key={m} />
                  ))}
                </div>
              )}

              {previewResults && !previewLoading && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5">
                    미리보기 결과 — {REPORT_PERIOD_LABELS[selectedPeriod]}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {previewResults.map((item) => (
                      <MetricResultCard key={item.type} item={item} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 하단 버튼 */}
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setStep((prev) => (prev - 1) as Step)}
              >
                <ChevronLeft className="h-3 w-3 mr-0.5" />
                이전
              </Button>
            )}
            <div className="flex-1" />
            {step < 3 ? (
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleNextStep}
              >
                다음
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleSave}
                disabled={!canSave || computing}
              >
                {computing ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : null}
                저장
              </Button>
            )}
          </div>

          {!canSave && (
            <p className="text-[10px] text-destructive text-center">
              최대 {maxReports}개까지 저장할 수 있습니다. 기존 리포트를 삭제해주세요.
            </p>
          )}
        </div>

        {/* 저장된 리포트 목록 */}
        {reports.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              저장된 리포트 ({reports.length}/{maxReports})
            </p>
            <div className="space-y-1.5">
              {reports.map((report) => (
                <div key={report.id} className="space-y-1.5">
                  <div className="flex items-center gap-2 rounded border px-2.5 py-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{report.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {report.metrics.length}개 지표 &middot;{" "}
                        {REPORT_PERIOD_LABELS[report.period]}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-1.5"
                      onClick={() => handleViewReport(report.id)}
                      disabled={viewingLoading && viewingReportId === report.id}
                    >
                      {viewingLoading && viewingReportId === report.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Eye className="h-3 w-3 mr-0.5" />
                          보기
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteReport(report.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* 해당 리포트 결과 표시 */}
                  {viewingReportId === report.id && (
                    <div className="px-1">
                      {viewingLoading ? (
                        <div className="grid grid-cols-2 gap-2">
                          {report.metrics.map((m) => (
                            <MetricResultSkeleton key={m} />
                          ))}
                        </div>
                      ) : viewingResults ? (
                        <>
                          <p className="text-[10px] text-muted-foreground mb-1.5">
                            {REPORT_PERIOD_LABELS[report.period]} 기준
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {viewingResults.map((item) => (
                              <MetricResultCard key={item.type} item={item} />
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
