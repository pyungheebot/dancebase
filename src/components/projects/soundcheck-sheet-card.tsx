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
import { Progress } from "@/components/ui/progress";
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
  Headphones,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  Circle,
  User,
  Calendar,
  AlignLeft,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useSoundcheckSheet } from "@/hooks/use-soundcheck-sheet";
import type { SoundcheckSheet, SoundcheckChannel } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const CHANNEL_TYPE_LABELS: Record<SoundcheckChannel["type"], string> = {
  vocal: "보컬",
  instrument: "악기",
  playback: "플레이백",
  sfx: "효과음",
  monitor: "모니터",
};

const CHANNEL_TYPE_COLORS: Record<SoundcheckChannel["type"], string> = {
  vocal: "bg-blue-100 text-blue-700 border-blue-300",
  instrument: "bg-green-100 text-green-700 border-green-300",
  playback: "bg-purple-100 text-purple-700 border-purple-300",
  sfx: "bg-orange-100 text-orange-700 border-orange-300",
  monitor: "bg-cyan-100 text-cyan-700 border-cyan-300",
};

const CHANNEL_TYPE_OPTIONS: SoundcheckChannel["type"][] = [
  "vocal",
  "instrument",
  "playback",
  "sfx",
  "monitor",
];

// ============================================================
// 폼 타입
// ============================================================

type SheetFormData = {
  sheetName: string;
  engineer: string;
  checkDate: string;
  overallNotes: string;
};

type ChannelFormData = {
  channelNumber: string;
  source: string;
  type: SoundcheckChannel["type"];
  volume: string;
  pan: string;
  eq: string;
  notes: string;
};

function emptySheetForm(): SheetFormData {
  return {
    sheetName: "",
    engineer: "",
    checkDate: "",
    overallNotes: "",
  };
}

function emptyChannelForm(): ChannelFormData {
  return {
    channelNumber: "",
    source: "",
    type: "vocal",
    volume: "80",
    pan: "0",
    eq: "",
    notes: "",
  };
}

