"use client";

import { useState } from "react";
import Link from "next/link";
import { useSubgroupPerformance, type SubgroupPerformance } from "@/hooks/use-subgroup-performance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  FileText,
  Clock,
  ArrowUpDown,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface SubgroupPerformanceProps {
  groupId: string;
}

type SortKey = "member_count" | "monthly_post_count" | "last_activity_at";

function formatLastActivity(dateStr: string | null): string {
  if (!dateStr) return "활동 없음";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
}

function getActivityColor(dateStr: string | null): string {
  if (!dateStr) return "text-muted-foreground";
  const diffMs = new Date().getTime() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return "text-green-600";
  if (diffDays <= 30) return "text-yellow-600";
  return "text-muted-foreground";
}

function SortButton({
  label,
  sortKeyValue,
  currentSortKey,
  onSort,
}: {
  label: string;
  sortKeyValue: SortKey;
  currentSortKey: SortKey;
  onSort: (key: SortKey) => void;
}) {
  return (
    <button
      onClick={() => onSort(sortKeyValue)}
      className={`flex items-center gap-0.5 text-[10px] font-medium transition-colors ${
        currentSortKey === sortKeyValue
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      <ArrowUpDown className="h-2.5 w-2.5" />
    </button>
  );
}

function PerformanceSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
          <Skeleton className="h-4 w-4 rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SubgroupPerformanceSection({ groupId }: SubgroupPerformanceProps) {
  const { performances, loading } = useSubgroupPerformance(groupId);
  const [sortKey, setSortKey] = useState<SortKey>("member_count");
  const [sortDesc, setSortDesc] = useState(true);

  if (!loading && performances.length === 0) {
    return null;
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const sorted = [...performances].sort((a, b) => {
    let diff = 0;
    if (sortKey === "member_count") {
      diff = a.member_count - b.member_count;
    } else if (sortKey === "monthly_post_count") {
      diff = a.monthly_post_count - b.monthly_post_count;
    } else if (sortKey === "last_activity_at") {
      const aTime = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
      const bTime = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
      diff = aTime - bTime;
    }
    return sortDesc ? -diff : diff;
  });

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          서브그룹 성과
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <PerformanceSkeleton />
        ) : (
          <>
            {/* 테이블 헤더 */}
            <div className="flex items-center gap-2 px-3 pb-2 border-b">
              <div className="flex-1 text-[10px] font-medium text-muted-foreground">
                서브그룹
              </div>
              <div className="w-20 flex justify-end">
                <SortButton label="멤버 수" sortKeyValue="member_count" currentSortKey={sortKey} onSort={handleSort} />
              </div>
              <div className="w-24 flex justify-end">
                <SortButton label="이번 달 활동" sortKeyValue="monthly_post_count" currentSortKey={sortKey} onSort={handleSort} />
              </div>
              <div className="w-20 flex justify-end">
                <SortButton label="최근 활동" sortKeyValue="last_activity_at" currentSortKey={sortKey} onSort={handleSort} />
              </div>
              <div className="w-4" />
            </div>

            {/* 테이블 행 */}
            <div className="divide-y">
              {sorted.map((perf, idx) => (
                <PerformanceRow
                  key={perf.id}
                  perf={perf}
                  rank={idx + 1}
                  isTopRanked={sortDesc && idx === 0}
                />
              ))}
            </div>

            {/* 요약 통계 */}
            <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-3">
              <SummaryCard
                label="총 멤버"
                value={performances.reduce((s, p) => s + p.member_count, 0).toString()}
                icon={<Users className="h-3 w-3 text-blue-500" />}
              />
              <SummaryCard
                label="이번 달 총 게시글"
                value={performances.reduce((s, p) => s + p.monthly_post_count, 0).toString()}
                icon={<FileText className="h-3 w-3 text-purple-500" />}
              />
              <SummaryCard
                label="활성 서브그룹"
                value={performances
                  .filter((p) => {
                    if (!p.last_activity_at) return false;
                    const diffDays = Math.floor(
                      (new Date().getTime() - new Date(p.last_activity_at).getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return diffDays <= 30;
                  })
                  .length.toString()}
                icon={<Clock className="h-3 w-3 text-green-500" />}
                suffix={`/ ${performances.length}`}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PerformanceRow({
  perf,
  rank,
  isTopRanked,
}: {
  perf: SubgroupPerformance;
  rank: number;
  isTopRanked: boolean;
}) {
  return (
    <Link
      href={`/groups/${perf.id}`}
      className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors group"
    >
      {/* 순위 */}
      <div className="w-5 shrink-0 text-center">
        <span
          className={`text-xs font-bold ${
            rank === 1 && isTopRanked
              ? "text-yellow-500"
              : rank === 2 && isTopRanked
              ? "text-gray-400"
              : rank === 3 && isTopRanked
              ? "text-amber-600"
              : "text-muted-foreground"
          }`}
        >
          {rank}
        </span>
      </div>

      {/* 그룹 이름 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {perf.name}
          </span>
          {perf.group_type && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 font-normal border-0 bg-muted shrink-0"
            >
              {perf.group_type}
            </Badge>
          )}
        </div>
        {perf.description && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {perf.description}
          </p>
        )}
      </div>

      {/* 멤버 수 */}
      <div className="w-20 flex items-center justify-end gap-1 shrink-0">
        <Users className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{perf.member_count}명</span>
      </div>

      {/* 이번 달 게시글 */}
      <div className="w-24 flex items-center justify-end gap-1 shrink-0">
        <FileText className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{perf.monthly_post_count}건</span>
      </div>

      {/* 최근 활동일 */}
      <div className="w-20 flex items-center justify-end gap-1 shrink-0">
        <Clock className={`h-3 w-3 ${getActivityColor(perf.last_activity_at)}`} />
        <span className={`text-xs ${getActivityColor(perf.last_activity_at)}`}>
          {formatLastActivity(perf.last_activity_at)}
        </span>
      </div>

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
    </Link>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  suffix,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  suffix?: string;
}) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2">
      <div className="flex items-center gap-1 mb-0.5">
        {icon}
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-semibold">{value}</span>
        {suffix && <span className="text-[11px] text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
