"use client";

import { useState } from "react";
import { useDynamicTeams } from "@/hooks/use-dynamic-teams";
import type { TeamColor } from "@/types";
import type { EntityMember } from "@/types/entity-context";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// 색상 설정
// ============================================

const COLOR_PRESETS: { value: TeamColor; label: string; bg: string; ring: string }[] = [
  { value: "red",    label: "빨강",  bg: "bg-red-500",    ring: "ring-red-500" },
  { value: "blue",   label: "파랑",  bg: "bg-blue-500",   ring: "ring-blue-500" },
  { value: "green",  label: "초록",  bg: "bg-green-500",  ring: "ring-green-500" },
  { value: "purple", label: "보라",  bg: "bg-purple-500", ring: "ring-purple-500" },
  { value: "orange", label: "주황",  bg: "bg-orange-500", ring: "ring-orange-500" },
  { value: "cyan",   label: "청록",  bg: "bg-cyan-500",   ring: "ring-cyan-500" },
];

function colorBg(color: TeamColor): string {
  return COLOR_PRESETS.find((c) => c.value === color)?.bg ?? "bg-gray-400";
}

// ============================================
// 팀 생성 Dialog
// ============================================

function CreateTeamDialog({
  disabled,
  onCreate,
}: {
  disabled: boolean;
  onCreate: (name: string, color: TeamColor) => { error?: string };
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<TeamColor>("blue");

  const handleSubmit = () => {
    const result = onCreate(name, color);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`"${name.trim()}" 팀이 생성되었습니다`);
    setName("");
    setColor("blue");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={disabled}
        >
          <Plus className="h-3 w-3 mr-1" />
          팀 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">새 팀 만들기</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-1">
          {/* 팀 이름 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">팀 이름 (최대 20자)</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              placeholder="팀 이름 입력"
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            <span className="text-[10px] text-muted-foreground text-right">
              {name.length}/20
            </span>
          </div>
          {/* 색상 선택 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">팀 색상</label>
            <div className="flex gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setColor(preset.value)}
                  className={cn(
                    "w-7 h-7 rounded-full transition-all",
                    preset.bg,
                    color === preset.value
                      ? `ring-2 ring-offset-2 ${preset.ring}`
                      : "opacity-60 hover:opacity-90"
                  )}
                  title={preset.label}
                />
              ))}
            </div>
          </div>
          {/* 미리보기 */}
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
            <span
              className={cn("w-3 h-3 rounded-full shrink-0", colorBg(color))}
            />
            <span className="text-xs truncate">
              {name.trim() || "팀 이름 미리보기"}
            </span>
          </div>
          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
              disabled={!name.trim()}
            >
              생성
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 팀 행 (펼침/접기 + 멤버 리스트)
// ============================================

function TeamRow({
  team,
  members,
  allTeams,
  onAssign,
  onUnassign,
  onDelete,
}: {
  team: { id: string; name: string; color: TeamColor; memberIds: string[] };
  members: EntityMember[];
  allTeams: { id: string; name: string; color: TeamColor }[];
  onAssign: (memberId: string, teamId: string | null) => void;
  onUnassign: (memberId: string) => void;
  onDelete: (teamId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const teamMembers = members.filter((m) => team.memberIds.includes(m.userId));

  return (
    <div className="border rounded-md overflow-hidden">
      {/* 팀 헤더 */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40 select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <span
          className={cn("w-3 h-3 rounded-full shrink-0", colorBg(team.color))}
        />
        <span className="text-xs font-medium flex-1 truncate">{team.name}</span>
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0 h-4"
        >
          {teamMembers.length}명
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(team.id);
          }}
          title="팀 삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
      </div>

      {/* 멤버 목록 */}
      {expanded && (
        <div className="border-t bg-muted/20">
          {teamMembers.length === 0 ? (
            <p className="text-[11px] text-muted-foreground px-3 py-2">
              배정된 멤버가 없습니다
            </p>
          ) : (
            <ul className="divide-y">
              {teamMembers.map((m) => {
                const displayName = m.nickname || m.profile.name || "이름 없음";
                return (
                  <li
                    key={m.userId}
                    className="flex items-center gap-2 px-3 py-1.5"
                  >
                    <span className="text-xs flex-1 truncate">{displayName}</span>
                    <MemberTeamSelect
                      memberId={m.userId}
                      currentTeamId={team.id}
                      allTeams={allTeams}
                      onAssign={onAssign}
                      onUnassign={onUnassign}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 멤버별 팀 이동 Select
// ============================================

function MemberTeamSelect({
  memberId,
  currentTeamId,
  allTeams,
  onAssign,
  onUnassign,
}: {
  memberId: string;
  currentTeamId: string | null;
  allTeams: { id: string; name: string; color: TeamColor }[];
  onAssign: (memberId: string, teamId: string | null) => void;
  onUnassign: (memberId: string) => void;
}) {
  const value = currentTeamId ?? "__none__";

  const handleChange = (val: string) => {
    if (val === "__none__") {
      onUnassign(memberId);
    } else {
      onAssign(memberId, val);
    }
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="h-6 w-28 text-[11px] shrink-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
            미배정
          </span>
        </SelectItem>
        {allTeams.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  colorBg(t.color)
                )}
              />
              {t.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ============================================
// 미배정 멤버 섹션
// ============================================

function UnassignedSection({
  members,
  allTeams,
  onAssign,
}: {
  members: EntityMember[];
  allTeams: { id: string; name: string; color: TeamColor }[];
  onAssign: (memberId: string, teamId: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  if (members.length === 0) return null;

  return (
    <div className="border rounded-md overflow-hidden border-dashed">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40 select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="w-3 h-3 rounded-full shrink-0 bg-gray-300" />
        <span className="text-xs font-medium flex-1 text-muted-foreground">
          미배정
        </span>
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 h-4"
        >
          {members.length}명
        </Badge>
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
      </div>

      {expanded && (
        <div className="border-t bg-muted/10">
          <ul className="divide-y">
            {members.map((m) => {
              const displayName = m.nickname || m.profile.name || "이름 없음";
              return (
                <li
                  key={m.userId}
                  className="flex items-center gap-2 px-3 py-1.5"
                >
                  <span className="text-xs flex-1 truncate">{displayName}</span>
                  <MemberTeamSelect
                    memberId={m.userId}
                    currentTeamId={null}
                    allTeams={allTeams}
                    onAssign={onAssign}
                    onUnassign={() => {}}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================
// DynamicTeamManager (메인 컴포넌트)
// ============================================

type DynamicTeamManagerProps = {
  groupId: string;
  members: EntityMember[];
};

export function DynamicTeamManager({
  groupId,
  members,
}: DynamicTeamManagerProps) {
  const {
    teams,
    createTeam,
    deleteTeam,
    assignMember,
    unassignMember,
    getUnassignedMemberIds,
    maxTeams,
  } = useDynamicTeams(groupId);

  const allMemberIds = members.map((m) => m.userId);
  const unassignedIds = getUnassignedMemberIds(allMemberIds);
  const unassignedMembers = members.filter((m) =>
    unassignedIds.includes(m.userId)
  );

  const handleDelete = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    deleteTeam(teamId);
    toast.success(
      `"${team?.name}" 팀이 삭제되었습니다. 소속 멤버는 미배정으로 이동했습니다`
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 text-[11px] px-2">
          <Users className="h-3 w-3 mr-0.5" />
          팀 관리
          {teams.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 text-[10px] px-1.5 py-0 h-4"
            >
              {teams.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:max-w-sm flex flex-col gap-0 p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            동적 팀 관리
          </SheetTitle>
          <p className="text-[11px] text-muted-foreground">
            멤버를 팀에 배정하고 관리합니다. 데이터는 이 기기에만 저장됩니다.
          </p>
        </SheetHeader>

        {/* 팀 추가 버튼 */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <span className="text-xs text-muted-foreground">
            {teams.length}/{maxTeams}개 팀
          </span>
          <CreateTeamDialog
            disabled={teams.length >= maxTeams}
            onCreate={createTeam}
          />
        </div>

        {/* 팀 목록 + 미배정 */}
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="flex flex-col gap-2">
            {teams.length === 0 && unassignedMembers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">멤버가 없습니다</p>
              </div>
            )}

            {teams.length === 0 && unassignedMembers.length > 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-xs mb-1">아직 팀이 없습니다</p>
                <p className="text-[11px]">팀 추가 버튼으로 팀을 만들어 보세요</p>
              </div>
            )}

            {/* 팀 목록 */}
            {teams.map((team) => (
              <TeamRow
                key={team.id}
                team={team}
                members={members}
                allTeams={teams}
                onAssign={assignMember}
                onUnassign={unassignMember}
                onDelete={handleDelete}
              />
            ))}

            {/* 미배정 멤버 */}
            <UnassignedSection
              members={unassignedMembers}
              allTeams={teams}
              onAssign={assignMember}
            />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
