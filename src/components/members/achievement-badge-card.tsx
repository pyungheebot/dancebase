"use client";

import { useState } from "react";
import {
  Award,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Trophy,
  Star,
} from "lucide-react";
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

import { useAchievementBadge } from "@/hooks/use-achievement-badge";
import type {
  AchievementBadgeCategory,
  AchievementBadgeLevel,
} from "@/types";

// ============================================================
// 상수 정의
// ============================================================

const CATEGORY_LABELS: Record<AchievementBadgeCategory, string> = {
  practice: "연습",
  performance: "공연",
  teamwork: "팀워크",
  attendance: "출석",
  skill: "실력",
  leadership: "리더십",
  other: "기타",
};

const CATEGORY_COLORS: Record<AchievementBadgeCategory, string> = {
  practice: "bg-orange-100 text-orange-700 border-orange-300",
  performance: "bg-purple-100 text-purple-700 border-purple-300",
  teamwork: "bg-green-100 text-green-700 border-green-300",
  attendance: "bg-blue-100 text-blue-700 border-blue-300",
  skill: "bg-cyan-100 text-cyan-700 border-cyan-300",
  leadership: "bg-indigo-100 text-indigo-700 border-indigo-300",
  other: "bg-gray-100 text-gray-700 border-gray-300",
};

const LEVEL_LABELS: Record<AchievementBadgeLevel, string> = {
  bronze: "브론즈",
  silver: "실버",
  gold: "골드",
};

const LEVEL_COLORS: Record<AchievementBadgeLevel, string> = {
  bronze: "bg-amber-100 text-amber-700 border-amber-400",
  silver: "bg-slate-100 text-slate-600 border-slate-400",
  gold: "bg-yellow-100 text-yellow-700 border-yellow-400",
};

const LEVEL_ICON_COLORS: Record<AchievementBadgeLevel, string> = {
  bronze: "text-amber-600",
  silver: "text-slate-500",
  gold: "text-yellow-500",
};

const ALL_CATEGORIES: AchievementBadgeCategory[] = [
  "practice",
  "performance",
  "teamwork",
  "attendance",
  "skill",
  "leadership",
  "other",
];

const ALL_LEVELS: AchievementBadgeLevel[] = ["gold", "silver", "bronze"];

// ============================================================
// Props
// ============================================================

type Props = {
  memberId: string;
  memberName: string;
};

// ============================================================
// 컴포넌트
// ============================================================

