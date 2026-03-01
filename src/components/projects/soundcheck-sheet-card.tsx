"use client";

/**
 * 사운드체크 시트 카드 (메인 진입점)
 *
 * 서브컴포넌트/모듈 구조:
 *  - soundcheck-sheet-types.ts         : 공유 타입, 상수, 유틸
 *  - use-soundcheck-sheet-actions.ts   : CRUD/다이얼로그 액션 훅
 *  - soundcheck-channel-row.tsx        : 채널 행 (React.memo)
 *  - soundcheck-sheet-header.tsx       : 시트 헤더 (React.memo)
 *  - soundcheck-sheet-dialog.tsx       : 시트 추가/편집 다이얼로그
 *  - soundcheck-channel-dialog.tsx     : 채널 추가/편집 다이얼로그
 */

import { useState } from "react";
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
import { Headphones, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useSoundcheckSheet } from "@/hooks/use-soundcheck-sheet";

// 서브컴포넌트 & 훅
import { ChannelRow } from "./soundcheck-channel-row";
import { SheetHeader } from "./soundcheck-sheet-header";
import { SheetDialog } from "./soundcheck-sheet-dialog";
import { ChannelDialog } from "./soundcheck-channel-dialog";
import { useSoundcheckSheetActions } from "./use-soundcheck-sheet-actions";

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

  // 카드 접힘/펼침 상태
  const [isOpen, setIsOpen] = useState(false);

  // 선택된 시트 탭 (없으면 첫 번째 시트가 자동 선택됨)
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);

  // 현재 선택된 시트
  const currentSheet =
    sheets.find((s) => s.id === selectedSheetId) ?? sheets[0] ?? null;

  // 현재 시트 완료율 계산
  const currentChecked = currentSheet
    ? currentSheet.channels.filter((c) => c.isChecked).length
    : 0;
  const currentTotal = currentSheet ? currentSheet.channels.length : 0;
  const currentRate =
    currentTotal > 0 ? Math.round((currentChecked / currentTotal) * 100) : 0;

  // 채널을 번호 순으로 정렬
  const sortedChannels = currentSheet
    ? [...currentSheet.channels].sort((a, b) => a.channelNumber - b.channelNumber)
    : [];

  // 모든 CRUD/다이얼로그 액션은 전용 훅으로 위임
  const {
    sheetDialogOpen, setSheetDialogOpen,
    sheetForm, setSheetForm,
    sheetSaving, isEditSheet,
    openAddSheet, openEditSheet,
    handleSheetSave, handleDeleteSheet,
    channelDialogOpen, setChannelDialogOpen,
    channelForm, setChannelForm,
    channelSaving, isEditChannel,
    openAddChannel, openEditChannel,
    handleChannelSave, handleDeleteChannel,
    handleToggleChecked, handleMoveChannel,
  } = useSoundcheckSheetActions(
    projectId,
    { addSheet, updateSheet, deleteSheet, addChannel, updateChannel, deleteChannel, toggleChecked, reorderChannels },
    currentSheet,
    setSelectedSheetId
  );

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CardHeader className="pb-2">
            {/* 카드 타이틀 행 */}
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button
                  className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                  aria-expanded={isOpen}
                  aria-controls="soundcheck-content"
                >
                  <Headphones className="h-4 w-4 text-cyan-500" aria-hidden="true" />
                  <CardTitle className="text-sm font-semibold">
                    사운드체크 시트
                  </CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-cyan-100 text-cyan-800 border border-cyan-300">
                    {stats.totalSheets}개 시트
                  </Badge>
                  {isOpen ? (
                    <ChevronUp className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                  )}
                </button>
              </CollapsibleTrigger>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => { e.stopPropagation(); openAddSheet(); }}
                aria-label="새 시트 추가"
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                시트 추가
              </Button>
            </div>

            {/* 전체 요약 통계 */}
            {stats.totalSheets > 0 && (
              <div className="mt-1.5 space-y-1.5">
                <div className="flex gap-3 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">
                    시트{" "}
                    <span className="font-semibold text-foreground">{stats.totalSheets}</span>
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
                    <span className="font-semibold text-foreground">{stats.completionRate}%</span>
                  </span>
                </div>
                {stats.totalChannels > 0 && (
                  <Progress
                    value={stats.completionRate}
                    className="h-1"
                    aria-label={`전체 완료율 ${stats.completionRate}%`}
                  />
                )}
              </div>
            )}
          </CardHeader>

          <CollapsibleContent id="soundcheck-content">
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
                  <div
                    className="flex gap-1.5 flex-wrap"
                    role="tablist"
                    aria-label="사운드체크 시트 목록"
                  >
                    {sheets.map((sheet) => (
                      <button
                        key={sheet.id}
                        role="tab"
                        aria-selected={currentSheet?.id === sheet.id}
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
                    <div className="space-y-2" role="tabpanel">
                      {/* 시트 헤더 (메타정보 + 완료율) */}
                      <SheetHeader
                        sheet={currentSheet}
                        checkedCount={currentChecked}
                        totalCount={currentTotal}
                        rate={currentRate}
                        onEdit={() => openEditSheet(currentSheet)}
                        onDelete={() => handleDeleteSheet(currentSheet)}
                      />

                      {/* 채널 목록 상단 툴바 */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          채널 목록 ({sortedChannels.length}채널)
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          onClick={openAddChannel}
                          aria-label="채널 추가"
                        >
                          <Plus className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
                          채널 추가
                        </Button>
                      </div>

                      {/* 채널 목록 */}
                      {sortedChannels.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground text-center py-3">
                          채널을 추가해 사운드체크 시트를 구성해보세요.
                        </p>
                      ) : (
                        <div
                          className="space-y-1.5"
                          role="list"
                          aria-label="채널 목록"
                        >
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
                              onMoveDown={() => handleMoveChannel(channel, "down")}
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
        isEdit={isEditSheet}
      />

      {/* 채널 추가/편집 다이얼로그 */}
      <ChannelDialog
        open={channelDialogOpen}
        onOpenChange={setChannelDialogOpen}
        form={channelForm}
        setForm={setChannelForm}
        onSave={handleChannelSave}
        saving={channelSaving}
        isEdit={isEditChannel}
      />
    </>
  );
}
