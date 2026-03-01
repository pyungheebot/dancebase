"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  Bone,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Activity,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useInjuryLog } from "@/hooks/use-injury-log";
import type {
  DanceInjuryEntry,
  DanceInjuryBodyPart,
  DanceInjuryType,
  DanceInjurySeverity,
  DanceInjuryRehabStatus,
} from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================================
// 레이블 & 색상 상수
// ============================================================

const BODY_PART_LABELS: Record<DanceInjuryBodyPart, string> = {
  shoulder: "어깨",
  knee: "무릎",
  ankle: "발목",
  waist: "허리",
  wrist: "손목",
  neck: "목",
  hip: "고관절",
  elbow: "팔꿈치",
  foot: "발",
  other: "기타",
};

const INJURY_TYPE_LABELS: Record<DanceInjuryType, string> = {
  muscle_pain: "근육통",
  ligament: "인대 손상",
  fracture: "골절",
  dislocation: "탈구",
  bruise: "타박상",
  sprain: "염좌",
  tendinitis: "건염",
  other: "기타",
};

const SEVERITY_LABELS: Record<DanceInjurySeverity, string> = {
  mild: "경미",
  moderate: "보통",
  severe: "심각",
};

const SEVERITY_COLORS: Record<DanceInjurySeverity, string> = {
  mild: "bg-yellow-100 text-yellow-700 border-yellow-200",
  moderate: "bg-orange-100 text-orange-700 border-orange-200",
  severe: "bg-red-100 text-red-700 border-red-200",
};

const REHAB_STATUS_LABELS: Record<DanceInjuryRehabStatus, string> = {
  in_progress: "재활중",
  recovered: "완치",
  chronic: "만성",
};

const REHAB_STATUS_COLORS: Record<DanceInjuryRehabStatus, string> = {
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  recovered: "bg-green-100 text-green-700 border-green-200",
  chronic: "bg-purple-100 text-purple-700 border-purple-200",
};

// ============================================================
// 날짜 포맷 유틸
// ============================================================

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ============================================================
// 폼 타입 & 초기값
// ============================================================

type InjuryFormData = {
  bodyPart: DanceInjuryBodyPart | "";
  injuryType: DanceInjuryType | "";
  severity: DanceInjurySeverity | "";
  injuredAt: string;
  expectedRecoveryAt: string;
  rehabStatus: DanceInjuryRehabStatus;
  treatmentNote: string;
};

const EMPTY_FORM: InjuryFormData = {
  bodyPart: "",
  injuryType: "",
  severity: "",
  injuredAt: todayString(),
  expectedRecoveryAt: "",
  rehabStatus: "in_progress",
  treatmentNote: "",
};

// ============================================================
// 부상 추가/수정 다이얼로그
// ============================================================

type InjuryFormDialogProps = {
  open: boolean;
  initialData?: DanceInjuryEntry | null;
  onClose: () => void;
  onSubmit: (data: InjuryFormData) => void;
};

