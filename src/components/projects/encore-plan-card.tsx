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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Repeat,
  Music,
  Clock,
  User,
  Users,
  Lightbulb,
  Radio,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useEncorePlan } from "@/hooks/use-encore-plan";
import type { EncorePlan, EncoreSong, EncoreTriggerCondition } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const TRIGGER_LABELS: Record<EncoreTriggerCondition, string> = {
  audience_request: "관객 요청",
  standing_ovation: "기립 박수",
  time_available: "시간 여유",
  planned: "사전 계획",
  spontaneous: "즉흥 결정",
};

const TRIGGER_COLORS: Record<EncoreTriggerCondition, string> = {
  audience_request: "bg-blue-100 text-blue-700 border-blue-300",
  standing_ovation: "bg-purple-100 text-purple-700 border-purple-300",
  time_available: "bg-green-100 text-green-700 border-green-300",
  planned: "bg-orange-100 text-orange-700 border-orange-300",
  spontaneous: "bg-pink-100 text-pink-700 border-pink-300",
};

const TRIGGER_OPTIONS: EncoreTriggerCondition[] = [
  "audience_request",
  "standing_ovation",
  "time_available",
  "planned",
  "spontaneous",
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}분 ${s}초` : `${m}분`;
}

// ============================================================
// 폼 타입
// ============================================================

type PlanFormData = {
  planName: string;
  triggerCondition: EncoreTriggerCondition;
  maxEncores: string;
  signalCue: string;
  lightingNotes: string;
  notes: string;
};

type SongFormData = {
  songTitle: string;
  artist: string;
  durationSeconds: string;
  performers: string[];
  notes: string;
};

function emptyPlanForm(): PlanFormData {
  return {
    planName: "",
    triggerCondition: "audience_request",
    maxEncores: "1",
    signalCue: "",
    lightingNotes: "",
    notes: "",
  };
}

function emptySongForm(): SongFormData {
  return {
    songTitle: "",
    artist: "",
    durationSeconds: "",
    performers: [],
    notes: "",
  };
}

// ============================================================
// 메인 컴포넌트
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

  const [isOpen, setIsOpen] = useState(false);

  // 선택된 플랜 탭
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // 플랜 다이얼로그
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editPlanTarget, setEditPlanTarget] = useState<EncorePlan | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormData>(emptyPlanForm());
  const [planSaving, setPlanSaving] = useState(false);

  // 곡 다이얼로그
  const [songDialogOpen, setSongDialogOpen] = useState(false);
  const [editSongTarget, setEditSongTarget] = useState<EncoreSong | null>(null);
  const [songForm, setSongForm] = useState<SongFormData>(emptySongForm());
  const [songSaving, setSongSaving] = useState(false);

  // 현재 선택된 플랜
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

  // ── 플랜 저장 ──
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

  // ── 곡 저장 ──
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

  // ── 곡 순서 이동 ──
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

  // ── 출연자 토글 ──
  function togglePerformer(name: string) {
    setSongForm((prev) => ({
      ...prev,
      performers: prev.performers.includes(name)
        ? prev.performers.filter((p) => p !== name)
        : [...prev.performers, name],
    }));
  }

  const sortedSongs = currentPlan
    ? [...currentPlan.songs].sort((a, b) => a.order - b.order)
    : [];

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
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
                  <Repeat className="h-4 w-4 text-indigo-500" />
                  <CardTitle className="text-sm font-semibold">
                    앵콜 계획
                  </CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-800 border border-indigo-300">
                    {stats.totalPlans}개 플랜
                  </Badge>
                  {isOpen ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </CollapsibleTrigger>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  openAddPlan();
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                플랜 추가
              </Button>
            </div>

            {/* 요약 통계 */}
            {stats.totalPlans > 0 && (
              <div className="mt-1.5 flex gap-3 flex-wrap">
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

          <CollapsibleContent>
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
                  {/* 플랜 탭 */}
                  <div className="flex gap-1.5 flex-wrap">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
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
                    <div className="space-y-2">
                      {/* 플랜 헤더 */}
                      <div className="flex items-start justify-between rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="text-xs font-semibold text-indigo-800">
                            {currentPlan.planName}
                          </p>

                          {/* 트리거 조건 + 최대 앵콜 수 */}
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
                              <Radio className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                              <span className="text-[10px] text-indigo-600">
                                시그널: {currentPlan.signalCue}
                              </span>
                            </div>
                          )}

                          {/* 조명 노트 */}
                          {currentPlan.lightingNotes && (
                            <div className="flex items-center gap-1">
                              <Lightbulb className="h-3 w-3 text-indigo-500 flex-shrink-0" />
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

                          {/* 누적 시간 */}
                          {planTotalDuration > 0 && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-indigo-500" />
                              <span className="text-[10px] text-indigo-600">
                                총 소요시간: {formatDuration(planTotalDuration)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => openEditPlan(currentPlan)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeletePlan(currentPlan)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* 곡 추가 버튼 */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          앵콜 곡 순서 ({sortedSongs.length}곡)
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          onClick={openAddSong}
                        >
                          <Plus className="h-2.5 w-2.5 mr-0.5" />
                          곡 추가
                        </Button>
                      </div>

                      {/* 곡 목록 */}
                      {sortedSongs.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground text-center py-3">
                          앵콜 곡을 추가해 순서를 구성해보세요.
                        </p>
                      ) : (
                        <div className="space-y-0">
                          {sortedSongs.map((song, idx) => (
                            <SongRow
                              key={song.id}
                              song={song}
                              isFirst={idx === 0}
                              isLast={idx === sortedSongs.length - 1}
                              onEdit={() => openEditSong(song)}
                              onDelete={() => handleDeleteSong(song)}
                              onMoveUp={() => handleMoveSong(song, "up")}
                              onMoveDown={() => handleMoveSong(song, "down")}
                            />
                          ))}
                          {/* 누적 시간 표시 줄 */}
                          <div className="flex items-center justify-end pt-1.5">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
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

// ============================================================
// 곡 행 컴포넌트
// ============================================================

function SongRow({
  song,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  song: EncoreSong;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="flex gap-2.5">
      {/* 타임라인 세로선 + 번호 */}
      <div className="flex flex-col items-center w-6 flex-shrink-0">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 border-2 border-indigo-400 text-[9px] font-bold text-indigo-700 z-10 flex-shrink-0">
          {song.order}
        </div>
        {!isLast && (
          <div
            className="w-0.5 flex-1 bg-indigo-200 mt-0.5"
            style={{ minHeight: "20px" }}
          />
        )}
      </div>

      {/* 곡 내용 */}
      <div className="flex-1 min-w-0 pb-2">
        <div className="rounded-md border bg-card hover:bg-muted/20 transition-colors p-2">
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0 space-y-1">
              {/* 곡명 + 아티스트 */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Music className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                <span className="text-xs font-medium">{song.songTitle}</span>
                {song.artist && (
                  <span className="text-[10px] text-muted-foreground">
                    — {song.artist}
                  </span>
                )}
              </div>

              {/* 출연자 태그 */}
              {song.performers.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {song.performers.length === 1 ? (
                    <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex gap-1 flex-wrap">
                    {song.performers.map((name) => (
                      <span
                        key={name}
                        className="text-[9px] px-1.5 py-0 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 시간 + 메모 */}
              <div className="flex items-center gap-2 flex-wrap">
                {song.durationSeconds > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {formatDuration(song.durationSeconds)}
                    </span>
                  </div>
                )}
                {song.notes && (
                  <span className="text-[10px] text-muted-foreground">
                    {song.notes}
                  </span>
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={onMoveUp}
                disabled={isFirst}
              >
                <ArrowUp className="h-2.5 w-2.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={onMoveDown}
                disabled={isLast}
              >
                <ArrowDown className="h-2.5 w-2.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={onEdit}
              >
                <Pencil className="h-2.5 w-2.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 플랜 추가/편집 다이얼로그
// ============================================================

function PlanDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: PlanFormData;
  setForm: (f: PlanFormData) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  function set<K extends keyof PlanFormData>(key: K, value: PlanFormData[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Repeat className="h-4 w-4 text-indigo-500" />
            {isEdit ? "플랜 수정" : "앵콜 플랜 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 플랜 이름 */}
          <div className="space-y-1">
            <Label className="text-xs">
              플랜 이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 메인 앵콜, 더블 앵콜"
              value={form.planName}
              onChange={(e) => set("planName", e.target.value)}
            />
          </div>

          {/* 트리거 조건 */}
          <div className="space-y-1">
            <Label className="text-xs">
              트리거 조건 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.triggerCondition}
              onValueChange={(v) =>
                set("triggerCondition", v as EncoreTriggerCondition)
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="트리거 조건 선택" />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {TRIGGER_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 최대 앵콜 수 */}
          <div className="space-y-1">
            <Label className="text-xs">
              최대 앵콜 횟수 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              type="number"
              min="1"
              placeholder="예: 1"
              value={form.maxEncores}
              onChange={(e) => set("maxEncores", e.target.value)}
            />
          </div>

          {/* 시그널 큐 */}
          <div className="space-y-1">
            <Label className="text-xs">시그널 큐</Label>
            <div className="relative">
              <Radio className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                className="h-8 text-xs pl-6"
                placeholder="예: 무대감독 손 신호"
                value={form.signalCue}
                onChange={(e) => set("signalCue", e.target.value)}
              />
            </div>
          </div>

          {/* 조명 노트 */}
          <div className="space-y-1">
            <Label className="text-xs">조명 노트</Label>
            <div className="relative">
              <Lightbulb className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                className="h-8 text-xs pl-6"
                placeholder="예: 스포트라이트 → 전체 조명"
                value={form.lightingNotes}
                onChange={(e) => set("lightingNotes", e.target.value)}
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              className="text-xs min-h-[56px] resize-none"
              placeholder="플랜에 대한 추가 메모"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 곡 추가/편집 다이얼로그
// ============================================================

function SongDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
  memberNames,
  onTogglePerformer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: SongFormData;
  setForm: (f: SongFormData) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
  memberNames: string[];
  onTogglePerformer: (name: string) => void;
}) {
  function set<K extends keyof SongFormData>(key: K, value: SongFormData[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Music className="h-4 w-4 text-indigo-500" />
            {isEdit ? "곡 수정" : "앵콜 곡 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 곡 제목 */}
          <div className="space-y-1">
            <Label className="text-xs">
              곡 제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 봄날, Dynamite"
              value={form.songTitle}
              onChange={(e) => set("songTitle", e.target.value)}
            />
          </div>

          {/* 아티스트 */}
          <div className="space-y-1">
            <Label className="text-xs">아티스트</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: BTS, 아이유"
              value={form.artist}
              onChange={(e) => set("artist", e.target.value)}
            />
          </div>

          {/* 곡 길이 */}
          <div className="space-y-1">
            <Label className="text-xs">
              곡 길이 (초) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                className="h-8 text-xs pl-6"
                type="number"
                min="1"
                placeholder="예: 210"
                value={form.durationSeconds}
                onChange={(e) => set("durationSeconds", e.target.value)}
              />
            </div>
            {form.durationSeconds &&
              !isNaN(parseInt(form.durationSeconds)) && (
                <p className="text-[10px] text-muted-foreground">
                  = {formatDuration(parseInt(form.durationSeconds))}
                </p>
              )}
          </div>

          {/* 출연자 선택 (멤버가 있을 때) */}
          {memberNames.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">출연자 (다중 선택)</Label>
              <div className="flex flex-wrap gap-1 p-2 rounded-md border bg-muted/30 min-h-[40px]">
                {memberNames.map((name) => {
                  const selected = form.performers.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onTogglePerformer(name)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        selected
                          ? "bg-indigo-100 border-indigo-400 text-indigo-800 font-semibold"
                          : "bg-background border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
              {form.performers.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  선택됨: {form.performers.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* 멤버 목록이 없을 때 직접 입력 */}
          {memberNames.length === 0 && (
            <div className="space-y-1">
              <Label className="text-xs">출연자</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 홍길동, 김철수 (쉼표로 구분)"
                value={form.performers.join(", ")}
                onChange={(e) =>
                  set(
                    "performers",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
              />
            </div>
          )}

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              className="text-xs min-h-[48px] resize-none"
              placeholder="예: 관객과 함께 부르는 파트"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
