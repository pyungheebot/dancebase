"use client";

import { useState, useMemo } from "react";
import { useSocialGraph } from "@/hooks/use-social-graph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Network,
} from "lucide-react";
import { toast } from "sonner";
import type { SocialRelationType, SocialRelation } from "@/types";
import type { EntityMember } from "@/types/entity-context";

// ─── 상수 ────────────────────────────────────────────────────

const RELATION_TYPE_LABELS: Record<SocialRelationType, string> = {
  friend: "친구",
  practice_partner: "연습파트너",
  mentor: "멘토",
  rival: "라이벌",
};

const RELATION_TYPE_COLORS: Record<SocialRelationType, string> = {
  friend: "#3b82f6",       // blue
  practice_partner: "#10b981", // green
  mentor: "#8b5cf6",       // purple
  rival: "#f59e0b",        // amber
};

const RELATION_TYPE_BADGE_CLASSES: Record<SocialRelationType, string> = {
  friend: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  practice_partner: "bg-green-100 text-green-700 hover:bg-green-100",
  mentor: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  rival: "bg-amber-100 text-amber-700 hover:bg-amber-100",
};

// ─── SVG 네트워크 그래프 ──────────────────────────────────────

type NetworkGraphProps = {
  relations: SocialRelation[];
  width?: number;
  height?: number;
};

