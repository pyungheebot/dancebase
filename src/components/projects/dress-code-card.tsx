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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Shirt,
  Pencil,
  CheckCircle2,
  Circle,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { useDressCode } from "@/hooks/use-dress-code";
import type { DressCodeCategory, DressCodeGuideItem, DressCodeSet } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const CATEGORY_LABELS: Record<DressCodeCategory, string> = {
  outfit: "의상",
  hair: "헤어",
  makeup: "메이크업",
  accessories: "악세사리",
  shoes: "신발",
};

const CATEGORY_COLORS: Record<DressCodeCategory, string> = {
  outfit: "bg-purple-100 text-purple-700 border-purple-200",
  hair: "bg-pink-100 text-pink-700 border-pink-200",
  makeup: "bg-rose-100 text-rose-700 border-rose-200",
  accessories: "bg-yellow-100 text-yellow-700 border-yellow-200",
  shoes: "bg-orange-100 text-orange-700 border-orange-200",
};

const ALL_CATEGORIES: DressCodeCategory[] = [
  "outfit",
  "hair",
  "makeup",
  "accessories",
  "shoes",
];

// ============================================================
// 가이드 추가/편집 다이얼로그
// ============================================================

type GuideDialogMode = "add" | "edit";

interface GuideDialogProps {
  open: boolean;
  mode: GuideDialogMode;
  initial?: Partial<Omit<DressCodeGuideItem, "id">>;
  onClose: () => void;
  onSubmit: (data: Omit<DressCodeGuideItem, "id">) => void;
}

