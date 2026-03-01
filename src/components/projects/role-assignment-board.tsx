"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  MoreHorizontal,
  UserPlus,
  X,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useRoleAssignmentBoard } from "@/hooks/use-role-assignment-board";
import type { ProjectRoleAssignment } from "@/types";

// ============================================
// 상수
// ============================================

const COLOR_PRESETS = [
  { label: "보라", value: "#8b5cf6" },
  { label: "파랑", value: "#3b82f6" },
  { label: "초록", value: "#10b981" },
  { label: "주황", value: "#f97316" },
  { label: "분홍", value: "#ec4899" },
  { label: "청록", value: "#06b6d4" },
];

const STATUS_CONFIG: Record<
  ProjectRoleAssignment["status"],
  { label: string; className: string; icon: React.ReactNode }
> = {
  open: {
    label: "모집 중",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <Circle className="h-3 w-3" />,
  },
  filled: {
    label: "배정 완료",
    className: "bg-green-100 text-green-700 border-green-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  completed: {
    label: "완료",
    className: "bg-gray-100 text-gray-600 border-gray-200",
    icon: <Clock className="h-3 w-3" />,
  },
};

// ============================================
// 역할 추가 Dialog
// ============================================

type AddRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (roleName: string, color: string, note: string) => boolean;
  atLimit: boolean;
};

