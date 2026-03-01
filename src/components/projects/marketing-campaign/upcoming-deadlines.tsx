"use client";

import type { MarketingCampaignTask } from "@/types";

type UpcomingDeadlinesProps = {
  deadlines: MarketingCampaignTask[];
};

export function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  if (deadlines.length === 0) return null;

  return (
    <div
      className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md"
      role="alert"
      aria-live="polite"
      aria-label={`7일 이내 마감 태스크 ${deadlines.length}개`}
    >
      <p className="text-[10px] font-medium text-amber-700 mb-1">
        7일 이내 마감 태스크 ({deadlines.length}개)
      </p>
      <ul className="space-y-0.5" role="list">
        {deadlines.slice(0, 3).map((task) => (
          <li
            key={task.id}
            className="flex items-center justify-between text-[10px] text-amber-600"
            role="listitem"
          >
            <span className="truncate max-w-[60%]">{task.title}</span>
            <time dateTime={task.dueDate ?? undefined}>{task.dueDate}</time>
          </li>
        ))}
        {deadlines.length > 3 && (
          <li className="text-[10px] text-amber-500" role="listitem">
            +{deadlines.length - 3}개 더
          </li>
        )}
      </ul>
    </div>
  );
}
