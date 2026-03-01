"use client";

import { memo } from "react";

// ============================================
// 버전 통계 요약
// ============================================

export interface VersionStatsProps {
  totalVersions: number;
  draftCount: number;
  reviewCount: number;
  approvedCount: number;
  archivedCount: number;
}

export const VersionStats = memo(function VersionStats({
  totalVersions,
  draftCount,
  reviewCount,
  approvedCount,
  archivedCount,
}: VersionStatsProps) {
  return (
    <dl
      className="flex flex-wrap gap-2 pt-1 border-t"
      aria-label="버전 상태 통계"
    >
      <div className="flex items-center gap-1">
        <dt className="sr-only">전체</dt>
        <dd className="text-[10px] text-muted-foreground">
          전체 {totalVersions}개
        </dd>
      </div>
      {draftCount > 0 && (
        <div className="flex items-center gap-1">
          <dt className="sr-only">초안</dt>
          <dd className="text-[10px] text-gray-600">초안 {draftCount}</dd>
        </div>
      )}
      {reviewCount > 0 && (
        <div className="flex items-center gap-1">
          <dt className="sr-only">검토중</dt>
          <dd className="text-[10px] text-yellow-600">검토중 {reviewCount}</dd>
        </div>
      )}
      {approvedCount > 0 && (
        <div className="flex items-center gap-1">
          <dt className="sr-only">확정</dt>
          <dd className="text-[10px] text-green-600">확정 {approvedCount}</dd>
        </div>
      )}
      {archivedCount > 0 && (
        <div className="flex items-center gap-1">
          <dt className="sr-only">보관</dt>
          <dd className="text-[10px] text-blue-600">보관 {archivedCount}</dd>
        </div>
      )}
    </dl>
  );
});
