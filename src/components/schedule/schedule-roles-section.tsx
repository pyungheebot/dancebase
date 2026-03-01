"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCog, Plus, X, Tag } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useScheduleRoles } from "@/hooks/use-schedule-roles";
import { useAsyncAction } from "@/hooks/use-async-action";
import type { GroupMemberWithProfile } from "@/types";

type ScheduleRolesSectionProps = {
  scheduleId: string;
  groupId: string;
  /** 리더/매니저 여부 (true이면 편집 가능) */
  canEdit: boolean;
};

export function ScheduleRolesSection({
  scheduleId,
  groupId,
  canEdit,
}: ScheduleRolesSectionProps) {
  const { roles, loading, addRole, removeRole, getRoleHistory } =
    useScheduleRoles(scheduleId);

  const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [roleName, setRoleName] = useState("");
  const { pending: submitting, execute } = useAsyncAction();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [historySuggestions, setHistorySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 그룹 멤버 조회
  useEffect(() => {
    if (!groupId || !canEdit) return;
    let cancelled = false;
    setMembersLoading(true);
    const supabase = createClient();

    async function fetchMembers() {
      const { data, error } = await supabase
        .from("group_members")
        .select("*, profiles(id, name, avatar_url)")
        .eq("group_id", groupId)
        .order("joined_at");

      if (cancelled) return;
      if (!error && data) {
        setMembers(data as GroupMemberWithProfile[]);
      }
      setMembersLoading(false);
    }

    fetchMembers();
    return () => { cancelled = true; };
  }, [groupId, canEdit]);

  // 역할명 입력 시 히스토리 필터링
  useEffect(() => {
    if (!roleName) {
      setHistorySuggestions(getRoleHistory().slice(0, 5));
    } else {
      const filtered = getRoleHistory().filter((r) =>
        r.toLowerCase().includes(roleName.toLowerCase())
      );
      setHistorySuggestions(filtered.slice(0, 5));
    }
  }, [roleName, getRoleHistory]);

  const handleAdd = async () => {
    if (!selectedUserId) {
      toast.error(TOAST.SCHEDULE.ROLE_MEMBER_REQUIRED);
      return;
    }
    if (!roleName.trim()) {
      toast.error(TOAST.SCHEDULE.ROLE_NAME_REQUIRED);
      return;
    }

    await execute(async () => {
      try {
        await addRole(selectedUserId, roleName.trim());
        toast.success(TOAST.SCHEDULE.ROLE_ASSIGNED);
        setSelectedUserId("");
        setRoleName("");
        setAddOpen(false);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : TOAST.SCHEDULE.ROLE_ASSIGN_ERROR;
        // 중복 에러 처리
        if (msg.includes("duplicate") || msg.includes("unique")) {
          toast.error(TOAST.SCHEDULE.ROLE_DUPLICATE);
        } else {
          toast.error(TOAST.SCHEDULE.ROLE_ASSIGN_ERROR);
        }
      }
    });
  };

  const handleRemove = async (roleId: string) => {
    setRemovingId(roleId);
    try {
      await removeRole(roleId);
      toast.success(TOAST.SCHEDULE.ROLE_DELETED);
    } catch {
      toast.error(TOAST.SCHEDULE.ROLE_DELETE_ERROR);
    } finally {
      setRemovingId(null);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setRoleName(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1">
          <UserCog className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">역할 배정</span>
        </div>
        <div className="h-8 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <UserCog className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">역할 배정</span>
          {roles.length > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 ml-0.5"
            >
              {roles.length}
            </Badge>
          )}
        </div>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] px-2 gap-0.5"
            onClick={() => {
              setAddOpen((prev) => !prev);
              if (!addOpen) {
                setSelectedUserId("");
                setRoleName("");
              }
            }}
          >
            <Plus className="h-3 w-3" />
            역할 추가
          </Button>
        )}
      </div>

      {/* 역할 추가 폼 */}
      {canEdit && addOpen && (
        <div className="rounded border p-2 space-y-2 bg-muted/30">
          {/* 멤버 선택 */}
          <Select
            value={selectedUserId}
            onValueChange={setSelectedUserId}
            disabled={membersLoading}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="멤버 선택" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id} className="text-xs">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-4 w-4 shrink-0">
                      <AvatarImage src={m.profiles.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[8px]">
                        {m.profiles.name?.[0] ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{m.profiles.name}</span>
                    {m.role === "leader" && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 ml-auto"
                      >
                        리더
                      </Badge>
                    )}
                    {m.role === "sub_leader" && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 ml-auto"
                      >
                        부리더
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 역할명 입력 (자동완성) */}
          <div className="relative">
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
              <Input
                ref={inputRef}
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="역할명 입력 (예: 카메라 담당)"
                className="h-7 text-xs"
              />
            </div>
            {/* 자동완성 드롭다운 */}
            {showSuggestions && historySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-0.5 rounded border bg-background shadow-sm">
                {historySuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="w-full text-left px-2 py-1 text-xs hover:bg-muted transition-colors flex items-center gap-1"
                    onMouseDown={() => handleSelectSuggestion(s)}
                  >
                    <Tag className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={handleAdd}
              disabled={submitting || !selectedUserId || !roleName.trim()}
            >
              {submitting ? "배정 중..." : "배정"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => {
                setAddOpen(false);
                setSelectedUserId("");
                setRoleName("");
              }}
              disabled={submitting}
            >
              취소
            </Button>
          </div>
        </div>
      )}

      {/* 배정된 역할 목록 */}
      {roles.length > 0 && (
        <div className="space-y-1">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center gap-1.5 rounded border px-2 py-1"
            >
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarImage src={role.profiles.avatar_url ?? undefined} />
                <AvatarFallback className="text-[9px]">
                  {role.profiles.name?.[0] ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs truncate flex-1 min-w-0">
                {role.profiles.name}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 shrink-0 bg-blue-50 text-blue-700 border-blue-200"
              >
                {role.role_name}
              </Badge>
              {canEdit && (
                <button
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                  onClick={() => handleRemove(role.id)}
                  disabled={removingId === role.id}
                  aria-label={`${role.profiles.name} ${role.role_name} 역할 삭제`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 역할 없음 상태 */}
      {roles.length === 0 && !addOpen && (
        <p className="text-[11px] text-muted-foreground">
          배정된 역할이 없습니다
          {canEdit && " — 역할 추가 버튼을 눌러 시작하세요"}
        </p>
      )}
    </div>
  );
}
