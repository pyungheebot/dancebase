"use client";

import { Send } from "lucide-react";

interface PressStatsProps {
  stats: {
    total: number;
    draft: number;
    review: number;
    published: number;
    totalOutlets: number;
    publishedOutlets: number;
  };
}

export function PressStats({ stats }: PressStatsProps) {
  return (
    <div className="space-y-2">
      {/* 요약 통계 */}
      <dl
        className="grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg"
        aria-label="보도자료 현황 요약"
      >
        <div className="text-center">
          <dt className="text-xs text-gray-500 mb-0.5">전체</dt>
          <dd className="text-sm font-bold tabular-nums">{stats.total}</dd>
        </div>
        <div className="text-center border-l border-gray-200">
          <dt className="text-xs text-gray-500 mb-0.5">작성중</dt>
          <dd className="text-sm font-bold tabular-nums text-gray-600">
            {stats.draft}
          </dd>
        </div>
        <div className="text-center border-l border-gray-200">
          <dt className="text-xs text-gray-500 mb-0.5">검토중</dt>
          <dd className="text-sm font-bold tabular-nums text-yellow-600">
            {stats.review}
          </dd>
        </div>
        <div className="text-center border-l border-gray-200">
          <dt className="text-xs text-gray-500 mb-0.5">배포완료</dt>
          <dd className="text-sm font-bold tabular-nums text-green-600">
            {stats.published}
          </dd>
        </div>
      </dl>

      {/* 매체 게재 현황 */}
      {stats.totalOutlets > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg"
          role="status"
          aria-live="polite"
          aria-label={`총 ${stats.totalOutlets}개 매체 중 ${stats.publishedOutlets}개 게재 완료`}
        >
          <Send className="h-3.5 w-3.5 text-indigo-400 shrink-0" aria-hidden="true" />
          <span className="text-xs text-indigo-700">
            총 {stats.totalOutlets}개 매체 중{" "}
            <span className="font-semibold">{stats.publishedOutlets}개</span>{" "}
            게재 완료
          </span>
        </div>
      )}
    </div>
  );
}
