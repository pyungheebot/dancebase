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
  Trash2,
  Pencil,
  Repeat,
  Clock,
  Lightbulb,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useEncorePlan } from "@/hooks/use-encore-plan";
import type { EncorePlan, EncoreSong } from "@/types";

// 분리된 서브컴포넌트 임포트
import { SongRow } from "./encore-song-row";
import { PlanDialog } from "./encore-plan-dialog";
import { SongDialog } from "./encore-song-dialog";
import {
  TRIGGER_LABELS,
  TRIGGER_COLORS,
  formatDuration,
  emptyPlanForm,
  emptySongForm,
  type PlanFormData,
  type SongFormData,
} from "./encore-plan-types";

// ============================================================
// 앵콜 계획 카드 - 메인 컨테이너
// 서브컴포넌트를 조합하여 앵콜 플랜 CRUD + 곡 목록 관리 제공
// ============================================================

export function EncorePlanCard({
  groupId,
  projectId,
  memberNames = [],
}: {
  groupId: string;
  projectId: string;
  memberNames?: string[];
}) {
  const {
    plans,
    loading,
    addPlan,
    updatePlan,
    deletePlan,
    addSong,
    updateSong,
    deleteSong,
    reorderSongs,
    stats,
  } = useEncorePlan(groupId, projectId);

  // 카드 열림/닫힘 상태
  const [isOpen, setIsOpen] = useState(false);

  // 선택된 플랜 탭 ID
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // 플랜 다이얼로그 상태
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editPlanTarget, setEditPlanTarget] = useState<EncorePlan | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormData>(emptyPlanForm());
  const [planSaving, setPlanSaving] = useState(false);

  // 곡 다이얼로그 상태
  const [songDialogOpen, setSongDialogOpen] = useState(false);
  const [editSongTarget, setEditSongTarget] = useState<EncoreSong | null>(null);
  const [songForm, setSongForm] = useState<SongFormData>(emptySongForm());
  const [songSaving, setSongSaving] = useState(false);

  // 현재 선택된 플랜 (탭 선택 없으면 첫 번째 플랜)
  const currentPlan =
    plans.find((p) => p.id === selectedPlanId) ?? plans[0] ?? null;

  // ── 플랜 다이얼로그 열기 ──

  function openAddPlan() {
    setEditPlanTarget(null);
    setPlanForm(emptyPlanForm());
    setPlanDialogOpen(true);
  }

  function openEditPlan(plan: EncorePlan) {
    setEditPlanTarget(plan);
    setPlanForm({
      planName: plan.planName,
      triggerCondition: plan.triggerCondition,
      maxEncores: String(plan.maxEncores),
      signalCue: plan.signalCue ?? "",
      lightingNotes: plan.lightingNotes ?? "",
      notes: plan.notes ?? "",
    });
    setPlanDialogOpen(true);
  }

  // ── 플랜 저장 (추가/수정) ──

  async function handlePlanSave() {
    if (!planForm.planName.trim()) {
      toast.error(TOAST.ENCORE.PLAN_NAME_REQUIRED);
      return;
    }
    const maxEncoresNum = parseInt(planForm.maxEncores, 10);
    if (isNaN(maxEncoresNum) || maxEncoresNum < 1) {
      toast.error(TOAST.ENCORE.MAX_ENCORE_REQUIRED);
      return;
    }
    setPlanSaving(true);
    try {
      const payload = {
        projectId,
        planName: planForm.planName.trim(),
        triggerCondition: planForm.triggerCondition,
        maxEncores: maxEncoresNum,
        signalCue: planForm.signalCue.trim() || undefined,
        lightingNotes: planForm.lightingNotes.trim() || undefined,
        notes: planForm.notes.trim() || undefined,
      };
      if (editPlanTarget) {
        await updatePlan(editPlanTarget.id, payload);
        toast.success(TOAST.ENCORE.PLAN_UPDATED);
      } else {
        const newPlan = await addPlan(payload);
        // 새로 추가된 플랜 자동 선택
        setSelectedPlanId(newPlan.id);
        toast.success(TOAST.ENCORE.PLAN_ADDED);
      }
      setPlanDialogOpen(false);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    } finally {
      setPlanSaving(false);
    }
  }

  // ── 플랜 삭제 ──

  async function handleDeletePlan(plan: EncorePlan) {
    try {
      await deletePlan(plan.id);
      // 삭제된 플랜이 선택 중이었다면 선택 해제
      if (selectedPlanId === plan.id) {
        setSelectedPlanId(null);
      }
      toast.success(`'${plan.planName}' 플랜이 삭제되었습니다.`);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // ── 곡 다이얼로그 열기 ──

  function openAddSong() {
    setEditSongTarget(null);
    setSongForm(emptySongForm());
    setSongDialogOpen(true);
  }

  function openEditSong(song: EncoreSong) {
    setEditSongTarget(song);
    setSongForm({
      songTitle: song.songTitle,
      artist: song.artist ?? "",
      durationSeconds: String(song.durationSeconds),
      performers: song.performers,
      notes: song.notes ?? "",
    });
    setSongDialogOpen(true);
  }

  // ── 곡 저장 (추가/수정) ──

  async function handleSongSave() {
    if (!currentPlan) return;
    if (!songForm.songTitle.trim()) {
      toast.error(TOAST.ENCORE.SONG_TITLE_REQUIRED);
      return;
    }
    const dur = parseInt(songForm.durationSeconds, 10);
    if (!songForm.durationSeconds || isNaN(dur) || dur < 1) {
      toast.error(TOAST.ENCORE.SONG_DURATION_REQUIRED);
      return;
    }
    setSongSaving(true);
    try {
      const payload: Omit<EncoreSong, "id" | "order"> = {
        songTitle: songForm.songTitle.trim(),
        artist: songForm.artist.trim() || undefined,
        durationSeconds: dur,
        performers: songForm.performers,
        notes: songForm.notes.trim() || undefined,
      };
      if (editSongTarget) {
        await updateSong(currentPlan.id, editSongTarget.id, payload);
        toast.success(TOAST.ENCORE.SONG_UPDATED);
      } else {
        await addSong(currentPlan.id, payload);
        toast.success(TOAST.ENCORE.SONG_ADDED);
      }
      setSongDialogOpen(false);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    } finally {
      setSongSaving(false);
    }
  }

  // ── 곡 삭제 ──

  async function handleDeleteSong(song: EncoreSong) {
    if (!currentPlan) return;
    try {
      await deleteSong(currentPlan.id, song.id);
      toast.success(TOAST.ENCORE.SONG_DELETED);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // ── 곡 순서 이동 (위/아래) ──

  async function handleMoveSong(song: EncoreSong, direction: "up" | "down") {
    if (!currentPlan) return;
    const sorted = [...currentPlan.songs].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === song.id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sorted.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    try {
      await reorderSongs(currentPlan.id, sorted.map((s) => s.id));
    } catch {
      toast.error(TOAST.ORDER_ERROR);
    }
  }

  // ── 출연자 토글 (곡 폼 내 멤버 선택) ──

  function togglePerformer(name: string) {
    setSongForm((prev) => ({
      ...prev,
      performers: prev.performers.includes(name)
        ? prev.performers.filter((p) => p !== name)
        : [...prev.performers, name],
    }));
  }

  // 현재 플랜의 곡 목록을 순서대로 정렬
  const sortedSongs = currentPlan
    ? [...currentPlan.songs].sort((a, b) => a.order - b.order)
    : [];

  // 현재 플랜의 총 소요 시간
  const planTotalDuration = sortedSongs.reduce(
    (sum, s) => sum + s.durationSeconds,
    0
  );

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              {/* 카드 헤더 - 클릭 시 열림/닫힘 */}
              <CollapsibleTrigger asChild>
                <button
                  className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                  aria-expanded={isOpen}
                  aria-controls="encore-plan-content"
                >
                  <Repeat className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                  <CardTitle className="text-sm font-semibold">
                    앵콜 계획
                  </CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-800 border border-indigo-300">
                    {stats.totalPlans}개 플랜
                  </Badge>
                  {isOpen ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  )}
                </button>
              </CollapsibleTrigger>

              {/* 플랜 추가 버튼 */}
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  openAddPlan();
                }}
                aria-label="앵콜 플랜 추가"
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                플랜 추가
              </Button>
            </div>

            {/* 요약 통계 - 플랜이 있을 때만 표시 */}
            {stats.totalPlans > 0 && (
              <div className="mt-1.5 flex gap-3 flex-wrap" aria-label="앵콜 계획 통계">
                <span className="text-[10px] text-muted-foreground">
                  플랜{" "}
                  <span className="font-semibold text-foreground">
                    {stats.totalPlans}
                  </span>
                  개
                </span>
                <span className="text-[10px] text-muted-foreground">
                  총 곡{" "}
                  <span className="font-semibold text-foreground">
                    {stats.totalSongs}
                  </span>
                  곡
                </span>
                {stats.totalDuration > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    총 시간{" "}
                    <span className="font-semibold text-foreground">
                      {formatDuration(stats.totalDuration)}
                    </span>
                  </span>
                )}
              </div>
            )}
          </CardHeader>

          <CollapsibleContent id="encore-plan-content">
            <CardContent className="pt-0 space-y-3">
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : plans.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  등록된 앵콜 플랜이 없습니다.
                </p>
              ) : (
                <>
                  {/* 플랜 탭 목록 */}
                  <div
                    className="flex gap-1.5 flex-wrap"
                    role="tablist"
                    aria-label="앵콜 플랜 목록"
                  >
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        role="tab"
                        aria-selected={currentPlan?.id === plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                          currentPlan?.id === plan.id
                            ? "bg-indigo-100 border-indigo-400 text-indigo-800 font-semibold"
                            : "bg-muted border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {plan.planName}
                      </button>
                    ))}
                  </div>

                  {/* 현재 플랜 상세 */}
                  {currentPlan && (
                    <div className="space-y-2" role="tabpanel" aria-label={`${currentPlan.planName} 상세`}>
                      {/* 플랜 헤더 정보 */}
                      <div className="flex items-start justify-between rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="text-xs font-semibold text-indigo-800">
                            {currentPlan.planName}
                          </p>

                          {/* 트리거 조건 배지 + 최대 앵콜 수 */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              className={`text-[9px] px-1.5 py-0 border ${
                                TRIGGER_COLORS[currentPlan.triggerCondition]
                              }`}
                            >
                              {TRIGGER_LABELS[currentPlan.triggerCondition]}
                            </Badge>
                            <span className="text-[10px] text-indigo-600">
                              최대 {currentPlan.maxEncores}회 앵콜
                            </span>
                          </div>

                          {/* 시그널 큐 */}
                          {currentPlan.signalCue && (
                            <div className="flex items-center gap-1">
                              <Radio className="h-3 w-3 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                              <span className="text-[10px] text-indigo-600">
                                시그널: {currentPlan.signalCue}
                              </span>
                            </div>
                          )}

                          {/* 조명 노트 */}
                          {currentPlan.lightingNotes && (
                            <div className="flex items-center gap-1">
                              <Lightbulb className="h-3 w-3 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                              <span className="text-[10px] text-indigo-600">
                                조명: {currentPlan.lightingNotes}
                              </span>
                            </div>
                          )}

                          {/* 메모 */}
                          {currentPlan.notes && (
                            <p className="text-[10px] text-indigo-600">
                              {currentPlan.notes}
                            </p>
                          )}

                          {/* 플랜 총 소요 시간 */}
                          {planTotalDuration > 0 && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-indigo-500" aria-hidden="true" />
                              <span className="text-[10px] text-indigo-600">
                                총 소요시간: {formatDuration(planTotalDuration)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 플랜 수정/삭제 버튼 */}
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => openEditPlan(currentPlan)}
                            aria-label={`${currentPlan.planName} 플랜 수정`}
                          >
                            <Pencil className="h-3 w-3" aria-hidden="true" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeletePlan(currentPlan)}
                            aria-label={`${currentPlan.planName} 플랜 삭제`}
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>

                      {/* 곡 섹션 헤더 */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          앵콜 곡 순서 ({sortedSongs.length}곡)
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          onClick={openAddSong}
                          aria-label="앵콜 곡 추가"
                        >
                          <Plus className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
                          곡 추가
                        </Button>
                      </div>

                      {/* 곡 목록 */}
                      {sortedSongs.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground text-center py-3">
                          앵콜 곡을 추가해 순서를 구성해보세요.
                        </p>
                      ) : (
                        <div
                          className="space-y-0"
                          role="list"
                          aria-label="앵콜 곡 순서 목록"
                        >
                          {sortedSongs.map((song, idx) => (
                            <div key={song.id} role="listitem">
                              <SongRow
                                song={song}
                                isFirst={idx === 0}
                                isLast={idx === sortedSongs.length - 1}
                                onEdit={() => openEditSong(song)}
                                onDelete={() => handleDeleteSong(song)}
                                onMoveUp={() => handleMoveSong(song, "up")}
                                onMoveDown={() => handleMoveSong(song, "down")}
                              />
                            </div>
                          ))}

                          {/* 누적 시간 합계 표시 */}
                          <div className="flex items-center justify-end pt-1.5">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              <span>
                                누적 시간: {formatDuration(planTotalDuration)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 플랜 추가/편집 다이얼로그 */}
      <PlanDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        form={planForm}
        setForm={setPlanForm}
        onSave={handlePlanSave}
        saving={planSaving}
        isEdit={!!editPlanTarget}
      />

      {/* 곡 추가/편집 다이얼로그 */}
      <SongDialog
        open={songDialogOpen}
        onOpenChange={setSongDialogOpen}
        form={songForm}
        setForm={setSongForm}
        onSave={handleSongSave}
        saving={songSaving}
        isEdit={!!editSongTarget}
        memberNames={memberNames}
        onTogglePerformer={togglePerformer}
      />
    </>
  );
}
