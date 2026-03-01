"use client";

import { useState, useCallback } from "react";
import {
  Bell,
  Plus,
  Trash2,
  Settings,
  AlertTriangle,
  Calendar,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,

} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNotificationRules } from "@/hooks/use-notification-rules";
import type {
  NotificationRule,
  NotificationCondition,
  NotificationConditionType,
} from "@/types";

// ============================================
// 조건 유형 메타 정보
// ============================================

type ConditionMeta = {
  type: NotificationConditionType;
  label: string;
  description: string;
  hasValue: boolean;
  valuePlaceholder?: string;
  valueUnit?: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
};

const CONDITION_META: ConditionMeta[] = [
  {
    type: "attendance_below",
    label: "출석률 미만",
    description: "출석률이 지정한 %보다 낮아지면 알림",
    hasValue: true,
    valuePlaceholder: "70",
    valueUnit: "%",
    icon: AlertTriangle,
    badgeColor: "bg-orange-100 text-orange-700",
  },
  {
    type: "inactive_days",
    label: "미활동 일수",
    description: "지정한 일수 이상 활동이 없으면 알림",
    hasValue: true,
    valuePlaceholder: "14",
    valueUnit: "일",
    icon: Users,
    badgeColor: "bg-yellow-100 text-yellow-700",
  },
  {
    type: "schedule_upcoming",
    label: "일정 N일 전",
    description: "일정이 지정한 일수 후에 예정되면 알림",
    hasValue: true,
    valuePlaceholder: "3",
    valueUnit: "일 전",
    icon: Calendar,
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    type: "rsvp_missing",
    label: "RSVP 미응답",
    description: "RSVP 미응답이 지정 횟수 이상이면 알림",
    hasValue: true,
    valuePlaceholder: "3",
    valueUnit: "회",
    icon: AlertTriangle,
    badgeColor: "bg-red-100 text-red-700",
  },
  {
    type: "new_post",
    label: "새 게시글",
    description: "새 게시글이 등록되면 알림",
    hasValue: false,
    icon: Bell,
    badgeColor: "bg-green-100 text-green-700",
  },
];

function getConditionMeta(type: NotificationConditionType): ConditionMeta {
  return (
    CONDITION_META.find((m) => m.type === type) ?? CONDITION_META[0]
  );
}


// ============================================
// 빈 조건 항목
// ============================================

const EMPTY_CONDITION: NotificationCondition = {
  type: "attendance_below",
  value: 70,
};

// ============================================
// Props
// ============================================

type NotificationRulesBuilderProps = {
  groupId: string;
};

// ============================================
// 규칙 폼 내부 상태
// ============================================

type RuleFormState = {
  name: string;
  conditions: NotificationCondition[];
};

function emptyRuleForm(): RuleFormState {
  return {
    name: "",
    conditions: [{ ...EMPTY_CONDITION }],
  };
}

function ruleToFormState(rule: NotificationRule): RuleFormState {
  return {
    name: rule.name,
    conditions: rule.conditions.map((c) => ({ ...c })),
  };
}

// ============================================
// 조건 행 컴포넌트
// ============================================

type ConditionRowProps = {
  condition: NotificationCondition;
  index: number;
  canDelete: boolean;
  onChange: (index: number, updated: NotificationCondition) => void;
  onDelete: (index: number) => void;
};

