"use client";

import { useState } from "react";
import {
  Shield,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  History,
  User,
  Calendar,
  Pencil,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  useRoleAssignment,
  ROLE_STATUS_LABELS,
  ROLE_STATUS_COLORS,
  PRESET_ROLE_NAMES,
} from "@/hooks/use-role-assignment";
import { formatYearMonthDay } from "@/lib/date-utils";
import type { RoleAssignmentItem } from "@/types";

// ─── 날짜 포맷 ────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${y}.${m}.${d}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── 역할 추가 폼 ────────────────────────────────────────────

interface AddItemFormProps {
  hook: ReturnType<typeof useRoleAssignment>;
  onClose: () => void;
}

function AddItemForm({ hook, onClose }: AddItemFormProps) {
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState("");

  const handleSubmit = () => {
    if (!roleName.trim()) {
      toast.error("역할 이름을 입력하세요.");
      return;
    }
    if (!assignee.trim()) {
      toast.error("담당자를 입력하세요.");
      return;
    }
    if (!startDate) {
      toast.error("시작일을 입력하세요.");
      return;
    }

    const ok = hook.addItem({
      roleName,
      description: description || undefined,
      assignee,
      startDate,
      endDate: endDate || undefined,
    });

    if (ok) {
      toast.success(`"${roleName}" 역할이 추가되었습니다.`);
      onClose();
    } else {
      toast.error("역할 추가에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-dashed border-indigo-200 bg-indigo-50/40 p-3">
      <p className="text-[11px] font-semibold text-indigo-600">새 역할 추가</p>

      {/* 프리셋 빠른 선택 */}
      <div className="flex flex-wrap gap-1">
        {PRESET_ROLE_NAMES.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setRoleName(name)}
            className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
              roleName === name
                ? "border-indigo-400 bg-indigo-100 text-indigo-700"
                : "border-gray-200 bg-white text-gray-500 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* 역할 이름 직접 입력 */}
      <Input
        value={roleName}
        onChange={(e) => setRoleName(e.target.value.slice(0, 20))}
        placeholder="역할 이름 (직접 입력)"
        className="h-7 text-xs"
      />

      {/* 역할 설명 */}
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value.slice(0, 60))}
        placeholder="역할 설명 (선택)"
        className="h-7 text-xs"
      />

      {/* 담당자 */}
      <Input
        value={assignee}
        onChange={(e) => setAssignee(e.target.value.slice(0, 20))}
        placeholder="담당자 이름"
        className="h-7 text-xs"
      />

      {/* 기간 */}
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="h-7 flex-1 text-xs"
        />
        <span className="shrink-0 text-[10px] text-gray-400">~</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="h-7 flex-1 text-xs"
        />
        <span className="shrink-0 text-[10px] text-gray-400">종료 (선택)</span>
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-1.5">
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
          className="h-7 bg-indigo-500 text-xs hover:bg-indigo-600"
          onClick={handleSubmit}
          disabled={!roleName.trim() || !assignee.trim()}
        >
          <Plus className="mr-1 h-3 w-3" />
          추가
        </Button>
      </div>
    </div>
  );
}

// ─── 담당자 변경 인라인 폼 ───────────────────────────────────

interface ChangeAssigneeFormProps {
  item: RoleAssignmentItem;
  hook: ReturnType<typeof useRoleAssignment>;
  onClose: () => void;
}

