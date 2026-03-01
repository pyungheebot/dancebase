"use client";

// ============================================
// 시설 완료율 프로그레스 바
// ============================================

import type { VenueMgmtFacility } from "@/types";

interface FacilityProgressProps {
  facilities: VenueMgmtFacility[];
}

export function FacilityProgress({ facilities }: FacilityProgressProps) {
  const total = facilities.length;
  const available = facilities.filter((f) => f.available).length;
  const rate = total > 0 ? Math.round((available / total) * 100) : 0;

  return (
    <div className="space-y-1" role="group" aria-label="시설 완료율">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-500" id="facility-progress-label">
          시설 완료율
        </span>
        <span
          className="text-[10px] font-medium text-gray-700"
          aria-live="polite"
          aria-atomic="true"
        >
          {available} / {total} ({rate}%)
        </span>
      </div>
      <div
        className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={rate}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-labelledby="facility-progress-label"
      >
        <div
          className="h-full rounded-full bg-purple-500 transition-all duration-300"
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  );
}
