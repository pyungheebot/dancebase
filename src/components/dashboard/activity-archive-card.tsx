"use client";

import { useState } from "react";
import {
  Calendar,
  Users,
  FileText,
  MessageSquare,
  UserPlus,
  Zap,
  Trophy,
  Star,
  ChevronDown,
  ChevronUp,
  Archive,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useActivityArchive } from "@/hooks/use-activity-archive";
import type { MonthlyArchiveEntry } from "@/types";

// -----------------------------------------------
// 활동 점수 계산 (표시용)
// -----------------------------------------------

function calcDisplayScore(entry: MonthlyArchiveEntry): number {
  return (
    entry.totalSchedules * 5 +
    entry.totalAttendance * 3 +
    entry.postCount * 2 +
    entry.commentCount * 1 +
    entry.newMemberCount * 4
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 통계 셀
// -----------------------------------------------

function StatCell({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-muted/40 px-2.5 py-2">
      <div className={`flex items-center gap-1 ${color}`}>
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <span className="text-sm font-bold tabular-nums leading-none">{value}</span>
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: div 기반 바 차트 (출석률 시각화)
// -----------------------------------------------

function AttendanceBar({ rate }: { rate: number }) {
  const color =
    rate >= 80
      ? "bg-green-500"
      : rate >= 60
      ? "bg-yellow-500"
      : rate >= 40
      ? "bg-orange-500"
      : "bg-red-400";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground w-8 text-right">
        {rate}%
      </span>
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: TOP 3 멤버 바 차트
// -----------------------------------------------

function TopMembersChart({
  members,
}: {
  members: MonthlyArchiveEntry["topMembers"];
}) {
  if (members.length === 0) return null;

  const maxScore = members[0].score;
  const rankColors = ["text-yellow-500", "text-slate-400", "text-amber-700"];
  const barColors = ["bg-yellow-400", "bg-slate-300", "bg-amber-600"];

  return (
    <div className="space-y-1.5">
      {members.map((m, i) => (
        <div key={m.userId} className="flex items-center gap-2">
          <span className={`text-[10px] font-bold w-3 shrink-0 ${rankColors[i] ?? "text-muted-foreground"}`}>
            {i + 1}
          </span>
          <span className="text-[11px] truncate w-20 shrink-0">{m.name}</span>
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColors[i] ?? "bg-muted-foreground"}`}
              style={{
                width: maxScore > 0 ? `${Math.round((m.score / maxScore) * 100)}%` : "0%",
              }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-muted-foreground w-8 text-right">
            {m.score}점
          </span>
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 월별 엔트리 아코디언
// -----------------------------------------------

function MonthAccordionItem({
  entry,
  isOpen,
  onToggle,
}: {
  entry: MonthlyArchiveEntry;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const activityScore = calcDisplayScore(entry);
  const hasActivity =
    entry.totalSchedules > 0 ||
    entry.postCount > 0 ||
    entry.newMemberCount > 0;

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* 헤더 (클릭으로 펼침/접힘) */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-semibold">{entry.label}</span>
          {!hasActivity && (
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 text-muted-foreground"
            >
              기록 없음
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActivity && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Zap className="h-3 w-3" />
              <span className="tabular-nums font-medium">{activityScore}점</span>
            </div>
          )}
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* 펼쳐진 내용 */}
      {isOpen && (
        <div className="px-3 py-3 space-y-4">
          {!hasActivity ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              이 달의 활동 기록이 없습니다
            </p>
          ) : (
            <>
              {/* 6칸 통계 그리드 */}
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                <StatCell
                  icon={<Calendar className="h-3 w-3" />}
                  label="일정"
                  value={`${entry.totalSchedules}회`}
                  color="text-blue-500"
                />
                <StatCell
                  icon={<Users className="h-3 w-3" />}
                  label="출석률"
                  value={`${entry.avgAttendanceRate}%`}
                  color="text-green-500"
                />
                <StatCell
                  icon={<FileText className="h-3 w-3" />}
                  label="게시글"
                  value={`${entry.postCount}건`}
                  color="text-violet-500"
                />
                <StatCell
                  icon={<MessageSquare className="h-3 w-3" />}
                  label="댓글"
                  value={`${entry.commentCount}건`}
                  color="text-pink-500"
                />
                <StatCell
                  icon={<UserPlus className="h-3 w-3" />}
                  label="신규멤버"
                  value={`${entry.newMemberCount}명`}
                  color="text-cyan-500"
                />
                <StatCell
                  icon={<Zap className="h-3 w-3" />}
                  label="활동점수"
                  value={`${activityScore}`}
                  color="text-orange-500"
                />
              </div>

              {/* 출석률 바 차트 */}
              {entry.totalSchedules > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">
                    출석률
                  </p>
                  <AttendanceBar rate={entry.avgAttendanceRate} />
                </div>
              )}

              {/* TOP 3 활발한 멤버 */}
              {entry.topMembers.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Trophy className="h-3 w-3 text-yellow-500" />
                    <p className="text-[10px] font-semibold text-muted-foreground">
                      활발한 멤버 TOP 3
                    </p>
                  </div>
                  <TopMembersChart members={entry.topMembers} />
                </div>
              )}

              {/* 인기 게시글 */}
              {entry.popularPost && (
                <div className="rounded-md bg-muted/40 px-2.5 py-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="h-3 w-3 text-yellow-400" />
                    <p className="text-[10px] font-semibold text-muted-foreground">
                      인기 게시글
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs truncate">{entry.popularPost.title}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {entry.popularPost.commentCount}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------
// 서브 컴포넌트: 스켈레톤
// -----------------------------------------------

function ArchiveSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------
// 메인 컴포넌트
// -----------------------------------------------

interface ActivityArchiveCardProps {
  groupId: string;
}

export function ActivityArchiveCard({ groupId }: ActivityArchiveCardProps) {
  const { archive, loading } = useActivityArchive(groupId);
  const [openMonth, setOpenMonth] = useState<string | null>(null);
  const [isCardOpen, setIsCardOpen] = useState(true);

  const handleToggleMonth = (month: string) => {
    setOpenMonth((prev) => (prev === month ? null : month));
  };

  return (
    <Card>
      {/* 카드 헤더 — Collapsible */}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Archive className="h-4 w-4" aria-hidden="true" />
            활동 아카이브
          </span>
          <button
            type="button"
            onClick={() => setIsCardOpen((prev) => !prev)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            aria-expanded={isCardOpen}
          >
            <span>{isCardOpen ? "접기" : "펼치기"}</span>
            {isCardOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </CardTitle>
      </CardHeader>

      {/* 카드 본문 */}
      {isCardOpen && (
        <CardContent>
          {loading ? (
            <ArchiveSkeleton />
          ) : archive.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              활동 기록을 불러올 수 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {archive.map((entry) => (
                <MonthAccordionItem
                  key={entry.month}
                  entry={entry}
                  isOpen={openMonth === entry.month}
                  onToggle={() => handleToggleMonth(entry.month)}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
