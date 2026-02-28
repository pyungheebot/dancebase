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
import { Checkbox } from "@/components/ui/checkbox";
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
  MapPin,
  User,
  CalendarClock,
  CheckCircle2,
  Circle,
  Zap,
  Flame,
  Users,
  CloudRain,
  Wrench,
  HardHat,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useStageRisk } from "@/hooks/use-stage-risk";
import type {
  StageRiskItem,
  StageRiskLevel,
  StageRiskCategory,
  StageRiskMitigation,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const LEVEL_LABELS: Record<StageRiskLevel, string> = {
  critical: "심각",
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

const CATEGORY_LABELS: Record<StageRiskCategory, string> = {
  physical: "신체적",
  electrical: "전기",
  structural: "구조물",
  fire: "화재",
  crowd: "군중",
  weather: "날씨",
  other: "기타",
};

const CATEGORY_ICONS: Record<StageRiskCategory, React.ReactNode> = {
  physical: <HardHat className="h-3 w-3" />,
  electrical: <Zap className="h-3 w-3" />,
  structural: <Wrench className="h-3 w-3" />,
  fire: <Flame className="h-3 w-3" />,
  crowd: <Users className="h-3 w-3" />,
  weather: <CloudRain className="h-3 w-3" />,
  other: <MoreHorizontal className="h-3 w-3" />,
};

const CATEGORY_BADGE_COLORS: Record<StageRiskCategory, string> = {
  physical: "bg-amber-50 text-amber-700 border-amber-200",
  electrical: "bg-yellow-50 text-yellow-700 border-yellow-200",
  structural: "bg-stone-100 text-stone-700 border-stone-200",
  fire: "bg-red-50 text-red-700 border-red-200",
  crowd: "bg-blue-50 text-blue-700 border-blue-200",
  weather: "bg-sky-50 text-sky-700 border-sky-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

const ALL_LEVELS: StageRiskLevel[] = ["critical", "high", "medium", "low"];
const ALL_CATEGORIES: StageRiskCategory[] = [
  "physical",
  "electrical",
  "structural",
  "fire",
  "crowd",
  "weather",
  "other",
];

// ============================================================
// 위험 수준 요약 배지
// ============================================================

interface LevelSummaryProps {
  risks: StageRiskItem[];
}

function LevelSummary({ risks }: LevelSummaryProps) {
  const unresolved = risks.filter((r) => !r.isResolved);
  const counts: Record<StageRiskLevel, number> = {
    critical: unresolved.filter((r) => r.level === "critical").length,
    high: unresolved.filter((r) => r.level === "high").length,
    medium: unresolved.filter((r) => r.level === "medium").length,
    low: unresolved.filter((r) => r.level === "low").length,
  };

  if (unresolved.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {ALL_LEVELS.map((level) =>
        counts[level] > 0 ? (
          <span
            key={level}
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${LEVEL_COLORS[level]}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${LEVEL_DOT_COLORS[level]}`} />
            {LEVEL_LABELS[level]} {counts[level]}
          </span>
        ) : null
      )}
    </div>
  );
}

// ============================================================
// 대응 조치 추가 다이얼로그
// ============================================================

interface MitigationDialogProps {
  open: boolean;
  riskTitle: string;
  onClose: () => void;
  onSubmit: (data: Omit<StageRiskMitigation, "id" | "isCompleted">) => void;
}

function MitigationDialog({
  open,
  riskTitle,
  onClose,
  onSubmit,
}: MitigationDialogProps) {
  const [action, setAction] = useState("");
  const [responsible, setResponsible] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) onClose();
  };

  const handleSubmit = () => {
    if (!action.trim()) {
      toast.error("조치 내용을 입력해주세요.");
      return;
    }
    if (!responsible.trim()) {
      toast.error("담당자를 입력해주세요.");
      return;
    }
    onSubmit({
      action: action.trim(),
      responsible: responsible.trim(),
      dueDate: dueDate.trim() || undefined,
    });
    setAction("");
    setResponsible("");
    setDueDate("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">대응 조치 추가</DialogTitle>
          <p className="text-xs text-muted-foreground truncate">{riskTitle}</p>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">조치 내용</Label>
            <Textarea
              className="text-xs min-h-[60px] resize-none"
              placeholder="예: 무대 바닥 미끄럼 방지 테이프 부착"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">담당자</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 안전 담당자"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">기한 (선택)</Label>
            <Input
              className="h-8 text-xs"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
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
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 리스크 추가 다이얼로그
// ============================================================

interface RiskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: Omit<StageRiskItem, "id" | "mitigations" | "isResolved" | "createdAt">
  ) => void;
}

function RiskDialog({ open, onClose, onSubmit }: RiskDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<StageRiskCategory>("physical");
  const [level, setLevel] = useState<StageRiskLevel>("medium");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [reportedBy, setReportedBy] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) onClose();
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("위험 항목 제목을 입력해주세요.");
      return;
    }
    if (!description.trim()) {
      toast.error("위험 설명을 입력해주세요.");
      return;
    }
    if (!reportedBy.trim()) {
      toast.error("보고자를 입력해주세요.");
      return;
    }
    onSubmit({
      title: title.trim(),
      category,
      level,
      description: description.trim(),
      location: location.trim() || undefined,
      reportedBy: reportedBy.trim(),
    });
    setTitle("");
    setCategory("physical");
    setLevel("medium");
    setDescription("");
    setLocation("");
    setReportedBy("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">위험 항목 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">제목</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 무대 바닥 미끄러움"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
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
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">위험 수준</Label>
              <Select
                value={level}
                onValueChange={(v) => setLevel(v as StageRiskLevel)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_LEVELS.map((l) => (
                    <SelectItem key={l} value={l} className="text-xs">
                      {LEVEL_LABELS[l]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">위험 설명</Label>
            <Textarea
              className="text-xs min-h-[60px] resize-none"
              placeholder="위험 상황 및 발생 가능한 피해를 설명하세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">위치 (선택)</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 무대 좌측 계단"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">보고자</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 홍길동"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
              />
            </div>
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
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 대응 조치 행
// ============================================================

interface MitigationRowProps {
  mitigation: StageRiskMitigation;
  onToggle: () => void;
  onDelete: () => void;
}

function MitigationRow({ mitigation, onToggle, onDelete }: MitigationRowProps) {
  return (
    <div
      className={`flex items-start gap-2 px-2.5 py-2 rounded-md border group transition-colors ${
        mitigation.isCompleted
          ? "bg-green-50/50 border-green-200"
          : "bg-white border-border"
      }`}
    >
      <Checkbox
        checked={mitigation.isCompleted}
        onCheckedChange={onToggle}
        className="mt-0.5 flex-shrink-0"
      />
      <div className="flex-1 min-w-0 space-y-0.5">
        <p
          className={`text-xs leading-snug ${
            mitigation.isCompleted
              ? "line-through text-muted-foreground"
              : "text-foreground"
          }`}
        >
          {mitigation.action}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <User className="h-2.5 w-2.5" />
            {mitigation.responsible}
          </span>
          {mitigation.dueDate && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <CalendarClock className="h-2.5 w-2.5" />
              {mitigation.dueDate}
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================================
// 리스크 카드 행
// ============================================================

interface RiskRowProps {
  risk: StageRiskItem;
  onToggleResolved: () => void;
  onDelete: () => void;
  onAddMitigation: () => void;
  onToggleMitigation: (mitigationId: string) => void;
  onDeleteMitigation: (mitigationId: string) => void;
}

function RiskRow({
  risk,
  onToggleResolved,
  onDelete,
  onAddMitigation,
  onToggleMitigation,
  onDeleteMitigation,
}: RiskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const completedCount = risk.mitigations.filter((m) => m.isCompleted).length;
  const totalCount = risk.mitigations.length;

  return (
    <div
      className={`rounded-md border overflow-hidden transition-colors ${
        risk.isResolved ? "opacity-60 bg-muted/20 border-dashed" : "bg-white"
      }`}
    >
      {/* 헤더 행 */}
      <div className="flex items-start gap-2 px-3 py-2.5">
        {/* 해결 토글 */}
        <button
          onClick={onToggleResolved}
          className="mt-0.5 flex-shrink-0"
          title={risk.isResolved ? "미해결로 변경" : "해결됨으로 표시"}
        >
          {risk.isResolved ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-1">
          {/* 제목 + 배지 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-medium ${
                risk.isResolved ? "line-through text-muted-foreground" : ""
              }`}
            >
              {risk.title}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${LEVEL_COLORS[risk.level]}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mr-1 ${LEVEL_DOT_COLORS[risk.level]}`} />
              {LEVEL_LABELS[risk.level]}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 flex items-center gap-0.5 flex-shrink-0 ${CATEGORY_BADGE_COLORS[risk.category]}`}
            >
              {CATEGORY_ICONS[risk.category]}
              {CATEGORY_LABELS[risk.category]}
            </Badge>
          </div>

          {/* 위치 + 보고자 */}
          <div className="flex items-center gap-2 flex-wrap">
            {risk.location && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" />
                {risk.location}
              </span>
            )}
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <User className="h-2.5 w-2.5" />
              {risk.reportedBy}
            </span>
            {totalCount > 0 && (
              <span className="text-[10px] text-muted-foreground">
                대응 {completedCount}/{totalCount}
              </span>
            )}
          </div>
        </div>

        {/* 오른쪽 액션 */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setExpanded((v) => !v)}
            title="상세 보기"
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
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 상세 영역 */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t bg-muted/10">
          {/* 설명 */}
          <div className="pt-2.5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {risk.description}
            </p>
          </div>

          {/* 대응 조치 목록 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground">
                대응 조치 ({completedCount}/{totalCount} 완료)
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={onAddMitigation}
              >
                <Plus className="h-2.5 w-2.5 mr-0.5" />
                조치 추가
              </Button>
            </div>

            {risk.mitigations.length === 0 ? (
              <p className="text-[10px] text-muted-foreground py-1.5 text-center">
                대응 조치가 없습니다.
              </p>
            ) : (
              <div className="space-y-1">
                {risk.mitigations.map((m) => (
                  <MitigationRow
                    key={m.id}
                    mitigation={m}
                    onToggle={() => onToggleMitigation(m.id)}
                    onDelete={() => onDeleteMitigation(m.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 완료율 바 */}
          {totalCount > 0 && (
            <div className="space-y-0.5">
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-400 rounded-full transition-all"
                  style={{
                    width: `${Math.round((completedCount / totalCount) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-right">
                {Math.round((completedCount / totalCount) * 100)}% 완료
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface StageRiskCardProps {
  groupId: string;
  projectId: string;
}

export function StageRiskCard({ groupId, projectId }: StageRiskCardProps) {
  const {
    risks,
    loading,
    addRisk,
    deleteRisk,
    toggleResolved,
    addMitigation,
    deleteMitigation,
    toggleMitigation,
    stats,
  } = useStageRisk(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);

  // 리스크 추가 다이얼로그
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);

  // 대응 조치 추가 다이얼로그
  const [mitigationDialogOpen, setMitigationDialogOpen] = useState(false);
  const [targetRiskId, setTargetRiskId] = useState<string | null>(null);

  const targetRisk = risks.find((r) => r.id === targetRiskId) ?? null;

  // 위험 수준 정렬 순서
  const LEVEL_ORDER: Record<StageRiskLevel, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const sortedRisks = [...risks].sort((a, b) => {
    // 미해결 우선, 같으면 위험 수준 순
    if (a.isResolved !== b.isResolved) return a.isResolved ? 1 : -1;
    return LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];
  });

  const handleRiskSubmit = (
    data: Omit<StageRiskItem, "id" | "mitigations" | "isResolved" | "createdAt">
  ) => {
    addRisk(data);
    toast.success("위험 항목이 추가되었습니다.");
  };

  const handleDeleteRisk = (riskId: string) => {
    deleteRisk(riskId);
    toast.success("위험 항목이 삭제되었습니다.");
  };

  const handleToggleResolved = (riskId: string) => {
    const risk = risks.find((r) => r.id === riskId);
    toggleResolved(riskId);
    if (risk) {
      toast.success(risk.isResolved ? "미해결로 변경되었습니다." : "해결됨으로 표시되었습니다.");
    }
  };

  const handleOpenMitigationDialog = (riskId: string) => {
    setTargetRiskId(riskId);
    setMitigationDialogOpen(true);
  };

  const handleMitigationSubmit = (
    data: Omit<StageRiskMitigation, "id" | "isCompleted">
  ) => {
    if (!targetRiskId) return;
    addMitigation(targetRiskId, data);
    toast.success("대응 조치가 추가되었습니다.");
  };

  const handleToggleMitigation = (riskId: string, mitigationId: string) => {
    toggleMitigation(riskId, mitigationId);
  };

  const handleDeleteMitigation = (riskId: string, mitigationId: string) => {
    deleteMitigation(riskId, mitigationId);
    toast.success("대응 조치가 삭제되었습니다.");
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="w-full">
          <CardHeader className="pb-2 pt-3 px-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                  <CardTitle className="text-sm font-semibold">
                    공연 무대 위험 평가
                  </CardTitle>
                  {stats.totalRisks > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200"
                    >
                      {stats.unresolvedRisks}개 미해결
                    </Badge>
                  )}
                  {stats.criticalRisks > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-300 animate-pulse"
                    >
                      <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                      심각 {stats.criticalRisks}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {stats.totalRisks > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      대응 {stats.mitigationCompletionRate}% 완료
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
                <p className="text-xs text-muted-foreground py-2">불러오는 중...</p>
              ) : (
                <>
                  {/* 위험 수준 요약 */}
                  {risks.length > 0 && <LevelSummary risks={risks} />}

                  {/* 통계 요약 */}
                  {risks.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-2 rounded-md bg-muted/40 border text-center">
                        <p className="text-[10px] text-muted-foreground">전체</p>
                        <p className="text-sm font-bold tabular-nums">{stats.totalRisks}</p>
                      </div>
                      <div className="p-2 rounded-md bg-red-50 border border-red-200 text-center">
                        <p className="text-[10px] text-red-600">심각</p>
                        <p className="text-sm font-bold tabular-nums text-red-700">
                          {risks.filter((r) => r.level === "critical" && !r.isResolved).length}
                        </p>
                      </div>
                      <div className="p-2 rounded-md bg-orange-50 border border-orange-200 text-center">
                        <p className="text-[10px] text-orange-600">높음</p>
                        <p className="text-sm font-bold tabular-nums text-orange-700">
                          {risks.filter((r) => r.level === "high" && !r.isResolved).length}
                        </p>
                      </div>
                      <div className="p-2 rounded-md bg-green-50 border border-green-200 text-center">
                        <p className="text-[10px] text-green-600">해결됨</p>
                        <p className="text-sm font-bold tabular-nums text-green-700">
                          {risks.filter((r) => r.isResolved).length}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 리스크 목록 헤더 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      위험 항목 목록
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setRiskDialogOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      위험 추가
                    </Button>
                  </div>

                  {/* 리스크 목록 */}
                  {sortedRisks.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <ShieldCheck className="h-7 w-7 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground">
                        등록된 위험 항목이 없습니다.
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        무대 안전 점검을 위해 위험 항목을 추가하세요.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sortedRisks.map((risk) => (
                        <RiskRow
                          key={risk.id}
                          risk={risk}
                          onToggleResolved={() => handleToggleResolved(risk.id)}
                          onDelete={() => handleDeleteRisk(risk.id)}
                          onAddMitigation={() => handleOpenMitigationDialog(risk.id)}
                          onToggleMitigation={(mId) =>
                            handleToggleMitigation(risk.id, mId)
                          }
                          onDeleteMitigation={(mId) =>
                            handleDeleteMitigation(risk.id, mId)
                          }
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 리스크 추가 다이얼로그 */}
      <RiskDialog
        open={riskDialogOpen}
        onClose={() => setRiskDialogOpen(false)}
        onSubmit={handleRiskSubmit}
      />

      {/* 대응 조치 추가 다이얼로그 */}
      <MitigationDialog
        open={mitigationDialogOpen}
        riskTitle={targetRisk?.title ?? ""}
        onClose={() => {
          setMitigationDialogOpen(false);
          setTargetRiskId(null);
        }}
        onSubmit={handleMitigationSubmit}
      />
    </>
  );
}
