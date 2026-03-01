"use client";

/**
 * 사운드체크 시트 카드 액션 훅
 *
 * SoundcheckSheetCard에서 사용하는 시트/채널 CRUD, 다이얼로그 상태,
 * 체크 토글, 순서 이동 등 모든 비즈니스 로직을 분리합니다.
 */

import { useState } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { SoundcheckSheet, SoundcheckChannel } from "@/types";
import {
  emptySheetForm,
  emptyChannelForm,
  type SheetFormData,
  type ChannelFormData,
} from "./soundcheck-sheet-types";

// useSoundcheckSheet 훅의 반환 타입 일부를 재사용
type SheetActions = {
  addSheet: (payload: Omit<SoundcheckSheet, "id" | "createdAt" | "channels">) => Promise<SoundcheckSheet>;
  updateSheet: (id: string, payload: Partial<Omit<SoundcheckSheet, "id" | "createdAt" | "channels">>) => Promise<void>;
  deleteSheet: (id: string) => Promise<void>;
  addChannel: (sheetId: string, payload: Omit<SoundcheckChannel, "id">) => Promise<void>;
  updateChannel: (sheetId: string, channelId: string, payload: Omit<SoundcheckChannel, "id">) => Promise<void>;
  deleteChannel: (sheetId: string, channelId: string) => Promise<void>;
  toggleChecked: (sheetId: string, channelId: string) => Promise<void>;
  reorderChannels: (sheetId: string, orderedIds: string[]) => Promise<void>;
};

export function useSoundcheckSheetActions(
  projectId: string,
  actions: SheetActions,
  currentSheet: SoundcheckSheet | null,
  setSelectedSheetId: (id: string | null) => void
) {
  const {
    addSheet,
    updateSheet,
    deleteSheet,
    addChannel,
    updateChannel,
    deleteChannel,
    toggleChecked,
    reorderChannels,
  } = actions;

  // ── 시트 다이얼로그 상태 ──────────────────────────────────
  const [sheetDialogOpen, setSheetDialogOpen] = useState(false);
  const [editSheetTarget, setEditSheetTarget] = useState<SoundcheckSheet | null>(null);
  const [sheetForm, setSheetForm] = useState<SheetFormData>(emptySheetForm());
  const [sheetSaving, setSheetSaving] = useState(false);

  // ── 채널 다이얼로그 상태 ──────────────────────────────────
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [editChannelTarget, setEditChannelTarget] = useState<SoundcheckChannel | null>(null);
  const [channelForm, setChannelForm] = useState<ChannelFormData>(emptyChannelForm());
  const [channelSaving, setChannelSaving] = useState(false);

  // ── 시트 다이얼로그 열기 ──────────────────────────────────

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

  // ── 시트 저장 ─────────────────────────────────────────────

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

  // ── 시트 삭제 ─────────────────────────────────────────────

  async function handleDeleteSheet(sheet: SoundcheckSheet) {
    try {
      await deleteSheet(sheet.id);
      setSelectedSheetId(null);
      toast.success(`'${sheet.sheetName}' 시트가 삭제되었습니다.`);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // ── 채널 다이얼로그 열기 ──────────────────────────────────

  function openAddChannel() {
    if (!currentSheet) return;
    // 기존 채널 번호 최댓값 + 1을 기본값으로 설정
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

  // ── 채널 저장 ─────────────────────────────────────────────

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

  // ── 채널 삭제 ─────────────────────────────────────────────

  async function handleDeleteChannel(channel: SoundcheckChannel) {
    if (!currentSheet) return;
    try {
      await deleteChannel(currentSheet.id, channel.id);
      toast.success(TOAST.SOUNDCHECK.CHANNEL_DELETED);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // ── 채널 체크 토글 ────────────────────────────────────────

  async function handleToggleChecked(channel: SoundcheckChannel) {
    if (!currentSheet) return;
    try {
      await toggleChecked(currentSheet.id, channel.id);
    } catch {
      toast.error(TOAST.STATUS_ERROR);
    }
  }

  // ── 채널 순서 이동 ────────────────────────────────────────

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

  return {
    // 시트 다이얼로그
    sheetDialogOpen,
    setSheetDialogOpen,
    sheetForm,
    setSheetForm,
    sheetSaving,
    isEditSheet: !!editSheetTarget,
    openAddSheet,
    openEditSheet,
    handleSheetSave,
    handleDeleteSheet,
    // 채널 다이얼로그
    channelDialogOpen,
    setChannelDialogOpen,
    channelForm,
    setChannelForm,
    channelSaving,
    isEditChannel: !!editChannelTarget,
    openAddChannel,
    openEditChannel,
    handleChannelSave,
    handleDeleteChannel,
    handleToggleChecked,
    handleMoveChannel,
  };
}
