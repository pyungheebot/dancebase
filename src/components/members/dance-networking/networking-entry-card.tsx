"use client";

// ============================================
// dance-networking/networking-entry-card.tsx
// 단일 연락처 카드 (React.memo 적용)
// ============================================

import { memo, useState } from "react";
import {
  Star,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Music,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  ROLE_LABEL,
  ROLE_COLOR,
  SNS_PLATFORM_LABEL,
} from "@/hooks/use-dance-networking";
import type { DanceNetworkingEntry } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================
// Props
// ============================================

type NetworkingEntryCardProps = {
  entry: DanceNetworkingEntry;
  onEdit: (entry: DanceNetworkingEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
};

// ============================================
// 컴포넌트
// ============================================

export const NetworkingEntryCard = memo(function NetworkingEntryCard({
  entry,
  onEdit,
  onDelete,
  onToggleFavorite,
}: NetworkingEntryCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="border rounded-md bg-card overflow-hidden">
        {/* 헤더 행 */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* 즐겨찾기 버튼 */}
          <button
            type="button"
            className={cn(
              "shrink-0 transition-colors",
              entry.isFavorite
                ? "text-yellow-400 hover:text-yellow-500"
                : "text-gray-300 hover:text-yellow-400"
            )}
            onClick={() => onToggleFavorite(entry.id)}
            aria-label={entry.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            aria-pressed={entry.isFavorite}
          >
            <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
          </button>

          {/* 이름 + 역할 배지 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-medium text-gray-900 truncate">
                {entry.name}
              </span>
              <Badge
                className={cn(
                  "text-[10px] px-1.5 py-0 border-0",
                  ROLE_COLOR[entry.role]
                )}
                aria-label={`역할: ${ROLE_LABEL[entry.role]}`}
              >
                {ROLE_LABEL[entry.role]}
              </Badge>
            </div>
            {entry.affiliation && (
              <p className="text-[10px] text-gray-500 truncate mt-0.5">
                {entry.affiliation}
              </p>
            )}
          </div>

          {/* 장르 태그 (최대 2개, 데스크탑만) */}
          {entry.genres.length > 0 && (
            <div
              className="hidden sm:flex gap-1 shrink-0"
              role="list"
              aria-label="장르"
            >
              {entry.genres.slice(0, 2).map((g) => (
                <Badge
                  key={g}
                  role="listitem"
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 text-gray-600"
                >
                  {g}
                </Badge>
              ))}
              {entry.genres.length > 2 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 text-gray-400"
                  aria-label={`외 ${entry.genres.length - 2}개 장르`}
                >
                  +{entry.genres.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center gap-0.5 shrink-0" role="group" aria-label="연락처 액션">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
              onClick={() => onEdit(entry)}
              aria-label={`${entry.name} 수정`}
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
              onClick={() => onDelete(entry.id)}
              aria-label={`${entry.name} 삭제`}
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </Button>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400"
                aria-label={expanded ? "상세 정보 접기" : "상세 정보 펼치기"}
                aria-expanded={expanded}
              >
                {expanded ? (
                  <ChevronUp className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-3 w-3" aria-hidden="true" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 펼침 상세 */}
        <CollapsibleContent>
          <div
            className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-2"
            aria-label={`${entry.name} 상세 정보`}
          >
            {/* 장르 */}
            {entry.genres.length > 0 && (
              <div className="flex items-start gap-1.5">
                <Music className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" aria-hidden="true" />
                <div
                  className="flex flex-wrap gap-1"
                  role="list"
                  aria-label="전문 장르"
                >
                  {entry.genres.map((g) => (
                    <Badge
                      key={g}
                      role="listitem"
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 전화 */}
            {entry.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-gray-400 shrink-0" aria-hidden="true" />
                <span className="text-xs text-gray-700">
                  <span className="sr-only">전화번호: </span>
                  {entry.phone}
                </span>
              </div>
            )}

            {/* 이메일 */}
            {entry.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-gray-400 shrink-0" aria-hidden="true" />
                <span className="text-xs text-gray-700">
                  <span className="sr-only">이메일: </span>
                  {entry.email}
                </span>
              </div>
            )}

            {/* SNS */}
            {entry.snsAccounts.length > 0 && (
              <div className="space-y-1" role="list" aria-label="SNS 계정">
                {entry.snsAccounts.map((sns, idx) => (
                  <div key={idx} className="flex items-center gap-1.5" role="listitem">
                    <ExternalLink className="h-3 w-3 text-gray-400 shrink-0" aria-hidden="true" />
                    <span className="text-[10px] text-gray-500">
                      {SNS_PLATFORM_LABEL[sns.platform]}
                    </span>
                    <span className="text-xs text-blue-600" aria-label={`${SNS_PLATFORM_LABEL[sns.platform]}: ${sns.handle}`}>
                      {sns.handle}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 만남 정보 */}
            {(entry.metAt || entry.metDate) && (
              <div className="flex flex-wrap gap-3">
                {entry.metAt && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-gray-400 shrink-0" aria-hidden="true" />
                    <span className="text-xs text-gray-700">
                      <span className="sr-only">만남 장소: </span>
                      {entry.metAt}
                    </span>
                  </div>
                )}
                {entry.metDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-gray-400 shrink-0" aria-hidden="true" />
                    <span className="text-xs text-gray-700">
                      <span className="sr-only">만난 날짜: </span>
                      {formatYearMonthDay(entry.metDate)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 메모 */}
            {entry.notes && (
              <p className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5 leading-relaxed">
                <span className="sr-only">메모: </span>
                {entry.notes}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});
