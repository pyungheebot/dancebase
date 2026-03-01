// ============================================
// 공연장 관리 - 타입 / 인터페이스 / 상수
// ============================================

import type { VenueMgmtBookingStatus, VenueMgmtVenue } from "@/types";
import type { VenueMgmtVenueInput } from "@/hooks/use-venue-management";

// ============================================
// 상수
// ============================================

export const BOOKING_STATUS_CONFIG: Record<
  VenueMgmtBookingStatus,
  { label: string; badgeColor: string }
> = {
  미확정: {
    label: "미확정",
    badgeColor: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  확정: {
    label: "확정",
    badgeColor: "bg-green-100 text-green-700 border-green-200",
  },
  취소: {
    label: "취소",
    badgeColor: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

export const BOOKING_STATUS_OPTIONS: VenueMgmtBookingStatus[] = [
  "미확정",
  "확정",
  "취소",
];

// ============================================
// 컴포넌트 Props 인터페이스
// ============================================

export interface VenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: VenueMgmtVenue | null;
  onSubmit: (input: VenueMgmtVenueInput) => boolean;
}

export interface VenueItemProps {
  venue: VenueMgmtVenue;
  onEdit: (venue: VenueMgmtVenue) => void;
  onDelete: (id: string) => void;
  onToggleFacility: (venueId: string, facilityId: string) => void;
  onChangeBookingStatus: (
    venueId: string,
    status: VenueMgmtBookingStatus
  ) => void;
}
