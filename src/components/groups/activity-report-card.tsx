"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Star,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useActivityReport,
  type GenerateReportInput,
} from "@/hooks/use-activity-report";
import type {
  GroupActivityReport,
  GroupReportPeriod,
  GroupReportSection,
} from "@/types";

// ─── 변화율 뱃지 ─────────────────────────────────────────────

function ChangeBadge({ change }: { change: number | undefined }) {
  if (change === undefined) return null;

  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
        <TrendingUp className="h-2.5 w-2.5" />+{change}%
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-red-500">
        <TrendingDown className="h-2.5 w-2.5" />
        {change}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-gray-400">
      <Minus className="h-2.5 w-2.5" />0%
    </span>
  );
}

// ─── 컬러 바 차트 ─────────────────────────────────────────────

const SECTION_COLORS = [
  "bg-blue-400",
  "bg-violet-400",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-pink-400",
  "bg-cyan-400",
];

function SectionBarChart({ sections }: { sections: GroupReportSection[] }) {
  if (sections.length === 0) return null;

  // 출석률 섹션은 % 단위라 그대로 사용, 나머지는 최대값 기준 정규화
  const maxValue = Math.max(...sections.map((s) => s.value), 1);

  return (
    <div className="space-y-1.5">
      {sections.map((section, idx) => {
        const isPercent = section.unit === "%";
        const barWidth = isPercent ? section.value : (section.value / maxValue) * 100;

        return (
          <div key={section.label} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-[10px] text-gray-500 truncate">
              {section.label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${SECTION_COLORS[idx % SECTION_COLORS.length]} transition-all`}
                style={{ width: `${Math.min(barWidth, 100)}%` }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-[10px] font-medium text-gray-700">
              {section.value}
              {section.unit}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── 리포트 생성 다이얼로그 ───────────────────────────────────

interface GenerateDialogProps {
  onGenerate: (input: GenerateReportInput) => boolean;
}

function GenerateDialog({ onGenerate }: GenerateDialogProps) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<GroupReportPeriod>("monthly");
  const [highlightInput, setHighlightInput] = useState("");
  const [concernInput, setConcernInput] = useState("");

  function handleSubmit() {
    const highlights = highlightInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const concerns = concernInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const ok = onGenerate({ period, highlights, concerns });
    if (ok) {
      setOpen(false);
      setHighlightInput("");
      setConcernInput("");
      setPeriod("monthly");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs">
          <Plus className="mr-1 h-3 w-3" />
          리포트 생성
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            활동 리포트 생성
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* 기간 선택 */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-700">기간 유형</p>
            <div className="flex gap-2">
              {(["monthly", "quarterly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                    period === p
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-background text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {p === "monthly" ? "월간" : "분기"}
                </button>
              ))}
            </div>
          </div>

          {/* 하이라이트 입력 */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-700">
              주요 성과{" "}
              <span className="font-normal text-gray-400">(콤마로 구분)</span>
            </p>
            <Input
              value={highlightInput}
              onChange={(e) => setHighlightInput(e.target.value)}
              placeholder="예: 정기공연 성공, 신규 멤버 5명 가입"
              className="h-8 text-xs"
            />
          </div>

          {/* 개선사항 입력 */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-700">
              개선 필요 사항{" "}
              <span className="font-normal text-gray-400">(콤마로 구분)</span>
            </p>
            <Input
              value={concernInput}
              onChange={(e) => setConcernInput(e.target.value)}
              placeholder="예: 출석률 저하, 연습 시간 부족"
              className="h-8 text-xs"
            />
          </div>

          <p className="text-[10px] text-gray-400">
            통계 수치(일정 수, 게시글, 출석률 등)는 자동으로 시뮬레이션됩니다.
          </p>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={handleSubmit}
            >
              생성
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 리포트 행 ────────────────────────────────────────────────

interface ReportRowProps {
  report: GroupActivityReport;
  onDelete: (id: string) => boolean;
}

function ReportRow({ report, onDelete }: ReportRowProps) {
  const [open, setOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const createdDate = new Date(report.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const periodBadgeClass =
    report.period === "monthly"
      ? "bg-blue-100 text-blue-600"
      : "bg-purple-100 text-purple-600";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-gray-100 bg-card overflow-hidden">
        {/* 헤더 행 */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <CalendarCheck className="h-3.5 w-3.5 shrink-0 text-gray-400" />

          <CollapsibleTrigger asChild>
            <button className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-gray-800">
                  {report.periodLabel}
                </span>
                <Badge
                  className={`text-[10px] px-1.5 py-0 hover:opacity-80 ${periodBadgeClass}`}
                >
                  {report.period === "monthly" ? "월간" : "분기"}
                </Badge>
              </div>
              <p className="mt-0.5 text-[10px] text-gray-400">{createdDate} 생성</p>
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className={`h-6 w-6 p-0 ${
                deleteConfirm
                  ? "text-red-500"
                  : "text-gray-300 hover:text-red-400"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (deleteConfirm) {
                  onDelete(report.id);
                } else {
                  setDeleteConfirm(true);
                }
              }}
              onBlur={() => setDeleteConfirm(false)}
              title={
                deleteConfirm ? "한 번 더 클릭하면 삭제됩니다" : "리포트 삭제"
              }
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 간략 요약 (닫힌 상태) */}
        {!open && (
          <div className="px-3 pb-2.5">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {report.sections.slice(0, 3).map((section) => (
                <span key={section.label} className="text-[10px] text-gray-500">
                  {section.label}{" "}
                  <span className="font-medium text-gray-700">
                    {section.value}
                    {section.unit}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 확장 영역 */}
        <CollapsibleContent>
          <div className="border-t border-gray-100 px-3 pb-3 pt-2 space-y-3">
            {/* 컬러 바 차트 */}
            <SectionBarChart sections={report.sections} />

            {/* 전기 대비 변화율 */}
            {report.sections.some((s) => s.change !== undefined) && (
              <>
                <Separator />
                <div>
                  <p className="mb-1.5 text-[10px] font-medium text-gray-500">
                    전 기간 대비
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {report.sections
                      .filter((s) => s.change !== undefined)
                      .map((s) => (
                        <div
                          key={s.label}
                          className="rounded-md bg-gray-50 px-2 py-1.5 text-center"
                        >
                          <p className="text-[10px] text-gray-500 truncate">
                            {s.label}
                          </p>
                          <ChangeBadge change={s.change} />
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* 하이라이트 */}
            {report.highlights.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="mb-1.5 flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-400" />
                    <p className="text-[10px] font-medium text-gray-600">
                      주요 성과
                    </p>
                  </div>
                  <ul className="space-y-0.5">
                    {report.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="mt-0.5 text-[10px] text-amber-400">
                          •
                        </span>
                        <span className="text-[11px] text-gray-700">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* 개선사항 */}
            {report.concerns.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="mb-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-red-400" />
                    <p className="text-[10px] font-medium text-gray-600">
                      개선 필요 사항
                    </p>
                  </div>
                  <ul className="space-y-0.5">
                    {report.concerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="mt-0.5 text-[10px] text-red-400">
                          •
                        </span>
                        <span className="text-[11px] text-gray-700">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface ActivityReportCardProps {
  groupId: string;
}

export function ActivityReportCard({ groupId }: ActivityReportCardProps) {
  const [open, setOpen] = useState(true);

  const { reports, totalReports, generateReport, deleteReport } =
    useActivityReport(groupId);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-semibold text-gray-800">
            활동 리포트
          </span>
          {totalReports > 0 && (
            <Badge className="bg-blue-100 text-[10px] px-1.5 py-0 text-blue-600 hover:bg-blue-100">
              {totalReports}건
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <GenerateDialog onGenerate={generateReport} />
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              {open ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      {/* 카드 본문 */}
      <CollapsibleContent>
        <div className="rounded-b-lg border border-gray-200 bg-card p-4 space-y-3">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-10 text-gray-400">
              <FileText className="h-8 w-8 opacity-30" />
              <p className="text-xs">생성된 리포트가 없습니다.</p>
              <p className="text-[10px] text-gray-400">
                리포트 생성 버튼을 눌러 월별 활동을 정리해보세요.
              </p>
            </div>
          ) : (
            <>
              {/* 요약 통계 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
                  <div className="text-sm font-bold text-blue-700">
                    {totalReports}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    총 리포트
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center">
                  <div className="text-sm font-bold text-emerald-700 truncate">
                    {reports[0]?.periodLabel ?? "-"}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    최신 기간
                  </div>
                </div>
              </div>

              <Separator />

              {/* 리포트 목록 */}
              <div className="space-y-2">
                {reports.map((report) => (
                  <ReportRow
                    key={report.id}
                    report={report}
                    onDelete={deleteReport}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
