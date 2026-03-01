"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Plus, Trash2, Calculator, Users, Percent, Pencil } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  useSplitPresets,
  RULE_TYPE_LABELS,
  applyPresetCalc,
  type ApplyPresetMember,
  type ApplyPresetResult,
} from "@/hooks/use-split-presets";
import type { SplitPreset, SplitRuleType, GroupMemberWithProfile } from "@/types";

// ============================================
// 타입
// ============================================

type SplitPresetManagerProps = {
  groupId: string;
  groupMembers: GroupMemberWithProfile[];
  nicknameMap: Record<string, string>;
  canEdit: boolean;
};

// ============================================
// 규칙 타입별 배지 색상
// ============================================

function RuleTypeBadge({ ruleType }: { ruleType: SplitRuleType }) {
  const colorMap: Record<SplitRuleType, string> = {
    equal: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/40",
    by_role: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/40",
    by_attendance: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/40",
    custom_ratio: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/40",
  };

  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 h-4 font-normal ${colorMap[ruleType]}`}
    >
      {RULE_TYPE_LABELS[ruleType]}
    </Badge>
  );
}

// ============================================
// 역할 한글 레이블
// ============================================

const ROLE_LABELS: Record<string, string> = {
  leader: "리더",
  sub_leader: "서브리더",
  member: "멤버",
};

const ROLE_KEYS = ["leader", "sub_leader", "member"] as const;

// ============================================
// 기본 출석률 구간
// ============================================

const DEFAULT_ATTENDANCE_THRESHOLDS = [
  { minRate: 90, ratio: 80 },
  { minRate: 70, ratio: 100 },
  { minRate: 50, ratio: 120 },
  { minRate: 0, ratio: 150 },
];

// ============================================
// 프리셋 생성/수정 다이얼로그
// ============================================

type PresetFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: SplitPreset | null;
  onSave: (
    name: string,
    ruleType: SplitRuleType,
    config: SplitPreset["config"]
  ) => void;
};

function PresetFormDialog({ open, onOpenChange, initial, onSave }: PresetFormDialogProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [ruleType, setRuleType] = useState<SplitRuleType>(initial?.ruleType ?? "equal");

  // by_role 설정
  const [roleRatios, setRoleRatios] = useState<Record<string, number>>(
    initial?.config.roleRatios ?? { leader: 0, sub_leader: 50, member: 100 }
  );

  // by_attendance 설정
  const [attendanceThresholds, setAttendanceThresholds] = useState(
    initial?.config.attendanceThresholds ?? DEFAULT_ATTENDANCE_THRESHOLDS
  );

  const handleRoleRatioChange = (role: string, value: string) => {
    const num = parseInt(value, 10);
    setRoleRatios((prev) => ({
      ...prev,
      [role]: isNaN(num) ? 0 : Math.min(999, Math.max(0, num)),
    }));
  };

  const handleThresholdChange = (
    idx: number,
    field: "minRate" | "ratio",
    value: string
  ) => {
    const num = parseInt(value, 10);
    setAttendanceThresholds((prev) =>
      prev.map((t, i) =>
        i === idx
          ? { ...t, [field]: isNaN(num) ? 0 : Math.min(999, Math.max(0, num)) }
          : t
      )
    );
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(TOAST.FINANCE.PRESET_NAME_REQUIRED);
      return;
    }

    const config: SplitPreset["config"] = {};
    if (ruleType === "by_role") {
      config.roleRatios = roleRatios;
    } else if (ruleType === "by_attendance") {
      config.attendanceThresholds = attendanceThresholds;
    }

    onSave(trimmed, ruleType, config);
    onOpenChange(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      // 닫힐 때 초기화
      setName(initial?.name ?? "");
      setRuleType(initial?.ruleType ?? "equal");
      setRoleRatios(initial?.config.roleRatios ?? { leader: 0, sub_leader: 50, member: 100 });
      setAttendanceThresholds(
        initial?.config.attendanceThresholds ?? DEFAULT_ATTENDANCE_THRESHOLDS
      );
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {initial ? "프리셋 수정" : "프리셋 생성"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 이름 */}
          <div className="space-y-1.5">
            <Label className="text-xs">프리셋 이름 *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 리더 할인 정책"
              className="h-8 text-xs"
            />
          </div>

          {/* 규칙 타입 */}
          <div className="space-y-1.5">
            <Label className="text-xs">분담 규칙</Label>
            <Select
              value={ruleType}
              onValueChange={(v) => setRuleType(v as SplitRuleType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RULE_TYPE_LABELS) as SplitRuleType[]).map((rt) => (
                  <SelectItem key={rt} value={rt} className="text-xs">
                    {RULE_TYPE_LABELS[rt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 규칙별 상세 설정 */}
          {ruleType === "equal" && (
            <div className="rounded-md bg-muted/40 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">
                모든 멤버에게 총액을 균등하게 나눕니다. 별도 설정이 필요 없습니다.
              </p>
            </div>
          )}

          {ruleType === "by_role" && (
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Percent className="h-3 w-3" />
                역할별 부담 비율
              </Label>
              <p className="text-[11px] text-muted-foreground">
                비율의 상대적 비중으로 배분됩니다. (0 = 면제)
              </p>
              {ROLE_KEYS.map((role) => (
                <div key={role} className="flex items-center gap-2">
                  <span className="text-xs w-16 shrink-0 text-muted-foreground">
                    {ROLE_LABELS[role]}
                  </span>
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      type="number"
                      min={0}
                      max={999}
                      value={roleRatios[role] ?? 100}
                      onChange={(e) => handleRoleRatioChange(role, e.target.value)}
                      className="h-7 text-xs"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {ruleType === "by_attendance" && (
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Percent className="h-3 w-3" />
                출석률 구간별 분담 비율
              </Label>
              <p className="text-[11px] text-muted-foreground">
                각 구간의 최소 출석률과 부담 비율을 설정하세요.
              </p>
              <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-x-2 gap-y-1.5 items-center">
                <span className="text-[11px] text-muted-foreground">최소 출석률</span>
                <span />
                <span className="text-[11px] text-muted-foreground">부담 비율</span>
                <span />
                {attendanceThresholds.map((t, idx) => (
                  <>
                    <div key={`min-${idx}`} className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={t.minRate}
                        onChange={(e) => handleThresholdChange(idx, "minRate", e.target.value)}
                        className="h-7 text-xs"
                        disabled={idx === attendanceThresholds.length - 1}
                      />
                      <span className="text-xs text-muted-foreground shrink-0">%+</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground text-center">→</span>
                    <div key={`ratio-${idx}`} className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={999}
                        value={t.ratio}
                        onChange={(e) => handleThresholdChange(idx, "ratio", e.target.value)}
                        className="h-7 text-xs"
                      />
                      <span className="text-xs text-muted-foreground shrink-0">%</span>
                    </div>
                    <span key={`desc-${idx}`} />
                  </>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/70">
                마지막 행(0%+)은 그 외 모든 경우에 적용됩니다.
              </p>
            </div>
          )}

          {ruleType === "custom_ratio" && (
            <div className="rounded-md bg-muted/40 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">
                프리셋 적용 시 시뮬레이션 섹션에서 멤버별 비율을 직접 입력할 수 있습니다.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleOpenChange(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            {initial ? "수정" : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 시뮬레이션 섹션
// ============================================

type SimulationSectionProps = {
  preset: SplitPreset;
  groupMembers: GroupMemberWithProfile[];
  nicknameMap: Record<string, string>;
};

function SimulationSection({ preset, groupMembers, nicknameMap }: SimulationSectionProps) {
  const [totalAmount, setTotalAmount] = useState("");
  const [customRatios, setCustomRatios] = useState<Record<string, number>>({});
  const [results, setResults] = useState<ApplyPresetResult[] | null>(null);

  const parsedAmount = parseInt(totalAmount.replace(/[^0-9]/g, ""), 10) || 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setTotalAmount(raw ? parseInt(raw, 10).toLocaleString("ko-KR") : "");
    setResults(null);
  };

  const handleSimulate = () => {
    if (parsedAmount <= 0) {
      toast.error(TOAST.FINANCE.PRESET_AMOUNT_REQUIRED);
      return;
    }

    const members: ApplyPresetMember[] = groupMembers.map((m) => ({
      userId: m.user_id,
      name: nicknameMap[m.user_id] || m.profiles.name,
      role: m.role,
      attendanceRate: 100, // 기본값; 실제 출석률은 미조회
    }));

    // custom_ratio는 직접 입력한 customRatios 사용
    const effectivePreset: SplitPreset =
      preset.ruleType === "custom_ratio"
        ? { ...preset, config: { customRatios } }
        : preset;

    const calc = applyPresetCalc(effectivePreset, members, parsedAmount);
    setResults(calc);
  };

  const handleCustomRatioChange = (userId: string, value: string) => {
    const num = parseInt(value, 10);
    setCustomRatios((prev) => ({
      ...prev,
      [userId]: isNaN(num) ? 0 : Math.max(0, num),
    }));
    setResults(null);
  };

  return (
    <div className="space-y-3 mt-4 pt-4 border-t">
      <h4 className="text-xs font-medium flex items-center gap-1.5">
        <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
        시뮬레이션
      </h4>

      {/* 총액 입력 */}
      <div className="space-y-1.5">
        <Label className="text-xs">총액</Label>
        <div className="relative">
          <Input
            value={totalAmount}
            onChange={handleAmountChange}
            placeholder="0"
            className="h-8 text-xs pr-6"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
            원
          </span>
        </div>
      </div>

      {/* 수동 비율 입력 (custom_ratio만) */}
      {preset.ruleType === "custom_ratio" && (
        <div className="space-y-1.5">
          <Label className="text-xs">멤버별 비율</Label>
          <div className="rounded-md border divide-y">
            {groupMembers.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center gap-2 px-3 py-2"
              >
                <span className="text-xs flex-1 truncate">
                  {nicknameMap[m.user_id] || m.profiles.name}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <Input
                    type="number"
                    min={0}
                    value={customRatios[m.user_id] ?? 100}
                    onChange={(e) =>
                      handleCustomRatioChange(m.user_id, e.target.value)
                    }
                    className="h-7 text-xs w-16"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* by_attendance: 출석률 안내 */}
      {preset.ruleType === "by_attendance" && (
        <p className="text-[11px] text-muted-foreground bg-orange-50 dark:bg-orange-950/20 rounded-md px-3 py-2 border border-orange-100 dark:border-orange-900/40">
          시뮬레이션에서는 모든 멤버의 출석률을 100%로 가정합니다.
          실제 적용 시 출석 데이터를 기준으로 계산됩니다.
        </p>
      )}

      <Button
        size="sm"
        className="h-7 text-xs w-full gap-1"
        onClick={handleSimulate}
      >
        <Calculator className="h-3 w-3" />
        시뮬레이션 실행
      </Button>

      {/* 결과 테이블 */}
      {results && (
        <div className="rounded-md border overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] text-[10px] font-medium text-muted-foreground bg-muted/40 px-3 py-1.5 border-b">
            <span>이름</span>
            <span className="text-center mr-4">역할</span>
            <span>분담금</span>
          </div>
          <div className="divide-y">
            {results.map((r) => (
              <div
                key={r.userId}
                className="grid grid-cols-[1fr_auto_auto] items-center px-3 py-2"
              >
                <span className="text-xs truncate">{r.name}</span>
                <span className="text-[10px] text-muted-foreground mr-4">
                  {ROLE_LABELS[r.role]}
                </span>
                <span className="text-xs font-medium tabular-nums text-right">
                  {r.amount.toLocaleString("ko-KR")}원
                </span>
              </div>
            ))}
          </div>
          {/* 합계 */}
          <div className="grid grid-cols-[1fr_auto] items-center px-3 py-1.5 border-t bg-muted/30">
            <span className="text-[11px] font-medium text-muted-foreground">합계</span>
            <span className="text-xs font-semibold tabular-nums text-right">
              {results
                .reduce((s, r) => s + r.amount, 0)
                .toLocaleString("ko-KR")}
              원
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function SplitPresetManager({
  groupId,
  groupMembers,
  nicknameMap,
  canEdit,
}: SplitPresetManagerProps) {
  const { presets, createPreset, updatePreset, deletePreset } =
    useSplitPresets(groupId);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<SplitPreset | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const _selectedPreset = presets.find((p) => p.id === selectedPresetId) ?? null;

  const handleCreate = (
    name: string,
    ruleType: SplitRuleType,
    config: SplitPreset["config"]
  ) => {
    createPreset(name, ruleType, config);
    toast.success(TOAST.FINANCE.PRESET_CREATED);
  };

  const handleUpdate = (
    name: string,
    ruleType: SplitRuleType,
    config: SplitPreset["config"]
  ) => {
    if (!editingPreset) return;
    updatePreset(editingPreset.id, { name, ruleType, config });
    toast.success(TOAST.FINANCE.PRESET_UPDATED);
    setEditingPreset(null);
  };

  const handleDelete = (id: string) => {
    deletePreset(id);
    if (selectedPresetId === id) setSelectedPresetId(null);
    toast.success(TOAST.FINANCE.PRESET_DELETED);
  };

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            aria-label="분담 프리셋 관리"
          >
            <Settings className="h-3 w-3" />
            분담 프리셋
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className="w-full sm:max-w-md p-4 overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-sm flex items-center gap-1.5">
              <Settings className="h-4 w-4" />
              회비 분담 프리셋
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-3">
            {/* 프리셋 생성 버튼 */}
            {canEdit && (
              <Button
                size="sm"
                className="h-7 text-xs gap-1 w-full"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-3 w-3" />
                새 프리셋 만들기
              </Button>
            )}

            {/* 멤버 수 안내 */}
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              현재 멤버 {groupMembers.length}명 기준으로 시뮬레이션합니다.
            </p>

            {/* 프리셋 목록 */}
            {presets.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                저장된 프리셋이 없습니다.
                <br />
                자주 사용하는 분담 규칙을 등록해보세요.
              </div>
            ) : (
              <div className="space-y-2">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className={`rounded-lg border overflow-hidden transition-colors cursor-pointer ${
                      selectedPresetId === preset.id
                        ? "border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/10"
                        : "hover:bg-muted/30"
                    }`}
                    onClick={() =>
                      setSelectedPresetId((prev) =>
                        prev === preset.id ? null : preset.id
                      )
                    }
                  >
                    {/* 프리셋 헤더 */}
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium truncate">
                          {preset.name}
                        </span>
                        <RuleTypeBadge ruleType={preset.ruleType} />
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPreset(preset);
                            }}
                            aria-label="프리셋 수정"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(preset.id);
                            }}
                            aria-label="프리셋 삭제"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* 규칙 상세 미리보기 */}
                    {preset.ruleType === "by_role" &&
                      preset.config.roleRatios && (
                        <div className="px-3 pb-2 flex gap-3">
                          {ROLE_KEYS.map((role) => (
                            <span
                              key={role}
                              className="text-[10px] text-muted-foreground"
                            >
                              {ROLE_LABELS[role]}{" "}
                              <span className="font-medium text-foreground">
                                {preset.config.roleRatios?.[role] ?? 100}%
                              </span>
                            </span>
                          ))}
                        </div>
                      )}

                    {preset.ruleType === "by_attendance" &&
                      preset.config.attendanceThresholds && (
                        <div className="px-3 pb-2 flex flex-wrap gap-2">
                          {preset.config.attendanceThresholds.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] text-muted-foreground"
                            >
                              {t.minRate}%+{" "}
                              <span className="font-medium text-foreground">
                                {t.ratio}%
                              </span>
                            </span>
                          ))}
                        </div>
                      )}

                    {/* 선택된 프리셋 시뮬레이션 */}
                    {selectedPresetId === preset.id && (
                      <div
                        className="px-3 pb-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SimulationSection
                          preset={preset}
                          groupMembers={groupMembers}
                          nicknameMap={nicknameMap}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 생성 다이얼로그 */}
      <PresetFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSave={handleCreate}
      />

      {/* 수정 다이얼로그 */}
      <PresetFormDialog
        open={!!editingPreset}
        onOpenChange={(v) => {
          if (!v) setEditingPreset(null);
        }}
        initial={editingPreset}
        onSave={handleUpdate}
      />
    </>
  );
}
