"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  Heart,
  Star,
} from "lucide-react";
import { useCompatibilityMatching } from "@/hooks/use-compatibility-matching";
import type { CompatibilityDimension, CompatibilityPairResult } from "@/types";

// ============================================
// 상수
// ============================================

const ALL_DIMENSIONS: CompatibilityDimension[] = [
  "personality",
  "skill_level",
  "schedule",
  "communication",
  "dance_style",
];

const DIMENSION_LABELS: Record<CompatibilityDimension, string> = {
  personality: "성격",
  skill_level: "실력",
  schedule: "일정",
  communication: "소통",
  dance_style: "댄스 스타일",
};

// ============================================
// 점수 색상 유틸
// ============================================

/** 0~100 점수를 빨강 → 노랑 → 초록 그라데이션으로 변환 */
function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-lime-600";
  if (score >= 40) return "text-yellow-600";
  if (score >= 20) return "text-orange-500";
  return "text-red-500";
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-lime-500";
  if (score >= 40) return "bg-yellow-500";
  if (score >= 20) return "bg-orange-400";
  return "bg-red-400";
}

function getScoreBadgeClass(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-700 hover:bg-green-100";
  if (score >= 60) return "bg-lime-100 text-lime-700 hover:bg-lime-100";
  if (score >= 40) return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
  if (score >= 20)
    return "bg-orange-100 text-orange-700 hover:bg-orange-100";
  return "bg-red-100 text-red-700 hover:bg-red-100";
}

// ============================================
// 슬라이더 컴포넌트 (1~5)
// ============================================

function DimensionSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const levelLabel = ["", "매우 낮음", "낮음", "보통", "높음", "매우 높음"][
    value
  ];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-[10px] font-medium text-foreground">
          {value} / 5
          <span className="ml-1 text-muted-foreground">({levelLabel})</span>
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 accent-blue-500 cursor-pointer"
      />
      <div className="flex justify-between text-[9px] text-muted-foreground px-0.5">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
      </div>
    </div>
  );
}

// ============================================
// 차원별 점수 바 행
// ============================================

