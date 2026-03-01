"use client";

// ============================================
// 공연장 카드 아이템 (React.memo)
// ============================================

import { memo, useState, useMemo } from "react";
import {
  Building2,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  Phone,
  Mail,
  Bus,
  Car,
  Clock,
  Banknote,
  FileText,
  MoreVertical,
  Check,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FacilityProgress } from "./facility-progress";
import {
  BOOKING_STATUS_CONFIG,
  BOOKING_STATUS_OPTIONS,
  type VenueItemProps,
} from "./types";

export const VenueItem = memo(function VenueItem({
  venue,
  onEdit,
  onDelete,
  onToggleFacility,
  onChangeBookingStatus,
}: VenueItemProps) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = BOOKING_STATUS_CONFIG[venue.rental.bookingStatus];

  const _facilityGroups = useMemo(() => {
    const available = venue.facilities.filter((f) => f.available);
    const unavailable = venue.facilities.filter((f) => !f.available);
    return { available, unavailable };
  }, [venue.facilities]);

  const expandButtonId = `venue-expand-${venue.id}`;
  const detailRegionId = `venue-detail-${venue.id}`;

  function handleCycleBookingStatus() {
    const next =
      BOOKING_STATUS_OPTIONS[
        (BOOKING_STATUS_OPTIONS.indexOf(venue.rental.bookingStatus) + 1) %
          BOOKING_STATUS_OPTIONS.length
      ];
    onChangeBookingStatus(venue.id, next);
  }

  return (
    <article
      className="rounded-lg border border-gray-200 bg-card overflow-hidden"
      aria-label={`공연장: ${venue.name}`}
    >
      {/* 헤더 */}
      <div className="px-3 py-2.5 flex items-start gap-2">
        <Building2
          className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-gray-900 leading-tight">
              {venue.name}
            </span>
            <Badge
              className={`text-[10px] px-1.5 py-0 border cursor-pointer ${statusCfg.badgeColor}`}
              onClick={handleCycleBookingStatus}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCycleBookingStatus();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`예약 상태: ${statusCfg.label}. 클릭하여 변경`}
              aria-pressed={undefined}
            >
              {statusCfg.label}
            </Badge>
          </div>

          {venue.address && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-2.5 w-2.5 text-gray-400" aria-hidden="true" />
              <span className="text-[10px] text-gray-500 truncate">
                {venue.address}
              </span>
            </div>
          )}

          <dl className="flex items-center gap-3 mt-0.5 flex-wrap">
            {venue.capacity != null && (
              <div className="flex items-center gap-0.5">
                <Users className="h-2.5 w-2.5 text-gray-500" aria-hidden="true" />
                <dt className="sr-only">수용 인원</dt>
                <dd className="text-[10px] text-gray-500">
                  {venue.capacity.toLocaleString()}명
                </dd>
              </div>
            )}
            {(venue.stageSize.width != null ||
              venue.stageSize.depth != null) && (
              <div className="flex items-center gap-0.5">
                <dt className="sr-only">무대 크기</dt>
                <dd className="text-[10px] text-gray-500">
                  무대{" "}
                  {venue.stageSize.width != null
                    ? `${venue.stageSize.width}m`
                    : "?"}
                  {" x "}
                  {venue.stageSize.depth != null
                    ? `${venue.stageSize.depth}m`
                    : "?"}
                </dd>
              </div>
            )}
            {venue.rental.fee != null && (
              <div className="flex items-center gap-0.5">
                <Banknote className="h-2.5 w-2.5 text-gray-500" aria-hidden="true" />
                <dt className="sr-only">대관료</dt>
                <dd className="text-[10px] text-gray-500">
                  {venue.rental.fee.toLocaleString()}원
                </dd>
              </div>
            )}
            {(venue.rental.entryTime || venue.rental.exitTime) && (
              <div className="flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5 text-gray-500" aria-hidden="true" />
                <dt className="sr-only">입퇴장 시간</dt>
                <dd className="text-[10px] text-gray-500">
                  <time dateTime={venue.rental.entryTime || undefined}>
                    {venue.rental.entryTime || "??"}
                  </time>
                  {" ~ "}
                  <time dateTime={venue.rental.exitTime || undefined}>
                    {venue.rental.exitTime || "??"}
                  </time>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* 우측 버튼 */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            id={expandButtonId}
            onClick={() => setExpanded((v) => !v)}
            className="text-gray-400 hover:text-gray-600 p-0.5"
            aria-expanded={expanded}
            aria-controls={detailRegionId}
            aria-label={expanded ? "공연장 상세 접기" : "공연장 상세 펼치기"}
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="text-gray-400 hover:text-gray-600 p-0.5"
                aria-label={`${venue.name} 메뉴`}
              >
                <MoreVertical className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem
                className="text-xs gap-1.5"
                onClick={() => onEdit(venue)}
              >
                <Pencil className="h-3 w-3" aria-hidden="true" />
                수정
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs gap-1.5 text-red-600 focus:text-red-600"
                onClick={() => onDelete(venue.id)}
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 시설 완료율 바 (항상 표시) */}
      {venue.facilities.length > 0 && (
        <div className="px-3 pb-2">
          <FacilityProgress facilities={venue.facilities} />
        </div>
      )}

      {/* 상세 정보 (펼침) */}
      <section
        id={detailRegionId}
        aria-labelledby={expandButtonId}
        hidden={!expanded}
      >
        {expanded && (
          <div className="border-t border-gray-100 px-3 py-2.5 space-y-3">
            {/* 시설 체크리스트 */}
            {venue.facilities.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 mb-1.5" id={`facility-list-label-${venue.id}`}>
                  시설 체크리스트
                </p>
                <div
                  className="grid grid-cols-2 gap-x-4 gap-y-1"
                  role="list"
                  aria-labelledby={`facility-list-label-${venue.id}`}
                >
                  {venue.facilities.map((f) => (
                    <button
                      key={f.id}
                      role="listitem"
                      onClick={() => onToggleFacility(venue.id, f.id)}
                      className="flex items-center gap-1.5 text-left"
                      aria-pressed={f.available}
                      aria-label={`${f.name}: ${f.available ? "사용 가능" : "사용 불가"}`}
                    >
                      {f.available ? (
                        <Check
                          className="h-3 w-3 text-green-500 flex-shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <X
                          className="h-3 w-3 text-gray-300 flex-shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className={`text-xs ${
                          f.available ? "text-gray-800" : "text-gray-400"
                        }`}
                      >
                        {f.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 연락처 */}
            {(venue.contact.managerName ||
              venue.contact.phone ||
              venue.contact.email) && (
              <div>
                <p className="text-[10px] text-gray-400 mb-1.5">연락처</p>
                <dl className="space-y-1">
                  {venue.contact.managerName && (
                    <div className="flex items-center gap-1">
                      <dt className="sr-only">담당자</dt>
                      <dd className="text-xs text-gray-700">
                        담당: {venue.contact.managerName}
                      </dd>
                    </div>
                  )}
                  {venue.contact.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-gray-400" aria-hidden="true" />
                      <dt className="sr-only">전화번호</dt>
                      <dd className="text-xs text-gray-700">
                        {venue.contact.phone}
                      </dd>
                    </div>
                  )}
                  {venue.contact.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-gray-400" aria-hidden="true" />
                      <dt className="sr-only">이메일</dt>
                      <dd className="text-xs text-gray-700">
                        {venue.contact.email}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* 무대 도면 메모 */}
            {venue.stageMemo && (
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <FileText className="h-3 w-3 text-gray-400" aria-hidden="true" />
                  <p className="text-[10px] text-gray-400">무대 도면 메모</p>
                </div>
                <p className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-2">
                  {venue.stageMemo}
                </p>
              </div>
            )}

            {/* 접근 정보 */}
            {(venue.access.transit || venue.access.parking) && (
              <div>
                <p className="text-[10px] text-gray-400 mb-1.5">접근 정보</p>
                <dl className="space-y-1.5">
                  {venue.access.transit && (
                    <div className="flex gap-1.5">
                      <Bus
                        className="h-3 w-3 text-blue-400 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <dt className="sr-only">대중교통</dt>
                      <dd className="text-xs text-gray-700">
                        {venue.access.transit}
                      </dd>
                    </div>
                  )}
                  {venue.access.parking && (
                    <div className="flex gap-1.5">
                      <Car
                        className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <dt className="sr-only">주차</dt>
                      <dd className="text-xs text-gray-700">
                        {venue.access.parking}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        )}
      </section>
    </article>
  );
});

VenueItem.displayName = "VenueItem";
