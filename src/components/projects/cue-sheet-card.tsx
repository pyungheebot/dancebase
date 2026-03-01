"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useCueSheet } from "@/hooks/use-cue-sheet";
import { ShowCueItem, ShowCueStatus } from "@/types";

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<ShowCueStatus, string> = {
  대기: "bg-gray-100 text-gray-600 border-gray-200",
  진행중: "bg-blue-100 text-blue-700 border-blue-200",
  완료: "bg-green-100 text-green-700 border-green-200",
};

const _STATUS_BADGE_VARIANT: Record<ShowCueStatus, string> = {
  대기: "secondary",
  진행중: "default",
  완료: "outline",
};

// ─── 빈 폼 초기값 ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  time: "",
  title: "",
  assignee: "",
  description: "",
  note: "",
  status: "대기" as ShowCueStatus,
};

// ─── 항목 폼 (추가/수정 공용) ─────────────────────────────────────────────────

interface CueItemFormProps {
  initial?: typeof EMPTY_FORM;
  onSubmit: (values: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  submitLabel: string;
}

function CueItemForm({ initial = EMPTY_FORM, onSubmit, onCancel, submitLabel }: CueItemFormProps) {
  const [form, setForm] = useState(initial);

  function handleChange(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("항목명을 입력해 주세요.");
      return;
    }
    onSubmit(form);
  }

  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">시간 (HH:MM)</Label>
          <Input
            className="h-7 text-xs"
            placeholder="예) 19:00"
            value={form.time}
            onChange={(e) => handleChange("time", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">항목명 *</Label>
          <Input
            className="h-7 text-xs"
            placeholder="예) 오프닝 무대"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">담당자</Label>
        <Input
          className="h-7 text-xs"
          placeholder="예) 홍길동, 무대팀"
          value={form.assignee}
          onChange={(e) => handleChange("assignee", e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">내용 설명</Label>
        <Textarea
          className="min-h-[56px] text-xs resize-none"
          placeholder="상세 내용을 입력하세요"
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">비고</Label>
        <Input
          className="h-7 text-xs"
          placeholder="특이사항 등"
          value={form.note}
          onChange={(e) => handleChange("note", e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-1.5 pt-1">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
          <X className="mr-1 h-3 w-3" />
          취소
        </Button>
        <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
          <Check className="mr-1 h-3 w-3" />
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

// ─── 큐 항목 행 ───────────────────────────────────────────────────────────────

interface CueItemRowProps {
  item: ShowCueItem;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onCycleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function CueItemRow({
  item,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onCycleStatus,
  onEdit,
  onDelete,
}: CueItemRowProps) {
  const isInProgress = item.status === "진행중";
  const isCompleted = item.status === "완료";

  return (
    <div
      className={`rounded-md border p-2.5 transition-colors ${
        isInProgress
          ? "border-blue-300 bg-blue-50"
          : isCompleted
          ? "border-green-200 bg-green-50/50"
          : "border-border bg-background"
      }`}
    >
      <div className="flex items-start gap-2">
        {/* 큐 번호 + 시간 */}
        <div className="flex w-14 shrink-0 flex-col items-center">
          <span className="text-[10px] font-bold text-muted-foreground">
            Q{item.order}
          </span>
          {item.time && (
            <span className="text-[10px] text-muted-foreground">{item.time}</span>
          )}
        </div>

        {/* 내용 */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-xs font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
              {item.title}
            </span>
            {item.assignee && (
              <span className="text-[10px] text-muted-foreground">({item.assignee})</span>
            )}
            {/* 상태 배지 - 클릭으로 토글 */}
            <button onClick={onCycleStatus} className="focus:outline-none">
              <Badge
                className={`cursor-pointer text-[10px] px-1.5 py-0 border ${STATUS_COLORS[item.status]}`}
                variant="outline"
              >
                {item.status}
              </Badge>
            </button>
          </div>
          {item.description && (
            <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}
          {item.note && (
            <p className="mt-0.5 text-[10px] italic text-muted-foreground">
              비고: {item.note}
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex shrink-0 flex-col gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            disabled={isFirst}
            onClick={onMoveUp}
            title="위로"
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            disabled={isLast}
            onClick={onMoveDown}
            title="아래로"
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground"
            onClick={onEdit}
            title="수정"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive"
            onClick={onDelete}
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────────────────────

export function CueSheetCard({ projectId }: { projectId: string }) {
  const {
    sheet,
    loading,
    total,
    completedCount,
    inProgressCount,
    completionRate,
    duration,
    addItem,
    updateItem,
    removeItem,
    moveUp,
    moveDown,
    cycleStatus,
  } = useCueSheet(projectId);

  const [open, setOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 항목 추가 핸들러
  async function handleAdd(values: typeof EMPTY_FORM) {
    try {
      await addItem(values);
      setShowAddForm(false);
      toast.success("큐 항목이 추가되었습니다.");
    } catch {
      toast.error("항목 추가에 실패했습니다.");
    }
  }

  // 항목 수정 핸들러
  async function handleUpdate(id: string, values: typeof EMPTY_FORM) {
    try {
      await updateItem(id, values);
      setEditingId(null);
      toast.success("큐 항목이 수정되었습니다.");
    } catch {
      toast.error("항목 수정에 실패했습니다.");
    }
  }

  // 항목 삭제 핸들러
  async function handleDelete(id: string) {
    try {
      await removeItem(id);
      toast.success("큐 항목이 삭제되었습니다.");
    } catch {
      toast.error("항목 삭제에 실패했습니다.");
    }
  }

  // 순서 이동 핸들러
  async function handleMoveUp(id: string) {
    try {
      await moveUp(id);
    } catch {
      toast.error("순서 변경에 실패했습니다.");
    }
  }

  async function handleMoveDown(id: string) {
    try {
      await moveDown(id);
    } catch {
      toast.error("순서 변경에 실패했습니다.");
    }
  }

  // 상태 토글 핸들러
  async function handleCycleStatus(id: string) {
    try {
      await cycleStatus(id);
    } catch {
      toast.error("상태 변경에 실패했습니다.");
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card shadow-sm">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">공연 큐시트</span>
              {total > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {total}개
                </Badge>
              )}
              {inProgressCount > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border border-blue-200">
                  진행중 {inProgressCount}
                </Badge>
              )}
            </div>
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-3 px-4 pb-4 pt-1">
            {/* 통계 바 */}
            {total > 0 && (
              <div className="space-y-1.5">
                {/* 진행률 바 */}
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {completionRate}%
                  </span>
                </div>
                {/* 통계 요약 */}
                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <span>총 {total}개</span>
                  <span>·</span>
                  <span className="text-green-600">완료 {completedCount}</span>
                  <span>·</span>
                  <span className="text-blue-600">진행중 {inProgressCount}</span>
                  <span>·</span>
                  <span>대기 {total - completedCount - inProgressCount}</span>
                  {duration !== "-" && (
                    <>
                      <span>·</span>
                      <span>예상 {duration}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 큐 항목 목록 */}
            {loading ? (
              <p className="py-4 text-center text-xs text-muted-foreground">불러오는 중...</p>
            ) : sheet.items.length === 0 && !showAddForm ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                큐 항목이 없습니다. 아래 버튼으로 추가해 주세요.
              </p>
            ) : (
              <div className="space-y-1.5">
                {sheet.items.map((item, idx) =>
                  editingId === item.id ? (
                    <CueItemForm
                      key={item.id}
                      initial={{
                        time: item.time,
                        title: item.title,
                        assignee: item.assignee,
                        description: item.description,
                        note: item.note,
                        status: item.status,
                      }}
                      submitLabel="저장"
                      onSubmit={(values) => handleUpdate(item.id, values)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <CueItemRow
                      key={item.id}
                      item={item}
                      isFirst={idx === 0}
                      isLast={idx === sheet.items.length - 1}
                      onMoveUp={() => handleMoveUp(item.id)}
                      onMoveDown={() => handleMoveDown(item.id)}
                      onCycleStatus={() => handleCycleStatus(item.id)}
                      onEdit={() => setEditingId(item.id)}
                      onDelete={() => handleDelete(item.id)}
                    />
                  )
                )}
              </div>
            )}

            {/* 추가 폼 */}
            {showAddForm && (
              <CueItemForm
                submitLabel="추가"
                onSubmit={handleAdd}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            {/* 항목 추가 버튼 */}
            {!showAddForm && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-full text-xs"
                onClick={() => {
                  setEditingId(null);
                  setShowAddForm(true);
                }}
              >
                <Plus className="mr-1 h-3 w-3" />
                큐 항목 추가
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