function ChangeAssigneeForm({ item, hook, onClose }: ChangeAssigneeFormProps) {
  const [nextAssignee, setNextAssignee] = useState("");
  const [changedBy, setChangedBy] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!nextAssignee.trim()) {
      toast.error("새 담당자를 입력하세요.");
      return;
    }
    const ok = hook.changeAssignee(
      item.id,
      nextAssignee,
      changedBy || "알 수 없음",
      note || undefined
    );
    if (ok) {
      toast.success(`담당자가 "${nextAssignee}"으로 변경되었습니다.`);
      onClose();
    } else {
      toast.error("담당자 변경에 실패했습니다.");
    }
  };

  return (
    <div className="mt-1.5 space-y-1.5 rounded-md border border-amber-200 bg-amber-50/40 p-2">
      <p className="text-[10px] font-semibold text-amber-600">담당자 변경</p>
      <Input
        value={nextAssignee}
        onChange={(e) => setNextAssignee(e.target.value.slice(0, 20))}
        placeholder="새 담당자 이름"
        className="h-6 text-xs"
      />
      <Input
        value={changedBy}
        onChange={(e) => setChangedBy(e.target.value.slice(0, 20))}
        placeholder="변경한 사람 (선택)"
        className="h-6 text-xs"
      />
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 60))}
        placeholder="변경 사유 (선택)"
        className="h-6 text-xs"
      />
      <div className="flex justify-end gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-[10px]"
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-6 bg-amber-500 px-2 text-[10px] hover:bg-amber-600"
          onClick={handleSubmit}
          disabled={!nextAssignee.trim()}
        >
          변경
        </Button>
      </div>
    </div>
  );
}

// ─── 역할 카드 단일 항목 ─────────────────────────────────────

interface RoleItemCardProps {
  item: RoleAssignmentItem;
  hook: ReturnType<typeof useRoleAssignment>;
}

