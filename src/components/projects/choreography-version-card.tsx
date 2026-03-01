"use client";

import { useState } from "react";
import { useChoreographyVersion } from "@/hooks/use-choreography-version";
import type { ChoreoVersion, ChoreoSectionNote } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronRight,
  GitBranch,
  Plus,
  FileText,
  GitCompare,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

import { STATUS_CONFIG } from "./choreography-version/types";
import { AddVersionForm } from "./choreography-version/add-version-form";
import { CompareResultPanel } from "./choreography-version/compare-result-panel";
import { VersionItem } from "./choreography-version/version-item";
import { VersionStats } from "./choreography-version/version-stats";

// ============================================
// 메인 카드
// ============================================

interface ChoreographyVersionCardProps {
  groupId: string;
  projectId: string;
}

export function ChoreographyVersionCard({
  groupId,
  projectId,
}: ChoreographyVersionCardProps) {
  const {
    store,
    loading,
    canAdd,
    stats,
    updateSongTitle,
    addVersion,
    updateVersionStatus,
    setCurrentVersion,
    deleteVersion,
    compareVersions,
  } = useChoreographyVersion(groupId, projectId);

  const [cardExpanded, setCardExpanded] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareResult, setCompareResult] = useState<{
    versionA: ChoreoVersion;
    versionB: ChoreoVersion;
    sections: ChoreoSectionNote[];
  } | null>(null);

  const titleInputId = "choreo-song-title-input";
  const comparePanelId = "choreo-compare-panel";

  // 곡 제목 편집 시작
  function handleEditTitle() {
    setTitleInput(store.songTitle);
    setEditingTitle(true);
  }

  function handleSaveTitle() {
    updateSongTitle(titleInput.trim());
    setEditingTitle(false);
    toast.success(TOAST.CHOREO_VERSION.SONG_TITLE_SAVED);
  }

  // 비교 선택 토글
  function handleToggleCompare(versionId: string) {
    setSelectedForCompare((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      }
      if (prev.length >= 2) {
        toast.error(TOAST.CHOREO_VERSION.COMPARE_MAX);
        return prev;
      }
      return [...prev, versionId];
    });
    setCompareResult(null);
  }

  // 비교 실행
  function handleRunCompare() {
    if (selectedForCompare.length !== 2) {
      toast.error(TOAST.CHOREO_VERSION.COMPARE_SELECT);
      return;
    }
    const [idA, idB] = selectedForCompare;
    if (!idA || !idB) return;
    const vA = store.versions.find((v) => v.id === idA);
    const vB = store.versions.find((v) => v.id === idB);
    if (!vA || !vB) return;
    const sections = compareVersions(idA, idB);
    setCompareResult({ versionA: vA, versionB: vB, sections });
  }

  // 비교 모드 해제
  function handleExitCompareMode() {
    setCompareMode(false);
    setSelectedForCompare([]);
    setCompareResult(null);
  }

  function handleDeleteVersion(version: ChoreoVersion) {
    deleteVersion(version.id);
    toast.success(`v${version.versionNumber} (${version.label})이 삭제되었습니다.`);
  }

  return (
    <Collapsible
      open={cardExpanded}
      onOpenChange={setCardExpanded}
      aria-label="안무 버전 관리"
    >
      <div className="border rounded-lg overflow-hidden">
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b">
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center gap-2 text-left min-w-0"
              aria-expanded={cardExpanded}
              aria-controls="choreo-version-body"
            >
              {cardExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              )}
              <GitBranch className="h-4 w-4 text-purple-500 shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold">안무 버전 관리</span>
              {store.versions.length > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
                  {store.versions.length}/{20}
                </Badge>
              )}
              {stats.approvedCount > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                  확정 {stats.approvedCount}
                </Badge>
              )}
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1 shrink-0">
            {store.versions.length >= 2 && (
              <Button
                size="sm"
                variant={compareMode ? "default" : "ghost"}
                className="h-7 text-xs"
                aria-pressed={compareMode}
                aria-controls={comparePanelId}
                onClick={() => {
                  if (compareMode) {
                    handleExitCompareMode();
                  } else {
                    setCompareMode(true);
                    setCompareResult(null);
                  }
                }}
              >
                <GitCompare className="h-3 w-3 mr-1" aria-hidden="true" />
                비교
              </Button>
            )}
            {canAdd && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                aria-expanded={formOpen}
                aria-controls="choreo-add-version-form"
                onClick={() => setFormOpen((v) => !v)}
              >
                <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                버전 추가
              </Button>
            )}
          </div>
        </div>

        {/* 카드 본문 */}
        <CollapsibleContent id="choreo-version-body">
          <div className="p-4 space-y-3">
            {/* 곡 제목 */}
            <div className="flex items-center gap-2">
              {editingTitle ? (
                <>
                  <label htmlFor={titleInputId} className="sr-only">
                    곡 제목
                  </label>
                  <Input
                    id={titleInputId}
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="곡 제목을 입력하세요"
                    className="h-7 text-xs flex-1"
                    autoFocus
                    aria-label="곡 제목 입력"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTitle();
                      if (e.key === "Escape") setEditingTitle(false);
                    }}
                  />
                  <Button size="sm" className="h-7 text-xs" onClick={handleSaveTitle}>
                    저장
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setEditingTitle(false)}
                  >
                    취소
                  </Button>
                </>
              ) : (
                <button
                  className="flex items-center gap-1.5 group"
                  onClick={handleEditTitle}
                  aria-label={`곡 제목 편집: ${store.songTitle || "미입력"}`}
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span
                    className={`text-sm ${
                      store.songTitle
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {store.songTitle || "곡 제목 미입력"}
                  </span>
                  <Pencil
                    className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>

            {/* 비교 모드 컨트롤 */}
            {compareMode && (
              <div
                id={comparePanelId}
                role="region"
                aria-label="버전 비교 선택"
                aria-live="polite"
                className="border rounded-md p-2.5 bg-blue-50/50 space-y-2"
              >
                <p className="text-xs text-blue-700 font-medium">
                  비교할 버전을 두 개 선택하세요 (
                  <span aria-live="polite">{selectedForCompare.length}</span>/2)
                </p>
                {selectedForCompare.length === 2 && (
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleRunCompare}
                  >
                    <GitCompare className="h-3 w-3 mr-1" aria-hidden="true" />
                    비교 실행
                  </Button>
                )}
              </div>
            )}

            {/* 비교 결과 */}
            {compareResult && (
              <CompareResultPanel
                versionA={compareResult.versionA}
                versionB={compareResult.versionB}
                diffSections={compareResult.sections}
              />
            )}

            {/* 버전 추가 폼 */}
            {formOpen && (
              <div id="choreo-add-version-form">
                <AddVersionForm
                  onAdd={addVersion}
                  onClose={() => setFormOpen(false)}
                />
              </div>
            )}

            {/* 버전 타임라인 */}
            {loading ? (
              <div className="space-y-2" aria-busy="true" aria-label="버전 목록 로딩 중">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            ) : store.versions.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-8 text-muted-foreground"
                role="status"
                aria-label="등록된 버전 없음"
              >
                <GitBranch className="h-8 w-8 mb-2 opacity-20" aria-hidden="true" />
                <p className="text-xs">등록된 버전이 없습니다.</p>
                <p className="text-[10px] mt-0.5">
                  위 &apos;버전 추가&apos; 버튼으로 첫 버전을 등록하세요.
                </p>
              </div>
            ) : (
              <div
                role="list"
                aria-label="안무 버전 목록"
              >
                {store.versions.map((version, idx) => (
                  <VersionItem
                    key={version.id}
                    version={version}
                    isCurrent={store.currentVersionId === version.id}
                    isFirst={idx === 0}
                    isLast={idx === store.versions.length - 1}
                    compareMode={compareMode}
                    selectedForCompare={selectedForCompare}
                    onSetCurrent={() => {
                      setCurrentVersion(version.id);
                      toast.success(
                        `v${version.versionNumber} (${version.label})을 현재 버전으로 설정했습니다.`
                      );
                    }}
                    onStatusChange={(status) => {
                      updateVersionStatus(version.id, status);
                      toast.success(
                        `v${version.versionNumber} 상태가 "${STATUS_CONFIG[status].label}"로 변경되었습니다.`
                      );
                    }}
                    onDelete={() => handleDeleteVersion(version)}
                    onToggleCompare={() => handleToggleCompare(version.id)}
                  />
                ))}
              </div>
            )}

            {/* 통계 요약 */}
            {store.versions.length > 0 && (
              <VersionStats
                totalVersions={stats.totalVersions}
                draftCount={stats.draftCount}
                reviewCount={stats.reviewCount}
                approvedCount={stats.approvedCount}
                archivedCount={stats.archivedCount}
              />
            )}

            {!canAdd && (
              <p
                className="text-[11px] text-muted-foreground text-center pt-1"
                role="status"
              >
                버전은 최대 20개까지 등록할 수 있습니다.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
