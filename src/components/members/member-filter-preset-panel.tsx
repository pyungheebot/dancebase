"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Filter, Save, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  useMemberFilterPresets,
  EMPTY_FILTER_CONDITION,
  countActiveFilters,
} from "@/hooks/use-member-filter-presets";
import type { MemberFilterCondition, MemberFilterRole, MemberActivityStatus } from "@/types";

// ============================================
// 상수
// ============================================

const ROLE_OPTIONS: { value: MemberFilterRole; label: string }[] = [
  { value: "leader", label: "리더" },
  { value: "sub_leader", label: "서브리더" },
  { value: "member", label: "멤버" },
];

const JOIN_PERIOD_OPTIONS: { value: string; label: string; days: number | null }[] = [
  { value: "all", label: "전체", days: null },
  { value: "7", label: "최근 7일", days: 7 },
  { value: "30", label: "최근 30일", days: 30 },
  { value: "90", label: "최근 90일", days: 90 },
];

const ATTENDANCE_RANGE_OPTIONS: {
  value: string;
  label: string;
  min: number | null;
  max: number | null;
}[] = [
  { value: "all", label: "전체", min: null, max: null },
  { value: "90plus", label: "90% 이상", min: 90, max: null },
  { value: "70-89", label: "70~89%", min: 70, max: 89 },
  { value: "50-69", label: "50~69%", min: 50, max: 69 },
  { value: "below50", label: "50% 미만", min: null, max: 49 },
];

const ACTIVITY_STATUS_OPTIONS: { value: MemberActivityStatus; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "active", label: "활동" },
  { value: "inactive", label: "비활동" },
];

// ============================================
// 가입 시기 Select 값 → joinedAfter 날짜 계산
// ============================================

