"use client";

import { memo, useState } from "react";
import {
  MapPin,
  Heart,
  Phone,
  Globe,
  Users,
  Maximize2,
  Trash2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarDisplay } from "./practice-venue-star-rating";
import { RateVenueDialog } from "./practice-venue-rate-dialog";
import { StatusEditor } from "./practice-venue-status-editor";
import { FACILITY_LABELS } from "./practice-venue-types";
import type { PracticeVenueEntry, PracticeVenueStatus } from "@/types";

interface VenueItemProps {
  venue: PracticeVenueEntry;
  onDelete: (id: string) => Promise<void>;
  onToggleFavorite: (id: string) => Promise<void>;
  onRate: (id: string, rating: number) => Promise<void>;
  onUpdateStatus: (id: string, status: PracticeVenueStatus) => Promise<void>;
}

export const VenueItem = memo(function VenueItem({
  venue,
  onDelete,
  onToggleFavorite,
  onRate,
  onUpdateStatus,
}: VenueItemProps) {
  const [expanded, setExpanded] = useState(false);

  const handleDelete = async () => {
    await onDelete(venue.id);
    toast.success("연습 장소가 삭제되었습니다.");
  };

  const handleToggleFavorite = async () => {
    await onToggleFavorite(venue.id);
  };

  return (
    <article
      className="rounded-lg border border-gray-100 bg-card shadow-sm"
      aria-label={`연습 장소: ${venue.name}`}
    >
      {/* 헤더 행 */}
      <div className="flex items-start gap-2 p-3">
        {/* 즐겨찾기 버튼 */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          className="mt-0.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          aria-label={venue.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          aria-pressed={venue.isFavorite}
        >
          <Heart
            aria-hidden="true"
            className={`h-3.5 w-3.5 transition-colors ${
              venue.isFavorite
                ? "text-red-500 fill-red-500"
                : "text-gray-300 fill-none"
            }`}
          />
        </button>

        {/* 장소 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-800 truncate">
              {venue.name}
            </span>
            <StatusEditor venue={venue} onUpdateStatus={onUpdateStatus} />
          </div>

          {venue.address && (
            <p className="mt-0.5 flex items-center gap-0.5 text-[10px] text-gray-400 truncate">
              <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
              {venue.address}
            </p>
          )}

          {/* 별점 & 비용 */}
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {venue.rating != null ? (
              <div className="flex items-center gap-1">
                <StarDisplay value={venue.rating} size="sm" />
                <span className="text-[10px] text-gray-500">
                  {venue.rating.toFixed(1)} ({venue.ratingCount})
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-gray-400">평점 없음</span>
            )}

            {venue.costPerHour != null && (
              <span className="text-[10px] text-green-700 font-medium">
                {venue.costPerHour.toLocaleString()}원/h
              </span>
            )}

            {venue.capacity != null && (
              <span className="flex items-center gap-0.5 text-[10px] text-blue-600">
                <Users className="h-2.5 w-2.5" aria-hidden="true" />
                {venue.capacity}명
              </span>
            )}

            {venue.size != null && (
              <span className="flex items-center gap-0.5 text-[10px] text-purple-600">
                <Maximize2 className="h-2.5 w-2.5" aria-hidden="true" />
                {venue.size}m²
              </span>
            )}
          </div>

          {/* 시설 배지 */}
          {venue.facilities.length > 0 && (
            <div
              className="mt-1.5 flex flex-wrap gap-1"
              role="list"
              aria-label="시설 목록"
            >
              {venue.facilities.map((f) => (
                <Badge
                  key={f}
                  role="listitem"
                  className="bg-indigo-50 text-[10px] px-1.5 py-0 text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
                >
                  {FACILITY_LABELS[f]}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-gray-300 hover:text-red-500"
            aria-label={`${venue.name} 삭제`}
            onClick={handleDelete}
          >
            <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
            aria-label={expanded ? "상세 정보 닫기" : "상세 정보 보기"}
            aria-expanded={expanded}
            aria-controls={`venue-detail-${venue.id}`}
            onClick={() => setExpanded((v) => !v)}
          >
            <Pencil className="h-2.5 w-2.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 상세 정보 (토글) */}
      {expanded && (
        <div
          id={`venue-detail-${venue.id}`}
          className="border-t border-gray-100 px-3 pb-3 pt-2 space-y-2"
          role="region"
          aria-label={`${venue.name} 상세 정보`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <RateVenueDialog venue={venue} onRate={onRate} />

            {venue.phone && (
              <a
                href={`tel:${venue.phone}`}
                className="flex items-center gap-0.5 text-[10px] text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                aria-label={`전화: ${venue.phone}`}
              >
                <Phone className="h-2.5 w-2.5" aria-hidden="true" />
                {venue.phone}
              </a>
            )}
            {venue.website && (
              <a
                href={venue.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-[10px] text-cyan-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                aria-label={`웹사이트: ${venue.name} (새 탭에서 열림)`}
              >
                <Globe className="h-2.5 w-2.5" aria-hidden="true" />
                웹사이트
              </a>
            )}
          </div>

          {venue.memo && (
            <p className="text-[10px] text-gray-500 italic border-l-2 border-gray-200 pl-2">
              {venue.memo}
            </p>
          )}

          {venue.lastUsedAt && (
            <p className="text-[10px] text-gray-400">
              마지막 이용: {venue.lastUsedAt}
            </p>
          )}
        </div>
      )}
    </article>
  );
});
