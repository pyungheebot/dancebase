"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
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
import { Progress } from "@/components/ui/progress";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  ShieldCheck,
  AlertTriangle,
  Circle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useSafetyChecklist } from "@/hooks/use-safety-checklist";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import type {
  SafetyChecklistCategory,
  SafetyChecklistStatus,
  SafetyChecklistPriority,
  SafetyChecklistItem,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const CATEGORY_LABELS: Record<SafetyChecklistCategory, string> = {
  stage: "무대안전",
  electric: "전기",
  fire: "소방",
  emergency: "응급",
  audience: "관객안전",
  etc: "기타",
};

const CATEGORY_COLORS: Record<SafetyChecklistCategory, string> = {
  stage: "bg-purple-100 text-purple-700 border-purple-200",
  electric: "bg-yellow-100 text-yellow-700 border-yellow-200",
  fire: "bg-red-100 text-red-700 border-red-200",
  emergency: "bg-orange-100 text-orange-700 border-orange-200",
  audience: "bg-blue-100 text-blue-700 border-blue-200",
  etc: "bg-gray-100 text-gray-700 border-gray-200",
};

const STATUS_LABELS: Record<SafetyChecklistStatus, string> = {
  pending: "미확인",
  checked: "확인완료",
  issue: "문제발견",
};

const STATUS_COLORS: Record<SafetyChecklistStatus, string> = {
  pending: "bg-gray-100 text-gray-600 border-gray-200",
  checked: "bg-green-100 text-green-700 border-green-200",
  issue: "bg-red-100 text-red-700 border-red-200",
};

const PRIORITY_LABELS: Record<SafetyChecklistPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const PRIORITY_COLORS: Record<SafetyChecklistPriority, string> = {
  high: "bg-red-50 text-red-600 border-red-200",
  medium: "bg-yellow-50 text-yellow-600 border-yellow-200",
  low: "bg-green-50 text-green-600 border-green-200",
};

const CATEGORIES: SafetyChecklistCategory[] = [
  "stage",
  "electric",
  "fire",
  "emergency",
  "audience",
  "etc",
];

const PRIORITIES: SafetyChecklistPriority[] = ["high", "medium", "low"];

// ============================================================
// 기본 템플릿 항목
// ============================================================

const DEFAULT_TEMPLATES: Array<{
  category: SafetyChecklistCategory;
  content: string;
  priority: SafetyChecklistPriority;
}> = [
  { category: "stage", content: "무대 바닥 고정 상태 확인", priority: "high" },
  { category: "stage", content: "조명 장비 결박 상태 확인", priority: "high" },
  { category: "stage", content: "무대 진입/퇴장 통로 확보", priority: "medium" },
  { category: "electric", content: "전기 배선 절연 상태 확인", priority: "high" },
  { category: "electric", content: "차단기 용량 적합 여부 확인", priority: "high" },
  { category: "electric", content: "접지 연결 상태 확인", priority: "medium" },
  { category: "fire", content: "소화기 위치 및 상태 확인", priority: "high" },
  { category: "fire", content: "비상구 표시등 점등 확인", priority: "high" },
  { category: "fire", content: "스프링클러 작동 여부 확인", priority: "medium" },
  { category: "emergency", content: "구급함 위치 및 내용물 확인", priority: "high" },
  { category: "emergency", content: "비상연락망 게시 및 공유", priority: "high" },
  { category: "emergency", content: "응급처치 가능 인원 배치", priority: "medium" },
  { category: "audience", content: "객석 통로 장애물 제거", priority: "high" },
  { category: "audience", content: "비상구 안내 방송 준비", priority: "medium" },
  { category: "audience", content: "관객 정원 초과 여부 확인", priority: "high" },
];

// ============================================================
// 항목 추가/수정 폼
// ============================================================

interface ItemFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: {
    category: SafetyChecklistCategory;
    content: string;
    assignee?: string;
    priority: SafetyChecklistPriority;
    notes?: string;
  }) => void;
  editItem?: SafetyChecklistItem | null;
}

