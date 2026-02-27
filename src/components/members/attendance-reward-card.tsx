"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Star,
  Users,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { useAttendanceReward } from "@/hooks/use-attendance-reward";
import type { AttendanceRewardTier } from "@/types";

// ============================================================
// 상수 & 유틸리티
// ============================================================

const TIER_ORDER: AttendanceRewardTier[] = [
  "diamond",
  "platinum",
  "gold",
  "silver",
  "bronze",
];

const TIER_LABELS: Record<AttendanceRewardTier, string> = {
  bronze: "브론즈",
  silver: "실버",
  gold: "골드",
  platinum: "플래티넘",
  diamond: "다이아몬드",
};

// 티어별 HEX 색상 (요구사항 지정값)
const TIER_HEX: Record<AttendanceRewardTier, string> = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
  diamond: "#B9F2FF",
};

// 티어별 텍스트 색상 (대비용, 밝은 티어는 어두운 텍스트)
const TIER_TEXT: Record<AttendanceRewardTier, string> = {
  bronze: "#5C3A00",
  silver: "#3A3A3A",
  gold: "#7A5500",
  platinum: "#4A4A4A",
  diamond: "#0066AA",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "short",
    day: "numeric",
  });
}

// ============================================================
// 서브 컴포넌트: 티어 배지
// ============================================================

function TierBadge({ tier }: { tier: AttendanceRewardTier }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-semibold"
      style={{
        backgroundColor: TIER_HEX[tier],
        color: TIER_TEXT[tier],
      }}
    >
      {TIER_LABELS[tier]}
    </span>
  );
}

// ============================================================
// 서브 컴포넌트: 보상 수여 다이얼로그
// ============================================================

type AwardDialogProps = {
  memberNames: string[];
  onAward: (
    memberName: string,
    tier: AttendanceRewardTier,
    attendanceRate: number,
    points: number
  ) => void;
};

