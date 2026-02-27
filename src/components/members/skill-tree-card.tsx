"use client";

import { useState } from "react";
import { useSkillTree } from "@/hooks/use-skill-tree";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";
import type { SkillTreeNode, SkillTreeNodeStatus } from "@/types";

// ============================================
// 상태별 스타일 설정
// ============================================

const NODE_STYLES: Record<
  SkillTreeNodeStatus,
  { border: string; bg: string; text: string; icon: React.ReactNode }
> = {
  locked: {
    border: "border-gray-300",
    bg: "bg-gray-100",
    text: "text-gray-400",
    icon: <Lock className="h-3 w-3" />,
  },
  available: {
    border: "border-blue-400 border-2",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: <Unlock className="h-3 w-3 text-blue-500" />,
  },
  learned: {
    border: "border-green-400",
    bg: "bg-green-100",
    text: "text-green-800",
    icon: <CheckCircle2 className="h-3 w-3 text-green-600" />,
  },
};

const TIER_LABELS: Record<number, string> = {
  1: "기본기",
  2: "초급",
  3: "중급",
  4: "고급",
  5: "최상급",
};

const TIER_BADGE_COLORS: Record<number, string> = {
  1: "bg-gray-100 text-gray-600",
  2: "bg-blue-100 text-blue-600",
  3: "bg-purple-100 text-purple-600",
  4: "bg-orange-100 text-orange-600",
  5: "bg-yellow-100 text-yellow-700",
};

// ============================================
// Props 타입
// ============================================

type SkillTreeCardProps = {
  groupId: string;
  userId: string;
  canEdit: boolean;
};

// ============================================
// 스킬 노드 컴포넌트
// ============================================

function SkillNode({
  node,
  onSelect,
}: {
  node: SkillTreeNode;
  onSelect: (node: SkillTreeNode) => void;
}) {
  const styles = NODE_STYLES[node.status];

  return (
    <button
      onClick={() => onSelect(node)}
      disabled={node.status === "locked"}
      className={[
        "flex flex-col items-center justify-center gap-0.5",
        "w-20 h-20 rounded-full border",
        "transition-all duration-150 select-none",
        styles.border,
        styles.bg,
        node.status === "locked"
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:scale-105 hover:shadow-md",
      ].join(" ")}
      title={node.name}
    >
      <span className="text-[10px]">{styles.icon}</span>
      <span className={["text-[10px] font-medium text-center leading-tight px-1 line-clamp-2", styles.text].join(" ")}>
        {node.name}
      </span>
    </button>
  );
}

// ============================================
// 스킬 상세 다이얼로그
// ============================================

