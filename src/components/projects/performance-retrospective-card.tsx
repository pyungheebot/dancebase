"use client";

import { useState } from "react";
import { usePerformanceRetrospective } from "@/hooks/use-performance-retrospective";
import type { PerformanceRetro, RetroCategory } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  MessageCircle,
  Plus,
  Trash2,
  Star,
  ThumbsUp,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// ============================================
// 별점 컴포넌트
// ============================================

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const iconClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (readonly ? value : hovered || value) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            onClick={() => !readonly && onChange?.(star)}
            className={readonly ? "cursor-default" : "cursor-pointer"}
          >
            <Star
              className={`${iconClass} transition-colors ${
                filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// 회고 생성 다이얼로그
// ============================================

interface CreateRetroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: {
    performanceTitle: string;
    performanceDate: string;
    overallRating: number;
  }) => boolean;
}

function CreateRetroDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateRetroDialogProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today);
  const [rating, setRating] = useState(3);

  const resetForm = () => {
    setTitle("");
    setDate(today);
    setRating(3);
  };

  const handleSubmit = () => {
    const ok = onSubmit({ performanceTitle: title, performanceDate: date, overallRating: rating });
    if (ok) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">공연 회고 생성</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 공연명 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">공연명 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2026 봄 정기공연"
              className="h-7 text-xs"
            />
          </div>

          {/* 공연 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">공연 날짜 *</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-7 text-xs"
            />
          </div>

          {/* 전체 평가 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              전체 평가 ({rating}점)
            </Label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              생성
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// KPT 칼럼
// ============================================

interface KptColumnProps {
  category: RetroCategory;
  items: PerformanceRetro["items"];
  authorName: string;
  onAdd: (content: string) => void;
  onVote: (itemId: string) => void;
}

const KPT_CONFIG: Record<
  RetroCategory,
  { label: string; bg: string; badgeCls: string; desc: string }
> = {
  keep: {
    label: "Keep",
    bg: "bg-green-50 border-green-200",
    badgeCls:
      "bg-green-100 text-green-700 border-green-200 hover:bg-green-100",
    desc: "계속할 것",
  },
  problem: {
    label: "Problem",
    bg: "bg-red-50 border-red-200",
    badgeCls: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
    desc: "문제점",
  },
  try: {
    label: "Try",
    bg: "bg-blue-50 border-blue-200",
    badgeCls: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
    desc: "시도할 것",
  },
};

function KptColumn({ category, items, onAdd, onVote }: KptColumnProps) {
  const [input, setInput] = useState("");
  const cfg = KPT_CONFIG[category];
  const filtered = items.filter((i) => i.category === category);

  const handleAdd = () => {
    if (!input.trim()) return;
    onAdd(input.trim());
    setInput("");
  };

  return (
    <div className={`rounded-md border p-2 space-y-2 ${cfg.bg}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${cfg.badgeCls}`}
          >
            {cfg.label}
          </Badge>
          <span className="text-[10px] text-muted-foreground ml-1.5">{cfg.desc}</span>
        </div>
        {filtered.length > 0 && (
          <span className="text-[10px] text-muted-foreground">{filtered.length}개</span>
        )}
      </div>

      {/* 항목 목록 */}
      <div className="space-y-1 min-h-[40px]">
        {filtered.length === 0 && (
          <p className="text-[10px] text-muted-foreground italic py-2 text-center">
            아직 항목이 없습니다
          </p>
        )}
        {filtered
          .sort((a, b) => b.votes - a.votes)
          .map((item) => (
            <div
              key={item.id}
              className="bg-muted/30 rounded border px-2 py-1.5 flex items-start gap-1.5"
            >
              <p className="text-[11px] leading-snug flex-1">{item.content}</p>
              <button
                type="button"
                onClick={() => onVote(item.id)}
                className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-blue-500 transition-colors flex-shrink-0"
                aria-label="공감"
              >
                <ThumbsUp className="h-2.5 w-2.5" />
                {item.votes > 0 && <span>{item.votes}</span>}
              </button>
            </div>
          ))}
      </div>

      {/* 입력란 */}
      <div className="flex gap-1">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="새 항목..."
          className="h-6 text-[11px] flex-1 bg-background"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6 px-1.5 flex-shrink-0 bg-background"
          onClick={handleAdd}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 회고 상세 패널 (KPT 보드 + 액션 아이템)
// ============================================

interface RetroDetailProps {
  retro: PerformanceRetro;
  authorName: string;
  onAddItem: (category: RetroCategory, content: string) => void;
  onVote: (itemId: string) => void;
  onAddAction: (action: string) => void;
  onDelete: () => void;
}

function RetroDetail({
  retro,
  authorName,
  onAddItem,
  onVote,
  onAddAction,
  onDelete,
}: RetroDetailProps) {
  const [actionInput, setActionInput] = useState("");

  const handleAddAction = () => {
    if (!actionInput.trim()) return;
    onAddAction(actionInput.trim());
    setActionInput("");
  };

  return (
    <div className="space-y-3 pt-2">
      {/* KPT 보드 */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {(["keep", "problem", "try"] as RetroCategory[]).map((cat) => (
          <KptColumn
            key={cat}
            category={cat}
            items={retro.items}
            authorName={authorName}
            onAdd={(content) => onAddItem(cat, content)}
            onVote={onVote}
          />
        ))}
      </div>

      {/* 액션 아이템 */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
          <CheckSquare className="h-3 w-3" />
          액션 아이템
          {retro.actionItems.length > 0 && (
            <span className="text-[10px]">({retro.actionItems.length}개)</span>
          )}
        </p>

        {retro.actionItems.length > 0 && (
          <div className="space-y-1">
            {retro.actionItems.map((action, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <Square className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-[11px]">{action}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-1">
          <Input
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
            placeholder="개선 액션 아이템 추가..."
            className="h-7 text-xs flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddAction();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2 flex-shrink-0"
            onClick={handleAddAction}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 삭제 */}
      <div className="flex justify-end pt-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[11px] text-muted-foreground hover:text-destructive px-2"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          회고 삭제
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 회고 목록 행 (확장 가능)
// ============================================

interface RetroRowProps {
  retro: PerformanceRetro;
  authorName: string;
  onAddItem: (retroId: string, category: RetroCategory, content: string) => void;
  onVote: (retroId: string, itemId: string) => void;
  onAddAction: (retroId: string, action: string) => void;
  onDelete: (retroId: string) => void;
}

function RetroRow({
  retro,
  authorName,
  onAddItem,
  onVote,
  onAddAction,
  onDelete,
}: RetroRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const keepCount = retro.items.filter((i) => i.category === "keep").length;
  const problemCount = retro.items.filter((i) => i.category === "problem").length;
  const tryCount = retro.items.filter((i) => i.category === "try").length;

  const handleDelete = () => {
    onDelete(retro.id);
  };

  return (
    <div className="border rounded-md overflow-hidden">
      {/* 요약 행 */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors select-none"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        )}

        {/* 공연명 */}
        <span className="text-xs font-medium flex-1 truncate min-w-0">
          {retro.performanceTitle}
        </span>

        {/* 날짜 */}
        <span className="text-[11px] text-muted-foreground flex-shrink-0 hidden sm:inline">
          {retro.performanceDate}
        </span>

        {/* 별점 */}
        <StarRating value={retro.overallRating} readonly size="sm" />

        {/* KPT 항목 수 배지 */}
        <div className="hidden sm:flex items-center gap-0.5 flex-shrink-0">
          {keepCount > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
            >
              K {keepCount}
            </Badge>
          )}
          {problemCount > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
            >
              P {problemCount}
            </Badge>
          )}
          {tryCount > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              T {tryCount}
            </Badge>
          )}
        </div>
      </div>

      {/* 상세 패널 */}
      {expanded && (
        <div className="px-3 pb-3 bg-muted/10 border-t">
          <RetroDetail
            retro={retro}
            authorName={authorName}
            onAddItem={(cat, content) => onAddItem(retro.id, cat, content)}
            onVote={(itemId) => onVote(retro.id, itemId)}
            onAddAction={(action) => onAddAction(retro.id, action)}
            onDelete={() => setDeleteConfirmOpen(true)}
          />
        </div>
      )}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(v) => !v && setDeleteConfirmOpen(false)}
        title="회고 삭제"
        description={`"${retro.performanceTitle}" 회고를 삭제하시겠습니까?`}
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

interface PerformanceRetrospectiveCardProps {
  groupId: string;
  projectId: string;
  userId: string;
}

export function PerformanceRetrospectiveCard({
  groupId,
  projectId,
  userId,
}: PerformanceRetrospectiveCardProps) {
  const [open, setOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    retros,
    totalRetros,
    avgRating,
    addRetro,
    deleteRetro,
    addRetroItem,
    voteItem,
    addActionItem,
  } = usePerformanceRetrospective(groupId, projectId);

  // 작성자 이름으로 userId를 임시 사용 (실제로는 프로필에서 가져올 수 있음)
  const authorName = userId.slice(0, 8);

  const handleAddItem = (retroId: string, category: RetroCategory, content: string) => {
    const ok = addRetroItem(retroId, category, content, authorName);
    if (ok) {
      toast.success("항목이 추가되었습니다.");
    }
  };

  return (
    <>
      <CreateRetroDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={addRetro}
      />

      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 border rounded-t-lg bg-card">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 flex-1 min-w-0 text-left">
              {open ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <MessageCircle className="h-4 w-4 text-purple-500 flex-shrink-0" />
              <span className="text-sm font-semibold">공연 리뷰 &amp; 회고</span>

              {totalRetros > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100 ml-1"
                >
                  {totalRetros}개
                </Badge>
              )}

              {totalRetros > 0 && (
                <span className="text-[10px] text-muted-foreground ml-1 flex items-center gap-0.5">
                  평균
                  <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400 ml-0.5" />
                  {avgRating}
                </span>
              )}
            </button>
          </CollapsibleTrigger>

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs flex-shrink-0"
            onClick={() => {
              setDialogOpen(true);
              setOpen(true);
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            회고 작성
          </Button>
        </div>

        {/* 카드 바디 */}
        <CollapsibleContent>
          <div className="border border-t-0 rounded-b-lg p-3 space-y-2 bg-card">
            {/* 빈 상태 */}
            {retros.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">아직 작성된 회고가 없습니다.</p>
                <p className="text-[11px] mt-0.5">
                  공연 후 KPT 회고를 작성하고 팀원들과 공유해보세요.
                </p>
              </div>
            )}

            {/* 회고 목록 */}
            {retros.length > 0 && (
              <div className="space-y-1.5">
                {[...retros]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((retro) => (
                    <RetroRow
                      key={retro.id}
                      retro={retro}
                      authorName={authorName}
                      onAddItem={handleAddItem}
                      onVote={(retroId, itemId) => voteItem(retroId, itemId)}
                      onAddAction={(retroId, action) =>
                        addActionItem(retroId, action)
                      }
                      onDelete={(retroId) => deleteRetro(retroId)}
                    />
                  ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
