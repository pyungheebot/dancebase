"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateCSV, downloadCSV } from "@/lib/export/csv-exporter";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type {
  MemberActivityExportPeriod,
  MemberActivityExportItems,
  MemberActivityExportData,
} from "@/types";
import logger from "@/lib/logger";

/** 기간 옵션 → 시작 날짜(ISO 문자열) 변환. "all"이면 null 반환 */
function periodToStartDate(period: MemberActivityExportPeriod): string | null {
  if (period === "all") return null;
  const days = period === "last30" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** 출석 상태 → 한글 */
function statusLabel(status: string): string {
  if (status === "present") return "출석";
  if (status === "late") return "지각";
  if (status === "absent") return "결석";
  return status;
}

/** ISO 날짜 문자열 → YYYY-MM-DD */
function toDateString(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * 특정 멤버의 활동 데이터를 Supabase에서 조회하고 CSV로 다운로드하는 훅.
 * SWR 캐시를 사용하지 않고 버튼 클릭 시 즉시 호출하는 방식으로 구현.
 */
export function useMemberActivityExport() {
  const [loading, setLoading] = useState(false);

  async function fetchAndExport(
    userId: string,
    memberName: string,
    period: MemberActivityExportPeriod,
    items: MemberActivityExportItems,
  ): Promise<void> {
    setLoading(true);
    try {
      const supabase = createClient();
      const startDate = periodToStartDate(period);
      const data: MemberActivityExportData = {
        attendance: [],
        posts: [],
        comments: [],
      };

      // 1) 출석 기록
      if (items.attendance) {
        let query = supabase
          .from("attendance")
          .select("id, checked_at, status, schedules(title)")
          .eq("user_id", userId)
          .order("checked_at", { ascending: false });

        if (startDate) {
          query = query.gte("checked_at", startDate);
        }

        const { data: rows, error } = await query;
        if (error) {
          toast.error(TOAST.ATTENDANCE.LOAD_ERROR);
          return;
        }

        type AttRow = {
          checked_at: string;
          status: string;
          schedules: { title: string } | null;
        };
        data.attendance = (rows ?? []).map((row: AttRow) => ({
          date: toDateString(row.checked_at),
          scheduleName: row.schedules?.title ?? "",
          status: statusLabel(row.status),
        }));
      }

      // 2) 게시글
      if (items.posts) {
        let query = supabase
          .from("board_posts")
          .select("id, title, created_at")
          .eq("author_id", userId)
          .order("created_at", { ascending: false });

        if (startDate) {
          query = query.gte("created_at", startDate);
        }

        const { data: rows, error } = await query;
        if (error) {
          toast.error(TOAST.BOARD.LOAD_ERROR);
          return;
        }

        type PostRow = { title: string; created_at: string };
        data.posts = (rows ?? []).map((row: PostRow) => ({
          date: toDateString(row.created_at),
          title: row.title,
        }));
      }

      // 3) 댓글
      if (items.comments) {
        let query = supabase
          .from("board_comments")
          .select("id, created_at, board_posts(title)")
          .eq("author_id", userId)
          .order("created_at", { ascending: false });

        if (startDate) {
          query = query.gte("created_at", startDate);
        }

        const { data: rows, error } = await query;
        if (error) {
          toast.error(TOAST.BOARD.COMMENT_LOAD_ERROR);
          return;
        }

        type CommentRow = {
          created_at: string;
          board_posts: { title: string } | null;
        };
        data.comments = (rows ?? []).map((row: CommentRow) => ({
          date: toDateString(row.created_at),
          postTitle: row.board_posts?.title ?? "",
        }));
      }

      // 선택된 항목이 하나도 없으면 알림
      const totalRows =
        data.attendance.length + data.posts.length + data.comments.length;
      if (totalRows === 0) {
        toast.error(TOAST.EXPORT_EMPTY);
        return;
      }

      // CSV 생성 및 다운로드
      const csvSections: string[] = [];
      const safeName = memberName.replace(/[^\w가-힣]/g, "_");
      const periodLabel =
        period === "all" ? "전체" : period === "last30" ? "최근30일" : "최근90일";

      if (items.attendance && data.attendance.length > 0) {
        const header = ["날짜", "일정명", "출석상태"];
        const rows = data.attendance.map((r) => [r.date, r.scheduleName, r.status]);
        csvSections.push(`[출석 기록]\r\n${generateCSV(header, rows)}`);
      }

      if (items.posts && data.posts.length > 0) {
        const header = ["날짜", "제목"];
        const rows = data.posts.map((r) => [r.date, r.title]);
        csvSections.push(`[게시글 목록]\r\n${generateCSV(header, rows)}`);
      }

      if (items.comments && data.comments.length > 0) {
        const header = ["날짜", "게시글 제목"];
        const rows = data.comments.map((r) => [r.date, r.postTitle]);
        csvSections.push(`[댓글 목록]\r\n${generateCSV(header, rows)}`);
      }

      if (csvSections.length === 0) {
        toast.error(TOAST.EXPORT_EMPTY);
        return;
      }

      const csvContent = csvSections.join("\r\n\r\n");
      const filename = `${safeName}_활동내역_${periodLabel}.csv`;
      downloadCSV(filename, csvContent);

      toast.success(`${memberName}님의 활동 내역을 내보냈습니다.`);
    } catch (err) {
      logger.error("활동 내보내기 오류", "useMemberActivityExport", err);
      toast.error(TOAST.EXPORT_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return { exportActivity: fetchAndExport, loading };
}