function DimensionScoreRow({
  dimension,
  score,
}: {
  dimension: CompatibilityDimension;
  score: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-20 shrink-0">
        {DIMENSION_LABELS[dimension]}
      </span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getScoreBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-[10px] font-semibold w-8 text-right ${getScoreColor(score)}`}>
        {score}
      </span>
    </div>
  );
}

// ============================================
// 호환도 결과 패널
// ============================================

function CompatibilityResult({
  result,
}: {
  result: CompatibilityPairResult;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs font-medium">
          <Heart className="h-3 w-3 text-pink-500" />
          <span>{result.memberA}</span>
          <span className="text-muted-foreground">&</span>
          <span>{result.memberB}</span>
        </div>
        <Badge
          className={`text-[10px] px-1.5 py-0 font-bold ${getScoreBadgeClass(result.overallScore)}`}
        >
          {result.overallScore}%
        </Badge>
      </div>
      <div className="space-y-1.5">
        {ALL_DIMENSIONS.map((dim) => (
          <DimensionScoreRow
            key={dim}
            dimension={dim}
            score={result.dimensionScores[dim]}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// 프로필 추가/수정 다이얼로그
// ============================================

const DEFAULT_DIMENSIONS: Record<CompatibilityDimension, number> = {
  personality: 3,
  skill_level: 3,
  schedule: 3,
  communication: 3,
  dance_style: 3,
};

function ProfileDialog({
  memberNames,
  existingMemberNames,
  initialMemberName,
  initialDimensions,
  onSave,
  trigger,
}: {
  memberNames: string[];
  existingMemberNames: string[];
  initialMemberName?: string;
  initialDimensions?: Record<CompatibilityDimension, number>;
  onSave: (
    memberName: string,
    dimensions: Record<CompatibilityDimension, number>
  ) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(
    initialMemberName ?? ""
  );
  const [dims, setDims] = useState<Record<CompatibilityDimension, number>>(
    initialDimensions ?? { ...DEFAULT_DIMENSIONS }
  );

  // 신규 등록 시 이미 프로필이 있는 멤버 제외
  const availableMembers = initialMemberName
    ? memberNames
    : memberNames.filter((n) => !existingMemberNames.includes(n));

  function handleOpen(v: boolean) {
    if (v) {
      setSelectedMember(initialMemberName ?? "");
      setDims(initialDimensions ?? { ...DEFAULT_DIMENSIONS });
    }
    setOpen(v);
  }

  function handleSave() {
    if (!selectedMember) {
      toast.error("멤버를 선택해 주세요");
      return;
    }
    onSave(selectedMember, dims);
    toast.success(
      `'${selectedMember}' 프로필이 ${initialMemberName ? "수정" : "등록"}되었습니다`
    );
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {initialMemberName ? "프로필 수정" : "프로필 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* 멤버 선택 */}
          {!initialMemberName && (
            <div className="space-y-1.5">
              <Label className="text-xs">멤버</Label>
              {availableMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  등록 가능한 멤버가 없습니다.
                </p>
              ) : (
                <Select
                  value={selectedMember}
                  onValueChange={setSelectedMember}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="멤버 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((name) => (
                      <SelectItem key={name} value={name} className="text-xs">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* 차원별 슬라이더 */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold">호환도 차원 설정</Label>
            {ALL_DIMENSIONS.map((dim) => (
              <DimensionSlider
                key={dim}
                label={DIMENSION_LABELS[dim]}
                value={dims[dim]}
                onChange={(v) => setDims((prev) => ({ ...prev, [dim]: v }))}
              />
            ))}
          </div>

          <Button
            size="sm"
            className="w-full h-8 text-xs"
            onClick={handleSave}
            disabled={!initialMemberName && !selectedMember}
          >
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Props
// ============================================

interface CompatibilityMatchingCardProps {
  groupId: string;
  memberNames: string[];
}

// ============================================
// 메인 컴포넌트
// ============================================

export function CompatibilityMatchingCard({
  groupId,
  memberNames,
}: CompatibilityMatchingCardProps) {
  const {
    profiles,
    setProfile,
    deleteProfile,
    calculateCompatibility,
    getBestMatches,
    profileCount,
    averageCompatibility,
    loading,
  } = useCompatibilityMatching(groupId);

  const [isOpen, setIsOpen] = useState(true);

  // 호환도 확인: 두 멤버 선택
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");

  // 베스트 매치: 멤버 선택
  const [bestMatchMember, setBestMatchMember] = useState("");

  // 삭제 확인 상태
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // 프로필이 있는 멤버 이름 목록
  const existingMemberNames = profiles.map((p) => p.memberName);

  // ── 삭제 핸들러 ─────────────────────────────────────────

  function handleDeleteClick(memberName: string) {
    if (deleteTarget === memberName) {
      deleteProfile(memberName);
      toast.success(`'${memberName}' 프로필이 삭제되었습니다`);
      setDeleteTarget(null);
      // 비교 선택 초기화
      if (compareA === memberName) setCompareA("");
      if (compareB === memberName) setCompareB("");
      if (bestMatchMember === memberName) setBestMatchMember("");
    } else {
      setDeleteTarget(memberName);
      setTimeout(() => {
        setDeleteTarget((prev) => (prev === memberName ? null : prev));
      }, 3000);
    }
  }

  // ── 호환도 계산 결과 ──────────────────────────────────────

  const compareResult =
    compareA && compareB && compareA !== compareB
      ? calculateCompatibility(compareA, compareB)
      : null;

  // ── 베스트 매치 결과 ──────────────────────────────────────

  const bestMatches = bestMatchMember
    ? getBestMatches(bestMatchMember, 3)
    : [];

  // ── 로딩 ────────────────────────────────────────────────

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="py-6 text-center text-xs text-muted-foreground">
          로딩 중...
        </CardContent>
      </Card>
    );
  }

  // 호환도 확인에 사용할 프로필 보유 멤버 목록
  const profiledMembers = profiles.map((p) => p.memberName);

  return (
    <Card className="mt-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* ── 헤더 ─────────────────────────────────────── */}
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 pt-3 px-4 cursor-pointer hover:bg-muted/30 rounded-t-lg transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                멤버 호환도 매칭
                {profileCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 hover:bg-purple-100 ml-1">
                    {profileCount}명
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-1.5">
                {profileCount >= 2 && (
                  <span className="text-[10px] text-muted-foreground">
                    평균 {averageCompatibility}%
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

            {/* ── 프로필 목록 ──────────────────────────── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  프로필
                </span>
                {memberNames.length > 0 &&
                  existingMemberNames.length < memberNames.length && (
                    <ProfileDialog
                      memberNames={memberNames}
                      existingMemberNames={existingMemberNames}
                      onSave={setProfile}
                      trigger={
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                        >
                          <Plus className="h-3 w-3 mr-0.5" />
                          프로필 추가
                        </Button>
                      }
                    />
                  )}
              </div>

              {profiles.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  멤버 프로필을 추가하면 호환도를 확인할 수 있습니다.
                </p>
              ) : (
                <div className="space-y-2">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="rounded-lg border px-3 py-2 space-y-1.5 group/profile"
                    >
                      {/* 멤버 이름 + 액션 */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">
                          {profile.memberName}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover/profile:opacity-100 transition-opacity">
                          <ProfileDialog
                            memberNames={memberNames}
                            existingMemberNames={existingMemberNames}
                            initialMemberName={profile.memberName}
                            initialDimensions={profile.dimensions}
                            onSave={setProfile}
                            trigger={
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteClick(profile.memberName)
                            }
                            title={
                              deleteTarget === profile.memberName
                                ? "한 번 더 클릭하면 삭제됩니다"
                                : "프로필 삭제"
                            }
                            className={`transition-colors ${
                              deleteTarget === profile.memberName
                                ? "text-destructive"
                                : "text-muted-foreground hover:text-destructive"
                            }`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* 차원별 점수 바 */}
                      <div className="space-y-1">
                        {ALL_DIMENSIONS.map((dim) => {
                          const val = profile.dimensions[dim];
                          const pct = ((val - 1) / 4) * 100;
                          return (
                            <div
                              key={dim}
                              className="flex items-center gap-2"
                            >
                              <span className="text-[10px] text-muted-foreground w-20 shrink-0">
                                {DIMENSION_LABELS[dim]}
                              </span>
                              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-400 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground w-4 text-right">
                                {val}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── 호환도 확인 ──────────────────────────── */}
            {profiledMembers.length >= 2 && (
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block">
                  호환도 확인
                </span>
                <div className="flex items-center gap-2">
                  <Select value={compareA} onValueChange={setCompareA}>
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue placeholder="멤버 A" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiledMembers.map((name) => (
                        <SelectItem
                          key={name}
                          value={name}
                          className="text-xs"
                          disabled={name === compareB}
                        >
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">&</span>
                  <Select value={compareB} onValueChange={setCompareB}>
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue placeholder="멤버 B" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiledMembers.map((name) => (
                        <SelectItem
                          key={name}
                          value={name}
                          className="text-xs"
                          disabled={name === compareA}
                        >
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {compareResult && (
                  <CompatibilityResult result={compareResult} />
                )}
              </div>
            )}

            {/* ── 베스트 매치 ──────────────────────────── */}
            {profiledMembers.length >= 2 && (
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block">
                  베스트 매치
                </span>
                <Select
                  value={bestMatchMember}
                  onValueChange={setBestMatchMember}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="멤버 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiledMembers.map((name) => (
                      <SelectItem
                        key={name}
                        value={name}
                        className="text-xs"
                      >
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {bestMatches.length > 0 && (
                  <div className="space-y-1.5">
                    {bestMatches.map((match, idx) => {
                      const partnerName =
                        match.memberA === bestMatchMember
                          ? match.memberB
                          : match.memberA;
                      return (
                        <div
                          key={`${match.memberA}-${match.memberB}`}
                          className="flex items-center gap-2 rounded-md border px-2.5 py-1.5"
                        >
                          <span className="text-[10px] text-muted-foreground w-4 font-semibold">
                            #{idx + 1}
                          </span>
                          <Star
                            className={`h-3 w-3 shrink-0 ${
                              idx === 0
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span className="text-xs font-medium flex-1">
                            {partnerName}
                          </span>
                          <Badge
                            className={`text-[10px] px-1.5 py-0 ${getScoreBadgeClass(match.overallScore)}`}
                          >
                            {match.overallScore}%
                          </Badge>
                        </div>
                      );
                    })}
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
