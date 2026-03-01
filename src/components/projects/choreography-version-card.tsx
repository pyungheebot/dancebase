"use client";

import { useState } from "react";
import { useChoreographyVersion } from "@/hooks/use-choreography-version";
import type { ChoreoVersion, ChoreoVersionStatus, ChoreoSectionNote } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronDown,
  ChevronRight,
  GitBranch,
  Plus,
  Trash2,
  FileText,
  Check,
  Archive,
  Clock,
  User,
  GitCompare,
  Star,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useAsyncAction } from "@/hooks/use-async-action";

// ============================================
// 상태 배지 색상/라벨
// ============================================

const STATUS_CONFIG: Record<
  ChoreoVersionStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "초안",
    className: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100",
  },
  review: {
    label: "검토중",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
  },
  approved: {
    label: "확정",
    className: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
  },
  archived: {
    label: "보관",
    className: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  },
};

const STATUS_ORDER: ChoreoVersionStatus[] = ["draft", "review", "approved", "archived"];

// ============================================
// 섹션 노트 입력 행
// ============================================

interface SectionNoteRowProps {
  section: Omit<ChoreoSectionNote, "changed">;
  onChange: (patch: Partial<Omit<ChoreoSectionNote, "changed">>) => void;
  onDelete: () => void;
}

function SectionNoteRow({ section, onChange, onDelete }: SectionNoteRowProps) {
  return (
    <div className="border rounded-md p-2.5 space-y-1.5 bg-background">
      <div className="flex items-center gap-2">
        <Input
          value={section.sectionName}
          onChange={(e) => onChange({ sectionName: e.target.value })}
          placeholder="구간명 (예: 인트로, 1절)"
          className="h-7 text-xs flex-1"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
      <Textarea
        value={section.content}
        onChange={(e) => onChange({ content: e.target.value })}
        placeholder="이 구간 안무 노트를 입력하세요"
        className="text-xs resize-none min-h-[48px]"
      />
    </div>
  );
}

// ============================================
// 버전 추가 폼
// ============================================

interface AddVersionFormProps {
  onAdd: (payload: {
    label: string;
    description: string;
    sections: Omit<ChoreoSectionNote, "changed">[];
    createdBy: string;
  }) => boolean;
  onClose: () => void;
}

type SectionDraft = {
  id: string;
  sectionName: string;
  content: string;
};

