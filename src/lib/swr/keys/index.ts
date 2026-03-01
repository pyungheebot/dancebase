// SWR 캐시 키 팩토리 — 도메인별 분리 후 조합
import { groupKeys } from "./group";
import { scheduleKeys } from "./schedule";
import { boardKeys } from "./board";
import { financeKeys } from "./finance";
import { memberKeys } from "./member";
import { projectKeys } from "./project";
import { dashboardKeys } from "./dashboard";

export const swrKeys = {
  ...groupKeys,
  ...scheduleKeys,
  ...boardKeys,
  ...financeKeys,
  ...memberKeys,
  ...projectKeys,
  ...dashboardKeys,
};
