"use client";

import { useState } from "react";
import {
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  ChevronLeft,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { useStageFormation } from "@/hooks/use-stage-formation";
import type { StageFormationScene, StageFormationPosition } from "@/types";

import {
  SceneFormDialog,
  PositionFormDialog,
  StageSettingsDialog,
} from "./stage-formation-dialogs";
import { StageView, SceneRow } from "./stage-formation-views";

// ============================================================
// 메인 컴포넌트
// ============================================================

interface StageFormationCardProps {
  projectId: string;
}

export function StageFormationCard({ projectId }: StageFormationCardProps) {
  const {
    scenes,
    stageWidth,
    stageDepth,
    notes,
    loading,
    stats,
    addScene,
    updateScene,
    deleteScene,
    reorderScenes,
    addPosition,
    updatePosition,
    removePosition,
    setStageSize,
    setNotes,
  } = useStageFormation(projectId);

  const [isOpen, setIsOpen] = useState(false);

  // 씬 다이얼로그
  const [sceneDialogOpen, setSceneDialogOpen] = useState(false);
  const [editTargetScene, setEditTargetScene] = useState<StageFormationScene | null>(
    null
  );

  // 포지션 다이얼로그
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [editTargetPosition, setEditTargetPosition] =
    useState<StageFormationPosition | null>(null);

  // 무대 설정 다이얼로그
  const [stageSettingsOpen, setStageSettingsOpen] = useState(false);

  // 현재 활성 씬 인덱스
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);

  const activeScene = scenes[activeSceneIdx] ?? null;

  // 씬 추가/수정 제출
  const handleSceneSubmit = (params: {
    name: string;
    description: string;
    durationSec: number | null;
  }) => {
    if (editTargetScene) {
      const ok = updateScene(editTargetScene.id, params);
      if (ok) {
        toast.success(TOAST.STAGE_FORMATION.SCENE_UPDATED);
      } else {
        toast.error(TOAST.STAGE_FORMATION.SCENE_UPDATE_ERROR);
      }
    } else {
      addScene(params);
      toast.success(TOAST.STAGE_FORMATION.SCENE_ADDED);
      // 새로 추가한 씬으로 이동
      setActiveSceneIdx(scenes.length);
    }
    setSceneDialogOpen(false);
    setEditTargetScene(null);
  };

  // 씬 삭제
  const handleDeleteScene = (sceneId: string) => {
    const ok = deleteScene(sceneId);
    if (ok) {
      toast.success(TOAST.STAGE_FORMATION.SCENE_DELETED);
      if (activeSceneIdx >= scenes.length - 1) {
        setActiveSceneIdx(Math.max(0, scenes.length - 2));
      }
    } else {
      toast.error(TOAST.STAGE_FORMATION.SCENE_DELETE_ERROR);
    }
  };

  // 포지션 추가/수정 제출
  const handlePositionSubmit = (params: {
    memberName: string;
    x: number;
    y: number;
    color: string;
  }) => {
    if (!activeScene) return;

    if (editTargetPosition) {
      const ok = updatePosition(activeScene.id, editTargetPosition.id, params);
      if (ok) {
        toast.success(TOAST.STAGE_FORMATION.POSITION_UPDATED);
      } else {
        toast.error(TOAST.STAGE_FORMATION.POSITION_UPDATE_ERROR);
      }
    } else {
      const result = addPosition(activeScene.id, params);
      if (result) {
        toast.success(TOAST.STAGE_FORMATION.POSITION_ADDED);
      } else {
        toast.error(TOAST.STAGE_FORMATION.POSITION_ADD_ERROR);
      }
    }
    setPositionDialogOpen(false);
    setEditTargetPosition(null);
  };

  // 포지션 삭제
  const handleRemovePosition = (posId: string) => {
    if (!activeScene) return;
    const ok = removePosition(activeScene.id, posId);
    if (ok) {
      toast.success(TOAST.STAGE_FORMATION.POSITION_DELETED);
    } else {
      toast.error(TOAST.STAGE_FORMATION.POSITION_DELETE_ERROR);
    }
  };

  // 무대 설정 저장
  const handleSaveStageSettings = (
    newWidth: number,
    newDepth: number,
    newNotes: string
  ) => {
    setStageSize(newWidth, newDepth);
    setNotes(newNotes);
    toast.success(TOAST.STAGE_FORMATION.STAGE_SAVED);
    setStageSettingsOpen(false);
  };

  // 이전/다음 씬 이동
  const goToPrevScene = () => {
    setActiveSceneIdx((prev) => Math.max(0, prev - 1));
  };
  const goToNextScene = () => {
    setActiveSceneIdx((prev) => Math.min(scenes.length - 1, prev + 1));
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="w-full">
          <CardHeader className="pb-2 pt-3 px-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 flex-wrap">
                  <Users className="h-4 w-4 text-violet-500 flex-shrink-0" />
                  <CardTitle className="text-sm font-semibold">
                    무대 포메이션 디자이너
                  </CardTitle>
                  {stats.totalScenes > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground"
                    >
                      {stats.totalScenes}개 씬
                    </Badge>
                  )}
                  {stats.totalPositions > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-violet-50 text-violet-700 border-violet-200"
                    >
                      총 {stats.totalPositions}개 포지션
                    </Badge>
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-4">
              {loading ? (
                <p className="text-xs text-muted-foreground py-2">
                  불러오는 중...
                </p>
              ) : (
                <>
                  {/* 통계 요약 */}
                  {scenes.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-md bg-muted/40 border text-center">
                        <p className="text-[10px] text-muted-foreground">
                          씬 수
                        </p>
                        <p className="text-sm font-bold tabular-nums">
                          {stats.totalScenes}
                        </p>
                      </div>
                      <div className="p-2 rounded-md bg-violet-50 border border-violet-200 text-center">
                        <p className="text-[10px] text-violet-600">
                          전체 포지션
                        </p>
                        <p className="text-sm font-bold tabular-nums text-violet-700">
                          {stats.totalPositions}
                        </p>
                      </div>
                      <div className="p-2 rounded-md bg-blue-50 border border-blue-200 text-center">
                        <p className="text-[10px] text-blue-600">씬당 평균</p>
                        <p className="text-sm font-bold tabular-nums text-blue-700">
                          {stats.averagePositionsPerScene}명
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 씬 목록 + 무대 뷰 영역 */}
                  <div className="space-y-3">
                    {/* 헤더 버튼 */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        씬 목록
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2 text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStageSettingsOpen(true);
                          }}
                          title="무대 설정"
                        >
                          <Settings2 className="h-3 w-3 mr-1" />
                          설정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditTargetScene(null);
                            setSceneDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          씬 추가
                        </Button>
                      </div>
                    </div>

                    {/* 빈 상태 */}
                    {scenes.length === 0 ? (
                      <div className="py-10 text-center space-y-2">
                        <Users className="h-8 w-8 text-muted-foreground mx-auto" />
                        <p className="text-xs text-muted-foreground">
                          등록된 씬이 없습니다.
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          씬을 추가하여 포메이션을 디자인하세요.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 md:flex-row">
                        {/* 왼쪽: 씬 목록 */}
                        <div className="md:w-40 flex-shrink-0 space-y-1">
                          {scenes.map((scene, idx) => (
                            <SceneRow
                              key={scene.id}
                              scene={scene}
                              isActive={idx === activeSceneIdx}
                              isFirst={idx === 0}
                              isLast={idx === scenes.length - 1}
                              onClick={() => setActiveSceneIdx(idx)}
                              onEdit={() => {
                                setEditTargetScene(scene);
                                setSceneDialogOpen(true);
                              }}
                              onDelete={() => handleDeleteScene(scene.id)}
                              onMoveUp={() => reorderScenes(scene.id, "up")}
                              onMoveDown={() =>
                                reorderScenes(scene.id, "down")
                              }
                            />
                          ))}
                        </div>

                        {/* 오른쪽: 무대 뷰 */}
                        {activeScene && (
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* 씬 헤더 */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={goToPrevScene}
                                  disabled={activeSceneIdx === 0}
                                  title="이전 씬"
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate">
                                    {activeScene.name}
                                  </p>
                                  {activeScene.description && (
                                    <p className="text-[10px] text-muted-foreground truncate">
                                      {activeScene.description}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={goToNextScene}
                                  disabled={
                                    activeSceneIdx === scenes.length - 1
                                  }
                                  title="다음 씬"
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              {/* 포지션 추가 버튼 */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditTargetPosition(null);
                                  setPositionDialogOpen(true);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                멤버 추가
                              </Button>
                            </div>

                            {/* 씬 인디케이터 */}
                            <div className="flex items-center gap-1">
                              {scenes.map((s, idx) => (
                                <button
                                  key={s.id}
                                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                                    idx === activeSceneIdx
                                      ? "bg-primary scale-125"
                                      : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                                  }`}
                                  onClick={() => setActiveSceneIdx(idx)}
                                  title={s.name}
                                />
                              ))}
                              <span className="text-[10px] text-muted-foreground ml-1">
                                {activeSceneIdx + 1} / {scenes.length}
                              </span>
                            </div>

                            {/* 무대 뷰 */}
                            <StageView
                              scene={activeScene}
                              stageWidth={stageWidth}
                              stageDepth={stageDepth}
                              onEditPosition={(pos) => {
                                setEditTargetPosition(pos);
                                setPositionDialogOpen(true);
                              }}
                              onRemovePosition={handleRemovePosition}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 전체 메모 */}
                  {notes && (
                    <div className="rounded-md bg-muted/40 border px-3 py-2">
                      <p className="text-[10px] font-medium text-muted-foreground mb-1">
                        전체 메모
                      </p>
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                        {notes}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 씬 등록/수정 다이얼로그 */}
      <SceneFormDialog
        open={sceneDialogOpen}
        onClose={() => {
          setSceneDialogOpen(false);
          setEditTargetScene(null);
        }}
        onSubmit={handleSceneSubmit}
        editScene={editTargetScene}
      />

      {/* 포지션 등록/수정 다이얼로그 */}
      <PositionFormDialog
        open={positionDialogOpen}
        onClose={() => {
          setPositionDialogOpen(false);
          setEditTargetPosition(null);
        }}
        onSubmit={handlePositionSubmit}
        editPosition={editTargetPosition}
      />

      {/* 무대 설정 다이얼로그 */}
      <StageSettingsDialog
        open={stageSettingsOpen}
        onClose={() => setStageSettingsOpen(false)}
        stageWidth={stageWidth}
        stageDepth={stageDepth}
        notes={notes}
        onSave={handleSaveStageSettings}
      />
    </>
  );
}
