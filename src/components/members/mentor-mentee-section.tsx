"use client";

import { useState, useMemo } from "react";
import { useMentorMentee } from "@/hooks/use-mentor-mentee";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Users, ArrowRight, Star, Check, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { EntityMember } from "@/types/entity-context";

type MentorMenteeSectionProps = {
  groupId: string;
  members: EntityMember[];
  canManage: boolean;
};

export function MentorMenteeSection({
  groupId,
  members,
  canManage,
}: MentorMenteeSectionProps) {
  const {
    activeMatches,
    completedMatches,
    loading,
    skills,
    skillsLoading,
    getRecommendations,
    createMatch,
    completeMatch,
    deleteMatch,
  } = useMentorMentee(groupId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  // 멤버 이름 맵 (userId → displayName)
  const memberNameMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const m of members) {
      map[m.userId] = m.nickname || m.profile.name;
    }
    return map;
  }, [members]);

  const recommendations = useMemo(
    () => getRecommendations(memberNameMap),
    [getRecommendations, memberNameMap]
  );

  // 고유 스킬 이름 목록
  const skillNames = useMemo(
    () => Array.from(new Set(skills.map((s) => s.skill_name))).sort(),
    [skills]
  );

  if (loading) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            멘토-멘티 매칭
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-xs text-muted-foreground">불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            멘토-멘티 매칭
            {activeMatches.length > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100">
                {activeMatches.length}
              </Badge>
            )}
          </CardTitle>
          {canManage && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  매칭 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>멘토-멘티 매칭 추가</DialogTitle>
                </DialogHeader>
                <MatchCreateForm
                  groupId={groupId}
                  members={members}
                  memberNameMap={memberNameMap}
                  skillNames={skillNames}
                  recommendations={recommendations}
                  skillsLoading={skillsLoading}
                  onCreated={() => {
                    setDialogOpen(false);
                    toast.success("매칭이 추가되었습니다");
                  }}
                  createMatch={createMatch}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-2">
        {activeMatches.length === 0 && completedMatches.length === 0 ? (
          <p className="text-xs text-muted-foreground py-1">
            {canManage
              ? "매칭 추가 버튼을 눌러 멘토-멘티를 연결하세요."
              : "등록된 매칭이 없습니다."}
          </p>
        ) : (
          <>
            {/* 활성 매칭 목록 */}
            {activeMatches.length === 0 ? (
              <p className="text-xs text-muted-foreground">활성 매칭이 없습니다.</p>
            ) : (
              <div className="space-y-1.5">
                {activeMatches.map((match) => (
                  <MatchRow
                    key={match.id}
                    match={match}
                    canManage={canManage}
                    onComplete={() => {
                      completeMatch(match.id);
                      toast.success("매칭이 완료 처리되었습니다");
                    }}
                    onDelete={() => {
                      deleteMatch(match.id);
                      toast.success("매칭이 삭제되었습니다");
                    }}
                  />
                ))}
              </div>
            )}

            {/* 완료된 매칭 토글 */}
            {completedMatches.length > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowCompleted((v) => !v)}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline"
                >
                  {showCompleted
                    ? "완료된 매칭 숨기기"
                    : `완료된 매칭 보기 (${completedMatches.length})`}
                </button>
                {showCompleted && (
                  <div className="mt-1.5 space-y-1.5 opacity-60">
                    {completedMatches.map((match) => (
                      <MatchRow
                        key={match.id}
                        match={match}
                        canManage={canManage}
                        onComplete={undefined}
                        onDelete={() => {
                          deleteMatch(match.id);
                          toast.success("매칭이 삭제되었습니다");
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// 매칭 행 컴포넌트
// ============================================

function MatchRow({
  match,
  canManage,
  onComplete,
  onDelete,
}: {
  match: import("@/types").MentorMenteeMatch;
  canManage: boolean;
  onComplete: (() => void) | undefined;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border bg-muted/30">
      {/* 멘토 */}
      <div className="flex items-center gap-1.5 min-w-0">
        <Avatar className="h-5 w-5 shrink-0">
          <AvatarFallback className="text-[10px]">
            {match.mentorName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium truncate max-w-[64px]">{match.mentorName}</span>
        <Star className="h-3 w-3 text-yellow-500 shrink-0" />
      </div>

      {/* 화살표 */}
      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />

      {/* 멘티 */}
      <div className="flex items-center gap-1.5 min-w-0">
        <Avatar className="h-5 w-5 shrink-0">
          <AvatarFallback className="text-[10px]">
            {match.menteeName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs truncate max-w-[64px]">{match.menteeName}</span>
      </div>

      {/* 스킬 태그 */}
      <Badge
        variant="outline"
        className="text-[10px] px-1.5 py-0 ml-auto shrink-0 border-purple-300 text-purple-700"
      >
        {match.skillTag}
      </Badge>

      {/* 상태 배지 */}
      {match.status === "completed" && (
        <Badge className="text-[10px] px-1.5 py-0 shrink-0 bg-green-100 text-green-700 hover:bg-green-100">
          완료
        </Badge>
      )}

      {/* 액션 버튼 (canManage일 때만) */}
      {canManage && (
        <div className="flex items-center gap-0.5 shrink-0">
          {onComplete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-green-600"
              title="매칭 완료"
              aria-label="매칭 완료"
              onClick={onComplete}
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-destructive"
            title="삭제"
            aria-label="삭제"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// 매칭 생성 폼 컴포넌트
// ============================================

type MatchCreateFormProps = {
  groupId: string;
  members: EntityMember[];
  memberNameMap: Record<string, string>;
  skillNames: string[];
  recommendations: import("@/hooks/use-mentor-mentee").SkillRecommendation[];
  skillsLoading: boolean;
  onCreated: () => void;
  createMatch: (params: {
    mentorId: string;
    mentorName: string;
    menteeId: string;
    menteeName: string;
    skillTag: string;
  }) => import("@/types").MentorMenteeMatch;
};

function MatchCreateForm({
  members,
  memberNameMap,
  skillNames,
  recommendations,
  skillsLoading,
  onCreated,
  createMatch,
}: MatchCreateFormProps) {
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [mentorId, setMentorId] = useState<string>("");
  const [menteeId, setMenteeId] = useState<string>("");

  const recommendation = useMemo(
    () => recommendations.find((r) => r.skillName === selectedSkill) ?? null,
    [recommendations, selectedSkill]
  );

  const handleSkillChange = (value: string) => {
    setSelectedSkill(value);
    setMentorId("");
    setMenteeId("");
  };

  // 스킬 선택 시 멘토/멘티 후보 (없으면 전체 멤버)
  const mentorOptions = useMemo(() => {
    if (!selectedSkill) return members;
    if (!recommendation || recommendation.mentorCandidates.length === 0) return members;
    return members.filter((m) =>
      recommendation.mentorCandidates.some((c) => c.userId === m.userId)
    );
  }, [selectedSkill, recommendation, members]);

  const menteeOptions = useMemo(() => {
    if (!selectedSkill) return members;
    if (!recommendation || recommendation.menteeCandidates.length === 0) return members;
    return members.filter((m) =>
      recommendation.menteeCandidates.some((c) => c.userId === m.userId)
    );
  }, [selectedSkill, recommendation, members]);

  const getSkillLevel = (userId: string, type: "mentor" | "mentee"): number | null => {
    if (!recommendation) return null;
    const list =
      type === "mentor"
        ? recommendation.mentorCandidates
        : recommendation.menteeCandidates;
    return list.find((c) => c.userId === userId)?.skillLevel ?? null;
  };

  const canSubmit =
    selectedSkill.trim() !== "" &&
    mentorId !== "" &&
    menteeId !== "" &&
    mentorId !== menteeId;

  const handleSubmit = () => {
    if (!canSubmit) {
      if (mentorId === menteeId) {
        toast.error("멘토와 멘티를 다른 멤버로 선택하세요");
        return;
      }
      toast.error("모든 항목을 선택하세요");
      return;
    }

    createMatch({
      mentorId,
      mentorName: memberNameMap[mentorId] ?? mentorId,
      menteeId,
      menteeName: memberNameMap[menteeId] ?? menteeId,
      skillTag: selectedSkill,
    });

    onCreated();
  };

  return (
    <div className="space-y-4">
      {/* 스킬 선택 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">스킬 선택</label>
        {skillsLoading ? (
          <p className="text-xs text-muted-foreground">스킬 불러오는 중...</p>
        ) : skillNames.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            등록된 스킬이 없습니다. 먼저 멤버 역량 맵에서 스킬을 추가하세요.
          </p>
        ) : (
          <Select value={selectedSkill} onValueChange={handleSkillChange}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="스킬을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {skillNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 멘토 선택 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          멘토 선택
          {recommendation && recommendation.mentorCandidates.length > 0 && (
            <span className="ml-1 text-[10px] text-blue-600">
              (레벨 3 이상 자동 추천)
            </span>
          )}
        </label>
        <Select value={mentorId} onValueChange={setMentorId} disabled={!selectedSkill && skillNames.length > 0}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="멘토를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {mentorOptions.map((m) => {
              const displayName = m.nickname || m.profile.name;
              const level = getSkillLevel(m.userId, "mentor");
              return (
                <SelectItem key={m.userId} value={m.userId}>
                  <span className="flex items-center gap-1.5">
                    {displayName}
                    {level !== null && (
                      <span className="text-[10px] text-muted-foreground">
                        Lv.{level}
                      </span>
                    )}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* 멘티 선택 */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          멘티 선택
          {recommendation && recommendation.menteeCandidates.length > 0 && (
            <span className="ml-1 text-[10px] text-orange-600">
              (레벨 2 이하 자동 추천)
            </span>
          )}
        </label>
        <Select value={menteeId} onValueChange={setMenteeId} disabled={!selectedSkill && skillNames.length > 0}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="멘티를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {menteeOptions.map((m) => {
              const displayName = m.nickname || m.profile.name;
              const level = getSkillLevel(m.userId, "mentee");
              return (
                <SelectItem key={m.userId} value={m.userId}>
                  <span className="flex items-center gap-1.5">
                    {displayName}
                    {level !== null && (
                      <span className="text-[10px] text-muted-foreground">
                        Lv.{level}
                      </span>
                    )}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* 경고: 같은 멤버 선택 */}
      {mentorId && menteeId && mentorId === menteeId && (
        <p className="text-xs text-destructive">멘토와 멘티를 다른 멤버로 선택하세요.</p>
      )}

      <Button className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
        매칭 추가
      </Button>
    </div>
  );
}
