"use client";

import { useState } from "react";
import {
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Users,
  Settings,
  Calendar,
  CheckCircle2,
  Circle,
  History,
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
import { useRoleRotation } from "@/hooks/use-role-rotation";
import type { RotationAssignment } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────

function formatWeekLabel(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const end = new Date(y, m - 1, d + 6);
  const endM = end.getMonth() + 1;
  const endD = end.getDate();
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")} ~ ${String(endM).padStart(2, "0")}.${String(endD).padStart(2, "0")}`;
}

// ─── 섹션: 역할 설정 ─────────────────────────────────────────

interface RoleSettingsSectionProps {
  hook: ReturnType<typeof useRoleRotation>;
}

function RoleSettingsSection({ hook }: RoleSettingsSectionProps) {
  const [roleName, setRoleName] = useState("");
  const [roleIcon, setRoleIcon] = useState("");
  const [roleDesc, setRoleDesc] = useState("");

  const handleAddRole = () => {
    if (!roleName.trim()) {
      toast.error("역할 이름을 입력하세요.");
      return;
    }
    const ok = hook.addRole(roleName, roleIcon, roleDesc);
    if (ok) {
      toast.success(`"${roleName}" 역할이 추가되었습니다.`);
      setRoleName("");
      setRoleIcon("");
      setRoleDesc("");
    } else {
      toast.error("역할 추가에 실패했습니다.");
    }
  };

  const handleRemoveRole = (id: string, name: string) => {
    const ok = hook.removeRole(id);
    if (ok) {
      toast.success(`"${name}" 역할이 삭제되었습니다.`);
    } else {
      toast.error("역할 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
        <Settings className="h-3 w-3" />
        역할 관리
      </p>

      {/* 역할 목록 */}
      {hook.config.roles.length === 0 ? (
        <p className="text-[10px] text-gray-400 py-1">
          등록된 역할이 없습니다.
        </p>
      ) : (
        <div className="space-y-1">
          {hook.config.roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center gap-2 rounded-md border border-gray-100 bg-gray-50 px-2.5 py-1.5"
            >
              <span className="text-sm">{role.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-800">{role.name}</p>
                {role.description && (
                  <p className="text-[10px] text-gray-400 truncate">
                    {role.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 shrink-0 p-0 text-gray-300 hover:text-red-500"
                onClick={() => handleRemoveRole(role.id, role.name)}
                title="역할 삭제"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 역할 추가 폼 */}
      <div className="space-y-1.5 rounded-md border border-dashed border-gray-200 p-2">
        <div className="flex gap-1.5">
          <Input
            value={roleIcon}
            onChange={(e) => setRoleIcon(e.target.value.slice(0, 4))}
            placeholder="🎭"
            className="h-7 w-12 shrink-0 text-center text-xs"
          />
          <Input
            value={roleName}
            onChange={(e) => setRoleName(e.target.value.slice(0, 20))}
            placeholder="역할 이름 (예: 리더)"
            className="h-7 flex-1 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddRole();
            }}
          />
        </div>
        <div className="flex gap-1.5">
          <Input
            value={roleDesc}
            onChange={(e) => setRoleDesc(e.target.value.slice(0, 50))}
            placeholder="역할 설명 (선택)"
            className="h-7 flex-1 text-xs"
          />
          <Button
            size="sm"
            className="h-7 shrink-0 bg-indigo-500 text-xs hover:bg-indigo-600"
            onClick={handleAddRole}
            disabled={!roleName.trim()}
          >
            <Plus className="mr-1 h-3 w-3" />
            추가
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── 섹션: 멤버 설정 ─────────────────────────────────────────

interface MemberSettingsSectionProps {
  hook: ReturnType<typeof useRoleRotation>;
}

function MemberSettingsSection({ hook }: MemberSettingsSectionProps) {
  const [memberName, setMemberName] = useState("");

  const handleAddMember = () => {
    if (!memberName.trim()) {
      toast.error("멤버 이름을 입력하세요.");
      return;
    }
    const ok = hook.addMember(memberName);
    if (ok) {
      toast.success(`"${memberName}" 멤버가 추가되었습니다.`);
      setMemberName("");
    } else {
      toast.error("이미 등록된 멤버이거나 추가에 실패했습니다.");
    }
  };

  const handleRemoveMember = (name: string) => {
    const ok = hook.removeMember(name);
    if (ok) {
      toast.success(`"${name}" 멤버가 삭제되었습니다.`);
    } else {
      toast.error("멤버 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
        <Users className="h-3 w-3" />
        멤버 관리
      </p>

      {/* 멤버 목록 */}
      {hook.config.members.length === 0 ? (
        <p className="text-[10px] text-gray-400 py-1">
          등록된 멤버가 없습니다.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {hook.config.members.map((name) => (
            <div
              key={name}
              className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 pl-2.5 pr-1 py-0.5"
            >
              <span className="text-xs text-gray-700">{name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 text-gray-300 hover:text-red-500"
                onClick={() => handleRemoveMember(name)}
                title="멤버 삭제"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 멤버 추가 폼 */}
      <div className="flex gap-1.5">
        <Input
          value={memberName}
          onChange={(e) => setMemberName(e.target.value.slice(0, 20))}
          placeholder="멤버 이름 입력"
          className="h-7 flex-1 text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddMember();
          }}
        />
        <Button
          size="sm"
          className="h-7 shrink-0 bg-indigo-500 text-xs hover:bg-indigo-600"
          onClick={handleAddMember}
          disabled={!memberName.trim()}
        >
          <Plus className="mr-1 h-3 w-3" />
          추가
        </Button>
      </div>
    </div>
  );
}

// ─── 섹션: 로테이션 주기 및 스케줄 생성 ──────────────────────

interface ScheduleSectionProps {
  hook: ReturnType<typeof useRoleRotation>;
}

function ScheduleSection({ hook }: ScheduleSectionProps) {
  const [weeks, setWeeks] = useState("4");

  const handleGenerate = () => {
    const n = Number(weeks);
    if (!n || n < 1 || n > 52) {
      toast.error("주 수는 1~52 사이로 입력하세요.");
      return;
    }
    if (hook.totalRoles === 0) {
      toast.error("먼저 역할을 추가해주세요.");
      return;
    }
    if (hook.totalMembers === 0) {
      toast.error("먼저 멤버를 추가해주세요.");
      return;
    }
    const ok = hook.generateSchedule(n);
    if (ok) {
      toast.success(`${n}주 분량의 배정표가 생성되었습니다.`);
    } else {
      toast.error("스케줄 생성에 실패했습니다.");
    }
  };

  const handleRotationWeeksChange = (v: string) => {
    const n = Number(v);
    if (!isNaN(n) && n >= 1 && n <= 52) {
      hook.setRotationWeeks(n);
    }
  };

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
        <Calendar className="h-3 w-3" />
        스케줄 생성
      </p>

      {/* 로테이션 주기 */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-500 shrink-0">로테이션 주기</span>
        <Input
          type="number"
          min={1}
          max={52}
          value={hook.config.rotationWeeks}
          onChange={(e) => handleRotationWeeksChange(e.target.value)}
          className="h-7 w-16 text-xs text-center"
        />
        <span className="text-[11px] text-gray-500">주마다 교체</span>
      </div>

      {/* 생성 주 수 */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={52}
          value={weeks}
          onChange={(e) => setWeeks(e.target.value)}
          placeholder="주 수"
          className="h-7 w-16 text-xs text-center"
        />
        <span className="text-[11px] text-gray-500">주 분량 자동 생성</span>
        <Button
          size="sm"
          className="h-7 shrink-0 bg-indigo-500 text-xs hover:bg-indigo-600"
          onClick={handleGenerate}
          disabled={hook.totalRoles === 0 || hook.totalMembers === 0}
        >
          <RefreshCw className="mr-1 h-3 w-3" />
          생성
        </Button>
      </div>

      {(hook.totalRoles === 0 || hook.totalMembers === 0) && (
        <p className="text-[10px] text-amber-500">
          역할과 멤버를 모두 등록해야 스케줄을 생성할 수 있습니다.
        </p>
      )}
    </div>
  );
}

// ─── 섹션: 이번 주 배정 ──────────────────────────────────────

interface CurrentWeekSectionProps {
  hook: ReturnType<typeof useRoleRotation>;
}

function CurrentWeekSection({ hook }: CurrentWeekSectionProps) {
  const assignments = hook.getCurrentAssignments();

  const handleToggle = (id: string) => {
    const ok = hook.toggleCompleted(id);
    if (!ok) toast.error("상태 변경에 실패했습니다.");
  };

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 text-gray-400">
        <RefreshCw className="h-8 w-8 opacity-20" />
        <p className="text-xs">이번 주 배정이 없습니다.</p>
        <p className="text-[10px]">스케줄 생성 버튼으로 배정표를 만들어보세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
          <Calendar className="h-3 w-3" />
          이번 주 배정
          <span className="font-normal text-gray-400">
            ({formatWeekLabel(hook.currentWeek)})
          </span>
        </p>
        {assignments.length > 0 && (
          <Badge
            className={`text-[10px] px-1.5 py-0 ${
              hook.currentCompletionRate === 100
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                : "bg-gray-100 text-gray-500 hover:bg-gray-100"
            }`}
          >
            {hook.currentCompletionRate}% 완료
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {assignments.map((a) => {
          const role = hook.getRoleById(a.roleId);
          if (!role) return null;
          return (
            <div
              key={a.id}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                a.completed
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-gray-100 bg-white"
              }`}
            >
              {/* 이모지 */}
              <span className="text-base shrink-0">{role.icon}</span>

              {/* 역할 + 이름 */}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-400">{role.name}</p>
                <p
                  className={`text-xs font-semibold truncate ${
                    a.completed ? "text-emerald-700 line-through" : "text-gray-800"
                  }`}
                >
                  {a.memberName}
                </p>
              </div>

              {/* 완료 토글 */}
              <button
                type="button"
                onClick={() => handleToggle(a.id)}
                className="shrink-0 transition-colors"
                title={a.completed ? "미완료로 변경" : "완료로 변경"}
              >
                {a.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300 hover:text-emerald-400" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 섹션: 배정 이력 ─────────────────────────────────────────

interface HistorySectionProps {
  hook: ReturnType<typeof useRoleRotation>;
}

function HistorySection({ hook }: HistorySectionProps) {
  const uniqueWeeks = hook.getUniqueWeeks();

  if (uniqueWeeks.length === 0) {
    return (
      <p className="text-center text-[10px] text-gray-400 py-4">
        아직 배정 이력이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {uniqueWeeks.map((week) => {
        const weekAssignments = hook
          .getAssignmentHistory()
          .filter((a: RotationAssignment) => a.weekStart === week);

        return (
          <div key={week} className="space-y-1">
            <p className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
              <History className="h-3 w-3" />
              {formatWeekLabel(week)}
            </p>
            <div className="overflow-hidden rounded-md border border-gray-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-3 py-1.5 text-left text-[10px] font-medium text-gray-500">
                      역할
                    </th>
                    <th className="px-3 py-1.5 text-left text-[10px] font-medium text-gray-500">
                      담당자
                    </th>
                    <th className="px-3 py-1.5 text-center text-[10px] font-medium text-gray-500">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {weekAssignments.map((a: RotationAssignment) => {
                    const role = hook.getRoleById(a.roleId);
                    return (
                      <tr
                        key={a.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="px-3 py-1.5 text-gray-700">
                          {role ? (
                            <span className="flex items-center gap-1">
                              <span>{role.icon}</span>
                              <span>{role.name}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">삭제된 역할</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-gray-700">
                          {a.memberName}
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <Badge
                            className={`text-[10px] px-1.5 py-0 ${
                              a.completed
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-100"
                            }`}
                          >
                            {a.completed ? "완료" : "미완료"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 설정 Collapsible ────────────────────────────────────────

interface SettingsPanelProps {
  hook: ReturnType<typeof useRoleRotation>;
}

function SettingsPanel({ hook }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full justify-between border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
        >
          <span className="flex items-center gap-1">
            <Settings className="h-3 w-3" />
            설정 (역할 / 멤버 / 스케줄 생성)
          </span>
          {open ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 space-y-4 rounded-md border border-gray-100 bg-gray-50 p-3">
          <RoleSettingsSection hook={hook} />
          <Separator />
          <MemberSettingsSection hook={hook} />
          <Separator />
          <ScheduleSection hook={hook} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── 이력 Collapsible ────────────────────────────────────────

interface HistoryPanelProps {
  hook: ReturnType<typeof useRoleRotation>;
}

function HistoryPanel({ hook }: HistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const uniqueWeeks = hook.getUniqueWeeks();

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full justify-between border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
        >
          <span className="flex items-center gap-1">
            <History className="h-3 w-3" />
            배정 이력
            {uniqueWeeks.length > 0 && (
              <Badge className="ml-1 bg-gray-100 text-[10px] px-1.5 py-0 text-gray-500 hover:bg-gray-100">
                {uniqueWeeks.length}주
              </Badge>
            )}
          </span>
          {open ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 rounded-md border border-gray-100 bg-white p-3">
          <HistorySection hook={hook} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface RoleRotationCardProps {
  groupId: string;
}

export function RoleRotationCard({ groupId }: RoleRotationCardProps) {
  const [open, setOpen] = useState(true);

  const hook = useRoleRotation(groupId);

  const currentAssignments = hook.getCurrentAssignments();

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800">
            역할 로테이션
          </span>

          {/* 역할 수 배지 */}
          {hook.totalRoles > 0 && (
            <Badge className="bg-indigo-100 text-[10px] px-1.5 py-0 text-indigo-600 hover:bg-indigo-100">
              역할 {hook.totalRoles}개
            </Badge>
          )}

          {/* 이번 주 배정 상태 배지 */}
          {currentAssignments.length > 0 && (
            <Badge
              className={`text-[10px] px-1.5 py-0 ${
                hook.currentCompletionRate === 100
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                  : hook.currentCompletionRate > 0
                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {hook.currentCompletionRate === 100
                ? "이번 주 완료"
                : hook.currentCompletionRate > 0
                  ? `${hook.currentCompletionRate}% 진행`
                  : "이번 주 배정중"}
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
          {/* 이번 주 배정 */}
          <CurrentWeekSection hook={hook} />

          <Separator />

          {/* 설정 패널 */}
          <SettingsPanel hook={hook} />

          {/* 배정 이력 패널 */}
          <HistoryPanel hook={hook} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
