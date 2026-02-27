"use client";

import { useState } from "react";
import {
  Trophy,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Star,
  Users,
  Calendar,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useGroupMilestonesAchievements } from "@/hooks/use-group-milestones-achievements";
import type { GroupMilestone, GroupMilestoneCategory } from "@/types";

// ============================================
// 헬퍼
// ============================================

function getCategoryIcon(category: GroupMilestoneCategory) {
  switch (category) {
    case "members":
      return <Users className="h-3 w-3 text-blue-500 shrink-0" />;
    case "schedules":
      return <Calendar className="h-3 w-3 text-purple-500 shrink-0" />;
    case "posts":
      return <FileText className="h-3 w-3 text-green-500 shrink-0" />;
    case "custom":
      return <Star className="h-3 w-3 text-orange-500 shrink-0" />;
  }
}

function formatAchievedDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function getProgressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

// ============================================
// 서브 컴포넌트: 달성된 마일스톤 행
// ============================================

function AchievedMilestoneRow({
  milestone,
  onDelete,
}: {
  milestone: GroupMilestone;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-yellow-50 border border-yellow-200/60 group">
      {/* 금색 체크 아이콘 */}
      <div className="shrink-0 w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
        <Trophy className="h-2.5 w-2.5 text-white" />
      </div>

      {getCategoryIcon(milestone.category)}

      <span className="text-xs font-medium text-yellow-800 flex-1 truncate">
        {milestone.title}
      </span>

      {milestone.achievedAt && (
        <span className="text-[10px] text-yellow-600 shrink-0">
          {formatAchievedDate(milestone.achievedAt)}
        </span>
      )}

      {/* 커스텀 마일스톤만 삭제 가능 */}
      {!milestone.isDefault && (
        <button
          type="button"
          onClick={() => onDelete(milestone.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          aria-label="마일스톤 삭제"
        >
          <Trash2 className="h-3 w-3 text-yellow-600 hover:text-red-500" />
        </button>
      )}
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 미달성 마일스톤 행
// ============================================

function PendingMilestoneRow({
  milestone,
  onDelete,
}: {
  milestone: GroupMilestone;
  onDelete: (id: string) => void;
}) {
  const percent = getProgressPercent(milestone.currentValue, milestone.targetValue);
  const remaining = Math.max(0, milestone.targetValue - milestone.currentValue);

  return (
    <div className="py-1.5 px-2 rounded-md bg-muted/40 border border-border/50 group space-y-1">
      <div className="flex items-center gap-2">
        {getCategoryIcon(milestone.category)}

        <span className="text-xs text-foreground flex-1 truncate">
          {milestone.title}
        </span>

        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
          {milestone.currentValue}/{milestone.targetValue}
        </span>

        {!milestone.isDefault && (
          <button
            type="button"
            onClick={() => onDelete(milestone.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            aria-label="마일스톤 삭제"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Progress value={percent} className="h-1.5 flex-1" />
        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
          {remaining > 0 ? `${remaining} 남음` : "거의 다 왔어요!"}
        </span>
      </div>
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 최근 달성 축하 배너
// ============================================

function RecentlyAchievedBanner({ milestone }: { milestone: GroupMilestone }) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-md px-3 py-2.5 mb-2",
        "bg-gradient-to-r from-yellow-400/20 via-orange-400/15 to-yellow-400/20",
        "border border-yellow-300/60",
      ].join(" ")}
    >
      {/* Confetti 스타일 배경 점들 */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
        {[
          { top: "10%", left: "5%", color: "bg-yellow-400", size: "w-1 h-1" },
          { top: "20%", left: "15%", color: "bg-orange-400", size: "w-1.5 h-1" },
          { top: "60%", left: "8%", color: "bg-yellow-300", size: "w-1 h-1.5" },
          { top: "80%", left: "20%", color: "bg-orange-300", size: "w-1 h-1" },
          { top: "15%", left: "75%", color: "bg-yellow-500", size: "w-1.5 h-1" },
          { top: "50%", left: "85%", color: "bg-orange-400", size: "w-1 h-1" },
          { top: "75%", left: "90%", color: "bg-yellow-300", size: "w-1 h-1.5" },
          { top: "30%", left: "92%", color: "bg-orange-500", size: "w-1.5 h-1" },
          { top: "45%", left: "50%", color: "bg-yellow-400", size: "w-1 h-1" },
        ].map((dot, i) => (
          <div
            key={i}
            className={`absolute rounded-full opacity-60 rotate-12 ${dot.color} ${dot.size}`}
            style={{ top: dot.top, left: dot.left }}
          />
        ))}
      </div>

      <div className="relative flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-yellow-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-yellow-700 font-medium">최근 달성</p>
          <p className="text-xs font-semibold text-yellow-900 truncate">
            {milestone.title}
          </p>
        </div>
        {milestone.achievedAt && (
          <span className="text-[10px] text-yellow-600 shrink-0">
            {formatAchievedDate(milestone.achievedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 커스텀 마일스톤 추가 폼
// ============================================

function AddCustomMilestoneForm({
  onAdd,
}: {
  onAdd: (title: string, targetValue: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    const parsed = parseInt(targetValue, 10);
    if (!trimmed || isNaN(parsed) || parsed <= 0) return;
    onAdd(trimmed, parsed);
    setTitle("");
    setTargetValue("");
    setOpen(false);
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 text-xs w-full justify-start text-muted-foreground hover:text-foreground gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3 w-3" />
        커스텀 마일스톤 추가
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5 pt-1">
      <Input
        placeholder="마일스톤 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="h-7 text-xs"
        autoFocus
      />
      <Input
        type="number"
        placeholder="목표값 (예: 30)"
        value={targetValue}
        onChange={(e) => setTargetValue(e.target.value)}
        className="h-7 text-xs"
        min={1}
      />
      <div className="flex gap-1.5">
        <Button type="submit" size="sm" className="h-7 text-xs flex-1">
          추가
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={() => {
            setOpen(false);
            setTitle("");
            setTargetValue("");
          }}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

type GroupMilestonesCardProps = {
  groupId: string;
};

export function GroupMilestonesCard({ groupId }: GroupMilestonesCardProps) {
  const [open, setOpen] = useState(true);
  const { milestones, recentlyAchieved, addCustomMilestone, deleteMilestone, loading } =
    useGroupMilestonesAchievements(groupId);

  const achieved = milestones.filter((m) => m.achieved);
  const pending = milestones.filter((m) => !m.achieved);

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* 헤더 — Collapsible 토글 */}
      <button
        type="button"
        className="w-full flex items-center gap-1.5 text-left"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
        <span className="text-xs font-medium flex-1">그룹 마일스톤</span>
        {!loading && (
          <span className="text-[10px] text-muted-foreground mr-1">
            {achieved.length}/{milestones.length} 달성
          </span>
        )}
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="space-y-1.5">
          {/* 로딩 스켈레톤 */}
          {loading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 rounded-md bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              {/* 최근 달성 축하 배너 */}
              {recentlyAchieved && (
                <RecentlyAchievedBanner milestone={recentlyAchieved} />
              )}

              {/* 달성된 마일스톤 목록 */}
              {achieved.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground px-0.5">
                    달성 완료
                  </p>
                  {achieved.map((m) => (
                    <AchievedMilestoneRow
                      key={m.id}
                      milestone={m}
                      onDelete={deleteMilestone}
                    />
                  ))}
                </div>
              )}

              {/* 미달성 마일스톤 목록 */}
              {pending.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground px-0.5">
                    진행 중
                  </p>
                  {pending.map((m) => (
                    <PendingMilestoneRow
                      key={m.id}
                      milestone={m}
                      onDelete={deleteMilestone}
                    />
                  ))}
                </div>
              )}

              {/* 마일스톤이 아예 없을 때 */}
              {milestones.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-muted-foreground">
                  <Trophy className="h-5 w-5" />
                  <p className="text-xs">마일스톤이 없습니다</p>
                </div>
              )}

              {/* 구분선 */}
              {milestones.length > 0 && (
                <div className="border-t border-border/40 pt-1" />
              )}

              {/* 커스텀 마일스톤 추가 폼 */}
              <AddCustomMilestoneForm onAdd={addCustomMilestone} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
