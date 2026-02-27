"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Loader2,
  MessageSquare,
  FileText,
  Users,
  BarChart2,
} from "lucide-react";
import { useBoardTrendAnalytics } from "@/hooks/use-board-trend-analytics";

interface BoardTrendCardProps {
  groupId: string;
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function BoardTrendCard({ groupId }: BoardTrendCardProps) {
  const [open, setOpen] = useState(false);
  const { trend, loading } = useBoardTrendAnalytics(groupId);

  // 주간 추이 차트의 최대값 (막대 높이 계산용)
  const maxWeeklyCount = trend
    ? Math.max(
        ...trend.weeklyTrend.flatMap((w) => [w.postCount, w.commentCount]),
        1
      )
    : 1;

  // 요일별 패턴의 최대값 (원형 크기 계산용)
  const maxDayCount = trend
    ? Math.max(...trend.dayOfWeekPattern, 1)
    : 1;

  return (
    <Card className="border-border/60">
      {/* 헤더 */}
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
            <CardTitle className="text-sm font-semibold">게시판 트렌드</CardTitle>
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-600 border-blue-100"
            >
              최근 30일
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </div>
      </CardHeader>

      {/* 요약 통계 (항상 표시) */}
      <CardContent className="px-4 pb-3">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : trend ? (
          <>
            {/* 4칸 그리드 요약 */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <SummaryCell
                icon={<FileText className="h-3 w-3 text-blue-500" />}
                value={trend.totalPosts}
                label="게시글"
                color="blue"
              />
              <SummaryCell
                icon={<MessageSquare className="h-3 w-3 text-purple-500" />}
                value={trend.totalComments}
                label="댓글"
                color="purple"
              />
              <SummaryCell
                icon={<BarChart2 className="h-3 w-3 text-emerald-500" />}
                value={trend.avgCommentsPerPost}
                label="평균 댓글/글"
                color="emerald"
              />
              <SummaryCell
                icon={<Users className="h-3 w-3 text-orange-500" />}
                value={trend.uniqueAuthors}
                label="참여자"
                color="orange"
              />
            </div>

            {/* 펼쳐진 상세 분석 */}
            {open && (
              <div className="space-y-4 pt-2 border-t border-border/40">
                {/* 주간 추이 막대 차트 */}
                <section>
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    주간 추이
                  </h4>
                  <div className="flex items-end gap-2 h-24">
                    {trend.weeklyTrend.map((week) => (
                      <div
                        key={week.weekLabel}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <div className="w-full flex items-end gap-0.5 h-16">
                          {/* 게시글 막대 (파랑) */}
                          <div
                            className="flex-1 rounded-t bg-blue-400 transition-all duration-300 min-h-[2px]"
                            style={{
                              height: `${Math.max(
                                (week.postCount / maxWeeklyCount) * 100,
                                4
                              )}%`,
                            }}
                            title={`게시글: ${week.postCount}`}
                          />
                          {/* 댓글 막대 (보라) */}
                          <div
                            className="flex-1 rounded-t bg-purple-400 transition-all duration-300 min-h-[2px]"
                            style={{
                              height: `${Math.max(
                                (week.commentCount / maxWeeklyCount) * 100,
                                4
                              )}%`,
                            }}
                            title={`댓글: ${week.commentCount}`}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {week.weekLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* 범례 */}
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-sm bg-blue-400" />
                      <span className="text-[10px] text-muted-foreground">게시글</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-sm bg-purple-400" />
                      <span className="text-[10px] text-muted-foreground">댓글</span>
                    </div>
                  </div>
                </section>

                {/* 요일별 활동 패턴 */}
                <section>
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    요일별 활동 패턴
                  </h4>
                  <div className="flex items-center justify-around">
                    {trend.dayOfWeekPattern.map((count, idx) => {
                      const ratio = count / maxDayCount;
                      // 원형 크기: 20px ~ 40px
                      const size = Math.round(20 + ratio * 20);
                      // 색상 진하기: opacity 기반
                      const opacity = Math.max(0.15, ratio);
                      return (
                        <div
                          key={DAY_LABELS[idx]}
                          className="flex flex-col items-center gap-1"
                        >
                          <div
                            className="rounded-full bg-blue-500 flex items-center justify-center transition-all duration-300"
                            style={{
                              width: `${size}px`,
                              height: `${size}px`,
                              opacity,
                            }}
                            title={`${DAY_LABELS[idx]}요일: ${count}건`}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {DAY_LABELS[idx]}
                          </span>
                          {count > 0 && (
                            <span className="text-[9px] text-muted-foreground/70">
                              {count}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* TOP 작성자 */}
                {trend.topAuthors.length > 0 && (
                  <section>
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      활발한 작성자 TOP {trend.topAuthors.length}
                    </h4>
                    <div className="space-y-1.5">
                      {trend.topAuthors.map((author, idx) => (
                        <div
                          key={author.userId}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`text-[10px] font-bold w-4 text-center shrink-0 ${
                                idx === 0
                                  ? "text-yellow-500"
                                  : idx === 1
                                  ? "text-gray-400"
                                  : idx === 2
                                  ? "text-amber-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="text-xs truncate font-medium">
                              {author.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              글 {author.postCount}
                            </span>
                            <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                              댓글 {author.commentCount}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 인기 게시글 TOP 3 */}
                {trend.popularPosts.length > 0 && (
                  <section>
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      인기 게시글 TOP {trend.popularPosts.length}
                    </h4>
                    <div className="space-y-1.5">
                      {trend.popularPosts.map((post, idx) => (
                        <div
                          key={post.postId}
                          className="flex items-start justify-between gap-2"
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <span
                              className={`text-[10px] font-bold w-4 text-center shrink-0 mt-0.5 ${
                                idx === 0
                                  ? "text-yellow-500"
                                  : idx === 1
                                  ? "text-gray-400"
                                  : "text-amber-600"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs truncate font-medium">
                                {post.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {post.authorName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <MessageSquare className="h-3 w-3 text-purple-400" />
                            <span className="text-[10px] text-muted-foreground">
                              {post.commentCount}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 데이터 없음 */}
                {trend.totalPosts === 0 && (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    최근 30일간 게시글이 없습니다.
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4 text-xs text-muted-foreground">
            데이터를 불러올 수 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── 요약 셀 서브 컴포넌트 ─────────────────────────────────

type SummaryCellColor = "blue" | "purple" | "emerald" | "orange";

const colorMap: Record<
  SummaryCellColor,
  { bg: string; text: string; value: string }
> = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-500",
    value: "text-blue-700",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-500",
    value: "text-purple-700",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-500",
    value: "text-emerald-700",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-500",
    value: "text-orange-700",
  },
};

function SummaryCell({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: SummaryCellColor;
}) {
  const c = colorMap[color];
  return (
    <div className={`rounded-lg p-2 ${c.bg} flex flex-col items-center gap-0.5`}>
      <div className={c.text}>{icon}</div>
      <span className={`text-sm font-bold leading-tight ${c.value}`}>
        {value}
      </span>
      <span className="text-[9px] text-muted-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