function ConditionRow({
  condition,
  index,
  canDelete,
  onChange,
  onDelete,
}: ConditionRowProps) {
  const meta = getConditionMeta(condition.type);

  const handleTypeChange = (newType: string) => {
    const newMeta = getConditionMeta(newType as NotificationConditionType);
    onChange(index, {
      type: newType as NotificationConditionType,
      value: newMeta.hasValue ? (condition.value ?? undefined) : undefined,
    });
  };

  const handleValueChange = (raw: string) => {
    const num = parseInt(raw, 10);
    onChange(index, {
      ...condition,
      value: isNaN(num) ? undefined : num,
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* 조건 유형 선택 */}
      <Select value={condition.type} onValueChange={handleTypeChange}>
        <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CONDITION_META.map((m) => (
            <SelectItem key={m.type} value={m.type} className="text-xs">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 숫자 값 입력 */}
      {meta.hasValue && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Input
            type="number"
            min={1}
            max={meta.type === "attendance_below" ? 100 : 9999}
            value={condition.value ?? ""}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={meta.valuePlaceholder}
            className="h-8 text-xs w-16"
          />
          {meta.valueUnit && (
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              {meta.valueUnit}
            </span>
          )}
        </div>
      )}

      {/* 삭제 버튼 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 flex-shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(index)}
        disabled={!canDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ============================================
// 규칙 추가/수정 다이얼로그
// ============================================

type RuleEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialForm?: RuleFormState;
  onSubmit: (form: RuleFormState) => void;
  title: string;
  submitLabel: string;
};

function RuleEditDialog({
  open,
  onOpenChange,
  initialForm,
  onSubmit,
  title,
  submitLabel,
}: RuleEditDialogProps) {
  const [form, setForm] = useState<RuleFormState>(
    initialForm ?? emptyRuleForm()
  );

  // 다이얼로그가 열릴 때 폼 초기화
  const handleOpenChange = (val: boolean) => {
    if (val) {
      setForm(initialForm ?? emptyRuleForm());
    }
    onOpenChange(val);
  };

  const handleConditionChange = useCallback(
    (idx: number, updated: NotificationCondition) => {
      setForm((prev) => {
        const conditions = [...prev.conditions];
        conditions[idx] = updated;
        return { ...prev, conditions };
      });
    },
    []
  );

  const handleConditionDelete = useCallback((idx: number) => {
    setForm((prev) => {
      const conditions = prev.conditions.filter((_, i) => i !== idx);
      return { ...prev, conditions };
    });
  }, []);

  const handleAddCondition = () => {
    setForm((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { ...EMPTY_CONDITION }],
    }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("규칙 이름을 입력해주세요.");
      return;
    }
    if (form.conditions.length === 0) {
      toast.error("조건을 하나 이상 추가해주세요.");
      return;
    }
    // 숫자 값이 필요한 조건에 값이 없으면 오류
    const missingValue = form.conditions.find((c) => {
      const meta = getConditionMeta(c.type);
      return meta.hasValue && (c.value === undefined || c.value === null);
    });
    if (missingValue) {
      toast.error("모든 조건에 값을 입력해주세요.");
      return;
    }
    onSubmit(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Bell className="h-4 w-4" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* 규칙 이름 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">규칙 이름</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="규칙 이름을 입력하세요"
              className="h-8 text-xs"
            />
          </div>

          {/* 조건 목록 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">조건 설정</Label>
              <span className="text-[10px] text-muted-foreground">
                여러 조건은 AND로 결합됩니다
              </span>
            </div>
            <div className="space-y-2">
              {form.conditions.map((cond, idx) => (
                <ConditionRow
                  key={idx}
                  condition={cond}
                  index={idx}
                  canDelete={form.conditions.length > 1}
                  onChange={handleConditionChange}
                  onDelete={handleConditionDelete}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs w-full mt-1"
              onClick={handleAddCondition}
            >
              <Plus className="h-3 w-3 mr-1" />
              조건 추가
            </Button>
          </div>

          {/* 액션 (현재는 in-app 고정) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">액션</Label>
            <div className="flex items-center gap-2 rounded-md border px-3 py-2 bg-muted/30">
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">인앱 알림 생성</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 규칙 행 컴포넌트
// ============================================

type RuleRowProps = {
  rule: NotificationRule;
  onToggle: (id: string) => void;
  onEdit: (rule: NotificationRule) => void;
  onDelete: (id: string) => void;
};

function RuleRow({ rule, onToggle, onEdit, onDelete }: RuleRowProps) {
  return (
    <div
      className={`flex items-start gap-3 py-2.5 px-2 rounded-md transition-colors ${
        rule.enabled ? "hover:bg-muted/40" : "opacity-60 hover:bg-muted/20"
      }`}
    >
      {/* Switch */}
      <Switch
        checked={rule.enabled}
        onCheckedChange={() => onToggle(rule.id)}
        className="flex-shrink-0 mt-0.5"
      />

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium leading-tight">{rule.name}</span>
          {rule.isDefault && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 bg-indigo-100 text-indigo-700"
            >
              기본
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {rule.conditions.map((cond, idx) => {
            const meta = getConditionMeta(cond.type);
            const Icon = meta.icon;
            return (
              <span
                key={idx}
                className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${meta.badgeColor}`}
              >
                <Icon className="h-2.5 w-2.5" />
                {meta.hasValue
                  ? `${meta.label} ${cond.value ?? "?"}${meta.valueUnit ?? ""}`
                  : meta.label}
              </span>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
          액션: 인앱 알림 생성
        </p>
      </div>

      {/* 수정/삭제 버튼 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {!rule.isDefault && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(rule)}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(rule.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function NotificationRulesBuilder({
  groupId,
}: NotificationRulesBuilderProps) {
  const { rules, addRule, updateRule, deleteRule, toggleRule } =
    useNotificationRules(groupId);

  // 추가 다이얼로그 상태
  const [addOpen, setAddOpen] = useState(false);
  // 수정 대상 규칙
  const [editTarget, setEditTarget] = useState<NotificationRule | null>(null);

  const handleAdd = (form: RuleFormState) => {
    addRule({
      name: form.name,
      conditions: form.conditions,
    });
    toast.success("알림 규칙이 추가되었습니다.");
  };

  const handleEdit = (form: RuleFormState) => {
    if (!editTarget) return;
    updateRule(editTarget.id, {
      name: form.name,
      conditions: form.conditions,
    });
    toast.success("알림 규칙이 수정되었습니다.");
    setEditTarget(null);
  };

  const handleDelete = (id: string) => {
    const success = deleteRule(id);
    if (success) {
      toast.success("알림 규칙이 삭제되었습니다.");
    } else {
      toast.error("기본 규칙은 삭제할 수 없습니다.");
    }
  };

  const handleToggle = (id: string) => {
    toggleRule(id);
  };

  const enabledCount = rules.filter((r) => r.enabled).length;

  return (
    <>
      {/* 추가 다이얼로그 */}
      <RuleEditDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="새 알림 규칙 추가"
        submitLabel="추가"
        onSubmit={handleAdd}
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <RuleEditDialog
          open={!!editTarget}
          onOpenChange={(val) => {
            if (!val) setEditTarget(null);
          }}
          initialForm={ruleToFormState(editTarget)}
          title="알림 규칙 수정"
          submitLabel="저장"
          onSubmit={handleEdit}
        />
      )}

      {/* 메인 카드 영역 */}
      <div className="rounded-lg border bg-card shadow-sm">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-md p-1.5 bg-primary/10">
              <Bell className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-semibold leading-tight">
                알림 규칙 빌더
              </h3>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                {enabledCount}개 규칙 활성 / 전체 {rules.length}개
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            규칙 추가
          </Button>
        </div>

        {/* 규칙 목록 */}
        <div className="px-2 py-1">
          {rules.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              등록된 알림 규칙이 없습니다.
            </div>
          ) : (
            <div className="divide-y">
              {rules.map((rule, idx) => (
                <div key={rule.id}>
                  {idx > 0 && <Separator className="mx-2 my-0" />}
                  <RuleRow
                    rule={rule}
                    onToggle={handleToggle}
                    onEdit={(r) => setEditTarget(r)}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 도움말 푸터 */}
        <div className="px-4 py-2 border-t bg-muted/20">
          <p className="text-[11px] text-muted-foreground">
            기본 규칙은 이름/조건 수정이 불가합니다. 활성화 상태는 변경할 수 있습니다.
          </p>
        </div>
      </div>
    </>
  );
}