function getJoinedAfterFromDays(days: number | null): string | null {
  if (days === null) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

// ============================================
// 출석률 범위 Select 값 → option 찾기
// ============================================

function getAttendanceOptionValue(
  minRate: number | null,
  maxRate: number | null
): string {
  if (minRate === null && maxRate === null) return "all";
  if (minRate === 90 && maxRate === null) return "90plus";
  if (minRate === 70 && maxRate === 89) return "70-89";
  if (minRate === 50 && maxRate === 69) return "50-69";
  if (minRate === null && maxRate === 49) return "below50";
  return "all";
}

// ============================================
// Props
// ============================================

type MemberFilterPresetPanelProps = {
  groupId: string;
  activeFilters: MemberFilterCondition;
  onApply: (filters: MemberFilterCondition) => void;
  onReset: () => void;
};

// ============================================
// 컴포넌트
// ============================================

export function MemberFilterPresetPanel({
  groupId,
  activeFilters,
  onApply,
  onReset,
}: MemberFilterPresetPanelProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<MemberFilterCondition>(activeFilters);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [saveNameInput, setSaveNameInput] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  const { presets, savePreset, deletePreset } = useMemberFilterPresets(groupId);

  const activeCount = countActiveFilters(activeFilters);

  // Popover 열릴 때 현재 활성 필터로 로컬 상태 동기화
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setLocalFilters(activeFilters);
      setSelectedPresetId("");
      setShowSaveInput(false);
      setSaveNameInput("");
    }
    setOpen(v);
  };

  // ---- 역할 토글 ----
  const handleToggleRole = (role: MemberFilterRole) => {
    setLocalFilters((prev) => {
      const already = prev.role.includes(role);
      return {
        ...prev,
        role: already ? prev.role.filter((r) => r !== role) : [...prev.role, role],
      };
    });
    setSelectedPresetId("");
  };

  // ---- 가입 시기 Select ----
  const handleJoinPeriodChange = (value: string) => {
    const option = JOIN_PERIOD_OPTIONS.find((o) => o.value === value);
    if (!option) return;
    setLocalFilters((prev) => ({
      ...prev,
      joinedAfter: getJoinedAfterFromDays(option.days),
      joinedBefore: null,
    }));
    setSelectedPresetId("");
  };

  const currentJoinPeriodValue = (() => {
    if (!localFilters.joinedAfter) return "all";
    const today = new Date();
    const afterDate = new Date(localFilters.joinedAfter);
    const diffDays = Math.round(
      (today.getTime() - afterDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 7) return "7";
    if (diffDays <= 30) return "30";
    if (diffDays <= 90) return "90";
    return "all";
  })();

  // ---- 출석률 범위 Select ----
  const handleAttendanceRangeChange = (value: string) => {
    const option = ATTENDANCE_RANGE_OPTIONS.find((o) => o.value === value);
    if (!option) return;
    setLocalFilters((prev) => ({
      ...prev,
      minAttendanceRate: option.min,
      maxAttendanceRate: option.max,
    }));
    setSelectedPresetId("");
  };

  const currentAttendanceValue = getAttendanceOptionValue(
    localFilters.minAttendanceRate,
    localFilters.maxAttendanceRate
  );

  // ---- 활동 상태 라디오 ----
  const handleActivityStatusChange = (value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      activityStatus: value as MemberActivityStatus,
    }));
    setSelectedPresetId("");
  };

  // ---- 프리셋 선택 ----
  const handlePresetSelect = (id: string) => {
    setSelectedPresetId(id);
    const preset = presets.find((p) => p.id === id);
    if (preset) {
      setLocalFilters({ ...preset.filters });
    }
  };

  // ---- 프리셋 삭제 ----
  const handleDeletePreset = () => {
    if (!selectedPresetId) return;
    const preset = presets.find((p) => p.id === selectedPresetId);
    if (!preset) return;
    if (preset.isDefault) {
      toast.error(TOAST.MEMBERS.PRESET_DEFAULT_DELETE_ERROR);
      return;
    }
    const result = deletePreset(selectedPresetId);
    if (result) {
      toast.success(TOAST.MEMBERS.PRESET_DELETED);
      setSelectedPresetId("");
    }
  };

  // ---- 현재 필터 저장 ----
  const handleSavePreset = () => {
    const trimmed = saveNameInput.trim();
    if (!trimmed) {
      toast.error(TOAST.MEMBERS.PRESET_NAME_REQUIRED);
      return;
    }
    savePreset(trimmed, localFilters);
    toast.success(`"${trimmed}" 프리셋이 저장되었습니다`);
    setSaveNameInput("");
    setShowSaveInput(false);
  };

  // ---- 필터 적용 ----
  const handleApply = () => {
    onApply(localFilters);
    setOpen(false);
  };

  // ---- 필터 초기화 ----
  const handleReset = () => {
    setLocalFilters(EMPTY_FILTER_CONDITION);
    setSelectedPresetId("");
    onReset();
  };

  const localActiveCount = countActiveFilters(localFilters);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2 relative shrink-0 gap-1"
          aria-label="멤버 필터 프리셋"
        >
          <Filter className="h-3 w-3" />
          필터
          {activeCount > 0 && (
            <Badge className="ml-0.5 h-4 min-w-4 px-1 text-[10px] leading-none">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-72 p-3 space-y-3"
        sideOffset={4}
      >
        {/* ---- 프리셋 선택 영역 ---- */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium">프리셋</p>
          <div className="flex items-center gap-1.5">
            <Select
              value={selectedPresetId}
              onValueChange={handlePresetSelect}
            >
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="프리셋 선택..." />
              </SelectTrigger>
              <SelectContent>
                {presets.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      {p.name}
                      {p.isDefault && (
                        <span className="text-[10px] text-muted-foreground">(기본)</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
              onClick={handleDeletePreset}
              disabled={
                !selectedPresetId ||
                presets.find((p) => p.id === selectedPresetId)?.isDefault === true
              }
              aria-label="프리셋 삭제"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* ---- 역할 필터 ---- */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium">역할</p>
          <div className="space-y-1">
            {ROLE_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  id={`preset-role-${opt.value}`}
                  checked={localFilters.role.includes(opt.value)}
                  onCheckedChange={() => handleToggleRole(opt.value)}
                  className="h-3.5 w-3.5"
                />
                <Label
                  htmlFor={`preset-role-${opt.value}`}
                  className="text-xs cursor-pointer leading-none"
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* ---- 가입 시기 ---- */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium">가입 시기</p>
          <Select
            value={currentJoinPeriodValue}
            onValueChange={handleJoinPeriodChange}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOIN_PERIOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ---- 출석률 범위 ---- */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium">출석률</p>
          <Select
            value={currentAttendanceValue}
            onValueChange={handleAttendanceRangeChange}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ATTENDANCE_RANGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ---- 활동 상태 ---- */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium">활동 상태</p>
          <RadioGroup
            value={localFilters.activityStatus}
            onValueChange={handleActivityStatusChange}
            className="flex gap-3"
          >
            {ACTIVITY_STATUS_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center gap-1.5">
                <RadioGroupItem
                  id={`preset-status-${opt.value}`}
                  value={opt.value}
                  className="h-3.5 w-3.5"
                />
                <Label
                  htmlFor={`preset-status-${opt.value}`}
                  className="text-xs cursor-pointer"
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* ---- 현재 필터 저장 ---- */}
        {showSaveInput ? (
          <div className="space-y-1.5">
            <p className="text-xs font-medium flex items-center gap-1">
              <Save className="h-3 w-3" />
              프리셋 이름
            </p>
            <div className="flex items-center gap-1.5">
              <Input
                value={saveNameInput}
                onChange={(e) => setSaveNameInput(e.target.value)}
                placeholder="예: 활발한 리더진"
                className="h-7 text-xs flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSavePreset();
                  if (e.key === "Escape") setShowSaveInput(false);
                }}
                autoFocus
              />
              <Button
                size="sm"
                className="h-7 text-xs px-2 shrink-0"
                onClick={handleSavePreset}
              >
                저장
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 shrink-0"
                onClick={() => setShowSaveInput(false)}
              >
                취소
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full gap-1"
            onClick={() => setShowSaveInput(true)}
            disabled={localActiveCount === 0}
          >
            <Save className="h-3 w-3" />
            현재 필터 저장
          </Button>
        )}

        {/* ---- 적용 / 초기화 버튼 ---- */}
        <div className="flex items-center gap-2 pt-1 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs flex-1 gap-1"
            onClick={handleReset}
            disabled={activeCount === 0 && localActiveCount === 0}
          >
            <RotateCcw className="h-3 w-3" />
            초기화
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={handleApply}
          >
            필터 적용
            {localActiveCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-4 min-w-4 px-1 text-[10px] leading-none"
              >
                {localActiveCount}
              </Badge>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
