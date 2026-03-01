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
  Palette,
  ThumbsUp,
  MessageSquare,
  DollarSign,
  Scissors,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useCostumeDesign } from "@/hooks/use-costume-design";
import type { CostumeDesignEntry, CostumeDesignStatus } from "@/types";

// ============================================================
// 상수
// ============================================================

const STATUS_LABELS: Record<CostumeDesignStatus, string> = {
  idea: "아이디어",
  sketched: "스케치 완료",
  approved: "승인됨",
  in_production: "제작 중",
  completed: "완성",
};

const STATUS_COLORS: Record<CostumeDesignStatus, string> = {
  idea: "bg-gray-100 text-gray-600",
  sketched: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  in_production: "bg-blue-100 text-blue-700",
  completed: "bg-purple-100 text-purple-700",
};

const STATUS_NEXT: Record<CostumeDesignStatus, CostumeDesignStatus | null> = {
  idea: "sketched",
  sketched: "approved",
  approved: "in_production",
  in_production: "completed",
  completed: null,
};

const CATEGORY_OPTIONS = ["상의", "하의", "소품", "전체 세트", "신발", "액세서리"];

// ============================================================
// CSS 색상명을 그대로 사용하는 원형 칩
// ============================================================

function ColorChip({ colorName }: { colorName: string }) {
  return (
    <span
      title={colorName}
      style={{ backgroundColor: colorName }}
      className="inline-block w-4 h-4 rounded-full border border-black/10 shrink-0"
    />
  );
}

// ============================================================
// 상태 배지
// ============================================================