function AddVersionForm({ onAdd, onClose }: AddVersionFormProps) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [sections, setSections] = useState<SectionDraft[]>([
    { id: crypto.randomUUID(), sectionName: "", content: "" },
  ]);
  const { pending: submitting, execute } = useAsyncAction();

  function handleAddSection() {
    if (sections.length >= 20) {
      toast.error("구간은 최대 20개까지 추가할 수 있습니다.");
      return;
    }
    setSections((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sectionName: "", content: "" },
    ]);
  }

  function handleSectionChange(id: string, patch: Partial<Omit<SectionDraft, "id">>) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

  function handleSectionDelete(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleSubmit() {
    if (!label.trim()) {
      toast.error("버전 라벨을 입력하세요. (예: 초안, 수정본)");
      return;
    }
    const validSections = sections.filter((s) => s.sectionName.trim());
    await execute(async () => {
      const ok = onAdd({
        label,
        description,
        sections: validSections.map(({ sectionName, content }) => ({
          sectionName,
          content,
        })),
        createdBy,
      });
      if (ok) {
        toast.success("새 버전이 추가되었습니다.");
        onClose();
      } else {
        toast.error("버전은 최대 20개까지 추가할 수 있습니다.");
      }
    });
  }

  return (
    <div className="border rounded-md p-3 space-y-3 bg-muted/30 mt-2">
      <p className="text-xs font-medium text-muted-foreground">새 버전 추가</p>

      {/* 라벨 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-0.5 block">
          버전 라벨 *
        </Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="예: 초안, 수정본, 최종본, v2"
          className="h-7 text-xs"
          autoFocus
        />
      </div>

      {/* 변경사항 설명 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-0.5 block">
          주요 변경사항
        </Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="이 버전에서 달라진 점을 적어주세요"
          className="text-xs resize-none min-h-[56px]"
        />
      </div>

      {/* 수정자 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-0.5 block">
          수정자
        </Label>
        <Input
          value={createdBy}
          onChange={(e) => setCreatedBy(e.target.value)}
          placeholder="이름 또는 닉네임 (선택)"
          className="h-7 text-xs"
        />
      </div>

      {/* 섹션별 노트 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-muted-foreground">구간별 노트</Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] text-muted-foreground gap-0.5"
            onClick={handleAddSection}
          >
            <Plus className="h-3 w-3" />
            구간 추가
          </Button>
        </div>
        {sections.map((sec) => (
          <SectionNoteRow
            key={sec.id}
            section={sec}
            onChange={(patch) => handleSectionChange(sec.id, patch)}
            onDelete={() => handleSectionDelete(sec.id)}
          />
        ))}
      </div>

      <div className="flex gap-1.5 pt-1">
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={handleSubmit}
          disabled={submitting || !label.trim()}
        >
          <Plus className="h-3 w-3 mr-1" />
          추가
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onClose}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 섹션 노트 표시 행 (읽기 전용)
// ============================================

interface SectionNoteDisplayProps {
  section: ChoreoSectionNote;
  highlight?: boolean;
}

function SectionNoteDisplay({ section, highlight }: SectionNoteDisplayProps) {
  return (
    <div
      className={`flex items-start gap-2 rounded-md px-2.5 py-1.5 ${
        highlight
          ? "bg-amber-50 border border-amber-200"
          : "bg-muted/20"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-foreground">
            {section.sectionName}
          </span>
          {section.changed && (
            <Badge className="text-[9px] px-1 py-0 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 shrink-0">
              변경
            </Badge>
          )}
        </div>
        {section.content && (
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 whitespace-pre-wrap">
            {section.content}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// 버전 아이템 (타임라인 노드)
// ============================================

interface VersionItemProps {
  version: ChoreoVersion;
  isCurrent: boolean;
  isFirst: boolean;
  isLast: boolean;
  compareMode: boolean;
  selectedForCompare: string[];
  onSetCurrent: () => void;
  onStatusChange: (status: ChoreoVersionStatus) => void;
  onDelete: () => void;
  onToggleCompare: () => void;
}

function VersionItem({
  version,
  isCurrent,
  isFirst,
  isLast,
  compareMode,
  selectedForCompare,
  onSetCurrent,
  onStatusChange,
  onDelete,
  onToggleCompare,
}: VersionItemProps) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[version.status];
  const isSelectedForCompare = selectedForCompare.includes(version.id);

  return (
    <div className="flex gap-3">
      {/* 타임라인 선 + 노드 */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-3 h-3 rounded-full border-2 mt-1.5 shrink-0 ${
            isCurrent
              ? "bg-purple-500 border-purple-500"
              : "bg-background border-muted-foreground/30"
          }`}
        />
        {!isLast && (
          <div className="w-px flex-1 bg-muted-foreground/20 mt-1" />
        )}
      </div>

      {/* 버전 카드 */}
      <div
        className={`flex-1 mb-3 border rounded-md overflow-hidden ${
          isCurrent ? "border-purple-300 shadow-sm" : ""
        } ${isSelectedForCompare ? "ring-2 ring-blue-400" : ""}`}
      >
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/20 transition-colors group">
              <div className="flex items-center gap-2 min-w-0">
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <GitBranch className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                <span className="text-xs font-semibold shrink-0">
                  v{version.versionNumber}
                </span>
                <span className="text-xs text-foreground truncate">
                  {version.label}
                </span>
                <Badge className={`text-[9px] px-1.5 py-0 shrink-0 ${statusCfg.className}`}>
                  {statusCfg.label}
                </Badge>
                {isCurrent && (
                  <Badge className="text-[9px] px-1.5 py-0 shrink-0 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
                    현재
                  </Badge>
                )}
              </div>

              {/* 액션 버튼들 */}
              <div
                className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {compareMode && (
                  <Button
                    variant={isSelectedForCompare ? "default" : "ghost"}
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onToggleCompare}
                    title="비교 선택"
                  >
                    <GitCompare className="h-3 w-3" />
                  </Button>
                )}
                {!isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onSetCurrent}
                    title="현재 버전으로 설정"
                  >
                    <Star className="h-3 w-3 text-muted-foreground" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={onDelete}
                  title="삭제"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>
          </CollapsibleTrigger>

          {/* 상세 내용 */}
          <CollapsibleContent>
            <div className="px-3 pb-3 pt-2 border-t space-y-2.5">
              {/* 메타 정보 */}
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {version.createdBy && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      {version.createdBy}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(version.createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* 변경사항 설명 */}
              {version.description && (
                <div className="flex items-start gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {version.description}
                  </p>
                </div>
              )}

              {/* 섹션 노트 */}
              {version.sections.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">
                    구간별 노트 ({version.sections.length})
                  </p>
                  <div className="space-y-1">
                    {version.sections.map((sec, idx) => (
                      <SectionNoteDisplay
                        key={idx}
                        section={sec}
                        highlight={sec.changed}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 상태 변경 버튼 */}
              <div className="flex flex-wrap gap-1 pt-1">
                {STATUS_ORDER.map((s) => (
                  <Button
                    key={s}
                    variant={version.status === s ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[10px]"
                    onClick={() => onStatusChange(s)}
                  >
                    {s === "draft" && <Pencil className="h-2.5 w-2.5 mr-0.5" />}
                    {s === "review" && <FileText className="h-2.5 w-2.5 mr-0.5" />}
                    {s === "approved" && <Check className="h-2.5 w-2.5 mr-0.5" />}
                    {s === "archived" && <Archive className="h-2.5 w-2.5 mr-0.5" />}
                    {STATUS_CONFIG[s].label}
                  </Button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

// ============================================
// 버전 비교 패널
// ============================================

interface CompareResultPanelProps {
  versionA: ChoreoVersion;
  versionB: ChoreoVersion;
  diffSections: ChoreoSectionNote[];
}

function CompareResultPanel({
  versionA,
  versionB,
  diffSections,
}: CompareResultPanelProps) {
  const changedCount = diffSections.filter((s) => s.changed).length;

  return (
    <div className="border rounded-md p-3 bg-blue-50/50 space-y-2">
      <div className="flex items-center gap-2">
        <GitCompare className="h-3.5 w-3.5 text-blue-600 shrink-0" />
        <span className="text-xs font-medium">
          v{versionA.versionNumber} ({versionA.label}) vs v{versionB.versionNumber} ({versionB.label})
        </span>
        {changedCount > 0 ? (
          <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
            {changedCount}개 변경
          </Badge>
        ) : (
          <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
            변경 없음
          </Badge>
        )}
      </div>

      {diffSections.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">비교할 구간 노트가 없습니다.</p>
      ) : (
        <div className="space-y-1">
          {diffSections.map((sec, idx) => (
            <SectionNoteDisplay key={idx} section={sec} highlight={sec.changed} />
          ))}
        </div>
      )}
    </div>
  );
}

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

  // 곡 제목 편집 시작
  function handleEditTitle() {
    setTitleInput(store.songTitle);
    setEditingTitle(true);
  }

  function handleSaveTitle() {
    updateSongTitle(titleInput.trim());
    setEditingTitle(false);
    toast.success("곡 제목이 저장되었습니다.");
  }

  // 비교 선택 토글
  function handleToggleCompare(versionId: string) {
    setSelectedForCompare((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      }
      if (prev.length >= 2) {
        toast.error("두 버전만 선택할 수 있습니다.");
        return prev;
      }
      return [...prev, versionId];
    });
    setCompareResult(null);
  }

  // 비교 실행
  function handleRunCompare() {
    if (selectedForCompare.length !== 2) {
      toast.error("비교할 두 버전을 선택하세요.");
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
    <Collapsible open={cardExpanded} onOpenChange={setCardExpanded}>
      <div className="border rounded-lg overflow-hidden">
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-left min-w-0">
              {cardExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <GitBranch className="h-4 w-4 text-purple-500 shrink-0" />
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
                onClick={() => {
                  if (compareMode) {
                    handleExitCompareMode();
                  } else {
                    setCompareMode(true);
                    setCompareResult(null);
                  }
                }}
              >
                <GitCompare className="h-3 w-3 mr-1" />
                비교
              </Button>
            )}
            {canAdd && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setFormOpen((v) => !v)}
              >
                <Plus className="h-3 w-3 mr-1" />
                버전 추가
              </Button>
            )}
          </div>
        </div>

        {/* 카드 본문 */}
        <CollapsibleContent>
          <div className="p-4 space-y-3">
            {/* 곡 제목 */}
            <div className="flex items-center gap-2">
              {editingTitle ? (
                <>
                  <Input
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="곡 제목을 입력하세요"
                    className="h-7 text-xs flex-1"
                    autoFocus
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
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span
                    className={`text-sm ${
                      store.songTitle
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {store.songTitle || "곡 제목 미입력"}
                  </span>
                  <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>

            {/* 비교 모드 컨트롤 */}
            {compareMode && (
              <div className="border rounded-md p-2.5 bg-blue-50/50 space-y-2">
                <p className="text-xs text-blue-700 font-medium">
                  비교할 버전을 두 개 선택하세요 ({selectedForCompare.length}/2)
                </p>
                {selectedForCompare.length === 2 && (
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleRunCompare}
                  >
                    <GitCompare className="h-3 w-3 mr-1" />
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
              <AddVersionForm
                onAdd={addVersion}
                onClose={() => setFormOpen(false)}
              />
            )}

            {/* 버전 타임라인 */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            ) : store.versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <GitBranch className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-xs">등록된 버전이 없습니다.</p>
                <p className="text-[10px] mt-0.5">
                  위 &apos;버전 추가&apos; 버튼으로 첫 버전을 등록하세요.
                </p>
              </div>
            ) : (
              <div>
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
              <div className="flex flex-wrap gap-2 pt-1 border-t">
                <span className="text-[10px] text-muted-foreground">
                  전체 {stats.totalVersions}개
                </span>
                {stats.draftCount > 0 && (
                  <span className="text-[10px] text-gray-600">
                    초안 {stats.draftCount}
                  </span>
                )}
                {stats.reviewCount > 0 && (
                  <span className="text-[10px] text-yellow-600">
                    검토중 {stats.reviewCount}
                  </span>
                )}
                {stats.approvedCount > 0 && (
                  <span className="text-[10px] text-green-600">
                    확정 {stats.approvedCount}
                  </span>
                )}
                {stats.archivedCount > 0 && (
                  <span className="text-[10px] text-blue-600">
                    보관 {stats.archivedCount}
                  </span>
                )}
              </div>
            )}

            {!canAdd && (
              <p className="text-[11px] text-muted-foreground text-center pt-1">
                버전은 최대 20개까지 등록할 수 있습니다.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
