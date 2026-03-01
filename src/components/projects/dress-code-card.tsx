"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Shirt,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useDressCode } from "@/hooks/use-dress-code";
import type { DressCodeCategory, DressCodeGuideItem } from "@/types";

import { ALL_CATEGORIES } from "./dress-code/types";
import type { GuideDialogMode } from "./dress-code/types";
import { GuideDialog } from "./dress-code/guide-dialog";
import { GuideSection } from "./dress-code/guide-section";
import { MemberMatrix } from "./dress-code/member-matrix";
import { AddSetDialog } from "./dress-code/add-set-dialog";

// ============================================================
// 메인 컴포넌트
// ============================================================

interface DressCodeCardProps {
  groupId: string;
  projectId: string;
  memberNames?: string[];
}

export function DressCodeCard({
  groupId,
  projectId,
  memberNames = [],
}: DressCodeCardProps) {
  const {
    sets,
    loading,
    addSet,
    deleteSet,
    addGuide,
    updateGuide,
    deleteGuide,
    toggleMemberReady,
    getMemberReadiness,
    stats,
  } = useDressCode(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);

  // 세트 추가 다이얼로그
  const [addSetDialogOpen, setAddSetDialogOpen] = useState(false);
  const [newSetName, setNewSetName] = useState("");

  // 가이드 다이얼로그
  const [guideDialog, setGuideDialog] = useState<{
    open: boolean;
    mode: GuideDialogMode;
    editTarget?: DressCodeGuideItem;
  }>({ open: false, mode: "add" });

  // 선택된 세트
  const selectedSet = useMemo(
    () => sets.find((s) => s.id === selectedSetId) ?? sets[0] ?? null,
    [sets, selectedSetId]
  );

  // 세트 자동 선택
  const effectiveSetId = selectedSet?.id ?? null;

  // 선택 세트의 카테고리별 가이드
  const guidesByCategory = useMemo(() => {
    if (!selectedSet) return {} as Record<DressCodeCategory, DressCodeGuideItem[]>;
    return ALL_CATEGORIES.reduce(
      (acc, cat) => {
        acc[cat] = selectedSet.guides.filter((g) => g.category === cat);
        return acc;
      },
      {} as Record<DressCodeCategory, DressCodeGuideItem[]>
    );
  }, [selectedSet]);

  // 선택 세트의 전체 준비율
  const setReadiness = useMemo(() => {
    if (!selectedSet || memberNames.length === 0 || selectedSet.guides.length === 0)
      return 0;
    const readiness = getMemberReadiness(selectedSet.id, memberNames);
    if (readiness.length === 0) return 0;
    const avg = readiness.reduce((sum, r) => sum + r.percentage, 0) / readiness.length;
    return Math.round(avg);
  }, [selectedSet, memberNames, getMemberReadiness]);

  // ── 핸들러 ──────────────────────────────────────────────

  const handleAddSet = () => {
    if (!newSetName.trim()) {
      toast.error(TOAST.DRESS_CODE.SHOW_NAME_REQUIRED);
      return;
    }
    const newSet = addSet(newSetName.trim());
    setSelectedSetId(newSet.id);
    setNewSetName("");
    setAddSetDialogOpen(false);
    toast.success(TOAST.DRESS_CODE.SET_ADDED);
  };

  const handleDeleteSet = (setId: string) => {
    const ok = deleteSet(setId);
    if (ok) {
      if (effectiveSetId === setId) setSelectedSetId(null);
      toast.success(TOAST.DRESS_CODE.SET_DELETED);
    }
  };

  const handleAddGuide = (data: Omit<DressCodeGuideItem, "id">) => {
    if (!effectiveSetId) return;
    const result = addGuide(effectiveSetId, data);
    if (result) {
      toast.success(TOAST.DRESS_CODE.GUIDE_ADDED);
    } else {
      toast.error(TOAST.DRESS_CODE.GUIDE_ADD_ERROR);
    }
  };

  const handleEditGuide = (guide: DressCodeGuideItem) => {
    setGuideDialog({ open: true, mode: "edit", editTarget: guide });
  };

  const handleUpdateGuide = (data: Omit<DressCodeGuideItem, "id">) => {
    if (!effectiveSetId || !guideDialog.editTarget) return;
    const ok = updateGuide(effectiveSetId, guideDialog.editTarget.id, data);
    if (ok) {
      toast.success(TOAST.DRESS_CODE.GUIDE_UPDATED);
    } else {
      toast.error(TOAST.DRESS_CODE.GUIDE_UPDATE_ERROR);
    }
  };

  const handleDeleteGuide = (guideId: string) => {
    if (!effectiveSetId) return;
    const ok = deleteGuide(effectiveSetId, guideId);
    if (ok) {
      toast.success(TOAST.DRESS_CODE.GUIDE_DELETED);
    } else {
      toast.error(TOAST.DRESS_CODE.GUIDE_DELETE_ERROR);
    }
  };

  const handleToggleMember = (memberName: string, itemId: string) => {
    if (!effectiveSetId) return;
    toggleMemberReady(effectiveSetId, memberName, itemId);
  };

  // ── 렌더 ─────────────────────────────────────────────────

  return (
    <>
      <Card className="w-full">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader
              className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4"
              aria-expanded={isOpen}
              aria-controls="dress-code-content"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shirt className="h-4 w-4 text-purple-500" aria-hidden="true" />
                  <CardTitle className="text-sm font-semibold">
                    공연 드레스 코드
                  </CardTitle>
                  <div className="flex items-center gap-1" role="group" aria-label="드레스 코드 통계">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200"
                    >
                      {stats.totalSets}개 세트
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {stats.totalGuides}개 항목
                    </Badge>
                    {stats.totalSets > 0 && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${
                          stats.overallReadiness === 100
                            ? "bg-green-50 text-green-700 border-green-200"
                            : stats.overallReadiness >= 50
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        준비율 {stats.overallReadiness}%
                      </Badge>
                    )}
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent id="dress-code-content">
            <CardContent className="px-4 pb-4 pt-0 space-y-4">
              {loading ? (
                <p
                  className="text-xs text-muted-foreground text-center py-4"
                  role="alert"
                  aria-live="polite"
                >
                  불러오는 중...
                </p>
              ) : (
                <>
                  {/* 세트 선택 & 추가 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        공연 선택
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setAddSetDialogOpen(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                        공연 추가
                      </Button>
                    </div>

                    {sets.length === 0 ? (
                      <div
                        className="border border-dashed rounded-md p-4 text-center"
                        role="status"
                        aria-label="드레스 코드 세트 없음"
                      >
                        <Shirt className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1" aria-hidden="true" />
                        <p className="text-xs text-muted-foreground">
                          드레스 코드 세트가 없습니다.
                        </p>
                        <p className="text-[11px] text-muted-foreground/70">
                          공연 추가 버튼으로 첫 번째 세트를 만들어보세요.
                        </p>
                      </div>
                    ) : (
                      <div
                        className="flex flex-wrap gap-1.5"
                        role="tablist"
                        aria-label="공연 세트 목록"
                      >
                        {sets.map((set) => (
                          <button
                            key={set.id}
                            role="tab"
                            aria-selected={effectiveSetId === set.id}
                            aria-controls={`set-panel-${set.id}`}
                            onClick={() => setSelectedSetId(set.id)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs border transition-colors ${
                              effectiveSetId === set.id
                                ? "bg-purple-100 border-purple-300 text-purple-800 font-medium"
                                : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                            }`}
                          >
                            <Star
                              className={`h-2.5 w-2.5 ${effectiveSetId === set.id ? "text-purple-500" : "text-muted-foreground/40"}`}
                              aria-hidden="true"
                            />
                            {set.performanceName}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSet(set.id);
                              }}
                              className="ml-1 hover:text-red-500"
                              aria-label={`${set.performanceName} 세트 삭제`}
                            >
                              <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
                            </button>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 선택된 세트 내용 */}
                  {selectedSet && (
                    <div
                      id={`set-panel-${selectedSet.id}`}
                      role="tabpanel"
                      aria-label={`${selectedSet.performanceName} 드레스 코드`}
                      className="space-y-4 border-t pt-4"
                    >
                      {/* 세트 헤더 */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">
                          {selectedSet.performanceName}
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() =>
                            setGuideDialog({ open: true, mode: "add" })
                          }
                        >
                          <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                          항목 추가
                        </Button>
                      </div>

                      {/* 전체 준비율 */}
                      {memberNames.length > 0 && selectedSet.guides.length > 0 && (
                        <div className="space-y-1" role="group" aria-label="전체 준비율">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              전체 준비율
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                setReadiness === 100
                                  ? "text-green-600"
                                  : setReadiness >= 50
                                    ? "text-yellow-600"
                                    : "text-red-500"
                              }`}
                              aria-live="polite"
                            >
                              {setReadiness}%
                            </span>
                          </div>
                          <Progress
                            value={setReadiness}
                            className="h-1.5"
                            aria-label={`전체 준비율 ${setReadiness}%`}
                          />
                        </div>
                      )}

                      {/* 가이드 없음 */}
                      {selectedSet.guides.length === 0 && (
                        <div
                          className="border border-dashed rounded-md p-3 text-center"
                          role="status"
                        >
                          <p className="text-xs text-muted-foreground">
                            가이드 항목이 없습니다.
                          </p>
                          <p className="text-[11px] text-muted-foreground/70">
                            항목 추가 버튼으로 의상/헤어/메이크업 가이드를 추가하세요.
                          </p>
                        </div>
                      )}

                      {/* 카테고리별 가이드 */}
                      {ALL_CATEGORIES.map((cat) => (
                        <GuideSection
                          key={cat}
                          category={cat}
                          guides={guidesByCategory[cat] ?? []}
                          memberNames={memberNames}
                          memberStatuses={selectedSet.memberStatuses}
                          onToggleMember={handleToggleMember}
                          onEditGuide={handleEditGuide}
                          onDeleteGuide={handleDeleteGuide}
                        />
                      ))}

                      {/* 멤버 매트릭스 */}
                      {memberNames.length > 0 && selectedSet.guides.length > 0 && (
                        <div className="border-t pt-4">
                          <MemberMatrix
                            set={selectedSet}
                            memberNames={memberNames}
                            onToggleMember={handleToggleMember}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 공연 추가 다이얼로그 */}
      <AddSetDialog
        open={addSetDialogOpen}
        value={newSetName}
        onChange={setNewSetName}
        onClose={() => {
          setAddSetDialogOpen(false);
          setNewSetName("");
        }}
        onSubmit={handleAddSet}
      />

      {/* 가이드 추가/편집 다이얼로그 */}
      {guideDialog.open && (
        <GuideDialog
          open={guideDialog.open}
          mode={guideDialog.mode}
          initial={
            guideDialog.editTarget
              ? {
                  category: guideDialog.editTarget.category,
                  title: guideDialog.editTarget.title,
                  description: guideDialog.editTarget.description,
                  colorCode: guideDialog.editTarget.colorCode,
                  imageDescription: guideDialog.editTarget.imageDescription,
                  isRequired: guideDialog.editTarget.isRequired,
                }
              : undefined
          }
          onClose={() => setGuideDialog({ open: false, mode: "add" })}
          onSubmit={
            guideDialog.mode === "add" ? handleAddGuide : handleUpdateGuide
          }
        />
      )}
    </>
  );
}
