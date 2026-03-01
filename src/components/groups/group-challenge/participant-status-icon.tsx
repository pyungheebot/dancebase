import { Circle, Clock, CheckCircle2 } from "lucide-react";
import type { DanceGroupChallengeParticipantStatus } from "@/types";

const ICON_MAP: Record<
  DanceGroupChallengeParticipantStatus,
  React.ReactElement
> = {
  not_started: <Circle className="h-3 w-3 text-gray-400" aria-hidden="true" />,
  in_progress: <Clock className="h-3 w-3 text-blue-500" aria-hidden="true" />,
  completed: <CheckCircle2 className="h-3 w-3 text-green-500" aria-hidden="true" />,
};

export function ParticipantStatusIcon({
  status,
}: {
  status: DanceGroupChallengeParticipantStatus;
}) {
  return ICON_MAP[status];
}