function NetworkGraph({ relations, width = 320, height = 220 }: NetworkGraphProps) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(cx, cy) * 0.72;

  // 고유 멤버 목록 추출
  const members = useMemo(() => {
    const set = new Set<string>();
    for (const r of relations) {
      set.add(r.member1);
      set.add(r.member2);
    }
    return Array.from(set);
  }, [relations]);

  // 원형 배치 좌표 계산
  const positions = useMemo<Record<string, { x: number; y: number }>>(() => {
    const map: Record<string, { x: number; y: number }> = {};
    const n = members.length;
    if (n === 0) return map;
    members.forEach((name, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      map[name] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
    return map;
  }, [members, cx, cy, radius]);

  if (relations.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ width, height }}
      >
        <div className="flex flex-col items-center gap-1.5">
          <Network className="h-8 w-8 text-muted-foreground/40" />
          <span>관계 데이터가 없습니다</span>
        </div>
      </div>
    );
  }

  const NODE_RADIUS = 16;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      {/* 관계 선 */}
      {relations.map((r) => {
        const from = positions[r.member1];
        const to = positions[r.member2];
        if (!from || !to) return null;
        const strokeWidth = Math.max(1, Math.round((r.strength / 10) * 4));
        const color = RELATION_TYPE_COLORS[r.relationType];
        return (
          <line
            key={r.id}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeOpacity={0.55}
          />
        );
      })}

      {/* 멤버 노드 */}
      {members.map((name) => {
        const pos = positions[name];
        if (!pos) return null;

        // 이름 표시: 2글자까지
        const label = name.length <= 2 ? name : name.slice(0, 2);

        return (
          <g key={name}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={NODE_RADIUS}
              fill="hsl(var(--background))"
              stroke="hsl(var(--border))"
              strokeWidth={1.5}
            />
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={10}
              fill="hsl(var(--foreground))"
              fontWeight={500}
            >
              {label}
            </text>
            {/* 이름 라벨 (노드 아래) */}
            <text
              x={pos.x}
              y={pos.y + NODE_RADIUS + 10}
              textAnchor="middle"
              dominantBaseline="auto"
              fontSize={9}
              fill="hsl(var(--muted-foreground))"
            >
              {name.length > 4 ? `${name.slice(0, 4)}…` : name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── 관계 추가 다이얼로그 내용 ────────────────────────────────

type AddRelationFormProps = {
  members: EntityMember[];
  onAdd: (params: {
    member1: string;
    member2: string;
    relationType: SocialRelationType;
    strength: number;
    since: string;
    note: string;
  }) => boolean;
  onClose: () => void;
};

function AddRelationForm({ members, onAdd, onClose }: AddRelationFormProps) {
  const [member1, setMember1] = useState("");
  const [member2, setMember2] = useState("");
  const [relationType, setRelationType] = useState<SocialRelationType>("friend");
  const [strength, setStrength] = useState(5);
  const [since, setSince] = useState("");
  const [note, setNote] = useState("");

  const memberNames = useMemo(
    () => members.map((m) => m.nickname || m.profile.name),
    [members]
  );

  const canSubmit =
    member1 !== "" && member2 !== "" && member1 !== member2;

  const handleSubmit = () => {
    if (!canSubmit) {
      if (member1 === member2) {
        toast.error("서로 다른 멤버를 선택하세요");
      } else {
        toast.error("멤버를 선택하세요");
      }
      return;
    }
    const ok = onAdd({ member1, member2, relationType, strength, since, note });
    if (ok) {
      toast.success("관계가 추가되었습니다");
      onClose();
    }
  };

  return (
    <div className="space-y-3">
      {/* 멤버 1 */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">멤버 1</label>
        <Select value={member1} onValueChange={setMember1}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="멤버를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {memberNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 멤버 2 */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">멤버 2</label>
        <Select value={member2} onValueChange={setMember2}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="멤버를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {memberNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {member1 && member2 && member1 === member2 && (
          <p className="text-[10px] text-destructive">서로 다른 멤버를 선택하세요</p>
        )}
      </div>

      {/* 관계 유형 */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">관계 유형</label>
        <Select
          value={relationType}
          onValueChange={(v) => setRelationType(v as SocialRelationType)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(RELATION_TYPE_LABELS) as [SocialRelationType, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 강도 (1-10) */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          강도
          <span className="ml-1 text-[10px] text-muted-foreground">(현재: {strength})</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-3">1</span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
            className="flex-1 h-1 accent-primary"
          />
          <span className="text-[10px] text-muted-foreground w-4 text-right">10</span>
        </div>
        <div className="flex justify-between px-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <span
              key={n}
              className={`text-[8px] ${n === strength ? "text-primary font-bold" : "text-muted-foreground"}`}
            >
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* 시작일 */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          관계 시작일
          <span className="ml-1 text-[10px] text-muted-foreground">(선택)</span>
        </label>
        <Input
          type="date"
          value={since}
          onChange={(e) => setSince(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* 메모 */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          메모
          <span className="ml-1 text-[10px] text-muted-foreground">(선택)</span>
        </label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="관계에 대한 메모를 입력하세요"
          className="text-sm min-h-[60px] resize-none"
        />
      </div>

      <Button
        className="w-full"
        size="sm"
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        관계 추가
      </Button>
    </div>
  );
}

// ─── 관계 행 컴포넌트 ─────────────────────────────────────────

type RelationRowProps = {
  relation: SocialRelation;
  onDelete: () => void;
  onStrengthChange: (strength: number) => void;
};

function RelationRow({ relation, onDelete, onStrengthChange }: RelationRowProps) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border bg-muted/30">
      {/* 멤버 이름들 */}
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <span className="text-xs font-medium truncate max-w-[56px]">{relation.member1}</span>
        <span className="text-[10px] text-muted-foreground shrink-0">↔</span>
        <span className="text-xs font-medium truncate max-w-[56px]">{relation.member2}</span>
      </div>

      {/* 관계 유형 배지 */}
      <Badge
        className={`text-[10px] px-1.5 py-0 shrink-0 ${RELATION_TYPE_BADGE_CLASSES[relation.relationType]}`}
      >
        {RELATION_TYPE_LABELS[relation.relationType]}
      </Badge>

      {/* 강도 표시 */}
      <div className="flex items-center gap-0.5 shrink-0">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = Math.round(relation.strength / 2) > i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onStrengthChange((i + 1) * 2)}
              className={`w-2 h-2 rounded-full transition-colors ${
                filled ? "bg-primary" : "bg-muted-foreground/25"
              }`}
              title={`강도 ${(i + 1) * 2}`}
            />
          );
        })}
        <span className="text-[9px] text-muted-foreground ml-0.5">{relation.strength}</span>
      </div>

      {/* 삭제 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
        onClick={onDelete}
        title="삭제"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ─── 메인 카드 컴포넌트 ───────────────────────────────────────

type SocialGraphCardProps = {
  groupId: string;
  members: EntityMember[];
};

export function SocialGraphCard({ groupId, members }: SocialGraphCardProps) {
  const {
    relations,
    totalRelations,
    uniqueMembers,
    avgStrength,
    addRelation,
    deleteRelation,
    updateStrength,
    getRelationsForMember,
    getMostConnected,
  } = useSocialGraph(groupId);

  const [isOpen, setIsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const mostConnected = getMostConnected();

  // 선택 멤버 관계 목록
  const memberRelations = useMemo(
    () => (selectedMember ? getRelationsForMember(selectedMember) : relations),
    [selectedMember, relations, getRelationsForMember]
  );

  // 멤버 이름 목록 (관계에 등장하는 멤버)
  const memberNamesInGraph = useMemo(() => {
    const set = new Set<string>();
    for (const r of relations) {
      set.add(r.member1);
      set.add(r.member2);
    }
    return Array.from(set).sort();
  }, [relations]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm font-medium hover:text-foreground/80 transition-colors"
              >
                <Users className="h-4 w-4" />
                멤버 소셜 그래프
                {totalRelations > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100">
                    {totalRelations}
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  관계 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>멤버 관계 추가</DialogTitle>
                </DialogHeader>
                <AddRelationForm
                  members={members}
                  onAdd={addRelation}
                  onClose={() => setDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-4">
            {/* 통계 요약 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md border bg-muted/30 px-2.5 py-2 text-center">
                <div className="text-base font-bold text-foreground">{totalRelations}</div>
                <div className="text-[10px] text-muted-foreground">전체 관계</div>
              </div>
              <div className="rounded-md border bg-muted/30 px-2.5 py-2 text-center">
                <div className="text-base font-bold text-foreground">{uniqueMembers}</div>
                <div className="text-[10px] text-muted-foreground">참여 멤버</div>
              </div>
              <div className="rounded-md border bg-muted/30 px-2.5 py-2 text-center">
                <div className="text-base font-bold text-foreground">{avgStrength}</div>
                <div className="text-[10px] text-muted-foreground">평균 강도</div>
              </div>
            </div>

            {/* 가장 연결이 많은 멤버 */}
            {mostConnected && (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5">
                <Network className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">허브:</span>
                <span className="text-xs font-medium">{mostConnected.name}</span>
                <Badge className="text-[10px] px-1.5 py-0 ml-auto bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                  {mostConnected.count}개 관계
                </Badge>
              </div>
            )}

            {/* SVG 네트워크 그래프 */}
            <div className="flex justify-center overflow-x-auto">
              <NetworkGraph relations={relations} width={320} height={220} />
            </div>

            {/* 범례 */}
            {relations.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(RELATION_TYPE_LABELS) as [SocialRelationType, string][]).map(
                  ([type, label]) => {
                    const count = relations.filter((r) => r.relationType === type).length;
                    if (count === 0) return null;
                    return (
                      <div key={type} className="flex items-center gap-1">
                        <div
                          className="w-2.5 h-1.5 rounded-sm"
                          style={{ backgroundColor: RELATION_TYPE_COLORS[type] }}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {label} ({count})
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            )}

            {/* 멤버 필터 */}
            {memberNamesInGraph.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedMember(null)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      selectedMember === null
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    전체
                  </button>
                  {memberNamesInGraph.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() =>
                        setSelectedMember(selectedMember === name ? null : name)
                      }
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        selectedMember === name
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-foreground"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 관계 목록 */}
            {memberRelations.length === 0 ? (
              <p className="text-xs text-muted-foreground py-1">
                {relations.length === 0
                  ? "관계 추가 버튼을 눌러 멤버 간 관계를 기록하세요."
                  : "선택된 멤버의 관계가 없습니다."}
              </p>
            ) : (
              <div className="space-y-1.5">
                {memberRelations.map((relation) => (
                  <RelationRow
                    key={relation.id}
                    relation={relation}
                    onDelete={() => {
                      const ok = deleteRelation(relation.id);
                      if (ok) toast.success("관계가 삭제되었습니다");
                    }}
                    onStrengthChange={(strength) => {
                      updateStrength(relation.id, strength);
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
