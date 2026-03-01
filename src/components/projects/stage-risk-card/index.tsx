"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useStageRisk } from "@/hooks/use-stage-risk";
import { EmptyState } from "@/components/shared/empty-state";
import type {
  StageRiskItem,
  StageRiskCategory,
  StageRiskResponseStatus,
} from "@/types";

import { RiskFormDialog } from "./risk-form-dialog";
import { RiskItemRow } from "./risk-item-row";
import { RiskMatrix } from "./risk-matrix";
import { RiskStats } from "./risk-stats";
import { LEVEL_ORDER, type RiskFormParams } from "./types";

interface StageRiskCardProps {
  projectId: string;
}

export function StageRiskCard({ projectId }: StageRiskCardProps) {
  const {
    items,
    loading,
    stats,
    addItem,
    updateItem,
    deleteItem,
    updateResponseStatus,
  } = useStageRisk(projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StageRiskItem | null>(null);

  const sortedItems = [...items].sort((a, b) => {
    // 미대응 우선, 같으면 레벨 → 점수 내림차순
    if (a.responseStatus === "done" && b.responseStatus !== "done") return 1;
    if (a.responseStatus !== "done" && b.responseStatus === "done") return -1;
    if (a.level !== b.level) return LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
    return b.score - a.score;
  });

  const handleOpenAdd = () => {
    setEditTarget(null);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (item: StageRiskItem) => {
    setEditTarget(item);
    setFormDialogOpen(true);
  };

  const handleFormClose = () => {
    setFormDialogOpen(false);
    setEditTarget(null);
  };

  const handleFormSubmit = (params: RiskFormParams) => {
    if (editTarget) {
      const ok = updateItem(editTarget.id, params);
      if (ok) {
        toast.success(TOAST.RISK.UPDATED);
      } else {
        toast.error(TOAST.UPDATE_ERROR);
      }
    } else {
      addItem(params);
      toast.success(TOAST.RISK.REGISTERED);
    }
    setFormDialogOpen(false);
    setEditTarget(null);
  };

  const handleDelete = (itemId: string) => {
    const ok = deleteItem(itemId);
    if (ok) {
      toast.success(TOAST.RISK.DELETED);
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  };

  const handleChangeStatus = (
    itemId: string,
    status: StageRiskResponseStatus
  ) => {
    updateResponseStatus(itemId, status);
  };

  const criticalCount = items.filter((i) => i.level === "critical").length;
  const highCount = items.filter((i) => i.level === "high").length;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="w-full">
          <CardHeader className="pb-2 pt-3 px-4">
            <CollapsibleTrigger asChild>
              <div
                className="flex items-center justify-between cursor-pointer"
                role="button"
                aria-expanded={isOpen}
                aria-controls="stage-risk-content"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsOpen((v) => !v);
                  }
                }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <ShieldAlert
                    className="h-4 w-4 text-red-500 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <CardTitle className="text-sm font-semibold">
                    무대 리스크 평가
                  </CardTitle>
                  {stats.total > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground"
                      aria-label={`총 ${stats.total}개`}
                    >
                      총 {stats.total}개
                    </Badge>
                  )}
                  {criticalCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-300"
                      aria-label={`위험 등급 ${criticalCount}건`}
                    >
                      <AlertTriangle
                        className="h-2.5 w-2.5 mr-0.5"
                        aria-hidden="true"
                      />
                      위험 {criticalCount}
                    </Badge>
                  )}
                  {highCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-300"
                      aria-label={`높음 등급 ${highCount}건`}
                    >
                      높음 {highCount}
                    </Badge>
                  )}
                  {stats.pendingCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border-gray-300"
                      aria-label={`미대응 ${stats.pendingCount}건`}
                    >
                      미대응 {stats.pendingCount}
                    </Badge>
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp
                    className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronDown
                    className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent id="stage-risk-content">
            <CardContent className="px-4 pb-4 pt-0 space-y-4">
              {loading ? (
                <p
                  className="text-xs text-muted-foreground py-2"
                  aria-live="polite"
                >
                  불러오는 중...
                </p>
              ) : (
                <>
                  {/* 통계/레벨 분포 */}
                  <RiskStats items={items} stats={stats} />

                  {/* 리스크 매트릭스 */}
                  {items.length > 0 && (
                    <div className="p-3 rounded-md border bg-muted/20">
                      <RiskMatrix items={items} />
                    </div>
                  )}

                  {/* 리스크 목록 헤더 */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-medium text-muted-foreground"
                      id="risk-list-label"
                    >
                      리스크 목록
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleOpenAdd}
                      aria-label="새 리스크 등록"
                    >
                      <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                      리스크 등록
                    </Button>
                  </div>

                  {/* 리스크 목록 */}
                  {sortedItems.length === 0 ? (
                    <EmptyState
                      icon={ShieldCheck}
                      title="등록된 리스크 항목이 없습니다"
                      description="공연 안전을 위해 리스크 항목을 등록하세요."
                      action={{ label: "리스크 등록", onClick: handleOpenAdd }}
                    />
                  ) : (
                    <div
                      className="space-y-2"
                      role="list"
                      aria-labelledby="risk-list-label"
                      aria-live="polite"
                    >
                      {sortedItems.map((item) => (
                        <RiskItemRow
                          key={item.id}
                          item={item}
                          onEdit={() => handleOpenEdit(item)}
                          onDelete={() => handleDelete(item.id)}
                          onChangeStatus={(status) =>
                            handleChangeStatus(item.id, status)
                          }
                        />
                      ))}
                    </div>
                  )}

                  {/* 최고 위험 항목 강조 */}
                  {stats.topRiskItem &&
                    stats.topRiskItem.level === "critical" && (
                      <div
                        className="flex items-start gap-2 p-2.5 rounded-md bg-red-50 border border-red-200"
                        role="alert"
                        aria-live="polite"
                      >
                        <AlertTriangle
                          className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-red-700">
                            최고 위험 항목
                          </p>
                          <p className="text-xs text-red-600 truncate">
                            {stats.topRiskItem.title} (점수:{" "}
                            {stats.topRiskItem.score})
                          </p>
                        </div>
                      </div>
                    )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 등록/수정 다이얼로그 */}
      <RiskFormDialog
        open={formDialogOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        editItem={editTarget}
      />
    </>
  );
}