function GuideDialog({ open, mode, initial, onClose, onSubmit }: GuideDialogProps) {
  const [category, setCategory] = useState<DressCodeCategory>(
    initial?.category ?? "outfit"
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [colorCode, setColorCode] = useState(initial?.colorCode ?? "");
  const [imageDescription, setImageDescription] = useState(
    initial?.imageDescription ?? ""
  );
  const [isRequired, setIsRequired] = useState(initial?.isRequired ?? true);

  // 다이얼로그 열릴 때 초기값 동기화
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("항목 제목을 입력해주세요.");
      return;
    }
    if (!description.trim()) {
      toast.error("항목 설명을 입력해주세요.");
      return;
    }
    onSubmit({
      category,
      title: title.trim(),
      description: description.trim(),
      colorCode: colorCode.trim() || undefined,
      imageDescription: imageDescription.trim() || undefined,
      isRequired,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "가이드 항목 추가" : "가이드 항목 편집"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as DressCodeCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">항목 제목</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 블랙 슬랙스"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">설명</Label>
            <Textarea
              className="text-xs min-h-[64px] resize-none"
              placeholder="예: 무릎 위 10cm 기장, 핏이 맞는 스타일"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* 색상 코드 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              색상 코드 (선택)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                className="h-8 text-xs flex-1"
                placeholder="#000000 또는 블랙"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
              />
              {colorCode && colorCode.startsWith("#") && (
                <div
                  className="h-8 w-8 rounded border border-border flex-shrink-0"
                  style={{ backgroundColor: colorCode }}
                />
              )}
            </div>
          </div>

          {/* 이미지 설명 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              이미지 설명 (선택)
            </Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 참고 이미지 URL 또는 설명"
              value={imageDescription}
              onChange={(e) => setImageDescription(e.target.value)}
            />
          </div>

          {/* 필수 여부 */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="isRequired"
              checked={isRequired}
              onCheckedChange={(checked) => setIsRequired(checked === true)}
            />
            <Label htmlFor="isRequired" className="text-xs cursor-pointer">
              필수 항목
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 카테고리별 가이드 섹션
// ============================================================

interface GuideSectionProps {
  category: DressCodeCategory;
  guides: DressCodeGuideItem[];
  memberNames: string[];
  memberStatuses: DressCodeSet["memberStatuses"];
  onToggleMember: (memberName: string, itemId: string) => void;
  onEditGuide: (guide: DressCodeGuideItem) => void;
  onDeleteGuide: (guideId: string) => void;
}

function GuideSection({
  category,
  guides,
  memberNames,
  memberStatuses,
  onToggleMember,
  onEditGuide,
  onDeleteGuide,
}: GuideSectionProps) {
  if (guides.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[category]}`}
        >
          {CATEGORY_LABELS[category]}
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          {guides.length}개 항목
        </span>
      </div>

      <div className="space-y-2">
        {guides.map((guide) => {
          const readyCount = memberNames.filter((name) =>
            memberStatuses.some(
              (ms) => ms.memberName === name && ms.itemId === guide.id && ms.isReady
            )
          ).length;

          return (
            <div
              key={guide.id}
              className="border rounded-md p-2.5 bg-muted/20 space-y-2"
            >
              {/* 가이드 헤더 */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-medium">{guide.title}</span>
                    {guide.isRequired && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 border-red-200 text-red-600 bg-red-50"
                      >
                        필수
                      </Badge>
                    )}
                    {guide.colorCode && (
                      <div className="flex items-center gap-1">
                        {guide.colorCode.startsWith("#") ? (
                          <div
                            className="h-3 w-3 rounded-sm border border-border"
                            style={{ backgroundColor: guide.colorCode }}
                            title={guide.colorCode}
                          />
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            {guide.colorCode}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {guide.description}
                  </p>
                  {guide.imageDescription && (
                    <p className="text-[10px] text-blue-500 mt-0.5">
                      참고: {guide.imageDescription}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onEditGuide(guide)}
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onDeleteGuide(guide.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              {/* 멤버 준비 현황 */}
              {memberNames.length > 0 && (
                <div className="border-t pt-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">
                      멤버 준비 현황
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {readyCount}/{memberNames.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {memberNames.map((memberName) => {
                      const isReady = memberStatuses.some(
                        (ms) =>
                          ms.memberName === memberName &&
                          ms.itemId === guide.id &&
                          ms.isReady
                      );
                      return (
                        <button
                          key={memberName}
                          onClick={() => onToggleMember(memberName, guide.id)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                            isReady
                              ? "bg-green-50 border-green-200 text-green-700"
                              : "bg-muted/40 border-border text-muted-foreground hover:bg-muted/60"
                          }`}
                        >
                          {isReady ? (
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          ) : (
                            <Circle className="h-2.5 w-2.5" />
                          )}
                          {memberName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 멤버별 준비율 매트릭스
// ============================================================

interface MemberMatrixProps {
  set: DressCodeSet;
  memberNames: string[];
  onToggleMember: (memberName: string, itemId: string) => void;
}

function MemberMatrix({ set, memberNames, onToggleMember }: MemberMatrixProps) {
  if (memberNames.length === 0 || set.guides.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground">
        멤버별 준비 현황 매트릭스
      </h4>
      <div className="overflow-x-auto">
        <table className="min-w-full text-[10px]">
          <thead>
            <tr>
              <th className="text-left py-1 pr-2 text-muted-foreground font-medium sticky left-0 bg-background">
                멤버
              </th>
              {set.guides.map((guide) => (
                <th
                  key={guide.id}
                  className="text-center py-1 px-1 text-muted-foreground font-medium min-w-[48px]"
                  title={guide.title}
                >
                  <div className="truncate max-w-[48px]">{guide.title}</div>
                </th>
              ))}
              <th className="text-center py-1 px-2 text-muted-foreground font-medium">
                준비율
              </th>
            </tr>
          </thead>
          <tbody>
            {memberNames.map((memberName) => {
              const readyCount = set.guides.filter((guide) =>
                set.memberStatuses.some(
                  (ms) =>
                    ms.memberName === memberName &&
                    ms.itemId === guide.id &&
                    ms.isReady
                )
              ).length;
              const percentage = Math.round(
                (readyCount / set.guides.length) * 100
              );

              return (
                <tr key={memberName} className="border-t border-border/50">
                  <td className="py-1.5 pr-2 font-medium sticky left-0 bg-background">
                    {memberName}
                  </td>
                  {set.guides.map((guide) => {
                    const isReady = set.memberStatuses.some(
                      (ms) =>
                        ms.memberName === memberName &&
                        ms.itemId === guide.id &&
                        ms.isReady
                    );
                    return (
                      <td key={guide.id} className="text-center py-1.5 px-1">
                        <button
                          onClick={() => onToggleMember(memberName, guide.id)}
                          className="mx-auto flex items-center justify-center"
                        >
                          {isReady ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                  <td className="text-center py-1.5 px-2">
                    <span
                      className={`font-medium ${
                        percentage === 100
                          ? "text-green-600"
                          : percentage >= 50
                            ? "text-yellow-600"
                            : "text-red-500"
                      }`}
                    >
                      {percentage}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface DressCodeCardProps {
  groupId: string;
  projectId: string;
  memberNames?: string[];
}

export function DressCodeCard({
  groupId,
  projectId,
  memberNames = [],
}: DressCodeCardProps) {
  const {
    sets,
    loading,
    addSet,

    deleteSet,
    addGuide,
    updateGuide,
    deleteGuide,
    toggleMemberReady,
    getMemberReadiness,
    stats,
  } = useDressCode(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);

  // 세트 추가 다이얼로그
  const [addSetDialogOpen, setAddSetDialogOpen] = useState(false);
  const [newSetName, setNewSetName] = useState("");

  // 가이드 다이얼로그
  const [guideDialog, setGuideDialog] = useState<{
    open: boolean;
    mode: GuideDialogMode;
    editTarget?: DressCodeGuideItem;
  }>({ open: false, mode: "add" });

  // 선택된 세트
  const selectedSet = useMemo(
    () => sets.find((s) => s.id === selectedSetId) ?? sets[0] ?? null,
    [sets, selectedSetId]
  );

  // 세트 자동 선택
  const effectiveSetId = selectedSet?.id ?? null;

  // 선택 세트의 카테고리별 가이드
  const guidesByCategory = useMemo(() => {
    if (!selectedSet) return {} as Record<DressCodeCategory, DressCodeGuideItem[]>;
    return ALL_CATEGORIES.reduce(
      (acc, cat) => {
        acc[cat] = selectedSet.guides.filter((g) => g.category === cat);
        return acc;
      },
      {} as Record<DressCodeCategory, DressCodeGuideItem[]>
    );
  }, [selectedSet]);

  // 선택 세트의 전체 준비율
  const setReadiness = useMemo(() => {
    if (!selectedSet || memberNames.length === 0 || selectedSet.guides.length === 0)
      return 0;
    const readiness = getMemberReadiness(selectedSet.id, memberNames);
    if (readiness.length === 0) return 0;
    const avg = readiness.reduce((sum, r) => sum + r.percentage, 0) / readiness.length;
    return Math.round(avg);
  }, [selectedSet, memberNames, getMemberReadiness]);

  // ── 핸들러 ──────────────────────────────────────────────

  const handleAddSet = () => {
    if (!newSetName.trim()) {
      toast.error("공연명을 입력해주세요.");
      return;
    }
    const newSet = addSet(newSetName.trim());
    setSelectedSetId(newSet.id);
    setNewSetName("");
    setAddSetDialogOpen(false);
    toast.success("드레스 코드 세트가 추가되었습니다.");
  };

  const handleDeleteSet = (setId: string) => {
    const ok = deleteSet(setId);
    if (ok) {
      if (effectiveSetId === setId) setSelectedSetId(null);
      toast.success("드레스 코드 세트가 삭제되었습니다.");
    }
  };

  const handleAddGuide = (data: Omit<DressCodeGuideItem, "id">) => {
    if (!effectiveSetId) return;
    const result = addGuide(effectiveSetId, data);
    if (result) {
      toast.success("가이드 항목이 추가되었습니다.");
    } else {
      toast.error("가이드 항목 추가에 실패했습니다.");
    }
  };

  const handleEditGuide = (guide: DressCodeGuideItem) => {
    setGuideDialog({ open: true, mode: "edit", editTarget: guide });
  };

  const handleUpdateGuide = (data: Omit<DressCodeGuideItem, "id">) => {
    if (!effectiveSetId || !guideDialog.editTarget) return;
    const ok = updateGuide(effectiveSetId, guideDialog.editTarget.id, data);
    if (ok) {
      toast.success("가이드 항목이 수정되었습니다.");
    } else {
      toast.error("가이드 항목 수정에 실패했습니다.");
    }
  };

  const handleDeleteGuide = (guideId: string) => {
    if (!effectiveSetId) return;
    const ok = deleteGuide(effectiveSetId, guideId);
    if (ok) {
      toast.success("가이드 항목이 삭제되었습니다.");
    } else {
      toast.error("가이드 항목 삭제에 실패했습니다.");
    }
  };

  const handleToggleMember = (memberName: string, itemId: string) => {
    if (!effectiveSetId) return;
    toggleMemberReady(effectiveSetId, memberName, itemId);
  };

  // ── 렌더 ─────────────────────────────────────────────────

  return (
    <>
      <Card className="w-full">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shirt className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-sm font-semibold">
                    공연 드레스 코드
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200"
                    >
                      {stats.totalSets}개 세트
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {stats.totalGuides}개 항목
                    </Badge>
                    {stats.totalSets > 0 && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${
                          stats.overallReadiness === 100
                            ? "bg-green-50 text-green-700 border-green-200"
                            : stats.overallReadiness >= 50
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        준비율 {stats.overallReadiness}%
                      </Badge>
                    )}
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-4">
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : (
                <>
                  {/* 세트 선택 & 추가 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        공연 선택
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setAddSetDialogOpen(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        공연 추가
                      </Button>
                    </div>

                    {sets.length === 0 ? (
                      <div className="border border-dashed rounded-md p-4 text-center">
                        <Shirt className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">
                          드레스 코드 세트가 없습니다.
                        </p>
                        <p className="text-[11px] text-muted-foreground/70">
                          공연 추가 버튼으로 첫 번째 세트를 만들어보세요.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {sets.map((set) => (
                          <button
                            key={set.id}
                            onClick={() => setSelectedSetId(set.id)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs border transition-colors ${
                              effectiveSetId === set.id
                                ? "bg-purple-100 border-purple-300 text-purple-800 font-medium"
                                : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                            }`}
                          >
                            <Star
                              className={`h-2.5 w-2.5 ${effectiveSetId === set.id ? "text-purple-500" : "text-muted-foreground/40"}`}
                            />
                            {set.performanceName}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSet(set.id);
                              }}
                              className="ml-1 hover:text-red-500"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 선택된 세트 내용 */}
                  {selectedSet && (
                    <div className="space-y-4 border-t pt-4">
                      {/* 세트 헤더 */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">
                          {selectedSet.performanceName}
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() =>
                            setGuideDialog({ open: true, mode: "add" })
                          }
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          항목 추가
                        </Button>
                      </div>

                      {/* 전체 준비율 */}
                      {memberNames.length > 0 && selectedSet.guides.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              전체 준비율
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                setReadiness === 100
                                  ? "text-green-600"
                                  : setReadiness >= 50
                                    ? "text-yellow-600"
                                    : "text-red-500"
                              }`}
                            >
                              {setReadiness}%
                            </span>
                          </div>
                          <Progress value={setReadiness} className="h-1.5" />
                        </div>
                      )}

                      {/* 가이드 없음 */}
                      {selectedSet.guides.length === 0 && (
                        <div className="border border-dashed rounded-md p-3 text-center">
                          <p className="text-xs text-muted-foreground">
                            가이드 항목이 없습니다.
                          </p>
                          <p className="text-[11px] text-muted-foreground/70">
                            항목 추가 버튼으로 의상/헤어/메이크업 가이드를 추가하세요.
                          </p>
                        </div>
                      )}

                      {/* 카테고리별 가이드 */}
                      {ALL_CATEGORIES.map((cat) => (
                        <GuideSection
                          key={cat}
                          category={cat}
                          guides={guidesByCategory[cat] ?? []}
                          memberNames={memberNames}
                          memberStatuses={selectedSet.memberStatuses}
                          onToggleMember={handleToggleMember}
                          onEditGuide={handleEditGuide}
                          onDeleteGuide={handleDeleteGuide}
                        />
                      ))}

                      {/* 멤버 매트릭스 */}
                      {memberNames.length > 0 && selectedSet.guides.length > 0 && (
                        <div className="border-t pt-4">
                          <MemberMatrix
                            set={selectedSet}
                            memberNames={memberNames}
                            onToggleMember={handleToggleMember}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 공연 추가 다이얼로그 */}
      <Dialog open={addSetDialogOpen} onOpenChange={setAddSetDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              드레스 코드 세트 추가
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs text-muted-foreground">공연명</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 2026 봄 정기공연"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddSet();
              }}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setAddSetDialogOpen(false);
                setNewSetName("");
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleAddSet}>
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 가이드 추가/편집 다이얼로그 */}
      {guideDialog.open && (
        <GuideDialog
          open={guideDialog.open}
          mode={guideDialog.mode}
          initial={
            guideDialog.editTarget
              ? {
                  category: guideDialog.editTarget.category,
                  title: guideDialog.editTarget.title,
                  description: guideDialog.editTarget.description,
                  colorCode: guideDialog.editTarget.colorCode,
                  imageDescription: guideDialog.editTarget.imageDescription,
                  isRequired: guideDialog.editTarget.isRequired,
                }
              : undefined
          }
          onClose={() => setGuideDialog({ open: false, mode: "add" })}
          onSubmit={
            guideDialog.mode === "add" ? handleAddGuide : handleUpdateGuide
          }
        />
      )}
    </>
  );
}
