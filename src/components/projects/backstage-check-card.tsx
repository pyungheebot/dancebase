"use client";

import { useState } from "react";
import { useBackstageCheck } from "@/hooks/use-backstage-check";
import type { BackstageCategory, BackstageCheckItem, BackstageCheckSession } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  ChevronRight,
  ClipboardList,
  Plus,
  Trash2,
  Speaker,
  Lightbulb,
  Shirt,
  Package,
  Shield,
  Radio,
  HelpCircle,
  CheckCircle2,
  Circle,
  Clock,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// 카테고리 헬퍼
// ============================================

function categoryLabel(category: BackstageCategory): string {
  switch (category) {
    case "sound":
      return "음향";
    case "lighting":
      return "조명";
    case "costume":
      return "의상";
    case "props":
      return "소품";
    case "safety":
      return "안전";
    case "communication":
      return "통신";
    case "other":
      return "기타";
  }
}

function CategoryIcon({
  category,
  className,
}: {
  category: BackstageCategory;
  className?: string;
}) {
  const cls = className ?? "h-3.5 w-3.5";
  switch (category) {
    case "sound":
      return <Speaker className={cls} />;
    case "lighting":
      return <Lightbulb className={cls} />;
    case "costume":
      return <Shirt className={cls} />;
    case "props":
      return <Package className={cls} />;
    case "safety":
      return <Shield className={cls} />;
    case "communication":
      return <Radio className={cls} />;
    case "other":
      return <HelpCircle className={cls} />;
  }
}

function categoryIconColor(category: BackstageCategory): string {
  switch (category) {
    case "sound":
      return "text-blue-500";
    case "lighting":
      return "text-yellow-500";
    case "costume":
      return "text-pink-500";
    case "props":
      return "text-orange-500";
    case "safety":
      return "text-red-500";
    case "communication":
      return "text-cyan-500";
    case "other":
      return "text-gray-400";
  }
}

// ============================================
// 우선순위 헬퍼
// ============================================

function priorityLabel(priority: "high" | "medium" | "low"): string {
  switch (priority) {
    case "high":
      return "높음";
    case "medium":
      return "보통";
    case "low":
      return "낮음";
  }
}

function priorityBadgeClass(priority: "high" | "medium" | "low"): string {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-700 border-red-200 hover:bg-red-100";
    case "medium":
      return "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100";
    case "low":
      return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100";
  }
}

// ============================================
// 세션 생성 다이얼로그
// ============================================

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (eventName: string, eventDate: string) => void;
}

function CreateSessionDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateSessionDialogProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(today);

  const resetForm = () => {
    setEventName("");
    setEventDate(today);
  };

  const handleSubmit = () => {
    if (!eventName.trim()) {
      toast.error("이벤트명을 입력해주세요.");
      return;
    }
    if (!eventDate) {
      toast.error("날짜를 입력해주세요.");
      return;
    }
    onSubmit(eventName.trim(), eventDate);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            백스테이지 체크 세션 생성
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">이벤트명 *</Label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="예: 2026 봄 공연"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">공연 날짜 *</Label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="h-7 text-xs"
            />
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
// 항목 추가 다이얼로그
// ============================================

const ALL_CATEGORIES: BackstageCategory[] = [
  "sound",
  "lighting",
  "costume",
  "props",
  "safety",
  "communication",
  "other",
];

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberNames: string[];
  onSubmit: (
    category: BackstageCategory,
    title: string,
    description: string,
    assignedTo: string,
    priority: "high" | "medium" | "low"
  ) => void;
}