function StatusBadge({ status }: { status: CostumeDesignStatus }) {
  return (
    <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

// ============================================================
// 디자인 추가 다이얼로그
// ============================================================

interface AddDesignDialogProps {
  open: boolean;
  onClose: () => void;
  memberNames: string[];
  onSubmit: (
    title: string,
    description: string,
    designedBy: string,
    category: string,
    colorScheme: string[],
    materialNotes?: string,
    estimatedCost?: number
  ) => void;
}

function AddDesignDialog({
  open,
  onClose,
  memberNames,
  onSubmit,
}: AddDesignDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [designedBy, setDesignedBy] = useState(memberNames[0] ?? "");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [colorInput, setColorInput] = useState("");
  const [materialNotes, setMaterialNotes] = useState("");
  const [estimatedCostInput, setEstimatedCostInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error(TOAST.COSTUME_DESIGN.TITLE_REQUIRED);
      return;
    }
    if (!designedBy.trim()) {
      toast.error(TOAST.COSTUME_DESIGN.DESIGNER_REQUIRED);
      return;
    }
    const colorScheme = colorInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const estimatedCost =
      estimatedCostInput.trim() !== ""
        ? Number(estimatedCostInput)
        : undefined;

    onSubmit(
      trimmedTitle,
      description.trim(),
      designedBy.trim(),
      category,
      colorScheme,
      materialNotes.trim() || undefined,
      isNaN(estimatedCost as number) ? undefined : estimatedCost
    );

    setTitle("");
    setDescription("");
    setDesignedBy(memberNames[0] ?? "");
    setCategory(CATEGORY_OPTIONS[0]);
    setColorInput("");
    setMaterialNotes("");
    setEstimatedCostInput("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4 text-pink-500" />
            디자인 아이디어 추가
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-1">
          {/* 제목 */}
          <div className="space-y-1">
            <Label htmlFor="cd-title" className="text-xs">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cd-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 블랙 크롭 재킷"
              className="h-7 text-xs"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label htmlFor="cd-desc" className="text-xs">설명</Label>
            <Textarea
              id="cd-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="디자인 컨셉, 스타일 방향 등..."
              className="text-xs resize-none min-h-[60px]"
              rows={3}
            />
          </div>

          {/* 디자이너 */}
          <div className="space-y-1">
            <Label htmlFor="cd-designer" className="text-xs">
              디자이너 <span className="text-destructive">*</span>
            </Label>
            {memberNames.length > 0 ? (
              <Select value={designedBy} onValueChange={setDesignedBy}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="디자이너 선택" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="cd-designer"
                value={designedBy}
                onChange={(e) => setDesignedBy(e.target.value)}
                placeholder="디자이너 이름"
                className="h-7 text-xs"
              />
            )}
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs">카테고리</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 색상 (쉼표 구분) */}
          <div className="space-y-1">
            <Label htmlFor="cd-colors" className="text-xs">
              색상 팔레트{" "}
              <span className="text-muted-foreground">(쉼표로 구분)</span>
            </Label>
            <Input
              id="cd-colors"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              placeholder="예: black, white, crimson"
              className="h-7 text-xs"
            />
            {/* 미리보기 */}
            {colorInput.trim() && (
              <div className="flex flex-wrap gap-1 pt-1">
                {colorInput
                  .split(",")
                  .map((c) => c.trim())
                  .filter(Boolean)
                  .map((c, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <ColorChip colorName={c} />
                      <span className="text-[10px] text-muted-foreground">{c}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* 소재 메모 */}
          <div className="space-y-1">
            <Label htmlFor="cd-material" className="text-xs">소재 메모</Label>
            <Input
              id="cd-material"
              value={materialNotes}
              onChange={(e) => setMaterialNotes(e.target.value)}
              placeholder="예: 폴리에스터 80%, 신축성 원단 권장"
              className="h-7 text-xs"
            />
          </div>

          {/* 예상 비용 */}
          <div className="space-y-1">
            <Label htmlFor="cd-cost" className="text-xs">예상 비용 (원)</Label>
            <Input
              id="cd-cost"
              type="number"
              min={0}
              value={estimatedCostInput}
              onChange={(e) => setEstimatedCostInput(e.target.value)}
              placeholder="예: 150000"
              className="h-7 text-xs"
            />
          </div>

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 디자인 상세 패널
// ============================================================

interface DesignDetailProps {
  design: CostumeDesignEntry;
  memberNames: string[];
  currentUser: string;
  onChangeStatus: (id: string, status: CostumeDesignStatus) => void;
  onToggleVote: (id: string, memberName: string) => void;
  onDelete: (id: string) => void;
  onAddComment: (designId: string, author: string, text: string) => void;
  onDeleteComment: (designId: string, commentId: string) => void;
}

function DesignDetail({
  design,
  memberNames,
  currentUser,
  onChangeStatus,
  onToggleVote,

  onAddComment,
  onDeleteComment,
}: DesignDetailProps) {
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState(
    memberNames[0] ?? currentUser
  );

  const nextStatus = STATUS_NEXT[design.status];
  const hasVoted = design.votes.includes(currentUser);

  function handleAddComment() {
    const trimmed = commentText.trim();
    if (!trimmed) {
      toast.error(TOAST.COSTUME_DESIGN.COMMENT_REQUIRED);
      return;
    }
    onAddComment(design.id, commentAuthor, trimmed);
    setCommentText("");
    toast.success(TOAST.COSTUME_DESIGN.COMMENT_ADDED);
  }

  return (
    <div className="space-y-3 pt-2 border-t border-border/30 mt-2">
      {/* 설명 */}
      {design.description && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {design.description}
        </p>
      )}

      {/* 소재 메모 */}
      {design.materialNotes && (
        <div className="flex items-start gap-1.5">
          <Scissors className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">{design.materialNotes}</p>
        </div>
      )}

      {/* 예상 비용 */}
      {design.estimatedCost !== undefined && (
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3 w-3 text-green-500 shrink-0" />
          <span className="text-xs text-foreground font-medium">
            {design.estimatedCost.toLocaleString()}원
          </span>
        </div>
      )}

      {/* 상태 변경 버튼 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">상태:</span>
        <StatusBadge status={design.status} />
        {nextStatus && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] px-2"
            onClick={() => {
              onChangeStatus(design.id, nextStatus);
              toast.success(
                `상태가 "${STATUS_LABELS[nextStatus]}"으로 변경되었습니다.`
              );
            }}
          >
            {STATUS_LABELS[nextStatus]}으로 변경
          </Button>
        )}
      </div>

      {/* 투표 */}
      <div className="flex items-center gap-2">
        <Button
          variant={hasVoted ? "default" : "outline"}
          size="sm"
          className={`h-6 text-[10px] px-2 gap-1 ${
            hasVoted ? "bg-pink-600 hover:bg-pink-700 border-pink-600" : ""
          }`}
          onClick={() => {
            onToggleVote(design.id, currentUser);
            if (hasVoted) {
              toast.success(TOAST.COSTUME_DESIGN.VOTE_CANCELLED);
            } else {
              toast.success(TOAST.COSTUME_DESIGN.VOTED);
            }
          }}
        >
          <ThumbsUp className="h-3 w-3" />
          {hasVoted ? "투표 취소" : "투표하기"}
        </Button>
        {design.votes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {design.votes.map((v) => (
              <span
                key={v}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground"
              >
                {v}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 댓글 목록 */}
      {design.comments.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            댓글 {design.comments.length}
          </p>
          {design.comments.map((comment) => (
            <div
              key={comment.id}
              className="flex items-start justify-between gap-2 bg-muted/20 rounded px-2 py-1.5"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-medium text-foreground">
                  {comment.author}
                </span>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {comment.text}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-destructive hover:text-destructive shrink-0"
                onClick={() => {
                  onDeleteComment(design.id, comment.id);
                  toast.success(TOAST.COSTUME_DESIGN.COMMENT_DELETED);
                }}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 댓글 입력 */}
      <div className="space-y-1.5">
        <div className="flex gap-1.5">
          {memberNames.length > 0 ? (
            <Select value={commentAuthor} onValueChange={setCommentAuthor}>
              <SelectTrigger className="h-6 text-[10px] w-24 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {memberNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글 작성..."
            className="h-6 text-[10px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
          />
          <Button
            size="sm"
            className="h-6 text-[10px] px-2 shrink-0"
            onClick={handleAddComment}
          >
            등록
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 디자인 그리드 카드 아이템
// ============================================================

interface DesignGridItemProps {
  design: CostumeDesignEntry;
  memberNames: string[];
  currentUser: string;
  onChangeStatus: (id: string, status: CostumeDesignStatus) => void;
  onToggleVote: (id: string, memberName: string) => void;
  onDelete: (id: string) => void;
  onAddComment: (designId: string, author: string, text: string) => void;
  onDeleteComment: (designId: string, commentId: string) => void;
}

function DesignGridItem({
  design,
  memberNames,
  currentUser,
  onChangeStatus,
  onToggleVote,
  onDelete,
  onAddComment,
  onDeleteComment,
}: DesignGridItemProps) {
  const [expanded, setExpanded] = useState(false);
  const hasVoted = design.votes.includes(currentUser);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden bg-background">
      {/* 카드 헤더 영역 */}
      <div className="p-2.5 space-y-2">
        {/* 제목 행 */}
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate leading-tight">
              {design.title}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {design.designedBy}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-destructive hover:text-destructive shrink-0"
            onClick={() => {
              onDelete(design.id);
              toast.success(TOAST.COSTUME_DESIGN.DESIGN_DELETED);
            }}
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </div>

        {/* 카테고리 + 상태 */}
        <div className="flex items-center gap-1 flex-wrap">
          <Badge className="text-[10px] px-1.5 py-0 bg-pink-100 text-pink-700">
            {design.category}
          </Badge>
          <StatusBadge status={design.status} />
        </div>

        {/* 색상 팔레트 */}
        {design.colorScheme.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {design.colorScheme.map((color, i) => (
              <ColorChip key={i} colorName={color} />
            ))}
          </div>
        )}

        {/* 투표 + 댓글 수 + 상세 토글 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className={`flex items-center gap-1 text-[10px] transition-colors ${
                hasVoted ? "text-pink-600 font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                onToggleVote(design.id, currentUser);
                if (hasVoted) {
                  toast.success(TOAST.COSTUME_DESIGN.VOTE_CANCELLED);
                } else {
                  toast.success(TOAST.COSTUME_DESIGN.VOTED);
                }
              }}
            >
              <ThumbsUp className="h-3 w-3" />
              {design.votes.length}
            </button>
            {design.comments.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                {design.comments.length}
              </span>
            )}
          </div>
          <button
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            onClick={() => setExpanded((v) => !v)}
          >
            상세 {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* 상세 패널 */}
      {expanded && (
        <div className="px-2.5 pb-2.5">
          <DesignDetail
            design={design}
            memberNames={memberNames}
            currentUser={currentUser}
            onChangeStatus={onChangeStatus}
            onToggleVote={onToggleVote}
            onDelete={onDelete}
            onAddComment={onAddComment}
            onDeleteComment={onDeleteComment}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 카드
// ============================================================

interface CostumeDesignCardProps {
  groupId: string;
  projectId: string;
  memberNames: string[];
}

const STATUS_FILTER_OPTIONS: Array<{
  value: CostumeDesignStatus | "all";
  label: string;
}> = [
  { value: "all", label: "전체" },
  { value: "idea", label: "아이디어" },
  { value: "sketched", label: "스케치" },
  { value: "approved", label: "승인됨" },
  { value: "in_production", label: "제작 중" },
  { value: "completed", label: "완성" },
];

export function CostumeDesignCard({
  groupId,
  projectId,
  memberNames,
}: CostumeDesignCardProps) {
  const [cardOpen, setCardOpen] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    CostumeDesignStatus | "all"
  >("all");

  const currentUser = memberNames[0] ?? "나";

  const {
    designs,
    loading,
    addDesign,
    deleteDesign,
    changeStatus,
    toggleVote,
    addComment,
    deleteComment,
    stats,
  } = useCostumeDesign(groupId, projectId);

  const filteredDesigns =
    statusFilter === "all"
      ? designs
      : designs.filter((d) => d.status === statusFilter);

  return (
    <>
      <Card className="shadow-sm">
        <Collapsible open={cardOpen} onOpenChange={setCardOpen}>
          <CardHeader className="py-2 px-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-pink-500" />
                  <CardTitle className="text-sm font-semibold">
                    의상 디자인 보드
                  </CardTitle>
                  {stats.totalDesigns > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-pink-100 text-pink-700">
                      {stats.totalDesigns}개
                    </Badge>
                  )}
                  {stats.approvedCount > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700">
                      승인 {stats.approvedCount}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddDialog(true);
                      if (!cardOpen) setCardOpen(true);
                    }}
                    title="디자인 추가"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  {cardOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {/* 통계 요약 */}
              {stats.totalDesigns > 0 && (
                <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground px-0.5">
                  {stats.totalEstimatedCost > 0 && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-green-500" />
                      총 예상 비용:{" "}
                      <span className="text-foreground font-medium">
                        {stats.totalEstimatedCost.toLocaleString()}원
                      </span>
                    </span>
                  )}
                  {stats.topVotedDesign && (
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3 text-pink-500" />
                      최다 투표:{" "}
                      <span className="text-foreground font-medium">
                        {stats.topVotedDesign.title}(
                        {stats.topVotedDesign.votes.length}표)
                      </span>
                    </span>
                  )}
                </div>
              )}

              {/* 상태 필터 탭 */}
              {designs.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {STATUS_FILTER_OPTIONS.map((opt) => {
                    const count =
                      opt.value === "all"
                        ? designs.length
                        : designs.filter((d) => d.status === opt.value).length;
                    if (opt.value !== "all" && count === 0) return null;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setStatusFilter(opt.value)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                          statusFilter === opt.value
                            ? "bg-pink-500 text-white border-pink-500"
                            : "border-border/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                        {count > 0 && (
                          <span className="ml-1 opacity-70">{count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 디자인 그리드 */}
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">불러오는 중...</p>
                </div>
              ) : filteredDesigns.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <Palette className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    {statusFilter === "all"
                      ? "아직 디자인 아이디어가 없습니다."
                      : `"${STATUS_LABELS[statusFilter as CostumeDesignStatus]}" 상태의 디자인이 없습니다.`}
                  </p>
                  {statusFilter === "all" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowAddDialog(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      첫 번째 디자인 추가
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredDesigns.map((design) => (
                    <DesignGridItem
                      key={design.id}
                      design={design}
                      memberNames={memberNames}
                      currentUser={currentUser}
                      onChangeStatus={changeStatus}
                      onToggleVote={toggleVote}
                      onDelete={deleteDesign}
                      onAddComment={addComment}
                      onDeleteComment={deleteComment}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 디자인 추가 다이얼로그 */}
      <AddDesignDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        memberNames={memberNames}
        onSubmit={(title, description, designedBy, category, colorScheme, materialNotes, estimatedCost) => {
          addDesign(
            title,
            description,
            designedBy,
            category,
            colorScheme,
            materialNotes,
            estimatedCost
          );
          toast.success(TOAST.COSTUME_DESIGN.IDEA_ADDED);
        }}
      />
    </>
  );
}
