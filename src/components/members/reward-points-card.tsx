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
  Trophy,
  Medal,
  Star,
  ChevronDown,
  ChevronUp,
  CalendarCheck,
  FileText,
  MessageSquare,
  Heart,
  Zap,
  Wrench,
  Plus,
  TrendingUp,
  Users,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useActivityRewardPoints } from "@/hooks/use-reward-points";
import { ACTIVITY_POINT_DEFAULTS, ACTIVITY_POINT_LABELS } from "@/types";
import type { PointActionType } from "@/types";

// ---- 타입 ----
type RewardPointsCardProps = {
  groupId: string;
};

// ---- 액션 유형별 아이콘 ----
const ACTION_ICONS: Record<PointActionType, React.ReactNode> = {
  attendance: <CalendarCheck className="h-3 w-3" />,
  post: <FileText className="h-3 w-3" />,
  comment: <MessageSquare className="h-3 w-3" />,
  kudos: <Heart className="h-3 w-3" />,
  streak: <Zap className="h-3 w-3" />,
  manual: <Wrench className="h-3 w-3" />,
};

// ---- 액션 유형별 색상 ----
const ACTION_COLORS: Record<PointActionType, string> = {
  attendance: "bg-blue-100 text-blue-700",
  post: "bg-purple-100 text-purple-700",
  comment: "bg-green-100 text-green-700",
  kudos: "bg-pink-100 text-pink-700",
  streak: "bg-orange-100 text-orange-700",
  manual: "bg-gray-100 text-gray-700",
};