function AddItemDialog({
  open,
  onOpenChange,
  memberNames,
  onSubmit,
}: AddItemDialogProps) {
  const [category, setCategory] = useState<BackstageCategory>("sound");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  const resetForm = () => {
    setCategory("sound");
    setTitle("");
    setDescription("");
    setAssignedTo("");
    setPriority("medium");
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("항목 제목을 입력해주세요.");
      return;
    }
    onSubmit(category, title.trim(), description.trim(), assignedTo, priority);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            체크 항목 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">카테고리 *</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as BackstageCategory)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {categoryLabel(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 마이크 배터리 교체 확인"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">설명 (선택)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상세 내용을 입력하세요"
              className="text-xs min-h-[56px] resize-none"
              rows={2}
            />
          </div>

          {/* 담당자 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">담당자 (선택)</Label>
            <Select
              value={assignedTo || "__none__"}
              onValueChange={(v) => setAssignedTo(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="담당자 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs">
                  미지정
                </SelectItem>
                {memberNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 우선순위 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">우선순위 *</Label>
            <Select
              value={priority}
              onValueChange={(v) =>
                setPriority(v as "high" | "medium" | "low")
              }
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high" className="text-xs">
                  높음
                </SelectItem>
                <SelectItem value="medium" className="text-xs">
                  보통
                </SelectItem>
                <SelectItem value="low" className="text-xs">
                  낮음
                </SelectItem>
              </SelectContent>
            </Select>
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
              추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 체크 항목 행
// ============================================

interface CheckItemRowProps {
  item: BackstageCheckItem;
  memberNames: string[];
  onToggle: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  isCompleted: boolean;
}

function CheckItemRow({
  item,
  memberNames,
  onToggle,
  onRemove,
  isCompleted,
}: CheckItemRowProps) {
  const [checkerName, setCheckerName] = useState(
    memberNames[0] ?? ""
  );
  const [showNameSelect, setShowNameSelect] = useState(false);

  const handleToggle = () => {
    if (isCompleted) return;
    if (!item.checked && memberNames.length > 1) {
      setShowNameSelect(true);
      return;
    }
    onToggle(item.id);
  };

  const handleConfirmCheck = (name: string) => {
    setCheckerName(name);
    setShowNameSelect(false);
    onToggle(item.id);
  };

  return (
    <div
      className={`flex items-start gap-2 px-2 py-1.5 rounded-md border transition-colors ${
        item.checked
          ? "bg-muted/30 border-muted"
          : "bg-card border-border hover:bg-muted/10"
      }`}
    >
      {/* 체크박스 영역 */}
      <button
        onClick={handleToggle}
        className="flex-shrink-0 mt-0.5"
        disabled={isCompleted}
        aria-label={item.checked ? "체크 해제" : "체크"}
        title={isCompleted ? "세션이 완료되었습니다" : undefined}
      >
        {item.checked ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Circle className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-xs font-medium ${
              item.checked ? "line-through text-muted-foreground" : ""
            }`}
          >
            {item.title}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${priorityBadgeClass(item.priority)}`}
          >
            {priorityLabel(item.priority)}
          </Badge>
          {item.assignedTo && (
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              @{item.assignedTo}
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
            {item.description}
          </p>
        )}

        {item.checked && item.checkedBy && item.checkedAt && (
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-green-600">
            <Clock className="h-2.5 w-2.5" />
            <span>
              {item.checkedBy} ·{" "}
              {new Date(item.checkedAt).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
        )}

        {/* 체크자 선택 인라인 */}
        {showNameSelect && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className="text-[10px] text-muted-foreground self-center">
              체크한 사람:
            </span>
            {memberNames.map((name) => (
              <button
                key={name}
                onClick={() => handleConfirmCheck(name)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                  checkerName === name
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted hover:bg-muted/80 border-border"
                }`}
              >
                {name}
              </button>
            ))}
            <button
              onClick={() => setShowNameSelect(false)}
              className="text-[10px] px-2 py-0.5 rounded border border-border hover:bg-muted/80 text-muted-foreground"
            >
              취소
            </button>
          </div>
        )}
      </div>

      {/* 삭제 버튼 */}
      {!isCompleted && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 flex-shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(item.id)}
          title="항목 삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// ============================================
// 세션 패널
// ============================================

interface SessionPanelProps {
  session: BackstageCheckSession;
  memberNames: string[];
  onDeleteSession: (sessionId: string) => void;
  onAddItem: (sessionId: string) => void;
  onToggleCheck: (sessionId: string, itemId: string, checkedBy: string) => void;
  onRemoveItem: (sessionId: string, itemId: string) => void;
  onCompleteSession: (sessionId: string) => boolean;
}

function SessionPanel({
  session,
  memberNames,
  onDeleteSession,
  onAddItem,
  onToggleCheck,
  onRemoveItem,
  onCompleteSession,
}: SessionPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const isCompleted = !!session.completedAt;
  const totalItems = session.items.length;
  const checkedItems = session.items.filter((i) => i.checked).length;
  const progressPct =
    totalItems === 0 ? 0 : Math.round((checkedItems / totalItems) * 100);
  const allChecked = totalItems > 0 && checkedItems === totalItems;

  // 카테고리별 그룹화
  const grouped: Partial<Record<BackstageCategory, BackstageCheckItem[]>> = {};
  for (const item of session.items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category]!.push(item);
  }

  // 카테고리 순서
  const orderedCategories: BackstageCategory[] = [
    "sound",
    "lighting",
    "costume",
    "props",
    "safety",
    "communication",
    "other",
  ];

  const handleDelete = () => {
    if (confirm(`"${session.eventName}" 세션을 삭제하시겠습니까?`)) {
      onDeleteSession(session.id);
      toast.success("세션이 삭제되었습니다.");
    }
  };

  const handleComplete = () => {
    const ok = onCompleteSession(session.id);
    if (ok) {
      toast.success("세션이 완료 처리되었습니다.");
    } else {
      toast.error("모든 항목을 체크해야 완료할 수 있습니다.");
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 세션 헤더 */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-muted/20 cursor-pointer select-none hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold truncate">
              {session.eventName}
            </span>
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              {session.eventDate}
            </span>
            {isCompleted && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 hover:bg-green-100 flex-shrink-0"
              >
                <CheckCheck className="h-2.5 w-2.5 mr-0.5" />
                완료
              </Badge>
            )}
          </div>
        </div>

        {/* 진행률 배지 + 삭제 */}
        <div
          className="flex items-center gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {totalItems > 0 && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${
                progressPct >= 100
                  ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                  : progressPct >= 50
                  ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100"
                  : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {checkedItems}/{totalItems}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            title="세션 삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 세션 바디 */}
      {expanded && (
        <div className="px-3 py-2.5 space-y-3 bg-card">
          {/* 진행률 바 */}
          {totalItems > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  체크 진행률
                </span>
                <span className="text-[10px] font-medium">{progressPct}%</span>
              </div>
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                    progressPct >= 100 ? "bg-green-500" : "bg-blue-400"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* 항목 없음 */}
          {totalItems === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <ClipboardList className="h-6 w-6 mx-auto mb-1 opacity-30" />
              <p className="text-[11px]">등록된 체크 항목이 없습니다.</p>
            </div>
          )}

          {/* 카테고리별 항목 */}
          {totalItems > 0 && (
            <div className="space-y-2.5">
              {orderedCategories.map((cat) => {
                const items = grouped[cat];
                if (!items || items.length === 0) return null;
                const catChecked = items.filter((i) => i.checked).length;

                return (
                  <div key={cat} className="space-y-1">
                    {/* 카테고리 헤더 */}
                    <div className="flex items-center gap-1.5">
                      <span className={categoryIconColor(cat)}>
                        <CategoryIcon category={cat} className="h-3 w-3" />
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {categoryLabel(cat)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({catChecked}/{items.length})
                      </span>
                    </div>

                    {/* 항목 목록 */}
                    <div className="space-y-1 pl-4">
                      {items.map((item) => (
                        <CheckItemRow
                          key={item.id}
                          item={item}
                          memberNames={memberNames}
                          isCompleted={isCompleted}
                          onToggle={(itemId) => {
                            const checker =
                              memberNames.length === 1
                                ? memberNames[0]
                                : "담당자";
                            onToggleCheck(session.id, itemId, checker);
                          }}
                          onRemove={(itemId) =>
                            onRemoveItem(session.id, itemId)
                          }
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 하단 버튼 */}
          {!isCompleted && (
            <div className="flex gap-1.5 pt-0.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={() => onAddItem(session.id)}
              >
                <Plus className="h-3 w-3 mr-1" />
                항목 추가
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={!allChecked}
                onClick={handleComplete}
                title={
                  allChecked
                    ? "세션 완료"
                    : "모든 항목을 체크해야 완료할 수 있습니다"
                }
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                완료
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

interface BackstageCheckCardProps {
  groupId: string;
  projectId: string;
  memberNames: string[];
}

export function BackstageCheckCard({
  groupId,
  projectId,
  memberNames,
}: BackstageCheckCardProps) {
  const [open, setOpen] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addItemDialogSessionId, setAddItemDialogSessionId] = useState<
    string | null
  >(null);

  const {
    sessions,
    totalSessions,
    activeSession,
    checkProgress,
    createSession,
    deleteSession,
    addItem,
    removeItem,
    toggleCheck,
    completeSession,
  } = useBackstageCheck(groupId, projectId);

  const handleCreateSession = (eventName: string, eventDate: string) => {
    const ok = createSession(eventName, eventDate);
    if (ok) {
      toast.success(`"${eventName}" 세션이 생성되었습니다.`);
      setOpen(true);
    } else {
      toast.error("세션 생성에 실패했습니다. 필수 항목을 확인해주세요.");
    }
  };

  const handleAddItem = (
    category: BackstageCategory,
    title: string,
    description: string,
    assignedTo: string,
    priority: "high" | "medium" | "low"
  ) => {
    if (!addItemDialogSessionId) return;
    const ok = addItem(
      addItemDialogSessionId,
      category,
      title,
      description || undefined,
      assignedTo || undefined,
      priority
    );
    if (ok) {
      toast.success("체크 항목이 추가되었습니다.");
    } else {
      toast.error("항목 추가에 실패했습니다.");
    }
  };

  const handleCompleteSession = (sessionId: string): boolean => {
    return completeSession(sessionId);
  };

  // 활성 세션 진행률 표시용
  const hasActiveSession = !!activeSession;
  const activePct =
    checkProgress.total === 0
      ? 0
      : Math.round((checkProgress.checked / checkProgress.total) * 100);

  return (
    <>
      <CreateSessionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateSession}
      />

      <AddItemDialog
        open={!!addItemDialogSessionId}
        onOpenChange={(o) => {
          if (!o) setAddItemDialogSessionId(null);
        }}
        memberNames={memberNames}
        onSubmit={handleAddItem}
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
              <ClipboardList className="h-4 w-4 text-indigo-500 flex-shrink-0" />
              <span className="text-sm font-semibold">공연 백스테이지 체크</span>

              {totalSessions > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  {totalSessions}개 세션
                </span>
              )}
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 활성 세션 진행률 배지 */}
            {hasActiveSession && checkProgress.total > 0 && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${
                  activePct >= 100
                    ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                    : activePct >= 50
                    ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100"
                    : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {activePct}% 체크
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setCreateDialogOpen(true);
                setOpen(true);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              세션 추가
            </Button>
          </div>
        </div>

        {/* 카드 바디 */}
        <CollapsibleContent>
          <div className="border border-t-0 rounded-b-lg p-3 space-y-3 bg-card">
            {sessions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">등록된 세션이 없습니다.</p>
                <p className="text-[11px] mt-0.5">
                  상단의 &ldquo;세션 추가&rdquo; 버튼으로 백스테이지 체크를
                  시작하세요.
                </p>
              </div>
            )}

            {sessions.length > 0 && (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <SessionPanel
                    key={session.id}
                    session={session}
                    memberNames={memberNames}
                    onDeleteSession={deleteSession}
                    onAddItem={(sessionId) =>
                      setAddItemDialogSessionId(sessionId)
                    }
                    onToggleCheck={toggleCheck}
                    onRemoveItem={removeItem}
                    onCompleteSession={handleCompleteSession}
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
