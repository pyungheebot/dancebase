"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Calendar,
  ClipboardCheck,
  MessageSquare,
  Wallet,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Schedule, BoardPostWithDetails, FinanceTransaction, AttendanceWithProfile } from "@/types";

// 다가오는 일정 카드
export function ScheduleCard({
  schedules,
  basePath,
}: {
  schedules: Schedule[];
  basePath: string;
}) {
  return (
    <div className="rounded border">
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b bg-muted/30">
        <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <Calendar className="h-3 w-3" />
          다가오는 일정
        </span>
        <Link
          href={`${basePath}/schedule`}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          전체 <ChevronRight className="h-2.5 w-2.5 inline" />
        </Link>
      </div>
      <div className="px-2.5 py-1.5">
        {schedules.length === 0 ? (
          <p className="text-[11px] text-muted-foreground py-1">예정된 일정이 없습니다</p>
        ) : (
          <div className="space-y-px">
            {schedules.map((s) => (
              <Link
                key={s.id}
                href={`${basePath}/attendance?schedule=${s.id}`}
                className="flex items-center gap-1.5 text-[11px] hover:bg-muted rounded px-1.5 py-1 -mx-1.5"
              >
                <span className="text-muted-foreground w-20 shrink-0 tabular-nums">
                  {format(new Date(s.starts_at), "M/d(EEE) HH:mm", { locale: ko })}
                </span>
                <span className="truncate">{s.title}</span>
                {s.location && (
                  <MapPin className="h-2.5 w-2.5 text-muted-foreground shrink-0 hidden sm:block" />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 출석 현황 카드
export function AttendanceCard({
  schedule,
  attendance,
  memberCount,
  basePath,
}: {
  schedule: Schedule | null;
  attendance: AttendanceWithProfile[];
  memberCount: number;
  basePath: string;
}) {
  const now = new Date();
  const presentCount = attendance.filter(
    (a) => a.status === "present" || a.status === "late" || a.status === "early_leave"
  ).length;

  return (
    <div className="rounded border">
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b bg-muted/30">
        <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <ClipboardCheck className="h-3 w-3" />
          출석 현황
        </span>
        <Link
          href={`${basePath}/attendance`}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          전체 <ChevronRight className="h-2.5 w-2.5 inline" />
        </Link>
      </div>
      <div className="px-2.5 py-1.5">
        {schedule ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-muted-foreground tabular-nums">
                {format(new Date(schedule.starts_at), "M/d(EEE) HH:mm", { locale: ko })}
              </span>
              <span className="truncate">{schedule.title}</span>
            </div>
            {new Date(schedule.starts_at) <= now ? (
              <p className="text-xs">
                <span className="font-semibold tabular-nums">{presentCount}</span>
                <span className="text-muted-foreground">/{memberCount}명 출석</span>
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">아직 시작 전</p>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground py-1">예정된 일정이 없습니다</p>
        )}
      </div>
    </div>
  );
}

// 최근 게시글 카드
export function PostsCard({
  posts,
  basePath,
  showProject,
}: {
  posts: BoardPostWithDetails[];
  basePath: string;
  showProject?: boolean;
}) {
  return (
    <div className="rounded border">
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b bg-muted/30">
        <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <MessageSquare className="h-3 w-3" />
          최근 게시글
        </span>
        <Link
          href={`${basePath}/board`}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          전체 <ChevronRight className="h-2.5 w-2.5 inline" />
        </Link>
      </div>
      <div className="px-2.5 py-1.5">
        {posts.length === 0 ? (
          <p className="text-[11px] text-muted-foreground py-1">게시글이 없습니다</p>
        ) : (
          <div className="space-y-px">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={
                  showProject && post.project_id
                    ? `${basePath.split("/projects/")[0]}/projects/${post.project_id}/board/${post.id}`
                    : `${basePath}/board/${post.id}`
                }
                className="flex items-center justify-between text-[11px] hover:bg-muted rounded px-1.5 py-1 -mx-1.5"
              >
                <div className="flex items-center gap-1 min-w-0">
                  <span className="truncate">{post.title}</span>
                  {showProject && post.projects && (
                    <Badge variant="outline" className="text-[8px] px-0.5 py-0 font-normal shrink-0">
                      {post.projects.name}
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground shrink-0 ml-1.5 tabular-nums">
                  {format(new Date(post.created_at), "M/d")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 회비 카드
export function FinanceCard({
  transactions,
  basePath,
}: {
  transactions: FinanceTransaction[];
  basePath: string;
}) {
  return (
    <div className="rounded border">
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b bg-muted/30">
        <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <Wallet className="h-3 w-3" />
          회비
        </span>
        <Link
          href={`${basePath}/finances`}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          전체 <ChevronRight className="h-2.5 w-2.5 inline" />
        </Link>
      </div>
      <div className="px-2.5 py-1.5">
        {transactions.length === 0 ? (
          <p className="text-[11px] text-muted-foreground py-1">거래 내역이 없습니다</p>
        ) : (
          <div className="space-y-px">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between text-[11px] px-1.5 py-1 -mx-1.5"
              >
                <span className="truncate">{txn.title}</span>
                <span
                  className={`shrink-0 ml-1.5 font-medium tabular-nums ${
                    txn.type === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {txn.type === "income" ? "+" : "-"}
                  {txn.amount.toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
