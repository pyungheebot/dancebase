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
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Users,
  CloudRain,
  Wrench,
  HardHat,
  Volume2,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useStageRisk } from "@/hooks/use-stage-risk";
import type {
  StageRiskItem,
  StageRiskLevel,
  StageRiskCategory,
  StageRiskResponseStatus,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const LEVEL_LABELS: Record<StageRiskLevel, string> = {
  critical: "위험",
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const LEVEL_COLORS: Record<StageRiskLevel, string> = {
  critical: "bg-red-100 text-red-700 border-red-300",
  high: "bg-orange-100 text-orange-700 border-orange-300",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  low: "bg-green-100 text-green-700 border-green-300",
};

const LEVEL_DOT_COLORS: Record<StageRiskLevel, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

const LEVEL_MATRIX_BG: Record<StageRiskLevel, string> = {
  critical: "bg-red-200 text-red-800",
  high: "bg-orange-200 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const CATEGORY_LABELS: Record<StageRiskCategory, string> = {
  stage_structure: "무대 구조",
  lighting_electric: "조명/전기",
  sound: "음향",
  audience_safety: "관객 안전",
  performer_safety: "출연자 안전",
  weather: "날씨(야외)",
  other: "기타",
};

const CATEGORY_ICONS: Record<StageRiskCategory, React.ReactNode> = {
  stage_structure: <Wrench className="h-3 w-3" />,
  lighting_electric: <Zap className="h-3 w-3" />,
  sound: <Volume2 className="h-3 w-3" />,
  audience_safety: <Users className="h-3 w-3" />,
  performer_safety: <HardHat className="h-3 w-3" />,
  weather: <CloudRain className="h-3 w-3" />,
  other: <MoreHorizontal className="h-3 w-3" />,
};

const CATEGORY_BADGE_COLORS: Record<StageRiskCategory, string> = {
  stage_structure: "bg-stone-100 text-stone-700 border-stone-200",
  lighting_electric: "bg-yellow-50 text-yellow-700 border-yellow-200",
  sound: "bg-blue-50 text-blue-700 border-blue-200",
  audience_safety: "bg-purple-50 text-purple-700 border-purple-200",
  performer_safety: "bg-amber-50 text-amber-700 border-amber-200",
  weather: "bg-sky-50 text-sky-700 border-sky-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

const RESPONSE_LABELS: Record<StageRiskResponseStatus, string> = {
  pending: "미대응",
  in_progress: "대응중",
  done: "완료",
};

const RESPONSE_COLORS: Record<StageRiskResponseStatus, string> = {
  pending: "bg-gray-100 text-gray-600 border-gray-300",
  in_progress: "bg-blue-100 text-blue-700 border-blue-300",
  done: "bg-green-100 text-green-700 border-green-300",
};

const ALL_LEVELS: StageRiskLevel[] = ["critical", "high", "medium", "low"];
const ALL_CATEGORIES: StageRiskCategory[] = [
  "stage_structure",
  "lighting_electric",
  "sound",
  "audience_safety",
  "performer_safety",
  "weather",
  "other",
];
const ALL_RESPONSE_STATUSES: StageRiskResponseStatus[] = [
  "pending",
  "in_progress",
  "done",
];

// ============================================================
// 리스크 매트릭스 (5x5 CSS Grid)
// ============================================================

interface RiskMatrixProps {
  items: StageRiskItem[];
}

function RiskMatrix({ items }: RiskMatrixProps) {
  // 각 셀에 해당하는 항목 찾기
  function getItemsAt(likelihood: number, impact: number): StageRiskItem[] {
    return items.filter(
      (i) => i.likelihood === likelihood && i.impact === impact
    );
  }

  function getCellLevel(likelihood: number, impact: number): StageRiskLevel {
    const score = likelihood * impact;
    if (score <= 4) return "low";
    if (score <= 9) return "medium";
    if (score <= 15) return "high";
    return "critical";
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground">
          리스크 매트릭스
        </span>
        <div className="flex items-center gap-2">
          {ALL_LEVELS.map((level) => (
            <span
              key={level}
              className="flex items-center gap-1 text-[10px] text-muted-foreground"
            >
              <span
                className={`w-2 h-2 rounded-sm ${LEVEL_DOT_COLORS[level]}`}
              />
              {LEVEL_LABELS[level]}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-1">
        {/* Y축 레이블 */}
        <div className="flex flex-col justify-between py-4 pr-1 w-8">
          {[5, 4, 3, 2, 1].map((val) => (
            <span
              key={val}
              className="text-[9px] text-muted-foreground text-right leading-none"
            >
              {val}
            </span>
          ))}
        </div>

        <div className="flex-1 space-y-0.5">
          {/* 그리드 행: 영향도 높을수록 위 */}
          {[5, 4, 3, 2, 1].map((impact) => (
            <div key={impact} className="grid grid-cols-5 gap-0.5">
              {[1, 2, 3, 4, 5].map((likelihood) => {
                const cellItems = getItemsAt(likelihood, impact);
                const cellLevel = getCellLevel(likelihood, impact);
                return (
                  <div
                    key={likelihood}
                    className={`h-8 rounded-sm flex items-center justify-center text-[10px] font-medium transition-colors ${LEVEL_MATRIX_BG[cellLevel]} ${cellItems.length > 0 ? "ring-1 ring-inset ring-black/20" : "opacity-60"}`}
                    title={
                      cellItems.length > 0
                        ? cellItems.map((i) => i.title).join(", ")
                        : `점수: ${likelihood * impact}`
                    }
                  >
                    {cellItems.length > 0 ? (
                      <span className="font-bold">{cellItems.length}</span>
                    ) : (
                      <span className="opacity-40 text-[9px]">
                        {likelihood * impact}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* X축 레이블 */}
          <div className="grid grid-cols-5 gap-0.5 pt-0.5">
            {[1, 2, 3, 4, 5].map((val) => (
              <span
                key={val}
                className="text-[9px] text-muted-foreground text-center"
              >
                {val}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-9">
        <span>가능성 낮음</span>
        <span className="font-medium">발생 가능성 (X축)</span>
        <span>가능성 높음</span>
      </div>
      <div className="text-[10px] text-muted-foreground text-center">
        영향도 (Y축)
      </div>
    </div>
  );
}

// ============================================================
// 리스크 등록/수정 다이얼로그
// ============================================================

interface RiskFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: {
    title: string;
    category: StageRiskCategory;
    likelihood: number;
    impact: number;
    mitigation: string;
    responseStatus: StageRiskResponseStatus;
  }) => void;
  editItem?: StageRiskItem | null;
}

function RiskFormDialog({
  open,
  onClose,
  onSubmit,
  editItem,
}: RiskFormDialogProps) {
  const [title, setTitle] = useState(editItem?.title ?? "");
  const [category, setCategory] = useState<StageRiskCategory>(
    editItem?.category ?? "stage_structure"
  );
  const [likelihood, setLikelihood] = useState(editItem?.likelihood ?? 3);
  const [impact, setImpact] = useState(editItem?.impact ?? 3);
  const [mitigation, setMitigation] = useState(editItem?.mitigation ?? "");
  const [responseStatus, setResponseStatus] =
    useState<StageRiskResponseStatus>(editItem?.responseStatus ?? "pending");

  const previewScore = likelihood * impact;
  const previewLevel = (() => {
    if (previewScore <= 4) return "low";
    if (previewScore <= 9) return "medium";
    if (previewScore <= 15) return "high";
    return "critical";
  })() as StageRiskLevel;

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setTitle(editItem?.title ?? "");
      setCategory(editItem?.category ?? "stage_structure");
      setLikelihood(editItem?.likelihood ?? 3);
      setImpact(editItem?.impact ?? 3);
      setMitigation(editItem?.mitigation ?? "");
      setResponseStatus(editItem?.responseStatus ?? "pending");
    } else {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("위험 요소 제목을 입력해주세요.");
      return;
    }
    if (!mitigation.trim()) {
      toast.error("대응 방안을 입력해주세요.");
      return;
    }
    onSubmit({
      title: title.trim(),
      category,
      likelihood,
      impact,
      mitigation: mitigation.trim(),
      responseStatus,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editItem ? "리스크 수정" : "리스크 등록"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 위험 요소 제목 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">위험 요소</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 무대 바닥 미끄러움"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as StageRiskCategory)}
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

          {/* 발생 가능성 + 영향도 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                발생 가능성 (1-5)
              </Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setLikelihood(v)}
                    className={`flex-1 h-7 rounded text-xs font-medium border transition-colors ${
                      likelihood === v
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                영향도 (1-5)
              </Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setImpact(v)}
                    className={`flex-1 h-7 rounded text-xs font-medium border transition-colors ${
                      impact === v
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 점수 미리보기 */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 border">
            <span className="text-xs text-muted-foreground">리스크 점수</span>
            <span className="text-sm font-bold tabular-nums">
              {previewScore}
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({likelihood} × {impact})
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ml-auto ${LEVEL_COLORS[previewLevel]}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1 ${LEVEL_DOT_COLORS[previewLevel]}`}
              />
              {LEVEL_LABELS[previewLevel]}
            </Badge>
          </div>

          {/* 대응 방안 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">대응 방안</Label>
            <Textarea
              className="text-xs min-h-[60px] resize-none"
              placeholder="예: 무대 바닥에 미끄럼 방지 테이프 부착 및 리허설 전 점검"
              value={mitigation}
              onChange={(e) => setMitigation(e.target.value)}
            />
          </div>

          {/* 대응 상태 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">대응 상태</Label>
            <Select
              value={responseStatus}
              onValueChange={(v) =>
                setResponseStatus(v as StageRiskResponseStatus)
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_RESPONSE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {RESPONSE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            {editItem ? "수정" : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 리스크 항목 행
// ============================================================

interface RiskItemRowProps {
  item: StageRiskItem;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: (status: StageRiskResponseStatus) => void;
}

function RiskItemRow({
  item,
  onEdit,
  onDelete,
  onChangeStatus,
}: RiskItemRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-md border overflow-hidden ${
        item.responseStatus === "done"
          ? "opacity-70 bg-muted/20 border-dashed"
          : "bg-background"
      }`}
    >
      {/* 헤더 행 */}
      <div className="flex items-start gap-2 px-3 py-2.5">
        {/* 리스크 점수 뱃지 */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${LEVEL_MATRIX_BG[item.level]}`}
          title={`리스크 점수: ${item.score}`}
        >
          {item.score}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          {/* 제목 + 레벨 배지 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-medium ${
                item.responseStatus === "done"
                  ? "line-through text-muted-foreground"
                  : ""
              }`}
            >
              {item.title}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${LEVEL_COLORS[item.level]}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1 ${LEVEL_DOT_COLORS[item.level]}`}
              />
              {LEVEL_LABELS[item.level]}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 flex-shrink-0 ${CATEGORY_BADGE_COLORS[item.category]}`}
            >
              {CATEGORY_ICONS[item.category]}
              {CATEGORY_LABELS[item.category]}
            </Badge>
          </div>

          {/* 점수 세부 + 대응 상태 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground">
              가능성 {item.likelihood} × 영향도 {item.impact}
            </span>
            <Select
              value={item.responseStatus}
              onValueChange={(v) =>
                onChangeStatus(v as StageRiskResponseStatus)
              }
            >
              <SelectTrigger
                className={`h-5 text-[10px] px-1.5 py-0 border rounded-full w-auto gap-1 ${RESPONSE_COLORS[item.responseStatus]}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_RESPONSE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {RESPONSE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 오른쪽 액션 */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setExpanded((v) => !v)}
            title="대응 방안 보기"
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
            title="수정"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 대응 방안 영역 */}
      {expanded && (
        <div className="px-3 pb-2.5 pt-2 border-t bg-muted/10">
          <p className="text-[10px] font-medium text-muted-foreground mb-1">
            대응 방안
          </p>
          <p className="text-xs text-foreground leading-relaxed">
            {item.mitigation || (
              <span className="text-muted-foreground italic">
                대응 방안이 없습니다.
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface StageRiskCardProps {
  projectId: string;
}

export function StageRiskCard({ projectId }: StageRiskCardProps) {
  const { items, loading, stats, addItem, updateItem, deleteItem, updateResponseStatus } =
    useStageRisk(projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StageRiskItem | null>(null);

  // 레벨 정렬 순서
  const LEVEL_ORDER: Record<StageRiskLevel, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const sortedItems = [...items].sort((a, b) => {
    // 미대응 우선, 같으면 리스크 점수 내림차순
    if (a.responseStatus === "done" && b.responseStatus !== "done") return 1;
    if (a.responseStatus !== "done" && b.responseStatus === "done") return -1;
    if (a.level !== b.level) return LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
    return b.score - a.score;
  });

  const handleOpenAdd = () => {
    setEditTarget(null);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (item: StageRiskItem) => {
    setEditTarget(item);
    setFormDialogOpen(true);
  };

  const handleFormSubmit = (params: {
    title: string;
    category: StageRiskCategory;
    likelihood: number;
    impact: number;
    mitigation: string;
    responseStatus: StageRiskResponseStatus;
  }) => {
    if (editTarget) {
      const ok = updateItem(editTarget.id, params);
      if (ok) {
        toast.success("리스크가 수정되었습니다.");
      } else {
        toast.error(TOAST.UPDATE_ERROR);
      }
    } else {
      addItem(params);
      toast.success("리스크가 등록되었습니다.");
    }
    setFormDialogOpen(false);
    setEditTarget(null);
  };

  const handleDelete = (itemId: string) => {
    const ok = deleteItem(itemId);
    if (ok) {
      toast.success("리스크가 삭제되었습니다.");
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  };

  const handleChangeStatus = (itemId: string, status: StageRiskResponseStatus) => {
    updateResponseStatus(itemId, status);
  };

  // 헤더에 표시할 위험/높음 수
  const criticalCount = items.filter((i) => i.level === "critical").length;
  const highCount = items.filter((i) => i.level === "high").length;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="w-full">
          <CardHeader className="pb-2 pt-3 px-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 flex-wrap">
                  <ShieldAlert className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <CardTitle className="text-sm font-semibold">
                    무대 리스크 평가
                  </CardTitle>
                  {stats.total > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground"
                    >
                      총 {stats.total}개
                    </Badge>
                  )}
                  {criticalCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-300"
                    >
                      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                      위험 {criticalCount}
                    </Badge>
                  )}
                  {highCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-300"
                    >
                      높음 {highCount}
                    </Badge>
                  )}
                  {stats.pendingCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border-gray-300"
                    >
                      미대응 {stats.pendingCount}
                    </Badge>
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-4">
              {loading ? (
                <p className="text-xs text-muted-foreground py-2">
                  불러오는 중...
                </p>
              ) : (
                <>
                  {/* 통계 요약 */}
                  {items.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-2 rounded-md bg-muted/40 border text-center">
                        <p className="text-[10px] text-muted-foreground">전체</p>
                        <p className="text-sm font-bold tabular-nums">
                          {stats.total}
                        </p>
                      </div>
                      <div className="p-2 rounded-md bg-gray-50 border text-center">
                        <p className="text-[10px] text-gray-500">미대응</p>
                        <p className="text-sm font-bold tabular-nums text-gray-700">
                          {stats.pendingCount}
                        </p>
                      </div>
                      <div className="p-2 rounded-md bg-blue-50 border border-blue-200 text-center">
                        <p className="text-[10px] text-blue-600">대응중</p>
                        <p className="text-sm font-bold tabular-nums text-blue-700">
                          {stats.inProgressCount}
                        </p>
                      </div>
                      <div className="p-2 rounded-md bg-green-50 border border-green-200 text-center">
                        <p className="text-[10px] text-green-600">완료</p>
                        <p className="text-sm font-bold tabular-nums text-green-700">
                          {stats.doneCount}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 레벨별 분포 */}
                  {items.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ALL_LEVELS.map((level) => {
                        const count = items.filter(
                          (i) => i.level === level
                        ).length;
                        if (count === 0) return null;
                        return (
                          <span
                            key={level}
                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${LEVEL_COLORS[level]}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${LEVEL_DOT_COLORS[level]}`}
                            />
                            {LEVEL_LABELS[level]} {count}
                          </span>
                        );
                      })}
                      {stats.avgScore > 0 && (
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          평균 점수: {stats.avgScore}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 리스크 매트릭스 */}
                  {items.length > 0 && (
                    <div className="p-3 rounded-md border bg-muted/20">
                      <RiskMatrix items={items} />
                    </div>
                  )}

                  {/* 리스크 목록 헤더 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      리스크 목록
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleOpenAdd}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      리스크 등록
                    </Button>
                  </div>

                  {/* 리스크 목록 */}
                  {sortedItems.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <ShieldCheck className="h-7 w-7 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground">
                        등록된 리스크 항목이 없습니다.
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        공연 안전을 위해 리스크 항목을 등록하세요.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sortedItems.map((item) => (
                        <RiskItemRow
                          key={item.id}
                          item={item}
                          onEdit={() => handleOpenEdit(item)}
                          onDelete={() => handleDelete(item.id)}
                          onChangeStatus={(status) =>
                            handleChangeStatus(item.id, status)
                          }
                        />
                      ))}
                    </div>
                  )}

                  {/* 최고 위험 항목 강조 */}
                  {stats.topRiskItem && stats.topRiskItem.level === "critical" && (
                    <div className="flex items-start gap-2 p-2.5 rounded-md bg-red-50 border border-red-200">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium text-red-700">
                          최고 위험 항목
                        </p>
                        <p className="text-xs text-red-600 truncate">
                          {stats.topRiskItem.title} (점수:{" "}
                          {stats.topRiskItem.score})
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 등록/수정 다이얼로그 */}
      <RiskFormDialog
        open={formDialogOpen}
        onClose={() => {
          setFormDialogOpen(false);
          setEditTarget(null);
        }}
        onSubmit={handleFormSubmit}
        editItem={editTarget}
      />
    </>
  );
}
