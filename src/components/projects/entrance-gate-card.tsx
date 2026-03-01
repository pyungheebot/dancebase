"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DoorOpen,
  Plus,
  Trash2,
  Pencil,
  MoreVertical,
  Users,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  MapPin,
  Clock,
  User,
  RotateCcw,
} from "lucide-react";
import {
  useEntranceGate,
  type AddEntranceGateInput,
  type UpdateEntranceGateInput,
} from "@/hooks/use-entrance-gate";
import { useAsyncAction } from "@/hooks/use-async-action";
import type { EntranceGateEntry, EntranceGateStatus, EntranceGateType } from "@/types";

// ============================================================
// 상수
// ============================================================

const STATUS_CONFIG: Record<
  EntranceGateStatus,
  { label: string; color: string; dot: string }
> = {
  open: {
    label: "열림",
    color: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  closed: {
    label: "닫힘",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
  standby: {
    label: "대기",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    dot: "bg-yellow-400",
  },
};

const TYPE_CONFIG: Record<
  EntranceGateType,
  { label: string; color: string }
> = {
  general: { label: "일반", color: "bg-blue-100 text-blue-700 border-blue-200" },
  vip: { label: "VIP", color: "bg-purple-100 text-purple-700 border-purple-200" },
  staff: { label: "관계자", color: "bg-orange-100 text-orange-700 border-orange-200" },
  disabled: { label: "장애인", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
};

const ALL_TYPES: EntranceGateType[] = ["general", "vip", "staff", "disabled"];

// ============================================================
// 초기 폼 값
// ============================================================

const INIT_FORM: AddEntranceGateInput = {
  gateNumber: 1,
  gateName: "",
  location: "",
  staffName: "",
  openTime: "",
  closeTime: "",
  allowedTypes: ["general"],
  status: "standby",
  note: "",
};

// ============================================================
// 서브 컴포넌트: 상태 배지
// ============================================================

function StatusBadge({ status }: { status: EntranceGateStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium ${cfg.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ============================================================
// 서브 컴포넌트: 입장 유형 배지
// ============================================================

function TypeBadge({ type }: { type: EntranceGateType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

// ============================================================
// 서브 컴포넌트: 허용 유형 체크박스 그룹
// ============================================================

function AllowedTypesSelector({
  value,
  onChange,
}: {
  value: EntranceGateType[];
  onChange: (types: EntranceGateType[]) => void;
}) {
  const toggle = (type: EntranceGateType) => {
    if (value.includes(type)) {
      onChange(value.filter((t) => t !== type));
    } else {
      onChange([...value, type]);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      {ALL_TYPES.map((type) => (
        <div key={type} className="flex items-center gap-1.5">
          <Checkbox
            id={`type-${type}`}
            checked={value.includes(type)}
            onCheckedChange={() => toggle(type)}
          />
          <Label htmlFor={`type-${type}`} className="cursor-pointer text-xs">
            {TYPE_CONFIG[type].label}
          </Label>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 게이트 카드
// ============================================================

function GateCard({
  gate,
  onEdit,
  onDelete,
  onChangeStatus,
  onIncrement,
  onDecrement,
  onResetCount,
}: {
  gate: EntranceGateEntry;
  onEdit: (gate: EntranceGateEntry) => void;
  onDelete: (id: string) => void;
  onChangeStatus: (id: string, status: EntranceGateStatus) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onResetCount: (id: string) => void;
}) {
  const _statusCfg = STATUS_CONFIG[gate.status];

  return (
    <div
      className={`rounded-lg border-2 p-3 transition-colors ${
        gate.status === "open"
          ? "border-green-200 bg-green-50"
          : gate.status === "standby"
          ? "border-yellow-200 bg-yellow-50"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              gate.status === "open"
                ? "bg-green-500 text-white"
                : gate.status === "standby"
                ? "bg-yellow-400 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            {gate.gateNumber}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{gate.gateName}</p>
            {gate.location && (
              <p className="flex items-center gap-0.5 truncate text-[10px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                {gate.location}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <StatusBadge status={gate.status} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem
                className="text-xs"
                onClick={() => onChangeStatus(gate.id, "open")}
                disabled={gate.status === "open"}
              >
                <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500 inline-block" />
                열림으로 변경
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs"
                onClick={() => onChangeStatus(gate.id, "standby")}
                disabled={gate.status === "standby"}
              >
                <span className="mr-1.5 h-2 w-2 rounded-full bg-yellow-400 inline-block" />
                대기로 변경
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs"
                onClick={() => onChangeStatus(gate.id, "closed")}
                disabled={gate.status === "closed"}
              >
                <span className="mr-1.5 h-2 w-2 rounded-full bg-gray-400 inline-block" />
                닫힘으로 변경
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs"
                onClick={() => onResetCount(gate.id)}
              >
                <RotateCcw className="mr-1.5 h-3 w-3" />
                카운트 초기화
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs"
                onClick={() => onEdit(gate)}
              >
                <Pencil className="mr-1.5 h-3 w-3" />
                수정
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs text-destructive focus:text-destructive"
                onClick={() => onDelete(gate.id)}
              >
                <Trash2 className="mr-1.5 h-3 w-3" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 메타 정보 */}
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        {gate.staffName && (
          <span className="flex items-center gap-0.5">
            <User className="h-2.5 w-2.5" />
            {gate.staffName}
          </span>
        )}
        {(gate.openTime || gate.closeTime) && (
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {gate.openTime || "--:--"} ~ {gate.closeTime || "--:--"}
          </span>
        )}
      </div>

      {/* 허용 유형 */}
      <div className="mt-2 flex flex-wrap gap-1">
        {gate.allowedTypes.map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>

      {/* 카운트 컨트롤 */}
      <div className="mt-3 flex items-center justify-between rounded-md bg-white/70 px-3 py-2">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span className="text-xs">입장 인원</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onDecrement(gate.id)}
            disabled={gate.count <= 0}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
          <span className="w-10 text-center text-base font-bold tabular-nums">
            {gate.count}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onIncrement(gate.id)}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 메모 */}
      {gate.note && (
        <p className="mt-2 truncate text-[10px] text-muted-foreground">
          {gate.note}
        </p>
      )}
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 게이트 폼 다이얼로그
// ============================================================

function GateFormDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: AddEntranceGateInput;
  onSubmit: (data: AddEntranceGateInput) => Promise<boolean>;
  title: string;
}) {
  const [form, setForm] = useState<AddEntranceGateInput>(initialData);
  const { pending: saving, execute } = useAsyncAction();

  // 다이얼로그 열릴 때 폼 초기화
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) setForm(initialData);
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    await execute(async () => {
      const ok = await onSubmit(form);
      if (ok) onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 게이트 번호 & 이름 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">게이트 번호 *</Label>
              <Input
                type="number"
                min={1}
                value={form.gateNumber}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    gateNumber: parseInt(e.target.value) || 1,
                  }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">게이트 이름 *</Label>
              <Input
                placeholder="예: 메인 게이트, VIP 전용"
                value={form.gateName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, gateName: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 위치 */}
          <div className="space-y-1">
            <Label className="text-xs">위치</Label>
            <Input
              placeholder="예: 1층 정문, 2층 좌측"
              value={form.location ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
              className="h-8 text-xs"
            />
          </div>

          {/* 담당 스태프 */}
          <div className="space-y-1">
            <Label className="text-xs">담당 스태프</Label>
            <Input
              placeholder="스태프 이름"
              value={form.staffName ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, staffName: e.target.value }))
              }
              className="h-8 text-xs"
            />
          </div>

          {/* 개방 시간 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">개방 시작</Label>
              <Input
                type="time"
                value={form.openTime ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, openTime: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">개방 종료</Label>
              <Input
                type="time"
                value={form.closeTime ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, closeTime: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 허용 입장 유형 */}
          <div className="space-y-1.5">
            <Label className="text-xs">허용 입장 유형 *</Label>
            <AllowedTypesSelector
              value={form.allowedTypes}
              onChange={(types) => setForm((f) => ({ ...f, allowedTypes: types }))}
            />
          </div>

          {/* 초기 상태 */}
          <div className="space-y-1">
            <Label className="text-xs">초기 상태</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, status: v as EntranceGateStatus }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_CONFIG) as EntranceGateStatus[]).map(
                  (s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {STATUS_CONFIG[s].label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              placeholder="추가 메모를 입력하세요"
              value={form.note ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, note: e.target.value }))
              }
              className="min-h-[60px] resize-none text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface EntranceGateCardProps {
  groupId: string;
  projectId: string;
}

export function EntranceGateCard({ groupId, projectId }: EntranceGateCardProps) {
  const {
    gates,
    loading,
    addGate,
    updateGate,
    deleteGate,
    changeStatus,
    incrementCount,
    resetCount,
    resetAllCounts,
    stats,
  } = useEntranceGate(groupId, projectId);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EntranceGateEntry | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  // ── 게이트 추가 ──
  const handleAdd = async (data: AddEntranceGateInput): Promise<boolean> => {
    return await addGate(data);
  };

  // ── 게이트 수정 ──
  const handleEdit = (gate: EntranceGateEntry) => {
    setEditTarget(gate);
  };

  const handleEditSubmit = async (
    data: AddEntranceGateInput
  ): Promise<boolean> => {
    if (!editTarget) return false;
    const changes: UpdateEntranceGateInput = {
      gateNumber: data.gateNumber,
      gateName: data.gateName,
      location: data.location,
      staffName: data.staffName,
      openTime: data.openTime,
      closeTime: data.closeTime,
      allowedTypes: data.allowedTypes,
      status: data.status,
      note: data.note,
    };
    const ok = await updateGate(editTarget.id, changes);
    if (ok) setEditTarget(null);
    return ok;
  };

  // ── 게이트 삭제 ──
  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    await deleteGate(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  // ── 전체 카운트 초기화 ──
  const handleResetAllConfirm = async () => {
    await resetAllCounts();
    setConfirmResetAll(false);
  };

  // ── 편집 폼 초기값 ──
  const editInitData: AddEntranceGateInput = editTarget
    ? {
        gateNumber: editTarget.gateNumber,
        gateName: editTarget.gateName,
        location: editTarget.location ?? "",
        staffName: editTarget.staffName ?? "",
        openTime: editTarget.openTime ?? "",
        closeTime: editTarget.closeTime ?? "",
        allowedTypes: editTarget.allowedTypes,
        status: editTarget.status,
        note: editTarget.note ?? "",
      }
    : INIT_FORM;

  // ── 다음 게이트 번호 자동 계산 ──
  const nextGateNumber =
    gates.length > 0
      ? Math.max(...gates.map((g) => g.gateNumber)) + 1
      : 1;

  const addInitData: AddEntranceGateInput = {
    ...INIT_FORM,
    gateNumber: nextGateNumber,
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-xs text-muted-foreground">
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DoorOpen className="h-4 w-4 text-muted-foreground" />
              입장 게이트 관리
            </CardTitle>
            <div className="flex items-center gap-1.5">
              {gates.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setConfirmResetAll(true)}
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  전체 초기화
                </Button>
              )}
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="mr-1 h-3 w-3" />
                게이트 추가
              </Button>
            </div>
          </div>

          {/* 요약 통계 */}
          {gates.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                열림 {stats.openCount}개
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                대기 {stats.standbyCount}개
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                닫힘 {stats.closedCount}개
              </span>
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Users className="h-3 w-3" />
                총 입장 {stats.totalCount}명
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {gates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <DoorOpen className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                등록된 게이트가 없습니다
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                위 버튼을 눌러 게이트를 추가하세요
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {gates.map((gate) => (
                <GateCard
                  key={gate.id}
                  gate={gate}
                  onEdit={handleEdit}
                  onDelete={(id) => setConfirmDeleteId(id)}
                  onChangeStatus={changeStatus}
                  onIncrement={(id) => incrementCount(id, 1)}
                  onDecrement={(id) => incrementCount(id, -1)}
                  onResetCount={resetCount}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 게이트 추가 다이얼로그 */}
      <GateFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        initialData={addInitData}
        onSubmit={handleAdd}
        title="게이트 추가"
      />

      {/* 게이트 수정 다이얼로그 */}
      {editTarget && (
        <GateFormDialog
          open={!!editTarget}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          initialData={editInitData}
          onSubmit={handleEditSubmit}
          title="게이트 수정"
        />
      )}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">게이트 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            이 게이트를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setConfirmDeleteId(null)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              onClick={handleDeleteConfirm}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 전체 카운트 초기화 확인 다이얼로그 */}
      <Dialog open={confirmResetAll} onOpenChange={setConfirmResetAll}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">전체 카운트 초기화</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            모든 게이트의 입장 카운트를 0으로 초기화하시겠습니까?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setConfirmResetAll(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              onClick={handleResetAllConfirm}
            >
              초기화
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
