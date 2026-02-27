"use client";

import { useState } from "react";
import { Award, ChevronDown, ChevronUp, Plus, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useMemberBadge } from "@/hooks/use-member-badge";
import type { BadgeRarity } from "@/types";

// 희귀도 색상 매핑
const RARITY_STYLE: Record<
  BadgeRarity,
  { label: string; className: string }
> = {
  common: { label: "일반", className: "bg-gray-100 text-gray-700 border-gray-300" },
  rare: { label: "희귀", className: "bg-blue-100 text-blue-700 border-blue-300" },
  epic: { label: "에픽", className: "bg-purple-100 text-purple-700 border-purple-300" },
  legendary: { label: "전설", className: "bg-yellow-100 text-yellow-700 border-yellow-400" },
};

const RARITY_ORDER: BadgeRarity[] = ["legendary", "epic", "rare", "common"];

type Props = {
  groupId: string;
  memberNames: string[];
};

export function MemberBadgeCard({ groupId, memberNames }: Props) {
  const {
    badges,
    createBadge,
    deleteBadge,
    awardBadge,
    getMemberBadges,
    totalBadges,
    totalAwards,
    topCollectors,
    rarityDistribution,
  } = useMemberBadge(groupId);

  const [open, setOpen] = useState(false);

  // 멤버별 보유 현황 선택
  const [selectedMember, setSelectedMember] = useState<string>("");

  // 뱃지 만들기 다이얼로그
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [newRarity, setNewRarity] = useState<BadgeRarity>("common");
  const [newCategory, setNewCategory] = useState("");

  // 뱃지 수여 다이얼로그
  const [awardOpen, setAwardOpen] = useState(false);
  const [awardBadgeId, setAwardBadgeId] = useState("");
  const [awardMember, setAwardMember] = useState("");
  const [awardedBy, setAwardedBy] = useState("");
  const [awardReason, setAwardReason] = useState("");

  function resetCreateForm() {
    setNewName("");
    setNewDesc("");
    setNewEmoji("");
    setNewRarity("common");
    setNewCategory("");
  }

  function resetAwardForm() {
    setAwardBadgeId("");
    setAwardMember("");
    setAwardedBy("");
    setAwardReason("");
  }

  function handleCreateBadge() {
    if (!newName.trim()) {
      toast.error("뱃지 이름을 입력해주세요.");
      return;
    }
    if (!newEmoji.trim()) {
      toast.error("이모지를 입력해주세요.");
      return;
    }
    if (!newCategory.trim()) {
      toast.error("카테고리를 입력해주세요.");
      return;
    }
    createBadge(newName.trim(), newDesc.trim(), newEmoji.trim(), newRarity, newCategory.trim());
    toast.success(`"${newName.trim()}" 뱃지가 생성되었습니다.`);
    setCreateOpen(false);
    resetCreateForm();
  }

  function handleAwardBadge() {
    if (!awardBadgeId) {
      toast.error("수여할 뱃지를 선택해주세요.");
      return;
    }
    if (!awardMember) {
      toast.error("수여받을 멤버를 선택해주세요.");
      return;
    }
    if (!awardedBy.trim()) {
      toast.error("수여자 이름을 입력해주세요.");
      return;
    }
    const badge = badges.find((b) => b.id === awardBadgeId);
    awardBadge(awardBadgeId, awardMember, awardedBy.trim(), awardReason.trim());
    toast.success(`${awardMember}에게 "${badge?.name}" 뱃지를 수여했습니다.`);
    setAwardOpen(false);
    resetAwardForm();
  }

  function handleDeleteBadge(badgeId: string, badgeName: string) {
    deleteBadge(badgeId);
    toast.success(`"${badgeName}" 뱃지가 삭제되었습니다.`);
  }

  const memberBadgeList = selectedMember ? getMemberBadges(selectedMember) : [];

  return (
    <>
      <Card>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer select-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <CardTitle className="text-sm">멤버 뱃지 시스템</CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-yellow-300">
                    {totalBadges}종 / {totalAwards}수여
                  </Badge>
                </div>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {/* 액션 버튼 */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  variant="outline"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  뱃지 만들기
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  variant="outline"
                  onClick={() => setAwardOpen(true)}
                  disabled={badges.length === 0 || memberNames.length === 0}
                >
                  <Award className="h-3 w-3 mr-1" />
                  뱃지 수여
                </Button>
              </div>

              {/* 뱃지 갤러리 */}
              {badges.length > 0 ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">뱃지 갤러리</p>
                  <div className="grid grid-cols-3 gap-2">
                    {RARITY_ORDER.flatMap((rarity) =>
                      badges
                        .filter((b) => b.rarity === rarity)
                        .map((badge) => (
                          <div
                            key={badge.id}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg border bg-muted/30 relative group"
                          >
                            <span className="text-2xl leading-none">{badge.emoji}</span>
                            <span className="text-[10px] font-medium text-center leading-tight">
                              {badge.name}
                            </span>
                            <Badge
                              className={`text-[9px] px-1 py-0 border ${RARITY_STYLE[badge.rarity].className}`}
                            >
                              {RARITY_STYLE[badge.rarity].label}
                            </Badge>
                            <button
                              onClick={() => handleDeleteBadge(badge.id, badge.name)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="뱃지 삭제"
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                  {/* 희귀도 분포 */}
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {RARITY_ORDER.map((r) =>
                      rarityDistribution[r] > 0 ? (
                        <Badge
                          key={r}
                          className={`text-[9px] px-1.5 py-0 border ${RARITY_STYLE[r].className}`}
                        >
                          {RARITY_STYLE[r].label} {rarityDistribution[r]}
                        </Badge>
                      ) : null
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  아직 뱃지가 없습니다. 첫 뱃지를 만들어보세요.
                </p>
              )}

              {/* 멤버별 뱃지 보유 현황 */}
              {memberNames.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">멤버별 보유 현황</p>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="멤버를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {memberNames.map((name) => (
                        <SelectItem key={name} value={name} className="text-xs">
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedMember && (
                    <div className="mt-2">
                      {memberBadgeList.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-1">
                          보유한 뱃지가 없습니다.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {memberBadgeList.map(({ award, badge }) => (
                            <div
                              key={award.id}
                              className="flex items-center gap-1 px-2 py-1 rounded-md border bg-muted/30"
                              title={award.reason || badge.description}
                            >
                              <span className="text-sm">{badge.emoji}</span>
                              <span className="text-xs">{badge.name}</span>
                              <Badge
                                className={`text-[9px] px-1 py-0 border ${RARITY_STYLE[badge.rarity].className}`}
                              >
                                {RARITY_STYLE[badge.rarity].label}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 최다 수집자 랭킹 */}
              {topCollectors.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Trophy className="h-3 w-3 text-yellow-500" />
                    <p className="text-xs font-medium text-muted-foreground">최다 수집자 랭킹</p>
                  </div>
                  <div className="space-y-1">
                    {topCollectors.map((item, idx) => (
                      <div
                        key={item.memberName}
                        className="flex items-center justify-between px-2 py-1 rounded-md bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold w-4 text-center ${
                              idx === 0
                                ? "text-yellow-500"
                                : idx === 1
                                ? "text-gray-400"
                                : idx === 2
                                ? "text-amber-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-xs">{item.memberName}</span>
                        </div>
                        <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground">
                          {item.count}개
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 뱃지 만들기 다이얼로그 */}
      <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) resetCreateForm(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">새 뱃지 만들기</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs">뱃지 이름 *</Label>
              <Input
                className="h-7 text-xs"
                placeholder="예: 개근왕"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">설명</Label>
              <Input
                className="h-7 text-xs"
                placeholder="뱃지 획득 조건 등"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">이모지 *</Label>
              <Input
                className="h-7 text-xs"
                placeholder="이모지 1개 입력 (예: 🏆)"
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                maxLength={4}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">희귀도 *</Label>
              <Select
                value={newRarity}
                onValueChange={(v) => setNewRarity(v as BadgeRarity)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RARITY_ORDER.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {RARITY_STYLE[r].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">카테고리 *</Label>
              <Input
                className="h-7 text-xs"
                placeholder="예: 출석, 공연, 기여"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => { setCreateOpen(false); resetCreateForm(); }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleCreateBadge}>
              만들기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 뱃지 수여 다이얼로그 */}
      <Dialog open={awardOpen} onOpenChange={(v) => { setAwardOpen(v); if (!v) resetAwardForm(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">뱃지 수여</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs">수여할 뱃지 *</Label>
              <Select value={awardBadgeId} onValueChange={setAwardBadgeId}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="뱃지를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {badges.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      {b.emoji} {b.name} ({RARITY_STYLE[b.rarity].label})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">수여받을 멤버 *</Label>
              <Select value={awardMember} onValueChange={setAwardMember}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="멤버를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">수여자 *</Label>
              <Input
                className="h-7 text-xs"
                placeholder="수여자 이름"
                value={awardedBy}
                onChange={(e) => setAwardedBy(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">수여 사유</Label>
              <Input
                className="h-7 text-xs"
                placeholder="수여 이유 (선택)"
                value={awardReason}
                onChange={(e) => setAwardReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => { setAwardOpen(false); resetAwardForm(); }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleAwardBadge}>
              수여하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
