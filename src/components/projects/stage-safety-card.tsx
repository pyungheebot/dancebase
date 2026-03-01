"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Plus, AlertTriangle, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useStageSafety } from "@/hooks/use-stage-safety";

// 서브파일 import
import { SafetyStats } from "./stage-safety/safety-stats";
import { InspectionCard } from "./stage-safety/inspection-card";
import { CreateInspectionDialog } from "./stage-safety/create-inspection-dialog";

// ============================================================
// 메인 카드 컨테이너
// ============================================================

export function StageSafetyCard({ projectId }: { projectId: string }) {
  const {
    safetyData,
    loading,
    createInspection,
    deleteInspection,
    addCheckItem,
    updateCheckItem,
    removeCheckItem,
    setOverallStatus,
    totalInspections,
    passRate,
    pendingItems,
  } = useStageSafety(projectId);

  const [createOpen, setCreateOpen] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            무대 안전 점검
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            role="status"
            aria-live="polite"
            className="text-xs text-muted-foreground"
          >
            불러오는 중...
          </p>
        </CardContent>
      </Card>
    );
  }

  const inspections = safetyData.inspections;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              무대 안전 점검
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setCreateOpen(true)}
              aria-label="새 안전 점검 생성"
            >
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              점검 생성
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 통계 요약 + 전체 통과율 바 */}
          <SafetyStats
            totalInspections={totalInspections}
            passRate={passRate}
            pendingItems={pendingItems}
          />

          {/* 점검 목록 */}
          {inspections.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-8 text-center gap-2"
              role="status"
              aria-live="polite"
            >
              <FileCheck
                className="h-8 w-8 text-muted-foreground/40"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-muted-foreground">
                점검 기록이 없습니다
              </p>
              <p className="text-xs text-muted-foreground/70">
                공연 전 안전 점검을 생성하고 항목별로 결과를 기록하세요.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs mt-1"
                onClick={() => setCreateOpen(true)}
                aria-label="첫 번째 안전 점검 생성"
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                첫 점검 생성
              </Button>
            </div>
          ) : (
            <div
              role="list"
              aria-label="안전 점검 목록"
              className="space-y-2"
            >
              {inspections.map((inspection) => (
                <div key={inspection.id} role="listitem">
                  <InspectionCard
                    inspection={inspection}
                    onDelete={() => {
                      deleteInspection(inspection.id);
                      toast.success(TOAST.STAGE_SAFETY.CHECK_DELETED);
                    }}
                    onStatusChange={(itemId, status) => {
                      updateCheckItem(inspection.id, itemId, { status });
                    }}
                    onRemoveItem={(itemId) => {
                      removeCheckItem(inspection.id, itemId);
                      toast.success(TOAST.ITEM_DELETED);
                    }}
                    onAddItem={(params) => {
                      addCheckItem(inspection.id, params);
                    }}
                    onSetOverall={(status, signedBy) => {
                      setOverallStatus(inspection.id, status, signedBy);
                      toast.success(TOAST.STAGE_SAFETY.RESULT_UPDATED);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 경고: 보류 항목 있을 시 */}
          {pendingItems > 0 && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-center gap-2 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2"
            >
              <AlertTriangle
                className="h-3.5 w-3.5 text-yellow-600 shrink-0"
                aria-hidden="true"
              />
              <p className="text-xs text-yellow-700">
                보류 중인 점검 항목이 {pendingItems}개 있습니다. 공연 전에
                확인하세요.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateInspectionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={createInspection}
      />
    </>
  );
}