function ItemFormDialog({
  open,
  onClose,
  onSubmit,
  editItem,
}: ItemFormDialogProps) {
  const [category, setCategory] = useState<SafetyChecklistCategory>(
    editItem?.category ?? "stage"
  );
  const [content, setContent] = useState(editItem?.content ?? "");
  const [assignee, setAssignee] = useState(editItem?.assignee ?? "");
  const [priority, setPriority] = useState<SafetyChecklistPriority>(
    editItem?.priority ?? "medium"
  );
  const [notes, setNotes] = useState(editItem?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setCategory(editItem?.category ?? "stage");
      setContent(editItem?.content ?? "");
      setAssignee(editItem?.assignee ?? "");
      setPriority(editItem?.priority ?? "medium");
      setNotes(editItem?.notes ?? "");
    }
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error("항목 내용을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      onSubmit({
        category,
        content,
        assignee: assignee || undefined,
        priority,
        notes: notes || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        handleOpen(v);
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editItem ? "항목 수정" : "항목 추가"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs">카테고리</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as SafetyChecklistCategory)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 항목 내용 */}
          <div className="space-y-1">
            <Label className="text-xs">
              항목 내용 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="확인할 안전 항목을 입력하세요"
              className="h-8 text-xs"
            />
          </div>

          {/* 담당자 */}
          <div className="space-y-1">
            <Label className="text-xs">담당자</Label>
            <Input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="담당자 이름 (선택)"
              className="h-8 text-xs"
            />
          </div>

          {/* 우선순위 */}
          <div className="space-y-1">
            <Label className="text-xs">우선순위</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as SafetyChecklistPriority)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p} className="text-xs">
                    {PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 비고 */}
          <div className="space-y-1">
            <Label className="text-xs">비고</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 메모 (선택)"
              className="text-xs min-h-[60px] resize-none"
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
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {editItem ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 항목 행 컴포넌트
// ============================================================

interface ItemRowProps {
  item: SafetyChecklistItem;
  onStatusChange: (itemId: string, status: SafetyChecklistStatus) => void;
  onEdit: (item: SafetyChecklistItem) => void;
  onDelete: (itemId: string) => void;
}

function ItemRow({ item, onStatusChange, onEdit, onDelete }: ItemRowProps) {
  const statusIcon = {
    pending: <Circle className="h-4 w-4 text-gray-400" />,
    checked: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    issue: <XCircle className="h-4 w-4 text-red-500" />,
  }[item.status];

  const nextStatus: Record<SafetyChecklistStatus, SafetyChecklistStatus> = {
    pending: "checked",
    checked: "issue",
    issue: "pending",
  };

  return (
    <div
      className={`flex items-start gap-2 p-2 rounded-lg border text-xs transition-colors ${
        item.status === "checked"
          ? "bg-green-50 border-green-100"
          : item.status === "issue"
          ? "bg-red-50 border-red-100"
          : "bg-white border-gray-100"
      }`}
    >
      {/* 상태 토글 버튼 */}
      <button
        onClick={() => onStatusChange(item.id, nextStatus[item.status])}
        className="mt-0.5 flex-shrink-0 hover:opacity-70 transition-opacity"
        title={`상태 변경: ${STATUS_LABELS[nextStatus[item.status]]}`}
      >
        {statusIcon}
      </button>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`font-medium ${
              item.status === "checked" ? "line-through text-gray-400" : ""
            }`}
          >
            {item.content}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLORS[item.priority]}`}
          >
            {PRIORITY_LABELS[item.priority]}
          </Badge>
        </div>

        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 flex-wrap">
          {item.assignee && (
            <span className="flex items-center gap-0.5">
              담당: {item.assignee}
            </span>
          )}
          {item.checkedAt && (
            <span>
              {item.status === "checked" ? "확인" : "처리"}:{" "}
              {new Date(item.checkedAt).toLocaleString("ko-KR", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {item.notes && (
            <span className="text-gray-400 italic truncate max-w-[200px]">
              {item.notes}
            </span>
          )}
        </div>
      </div>

      {/* 상태 배지 */}
      <Badge
        variant="outline"
        className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${STATUS_COLORS[item.status]}`}
      >
        {STATUS_LABELS[item.status]}
      </Badge>

      {/* 편집/삭제 버튼 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

interface SafetyChecklistCardProps {
  groupId: string;
  projectId: string;
}

export function SafetyChecklistCard({
  groupId,
  projectId,
}: SafetyChecklistCardProps) {
  const {
    items,
    loading,
    addItem,
    updateItem,
    updateStatus,
    deleteItem,
    resetAll,
    stats,
  } = useSafetyChecklist(groupId, projectId);

  const [open, setOpen] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<SafetyChecklistItem | null>(null);
  const deleteConfirm = useDeleteConfirm<string>();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [templateConfirmOpen, setTemplateConfirmOpen] = useState(false);
  const [filterCategory, setFilterCategory] =
    useState<SafetyChecklistCategory | "all">("all");
  const [filterStatus, setFilterStatus] =
    useState<SafetyChecklistStatus | "all">("all");
  const { pending: loadingTemplate, execute: executeTemplate } = useAsyncAction();

  // 필터 적용
  const filteredItems = items.filter((item) => {
    const catMatch =
      filterCategory === "all" || item.category === filterCategory;
    const statusMatch =
      filterStatus === "all" || item.status === filterStatus;
    return catMatch && statusMatch;
  });

  // 카테고리별 그룹핑
  const groupedItems = CATEGORIES.reduce<
    Record<SafetyChecklistCategory, SafetyChecklistItem[]>
  >(
    (acc, cat) => {
      acc[cat] = filteredItems.filter((i) => i.category === cat);
      return acc;
    },
    {} as Record<SafetyChecklistCategory, SafetyChecklistItem[]>
  );

  // 항목 추가 핸들러
  const handleAdd = (params: {
    category: SafetyChecklistCategory;
    content: string;
    assignee?: string;
    priority: SafetyChecklistPriority;
    notes?: string;
  }) => {
    addItem(params);
    toast.success("항목이 추가되었습니다.");
  };

  // 항목 수정 핸들러
  const handleEdit = (params: {
    category: SafetyChecklistCategory;
    content: string;
    assignee?: string;
    priority: SafetyChecklistPriority;
    notes?: string;
  }) => {
    if (!editItem) return;
    const ok = updateItem(editItem.id, params);
    if (ok) {
      toast.success("항목이 수정되었습니다.");
    } else {
      toast.error("항목 수정에 실패했습니다.");
    }
    setEditItem(null);
  };

  // 상태 변경 핸들러
  const handleStatusChange = (
    itemId: string,
    status: SafetyChecklistStatus
  ) => {
    const ok = updateStatus(itemId, status);
    if (!ok) {
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  // 삭제 핸들러
  const handleDelete = () => {
    const id = deleteConfirm.confirm();
    if (!id) return;
    const ok = deleteItem(id);
    if (ok) {
      toast.success("항목이 삭제되었습니다.");
    } else {
      toast.error("항목 삭제에 실패했습니다.");
    }
  };

  // 전체 초기화 핸들러
  const handleReset = () => {
    resetAll();
    toast.success("모든 항목이 미확인 상태로 초기화되었습니다.");
    setResetDialogOpen(false);
  };

  // 기본 템플릿 불러오기
  const handleLoadTemplate = () => {
    if (items.length > 0) {
      setTemplateConfirmOpen(true);
      return;
    }
    doLoadTemplate();
  };

  const doLoadTemplate = () => {
    executeTemplate(async () => {
      DEFAULT_TEMPLATES.forEach((t) => {
        addItem({
          category: t.category,
          content: t.content,
          priority: t.priority,
        });
      });
      toast.success(`기본 템플릿 ${DEFAULT_TEMPLATES.length}개 항목을 불러왔습니다.`);
    });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            공연 안전 체크리스트
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-xs text-gray-400">불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-sm font-semibold">
                    공연 안전 체크리스트
                  </CardTitle>
                  {open ? (
                    <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </button>
              </CollapsibleTrigger>

              <div className="flex items-center gap-1">
                {items.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleLoadTemplate}
                    disabled={loadingTemplate}
                  >
                    기본 템플릿
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-red-500 hover:text-red-700"
                  onClick={() => setResetDialogOpen(true)}
                  disabled={items.length === 0}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  초기화
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  항목 추가
                </Button>
              </div>
            </div>

            {/* 진행률 */}
            {items.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>
                    확인완료 {stats.checkedCount}/{stats.totalCount}
                    {stats.issueCount > 0 && (
                      <span className="text-red-500 ml-1.5">
                        (문제 {stats.issueCount}건)
                      </span>
                    )}
                    {stats.highPriorityPending > 0 && (
                      <span className="text-orange-500 ml-1.5">
                        높은우선순위 미확인 {stats.highPriorityPending}건
                      </span>
                    )}
                  </span>
                  <span className="font-semibold">{stats.progressRate}%</span>
                </div>
                <Progress value={stats.progressRate} className="h-1.5" />
              </div>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-3 space-y-3">
              {/* 필터 */}
              {items.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-3 w-3 text-gray-400" />
                  <Select
                    value={filterCategory}
                    onValueChange={(v) =>
                      setFilterCategory(
                        v as SafetyChecklistCategory | "all"
                      )
                    }
                  >
                    <SelectTrigger className="h-7 text-xs w-32">
                      <SelectValue placeholder="카테고리" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">
                        전체 카테고리
                      </SelectItem>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="text-xs">
                          {CATEGORY_LABELS[c]}{" "}
                          {stats.categoryBreakdown[c]
                            ? `(${stats.categoryBreakdown[c]})`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterStatus}
                    onValueChange={(v) =>
                      setFilterStatus(v as SafetyChecklistStatus | "all")
                    }
                  >
                    <SelectTrigger className="h-7 text-xs w-28">
                      <SelectValue placeholder="상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">
                        전체 상태
                      </SelectItem>
                      <SelectItem value="pending" className="text-xs">
                        미확인 ({stats.pendingCount})
                      </SelectItem>
                      <SelectItem value="checked" className="text-xs">
                        확인완료 ({stats.checkedCount})
                      </SelectItem>
                      <SelectItem value="issue" className="text-xs">
                        문제발견 ({stats.issueCount})
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* 요약 배지 */}
                  <div className="flex items-center gap-1 ml-auto">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
                    >
                      <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                      {stats.checkedCount}
                    </Badge>
                    {stats.issueCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-200"
                      >
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                        {stats.issueCount}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-gray-50 text-gray-600 border-gray-200"
                    >
                      <Circle className="h-2.5 w-2.5 mr-0.5" />
                      {stats.pendingCount}
                    </Badge>
                  </div>
                </div>
              )}

              {/* 항목 없음 */}
              {items.length === 0 && (
                <div className="text-center py-6 text-xs text-gray-400 space-y-2">
                  <ShieldCheck className="h-8 w-8 mx-auto text-gray-200" />
                  <p>등록된 안전 체크리스트 항목이 없습니다.</p>
                  <p className="text-[10px]">
                    기본 템플릿을 불러오거나 직접 항목을 추가하세요.
                  </p>
                </div>
              )}

              {/* 카테고리별 항목 목록 */}
              {items.length > 0 &&
                CATEGORIES.map((cat) => {
                  const catItems = groupedItems[cat];
                  if (catItems.length === 0) return null;

                  const catChecked = catItems.filter(
                    (i) => i.status === "checked"
                  ).length;
                  const catIssue = catItems.filter(
                    (i) => i.status === "issue"
                  ).length;

                  return (
                    <div key={cat} className="space-y-1.5">
                      {/* 카테고리 헤더 */}
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[cat]}`}
                        >
                          {CATEGORY_LABELS[cat]}
                        </Badge>
                        <span className="text-[10px] text-gray-400">
                          {catChecked}/{catItems.length} 확인
                          {catIssue > 0 && (
                            <span className="text-red-500 ml-1">
                              문제 {catIssue}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* 항목 목록 */}
                      <div className="space-y-1 pl-1">
                        {catItems.map((item) => (
                          <ItemRow
                            key={item.id}
                            item={item}
                            onStatusChange={handleStatusChange}
                            onEdit={(i) => setEditItem(i)}
                            onDelete={(id) => deleteConfirm.request(id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

              {/* 필터 결과 없음 */}
              {items.length > 0 && filteredItems.length === 0 && (
                <div className="text-center py-4 text-xs text-gray-400">
                  해당 조건에 맞는 항목이 없습니다.
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 항목 추가 다이얼로그 */}
      <ItemFormDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAdd}
      />

      {/* 항목 수정 다이얼로그 */}
      <ItemFormDialog
        open={editItem !== null}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        editItem={editItem}
      />

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="항목 삭제"
        description="이 안전 체크리스트 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDelete}
        destructive
      />

      {/* 초기화 확인 다이얼로그 */}
      <ConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title="체크리스트 초기화"
        description="모든 항목의 확인 상태를 미확인으로 초기화하시겠습니까? 항목은 삭제되지 않으며 확인 기록만 초기화됩니다."
        onConfirm={handleReset}
      />
      {/* 템플릿 불러오기 확인 다이얼로그 */}
      <ConfirmDialog
        open={templateConfirmOpen}
        onOpenChange={(v) => !v && setTemplateConfirmOpen(false)}
        title="템플릿 불러오기"
        description="기존 항목이 있습니다. 템플릿 항목을 추가로 불러오시겠습니까?"
        onConfirm={() => { setTemplateConfirmOpen(false); doLoadTemplate(); }}
      />
    </>
  );
}
