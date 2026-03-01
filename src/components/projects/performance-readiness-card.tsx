"use client";

import { useState } from "react";
import {
  usePerformanceReadiness,
  calcCategoryProgress,
  calcTotalProgress,
} from "@/hooks/use-performance-readiness";
import type { ReadinessCategory, ReadinessCheckItem } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Plus,
  Trash2,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// ============================================
// 카테고리 메타데이터
// ============================================

const CATEGORY_META: Record<
  ReadinessCategory,
  { label: string; color: string; badgeClass: string }
> = {
  choreography: {
    label: "안무",
    color: "bg-purple-500",
    badgeClass:
      "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100",
  },
  costume: {
    label: "의상",
    color: "bg-pink-500",
    badgeClass:
      "bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-100",
  },
  music: {
    label: "음악",
    color: "bg-blue-500",
    badgeClass:
      "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  },
  stage: {
    label: "무대",
    color: "bg-orange-500",
    badgeClass:
      "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100",
  },
  logistics: {
    label: "행정/물류",
    color: "bg-cyan-500",
    badgeClass:
      "bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-100",
  },
  other: {
    label: "기타",
    color: "bg-gray-500",
    badgeClass:
      "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100",
  },
};

const CATEGORY_ORDER: ReadinessCategory[] = [
  "choreography",
  "costume",
  "music",
  "stage",
  "logistics",
  "other",
];

// ============================================
// SVG 원형 게이지
// ============================================

interface CircularGaugeProps {
  percent: number;
  size?: number;
}

function CircularGauge({ percent, size = 80 }: CircularGaugeProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const color =
    percent >= 80
      ? "#22c55e"
      : percent >= 50
      ? "#f59e0b"
      : "#ef4444";

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      {/* 배경 트랙 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={8}
      />
      {/* 진행 호 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      {/* 중앙 텍스트 (rotate 되돌림) */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ transform: `rotate(90deg) translate(0px, -${size}px)` }}
        className="text-[13px] font-bold fill-current"
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
        fill={color}
      >
        {percent}%
      </text>
    </svg>
  );
}

// ============================================
// 항목 추가 폼
// ============================================

interface AddItemFormProps {
  checklistId: string;
  onAdd: (
    checklistId: string,
    params: Omit<ReadinessCheckItem, "id" | "completed" | "completedAt">
  ) => boolean;
  onClose: () => void;
}

