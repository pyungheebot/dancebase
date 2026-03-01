"use client";

// ============================================
// 공연장 관리 카드 (메인 컨테이너)
// ============================================

import { useState, useMemo } from "react";
import { Building2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useVenueManagement,
  type VenueMgmtVenueInput,
} from "@/hooks/use-venue-management";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { VenueMgmtVenue } from "@/types";
import { VenueDialog } from "./venue-management/venue-dialog";
import { VenueItem } from "./venue-management/venue-item";

// ============================================
// Props
// ============================================

interface VenueManagementCardProps {
  projectId: string;
}

// ============================================
// 메인 컴포넌트
// ============================================

export function VenueManagementCard({ projectId }: VenueManagementCardProps) {
  const {
    venues,
    loading,
    addVenue,
    updateVenue,
    deleteVenue,
    toggleFacility,
    updateBookingStatus,
  } = useVenueManagement(projectId);

  const [collapsed, setCollapsed] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VenueMgmtVenue | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const collapseControlId = "venue-management-collapse";
  const listRegionId = "venue-management-list";

  // 전체 통계
  const stats = useMemo(() => {
    const confirmed = venues.filter(
      (v) => v.rental.bookingStatus === "확정"
    ).length;
    const pending = venues.filter(
      (v) => v.rental.bookingStatus === "미확정"
    ).length;
    return { confirmed, pending };
  }, [venues]);

  function handleDelete() {
    if (!deleteConfirmId) return;
    deleteVenue(deleteConfirmId);
    setDeleteConfirmId(null);
  }

  function handleEditSubmit(input: VenueMgmtVenueInput): boolean {
    if (!editTarget) return false;
    return updateVenue(editTarget.id, input);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-xs text-gray-400" aria-live="polite">
            불러오는 중...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Building2
                className="h-4 w-4 text-purple-500"
                aria-hidden="true"
              />
              공연장 관리
              {venues.length > 0 && (
                <span
                  className="ml-1 text-[10px] font-normal text-gray-400"
                  aria-label={`총 ${venues.length}개`}
                >
                  ({venues.length})
                </span>
              )}
            </CardTitle>

            <div className="flex items-center gap-1.5">
              {venues.length > 0 && (
                <div
                  className="flex items-center gap-1"
                  role="group"
                  aria-label="예약 상태 요약"
                >
                  {stats.confirmed > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 border bg-green-100 text-green-700 border-green-200">
                      확정 {stats.confirmed}
                    </Badge>
                  )}
                  {stats.pending > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 border bg-yellow-100 text-yellow-700 border-yellow-200">
                      미확정 {stats.pending}
                    </Badge>
                  )}
                </div>
              )}
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setAddDialogOpen(true)}
                aria-label="공연장 추가"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                추가
              </Button>
              <button
                id={collapseControlId}
                onClick={() => setCollapsed((v) => !v)}
                className="text-gray-400 hover:text-gray-600 p-0.5"
                aria-expanded={!collapsed}
                aria-controls={listRegionId}
                aria-label={collapsed ? "공연장 목록 펼치기" : "공연장 목록 접기"}
              >
                {collapsed ? (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </CardHeader>

        <section
          id={listRegionId}
          aria-labelledby={collapseControlId}
          hidden={collapsed}
        >
          {!collapsed && (
            <CardContent className="px-4 pb-4 space-y-2">
              {venues.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Building2
                    className="h-10 w-10 mx-auto text-gray-200"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-gray-400">
                    아직 등록된 공연장이 없습니다
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setAddDialogOpen(true)}
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" />
                    첫 공연장 추가
                  </Button>
                </div>
              ) : (
                <div
                  className="space-y-2"
                  role="list"
                  aria-label="공연장 목록"
                  aria-live="polite"
                >
                  {venues.map((venue) => (
                    <div key={venue.id} role="listitem">
                      <VenueItem
                        venue={venue}
                        onEdit={(v) => setEditTarget(v)}
                        onDelete={setDeleteConfirmId}
                        onToggleFacility={toggleFacility}
                        onChangeBookingStatus={updateBookingStatus}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </section>
      </Card>

      {/* 추가 다이얼로그 */}
      <VenueDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        initialData={null}
        onSubmit={addVenue}
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <VenueDialog
          open={Boolean(editTarget)}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          initialData={editTarget}
          onSubmit={handleEditSubmit}
        />
      )}

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(v) => !v && setDeleteConfirmId(null)}
        title="공연장 삭제"
        description="공연장을 삭제하시겠습니까?"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
