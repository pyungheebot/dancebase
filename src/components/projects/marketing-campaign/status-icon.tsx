"use client";

import { Circle, Loader, CheckCircle2 } from "lucide-react";
import type { MarketingCampaignTask } from "@/types";
import { STATUS_LABELS } from "./types";

type StatusIconProps = {
  status: MarketingCampaignTask["status"];
};

export function StatusIcon({ status }: StatusIconProps) {
  const cls = "h-3.5 w-3.5";
  const label = STATUS_LABELS[status];

  switch (status) {
    case "todo":
      return (
        <Circle
          className={`${cls} text-blue-500`}
          aria-label={label}
          role="img"
        />
      );
    case "in_progress":
      return (
        <Loader
          className={`${cls} text-yellow-500`}
          aria-label={label}
          role="img"
        />
      );
    case "done":
      return (
        <CheckCircle2
          className={`${cls} text-green-500`}
          aria-label={label}
          role="img"
        />
      );
  }
}