export function AchievementBadgeCard({ memberId, memberName }: Props) {
  const {
    entries,
    loading,
    addBadge,
    upgradeBadgeLevel,
    deleteBadge,
    stats,
  } = useAchievementBadge(memberId);

  const [open, setOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<AchievementBadgeCategory | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeTargetId, setUpgradeTargetId] = useState("");

  // 배지 추가 폼 상태
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<AchievementBadgeCategory>("practice");
  const [newLevel, setNewLevel] = useState<AchievementBadgeLevel>("bronze");
  const [newCondition, setNewCondition] = useState("");
  const [newEarnedAt, setNewEarnedAt] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [newAwardedBy, setNewAwardedBy] = useState("");

  // 레벨 업그레이드 폼 상태
  const [newUpgradeLevel, setNewUpgradeLevel] = useState<AchievementBadgeLevel>("silver");

  // ── 폼 초기화 ──
  function resetAddForm() {
    setNewTitle("");
    setNewDesc("");
    setNewCategory("practice");
    setNewLevel("bronze");
    setNewCondition("");
    setNewEarnedAt(new Date().toISOString().slice(0, 10));
    setNewAwardedBy("");
  }

  // ── 배지 추가 핸들러 ──
  async function handleAddBadge() {
    if (!newTitle.trim()) {
      toast.error("배지 이름을 입력해주세요.");
      return;
    }
    if (!newEarnedAt) {
      toast.error("획득 날짜를 입력해주세요.");
      return;
    }
    try {
      await addBadge({
        memberName,
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        category: newCategory,
        level: newLevel,
        condition: newCondition.trim() || undefined,
        earnedAt: newEarnedAt,
        awardedBy: newAwardedBy.trim() || undefined,
      });
      toast.success(`"${newTitle.trim()}" 배지가 추가되었습니다.`);
      setAddOpen(false);
      resetAddForm();
    } catch {
      toast.error("배지 추가에 실패했습니다.");
    }
  }

  // ── 레벨 업그레이드 핸들러 ──
  async function handleUpgradeLevel() {
    if (!upgradeTargetId) {
      toast.error("업그레이드할 배지를 선택해주세요.");
      return;
    }
    try {
      await upgradeBadgeLevel(upgradeTargetId, newUpgradeLevel);
      toast.success("배지 레벨이 업그레이드되었습니다.");
      setUpgradeOpen(false);
      setUpgradeTargetId("");
      setNewUpgradeLevel("silver");
    } catch {
      toast.error("레벨 업그레이드에 실패했습니다.");
    }
  }

  // ── 배지 삭제 핸들러 ──
  async function handleDeleteBadge(badgeId: string, title: string) {
    try {
      await deleteBadge(badgeId);
      toast.success(`"${title}" 배지가 삭제되었습니다.`);
    } catch {
      toast.error("배지 삭제에 실패했습니다.");
    }
  }

  // ── 필터 적용 ──
  const filteredEntries =
    filterCategory === "all"
      ? entries
      : entries.filter((e) => e.category === filterCategory);

  if (loading) return null;

  return (
    <>
      <Card>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer select-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <CardTitle className="text-sm">목표 달성 배지</CardTitle>
                  <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-yellow-300">
                    {stats.totalBadges}개 획득
                  </Badge>
                  {stats.levelCounts.gold > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-yellow-400">
                      골드 {stats.levelCounts.gold}
                    </Badge>
                  )}
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
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  variant="outline"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  배지 추가
                </Button>
                {entries.length > 0 && (
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    variant="outline"
                    onClick={() => setUpgradeOpen(true)}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    레벨 업그레이드
                  </Button>
                )}
              </div>

              {/* 레벨 분포 시각화 */}
              {stats.totalBadges > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">레벨 분포</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {ALL_LEVELS.map((level) =>
                      stats.levelCounts[level] > 0 ? (
                        <div
                          key={level}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${LEVEL_COLORS[level]}`}
                        >
                          <Award className={`h-3 w-3 ${LEVEL_ICON_COLORS[level]}`} />
                          {LEVEL_LABELS[level]} {stats.levelCounts[level]}
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* 카테고리별 바 시각화 */}
              {stats.totalBadges > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">카테고리 분포</p>
                  <div className="space-y-1">
                    {ALL_CATEGORIES.filter((c) => stats.categoryCounts[c] > 0).map((cat) => {
                      const count = stats.categoryCounts[cat];
                      const pct = Math.round((count / stats.totalBadges) * 100);
                      return (
                        <div key={cat} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-14 shrink-0">
                            {CATEGORY_LABELS[cat]}
                          </span>
                          <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary/60 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-4 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 카테고리 필터 탭 */}
              {entries.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setFilterCategory("all")}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      filterCategory === "all"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-transparent hover:border-border"
                    }`}
                  >
                    전체 {entries.length}
                  </button>
                  {ALL_CATEGORIES.filter((c) => stats.categoryCounts[c] > 0).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        filterCategory === cat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-transparent hover:border-border"
                      }`}
                    >
                      {CATEGORY_LABELS[cat]} {stats.categoryCounts[cat]}
                    </button>
                  ))}
                </div>
              )}

              {/* 배지 목록 */}
              {filteredEntries.length > 0 ? (
                <div className="space-y-2">
                  {filteredEntries.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-start justify-between p-2.5 rounded-lg border bg-muted/20 group"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <div
                          className={`mt-0.5 flex items-center justify-center w-6 h-6 rounded-full border shrink-0 ${LEVEL_COLORS[badge.level]}`}
                        >
                          <Award className={`h-3 w-3 ${LEVEL_ICON_COLORS[badge.level]}`} />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-medium">{badge.title}</span>
                            <Badge
                              className={`text-[9px] px-1 py-0 border ${LEVEL_COLORS[badge.level]}`}
                            >
                              {LEVEL_LABELS[badge.level]}
                            </Badge>
                            <Badge
                              className={`text-[9px] px-1 py-0 border ${CATEGORY_COLORS[badge.category]}`}
                            >
                              {CATEGORY_LABELS[badge.category]}
                            </Badge>
                          </div>
                          {badge.description && (
                            <p className="text-[10px] text-muted-foreground leading-snug">
                              {badge.description}
                            </p>
                          )}
                          {badge.condition && (
                            <p className="text-[10px] text-muted-foreground leading-snug">
                              조건: {badge.condition}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] text-muted-foreground">
                              획득일: {badge.earnedAt}
                            </span>
                            {badge.awardedBy && (
                              <span className="text-[10px] text-muted-foreground">
                                수여: {badge.awardedBy}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteBadge(badge.id, badge.title)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                        title="배지 삭제"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">
                  {filterCategory === "all"
                    ? "아직 획득한 배지가 없습니다. 첫 배지를 추가해보세요."
                    : `${CATEGORY_LABELS[filterCategory]} 카테고리 배지가 없습니다.`}
                </p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 배지 추가 다이얼로그 */}
      <Dialog
        open={addOpen}
        onOpenChange={(v) => {
          setAddOpen(v);
          if (!v) resetAddForm();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">{memberName} - 배지 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs">배지 이름 *</Label>
              <Input
                className="h-7 text-xs"
                placeholder="예: 10회 연속 출석"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">설명</Label>
              <Input
                className="h-7 text-xs"
                placeholder="배지에 대한 설명 (선택)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">카테고리 *</Label>
                <Select
                  value={newCategory}
                  onValueChange={(v) => setNewCategory(v as AchievementBadgeCategory)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">레벨 *</Label>
                <Select
                  value={newLevel}
                  onValueChange={(v) => setNewLevel(v as AchievementBadgeLevel)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_LEVELS.map((lv) => (
                      <SelectItem key={lv} value={lv} className="text-xs">
                        {LEVEL_LABELS[lv]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">획득 조건</Label>
              <Input
                className="h-7 text-xs"
                placeholder="예: 한 달 내 연습 10회 참석"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">획득 날짜 *</Label>
              <Input
                type="date"
                className="h-7 text-xs"
                value={newEarnedAt}
                onChange={(e) => setNewEarnedAt(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">수여자</Label>
              <Input
                className="h-7 text-xs"
                placeholder="수여자 이름 (선택)"
                value={newAwardedBy}
                onChange={(e) => setNewAwardedBy(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setAddOpen(false);
                resetAddForm();
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleAddBadge}>
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 레벨 업그레이드 다이얼로그 */}
      <Dialog
        open={upgradeOpen}
        onOpenChange={(v) => {
          setUpgradeOpen(v);
          if (!v) {
            setUpgradeTargetId("");
            setNewUpgradeLevel("silver");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">배지 레벨 업그레이드</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs">배지 선택 *</Label>
              <Select value={upgradeTargetId} onValueChange={setUpgradeTargetId}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="배지를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {entries.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      {b.title} ({LEVEL_LABELS[b.level]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">새 레벨 *</Label>
              <Select
                value={newUpgradeLevel}
                onValueChange={(v) => setNewUpgradeLevel(v as AchievementBadgeLevel)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_LEVELS.map((lv) => (
                    <SelectItem key={lv} value={lv} className="text-xs">
                      {LEVEL_LABELS[lv]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setUpgradeOpen(false);
                setUpgradeTargetId("");
                setNewUpgradeLevel("silver");
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleUpgradeLevel}>
              업그레이드
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