// ---- 시간 포맷 ----
function formatTime(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---- TOP3 메달 색상 ----
const RANK_STYLES: Record<number, { bg: string; text: string; icon: React.ReactNode }> = {
  1: {
    bg: "bg-amber-50 border-amber-300",
    text: "text-amber-700",
    icon: <Trophy className="h-4 w-4 text-amber-500" />,
  },
  2: {
    bg: "bg-slate-50 border-slate-300",
    text: "text-slate-600",
    icon: <Medal className="h-4 w-4 text-slate-400" />,
  },
  3: {
    bg: "bg-orange-50 border-orange-200",
    text: "text-orange-600",
    icon: <Medal className="h-4 w-4 text-orange-400" />,
  },
};

// ============================================
// 메인 컴포넌트
// ============================================
export function RewardPointsCard({ groupId }: RewardPointsCardProps) {
  const {
    getAllTransactions,
    grantPoints,
    getLeaderboard,
    getTotalIssuedPoints,
    getActiveMemberCount,
    getActionDistribution,
    getDefaultPoints,
    bump,
  } = useActivityRewardPoints(groupId);

  // 섹션 열림 상태
  const [leaderboardOpen, setLeaderboardOpen] = useState(true);
  const [grantFormOpen, setGrantFormOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  // 포인트 부여 폼 상태
  const [formMemberId, setFormMemberId] = useState("");
  const [formMemberName, setFormMemberName] = useState("");
  const [formActionType, setFormActionType] = useState<PointActionType>("attendance");
  const [formPoints, setFormPoints] = useState(String(ACTIVITY_POINT_DEFAULTS.attendance));
  const [formDescription, setFormDescription] = useState("");

  // 액션 유형 변경 시 기본 포인트 자동 설정
  const handleActionTypeChange = (val: PointActionType) => {
    setFormActionType(val);
    const def = getDefaultPoints(val);
    if (def > 0) setFormPoints(String(def));
    else setFormPoints("");
  };

  // 포인트 부여 제출
  const handleGrantSubmit = () => {
    if (!formMemberName.trim()) {
      toast.error(TOAST.MEMBERS.REWARD_POINTS_MEMBER_NAME_REQUIRED);
      return;
    }
    const pts = Number(formPoints);
    if (!pts || pts === 0) {
      toast.error(TOAST.MEMBERS.REWARD_POINTS_POINT_REQUIRED);
      return;
    }
    if (!formDescription.trim()) {
      toast.error(TOAST.MEMBERS.REWARD_POINTS_DESC_REQUIRED);
      return;
    }

    const memberId = formMemberId.trim() || `member-${formMemberName.trim()}`;
    grantPoints(
      memberId,
      formMemberName.trim(),
      formActionType,
      pts,
      formDescription.trim()
    );

    toast.success(
      `${formMemberName.trim()}님에게 ${pts}pt 부여 완료`
    );

    // 폼 초기화
    setFormMemberId("");
    setFormMemberName("");
    setFormActionType("attendance");
    setFormPoints(String(ACTIVITY_POINT_DEFAULTS.attendance));
    setFormDescription("");
    bump();
  };

  const leaderboard = getLeaderboard();
  const transactions = getAllTransactions();
  const totalPoints = getTotalIssuedPoints();
  const activeMemberCount = getActiveMemberCount();
  const distribution = getActionDistribution();
  const distributionTotal = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Star className="h-4 w-4 text-amber-500" />
          출석 보상 포인트
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">

        {/* ---- 리더보드 섹션 ---- */}
        <Collapsible open={leaderboardOpen} onOpenChange={setLeaderboardOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <span className="text-xs font-medium flex items-center gap-1">
              <Trophy className="h-3 w-3 text-amber-500" />
              랭킹 리더보드
            </span>
            {leaderboardOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1.5">
            {leaderboard.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                아직 포인트 내역이 없습니다
              </p>
            ) : (
              <>
                {/* TOP 3 강조 */}
                <div className="space-y-1.5">
                  {leaderboard.slice(0, 3).map((member) => {
                    const style = RANK_STYLES[member.rank] ?? {
                      bg: "bg-background border-border",
                      text: "text-foreground",
                      icon: null,
                    };
                    return (
                      <div
                        key={member.memberId}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${style.bg}`}
                      >
                        <span className="shrink-0">{style.icon}</span>
                        <span className={`text-xs font-semibold flex-1 truncate ${style.text}`}>
                          {member.memberName}
                        </span>
                        <Badge
                          className={`text-[10px] px-1.5 py-0 border-0 font-bold ${style.bg} ${style.text}`}
                        >
                          {member.totalPoints}pt
                        </Badge>
                      </div>
                    );
                  })}
                </div>
                {/* 나머지 순위 */}
                {leaderboard.length > 3 && (
                  <div className="space-y-0.5 pt-1">
                    {leaderboard.slice(3).map((member) => (
                      <div
                        key={member.memberId}
                        className="flex items-center gap-2 px-2 py-1 rounded"
                      >
                        <span className="text-[10px] text-muted-foreground w-4 text-right shrink-0">
                          {member.rank}
                        </span>
                        <span className="text-xs flex-1 truncate">
                          {member.memberName}
                        </span>
                        <span className="text-[10px] font-medium text-amber-600 shrink-0">
                          {member.totalPoints}pt
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t" />

        {/* ---- 포인트 부여 폼 섹션 ---- */}
        <Collapsible open={grantFormOpen} onOpenChange={setGrantFormOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <span className="text-xs font-medium flex items-center gap-1">
              <Plus className="h-3 w-3 text-green-500" />
              포인트 부여
            </span>
            {grantFormOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">멤버명</Label>
                <Input
                  value={formMemberName}
                  onChange={(e) => setFormMemberName(e.target.value)}
                  placeholder="홍길동"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">멤버 ID (선택)</Label>
                <Input
                  value={formMemberId}
                  onChange={(e) => setFormMemberId(e.target.value)}
                  placeholder="user-uuid"
                  className="h-7 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">활동 유형</Label>
                <Select
                  value={formActionType}
                  onValueChange={(v) => handleActionTypeChange(v as PointActionType)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ACTIVITY_POINT_LABELS) as PointActionType[]).map(
                      (key) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          <span className="flex items-center gap-1">
                            {ACTION_ICONS[key]}
                            {ACTIVITY_POINT_LABELS[key]}
                          </span>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">포인트</Label>
                <Input
                  type="number"
                  value={formPoints}
                  onChange={(e) => setFormPoints(e.target.value)}
                  placeholder="10"
                  className="h-7 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">설명</Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="3월 정기 연습 출석"
                className="h-7 text-xs"
              />
            </div>
            <Button
              size="sm"
              className="h-7 text-xs w-full"
              onClick={handleGrantSubmit}
            >
              포인트 부여
            </Button>
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t" />

        {/* ---- 최근 포인트 이력 섹션 ---- */}
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <span className="text-xs font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-500" />
              최근 포인트 이력
              {transactions.length > 0 && (
                <Badge className="text-[9px] px-1 py-0 ml-0.5 bg-blue-100 text-blue-700 border-0">
                  {transactions.length}
                </Badge>
              )}
            </span>
            {historyOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            {transactions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                포인트 이력이 없습니다
              </p>
            ) : (
              <div className="space-y-1">
                {transactions.slice(0, 20).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-lg border bg-card"
                  >
                    {/* 액션 아이콘 */}
                    <div
                      className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${ACTION_COLORS[tx.actionType]}`}
                    >
                      {ACTION_ICONS[tx.actionType]}
                    </div>
                    {/* 멤버명 + 설명 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">
                        <span className="font-medium">{tx.memberName}</span>
                        <span className="text-muted-foreground mx-1">·</span>
                        <span className="text-muted-foreground">{tx.description}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatTime(tx.createdAt)}
                      </p>
                    </div>
                    {/* 포인트 */}
                    <span
                      className={`text-xs font-semibold shrink-0 ${
                        tx.points >= 0 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {tx.points >= 0 ? "+" : ""}
                      {tx.points}pt
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t" />

        {/* ---- 통계 섹션 ---- */}
        <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <span className="text-xs font-medium flex items-center gap-1">
              <BarChart3 className="h-3 w-3 text-indigo-500" />
              통계
            </span>
            {statsOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {/* 요약 카드 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border bg-amber-50 px-3 py-2">
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Star className="h-2.5 w-2.5 text-amber-500" />
                  총 발행 포인트
                </p>
                <p className="text-sm font-bold text-amber-700">{totalPoints}pt</p>
              </div>
              <div className="rounded-lg border bg-blue-50 px-3 py-2">
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Users className="h-2.5 w-2.5 text-blue-500" />
                  활성 멤버
                </p>
                <p className="text-sm font-bold text-blue-700">{activeMemberCount}명</p>
              </div>
            </div>
            {/* 액션별 분포 */}
            {distributionTotal > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground font-medium">
                  활동 유형별 포인트 분포
                </p>
                {(Object.entries(distribution) as [PointActionType, number][])
                  .filter(([, val]) => val > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([actionType, pts]) => {
                    const pct =
                      distributionTotal > 0
                        ? Math.round((pts / distributionTotal) * 100)
                        : 0;
                    return (
                      <div key={actionType} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] flex items-center gap-1 px-1.5 py-0 rounded-full ${ACTION_COLORS[actionType]}`}
                          >
                            {ACTION_ICONS[actionType]}
                            {ACTIVITY_POINT_LABELS[actionType]}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {pts}pt ({pct}%)
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