function AwardDialog({ memberNames, onAward }: AwardDialogProps) {
  const [open, setOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [tier, setTier] = useState<AttendanceRewardTier>("bronze");
  const [attendanceRate, setAttendanceRate] = useState("");
  const [points, setPoints] = useState("");

  const handleSubmit = () => {
    if (!memberName) {
      toast.error("멤버를 선택해주세요");
      return;
    }
    const rate = Number(attendanceRate);
    if (!attendanceRate || rate < 0 || rate > 100) {
      toast.error("출석률을 0~100 사이로 입력해주세요");
      return;
    }
    const pts = Number(points);
    if (!points || pts <= 0) {
      toast.error("포인트를 입력해주세요");
      return;
    }

    onAward(memberName, tier, rate, pts);
    toast.success(`${memberName}님에게 ${TIER_LABELS[tier]} 보상을 수여했습니다`);

    // 초기화
    setMemberName("");
    setTier("bronze");
    setAttendanceRate("");
    setPoints("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Gift className="h-3 w-3" />
          보상 수여
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Gift className="h-4 w-4 text-amber-500" />
            보상 수여
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {/* 멤버 선택 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">멤버</Label>
            {memberNames.length > 0 ? (
              <Select value={memberName} onValueChange={setMemberName}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="멤버 선택" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="멤버 이름 입력"
                className="h-8 text-xs"
              />
            )}
          </div>

          {/* 티어 선택 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">티어</Label>
            <Select
              value={tier}
              onValueChange={(v) => setTier(v as AttendanceRewardTier)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIER_ORDER.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: TIER_HEX[t] }}
                      />
                      {TIER_LABELS[t]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 출석률 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">출석률 (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={attendanceRate}
              onChange={(e) => setAttendanceRate(e.target.value)}
              placeholder="85"
              className="h-8 text-xs"
            />
          </div>

          {/* 포인트 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">포인트</Label>
            <Input
              type="number"
              min={1}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="100"
              className="h-8 text-xs"
            />
          </div>

          <Button size="sm" className="h-7 text-xs w-full" onClick={handleSubmit}>
            수여 확정
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 서브 컴포넌트: 규칙 추가 다이얼로그
// ============================================================

type AddRuleDialogProps = {
  onAdd: (
    tier: AttendanceRewardTier,
    requiredAttendance: number,
    rewardName: string,
    rewardDescription: string,
    points: number
  ) => void;
};

function AddRuleDialog({ onAdd }: AddRuleDialogProps) {
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<AttendanceRewardTier>("bronze");
  const [requiredAttendance, setRequiredAttendance] = useState("");
  const [rewardName, setRewardName] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [points, setPoints] = useState("");

  const handleSubmit = () => {
    const rate = Number(requiredAttendance);
    if (!requiredAttendance || rate < 0 || rate > 100) {
      toast.error("필요 출석률을 0~100 사이로 입력해주세요");
      return;
    }
    if (!rewardName.trim()) {
      toast.error("보상명을 입력해주세요");
      return;
    }
    const pts = Number(points);
    if (!points || pts <= 0) {
      toast.error("포인트를 입력해주세요");
      return;
    }

    onAdd(tier, rate, rewardName.trim(), rewardDescription.trim(), pts);
    toast.success("보상 규칙이 추가되었습니다");

    // 초기화
    setTier("bronze");
    setRequiredAttendance("");
    setRewardName("");
    setRewardDescription("");
    setPoints("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          규칙 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-green-500" />
            보상 규칙 추가
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {/* 티어 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">티어</Label>
            <Select
              value={tier}
              onValueChange={(v) => setTier(v as AttendanceRewardTier)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIER_ORDER.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: TIER_HEX[t] }}
                      />
                      {TIER_LABELS[t]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 필요 출석률 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">필요 출석률 (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={requiredAttendance}
              onChange={(e) => setRequiredAttendance(e.target.value)}
              placeholder="80"
              className="h-8 text-xs"
            />
          </div>

          {/* 보상명 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">보상명</Label>
            <Input
              value={rewardName}
              onChange={(e) => setRewardName(e.target.value)}
              placeholder="성실 출석 배지"
              className="h-8 text-xs"
            />
          </div>

          {/* 보상 설명 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">보상 설명 (선택)</Label>
            <Textarea
              value={rewardDescription}
              onChange={(e) => setRewardDescription(e.target.value)}
              placeholder="80% 이상 출석 시 수여되는 보상입니다"
              className="text-xs min-h-[60px] resize-none"
            />
          </div>

          {/* 포인트 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">포인트</Label>
            <Input
              type="number"
              min={1}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="50"
              className="h-8 text-xs"
            />
          </div>

          <Button size="sm" className="h-7 text-xs w-full" onClick={handleSubmit}>
            규칙 저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type AttendanceRewardCardProps = {
  groupId: string;
  memberNames: string[];
};

type TabType = "status" | "rules";

export function AttendanceRewardCard({
  groupId,
  memberNames,
}: AttendanceRewardCardProps) {
  const {
    rules,
    records,
    addRule,
    deleteRule,
    awardReward,
    revokeReward,
    memberPointsMap,
    topPointHolder,
    totalRules,
    totalRecords,
    tierDistribution,
  } = useAttendanceReward(groupId);

  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("status");

  // 멤버 포인트 랭킹 (상위 10)
  const rankedMembers = Object.entries(memberPointsMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const maxPoints = rankedMembers.length > 0 ? rankedMembers[0][1] : 1;

  // 티어별 정렬된 규칙
  const sortedRules = [...rules].sort(
    (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)
  );

  // 멤버별 최고 티어 계산 (배지 표시용)
  const memberTopTier: Record<string, AttendanceRewardTier> = {};
  for (const record of records) {
    const current = memberTopTier[record.memberName];
    const currentIdx = current ? TIER_ORDER.indexOf(current) : TIER_ORDER.length;
    const newIdx = TIER_ORDER.indexOf(record.tier);
    if (newIdx < currentIdx) {
      memberTopTier[record.memberName] = record.tier;
    }
  }

  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2 pt-3 px-4">
          <CollapsibleTrigger className="w-full" asChild>
            <div className="flex items-center justify-between cursor-pointer select-none">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-amber-500" />
                멤버 출석 보상
                {totalRecords > 0 && (
                  <Badge className="text-[9px] px-1 py-0 ml-0.5 bg-amber-100 text-amber-700 border-0">
                    {totalRecords}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {/* 요약 통계 */}
                {topPointHolder && topPointHolder.name && (
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    최고:{" "}
                    <span className="font-medium text-amber-600">
                      {topPointHolder.name}
                    </span>{" "}
                    {topPointHolder.points}pt
                  </span>
                )}
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* 탭 헤더 */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab("status")}
                className={`flex-1 text-xs py-1 rounded-md transition-colors ${
                  activeTab === "status"
                    ? "bg-background text-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                보상 현황
              </button>
              <button
                onClick={() => setActiveTab("rules")}
                className={`flex-1 text-xs py-1 rounded-md transition-colors ${
                  activeTab === "rules"
                    ? "bg-background text-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                보상 규칙
                {totalRules > 0 && (
                  <span className="ml-1 text-[9px] text-muted-foreground">
                    ({totalRules})
                  </span>
                )}
              </button>
            </div>

            {/* ====================================================
                탭 1: 보상 현황
            ==================================================== */}
            {activeTab === "status" && (
              <div className="space-y-3">
                {/* 액션 버튼 */}
                <div className="flex justify-end">
                  <AwardDialog memberNames={memberNames} onAward={awardReward} />
                </div>

                {/* 티어 분포 요약 */}
                {totalRecords > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {TIER_ORDER.filter((t) => tierDistribution[t] > 0).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: TIER_HEX[t],
                          color: TIER_TEXT[t],
                        }}
                      >
                        {TIER_LABELS[t]}{" "}
                        <span className="opacity-80">{tierDistribution[t]}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* 멤버별 포인트 랭킹 */}
                {rankedMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-1 text-muted-foreground">
                    <Users className="h-6 w-6 opacity-30" />
                    <p className="text-xs">아직 보상 수여 기록이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {rankedMembers.map(([name, pts], idx) => {
                      const topTier = memberTopTier[name];
                      const barWidth =
                        maxPoints > 0
                          ? Math.max(4, Math.round((pts / maxPoints) * 100))
                          : 0;
                      const barColor = topTier
                        ? TIER_HEX[topTier]
                        : "#94a3b8";

                      return (
                        <div key={name} className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            {/* 순위 */}
                            <span className="text-[10px] text-muted-foreground w-4 text-right shrink-0">
                              {idx + 1}
                            </span>
                            {/* 멤버명 */}
                            <span className="text-xs font-medium flex-1 truncate">
                              {name}
                            </span>
                            {/* 최고 티어 배지 */}
                            {topTier && <TierBadge tier={topTier} />}
                            {/* 포인트 */}
                            <span className="text-xs font-bold shrink-0 tabular-nums">
                              {pts.toLocaleString()}pt
                            </span>
                          </div>
                          {/* 포인트 바 */}
                          <div className="ml-6 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${barWidth}%`,
                                backgroundColor: barColor,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 수여 기록 목록 (최근 5건) */}
                {records.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-medium">
                      최근 수여 기록
                    </p>
                    {[...records]
                      .sort(
                        (a, b) =>
                          new Date(b.earnedAt).getTime() -
                          new Date(a.earnedAt).getTime()
                      )
                      .slice(0, 5)
                      .map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg border bg-card"
                        >
                          <TierBadge tier={record.tier} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {record.memberName}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              출석률 {record.attendanceRate}% · {formatDate(record.earnedAt)}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-amber-600 shrink-0">
                            +{record.points}pt
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-red-500"
                            onClick={() => {
                              revokeReward(record.id);
                              toast.success("보상이 취소되었습니다");
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* ====================================================
                탭 2: 보상 규칙
            ==================================================== */}
            {activeTab === "rules" && (
              <div className="space-y-3">
                {/* 액션 버튼 */}
                <div className="flex justify-end">
                  <AddRuleDialog onAdd={addRule} />
                </div>

                {/* 규칙 목록 */}
                {sortedRules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-1 text-muted-foreground">
                    <Star className="h-6 w-6 opacity-30" />
                    <p className="text-xs">등록된 보상 규칙이 없습니다</p>
                    <p className="text-[10px]">규칙 추가 버튼으로 시작하세요</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sortedRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="rounded-lg border bg-card px-3 py-2.5 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <TierBadge tier={rule.tier} />
                            <span className="text-xs font-semibold">
                              {rule.rewardName}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-red-500"
                            onClick={() => {
                              deleteRule(rule.id);
                              toast.success("규칙이 삭제되었습니다");
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {rule.rewardDescription && (
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            {rule.rewardDescription}
                          </p>
                        )}

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">
                            출석률 {rule.requiredAttendance}% 이상
                          </span>
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                            {rule.points}pt
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {formatDate(rule.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
