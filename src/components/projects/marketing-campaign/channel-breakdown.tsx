"use client";

import { Badge } from "@/components/ui/badge";
import type { MarketingChannel } from "@/types";
import { CHANNEL_LABELS, CHANNEL_BADGE_CLASS } from "./types";
import { ChannelIcon } from "./channel-icon";

type ChannelBreakdownItem = {
  channel: MarketingChannel;
  total: number;
  done: number;
};

type ChannelBreakdownProps = {
  breakdown: ChannelBreakdownItem[];
};

export function ChannelBreakdown({ breakdown }: ChannelBreakdownProps) {
  if (breakdown.length === 0) return null;

  return (
    <section aria-label="채널별 분포" className="space-y-1.5">
      <p className="text-xs font-medium text-gray-600" aria-hidden="true">
        채널별 분포
      </p>
      <dl className="space-y-1">
        {breakdown.map(({ channel, total, done }) => {
          const rate = Math.round((done / total) * 100);
          return (
            <div key={channel} className="flex items-center gap-2">
              <dt>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 gap-0.5 shrink-0 w-20 justify-center ${CHANNEL_BADGE_CLASS[channel]}`}
                >
                  <ChannelIcon channel={channel} />
                  <span className="ml-0.5 truncate">
                    {CHANNEL_LABELS[channel]}
                  </span>
                </Badge>
              </dt>
              <dd className="flex flex-1 items-center gap-2">
                <div
                  className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={rate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${CHANNEL_LABELS[channel]} 완료율 ${rate}%`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 shrink-0 w-12 text-right">
                  {done}/{total} ({rate}%)
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
