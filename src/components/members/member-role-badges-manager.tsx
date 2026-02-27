"use client";

import { useState } from "react";
import { Tags, Plus, Trash2, ChevronDown, ChevronUp, Users } from "lucide-react";
import { toast } from "sonner";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  useMemberRoleBadges,
  useGroupMembersForBadge,
  ROLE_BADGE_COLOR_OPTIONS,
} from "@/hooks/use-member-role-badges";
import {
  ROLE_BADGE_COLOR_CLASSES,
  type RoleBadgeColor,
} from "@/types";

// ============================================
// 타입
// ============================================

type Props = {
  groupId: string;
};

// ============================================
// 배지 추가 다이얼로그
// ============================================

function AddBadgeDialog({
  onAdd,
  disabled,
}: {
  onAdd: (badge: {
    name: string;
    icon: string;
    color: RoleBadgeColor;
    description: string;
  }) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState<RoleBadgeColor>("purple");
  const [description, setDescription] = useState("");

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("배지 이름을 입력해 주세요.");
      return;
    }
    onAdd({ name: name.trim(), icon: icon.trim() || "🏷️", color, description: description.trim() });
    setName("");
    setIcon("");
    setColor("purple");
    setDescription("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-7 text-xs"
          disabled={disabled}
          title={disabled ? "배지는 최대 12개까지 생성할 수 있습니다." : undefined}
        >
          <Plus className="h-3 w-3 mr-1" />
          배지 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">역할 배지 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 배지 이름 */}
          <div className="space-y-1.5">
            <Label className="text-xs">배지 이름 *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 리더, 기획자"
              className="h-8 text-xs"
              maxLength={20}
            />
          </div>

          {/* 이모지 */}
          <div className="space-y-1.5">
            <Label className="text-xs">이모지 아이콘</Label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="예: 🎯 (비우면 🏷️ 사용)"
              className="h-8 text-xs"
              maxLength={4}
            />
          </div>

          {/* 색상 선택 */}
          <div className="space-y-1.5">
            <Label className="text-xs">색상</Label>
            <div className="flex flex-wrap gap-2">
              {ROLE_BADGE_COLOR_OPTIONS.map((opt) => {
                const cls = ROLE_BADGE_COLOR_CLASSES[opt.value];
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setColor(opt.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-all",
                      cls.bg,
                      cls.text,
                      color === opt.value
                        ? `${cls.border} ring-2 ring-offset-1`
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <span
                      className={cn("inline-block h-2.5 w-2.5 rounded-full", cls.dot)}
                    />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 설명 */}
          <div className="space-y-1.5">
            <Label className="text-xs">설명 (선택)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="배지에 대한 간단한 설명"
              className="h-8 text-xs"
              maxLength={50}
            />
          </div>

          {/* 미리보기 */}
          {name && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">미리보기</Label>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border",
                    ROLE_BADGE_COLOR_CLASSES[color].bg,
                    ROLE_BADGE_COLOR_CLASSES[color].text,
                    ROLE_BADGE_COLOR_CLASSES[color].border
                  )}
                >
                  <span>{icon.trim() || "🏷️"}</span>
                  <span>{name}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 단일 배지 행
// ============================================

function BadgeRow({
  badge,
  memberCount,
  members,
  assignments,
  onToggleMember,
  onDelete,
}: {
  badge: ReturnType<typeof useMemberRoleBadges>["badges"][number];
  memberCount: number;
  members: ReturnType<typeof useGroupMembersForBadge>["members"];
  assignments: ReturnType<typeof useMemberRoleBadges>["assignments"];
  onToggleMember: (userId: string, badgeId: string) => void;
  onDelete: (badgeId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cls = ROLE_BADGE_COLOR_CLASSES[badge.color];

  return (
    <div className="rounded-lg border bg-card">
      {/* 배지 헤더 */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* 색상 원 + 이모지 */}
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm",
            cls.bg
          )}
        >
          {badge.icon}
        </div>

        {/* 이름 + 설명 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium">{badge.name}</span>
            {badge.isDefault && (
              <Badge
                variant="secondary"
                className="text-[9px] px-1 py-0 h-4 leading-none"
              >
                기본
              </Badge>
            )}
          </div>
          {badge.description && (
            <p className="text-[11px] text-muted-foreground truncate">
              {badge.description}
            </p>
          )}
        </div>

        {/* 멤버 수 + 화살표 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
            <Users className="h-3 w-3" />
            {memberCount}
          </span>
          {!badge.isDefault && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(badge.id);
              }}
              className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded"
              title="배지 삭제"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
          {expanded ? (
            <ChevronUp className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* 멤버 목록 (펼침) */}
      {expanded && (
        <>
          <Separator />
          <div className="px-3 py-2 space-y-1.5 max-h-52 overflow-y-auto">
            {members.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-1">
                그룹 멤버가 없습니다.
              </p>
            ) : (
              members.map((member) => {
                const assigned = (assignments[member.userId] ?? []).includes(
                  badge.id
                );
                return (
                  <label
                    key={member.userId}
                    className="flex items-center gap-2 cursor-pointer py-0.5 hover:bg-muted/40 rounded px-1 transition-colors"
                  >
                    <Checkbox
                      checked={assigned}
                      onCheckedChange={() =>
                        onToggleMember(member.userId, badge.id)
                      }
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs">{member.name}</span>
                    {assigned && (
                      <span
                        className={cn(
                          "ml-auto text-[10px] px-1.5 py-0 rounded-full",
                          cls.bg,
                          cls.text
                        )}
                      >
                        배정됨
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function MemberRoleBadgesManager({ groupId }: Props) {
  const {
    badges,
    assignments,
    totalBadges,
    maxBadges,
    addBadge,
    deleteBadge,
    toggleMemberBadge,
    getBadgeMemberCount,
  } = useMemberRoleBadges(groupId);

  const { members, loading: membersLoading } =
    useGroupMembersForBadge(groupId);

  function handleAddBadge(badge: {
    name: string;
    icon: string;
    color: RoleBadgeColor;
    description: string;
  }) {
    const ok = addBadge(badge);
    if (!ok) {
      toast.error(`배지는 최대 ${maxBadges}개까지 생성할 수 있습니다.`);
      return;
    }
    toast.success(`"${badge.name}" 배지가 추가되었습니다.`);
  }

  function handleDeleteBadge(badgeId: string) {
    const target = badges.find((b) => b.id === badgeId);
    if (!target) return;
    const ok = deleteBadge(badgeId);
    if (!ok) {
      toast.error("기본 배지는 삭제할 수 없습니다.");
      return;
    }
    toast.success(`"${target.name}" 배지가 삭제되었습니다.`);
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Tags className="h-3 w-3 mr-1" />
          역할 배지
          <Badge
            variant="secondary"
            className="ml-1.5 text-[10px] px-1.5 py-0 h-4 leading-none"
          >
            {totalBadges}
          </Badge>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        {/* 헤더 */}
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-semibold">역할 배지 관리</SheetTitle>
            <AddBadgeDialog
              onAdd={handleAddBadge}
              disabled={totalBadges >= maxBadges}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            멤버에게 역할 배지를 할당하여 역할을 시각화할 수 있습니다.{" "}
            <span className="font-medium">
              {totalBadges}/{maxBadges}
            </span>
          </p>
        </SheetHeader>

        {/* 배지 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {membersLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs text-muted-foreground">멤버 목록 로딩 중...</p>
            </div>
          ) : badges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Tags className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                아직 역할 배지가 없습니다.
              </p>
            </div>
          ) : (
            badges.map((badge) => (
              <BadgeRow
                key={badge.id}
                badge={badge}
                memberCount={getBadgeMemberCount(badge.id)}
                members={members}
                assignments={assignments}
                onToggleMember={toggleMemberBadge}
                onDelete={handleDeleteBadge}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
