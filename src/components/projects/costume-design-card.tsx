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
  ChevronDown,
  ChevronUp,
  Plus,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useCostumeDesign } from "@/hooks/use-costume-design";
import type { CostumeDesignStatus } from "@/types";

import { STATUS_LABELS } from "./costume-design/types";
import { AddDesignDialog } from "./costume-design/add-design-dialog";
import { DesignGridItem } from "./costume-design/design-grid-item";
import { DesignStats } from "./costume-design/design-stats";
import { StatusFilterTabs } from "./costume-design/status-filter-tabs";

// ============================================================
// 메인 카드
// ============================================================

interface CostumeDesignCardProps {
  groupId: string;
  projectId: string;
  memberNames: string[];
}

export function CostumeDesignCard({
  groupId,
  projectId,
  memberNames,
}: CostumeDesignCardProps) {
  const [cardOpen, setCardOpen] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CostumeDesignStatus | "all">("all");

  const currentUser = memberNames[0] ?? "나";

  const {
    designs,
    loading,
    addDesign,
    deleteDesign,
    changeStatus,
    toggleVote,
    addComment,
    deleteComment,
    stats,
  } = useCostumeDesign(groupId, projectId);

  const filteredDesigns =
    statusFilter === "all"
      ? designs
      : designs.filter((d) => d.status === statusFilter);

  return (
    <>
      <Card className="shadow-sm">
        <Collapsible open={cardOpen} onOpenChange={setCardOpen}>
          <CardHeader className="py-2 px-4">
            <CollapsibleTrigger asChild>
              <div
                className="flex items-center justify-between cursor-pointer"
                aria-expanded={cardOpen}
                aria-controls="costume-design-content"
              >
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-pink-500" aria-hidden="true" />
                  <CardTitle className="text-sm font-semibold">
                    의상 디자인 보드
                  </CardTitle>
                  {stats.totalDesigns > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-pink-100 text-pink-700">
                      {stats.totalDesigns}개
                    </Badge>
                  )}
                  {stats.approvedCount > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700">
                      승인 {stats.approvedCount}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddDialog(true);
                      if (!cardOpen) setCardOpen(true);
                    }}
                    aria-label="디자인 추가"
                    title="디자인 추가"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  {cardOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent id="costume-design-content">
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {/* 통계 요약 */}
              <DesignStats stats={stats} />

              {/* 상태 필터 탭 */}
              <StatusFilterTabs
                designs={designs}
                statusFilter={statusFilter}
                onFilterChange={setStatusFilter}
              />

              {/* 디자인 그리드 */}
              {loading ? (
                <div className="text-center py-4" role="status" aria-live="polite">
                  <p className="text-xs text-muted-foreground">불러오는 중...</p>
                </div>
              ) : filteredDesigns.length === 0 ? (
                <div className="text-center py-6 space-y-2" role="status">
                  <Palette className="h-8 w-8 text-muted-foreground/40 mx-auto" aria-hidden="true" />
                  <p className="text-xs text-muted-foreground">
                    {statusFilter === "all"
                      ? "아직 디자인 아이디어가 없습니다."
                      : `"${STATUS_LABELS[statusFilter as CostumeDesignStatus]}" 상태의 디자인이 없습니다.`}
                  </p>
                  {statusFilter === "all" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowAddDialog(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                      첫 번째 디자인 추가
                    </Button>
                  )}
                </div>
              ) : (
                <div
                  className="grid grid-cols-2 gap-2"
                  role="list"
                  aria-label="디자인 목록"
                >
                  {filteredDesigns.map((design) => (
                    <div key={design.id} role="listitem">
                      <DesignGridItem
                        design={design}
                        memberNames={memberNames}
                        currentUser={currentUser}
                        onChangeStatus={changeStatus}
                        onToggleVote={toggleVote}
                        onDelete={deleteDesign}
                        onAddComment={addComment}
                        onDeleteComment={deleteComment}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 디자인 추가 다이얼로그 */}
      <AddDesignDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        memberNames={memberNames}
        onSubmit={(title, description, designedBy, category, colorScheme, materialNotes, estimatedCost) => {
          addDesign(
            title,
            description,
            designedBy,
            category,
            colorScheme,
            materialNotes,
            estimatedCost
          );
          toast.success(TOAST.COSTUME_DESIGN.IDEA_ADDED);
        }}
      />
    </>
  );
}
