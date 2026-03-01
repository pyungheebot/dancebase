"use client";

import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
} from "lucide-react";
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
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupRules } from "@/hooks/use-group-rules";
import type { GroupRuleCategory, GroupRuleEntry } from "@/types";

// ============================================
// 카테고리 설정
// ============================================

const CATEGORY_CONFIG: Record<
  GroupRuleCategory,
  { label: string; className: string }
> = {
  attendance: {
    label: "출석",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  behavior: {
    label: "행동",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  finance: {
    label: "재정",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  performance: {
    label: "공연",
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  communication: {
    label: "소통",
    className: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  general: {
    label: "일반",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

const CATEGORIES = Object.keys(CATEGORY_CONFIG) as GroupRuleCategory[];

// ============================================
// 카테고리 배지
// ============================================

function CategoryBadge({ category }: { category: GroupRuleCategory }) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

// ============================================
// 확인률 바
// ============================================

function AcknowledgmentBar({ rate }: { rate: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-400 rounded-full transition-all duration-300"
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground w-7 text-right">
        {rate}%
      </span>
    </div>
  );
}

// ============================================
// 규칙 추가/수정 다이얼로그
// ============================================

interface RuleDialogProps {
  open: boolean;
  onClose: () => void;
  initialData?: GroupRuleEntry;
  memberNames: string[];
  onSubmit: (
    category: GroupRuleCategory,
    title: string,
    content: string,
    createdBy: string
  ) => void;
}

const DEFAULT_FORM = {
  category: "general" as GroupRuleCategory,
  title: "",
  content: "",
  createdBy: "",
};

function RuleDialog({
  open,
  onClose,
  initialData,
  memberNames,
  onSubmit,
}: RuleDialogProps) {
  const [form, setForm] = useState(() =>
    initialData
      ? {
          category: initialData.category,
          title: initialData.title,
          content: initialData.content,
          createdBy: initialData.createdBy,
        }
      : DEFAULT_FORM
  );

  const isEdit = !!initialData;

  const set = <K extends keyof typeof DEFAULT_FORM>(
    key: K,
    value: (typeof DEFAULT_FORM)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error(TOAST.GROUP_RULES.RULE_TITLE_REQUIRED);
      return;
    }
    if (!form.content.trim()) {
      toast.error(TOAST.GROUP_RULES.RULE_CONTENT_REQUIRED);
      return;
    }
    if (!form.createdBy.trim()) {
      toast.error(TOAST.GROUP_RULES_CARD.AUTHOR_REQUIRED);
      return;
    }
    onSubmit(form.category, form.title, form.content, form.createdBy);
    if (!isEdit) setForm(DEFAULT_FORM);
    onClose();
  };

  const handleClose = () => {
    if (!isEdit) setForm(DEFAULT_FORM);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {isEdit ? "규칙 수정" : "규칙 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 카테고리 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              카테고리
            </Label>
            <Select
              value={form.category}
              onValueChange={(v) => set("category", v as GroupRuleCategory)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {CATEGORY_CONFIG[cat].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="규칙 제목"
              className="h-7 text-xs"
              autoFocus
            />
          </div>

          {/* 내용 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              내용 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder="규칙 상세 내용을 입력해주세요."
              className="text-xs resize-none min-h-[80px]"
            />
          </div>

          {/* 작성자 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              작성자 <span className="text-destructive">*</span>
            </Label>
            {memberNames.length > 0 ? (
              <Select
                value={form.createdBy}
                onValueChange={(v) => set("createdBy", v)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="작성자 선택" />
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
                value={form.createdBy}
                onChange={(e) => set("createdBy", e.target.value)}
                placeholder="작성자 이름"
                className="h-7 text-xs"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={!form.title.trim() || !form.content.trim() || !form.createdBy.trim()}
          >
            {isEdit ? "저장" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 규칙 항목 행
// ============================================

interface RuleRowProps {
  rule: GroupRuleEntry;
  index: number;
  totalCount: number;
  currentMemberName?: string;
  acknowledgmentRate: number;
  isAcknowledged: boolean;
  onEdit: (rule: GroupRuleEntry) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onAcknowledge: (ruleId: string) => void;
}

function RuleRow({
  rule,
  index,
  totalCount,
  currentMemberName,
  acknowledgmentRate,
  isAcknowledged,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  onAcknowledge,
}: RuleRowProps) {
  return (
    <div
      className={`rounded border px-3 py-2.5 transition-colors ${
        rule.isActive
          ? "bg-background border-gray-200"
          : "bg-gray-50 border-gray-100 opacity-50"
      }`}
    >
      {/* 상단: 번호 + 제목 + 배지 + 액션 */}
      <div className="flex items-start gap-2">
        {/* 순서 번호 */}
        <span className="text-[10px] text-muted-foreground font-mono mt-0.5 w-4 shrink-0">
          {index + 1}.
        </span>

        {/* 제목 + 배지 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-semibold ${
                rule.isActive ? "text-gray-800" : "text-gray-400"
              }`}
            >
              {rule.title}
            </span>
            <CategoryBadge category={rule.category} />
            {!rule.isActive && (
              <span className="inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-medium bg-gray-100 text-gray-400 border-gray-200">
                비활성
              </span>
            )}
          </div>

          {/* 내용 */}
          <p className="text-[11px] text-gray-500 mt-1 whitespace-pre-wrap leading-relaxed">
            {rule.content}
          </p>

          {/* 확인률 바 */}
          <div className="mt-2">
            <AcknowledgmentBar rate={acknowledgmentRate} />
          </div>

          {/* 작성자 + 확인 버튼 */}
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">
              작성: {rule.createdBy}
            </span>
            {currentMemberName && rule.isActive && (
              <Button
                variant={isAcknowledged ? "ghost" : "outline"}
                size="sm"
                className={`h-6 text-[10px] px-2 gap-1 ${
                  isAcknowledged
                    ? "text-emerald-600 cursor-default"
                    : "text-gray-600 hover:text-emerald-600"
                }`}
                onClick={() => !isAcknowledged && onAcknowledge(rule.id)}
                disabled={isAcknowledged}
              >
                <CheckCircle2 className="h-3 w-3" />
                {isAcknowledged ? "확인 완료" : "확인했습니다"}
              </Button>
            )}
          </div>
        </div>

        {/* 우측 액션 버튼 그룹 */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* 순서 이동 */}
          <button
            type="button"
            onClick={() => onMoveUp(rule.id)}
            disabled={index === 0}
            className="p-0.5 rounded text-muted-foreground hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="위로"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(rule.id)}
            disabled={index === totalCount - 1}
            className="p-0.5 rounded text-muted-foreground hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="아래로"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
          {/* 활성 토글 */}
          <button
            type="button"
            onClick={() => onToggleActive(rule.id)}
            className="p-0.5 rounded text-muted-foreground hover:text-blue-600 transition-colors"
            title={rule.isActive ? "비활성화" : "활성화"}
          >
            {rule.isActive ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3" />
            )}
          </button>
          {/* 수정 */}
          <button
            type="button"
            onClick={() => onEdit(rule)}
            className="p-0.5 rounded text-muted-foreground hover:text-blue-600 transition-colors"
            title="수정"
          >
            <Pencil className="h-3 w-3" />
          </button>
          {/* 삭제 */}
          <button
            type="button"
            onClick={() => onDelete(rule.id)}
            className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 카테고리 섹션
// ============================================

interface CategorySectionProps {
  category: GroupRuleCategory;
  rules: GroupRuleEntry[];
  currentMemberName?: string;
  totalMembers: number;
  getAcknowledgmentRate: (ruleId: string, total: number) => number;
  hasAcknowledged: (ruleId: string, memberName: string) => boolean;
  onEdit: (rule: GroupRuleEntry) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onAcknowledge: (ruleId: string) => void;
}

function CategorySection({
  category,
  rules,
  currentMemberName,
  totalMembers,
  getAcknowledgmentRate,
  hasAcknowledged,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  onAcknowledge,
}: CategorySectionProps) {
  const cfg = CATEGORY_CONFIG[category];

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className={`inline-flex items-center rounded border px-1.5 py-0 text-[10px] font-semibold ${cfg.className}`}
        >
          {cfg.label}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {rules.length}개
        </span>
      </div>
      <div className="space-y-1.5 pl-1">
        {rules.map((rule, catIdx) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              index={catIdx}
              totalCount={rules.length}
              currentMemberName={currentMemberName}
              acknowledgmentRate={getAcknowledgmentRate(rule.id, totalMembers)}
              isAcknowledged={
                currentMemberName
                  ? hasAcknowledged(rule.id, currentMemberName)
                  : false
              }
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onAcknowledge={onAcknowledge}
            />
          ))}
      </div>
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

interface GroupRulesCardProps {
  groupId: string;
  memberNames: string[];
  currentMemberName?: string;
}

export function GroupRulesCard({
  groupId,
  memberNames,
  currentMemberName,
}: GroupRulesCardProps) {
  const {
    rules,
    totalRules,
    activeRules,
    totalAcknowledgments,
    addRule,
    updateRule,
    deleteRule,
    toggleActive,
    moveRule,
    acknowledgeRule,
    getAcknowledgmentRate,
    hasAcknowledged,
  } = useGroupRules(groupId);

  const [open, setOpen] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupRuleEntry | null>(null);

  // 카테고리별 그룹화
  const grouped = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = rules.filter((r) => r.category === cat);
      return acc;
    },
    {} as Record<GroupRuleCategory, GroupRuleEntry[]>
  );

  const totalMembers = memberNames.length;

  const handleAdd = (
    category: GroupRuleCategory,
    title: string,
    content: string,
    createdBy: string
  ) => {
    const ok = addRule(category, title, content, createdBy);
    if (ok) {
      toast.success(TOAST.GROUP_RULES.RULE_ADDED);
    } else {
      toast.error(TOAST.GROUP_RULES.RULE_ADD_ERROR);
    }
  };

  const handleUpdate = (
    category: GroupRuleCategory,
    title: string,
    content: string,
    _createdBy: string
  ) => {
    if (!editTarget) return;
    const ok = updateRule(editTarget.id, { category, title, content });
    if (ok) {
      toast.success(TOAST.GROUP_RULES.RULE_UPDATED);
    } else {
      toast.error(TOAST.GROUP_RULES.RULE_UPDATE_ERROR);
    }
    setEditTarget(null);
  };

  const handleDelete = (id: string) => {
    deleteRule(id);
    toast.success(TOAST.GROUP_RULES.RULE_DELETED);
  };

  const handleToggleActive = (id: string) => {
    const rule = rules.find((r) => r.id === id);
    toggleActive(id);
    toast.success(
      rule?.isActive ? "규칙이 비활성화되었습니다." : "규칙이 활성화되었습니다."
    );
  };

  const handleMoveUp = (id: string) => moveRule(id, "up");
  const handleMoveDown = (id: string) => moveRule(id, "down");

  const handleAcknowledge = (ruleId: string) => {
    if (!currentMemberName) return;
    const ok = acknowledgeRule(ruleId, currentMemberName);
    if (ok) {
      toast.success(TOAST.GROUP_RULES.RULE_CONFIRMED);
    }
  };

  const handleEdit = (rule: GroupRuleEntry) => {
    setEditTarget(rule);
  };

  // 표시할 카테고리 (규칙이 있는 것만)
  const activeCategories = CATEGORIES.filter(
    (cat) => grouped[cat].length > 0
  );

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 헤더 */}
        <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-800">
              그룹 규칙
            </span>
            {totalRules > 0 && (
              <Badge className="bg-indigo-100 text-[10px] px-1.5 py-0 text-indigo-600 hover:bg-indigo-100">
                {totalRules}개
              </Badge>
            )}
            {totalRules > 0 && activeRules < totalRules && (
              <Badge className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-500 hover:bg-gray-100">
                활성 {activeRules}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {open && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] px-2 gap-0.5"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-3 w-3" />
                규칙 추가
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {open ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 본문 */}
        <CollapsibleContent>
          <div className="rounded-b-lg border border-gray-200 bg-card p-4">
            {totalRules === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
                <BookOpen className="h-8 w-8 opacity-25" />
                <p className="text-xs">등록된 규칙이 없습니다.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  첫 번째 규칙 추가
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 카테고리별 섹션 */}
                {activeCategories.length > 0 ? (
                  activeCategories.map((cat) => (
                    <CategorySection
                      key={cat}
                      category={cat}
                      rules={grouped[cat]}
                      currentMemberName={currentMemberName}
                      totalMembers={totalMembers}
                      getAcknowledgmentRate={getAcknowledgmentRate}
                      hasAcknowledged={hasAcknowledged}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleActive={handleToggleActive}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onAcknowledge={handleAcknowledge}
                    />
                  ))
                ) : null}

                {/* 통계 */}
                <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-[10px] text-muted-foreground">
                  <span>
                    전체{" "}
                    <strong className="text-foreground">{totalRules}</strong>개
                  </span>
                  <span>
                    활성{" "}
                    <strong className="text-foreground">{activeRules}</strong>개
                  </span>
                  {totalAcknowledgments > 0 && (
                    <span>
                      확인{" "}
                      <strong className="text-foreground">
                        {totalAcknowledgments}
                      </strong>
                      건
                    </span>
                  )}
                  {totalMembers > 0 && (
                    <span>
                      멤버{" "}
                      <strong className="text-foreground">{totalMembers}</strong>
                      명
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 규칙 추가 다이얼로그 */}
      <RuleDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        memberNames={memberNames}
        onSubmit={handleAdd}
      />

      {/* 규칙 수정 다이얼로그 */}
      {editTarget && (
        <RuleDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          initialData={editTarget}
          memberNames={memberNames}
          onSubmit={handleUpdate}
        />
      )}
    </>
  );
}