function formatPan(pan: number): string {
  if (pan === 0) return "C";
  if (pan > 0) return `R${pan}`;
  return `L${Math.abs(pan)}`;
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function SoundcheckSheetCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const {
    sheets,
    loading,
    addSheet,
    updateSheet,
    deleteSheet,
    addChannel,
    updateChannel,
    deleteChannel,
    toggleChecked,
    reorderChannels,
    stats,
  } = useSoundcheckSheet(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);

  // 선택된 시트 탭
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);

  // 시트 다이얼로그
  const [sheetDialogOpen, setSheetDialogOpen] = useState(false);
  const [editSheetTarget, setEditSheetTarget] = useState<SoundcheckSheet | null>(null);
  const [sheetForm, setSheetForm] = useState<SheetFormData>(emptySheetForm());
  const [sheetSaving, setSheetSaving] = useState(false);

  // 채널 다이얼로그
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [editChannelTarget, setEditChannelTarget] = useState<SoundcheckChannel | null>(null);
  const [channelForm, setChannelForm] = useState<ChannelFormData>(emptyChannelForm());
  const [channelSaving, setChannelSaving] = useState(false);

  // 현재 선택된 시트
  const currentSheet =
    sheets.find((s) => s.id === selectedSheetId) ?? sheets[0] ?? null;

  // 현재 시트 완료율
  const currentChecked = currentSheet
    ? currentSheet.channels.filter((c) => c.isChecked).length
    : 0;
  const currentTotal = currentSheet ? currentSheet.channels.length : 0;
  const currentRate =
    currentTotal > 0 ? Math.round((currentChecked / currentTotal) * 100) : 0;

  // ── 시트 다이얼로그 열기 ──
  function openAddSheet() {
    setEditSheetTarget(null);
    setSheetForm(emptySheetForm());
    setSheetDialogOpen(true);
  }

  function openEditSheet(sheet: SoundcheckSheet) {
    setEditSheetTarget(sheet);
    setSheetForm({
      sheetName: sheet.sheetName,
      engineer: sheet.engineer ?? "",
      checkDate: sheet.checkDate ?? "",
      overallNotes: sheet.overallNotes ?? "",
    });
    setSheetDialogOpen(true);
  }

  // ── 시트 저장 ──
  async function handleSheetSave() {
    if (!sheetForm.sheetName.trim()) {
      toast.error(TOAST.SOUNDCHECK.SHEET_NAME_REQUIRED);
      return;
    }
    setSheetSaving(true);
    try {
      const payload = {
        projectId,
        sheetName: sheetForm.sheetName.trim(),
        engineer: sheetForm.engineer.trim() || undefined,
        checkDate: sheetForm.checkDate.trim() || undefined,
        overallNotes: sheetForm.overallNotes.trim() || undefined,
      };
      if (editSheetTarget) {
        await updateSheet(editSheetTarget.id, payload);
        toast.success(TOAST.SOUNDCHECK.SHEET_UPDATED);
      } else {
        const newSheet = await addSheet(payload);
        setSelectedSheetId(newSheet.id);
        toast.success(TOAST.SOUNDCHECK.SHEET_ADDED);
      }
      setSheetDialogOpen(false);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    } finally {
      setSheetSaving(false);
    }
  }

  // ── 시트 삭제 ──
  async function handleDeleteSheet(sheet: SoundcheckSheet) {
    try {
      await deleteSheet(sheet.id);
      if (selectedSheetId === sheet.id) {
        setSelectedSheetId(null);
      }
      toast.success(`'${sheet.sheetName}' 시트가 삭제되었습니다.`);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // ── 채널 다이얼로그 열기 ──
  function openAddChannel() {
    if (!currentSheet) return;
    const nextNum =
      currentSheet.channels.length > 0
        ? Math.max(...currentSheet.channels.map((c) => c.channelNumber)) + 1
        : 1;
    setEditChannelTarget(null);
    setChannelForm({ ...emptyChannelForm(), channelNumber: String(nextNum) });
    setChannelDialogOpen(true);
  }

  function openEditChannel(channel: SoundcheckChannel) {
    setEditChannelTarget(channel);
    setChannelForm({
      channelNumber: String(channel.channelNumber),
      source: channel.source,
      type: channel.type,
      volume: String(channel.volume),
      pan: String(channel.pan ?? 0),
      eq: channel.eq ?? "",
      notes: channel.notes ?? "",
    });
    setChannelDialogOpen(true);
  }

  // ── 채널 저장 ──
  async function handleChannelSave() {
    if (!currentSheet) return;
    if (!channelForm.source.trim()) {
      toast.error(TOAST.SOUNDCHECK.SOURCE_NAME_REQUIRED);
      return;
    }
    const chNum = parseInt(channelForm.channelNumber, 10);
    if (isNaN(chNum) || chNum < 1) {
      toast.error(TOAST.SOUNDCHECK.CHANNEL_REQUIRED);
      return;
    }
    const vol = parseInt(channelForm.volume, 10);
    if (isNaN(vol) || vol < 0 || vol > 100) {
      toast.error(TOAST.SOUNDCHECK.VOLUME_RANGE);
      return;
    }
    const panVal = channelForm.pan ? parseInt(channelForm.pan, 10) : 0;
    if (isNaN(panVal) || panVal < -100 || panVal > 100) {
      toast.error(TOAST.SOUNDCHECK.PAN_RANGE);
      return;
    }
    setChannelSaving(true);
    try {
      const payload: Omit<SoundcheckChannel, "id"> = {
        channelNumber: chNum,
        source: channelForm.source.trim(),
        type: channelForm.type,
        volume: vol,
        pan: panVal,
        eq: channelForm.eq.trim() || undefined,
        isChecked: editChannelTarget?.isChecked ?? false,
        notes: channelForm.notes.trim() || undefined,
      };
      if (editChannelTarget) {
        await updateChannel(currentSheet.id, editChannelTarget.id, payload);
        toast.success(TOAST.SOUNDCHECK.CHANNEL_UPDATED);
      } else {
        await addChannel(currentSheet.id, payload);
        toast.success(TOAST.SOUNDCHECK.CHANNEL_ADDED);
      }
      setChannelDialogOpen(false);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    } finally {
      setChannelSaving(false);
    }
  }

  // ── 채널 삭제 ──
  async function handleDeleteChannel(channel: SoundcheckChannel) {
    if (!currentSheet) return;
    try {
      await deleteChannel(currentSheet.id, channel.id);
      toast.success(TOAST.SOUNDCHECK.CHANNEL_DELETED);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // ── 채널 체크 토글 ──
  async function handleToggleChecked(channel: SoundcheckChannel) {
    if (!currentSheet) return;
    try {
      await toggleChecked(currentSheet.id, channel.id);
    } catch {
      toast.error(TOAST.STATUS_ERROR);
    }
  }

  // ── 채널 순서 이동 ──
  async function handleMoveChannel(
    channel: SoundcheckChannel,
    direction: "up" | "down"
  ) {
    if (!currentSheet) return;
    const sorted = [...currentSheet.channels].sort(
      (a, b) => a.channelNumber - b.channelNumber
    );
    const idx = sorted.findIndex((c) => c.id === channel.id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sorted.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
    try {
      await reorderChannels(
        currentSheet.id,
        sorted.map((c) => c.id)
      );
    } catch {
      toast.error(TOAST.ORDER_ERROR);
    }
  }

  const sortedChannels = currentSheet
    ? [...currentSheet.channels].sort((a, b) => a.channelNumber - b.channelNumber)
    : [];

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
                  <Headphones className="h-4 w-4 text-cyan-500" />
                  <CardTitle className="text-sm font-semibold">
                    사운드체크 시트
                  </CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-cyan-100 text-cyan-800 border border-cyan-300">
                    {stats.totalSheets}개 시트
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
                  openAddSheet();
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                시트 추가
              </Button>
            </div>

            {/* 요약 통계 */}
            {stats.totalSheets > 0 && (
              <div className="mt-1.5 space-y-1.5">
                <div className="flex gap-3 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">
                    시트{" "}
                    <span className="font-semibold text-foreground">
                      {stats.totalSheets}
                    </span>
                    개
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    채널{" "}
                    <span className="font-semibold text-foreground">
                      {stats.checkedChannels}/{stats.totalChannels}
                    </span>
                    개 완료
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    전체 완료율{" "}
                    <span className="font-semibold text-foreground">
                      {stats.completionRate}%
                    </span>
                  </span>
                </div>
                {stats.totalChannels > 0 && (
                  <Progress value={stats.completionRate} className="h-1" />
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
              ) : sheets.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  등록된 사운드체크 시트가 없습니다.
                </p>
              ) : (
                <>
                  {/* 시트 탭 */}
                  <div className="flex gap-1.5 flex-wrap">
                    {sheets.map((sheet) => (
                      <button
                        key={sheet.id}
                        onClick={() => setSelectedSheetId(sheet.id)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                          currentSheet?.id === sheet.id
                            ? "bg-cyan-100 border-cyan-400 text-cyan-800 font-semibold"
                            : "bg-muted border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {sheet.sheetName}
                      </button>
                    ))}
                  </div>

                  {/* 현재 시트 상세 */}
                  {currentSheet && (
                    <div className="space-y-2">
                      {/* 시트 헤더 */}
                      <div className="flex items-start justify-between rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="text-xs font-semibold text-cyan-800">
                            {currentSheet.sheetName}
                          </p>
                          <div className="flex flex-wrap gap-3">
                            {currentSheet.engineer && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-cyan-500" />
                                <span className="text-[10px] text-cyan-600">
                                  {currentSheet.engineer}
                                </span>
                              </div>
                            )}
                            {currentSheet.checkDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-cyan-500" />
                                <span className="text-[10px] text-cyan-600">
                                  {currentSheet.checkDate}
                                </span>
                              </div>
                            )}
                          </div>
                          {currentSheet.overallNotes && (
                            <div className="flex items-start gap-1">
                              <AlignLeft className="h-3 w-3 text-cyan-500 mt-0.5 flex-shrink-0" />
                              <p className="text-[10px] text-cyan-600">
                                {currentSheet.overallNotes}
                              </p>
                            </div>
                          )}
                          {/* 시트별 완료율 */}
                          {currentTotal > 0 && (
                            <div className="space-y-0.5 pt-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-cyan-600">
                                  완료율 {currentChecked}/{currentTotal}채널
                                </span>
                                <span className="text-[10px] font-semibold text-cyan-700">
                                  {currentRate}%
                                </span>
                              </div>
                              <Progress
                                value={currentRate}
                                className="h-1.5"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => openEditSheet(currentSheet)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSheet(currentSheet)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* 채널 추가 버튼 */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          채널 목록 ({sortedChannels.length}채널)
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          onClick={openAddChannel}
                        >
                          <Plus className="h-2.5 w-2.5 mr-0.5" />
                          채널 추가
                        </Button>
                      </div>

                      {/* 채널 목록 */}
                      {sortedChannels.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground text-center py-3">
                          채널을 추가해 사운드체크 시트를 구성해보세요.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {sortedChannels.map((channel, idx) => (
                            <ChannelRow
                              key={channel.id}
                              channel={channel}
                              isFirst={idx === 0}
                              isLast={idx === sortedChannels.length - 1}
                              onToggle={() => handleToggleChecked(channel)}
                              onEdit={() => openEditChannel(channel)}
                              onDelete={() => handleDeleteChannel(channel)}
                              onMoveUp={() => handleMoveChannel(channel, "up")}
                              onMoveDown={() =>
                                handleMoveChannel(channel, "down")
                              }
                            />
                          ))}
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

      {/* 시트 추가/편집 다이얼로그 */}
      <SheetDialog
        open={sheetDialogOpen}
        onOpenChange={setSheetDialogOpen}
        form={sheetForm}
        setForm={setSheetForm}
        onSave={handleSheetSave}
        saving={sheetSaving}
        isEdit={!!editSheetTarget}
      />

      {/* 채널 추가/편집 다이얼로그 */}
      <ChannelDialog
        open={channelDialogOpen}
        onOpenChange={setChannelDialogOpen}
        form={channelForm}
        setForm={setChannelForm}
        onSave={handleChannelSave}
        saving={channelSaving}
        isEdit={!!editChannelTarget}
      />
    </>
  );
}

// ============================================================
// 채널 행 컴포넌트
// ============================================================

function ChannelRow({
  channel,
  isFirst,
  isLast,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  channel: SoundcheckChannel;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div
      className={`rounded-md border transition-colors p-2 ${
        channel.isChecked
          ? "bg-green-50 border-green-200"
          : "bg-card hover:bg-muted/20"
      }`}
    >
      <div className="flex items-start gap-2">
        {/* 체크 버튼 */}
        <button
          onClick={onToggle}
          className="flex-shrink-0 mt-0.5"
          title={channel.isChecked ? "체크 해제" : "체크 완료"}
        >
          {channel.isChecked ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* 채널 번호 */}
        <div className="flex items-center justify-center w-5 h-5 rounded bg-cyan-100 text-[9px] font-bold text-cyan-700 flex-shrink-0 mt-0.5">
          {channel.channelNumber}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* 소스 + 유형 배지 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-medium ${
                channel.isChecked
                  ? "line-through text-muted-foreground"
                  : ""
              }`}
            >
              {channel.source}
            </span>
            <Badge
              className={`text-[9px] px-1 py-0 border ${
                CHANNEL_TYPE_COLORS[channel.type]
              }`}
            >
              {CHANNEL_TYPE_LABELS[channel.type]}
            </Badge>
          </div>

          {/* 볼륨 바 + 팬 */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 flex-1 min-w-[100px]">
              <span className="text-[9px] text-muted-foreground w-8 flex-shrink-0">
                VOL
              </span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all"
                  style={{ width: `${channel.volume}%` }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground w-7 text-right flex-shrink-0">
                {channel.volume}
              </span>
            </div>
            {channel.pan !== undefined && (
              <span className="text-[9px] text-muted-foreground flex-shrink-0">
                PAN: {formatPan(channel.pan)}
              </span>
            )}
          </div>

          {/* EQ + 노트 */}
          {(channel.eq || channel.notes) && (
            <div className="flex flex-col gap-0.5">
              {channel.eq && (
                <span className="text-[9px] text-muted-foreground">
                  EQ: {channel.eq}
                </span>
              )}
              {channel.notes && (
                <span className="text-[9px] text-muted-foreground italic">
                  {channel.notes}
                </span>
              )}
            </div>
          )}
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
  );
}

// ============================================================
// 시트 추가/편집 다이얼로그
// ============================================================

function SheetDialog({
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
  form: SheetFormData;
  setForm: (f: SheetFormData) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  function set<K extends keyof SheetFormData>(key: K, value: SheetFormData[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Headphones className="h-4 w-4 text-cyan-500" />
            {isEdit ? "시트 수정" : "시트 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 시트 이름 */}
          <div className="space-y-1">
            <Label className="text-xs">
              시트 이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 1부 사운드체크, 리허설 시트"
              value={form.sheetName}
              onChange={(e) => set("sheetName", e.target.value)}
            />
          </div>

          {/* 엔지니어 + 날짜 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">담당 엔지니어</Label>
              <div className="relative">
                <User className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  className="h-8 text-xs pl-6"
                  placeholder="예: 홍길동"
                  value={form.engineer}
                  onChange={(e) => set("engineer", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">체크 날짜</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  className="h-8 text-xs pl-6"
                  type="date"
                  value={form.checkDate}
                  onChange={(e) => set("checkDate", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 전체 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">전체 메모</Label>
            <Textarea
              className="text-xs min-h-[56px] resize-none"
              placeholder="사운드체크 전체에 대한 메모"
              value={form.overallNotes}
              onChange={(e) => set("overallNotes", e.target.value)}
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
// 채널 추가/편집 다이얼로그
// ============================================================

function ChannelDialog({
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
  form: ChannelFormData;
  setForm: (f: ChannelFormData) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  function set<K extends keyof ChannelFormData>(
    key: K,
    value: ChannelFormData[K]
  ) {
    setForm({ ...form, [key]: value });
  }

  const volNum = parseInt(form.volume, 10);
  const panNum = parseInt(form.pan, 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Headphones className="h-4 w-4 text-cyan-500" />
            {isEdit ? "채널 수정" : "채널 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 채널 번호 + 소스 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">
                채널 번호 <span className="text-destructive">*</span>
              </Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min="1"
                placeholder="1"
                value={form.channelNumber}
                onChange={(e) => set("channelNumber", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">
                소스 이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 리드보컬, 킥드럼"
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
              />
            </div>
          </div>

          {/* 유형 */}
          <div className="space-y-1">
            <Label className="text-xs">유형</Label>
            <Select
              value={form.type}
              onValueChange={(v) => set("type", v as SoundcheckChannel["type"])}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {CHANNEL_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 볼륨 */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-xs">볼륨</Label>
              <span className="text-[10px] text-muted-foreground">
                {isNaN(volNum) ? 0 : volNum}
              </span>
            </div>
            <Input
              className="h-8 text-xs"
              type="range"
              min="0"
              max="100"
              value={form.volume}
              onChange={(e) => set("volume", e.target.value)}
            />
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all"
                style={{ width: `${isNaN(volNum) ? 0 : volNum}%` }}
              />
            </div>
          </div>

          {/* 팬 */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-xs">팬 (Pan)</Label>
              <span className="text-[10px] text-muted-foreground">
                {isNaN(panNum) ? "C" : formatPan(panNum)}
              </span>
            </div>
            <Input
              className="h-8 text-xs"
              type="range"
              min="-100"
              max="100"
              value={form.pan}
              onChange={(e) => set("pan", e.target.value)}
            />
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>L</span>
              <span>C</span>
              <span>R</span>
            </div>
          </div>

          {/* EQ 설정 */}
          <div className="space-y-1">
            <Label className="text-xs">EQ 설정</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: Hi 3kHz +2dB, Lo 100Hz -3dB"
              value={form.eq}
              onChange={(e) => set("eq", e.target.value)}
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">채널 메모</Label>
            <Textarea
              className="text-xs min-h-[48px] resize-none"
              placeholder="이 채널에 대한 특이사항"
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
