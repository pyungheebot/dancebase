import type { ProgramSectionType } from "./types";
import { SECTION_TYPE_ICON_MAP } from "./types";

interface SectionTypeIconProps {
  type: ProgramSectionType;
  className?: string;
}

export function SectionTypeIcon({
  type,
  className,
}: SectionTypeIconProps) {
  const cls = className ?? "h-3.5 w-3.5";
  const Icon = SECTION_TYPE_ICON_MAP[type];
  return <Icon className={cls} aria-hidden="true" />;
}
