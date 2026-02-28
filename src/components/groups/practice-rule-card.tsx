"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Filter,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePracticeRule, type AddPracticeRuleInput } from "@/hooks/use-practice-rule";
import type {
  PracticeRuleEntry,
  PracticeRuleCategory,
  PracticeRulePriority,
  PracticeRulePenaltyType,
} from "@/types";

// ============================================================
// 상수 및 레이블 맵
// ============================================================

const CATEGORY_LABELS: Record<PracticeRuleCategory, string> = {
  attendance: "출석",
  dress: "복장",
  manner: "매너",
  safety: "안전",
  equipment: "장비/기자재",
  hygiene: "위생",
  communication: "소통",
  other: "기타",
};

const CATEGORY_COLORS: Record<PracticeRuleCategory, string> = {
  attendance: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  dress: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  manner: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  safety: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  equipment: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  hygiene: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  communication: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const PRIORITY_LABELS: Record<PracticeRulePriority, string> = {
  required: "필수",
  recommended: "권장",
  optional: "선택",
};

const PRIORITY_COLORS: Record<PracticeRulePriority, string> = {
  required: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
  recommended: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300",
  optional: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400",
};

const PRIORITY_BORDER: Record<PracticeRulePriority, string> = {
  required: "border-l-red-400",
  recommended: "border-l-yellow-400",
  optional: "border-l-gray-300",
};

const PENALTY_LABELS: Record<PracticeRulePenaltyType, string> = {
  none: "없음",
  warning: "경고",
  fine: "벌금",
  exclusion: "연습 제외",
  custom: "커스텀",
};

const DEFAULT_FORM: AddPracticeRuleInput = {
  category: "manner",
  priority: "recommended",
  title: "",
  description: "",
  penaltyType: "none",
  penaltyDetail: "",
};

// ============================================================
// 규칙 폼 컴포넌트
// ============================================================

type RuleFormProps = {
  value: AddPracticeRuleInput;
  onChange: (v: AddPracticeRuleInput) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
};

function RuleForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: RuleFormProps) {
  const set = <K extends keyof AddPracticeRuleInput>(
    key: K,
    val: AddPracticeRuleInput[K]
  ) => onChange({ ...value, [key]: val });

  return (
    <div className="space-y-2.5">
      {/* 제목 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-1 block">
          규칙 제목 <span className="text-red-400">*</span>
        </Label>
        <Input
          value={value.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="예: 연습 시작 10분 전 도착"
          className="h-7 text-xs"
        />
      </div>

      {/* 카테고리 + 중요도 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground mb-1 block">
            카테고리
          </Label>
          <Select
            value={value.category}
            onValueChange={(v) => set("category", v as PracticeRuleCategory)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CATEGORY_LABELS) as PracticeRuleCategory[]).map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  {CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-[10px] text-muted-foreground mb-1 block">
            중요도
          </Label>
          <Select
            value={value.priority}
            onValueChange={(v) => set("priority", v as PracticeRulePriority)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PRIORITY_LABELS) as PracticeRulePriority[]).map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 상세 설명 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-1 block">
          상세 설명 (선택)
        </Label>
        <Textarea
          value={value.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="규칙에 대한 상세 내용을 입력하세요"
          className="text-xs min-h-[56px] resize-none"
        />
      </div>

      {/* 페널티 유형 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-1 block">
          위반 시 페널티
        </Label>
        <Select
          value={value.penaltyType}
          onValueChange={(v) => set("penaltyType", v as PracticeRulePenaltyType)}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PENALTY_LABELS) as PracticeRulePenaltyType[]).map((p) => (
              <SelectItem key={p} value={p} className="text-xs">
                {PENALTY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 페널티 상세 (none이 아닐 때) */}
      {value.penaltyType !== "none" && (
        <div>
          <Label className="text-[10px] text-muted-foreground mb-1 block">
            페널티 상세
          </Label>
          <Input
            value={value.penaltyDetail ?? ""}
            onChange={(e) => set("penaltyDetail", e.target.value)}
            placeholder={
              value.penaltyType === "fine"
                ? "예: 1,000원"
                : value.penaltyType === "warning"
                ? "예: 3회 누적 시 추가 조치"
                : "상세 내용 입력"
            }
            className="h-7 text-xs"
          />
        </div>
      )}

      {/* 버튼 */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={onSubmit}
          disabled={submitting || !value.title.trim()}
        >
          {submitting && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
          {submitLabel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
          disabled={submitting}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 규칙 항목 컴포넌트
// ============================================================

type RuleItemProps = {
  rule: PracticeRuleEntry;
  index: number;
  total: number;
  canEdit: boolean;
  onToggleActive: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onEditStart: (rule: PracticeRuleEntry) => void;
  onDelete: (id: string) => void;
  isEditingThis: boolean;
  editForm: AddPracticeRuleInput;
  onEditChange: (v: AddPracticeRuleInput) => void;
  onEditSubmit: (id: string) => void;
  onEditCancel: () => void;
  editSubmitting: boolean;
  actionId: string | null;
};

function RuleItem({
  rule,
  index,
  total,
  canEdit,
  onToggleActive,
  onMove,
  onEditStart,
  onDelete,
  isEditingThis,
  editForm,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  editSubmitting,
  actionId,
}: RuleItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isBusy = actionId === rule.id;

  return (
    <div
      className={`rounded border bg-background border-l-2 ${PRIORITY_BORDER[rule.priority]} ${
        rule.isActive ? "" : "opacity-50"
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-1 px-2.5 py-1.5">
        {/* 중요도 배지 */}
        <span
          className={`shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[rule.priority]}`}
        >
          {PRIORITY_LABELS[rule.priority]}
        </span>

        {/* 카테고리 배지 */}
        <span
          className={`shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded ${CATEGORY_COLORS[rule.category]}`}
        >
          {CATEGORY_LABELS[rule.category]}
        </span>

        {/* 제목 */}
        <button
          type="button"
          className="flex-1 text-left text-xs font-medium leading-tight truncate hover:text-foreground/80 transition-colors"
          onClick={() => !isEditingThis && setExpanded((v) => !v)}
        >
          {rule.title}
        </button>

        {/* 페널티 아이콘 */}
        {rule.penaltyType !== "none" && (
          <span title={`페널티: ${PENALTY_LABELS[rule.penaltyType]}`}>
            <AlertTriangle className="h-3 w-3 text-orange-400 shrink-0" />
          </span>
        )}

        {/* 펼침 토글 */}
        {(rule.description || rule.penaltyType !== "none") && !isEditingThis && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}

        {/* 편집 버튼 영역 */}
        {canEdit && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              onClick={() => onToggleActive(rule.id)}
              disabled={isBusy}
              title={rule.isActive ? "비활성화" : "활성화"}
            >
              {rule.isActive ? (
                <ToggleRight className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <ToggleLeft className="h-3.5 w-3.5" />
              )}
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => onMove(rule.id, "up")}
              disabled={index === 0 || isBusy}
              title="위로"
            >
              <ArrowUp className="h-2.5 w-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => onMove(rule.id, "down")}
              disabled={index === total - 1 || isBusy}
              title="아래로"
            >
              <ArrowDown className="h-2.5 w-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-muted-foreground hover:text-blue-500"
              onClick={() => onEditStart(rule)}
              disabled={isBusy}
              title="편집"
            >
              <Pencil className="h-2.5 w-2.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(rule.id)}
              disabled={isBusy}
              title="삭제"
            >
              {isBusy ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <Trash2 className="h-2.5 w-2.5" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* 편집 폼 */}
      {isEditingThis && (
        <div className="border-t bg-muted/20 px-2.5 py-2">
          <RuleForm
            value={editForm}
            onChange={onEditChange}
            onSubmit={() => onEditSubmit(rule.id)}
            onCancel={onEditCancel}
            submitting={editSubmitting}
            submitLabel="저장"
          />
        </div>
      )}

      {/* 상세 내용 */}
      {expanded && !isEditingThis && (
        <div className="border-t bg-muted/20 px-2.5 py-2 space-y-1.5">
          {rule.description && (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {rule.description}
            </p>
          )}
          {rule.penaltyType !== "none" && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-orange-400 shrink-0" />
              <span className="text-[10px] text-orange-600 dark:text-orange-400">
                페널티: {PENALTY_LABELS[rule.penaltyType]}
                {rule.penaltyDetail ? ` — ${rule.penaltyDetail}` : ""}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

type PracticeRuleCardProps = {
  groupId: string;
  canEdit?: boolean;
};

export function PracticeRuleCard({
  groupId,
  canEdit = false,
}: PracticeRuleCardProps) {
  const {
    entries,
    loading,
    addRule,
    updateRule,
    deleteRule,
    toggleActive,
    moveRule,
    stats,
  } = usePracticeRule(groupId);

  // 필터 상태
  const [categoryFilter, setCategoryFilter] = useState<PracticeRuleCategory | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<PracticeRulePriority | "all">("all");
  const [showInactive, setShowInactive] = useState(false);

  // 폼 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddPracticeRuleInput>(DEFAULT_FORM);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AddPracticeRuleInput>(DEFAULT_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [actionId, setActionId] = useState<string | null>(null);

  // ── 필터링된 목록 ──
  const filtered = entries.filter((e) => {
    if (!showInactive && !e.isActive) return false;
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    if (priorityFilter !== "all" && e.priority !== priorityFilter) return false;
    return true;
  });

  // ── 규칙 추가 ──
  const handleAddSubmit = async () => {
    if (!addForm.title.trim()) return;
    setAddSubmitting(true);
    const ok = await addRule(addForm);
    setAddSubmitting(false);
    if (ok) {
      setAddForm(DEFAULT_FORM);
      setShowAddForm(false);
    }
  };

  // ── 규칙 편집 시작 ──
  const handleEditStart = (rule: PracticeRuleEntry) => {
    setEditingId(rule.id);
    setEditForm({
      category: rule.category,
      priority: rule.priority,
      title: rule.title,
      description: rule.description ?? "",
      penaltyType: rule.penaltyType,
      penaltyDetail: rule.penaltyDetail ?? "",
    });
  };

  // ── 규칙 편집 제출 ──
  const handleEditSubmit = async (id: string) => {
    if (!editForm.title.trim()) return;
    setEditSubmitting(true);
    const ok = await updateRule(id, editForm);
    setEditSubmitting(false);
    if (ok) {
      setEditingId(null);
      setEditForm(DEFAULT_FORM);
    }
  };

  // ── 삭제 ──
  const handleDelete = async (id: string) => {
    setActionId(id);
    await deleteRule(id);
    setActionId(null);
  };

  // ── 순서 이동 ──
  const handleMove = async (id: string, dir: "up" | "down") => {
    setActionId(id);
    await moveRule(id, dir);
    setActionId(null);
  };

  // ── 활성화 토글 ──
  const handleToggleActive = async (id: string) => {
    setActionId(id);
    await toggleActive(id);
    setActionId(null);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
            연습 규칙 &amp; 에티켓
          </CardTitle>
          {canEdit && !showAddForm && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-1.5 py-0 gap-0.5"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-3 w-3" />
              규칙 추가
            </Button>
          )}
        </div>

        {/* 통계 배지 */}
        {stats.total > 0 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              전체 {stats.total}
            </Badge>
            {stats.required > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-100 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300">
                필수 {stats.required}
              </Badge>
            )}
            {stats.recommended > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300">
                권장 {stats.recommended}
              </Badge>
            )}
            {stats.optional > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                선택 {stats.optional}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="px-3 pb-3 space-y-2">
        {/* 규칙 추가 폼 */}
        {showAddForm && canEdit && (
          <div className="rounded border bg-muted/30 p-2.5">
            <p className="text-[10px] font-medium text-muted-foreground mb-2">
              새 규칙 추가
            </p>
            <RuleForm
              value={addForm}
              onChange={setAddForm}
              onSubmit={handleAddSubmit}
              onCancel={() => {
                setAddForm(DEFAULT_FORM);
                setShowAddForm(false);
              }}
              submitting={addSubmitting}
              submitLabel="추가"
            />
          </div>
        )}

        {/* 필터 */}
        {entries.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-3 w-3 text-muted-foreground shrink-0" />

            {/* 카테고리 필터 */}
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as PracticeRuleCategory | "all")}
            >
              <SelectTrigger className="h-6 text-[10px] w-auto min-w-[72px] px-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">전체 카테고리</SelectItem>
                {(Object.keys(CATEGORY_LABELS) as PracticeRuleCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 중요도 필터 */}
            <Select
              value={priorityFilter}
              onValueChange={(v) => setPriorityFilter(v as PracticeRulePriority | "all")}
            >
              <SelectTrigger className="h-6 text-[10px] w-auto min-w-[60px] px-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">전체 중요도</SelectItem>
                {(Object.keys(PRIORITY_LABELS) as PracticeRulePriority[]).map((p) => (
                  <SelectItem key={p} value={p} className="text-xs">
                    {PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 비활성 포함 */}
            {canEdit && (
              <button
                type="button"
                onClick={() => setShowInactive((v) => !v)}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                  showInactive
                    ? "bg-muted border-muted-foreground/30 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                비활성 포함
              </button>
            )}
          </div>
        )}

        {/* 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-6 space-y-1">
            <ShieldCheck className="h-8 w-8 text-muted-foreground/30 mx-auto" />
            <p className="text-xs text-muted-foreground">
              등록된 연습 규칙이 없습니다
            </p>
            {canEdit && (
              <p className="text-[10px] text-muted-foreground/70">
                위의 규칙 추가 버튼을 눌러 첫 규칙을 만들어보세요
              </p>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            필터 조건에 맞는 규칙이 없습니다
          </p>
        ) : (
          <div className="space-y-1">
            {filtered.map((rule, index) => (
              <RuleItem
                key={rule.id}
                rule={rule}
                index={index}
                total={filtered.length}
                canEdit={canEdit}
                onToggleActive={handleToggleActive}
                onMove={handleMove}
                onEditStart={handleEditStart}
                onDelete={handleDelete}
                isEditingThis={editingId === rule.id}
                editForm={editForm}
                onEditChange={setEditForm}
                onEditSubmit={handleEditSubmit}
                onEditCancel={() => {
                  setEditingId(null);
                  setEditForm(DEFAULT_FORM);
                }}
                editSubmitting={editSubmitting}
                actionId={actionId}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
