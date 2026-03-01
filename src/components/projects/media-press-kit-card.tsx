"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Newspaper, Plus } from "lucide-react";
import {
  useMediaPressKit,
  type AddMediaPressKitInput,
  type AddOutletInput,
} from "@/hooks/use-media-press-kit";
import type { MediaPressKitEntry } from "@/types";

import { EMPTY_ENTRY_FORM, EMPTY_OUTLET_FORM } from "./media-press-kit/types";
import { EntryRow } from "./media-press-kit/entry-row";
import { EntryDialog, type EntryFormState } from "./media-press-kit/entry-dialog";
import { OutletDialog } from "./media-press-kit/outlet-dialog";
import { PressStats } from "./media-press-kit/press-stats";

// ============================================================
// 메인 컴포넌트
// ============================================================

export function MediaPressKitCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    changeStatus,
    addOutlet,
    toggleOutletPublished,
    deleteOutlet,
    stats,
  } = useMediaPressKit(groupId, projectId);

  // 보도자료 추가/수정 다이얼로그
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<MediaPressKitEntry | null>(null);
  const [entryForm, setEntryForm] = useState<EntryFormState>(EMPTY_ENTRY_FORM);
  const [savingEntry, setSavingEntry] = useState(false);

  // 매체 추가 다이얼로그
  const [outletEntryId, setOutletEntryId] = useState<string | null>(null);
  const [outletForm, setOutletForm] = useState<AddOutletInput>(EMPTY_OUTLET_FORM);
  const [savingOutlet, setSavingOutlet] = useState(false);

  // ── 보도자료 폼 열기 ──
  function handleOpenAdd() {
    setEditTarget(null);
    setEntryForm(EMPTY_ENTRY_FORM);
    setShowEntryDialog(true);
  }

  function handleOpenEdit(entry: MediaPressKitEntry) {
    setEditTarget(entry);
    setEntryForm({
      title: entry.title,
      writtenAt: entry.writtenAt,
      content: entry.content,
      contactName: entry.contactName,
      contactEmail: entry.contactEmail ?? "",
      contactPhone: entry.contactPhone ?? "",
      attachmentUrls: entry.attachmentUrls,
      attachmentInput: "",
    });
    setShowEntryDialog(true);
  }

  function handleCloseEntryDialog() {
    setShowEntryDialog(false);
    setEditTarget(null);
  }

  // ── 첨부 URL 추가 ──
  function handleAddAttachment() {
    const url = entryForm.attachmentInput.trim();
    if (!url) return;
    setEntryForm((prev) => ({
      ...prev,
      attachmentUrls: [...(prev.attachmentUrls ?? []), url],
      attachmentInput: "",
    }));
  }

  function handleRemoveAttachment(idx: number) {
    setEntryForm((prev) => ({
      ...prev,
      attachmentUrls: (prev.attachmentUrls ?? []).filter((_, i) => i !== idx),
    }));
  }

  // ── 보도자료 저장 ──
  async function handleSaveEntry() {
    setSavingEntry(true);
    const payload: AddMediaPressKitInput = {
      title: entryForm.title,
      writtenAt: entryForm.writtenAt,
      content: entryForm.content,
      contactName: entryForm.contactName,
      contactEmail: entryForm.contactEmail || undefined,
      contactPhone: entryForm.contactPhone || undefined,
      attachmentUrls: entryForm.attachmentUrls,
    };

    let ok: boolean;
    if (editTarget) {
      ok = await updateEntry(editTarget.id, payload);
    } else {
      ok = await addEntry(payload);
    }

    if (ok) {
      handleCloseEntryDialog();
    }
    setSavingEntry(false);
  }

  // ── 매체 추가 ──
  function handleOpenAddOutlet(entryId: string) {
    setOutletEntryId(entryId);
    setOutletForm(EMPTY_OUTLET_FORM);
  }

  function handleCloseOutletDialog() {
    setOutletEntryId(null);
  }

  async function handleSaveOutlet() {
    if (!outletEntryId) return;
    setSavingOutlet(true);
    const ok = await addOutlet(outletEntryId, outletForm);
    if (ok) handleCloseOutletDialog();
    setSavingOutlet(false);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-gray-400">
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-indigo-500" aria-hidden="true" />
              미디어 보도 자료
            </CardTitle>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleOpenAdd}
              aria-label="보도자료 추가"
            >
              <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
              보도자료 추가
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 요약 통계 */}
          {entries.length > 0 && <PressStats stats={stats} />}

          {/* 보도자료 목록 */}
          {entries.length > 0 ? (
            <div
              className="space-y-2"
              role="list"
              aria-label="보도자료 목록"
            >
              {entries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  onEdit={handleOpenEdit}
                  onDelete={deleteEntry}
                  onStatusChange={changeStatus}
                  onAddOutlet={handleOpenAddOutlet}
                  onToggleOutlet={toggleOutletPublished}
                  onDeleteOutlet={deleteOutlet}
                />
              ))}
            </div>
          ) : (
            <div
              className="py-10 text-center text-sm text-gray-400"
              role="status"
              aria-live="polite"
            >
              <Newspaper
                className="h-8 w-8 mx-auto mb-2 text-gray-200"
                aria-hidden="true"
              />
              <p>등록된 보도자료가 없습니다</p>
              <p className="text-xs mt-1">보도자료 추가 버튼으로 시작하세요</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 보도자료 추가/수정 다이얼로그 */}
      <EntryDialog
        open={showEntryDialog}
        editTarget={editTarget}
        form={entryForm}
        saving={savingEntry}
        onFormChange={setEntryForm}
        onAddAttachment={handleAddAttachment}
        onRemoveAttachment={handleRemoveAttachment}
        onSave={handleSaveEntry}
        onClose={handleCloseEntryDialog}
      />

      {/* 매체 추가 다이얼로그 */}
      <OutletDialog
        open={outletEntryId !== null}
        form={outletForm}
        saving={savingOutlet}
        onFormChange={setOutletForm}
        onSave={handleSaveOutlet}
        onClose={handleCloseOutletDialog}
      />
    </>
  );
}
