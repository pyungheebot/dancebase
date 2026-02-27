"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttendancePrintView } from "@/components/attendance/attendance-print-view";
import {
  PDF_PERIOD_LABELS,
  getPdfPeriodRange,
  buildPdfReportData,
  type PdfPeriod,
  type PdfReportData,
} from "@/lib/attendance-pdf-data";
import {
  generateAttendanceReport,
  type ReportMember,
} from "@/lib/attendance-report-generator";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { EntityMember } from "@/types/entity-context";
import type { AttendanceStatus } from "@/types";

type Props = {
  groupId: string;
  groupName: string;
  members: EntityMember[];
  projectId?: string | null;
};

export function AttendanceExportButton({
  groupId,
  groupName,
  members,
  projectId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<PdfPeriod>("3m");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<PdfReportData | null>(null);

  const supabase = createClient();

  const handleGenerate = async () => {
    if (members.length === 0) {
      toast.error("멤버 데이터가 없습니다");
      return;
    }

    setLoading(true);
    setReportData(null);

    try {
      const { from, to, label } = getPdfPeriodRange(period);

      // 1. 일정 조회
      let schedulesQuery = supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none");

      if (projectId) {
        schedulesQuery = schedulesQuery.eq("project_id", projectId);
      }
      if (from) {
        schedulesQuery = schedulesQuery.gte("starts_at", from);
      }
      if (to) {
        schedulesQuery = schedulesQuery.lte("starts_at", to);
      }

      const { data: scheduleRows, error: schedErr } = await schedulesQuery;
      if (schedErr) {
        toast.error("일정 데이터를 불러오지 못했습니다");
        return;
      }

      const schedules = (scheduleRows ?? []) as Array<{
        id: string;
        starts_at: string;
      }>;
      const scheduleIds = schedules.map((s) => s.id);

      // 2. 출석 기록 조회
      let attendances: Array<{
        schedule_id: string;
        user_id: string;
        status: AttendanceStatus;
      }> = [];

      if (scheduleIds.length > 0) {
        const { data: attData, error: attErr } = await supabase
          .from("attendance")
          .select("schedule_id, user_id, status")
          .in("schedule_id", scheduleIds);

        if (attErr) {
          toast.error("출석 데이터를 불러오지 못했습니다");
          return;
        }
        attendances = (attData ?? []) as typeof attendances;
      }

      // 3. 멤버 목록 변환
      const reportMembers: ReportMember[] = members.map((m) => ({
        userId: m.userId,
        name: m.nickname || m.profile.name,
      }));

      // 4. 리포트 생성
      const report = generateAttendanceReport(schedules, attendances, reportMembers);

      if (report.totalSchedules === 0) {
        toast.error(`선택한 기간(${PDF_PERIOD_LABELS[period]})에 출석 데이터가 없습니다`);
        return;
      }

      // 5. PDF 데이터 조립
      const pdfData = buildPdfReportData(
        groupName,
        label,
        report.memberStats,
        report.totalSchedules
      );

      setReportData(pdfData);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setReportData(null);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1"
        onClick={handleOpen}
      >
        <FileDown className="h-3 w-3" />
        PDF 내보내기
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto"
        >
          <SheetHeader className="mb-4">
            <SheetTitle>출석 요약 PDF 내보내기</SheetTitle>
            <SheetDescription>
              기간을 선택하고 보고서를 생성한 뒤 인쇄 또는 PDF로 저장하세요.
            </SheetDescription>
          </SheetHeader>

          {/* 기간 선택 + 생성 버튼 */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-muted-foreground shrink-0">기간:</span>
            <Select
              value={period}
              onValueChange={(v) => {
                setPeriod(v as PdfPeriod);
                setReportData(null);
              }}
            >
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PDF_PERIOD_LABELS) as PdfPeriod[]).map((key) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {PDF_PERIOD_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FileDown className="h-3 w-3" />
              )}
              {loading ? "생성 중..." : "보고서 생성"}
            </Button>
          </div>

          {/* 미리보기 */}
          {reportData ? (
            <div className="border rounded-md p-4 bg-white">
              <AttendancePrintView data={reportData} />
            </div>
          ) : (
            !loading && (
              <div className="text-center py-16 text-muted-foreground">
                <FileDown className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  기간을 선택하고 보고서 생성 버튼을 눌러주세요
                </p>
              </div>
            )
          )}

          {loading && (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
