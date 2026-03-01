/**
 * 관객 안내 매뉴얼 - 공유 타입, 상수, 서브컴포넌트
 *
 * audience-guide-card.tsx 분할 시 공유되는 요소를 모아둔 모듈.
 * React 컴포넌트(SectionTypeBadge)도 여기에 포함하여 순환 참조를 방지한다.
 */

"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Car,
  Armchair,
  TriangleAlert,
  Heart,
  Siren,
  CircleHelp,
  AlignLeft,
} from "lucide-react";
import {
  SECTION_TYPE_LABELS,
  SECTION_TYPE_COLORS,
} from "@/hooks/use-audience-guide";
import type { AudienceGuideSectionType } from "@/types";

// ============================================================
// 상수
// ============================================================

/** 섹션 유형별 아이콘 맵 */
export const SECTION_TYPE_ICONS: Record<
  AudienceGuideSectionType,
  React.ReactNode
> = {
  location: <MapPin className="h-3 w-3" />,
  parking: <Car className="h-3 w-3" />,
  seating: <Armchair className="h-3 w-3" />,
  caution: <TriangleAlert className="h-3 w-3" />,
  etiquette: <Heart className="h-3 w-3" />,
  emergency: <Siren className="h-3 w-3" />,
  faq: <CircleHelp className="h-3 w-3" />,
  general: <AlignLeft className="h-3 w-3" />,
};

/** 섹션 유형 선택용 전체 목록 */
export const ALL_SECTION_TYPES: AudienceGuideSectionType[] = [
  "location",
  "parking",
  "seating",
  "caution",
  "etiquette",
  "emergency",
  "faq",
  "general",
];

// ============================================================
// 서브 컴포넌트: 섹션 유형 배지
// ============================================================

/** 섹션 유형에 맞는 색상 배지를 렌더링 */
export function SectionTypeBadge({
  type,
}: {
  type: AudienceGuideSectionType;
}) {
  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 flex items-center gap-1 ${SECTION_TYPE_COLORS[type]}`}
    >
      {SECTION_TYPE_ICONS[type]}
      {SECTION_TYPE_LABELS[type]}
    </Badge>
  );
}
