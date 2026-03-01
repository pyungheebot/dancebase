"use client";

import { Sparkles, CheckCircle2 } from "lucide-react";
import { useGroupWishlistV2 } from "@/hooks/use-group-wishlist-v2";

interface StatsRowProps {
  stats: ReturnType<typeof useGroupWishlistV2>["stats"];
}

export function StatsRow({ stats }: StatsRowProps) {
  if (stats.total === 0) return null;

  return (
    <dl
      className="flex flex-wrap gap-3 rounded-md bg-gray-50 px-3 py-2"
      aria-label="위시리스트 통계"
    >
      <div className="flex items-center gap-1">
        <Sparkles className="h-3 w-3 text-violet-400" aria-hidden="true" />
        <dt className="sr-only">총 항목 수</dt>
        <dd className="text-[11px] text-gray-500">
          총 <span className="font-semibold text-gray-700">{stats.total}</span>개
        </dd>
      </div>
      <div className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3 text-green-500" aria-hidden="true" />
        <dt className="sr-only">승인율</dt>
        <dd className="text-[11px] text-gray-500">
          승인율 <span className="font-semibold text-gray-700">{stats.approvalRate}%</span>
        </dd>
      </div>
      <div className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-hidden="true" />
        <dt className="sr-only">완료율</dt>
        <dd className="text-[11px] text-gray-500">
          완료율 <span className="font-semibold text-gray-700">{stats.completionRate}%</span>
        </dd>
      </div>
    </dl>
  );
}