function AddRoleDialog({ open, onOpenChange, onAdd, atLimit }: AddRoleDialogProps) {
  const [roleName, setRoleName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0].value);
  const [note, setNote] = useState("");

  function handleSubmit() {
    if (!roleName.trim()) {
      toast.error("역할명을 입력해주세요");
      return;
    }
    if (atLimit) {
      toast.error("역할은 최대 15개까지 추가할 수 있습니다");
      return;
    }
    const ok = onAdd(roleName, selectedColor, note);
    if (ok) {
      toast.success("역할이 추가되었습니다");
      setRoleName("");
      setSelectedColor(COLOR_PRESETS[0].value);
      setNote("");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            역할 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 역할명 */}
          <div className="space-y-1">
            <Label className="text-xs">역할명 *</Label>
            <Input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="예: 메인 안무, 음향 담당, 의상 팀장"
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>

          {/* 색상 선택 */}
          <div className="space-y-1.5">
            <Label className="text-xs">카드 색상</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.label}
                  onClick={() => setSelectedColor(preset.value)}
                  className={`w-6 h-6 rounded-full transition-all border-2 ${
                    selectedColor === preset.value
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모 (선택)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="역할에 대한 추가 설명"
              className="text-xs resize-none h-16"
            />
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
            disabled={!roleName.trim() || atLimit}
          >
            <Plus className="h-3 w-3 mr-1" />
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 담당자 인라인 입력
// ============================================

type AssigneeInputProps = {
  onAdd: (name: string) => void;
};

function AssigneeInput({ onAdd }: AssigneeInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;
      onAdd(trimmed);
      setValue("");
    }
  }

  return (
    <div className="flex items-center gap-1 mt-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="이름 입력 후 Enter"
        className="h-6 text-[11px] flex-1 px-2"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 shrink-0"
        onClick={() => {
          const trimmed = value.trim();
          if (!trimmed) return;
          onAdd(trimmed);
          setValue("");
          inputRef.current?.focus();
        }}
      >
        <UserPlus className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================
// 개별 역할 카드
// ============================================

type RoleCardProps = {
  role: ProjectRoleAssignment;
  canEdit: boolean;
  onDelete: (id: string) => void;
  onAssign: (id: string, name: string) => void;
  onRemoveMember: (id: string, name: string) => void;
  onChangeStatus: (id: string, status: ProjectRoleAssignment["status"]) => void;
};

function RoleCard({
  role,
  canEdit,
  onDelete,
  onAssign,
  onRemoveMember,
  onChangeStatus,
}: RoleCardProps) {
  const [showInput, setShowInput] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const statusCfg = STATUS_CONFIG[role.status];

  function handleAssign(name: string) {
    onAssign(role.id, name);
  }

  return (
    <div
      className="rounded-lg border bg-card p-3 flex flex-col gap-2 shadow-sm"
      style={{ borderTopColor: role.color, borderTopWidth: 3 }}
    >
      {/* 카드 헤더 */}
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: role.color }}
          />
          <span className="text-xs font-semibold truncate">{role.roleName}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* 상태 배지 */}
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 rounded border font-medium ${statusCfg.className}`}
          >
            {statusCfg.icon}
            {statusCfg.label}
          </span>

          {/* 더보기 메뉴 */}
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs w-36">
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => onChangeStatus(role.id, "open")}
                  disabled={role.status === "open"}
                >
                  <Circle className="h-3 w-3 mr-1.5 text-blue-600" />
                  모집 중
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => onChangeStatus(role.id, "filled")}
                  disabled={role.status === "filled"}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1.5 text-green-600" />
                  배정 완료
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => onChangeStatus(role.id, "completed")}
                  disabled={role.status === "completed"}
                >
                  <Clock className="h-3 w-3 mr-1.5 text-gray-500" />
                  완료
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs text-destructive focus:text-destructive"
                  onSelect={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="h-3 w-3 mr-1.5" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="역할 삭제"
        description={`'${role.roleName}' 역할과 담당자 정보가 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={() => {
          onDelete(role.id);
          toast.success("역할이 삭제되었습니다");
        }}
        destructive
      />

      {/* 담당자 배지 목록 */}
      <div className="flex flex-wrap gap-1 min-h-[20px]">
        {role.assignees.length === 0 ? (
          <span className="text-[10px] text-muted-foreground">담당자 없음</span>
        ) : (
          role.assignees.map((name) => (
            <Badge
              key={name}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 gap-0.5 group cursor-default"
            >
              {name}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onRemoveMember(role.id, name)}
                  className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                  aria-label={`${name} 제거`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </Badge>
          ))
        )}
      </div>

      {/* 메모 */}
      {role.note && (
        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
          {role.note}
        </p>
      )}

      {/* 담당자 추가 영역 */}
      {canEdit && (
        <div>
          {showInput ? (
            <div>
              <AssigneeInput
                onAdd={(name) => {
                  handleAssign(name);
                }}
              />
              <button
                type="button"
                className="text-[10px] text-muted-foreground mt-1 hover:text-foreground transition-colors"
                onClick={() => setShowInput(false)}
              >
                닫기
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowInput(true)}
            >
              <UserPlus className="h-3 w-3" />
              담당자 추가
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

type RoleAssignmentBoardProps = {
  groupId: string;
  projectId: string;
  canEdit?: boolean;
};

export function RoleAssignmentBoard({
  groupId,
  projectId,
  canEdit = false,
}: RoleAssignmentBoardProps) {
  const [sectionOpen, setSectionOpen] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const {
    roles,
    maxRoles,
    addRole,
    deleteRole,
    assignMember,
    removeMember,
    changeStatus,
  } = useRoleAssignmentBoard(groupId, projectId);

  const filledCount = roles.filter((r) => r.status !== "open").length;
  const atLimit = roles.length >= maxRoles;

  return (
    <div className="space-y-2">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-1.5 group"
          onClick={() => setSectionOpen((v) => !v)}
        >
          <ClipboardList className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium">역할 배정 보드</span>
          {roles.length > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 shrink-0"
            >
              {filledCount}/{roles.length}
            </Badge>
          )}
          <span className="text-muted-foreground ml-1">
            {sectionOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </span>
        </button>

        {/* 역할 추가 버튼 */}
        {canEdit && sectionOpen && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setAddDialogOpen(true)}
            disabled={atLimit}
          >
            <Plus className="h-3 w-3" />
            역할 추가
            {atLimit && (
              <span className="text-[10px] text-muted-foreground">({maxRoles}개 한도)</span>
            )}
          </Button>
        )}
      </div>

      {/* 섹션 본문 */}
      {sectionOpen && (
        <div className="pl-1">
          {roles.length === 0 ? (
            <div className="border rounded-lg px-4 py-6 bg-muted/20 text-center">
              <ClipboardList className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {canEdit
                  ? "역할을 추가하여 팀원을 배정해보세요."
                  : "아직 배정된 역할이 없습니다."}
              </p>
              {canEdit && (
                <Button
                  size="sm"
                  className="h-7 text-xs mt-3 gap-1"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  첫 역할 추가
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  canEdit={canEdit}
                  onDelete={deleteRole}
                  onAssign={assignMember}
                  onRemoveMember={removeMember}
                  onChangeStatus={changeStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 역할 추가 Dialog */}
      <AddRoleDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={addRole}
        atLimit={atLimit}
      />
    </div>
  );
}