function RoleItemCard({ item, hook }: RoleItemCardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showChangeAssignee, setShowChangeAssignee] = useState(false);

  const handleDelete = () => {
    hook.removeItem(item.id);
    toast.success(`"${item.roleName}" 역할이 삭제되었습니다.`);
  };

  const handleToggleStatus = () => {
    hook.toggleStatus(item.id);
    const next = item.status === "active" ? "만료" : "활성";
    toast.success(`"${item.roleName}" 상태가 ${next}으로 변경되었습니다.`);
  };

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        item.status === "active"
          ? "border-gray-100 bg-white"
          : "border-gray-100 bg-gray-50 opacity-70"
      }`}
    >
      {/* 헤더 행 */}
      <div className="flex items-start gap-2">
        {/* 역할 아이콘 */}
        <div
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            item.status === "active"
              ? "bg-indigo-100 text-indigo-600"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
        </div>

        {/* 역할명 + 설명 */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-800">
              {item.roleName}
            </span>
            <Badge
              className={`border text-[10px] px-1.5 py-0 ${ROLE_STATUS_COLORS[item.status]}`}
            >
              {ROLE_STATUS_LABELS[item.status]}
            </Badge>
          </div>
          {item.description && (
            <p className="mt-0.5 text-[10px] text-gray-400 truncate">
              {item.description}
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex shrink-0 items-center gap-0.5">
          {/* 상태 토글 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-300 hover:text-indigo-500"
            onClick={handleToggleStatus}
            title={item.status === "active" ? "만료로 변경" : "활성으로 변경"}
          >
            {item.status === "active" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* 담당자 변경 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-300 hover:text-amber-500"
            onClick={() => setShowChangeAssignee((v) => !v)}
            title="담당자 변경"
          >
            <Pencil className="h-3 w-3" />
          </Button>

          {/* 삭제 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-300 hover:text-red-500"
            onClick={handleDelete}
            title="역할 삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 담당자 + 기간 */}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1 text-[11px] text-gray-600">
          <User className="h-3 w-3 text-gray-400" />
          <span className="font-medium">{item.assignee}</span>
        </span>
        <span className="flex items-center gap-1 text-[11px] text-gray-400">
          <Calendar className="h-3 w-3" />
          {formatDate(item.startDate)}
          {item.endDate && ` ~ ${formatDate(item.endDate)}`}
        </span>
      </div>

      {/* 담당자 변경 폼 */}
      {showChangeAssignee && (
        <ChangeAssigneeForm
          item={item}
          hook={hook}
          onClose={() => setShowChangeAssignee(false)}
        />
      )}

      {/* 변경 이력 토글 */}
      {item.history.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-indigo-500 transition-colors"
            onClick={() => setShowHistory((v) => !v)}
          >
            <History className="h-3 w-3" />
            변경 이력 {item.history.length}건
            {showHistory ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {showHistory && (
            <div className="mt-1.5 space-y-1 rounded-md border border-gray-100 bg-gray-50 p-2">
              {item.history.map((h) => (
                <div key={h.id} className="text-[10px] text-gray-500">
                  <span className="font-medium text-gray-700">
                    {h.prevAssignee}
                  </span>{" "}
                  <span className="text-gray-400">→</span>{" "}
                  <span className="font-medium text-gray-700">
                    {h.nextAssignee}
                  </span>
                  <span className="ml-2 text-gray-400">
                    {formatYearMonthDay(h.changedAt)}
                  </span>
                  {h.changedBy && (
                    <span className="ml-1 text-gray-400">
                      by {h.changedBy}
                    </span>
                  )}
                  {h.note && (
                    <span className="ml-1 text-gray-400">({h.note})</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 역할 목록 섹션 ───────────────────────────────────────────

interface RoleListSectionProps {
  hook: ReturnType<typeof useRoleAssignment>;
  showExpired: boolean;
}

function RoleListSection({ hook, showExpired }: RoleListSectionProps) {
  const items = showExpired ? hook.expiredItems : hook.activeItems;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 text-gray-400">
        <Shield className="h-8 w-8 opacity-20" />
        <p className="text-xs">
          {showExpired ? "만료된 역할이 없습니다." : "활성 역할이 없습니다."}
        </p>
        {!showExpired && (
          <p className="text-[10px]">
            상단 버튼으로 역할을 추가해보세요.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <RoleItemCard key={item.id} item={item} hook={hook} />
      ))}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface RoleAssignmentCardProps {
  groupId: string;
}

export function RoleAssignmentCard({ groupId }: RoleAssignmentCardProps) {
  const [open, setOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  const hook = useRoleAssignment(groupId);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800">
            역할 분담표
          </span>

          {/* 활성 역할 수 배지 */}
          {hook.activeItems.length > 0 && (
            <Badge className="bg-indigo-100 text-[10px] px-1.5 py-0 text-indigo-600 hover:bg-indigo-100">
              활성 {hook.activeItems.length}개
            </Badge>
          )}

          {/* 만료 역할 수 배지 */}
          {hook.expiredItems.length > 0 && (
            <Badge className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-500 hover:bg-gray-100">
              만료 {hook.expiredItems.length}개
            </Badge>
          )}
        </div>

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

      {/* ── 본문 ── */}
      <CollapsibleContent>
        <div className="rounded-b-lg border border-gray-200 bg-white p-4 space-y-4">
          {/* 상단 액션 버튼 */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-7 bg-indigo-500 text-xs hover:bg-indigo-600"
              onClick={() => setShowAddForm((v) => !v)}
            >
              <Plus className="mr-1 h-3 w-3" />
              역할 추가
            </Button>

            {/* 탭 전환: 활성 / 만료 */}
            <div className="ml-auto flex rounded-md border border-gray-200 overflow-hidden">
              <button
                type="button"
                className={`px-3 py-1 text-[11px] transition-colors ${
                  !showExpired
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
                onClick={() => setShowExpired(false)}
              >
                활성
              </button>
              <button
                type="button"
                className={`px-3 py-1 text-[11px] transition-colors ${
                  showExpired
                    ? "bg-gray-500 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
                onClick={() => setShowExpired(true)}
              >
                만료
              </button>
            </div>
          </div>

          {/* 역할 추가 폼 */}
          {showAddForm && (
            <AddItemForm hook={hook} onClose={() => setShowAddForm(false)} />
          )}

          <Separator />

          {/* 역할 목록 */}
          <RoleListSection hook={hook} showExpired={showExpired} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
