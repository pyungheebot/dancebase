"use client";

import { useState } from "react";
import { MapPin, Heart, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePracticeVenue } from "@/hooks/use-practice-venue";
import { AddVenueDialog } from "./practice-venue-add-dialog";
import { VenueItem } from "./practice-venue-item";
import { StatsBanner } from "./practice-venue-stats-banner";
import { ALL_FACILITIES, FACILITY_LABELS, STATUS_LABELS } from "./practice-venue-types";
import type { PracticeVenueFacility, PracticeVenueStatus } from "@/types";

interface PracticeVenueCardProps {
  groupId: string;
}

export function PracticeVenueCard({ groupId }: PracticeVenueCardProps) {
  const [open, setOpen] = useState(true);
  const [facilityFilter, setFacilityFilter] = useState<PracticeVenueFacility | "all">("all");
  const [statusFilter, setStatusFilter] = useState<PracticeVenueStatus | "all">("all");
  const [showFavoriteOnly, setShowFavoriteOnly] = useState(false);

  const {
    entries,
    loading,
    addVenue,
    deleteVenue,
    rateVenue,
    toggleFavorite,
    updateStatus,
    filterByFacility,
    stats,
  } = usePracticeVenue(groupId);

  // 필터링
  let filtered = filterByFacility(facilityFilter);
  if (statusFilter !== "all") {
    filtered = filtered.filter((e) => e.status === statusFilter);
  }
  if (showFavoriteOnly) {
    filtered = filtered.filter((e) => e.isFavorite);
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-teal-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-gray-800">연습 장소 관리</h2>
          {stats.totalVenues > 0 && (
            <Badge
              className="bg-teal-100 text-[10px] px-1.5 py-0 text-teal-700 hover:bg-teal-100"
              aria-label={`등록된 장소 ${stats.totalVenues}개`}
            >
              {stats.totalVenues}
            </Badge>
          )}
        </div>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            aria-label={open ? "연습 장소 관리 접기" : "연습 장소 관리 펼치기"}
            aria-expanded={open}
            aria-controls="practice-venue-content"
          >
            {open ? (
              <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
            )}
          </Button>
        </CollapsibleTrigger>
      </div>

      {/* 본문 */}
      <CollapsibleContent id="practice-venue-content">
        <Card className="rounded-t-none border-t-0 shadow-none">
          <CardHeader className="px-4 pb-2 pt-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xs text-gray-500 font-normal">
                그룹이 사용하는 연습 장소를 등록하고 관리하세요.
              </CardTitle>
              <AddVenueDialog onAdd={addVenue} />
            </div>
            <StatsBanner stats={stats} />
          </CardHeader>

          <CardContent className="px-4 pb-4 space-y-3">
            {/* 필터 영역 */}
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="장소 필터"
            >
              {/* 시설 필터 */}
              <Select
                value={facilityFilter}
                onValueChange={(v) => setFacilityFilter(v as PracticeVenueFacility | "all")}
              >
                <SelectTrigger
                  className="h-7 text-xs w-32"
                  aria-label="시설 필터 선택"
                >
                  <SelectValue placeholder="시설 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    전체 시설
                  </SelectItem>
                  {ALL_FACILITIES.map((f) => (
                    <SelectItem key={f} value={f} className="text-xs">
                      {FACILITY_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 상태 필터 */}
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as PracticeVenueStatus | "all")}
              >
                <SelectTrigger
                  className="h-7 text-xs w-28"
                  aria-label="예약 상태 필터 선택"
                >
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    전체 상태
                  </SelectItem>
                  {(Object.keys(STATUS_LABELS) as PracticeVenueStatus[]).map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 즐겨찾기 필터 */}
              <Button
                variant={showFavoriteOnly ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs gap-1"
                aria-pressed={showFavoriteOnly}
                aria-label={showFavoriteOnly ? "즐겨찾기 필터 해제" : "즐겨찾기만 보기"}
                onClick={() => setShowFavoriteOnly((v) => !v)}
              >
                <Heart className="h-3 w-3" aria-hidden="true" />
                즐겨찾기
              </Button>
            </div>

            <Separator />

            {/* 장소 목록 */}
            {loading ? (
              <div
                className="flex items-center justify-center py-8"
                role="status"
                aria-live="polite"
                aria-label="장소 목록 불러오는 중"
              >
                <span className="text-xs text-gray-400">불러오는 중...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-1 py-8 text-gray-400"
                role="status"
                aria-live="polite"
              >
                <MapPin className="h-8 w-8 opacity-30" aria-hidden="true" />
                <p className="text-xs">
                  {entries.length === 0
                    ? "등록된 연습 장소가 없습니다."
                    : "필터 조건에 맞는 장소가 없습니다."}
                </p>
                {entries.length === 0 && (
                  <p className="text-[10px] text-gray-300">
                    위 &apos;장소 추가&apos; 버튼으로 첫 장소를 등록해보세요.
                  </p>
                )}
              </div>
            ) : (
              <div
                className="space-y-2"
                role="list"
                aria-label={`연습 장소 목록 (${filtered.length}개)`}
                aria-live="polite"
              >
                {filtered.map((venue) => (
                  <div key={venue.id} role="listitem">
                    <VenueItem
                      venue={venue}
                      onDelete={deleteVenue}
                      onToggleFavorite={toggleFavorite}
                      onRate={rateVenue}
                      onUpdateStatus={updateStatus}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
