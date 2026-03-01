"use client";

// ============================================================
// 포스터 관리 - 통계 요약 컴포넌트
// ============================================================

interface PosterStatsProps {
  totalProjects: number;
  totalVersions: number;
  approvedVersions: number;
}

export function PosterStats({
  totalProjects,
  totalVersions,
  approvedVersions,
}: PosterStatsProps) {
  return (
    <div
      className="grid grid-cols-3 gap-2"
      role="region"
      aria-label="포스터 관리 통계"
    >
      <div className="bg-card rounded p-2 text-center border">
        <p
          className="text-sm font-semibold text-gray-800"
          aria-label={`포스터 ${totalProjects}개`}
        >
          {totalProjects}
        </p>
        <p className="text-[10px] text-gray-500" aria-hidden="true">
          포스터
        </p>
      </div>
      <div className="bg-card rounded p-2 text-center border">
        <p
          className="text-sm font-semibold text-gray-800"
          aria-label={`총 버전 ${totalVersions}개`}
        >
          {totalVersions}
        </p>
        <p className="text-[10px] text-gray-500" aria-hidden="true">
          총 버전
        </p>
      </div>
      <div className="bg-card rounded p-2 text-center border">
        <p
          className="text-sm font-semibold text-green-600"
          aria-label={`승인/확정 ${approvedVersions}개`}
        >
          {approvedVersions}
        </p>
        <p className="text-[10px] text-gray-500" aria-hidden="true">
          승인/확정
        </p>
      </div>
    </div>
  );
}