function InjuryFormDialog({
  open,
  initialData,
  onClose,
  onSubmit,
}: InjuryFormDialogProps) {
  const isEdit = !!initialData;

  const [form, setForm] = useState<InjuryFormData>(() =>
    initialData
      ? {
          bodyPart: initialData.bodyPart,
          injuryType: initialData.injuryType,
          severity: initialData.severity,
          injuredAt: initialData.injuredAt,
          expectedRecoveryAt: initialData.expectedRecoveryAt ?? "",
          rehabStatus: initialData.rehabStatus,
          treatmentNote: initialData.treatmentNote,
        }
      : { ...EMPTY_FORM, injuredAt: todayString() }
  );

  function handleChange<K extends keyof InjuryFormData>(
    field: K,
    value: InjuryFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    if (!form.bodyPart) {
      toast.error(TOAST.MEMBERS.INJURY_LOG_PART_REQUIRED);
      return;
    }
    if (!form.injuryType) {
      toast.error(TOAST.MEMBERS.INJURY_LOG_TYPE_REQUIRED);
      return;
    }
    if (!form.severity) {
      toast.error(TOAST.MEMBERS.INJURY_LOG_SEVERITY_REQUIRED);
      return;
    }
    if (!form.injuredAt) {
      toast.error(TOAST.MEMBERS.INJURY_LOG_DATE_REQUIRED);
      return;
    }
    onSubmit(form);
  }

  function handleClose() {
    if (!isEdit) {
      setForm({ ...EMPTY_FORM, injuredAt: todayString() });
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Bone className="h-4 w-4 text-red-500" />
            {isEdit ? "부상 기록 수정" : "부상 기록 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 부상 부위 */}
          <div className="space-y-1">
            <Label className="text-xs">부상 부위 *</Label>
            <Select
              value={form.bodyPart}
              onValueChange={(v) =>
                handleChange("bodyPart", v as DanceInjuryBodyPart)
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="부위 선택" />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(BODY_PART_LABELS) as [
                    DanceInjuryBodyPart,
                    string
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 부상 유형 */}
          <div className="space-y-1">
            <Label className="text-xs">부상 유형 *</Label>
            <Select
              value={form.injuryType}
              onValueChange={(v) =>
                handleChange("injuryType", v as DanceInjuryType)
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="유형 선택" />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(INJURY_TYPE_LABELS) as [
                    DanceInjuryType,
                    string
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 심각도 */}
          <div className="space-y-1">
            <Label className="text-xs">심각도 *</Label>
            <Select
              value={form.severity}
              onValueChange={(v) =>
                handleChange("severity", v as DanceInjurySeverity)
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="심각도 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mild" className="text-xs">
                  경미 - 가벼운 불편함
                </SelectItem>
                <SelectItem value="moderate" className="text-xs">
                  보통 - 활동 주의 필요
                </SelectItem>
                <SelectItem value="severe" className="text-xs">
                  심각 - 활동 제한
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 부상 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs">부상 날짜 *</Label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={form.injuredAt}
              onChange={(e) => handleChange("injuredAt", e.target.value)}
            />
          </div>

          {/* 예상 회복일 */}
          <div className="space-y-1">
            <Label className="text-xs">예상 회복일</Label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={form.expectedRecoveryAt}
              onChange={(e) =>
                handleChange("expectedRecoveryAt", e.target.value)
              }
            />
          </div>

          {/* 재활 상태 */}
          <div className="space-y-1">
            <Label className="text-xs">재활 상태</Label>
            <Select
              value={form.rehabStatus}
              onValueChange={(v) =>
                handleChange("rehabStatus", v as DanceInjuryRehabStatus)
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_progress" className="text-xs">
                  재활 진행중
                </SelectItem>
                <SelectItem value="recovered" className="text-xs">
                  완치
                </SelectItem>
                <SelectItem value="chronic" className="text-xs">
                  만성 부상
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 치료 내용 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">치료 내용 메모</Label>
            <Textarea
              placeholder="치료 방법, 병원 방문 내역, 주의사항 등"
              className="text-xs min-h-[70px] resize-none"
              value={form.treatmentNote}
              onChange={(e) => handleChange("treatmentNote", e.target.value)}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs flex-1"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs flex-1"
              onClick={handleSubmit}
            >
              {isEdit ? "저장" : "등록"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 통계 섹션
// ============================================================

type StatsSectionProps = {
  stats: ReturnType<typeof useInjuryLog>["stats"];
};

function StatsSection({ stats }: StatsSectionProps) {
  const bodyPartEntries = (
    Object.entries(stats.bodyPartFrequency) as [DanceInjuryBodyPart, number][]
  ).sort((a, b) => b[1] - a[1]);

  const maxCount = bodyPartEntries.length > 0 ? bodyPartEntries[0][1] : 1;

  return (
    <div className="space-y-3">
      {/* 상태별 요약 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center bg-blue-50 rounded-lg p-2">
          <p className="text-base font-bold text-blue-600">
            {stats.activeCount}
          </p>
          <p className="text-[10px] text-blue-500">재활중</p>
        </div>
        <div className="text-center bg-green-50 rounded-lg p-2">
          <p className="text-base font-bold text-green-600">
            {stats.recoveredCount}
          </p>
          <p className="text-[10px] text-green-500">완치</p>
        </div>
        <div className="text-center bg-purple-50 rounded-lg p-2">
          <p className="text-base font-bold text-purple-600">
            {stats.chronicCount}
          </p>
          <p className="text-[10px] text-purple-500">만성</p>
        </div>
      </div>

      {/* 부위별 빈도 바 차트 */}
      {bodyPartEntries.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <BarChart2 className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">
              부상 부위별 빈도
            </p>
          </div>
          {bodyPartEntries.map(([part, count]) => (
            <div key={part} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-14 shrink-0 truncate">
                {BODY_PART_LABELS[part]}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-red-400 h-1.5 rounded-full transition-all"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-4 text-right shrink-0">
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 부상 항목 카드
// ============================================================

type InjuryItemProps = {
  entry: DanceInjuryEntry;
  onEdit: (entry: DanceInjuryEntry) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: DanceInjuryRehabStatus) => void;
};

function InjuryItem({
  entry,
  onEdit,
  onDelete,
  onStatusChange,
}: InjuryItemProps) {
  return (
    <div className="rounded-md border bg-card p-2.5 space-y-1.5">
      {/* 헤더: 부위 + 유형 + 배지들 + 버튼 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-semibold text-gray-800">
          {BODY_PART_LABELS[entry.bodyPart]}
        </span>
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0"
        >
          {INJURY_TYPE_LABELS[entry.injuryType]}
        </Badge>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${SEVERITY_COLORS[entry.severity]}`}
        >
          {SEVERITY_LABELS[entry.severity]}
        </Badge>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${REHAB_STATUS_COLORS[entry.rehabStatus]}`}
        >
          {REHAB_STATUS_LABELS[entry.rehabStatus]}
        </Badge>
        <div className="ml-auto flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-gray-700"
            onClick={() => onEdit(entry)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 날짜 정보 */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>부상일: {formatYearMonthDay(entry.injuredAt)}</span>
        {entry.expectedRecoveryAt && (
          <span>예상 회복일: {formatYearMonthDay(entry.expectedRecoveryAt)}</span>
        )}
      </div>

      {/* 치료 메모 */}
      {entry.treatmentNote && (
        <p className="text-[10px] text-muted-foreground bg-gray-50 rounded px-2 py-1 leading-relaxed">
          {entry.treatmentNote}
        </p>
      )}

      {/* 빠른 상태 변경 버튼 */}
      {entry.rehabStatus === "in_progress" && (
        <div className="flex gap-1.5 pt-0.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
            onClick={() => onStatusChange(entry.id, "recovered")}
          >
            <CheckCircle2 className="h-3 w-3" />
            완치 처리
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 text-purple-600 border-purple-200 hover:bg-purple-50"
            onClick={() => onStatusChange(entry.id, "chronic")}
          >
            <RefreshCw className="h-3 w-3" />
            만성 처리
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

export type InjuryLogCardProps = {
  memberId: string;
};

export function InjuryLogCard({ memberId }: InjuryLogCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DanceInjuryEntry | null>(
    null
  );
  const [filterStatus, setFilterStatus] = useState<
    DanceInjuryRehabStatus | "all"
  >("all");
  const [showStats, setShowStats] = useState(false);

  const {
    entries,
    loading,
    stats,
    addEntry,
    updateEntry,
    updateRehabStatus,
    deleteEntry,
  } = useInjuryLog(memberId);

  // 현재 재활중인 부위 요약
  const activeBodyParts = [
    ...new Set(
      entries
        .filter((e) => e.rehabStatus === "in_progress")
        .map((e) => e.bodyPart)
    ),
  ];

  // 필터 적용
  const filteredEntries =
    filterStatus === "all"
      ? entries
      : entries.filter((e) => e.rehabStatus === filterStatus);

  function handleAdd(form: InjuryFormData) {
    if (!form.bodyPart || !form.injuryType || !form.severity) return;
    addEntry({
      bodyPart: form.bodyPart as DanceInjuryBodyPart,
      injuryType: form.injuryType as DanceInjuryType,
      severity: form.severity as DanceInjurySeverity,
      injuredAt: form.injuredAt,
      expectedRecoveryAt: form.expectedRecoveryAt || undefined,
      rehabStatus: form.rehabStatus,
      treatmentNote: form.treatmentNote,
    });
    toast.success(TOAST.MEMBERS.INJURY_LOG_ADDED);
    setShowAddDialog(false);
  }

  function handleEdit(form: InjuryFormData) {
    if (!editingEntry) return;
    if (!form.bodyPart || !form.injuryType || !form.severity) return;
    const ok = updateEntry(editingEntry.id, {
      bodyPart: form.bodyPart as DanceInjuryBodyPart,
      injuryType: form.injuryType as DanceInjuryType,
      severity: form.severity as DanceInjurySeverity,
      injuredAt: form.injuredAt,
      expectedRecoveryAt: form.expectedRecoveryAt || undefined,
      rehabStatus: form.rehabStatus,
      treatmentNote: form.treatmentNote,
    });
    if (ok) {
      toast.success(TOAST.MEMBERS.INJURY_LOG_UPDATED);
    } else {
      toast.error(TOAST.UPDATE_ERROR);
    }
    setEditingEntry(null);
  }

  function handleDelete(id: string) {
    const ok = deleteEntry(id);
    if (ok) {
      toast.success(TOAST.MEMBERS.INJURY_LOG_DELETED);
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  function handleStatusChange(id: string, status: DanceInjuryRehabStatus) {
    const ok = updateRehabStatus(id, status);
    if (ok) {
      toast.success(
        `재활 상태가 '${REHAB_STATUS_LABELS[status]}'으로 변경되었습니다.`
      );
    } else {
      toast.error(TOAST.MEMBERS.INJURY_STATUS_ERROR);
    }
  }

  return (
    <>
      {/* 부상 추가 다이얼로그 */}
      <InjuryFormDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAdd}
      />

      {/* 부상 수정 다이얼로그 */}
      <InjuryFormDialog
        open={!!editingEntry}
        initialData={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSubmit={handleEdit}
      />

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="w-full">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bone className="h-4 w-4 text-red-500" />
                댄스 부상 기록
                {stats.activeCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border border-red-200">
                    재활중 {stats.activeCount}
                  </Badge>
                )}
                <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border border-gray-200">
                  전체 {stats.total}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddDialog(true);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  기록 추가
                </Button>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    {isOpen ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            {/* 활성 부상 요약 (항상 표시) */}
            {!loading && (
              <div className="mt-2">
                {stats.activeCount === 0 ? (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    현재 재활 중인 부상 없음
                  </p>
                ) : (
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {activeBodyParts.map((part) => (
                        <span
                          key={part}
                          className="text-[10px] px-1.5 py-0.5 rounded-full border bg-orange-50 text-orange-700 border-orange-200"
                        >
                          {BODY_PART_LABELS[part]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 px-4 pb-4 space-y-3">
              {/* 통계 토글 버튼 */}
              {entries.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 w-full text-muted-foreground"
                  onClick={() => setShowStats((v) => !v)}
                >
                  <Activity className="h-3 w-3" />
                  {showStats ? "통계 숨기기" : "통계 보기"}
                </Button>
              )}

              {/* 통계 섹션 */}
              {showStats && entries.length > 0 && (
                <StatsSection stats={stats} />
              )}

              {/* 필터 탭 */}
              {entries.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {(
                    [
                      "all",
                      "in_progress",
                      "recovered",
                      "chronic",
                    ] as const
                  ).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        filterStatus === s
                          ? "bg-gray-800 text-white border-gray-800"
                          : "bg-background text-gray-500 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {s === "all"
                        ? `전체 (${stats.total})`
                        : `${REHAB_STATUS_LABELS[s]} (${
                            s === "in_progress"
                              ? stats.activeCount
                              : s === "recovered"
                              ? stats.recoveredCount
                              : stats.chronicCount
                          })`}
                    </button>
                  ))}
                </div>
              )}

              {/* 부상 기록 목록 */}
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-6 space-y-1">
                  <Bone className="h-6 w-6 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-400">
                    {filterStatus === "all"
                      ? "등록된 부상 기록이 없습니다."
                      : `'${REHAB_STATUS_LABELS[filterStatus]}' 상태의 기록이 없습니다.`}
                  </p>
                  {filterStatus === "all" && (
                    <p className="text-[10px] text-gray-300">
                      상단 &apos;기록 추가&apos; 버튼으로 추가할 수 있습니다.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredEntries.map((entry) => (
                    <InjuryItem
                      key={entry.id}
                      entry={entry}
                      onEdit={(e) => setEditingEntry(e)}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </>
  );
}
