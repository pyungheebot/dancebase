"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateCSV, downloadCSV } from "@/lib/export/csv-exporter";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type {
  AttendanceExportRow,
  BoardActivityExportRow,
  FinanceExportRow,
  ExportDateRange,
} from "@/types";

// ============================================
// 출석 상태 한글 변환
// ============================================
function localizeStatus(status: string): string {
  switch (status) {
    case "present":
      return "출석";
    case "absent":
      return "결석";
    case "late":
      return "지각";
    default:
      return status;
  }
}

// ============================================
// 재무 유형 한글 변환
// ============================================
function localizeTransactionType(type: string): string {
  switch (type) {
    case "income":
      return "수입";
    case "expense":
      return "지출";
    default:
      return type;
  }
}

// ============================================
// 훅
// ============================================
export function useAnalyticsExport(groupId: string, range: ExportDateRange) {
  const [exportingAttendance, setExportingAttendance] = useState(false);
  const [exportingBoard, setExportingBoard] = useState(false);
  const [exportingFinance, setExportingFinance] = useState(false);

  // 기간 레이블 (파일명용)
  const periodLabel =
    range.startDate && range.endDate
      ? `${range.startDate}_${range.endDate}`
      : range.startDate
      ? `${range.startDate}_이후`
      : "전체";

  // ------------------------------------------
  // 출석 데이터 내보내기
  // ------------------------------------------
  async function exportAttendance(): Promise<AttendanceExportRow[]> {
    const supabase = createClient();

    // 1. 기간 내 일정 조회
    let schedulesQuery = supabase
      .from("schedules")
      .select("id, title, starts_at")
      .eq("group_id", groupId)
      .order("starts_at", { ascending: true });

    if (range.startDate) {
      schedulesQuery = schedulesQuery.gte("starts_at", range.startDate);
    }
    if (range.endDate) {
      schedulesQuery = schedulesQuery.lt("starts_at", range.endDate);
    }

    const { data: schedules, error: schedulesError } = await schedulesQuery;
    if (schedulesError) throw new Error(schedulesError.message);
    if (!schedules || schedules.length === 0) return [];

    // 2. 해당 일정의 출석 기록 + 멤버 이름 조회
    const scheduleIds = schedules.map((s: { id: string }) => s.id);
    const { data: attendanceRows, error: attendanceError } = await supabase
      .from("attendance")
      .select("schedule_id, status, profiles(name)")
      .in("schedule_id", scheduleIds);

    if (attendanceError) throw new Error(attendanceError.message);

    // 3. scheduleId -> schedule 맵
    const scheduleMap = new Map<string, { title: string; starts_at: string }>(
      schedules.map((s: { id: string; title: string; starts_at: string }) => [s.id, { title: s.title, starts_at: s.starts_at }])
    );

    return (attendanceRows ?? []).map((row: { schedule_id: string; status: string; profiles: { name: string } | null }) => {
      const schedule = scheduleMap.get(row.schedule_id);
      const profile = row.profiles;
      return {
        date: schedule?.starts_at
          ? schedule.starts_at.slice(0, 10)
          : "",
        scheduleTitle: schedule?.title ?? "",
        memberName: profile?.name ?? "",
        status: localizeStatus(row.status),
      };
    });
  }

  // ------------------------------------------
  // 게시판 활동 데이터 내보내기
  // ------------------------------------------
  async function exportBoardActivity(): Promise<BoardActivityExportRow[]> {
    const supabase = createClient();

    let postsQuery = supabase
      .from("board_posts")
      .select(
        "id, title, created_at, profiles(name), board_comments(id)"
      )
      .eq("group_id", groupId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (range.startDate) {
      postsQuery = postsQuery.gte("created_at", range.startDate);
    }
    if (range.endDate) {
      postsQuery = postsQuery.lt("created_at", range.endDate);
    }

    const { data: posts, error } = await postsQuery;
    if (error) throw new Error(error.message);

    return (posts ?? []).map((post: { id: string; title: string; created_at: string; profiles: { name: string } | null; board_comments: { id: string }[] | null }) => {
      const author = post.profiles;
      const comments = post.board_comments;
      return {
        date: post.created_at.slice(0, 10),
        title: post.title,
        authorName: author?.name ?? "",
        commentCount: comments?.length ?? 0,
      };
    });
  }

  // ------------------------------------------
  // 재무 데이터 내보내기
  // ------------------------------------------
  async function exportFinances(): Promise<FinanceExportRow[]> {
    const supabase = createClient();

    let financeQuery = supabase
      .from("finance_transactions")
      .select("transaction_date, type, amount, title, description")
      .eq("group_id", groupId)
      .order("transaction_date", { ascending: true });

    if (range.startDate) {
      financeQuery = financeQuery.gte("transaction_date", range.startDate);
    }
    if (range.endDate) {
      financeQuery = financeQuery.lt("transaction_date", range.endDate);
    }

    const { data: transactions, error } = await financeQuery;
    if (error) throw new Error(error.message);

    return (transactions ?? []).map((t: { transaction_date: string; type: string; amount: number; title: string; description: string | null }) => ({
      date: t.transaction_date,
      type: localizeTransactionType(t.type),
      amount: t.amount,
      title: t.title,
      description: t.description ?? "",
    }));
  }

  // ------------------------------------------
  // 출석 CSV 다운로드
  // ------------------------------------------
  async function downloadAttendanceCSV() {
    setExportingAttendance(true);
    try {
      const rows = await exportAttendance();
      if (rows.length === 0) {
        toast.info(TOAST.DATA.NO_ATTENDANCE);
        return;
      }
      const headers = ["날짜", "일정명", "멤버명", "출석상태"];
      const csvRows = rows.map((r) => [r.date, r.scheduleTitle, r.memberName, r.status]);
      const csv = generateCSV(headers, csvRows);
      downloadCSV(`출석데이터_${periodLabel}`, csv);
      toast.success(TOAST.ATTENDANCE.EXPORTED);
    } catch (err) {
      toast.error(`출석 데이터 내보내기 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
    } finally {
      setExportingAttendance(false);
    }
  }

  // ------------------------------------------
  // 게시판 CSV 다운로드
  // ------------------------------------------
  async function downloadBoardCSV() {
    setExportingBoard(true);
    try {
      const rows = await exportBoardActivity();
      if (rows.length === 0) {
        toast.info(TOAST.DATA.NO_BOARD);
        return;
      }
      const headers = ["날짜", "제목", "작성자", "댓글수"];
      const csvRows = rows.map((r) => [r.date, r.title, r.authorName, String(r.commentCount)]);
      const csv = generateCSV(headers, csvRows);
      downloadCSV(`게시판활동_${periodLabel}`, csv);
      toast.success(TOAST.BOARD.EXPORTED);
    } catch (err) {
      toast.error(`게시판 데이터 내보내기 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
    } finally {
      setExportingBoard(false);
    }
  }

  // ------------------------------------------
  // 재무 CSV 다운로드
  // ------------------------------------------
  async function downloadFinanceCSV() {
    setExportingFinance(true);
    try {
      const rows = await exportFinances();
      if (rows.length === 0) {
        toast.info(TOAST.DATA.NO_FINANCE);
        return;
      }
      const headers = ["날짜", "유형", "금액(원)", "항목명", "설명"];
      const csvRows = rows.map((r) => [r.date, r.type, String(r.amount), r.title, r.description]);
      const csv = generateCSV(headers, csvRows);
      downloadCSV(`재무데이터_${periodLabel}`, csv);
      toast.success(TOAST.REPORT.FINANCE_EXPORTED);
    } catch (err) {
      toast.error(`재무 데이터 내보내기 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
    } finally {
      setExportingFinance(false);
    }
  }

  // ------------------------------------------
  // 전체 CSV 다운로드 (순차 처리)
  // ------------------------------------------
  async function downloadAllCSV(types: Array<"attendance" | "board" | "finance">) {
    if (types.includes("attendance")) await downloadAttendanceCSV();
    if (types.includes("board")) await downloadBoardCSV();
    if (types.includes("finance")) await downloadFinanceCSV();
  }

  const isExporting = exportingAttendance || exportingBoard || exportingFinance;

  return {
    exportAttendance: downloadAttendanceCSV,
    exportBoardActivity: downloadBoardCSV,
    exportFinances: downloadFinanceCSV,
    exportAll: downloadAllCSV,
    exportingAttendance,
    exportingBoard,
    exportingFinance,
    isExporting,
  };
}
