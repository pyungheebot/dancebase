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
  Volume2,
  Layers,
  FileText,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useSoundCue } from "@/hooks/use-sound-cue";
import type { SoundCueEntry, SoundCueSheet } from "@/types";

import { CueDialog, SheetDialog } from "./sound-cue-dialogs";
import type { CueFormData } from "./sound-cue-dialogs";
import { CueRow, Timeline, StatsPanel } from "./sound-cue-rows";

interface SoundCueCardProps {
  groupId: string;
  projectId: string;
}

export function SoundCueCard({ groupId, projectId }: SoundCueCardProps) {
  const {
    sheets,
    loading,
    addSheet,
    updateSheet,
    deleteSheet,
    addCue,
    updateCue,
    deleteCue,
    moveCueUp,
    moveCueDown,
    toggleActive,
    toggleChecked,
    stats,
  } = useSoundCue(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

  const [sheetDialogOpen, setSheetDialogOpen] = useState(false);
  const [sheetDialogMode, setSheetDialogMode] = useState<"add" | "edit">("add");
  const [editingSheet, setEditingSheet] = useState<SoundCueSheet | null>(null);

  const [cueDialogOpen, setCueDialogOpen] = useState(false);
  const [cueDialogMode, setCueDialogMode] = useState<"add" | "edit">("add");
  const [editingCue, setEditingCue] = useState<SoundCueEntry | null>(null);

  const selectedSheet = useMemo(() => {
    return sheets.find((s) => s.id === selectedSheetId) ?? sheets[0] ?? null;
  }, [sheets, selectedSheetId]);

  const sortedCues = useMemo(() => {
    if (!selectedSheet) return [];
    return [...selectedSheet.cues].sort((a, b) => a.cueNumber - b.cueNumber);
  }, [selectedSheet]);

  const nextCueNumber = useMemo(() => {
    if (!selectedSheet || selectedSheet.cues.length === 0) return 1;
    return Math.max(...selectedSheet.cues.map((c) => c.cueNumber)) + 1;
  }, [selectedSheet]);

  // ── 시트 핸들러 ─────────────────────────────────────────────
  const handleAddSheetOpen = () => {
    setEditingSheet(null);
    setSheetDialogMode("add");
    setSheetDialogOpen(true);
  };

  const handleEditSheetOpen = (sheet: SoundCueSheet) => {
    setEditingSheet(sheet);
    setSheetDialogMode("edit");
    setSheetDialogOpen(true);
  };

  const handleSheetSubmit = (title: string) => {
    if (sheetDialogMode === "add") {
      const newSheet = addSheet(title);
      setSelectedSheetId(newSheet.id);
      toast.success(TOAST.SOUND_CUE.SHEET_ADDED);
    } else if (editingSheet) {
      updateSheet(editingSheet.id, title);
      toast.success(TOAST.SOUND_CUE.SHEET_UPDATED);
    }
  };

  const handleDeleteSheet = (sheetId: string) => {
    deleteSheet(sheetId);
    if (selectedSheetId === sheetId) {
      setSelectedSheetId(null);
    }
    toast.success(TOAST.SOUND_CUE.SHEET_DELETED);
  };

  // ── 큐 핸들러 ───────────────────────────────────────────────
  const handleAddCueOpen = () => {
    setEditingCue(null);
    setCueDialogMode("add");
    setCueDialogOpen(true);
  };

  const handleEditCueOpen = (cue: SoundCueEntry) => {
    setEditingCue(cue);
    setCueDialogMode("edit");
    setCueDialogOpen(true);
  };

  const handleCueSubmit = (data: CueFormData) => {
    if (!selectedSheet) return;
    if (cueDialogMode === "add") {
      addCue(selectedSheet.id, data);
      toast.success(TOAST.SOUND_CUE.CUE_ADDED);
    } else if (editingCue) {
      updateCue(selectedSheet.id, editingCue.id, data);
      toast.success(TOAST.SOUND_CUE.CUE_UPDATED);
    }
  };

  const handleDeleteCue = (cueId: string) => {
    if (!selectedSheet) return;
    deleteCue(selectedSheet.id, cueId);
    toast.success(TOAST.SOUND_CUE.CUE_DELETED);
  };

  const handleToggleActive = (cueId: string) => {
    if (!selectedSheet) return;
    toggleActive(selectedSheet.id, cueId);
  };

  const handleToggleChecked = (cueId: string) => {
    if (!selectedSheet) return;
    toggleChecked(selectedSheet.id, cueId);
  };

  const handleMoveUp = (cueId: string) => {
    if (!selectedSheet) return;
    moveCueUp(selectedSheet.id, cueId);
  };

  const handleMoveDown = (cueId: string) => {
    if (!selectedSheet) return;
    moveCueDown(selectedSheet.id, cueId);
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="w-full">
          <CardHeader className="pb-2 pt-3 px-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-indigo-500" />
                  <CardTitle className="text-sm font-semibold">
                    공연 음향 큐시트
                  </CardTitle>
                  {stats.totalSheets > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-600 border-indigo-200"
                    >
                      {stats.totalSheets}개 시트
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {stats.totalCues > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      큐 {stats.checkedCues}/{stats.totalCues} 체크
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {loading ? (
                <p className="text-xs text-muted-foreground py-2">
                  불러오는 중...
                </p>
              ) : (
                <>
                  {/* 시트 탭 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {sheets.map((sheet) => (
                      <button
                        key={sheet.id}
                        onClick={() => setSelectedSheetId(sheet.id)}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          selectedSheet?.id === sheet.id
                            ? "bg-indigo-100 border-indigo-300 text-indigo-700 font-medium"
                            : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Layers className="h-3 w-3" />
                        {sheet.title}
                      </button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2 rounded-full"
                      onClick={handleAddSheetOpen}
                    >
                      <Plus className="h-3 w-3 mr-0.5" />
                      시트 추가
                    </Button>
                  </div>

                  {selectedSheet ? (
                    <div className="space-y-3">
                      {/* 선택된 시트 헤더 */}
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-md bg-muted/40 border">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {selectedSheet.title}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 flex-shrink-0"
                          >
                            큐 {selectedSheet.cues.length}개
                          </Badge>
                          {selectedSheet.cues.some((c) => c.isChecked) && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 flex-shrink-0 bg-green-50 text-green-600 border-green-200 flex items-center gap-0.5"
                            >
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              {selectedSheet.cues.filter((c) => c.isChecked).length}
                              /{selectedSheet.cues.length} 완료
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-6 w-6 p-0 ${showStats ? "text-indigo-600" : "text-muted-foreground"}`}
                            onClick={() => setShowStats((v) => !v)}
                            title="통계 보기"
                          >
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEditSheetOpen(selectedSheet)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSheet(selectedSheet.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {showStats && stats.totalCues > 0 && (
                        <StatsPanel stats={stats} />
                      )}

                      {sortedCues.length > 0 && (
                        <Timeline cues={sortedCues} />
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          큐 목록
                          <span className="ml-1 text-[10px] text-muted-foreground/70">
                            (호버 시 순서 변경 가능)
                          </span>
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={handleAddCueOpen}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          큐 추가
                        </Button>
                      </div>

                      {sortedCues.length === 0 ? (
                        <div className="py-6 text-center space-y-1.5">
                          <Volume2 className="h-6 w-6 text-muted-foreground mx-auto" />
                          <p className="text-xs text-muted-foreground">
                            큐를 추가하여 음향 큐시트를 작성하세요.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {sortedCues.map((cue, idx) => (
                            <CueRow
                              key={cue.id}
                              cue={cue}
                              isFirst={idx === 0}
                              isLast={idx === sortedCues.length - 1}
                              onEdit={() => handleEditCueOpen(cue)}
                              onDelete={() => handleDeleteCue(cue.id)}
                              onToggleActive={() => handleToggleActive(cue.id)}
                              onToggleChecked={() => handleToggleChecked(cue.id)}
                              onMoveUp={() => handleMoveUp(cue.id)}
                              onMoveDown={() => handleMoveDown(cue.id)}
                            />
                          ))}
                        </div>
                      )}

                      {sortedCues.some((c) => c.notes) && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-medium text-muted-foreground">
                            운영자 메모
                          </span>
                          {sortedCues
                            .filter((c) => c.notes)
                            .map((cue) => (
                              <div
                                key={`note-${cue.id}`}
                                className="flex gap-2 p-2 rounded-md bg-amber-50 border border-amber-200"
                              >
                                <span className="text-[10px] font-mono font-bold text-amber-700 flex-shrink-0">
                                  Q{cue.cueNumber}
                                </span>
                                <p className="text-[10px] text-amber-800 leading-relaxed">
                                  {cue.notes}
                                </p>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-1.5">
                      <Volume2 className="h-6 w-6 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground">
                        시트를 추가하여 음향 큐시트를 관리하세요.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <SheetDialog
        open={sheetDialogOpen}
        mode={sheetDialogMode}
        initialTitle={editingSheet?.title}
        onClose={() => setSheetDialogOpen(false)}
        onSubmit={handleSheetSubmit}
      />

      <CueDialog
        open={cueDialogOpen}
        mode={cueDialogMode}
        initial={
          editingCue
            ? {
                cueNumber: editingCue.cueNumber,
                name: editingCue.name,
                trackName: editingCue.trackName,
                artist: editingCue.artist,
                type: editingCue.type,
                action: editingCue.action,
                startTime: editingCue.startTime,
                endTime: editingCue.endTime,
                volume: editingCue.volume,
                fadeIn: editingCue.fadeIn,
                fadeOut: editingCue.fadeOut,
                scene: editingCue.scene,
                source: editingCue.source,
                notes: editingCue.notes,
              }
            : undefined
        }
        nextCueNumber={nextCueNumber}
        onClose={() => setCueDialogOpen(false)}
        onSubmit={handleCueSubmit}
      />
    </>
  );
}