function AddItemForm({ checklistId, onAdd, onClose }: AddItemFormProps) {
  const [category, setCategory] = useState<ReadinessCategory>("choreography");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("항목 이름을 입력해주세요.");
      return;
    }
    const ok = onAdd(checklistId, {
      category,
      title: title.trim(),
      assignee: assignee.trim(),
      dueDate,
      note: note.trim(),
    });
    if (ok) {
      toast.success("항목이 추가되었습니다.");
      setTitle("");
      setAssignee("");
      setDueDate("");
      setNote("");
      onClose();
    } else {
      toast.error("항목 추가에 실패했습니다.");
    }
  };

  return (
    <div className="border rounded-md p-3 space-y-2.5 bg-muted/30">
      <div className="grid grid-cols-2 gap-2">
        {/* 카테고리 */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">카테고리</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as ReadinessCategory)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_ORDER.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  {CATEGORY_META[cat].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 마감일 */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">마감일</Label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* 항목 이름 */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">항목 이름 *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 1절 안무 완성"
          className="h-7 text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
      </div>

      {/* 담당자 */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">담당자</Label>
        <Input
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="담당자 이름"
          className="h-7 text-xs"
        />
      </div>

      {/* 메모 */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">메모</Label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="추가 메모 (선택)"
          className="h-7 text-xs"
        />
      </div>

      <div className="flex gap-1.5 justify-end pt-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onClose}
        >
          취소
        </Button>
        <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
          추가
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 체크리스트 항목 행
// ============================================

interface CheckItemRowProps {
  item: ReadinessCheckItem;
  onToggle: () => void;
  onDelete: () => void;
}

function CheckItemRow({ item, onToggle, onDelete }: CheckItemRowProps) {
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue =
    !item.completed && item.dueDate && item.dueDate < today;

  return (
    <div
      className={`flex items-start gap-2 py-1.5 px-2 rounded-md group hover:bg-muted/50 transition-colors ${
        isOverdue ? "bg-red-50 hover:bg-red-50" : ""
      }`}
    >
      {/* 체크 버튼 */}
      <button
        onClick={onToggle}
        className="mt-0.5 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
        aria-label={item.completed ? "완료 취소" : "완료 처리"}
      >
        {item.completed ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : isOverdue ? (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </button>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs leading-tight ${
            item.completed
              ? "line-through text-muted-foreground"
              : isOverdue
              ? "text-red-700 font-medium"
              : ""
          }`}
        >
          {item.title}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          {item.assignee && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <User className="h-3 w-3" />
              {item.assignee}
            </span>
          )}
          {item.dueDate && (
            <span
              className={`flex items-center gap-0.5 text-[10px] ${
                isOverdue
                  ? "text-red-600 font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <Calendar className="h-3 w-3" />
              {item.dueDate}
              {isOverdue && " (기한 초과)"}
            </span>
          )}
          {item.note && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
              {item.note}
            </span>
          )}
        </div>
      </div>

      {/* 삭제 버튼 */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-muted-foreground hover:text-destructive"
        aria-label="항목 삭제"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

// ============================================
// 카테고리 섹션
// ============================================

interface CategorySectionProps {
  category: ReadinessCategory;
  items: ReadinessCheckItem[];
  checklistId: string;
  onToggle: (itemId: string) => void;
  onDelete: (itemId: string) => void;
}

function CategorySection({
  category,
  items,
  checklistId,
  onToggle,
  onDelete,
}: CategorySectionProps) {
  const [open, setOpen] = useState(true);
  const meta = CATEGORY_META[category];
  const progress = calcCategoryProgress(items, category);
  const catItems = items.filter((i) => i.category === category);

  if (catItems.length === 0) return null;

  const doneCount = catItems.filter((i) => i.completed).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-md px-1 py-1 transition-colors select-none">
          {open ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          )}
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${meta.badgeClass}`}
          >
            {meta.label}
          </Badge>
          <div className="flex-1 min-w-0">
            <Progress value={progress} className="h-1.5" />
          </div>
          <span className="text-[10px] text-muted-foreground flex-shrink-0 w-14 text-right">
            {doneCount}/{catItems.length} ({progress}%)
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-5 mt-0.5 space-y-0.5">
          {catItems.map((item) => (
            <CheckItemRow
              key={item.id}
              item={item}
              onToggle={() => onToggle(item.id)}
              onDelete={() => onDelete(item.id)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================
// 단일 체크리스트 패널
// ============================================

interface ChecklistPanelProps {
  checklist: {
    id: string;
    eventName: string;
    eventDate: string;
    items: ReadinessCheckItem[];
    createdAt: string;
  };
  onToggleItem: (checklistId: string, itemId: string) => void;
  onDeleteItem: (checklistId: string, itemId: string) => void;
  onAddItem: (
    checklistId: string,
    params: Omit<ReadinessCheckItem, "id" | "completed" | "completedAt">
  ) => boolean;
  onDelete: (checklistId: string) => void;
}

function ChecklistPanel({
  checklist,
  onToggleItem,
  onDeleteItem,
  onAddItem,
  onDelete,
}: ChecklistPanelProps) {
  const [open, setOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const totalProgress = calcTotalProgress(checklist.items);
  const totalItems = checklist.items.length;
  const doneItems = checklist.items.filter((i) => i.completed).length;

  const handleDelete = () => {
    onDelete(checklist.id);
    toast.success("체크리스트가 삭제되었습니다.");
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 체크리스트 헤더 */}
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/30">
          {/* 원형 게이지 */}
          <div className="flex-shrink-0">
            <CircularGauge percent={totalProgress} size={60} />
          </div>

          {/* 이름/날짜 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{checklist.eventName}</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3" />
              {checklist.eventDate || "날짜 미정"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {doneItems}/{totalItems}개 완료
            </p>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <div className="p-3 space-y-1.5">
            {/* 카테고리별 섹션 */}
            {CATEGORY_ORDER.map((cat) => (
              <CategorySection
                key={cat}
                category={cat}
                items={checklist.items}
                checklistId={checklist.id}
                onToggle={(itemId) => onToggleItem(checklist.id, itemId)}
                onDelete={(itemId) => onDeleteItem(checklist.id, itemId)}
              />
            ))}

            {checklist.items.length === 0 && !showAddForm && (
              <p className="text-xs text-muted-foreground text-center py-4">
                아직 항목이 없습니다. 아래 버튼으로 추가해보세요.
              </p>
            )}

            {/* 항목 추가 폼 */}
            {showAddForm && (
              <AddItemForm
                checklistId={checklist.id}
                onAdd={onAddItem}
                onClose={() => setShowAddForm(false)}
              />
            )}

            {!showAddForm && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full mt-1"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                항목 추가
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(v) => !v && setDeleteConfirmOpen(false)}
        title="체크리스트 삭제"
        description={`"${checklist.eventName}" 체크리스트를 삭제하시겠습니까?`}
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}

// ============================================
// 새 체크리스트 생성 폼
// ============================================

interface CreateChecklistFormProps {
  onCreate: (params: { eventName: string; eventDate: string }) => void;
  onClose: () => void;
}

function CreateChecklistForm({ onCreate, onClose }: CreateChecklistFormProps) {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");

  const handleSubmit = () => {
    if (!eventName.trim()) {
      toast.error("공연/행사 이름을 입력해주세요.");
      return;
    }
    onCreate({ eventName: eventName.trim(), eventDate });
    toast.success("체크리스트가 생성되었습니다.");
    setEventName("");
    setEventDate("");
    onClose();
  };

  return (
    <div className="border rounded-md p-3 space-y-2.5 bg-muted/30">
      <p className="text-xs font-medium">새 체크리스트 만들기</p>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">공연/행사 이름 *</Label>
        <Input
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="예: 2026 봄 공연"
          className="h-7 text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">공연 날짜</Label>
        <Input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="h-7 text-xs"
        />
      </div>

      <div className="flex gap-1.5 justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onClose}
        >
          취소
        </Button>
        <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
          생성
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

interface PerformanceReadinessCardProps {
  groupId: string;
  projectId: string;
}

export function PerformanceReadinessCard({
  groupId,
  projectId,
}: PerformanceReadinessCardProps) {
  const [open, setOpen] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    checklists,
    createChecklist,
    deleteChecklist,
    addItem,
    toggleItem,
    deleteItem,
  } = usePerformanceReadiness(groupId, projectId);

  const handleCreate = (params: { eventName: string; eventDate: string }) => {
    createChecklist(params);
  };

  // 전체 통계
  const allItems = checklists.flatMap((c) => c.items);
  const totalAll = allItems.length;
  const doneAll = allItems.filter((i) => i.completed).length;
  const overallPercent =
    totalAll === 0 ? 0 : Math.round((doneAll / totalAll) * 100);

  return (
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
            <ClipboardList className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            <span className="text-sm font-semibold">공연 준비도 체크리스트</span>

            {checklists.length > 0 && (
              <span className="ml-1 text-[10px] text-muted-foreground">
                {doneAll}/{totalAll}
              </span>
            )}
          </button>
        </CollapsibleTrigger>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {checklists.length > 0 && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${
                overallPercent >= 80
                  ? "bg-green-100 text-green-700 border-green-200"
                  : overallPercent >= 50
                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                  : "bg-red-100 text-red-700 border-red-200"
              }`}
            >
              전체 {overallPercent}%
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setShowCreateForm(true);
              setOpen(true);
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            새 목록
          </Button>
        </div>
      </div>

      {/* 카드 바디 */}
      <CollapsibleContent>
        <div className="border border-t-0 rounded-b-lg p-3 space-y-3 bg-card">
          {/* 생성 폼 */}
          {showCreateForm && (
            <CreateChecklistForm
              onCreate={handleCreate}
              onClose={() => setShowCreateForm(false)}
            />
          )}

          {/* 체크리스트 없을 때 안내 */}
          {checklists.length === 0 && !showCreateForm && (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">아직 체크리스트가 없습니다.</p>
              <p className="text-[11px] mt-0.5">
                상단의 &ldquo;새 목록&rdquo; 버튼으로 공연 준비를 시작하세요.
              </p>
            </div>
          )}

          {/* 체크리스트 목록 */}
          {checklists.map((checklist) => (
            <ChecklistPanel
              key={checklist.id}
              checklist={checklist}
              onToggleItem={toggleItem}
              onDeleteItem={deleteItem}
              onAddItem={addItem}
              onDelete={deleteChecklist}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
