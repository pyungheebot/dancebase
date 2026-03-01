"use client";

import { useState } from "react";
import { useFormationEditor } from "@/hooks/use-formation-editor";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Grid3X3, Plus, Copy } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

import { StageCanvas } from "./formation-editor/stage-canvas";
import { SelectedMemberControl } from "./formation-editor/selected-member-control";
import { SceneTabs } from "./formation-editor/scene-tabs";
import { MemberListPanel } from "./formation-editor/member-list-panel";
import { AddSceneDialog } from "./formation-editor/add-scene-dialog";

// ============================================
// 포메이션 에디터 메인 카드
// ============================================

interface FormationEditorCardProps {
  groupId: string;
  projectId: string;
}

export function FormationEditorCard({
  groupId,
  projectId,
}: FormationEditorCardProps) {
  const {
    scenes,
    loading,
    canAddScene,
    addScene,
    deleteScene,
    addPosition,
    updatePosition,
    removePosition,
    copyPositionsFromScene,
  } = useFormationEditor(groupId, projectId);

  const [cardExpanded, setCardExpanded] = useState(true);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [addSceneDialogOpen, setAddSceneDialogOpen] = useState(false);

  // 현재 활성 씬
  const activeScene =
    scenes.find((s) => s.id === activeSceneId) ?? scenes[0] ?? null;
  const effectiveSceneId = activeScene?.id ?? null;

  // 선택된 멤버의 위치 정보
  const selectedPosition =
    activeScene?.positions.find((p) => p.memberId === selectedMemberId) ?? null;

  function handleAddScene(label: string) {
    const ok = addScene(label);
    if (ok) {
      toast.success(`"${label}" 구간이 추가되었습니다.`);
    } else {
      toast.error(TOAST.FORMATION_EDITOR.SECTION_MAX);
    }
  }

  function handleDeleteScene(sceneId: string) {
    const scene = scenes.find((s) => s.id === sceneId);
    deleteScene(sceneId);
    if (activeSceneId === sceneId) {
      setActiveSceneId(null);
      setSelectedMemberId(null);
    }
    toast.success(`"${scene?.label ?? ""}" 구간이 삭제되었습니다.`);
  }

  function handleAddMember(name: string, color: string) {
    if (!effectiveSceneId) return;
    const ok = addPosition(effectiveSceneId, name, color);
    if (!ok) {
      toast.error(`"${name}"은(는) 이미 이 구간에 추가되어 있습니다.`);
    } else {
      toast.success(`${name} 멤버가 무대 중앙에 배치되었습니다.`);
    }
  }

  function handleRemoveMember(memberId: string) {
    if (!effectiveSceneId) return;
    removePosition(effectiveSceneId, memberId);
    setSelectedMemberId(null);
    toast.success(TOAST.FORMATION_EDITOR.MEMBER_REMOVED);
  }

  function handleMoveToClick(x: number, y: number) {
    if (!effectiveSceneId || !selectedMemberId) return;
    updatePosition(effectiveSceneId, selectedMemberId, x, y);
  }

  function handleFineMove(dx: number, dy: number) {
    if (!effectiveSceneId || !selectedMemberId || !selectedPosition) return;
    updatePosition(
      effectiveSceneId,
      selectedMemberId,
      selectedPosition.x + dx,
      selectedPosition.y + dy
    );
  }

  function handleCopyFromPrev() {
    if (!effectiveSceneId) return;
    const currentIndex = scenes.findIndex((s) => s.id === effectiveSceneId);
    if (currentIndex <= 0) {
      toast.error(TOAST.FORMATION_EDITOR.NO_PREV_SECTION);
      return;
    }
    const prevSceneId = scenes[currentIndex - 1]!.id;
    const ok = copyPositionsFromScene(prevSceneId, effectiveSceneId);
    if (ok) {
      toast.success(TOAST.FORMATION_EDITOR.COPY_SUCCESS);
    } else {
      toast.error(TOAST.FORMATION_EDITOR.COPY_ERROR);
    }
  }

  return (
    <>
      <Collapsible open={cardExpanded} onOpenChange={setCardExpanded}>
        <div className="border rounded-lg overflow-hidden">
          {/* 카드 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 bg-card border-b">
            <CollapsibleTrigger asChild>
              <button
                className="flex items-center gap-2 text-left min-w-0"
                aria-expanded={cardExpanded}
                aria-controls="formation-editor-content"
              >
                {cardExpanded ? (
                  <ChevronDown
                    className="h-4 w-4 text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronRight
                    className="h-4 w-4 text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                )}
                <Grid3X3
                  className="h-4 w-4 text-indigo-500 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold">포메이션 에디터</span>
                {scenes.length > 0 && (
                  <Badge
                    className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100 shrink-0"
                    aria-label={`구간 ${scenes.length}개 / 최대 10개`}
                  >
                    {scenes.length}/10
                  </Badge>
                )}
              </button>
            </CollapsibleTrigger>
            {canAddScene && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs shrink-0"
                onClick={() => setAddSceneDialogOpen(true)}
                aria-label="새 구간 추가"
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                구간 추가
              </Button>
            )}
          </div>

          {/* 본문 */}
          <CollapsibleContent id="formation-editor-content">
            <div className="p-4 space-y-3">
              {loading ? (
                <p
                  className="text-xs text-muted-foreground text-center py-4"
                  role="status"
                  aria-live="polite"
                >
                  불러오는 중...
                </p>
              ) : scenes.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-10 text-muted-foreground"
                  role="status"
                >
                  <Grid3X3
                    className="h-10 w-10 mb-2 opacity-20"
                    aria-hidden="true"
                  />
                  <p className="text-xs">등록된 구간이 없습니다.</p>
                  <p className="text-[10px] mt-0.5">
                    위 &apos;구간 추가&apos; 버튼으로 시작하세요.
                  </p>
                </div>
              ) : (
                <>
                  {/* 씬 탭 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <SceneTabs
                      scenes={scenes}
                      activeSceneId={effectiveSceneId}
                      onSelect={(id) => {
                        setActiveSceneId(id);
                        setSelectedMemberId(null);
                      }}
                      onDelete={handleDeleteScene}
                    />
                    {/* 이전 구간 복사 버튼 */}
                    {effectiveSceneId &&
                      scenes.findIndex((s) => s.id === effectiveSceneId) >
                        0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] text-muted-foreground gap-1"
                          onClick={handleCopyFromPrev}
                          aria-label="이전 구간 포메이션 복사"
                        >
                          <Copy className="h-2.5 w-2.5" aria-hidden="true" />
                          이전 복사
                        </Button>
                      )}
                  </div>

                  {/* 무대 + 컨트롤 */}
                  {activeScene && (
                    <div
                      className="space-y-2"
                      id={`scene-panel-${activeScene.id}`}
                      role="tabpanel"
                      aria-labelledby={`scene-tab-${activeScene.id}`}
                    >
                      {/* 무대 캔버스 */}
                      <StageCanvas
                        scene={activeScene}
                        selectedMemberId={selectedMemberId}
                        onSelectMember={setSelectedMemberId}
                        onMoveToClick={handleMoveToClick}
                      />

                      {/* 선택된 멤버 컨트롤 */}
                      {selectedPosition && (
                        <SelectedMemberControl
                          position={selectedPosition}
                          onMove={handleFineMove}
                          onRemove={() =>
                            handleRemoveMember(selectedMemberId!)
                          }
                          onDeselect={() => setSelectedMemberId(null)}
                        />
                      )}

                      {/* 멤버 목록 */}
                      <div className="border-t pt-2">
                        <p
                          className="text-[10px] text-muted-foreground mb-1.5 font-medium"
                          aria-hidden="true"
                        >
                          멤버 ({activeScene.positions.length}명)
                        </p>
                        <MemberListPanel
                          scene={activeScene}
                          selectedMemberId={selectedMemberId}
                          onSelectMember={setSelectedMemberId}
                          onAddMember={handleAddMember}
                          onRemoveMember={handleRemoveMember}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* 씬 추가 다이얼로그 */}
      <AddSceneDialog
        open={addSceneDialogOpen}
        onClose={() => setAddSceneDialogOpen(false)}
        onAdd={handleAddScene}
        scenes={scenes}
      />
    </>
  );
}