function SkillDetailDialog({
  node,
  open,
  onClose,
  onLearn,
  allNodes,
}: {
  node: SkillTreeNode | null;
  open: boolean;
  onClose: () => void;
  onLearn: (id: string) => void;
  allNodes: SkillTreeNode[];
}) {
  if (!node) return null;

  const styles = NODE_STYLES[node.status];
  const prereqNodes = allNodes.filter((n) => node.prerequisiteIds.includes(n.id));

  const statusLabel: Record<SkillTreeNodeStatus, string> = {
    locked: "잠김",
    available: "해금 가능",
    learned: "습득 완료",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <span className={["flex items-center justify-center w-7 h-7 rounded-full border", styles.border, styles.bg].join(" ")}>
              {styles.icon}
            </span>
            {node.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          {/* 상태 배지 */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">상태</span>
            <Badge
              className={[
                "text-[10px] px-1.5 py-0",
                node.status === "learned"
                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                  : node.status === "available"
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-100",
              ].join(" ")}
            >
              {statusLabel[node.status]}
            </Badge>
            <Badge className={["text-[10px] px-1.5 py-0", TIER_BADGE_COLORS[node.tier]].join(" ")}>
              Tier {node.tier} · {TIER_LABELS[node.tier]}
            </Badge>
          </div>

          {/* 설명 */}
          <p className="text-muted-foreground leading-relaxed">{node.description}</p>

          {/* 선행 스킬 */}
          {prereqNodes.length > 0 && (
            <div className="space-y-1">
              <span className="text-muted-foreground">선행 스킬</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {prereqNodes.map((pn) => (
                  <Badge
                    key={pn.id}
                    className={[
                      "text-[10px] px-1.5 py-0",
                      pn.status === "learned"
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-100",
                    ].join(" ")}
                  >
                    {pn.status === "learned" ? "✓ " : ""}{pn.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 습득 일자 */}
          {node.status === "learned" && node.learnedAt && (
            <p className="text-muted-foreground">
              습득일: {node.learnedAt.slice(0, 10)}
            </p>
          )}

          {/* 해금 버튼 */}
          {node.status === "available" && (
            <Button
              size="sm"
              className="w-full h-7 text-xs mt-1"
              onClick={() => {
                onLearn(node.id);
                onClose();
              }}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              스킬 해금
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function SkillTreeCard({ groupId, userId, canEdit }: SkillTreeCardProps) {
  const {
    data,
    loading,
    stats,
    nodesByTier,
    genres,
    initTree,
    learnSkill,
    resetTree,
  } = useSkillTree(groupId, userId);

  const [isOpen, setIsOpen] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<SkillTreeNode | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    initTree(genre);
    toast.success(`${genre} 스킬 트리가 생성되었습니다`);
  };

  const handleNodeSelect = (node: SkillTreeNode) => {
    if (node.status === "locked") return;
    setSelectedNode(node);
    setDetailOpen(true);
  };

  const handleLearn = (skillId: string) => {
    const ok = learnSkill(skillId);
    if (ok) {
      const node = data?.nodes.find((n) => n.id === skillId);
      toast.success(`"${node?.name ?? "스킬"}" 해금 완료!`);
    } else {
      toast.error("스킬을 해금할 수 없습니다");
    }
  };

  const handleReset = () => {
    resetTree();
    setConfirmReset(false);
    toast.success("스킬 트리가 초기화되었습니다");
  };

  const tiers = Object.keys(nodesByTier)
    .map(Number)
    .sort((a, b) => a - b);

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="py-6 text-center text-xs text-muted-foreground">
          로딩 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 pt-3 px-4 cursor-pointer hover:bg-muted/30 rounded-t-lg transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                  <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                  스킬 트리
                  {data && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 hover:bg-purple-100 ml-1">
                      {data.genre}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  {data && stats.total > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {stats.learned}/{stats.total}
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-1 space-y-4">

              {/* 장르 선택 / 헤더 */}
              <div className="flex items-center gap-2">
                {!data ? (
                  <>
                    <span className="text-xs text-muted-foreground">장르 선택:</span>
                    <Select value={selectedGenre} onValueChange={handleGenreSelect}>
                      <SelectTrigger className="h-7 text-xs w-32">
                        <SelectValue placeholder="장르 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map((g) => (
                          <SelectItem key={g} value={g} className="text-xs">
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <Select
                      value={data.genre}
                      onValueChange={(g) => {
                        if (g !== data.genre) {
                          setSelectedGenre(g);
                          handleGenreSelect(g);
                        }
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map((g) => (
                          <SelectItem key={g} value={g} className="text-xs">
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground px-2"
                        onClick={() => setConfirmReset(true)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        초기화
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* 트리가 없을 때 안내 */}
              {!data && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  장르를 선택하면 스킬 트리가 생성됩니다
                </p>
              )}

              {/* 진행률 바 */}
              {data && stats.total > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">
                      진행률 — 해금 {stats.learned}개 / 전체 {stats.total}개
                    </span>
                    <span className="text-[10px] font-medium text-purple-600">
                      {stats.ratio}%
                    </span>
                  </div>
                  <Progress value={stats.ratio} className="h-1.5" />
                </div>
              )}

              {/* 스킬 트리 시각화 */}
              {data && tiers.length > 0 && (
                <div className="space-y-4">
                  {tiers.map((tier) => {
                    const tierNodes = nodesByTier[tier] ?? [];
                    return (
                      <div key={tier} className="space-y-2">
                        {/* Tier 헤더 */}
                        <div className="flex items-center gap-2">
                          <Badge
                            className={[
                              "text-[10px] px-1.5 py-0",
                              TIER_BADGE_COLORS[tier],
                            ].join(" ")}
                          >
                            Tier {tier} · {TIER_LABELS[tier]}
                          </Badge>
                          <div className="flex-1 h-px bg-border" />
                        </div>

                        {/* 노드 행 */}
                        <div className="flex flex-wrap gap-3 justify-start pl-1">
                          {tierNodes.map((node) => (
                            <div key={node.id} className="flex flex-col items-center gap-1">
                              {/* 상위 연결선 (tier > 1 이고 선행 스킬 있을 때) */}
                              {tier > 1 && node.prerequisiteIds.length > 0 && (
                                <div className="w-px h-4 bg-border" />
                              )}
                              <SkillNode node={node} onSelect={handleNodeSelect} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 범례 */}
              {data && (
                <div className="flex items-center gap-3 pt-1 border-t">
                  <span className="text-[10px] text-muted-foreground">범례</span>
                  {(["locked", "available", "learned"] as SkillTreeNodeStatus[]).map(
                    (status) => (
                      <div key={status} className="flex items-center gap-1">
                        <span
                          className={[
                            "w-3 h-3 rounded-full border",
                            NODE_STYLES[status].border,
                            NODE_STYLES[status].bg,
                          ].join(" ")}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {status === "locked" ? "잠김" : status === "available" ? "해금 가능" : "습득"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 스킬 상세 다이얼로그 */}
      <SkillDetailDialog
        node={selectedNode}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedNode(null);
        }}
        onLearn={handleLearn}
        allNodes={data?.nodes ?? []}
      />

      {/* 초기화 확인 다이얼로그 */}
      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">스킬 트리 초기화</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            모든 스킬 습득 기록이 삭제됩니다. 계속하시겠습니까?
          </p>
          <div className="flex gap-2 justify-end pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setConfirmReset(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              onClick={handleReset}
            >
              초기화
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
