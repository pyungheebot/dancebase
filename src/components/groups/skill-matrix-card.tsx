"use client";

import { useState, KeyboardEvent } from "react";
import { useSkillMatrixData } from "@/hooks/use-skill-matrix-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Grid3X3,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  UserPlus,
  X,
  Target,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { SkillMatrixLevel } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================
// 상수
// ============================================

const LEVEL_LABELS: Record<SkillMatrixLevel, string> = {
  0: "미평가",
  1: "초급",
  2: "입문",
  3: "중급",
  4: "고급",
  5: "마스터",
};

const DEFAULT_SKILLS = [
  "턴",
  "점프",
  "플로어워크",
  "아이솔레이션",
  "웨이브",
  "파워무브",
  "풋워크",
  "팝핑",
  "락킹",
  "힙합",
];

const SKILL_CATEGORIES = [
  "기초기술",
  "파워무브",
  "스타일",
  "표현력",
  "리듬감",
  "유연성",
  "기타",
];

// ============================================
// 스타일 헬퍼
// ============================================

function getLevelBg(level: SkillMatrixLevel): string {
  switch (level) {
    case 1: return "bg-red-200";
    case 2: return "bg-orange-200";
    case 3: return "bg-yellow-200";
    case 4: return "bg-green-200";
    case 5: return "bg-emerald-400";
    default: return "bg-gray-100";
  }
}

function getLevelText(level: SkillMatrixLevel): string {
  return level === 5
    ? "text-white"
    : level === 0
    ? "text-gray-400"
    : "text-gray-700";
}

// ============================================
// 셀 컴포넌트 (현재 레벨 클릭 순환)
// ============================================

function MatrixCell({
  level,
  targetLevel,
  onClick,
}: {
  level: SkillMatrixLevel;
  targetLevel?: SkillMatrixLevel;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={onClick}
        title={`${LEVEL_LABELS[level]} (클릭하여 변경)`}
        className={[
          "w-9 h-7 rounded flex items-center justify-center",
          "transition-opacity hover:opacity-70 cursor-pointer select-none",
          getLevelBg(level),
          getLevelText(level),
        ].join(" ")}
      >
        <span className="text-[10px] font-semibold">
          {level === 0 ? "-" : level}
        </span>
      </button>
      {targetLevel !== undefined && targetLevel > 0 && (
        <span className="text-[9px] text-muted-foreground leading-none">
          목표{targetLevel}
        </span>
      )}
    </div>
  );
}

// ============================================
// 기술 상세 설정 다이얼로그
// ============================================

type SkillDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberName: string;
  skillName: string;
  currentLevel: SkillMatrixLevel;
  targetLevel?: SkillMatrixLevel;
  lastEvaluatedAt?: string;
  note?: string;
  onSave: (params: {
    targetLevel?: SkillMatrixLevel;
    lastEvaluatedAt?: string;
    note?: string;
  }) => void;
};

function SkillDetailDialog({
  open,
  onOpenChange,
  memberName,
  skillName,
  currentLevel,
  targetLevel,
  lastEvaluatedAt,
  note,
  onSave,
}: SkillDetailDialogProps) {
  const [localTarget, setLocalTarget] = useState<SkillMatrixLevel | undefined>(targetLevel);
  const [localDate, setLocalDate] = useState(lastEvaluatedAt ?? "");
  const [localNote, setLocalNote] = useState(note ?? "");

  function handleSave() {
    onSave({
      targetLevel: localTarget,
      lastEvaluatedAt: localDate || undefined,
      note: localNote.trim() || undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {memberName} - {skillName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* 현재 레벨 표시 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20">현재 레벨</span>
            <Badge
              className={[
                "text-[10px] px-2 py-0.5",
                getLevelBg(currentLevel),
                getLevelText(currentLevel),
                "hover:opacity-100",
              ].join(" ")}
            >
              {currentLevel === 0 ? "미평가" : `${currentLevel} ${LEVEL_LABELS[currentLevel]}`}
            </Badge>
          </div>

          {/* 목표 레벨 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20">목표 레벨</span>
            <div className="flex items-center gap-1">
              {([0, 1, 2, 3, 4, 5] as SkillMatrixLevel[]).map((lv) => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => setLocalTarget(lv === 0 ? undefined : lv)}
                  className={[
                    "w-7 h-6 rounded text-[10px] font-medium transition-colors",
                    (localTarget ?? 0) === lv
                      ? `${getLevelBg(lv)} ${getLevelText(lv)} ring-1 ring-offset-1 ring-gray-400`
                      : "bg-muted text-muted-foreground hover:bg-muted/70",
                  ].join(" ")}
                >
                  {lv === 0 ? "-" : lv}
                </button>
              ))}
            </div>
          </div>

          {/* 최종 평가일 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20">최종 평가일</span>
            <Input
              type="date"
              value={localDate}
              onChange={(e) => setLocalDate(e.target.value)}
              className="h-7 text-xs flex-1"
            />
          </div>

          {/* 메모 */}
          <div className="flex items-start gap-2">
            <span className="text-xs text-muted-foreground w-20 pt-1">메모</span>
            <Input
              value={localNote}
              onChange={(e) => setLocalNote(e.target.value)}
              placeholder="간단한 메모"
              className="h-7 text-xs flex-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Props 타입
// ============================================

type SkillMatrixCardProps = {
  groupId: string;
};

// ============================================
// 메인 컴포넌트
// ============================================

export function SkillMatrixCard({ groupId }: SkillMatrixCardProps) {
  const {
    data,
    loading,
    addSkill,
    removeSkill,
    addMember,
    removeMember,
    cycleCurrentLevel,
    updateScore,
    getSkillAvg,
    overallAvg,
    totalSkills,
    totalMembers,
  } = useSkillMatrixData(groupId);

  const [isOpen, setIsOpen] = useState(true);
  const [skillInput, setSkillInput] = useState("");
  const [skillCategory, setSkillCategory] = useState<string>("");
  const [memberInput, setMemberInput] = useState("");

  // 삭제 확인 상태
  const [deleteSkillTarget, setDeleteSkillTarget] = useState<string | null>(null);
  const [deleteMemberTarget, setDeleteMemberTarget] = useState<string | null>(null);

  // 상세 다이얼로그 상태
  const [detailDialog, setDetailDialog] = useState<{
    memberName: string;
    skillId: string;
  } | null>(null);

  // ── 스킬 추가 ────────────────────────────────────────────

  function handleAddSkill() {
    const name = skillInput.trim();
    if (!name) {
      toast.error(TOAST.SKILL_MATRIX.SKILL_NAME_REQUIRED);
      return;
    }
    const ok = addSkill({ name, category: skillCategory || undefined });
    if (!ok) {
      toast.error(TOAST.SKILL_MATRIX.SKILL_EXISTS);
      return;
    }
    toast.success(`'${name}' 기술이 추가되었습니다`);
    setSkillInput("");
    setSkillCategory("");
  }

  function handleSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAddSkill();
  }

  // ── 멤버 추가 ────────────────────────────────────────────

  function handleAddMember() {
    const name = memberInput.trim();
    if (!name) {
      toast.error(TOAST.SKILL_MATRIX.MEMBER_REQUIRED);
      return;
    }
    const ok = addMember(name);
    if (!ok) {
      toast.error(TOAST.SKILL_MATRIX.MEMBER_EXISTS);
      return;
    }
    toast.success(`'${name}' 멤버가 추가되었습니다`);
    setMemberInput("");
  }

  function handleMemberKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAddMember();
  }

  // ── 스킬 삭제 (더블클릭 확인) ─────────────────────────────

  function handleSkillDeleteClick(skillId: string) {
    if (deleteSkillTarget === skillId) {
      const skill = data.skills.find((s) => s.id === skillId);
      removeSkill(skillId);
      toast.success(`'${skill?.name}' 기술이 삭제되었습니다`);
      setDeleteSkillTarget(null);
    } else {
      setDeleteSkillTarget(skillId);
      setTimeout(() => {
        setDeleteSkillTarget((prev) => (prev === skillId ? null : prev));
      }, 3000);
    }
  }

  // ── 멤버 삭제 (더블클릭 확인) ─────────────────────────────

  function handleMemberDeleteClick(memberName: string) {
    if (deleteMemberTarget === memberName) {
      removeMember(memberName);
      toast.success(`'${memberName}' 멤버가 삭제되었습니다`);
      setDeleteMemberTarget(null);
    } else {
      setDeleteMemberTarget(memberName);
      setTimeout(() => {
        setDeleteMemberTarget((prev) => (prev === memberName ? null : prev));
      }, 3000);
    }
  }

  // ── 상세 다이얼로그 열기 ─────────────────────────────────

  function openDetail(memberName: string, skillId: string) {
    setDetailDialog({ memberName, skillId });
  }

  // ── 상세 저장 ────────────────────────────────────────────

  function handleDetailSave(params: {
    targetLevel?: SkillMatrixLevel;
    lastEvaluatedAt?: string;
    note?: string;
  }) {
    if (!detailDialog) return;
    updateScore(detailDialog.memberName, detailDialog.skillId, params);
    toast.success(TOAST.SKILL_MATRIX.UPDATED);
  }

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

  // ── 상세 다이얼로그 데이터 계산 ──────────────────────────

  const detailData = detailDialog
    ? (() => {
        const skill = data.skills.find((s) => s.id === detailDialog.skillId);
        const member = data.members.find(
          (m) => m.memberName === detailDialog.memberName
        );
        const score = member?.scores[detailDialog.skillId];
        return {
          skillName: skill?.name ?? "",
          currentLevel: (score?.currentLevel ?? 0) as SkillMatrixLevel,
          targetLevel: score?.targetLevel,
          lastEvaluatedAt: score?.lastEvaluatedAt,
          note: score?.note,
        };
      })()
    : null;

  return (
    <>
      <Card className="mt-4">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* ── 헤더 ──────────────────────────────────────── */}
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-2 pt-3 px-4 cursor-pointer hover:bg-muted/30 rounded-t-lg transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                  <Grid3X3 className="h-3.5 w-3.5 text-muted-foreground" />
                  기술 매트릭스
                  {totalMembers > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100 ml-1">
                      멤버 {totalMembers}
                    </Badge>
                  )}
                  {totalSkills > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 hover:bg-purple-100">
                      기술 {totalSkills}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  {overallAvg > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      전체 평균 {overallAvg}
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
            <CardContent className="px-4 pb-4 pt-1 space-y-3">

              {/* ── 입력 영역 ────────────────────────────── */}
              <div className="flex flex-col gap-2 sm:flex-row">
                {/* 기술 추가 */}
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    placeholder="기술 추가 (예: 턴, 점프)"
                    className="h-7 text-xs flex-1"
                  />
                  <Select value={skillCategory} onValueChange={setSkillCategory}>
                    <SelectTrigger className="h-7 text-xs w-24 shrink-0">
                      <SelectValue placeholder="분류" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">
                        분류 없음
                      </SelectItem>
                      {SKILL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-xs">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs shrink-0 px-2"
                    onClick={handleAddSkill}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    기술
                  </Button>
                </div>

                {/* 멤버 추가 */}
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={memberInput}
                    onChange={(e) => setMemberInput(e.target.value)}
                    onKeyDown={handleMemberKeyDown}
                    placeholder="멤버 추가 (예: 홍길동)"
                    className="h-7 text-xs flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs shrink-0 px-2"
                    onClick={handleAddMember}
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    멤버
                  </Button>
                </div>
              </div>

              {/* ── 기본 기술 제안 칩 ─────────────────────── */}
              {totalSkills < DEFAULT_SKILLS.length && (
                <div className="flex flex-wrap gap-1">
                  {DEFAULT_SKILLS.filter(
                    (name) => !data.skills.some((s) => s.name === name)
                  ).map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSkillInput(name)}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted hover:bg-muted/70 transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              {/* ── 레벨 범례 ────────────────────────────── */}
              {(totalMembers > 0 || totalSkills > 0) && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">레벨:</span>
                  {([0, 1, 2, 3, 4, 5] as SkillMatrixLevel[]).map((lv) => (
                    <span
                      key={lv}
                      className={[
                        "text-[10px] px-1.5 py-0.5 rounded",
                        getLevelBg(lv),
                        getLevelText(lv),
                      ].join(" ")}
                    >
                      {lv === 0 ? "-" : lv} {LEVEL_LABELS[lv]}
                    </span>
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-1 flex items-center gap-0.5">
                    <Target className="h-2.5 w-2.5" />
                    목표N 표시
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <CalendarIcon className="h-2.5 w-2.5" />
                    우클릭으로 상세 설정
                  </span>
                </div>
              )}

              {/* ── 빈 상태 안내 ────────────────────────── */}
              {totalMembers === 0 && totalSkills === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  기술과 멤버를 추가하면 스킬 매트릭스를 관리할 수 있습니다.
                </p>
              )}
              {totalSkills === 0 && totalMembers > 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  위 입력란에서 기술을 추가해 주세요.
                </p>
              )}
              {totalMembers === 0 && totalSkills > 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  위 입력란에서 멤버를 추가해 주세요.
                </p>
              )}

              {/* ── 매트릭스 테이블 ──────────────────────── */}
              {totalMembers > 0 && totalSkills > 0 && (
                <div className="overflow-x-auto">
                  <table className="text-xs border-collapse min-w-full">
                    <thead>
                      <tr>
                        {/* 멤버 헤더 */}
                        <th className="text-left pr-3 pb-2 font-medium text-muted-foreground whitespace-nowrap min-w-[80px]">
                          멤버
                        </th>

                        {/* 기술 헤더 */}
                        {data.skills.map((skill) => (
                          <th
                            key={skill.id}
                            className="pb-2 px-1 font-medium text-center min-w-[60px]"
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="whitespace-nowrap text-[11px]">
                                {skill.name}
                              </span>
                              {skill.category && (
                                <span className="text-[9px] text-muted-foreground leading-none">
                                  {skill.category}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleSkillDeleteClick(skill.id)}
                                title={
                                  deleteSkillTarget === skill.id
                                    ? "한 번 더 클릭하면 삭제됩니다"
                                    : "기술 삭제"
                                }
                                className={[
                                  "transition-colors",
                                  deleteSkillTarget === skill.id
                                    ? "text-destructive"
                                    : "text-muted-foreground hover:text-destructive",
                                ].join(" ")}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                              {deleteSkillTarget === skill.id && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteSkillTarget(null);
                                  }}
                                  className="text-[9px] text-muted-foreground underline leading-none"
                                >
                                  취소
                                </button>
                              )}
                            </div>
                          </th>
                        ))}

                        {/* 평균 헤더 */}
                        <th className="pb-2 px-1 font-medium text-center text-muted-foreground min-w-[40px] text-[11px]">
                          평균
                        </th>
                        {/* 멤버 삭제 헤더 */}
                        <th className="pb-2 px-1 text-center w-6" />
                      </tr>
                    </thead>

                    <tbody>
                      {data.members.map((member) => {
                        const memberAvgVal = (() => {
                          const levels: number[] = data.skills
                            .map((s) => (member.scores[s.id]?.currentLevel ?? 0) as number)
                            .filter((lv) => lv > 0);
                          if (levels.length === 0) return 0;
                          return (
                            Math.round(
                              (levels.reduce((a: number, b: number) => a + b, 0) / levels.length) * 10
                            ) / 10
                          );
                        })();

                        return (
                          <tr key={member.memberName} className="group/row">
                            {/* 멤버 이름 */}
                            <td className="pr-3 py-1 font-medium whitespace-nowrap text-muted-foreground">
                              {member.memberName}
                            </td>

                            {/* 기술별 셀 */}
                            {data.skills.map((skill) => {
                              const score = member.scores[skill.id];
                              const currentLevel = (score?.currentLevel ?? 0) as SkillMatrixLevel;
                              const targetLevel = score?.targetLevel;
                              const lastEval = score?.lastEvaluatedAt;

                              return (
                                <td key={skill.id} className="py-1 px-1 text-center">
                                  <div
                                    className="flex flex-col items-center gap-0"
                                    onContextMenu={(e) => {
                                      e.preventDefault();
                                      openDetail(member.memberName, skill.id);
                                    }}
                                  >
                                    <MatrixCell
                                      level={currentLevel}
                                      targetLevel={targetLevel}
                                      onClick={() =>
                                        cycleCurrentLevel(member.memberName, skill.id)
                                      }
                                    />
                                    {lastEval && (
                                      <span className="text-[8px] text-muted-foreground leading-none mt-0.5">
                                        {formatYearMonthDay(lastEval)}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}

                            {/* 멤버 평균 */}
                            <td className="py-1 px-1 text-center">
                              <div className="w-9 h-7 rounded bg-muted/60 mx-auto flex items-center justify-center">
                                <span className="text-[10px] font-semibold text-muted-foreground">
                                  {memberAvgVal === 0 ? "-" : memberAvgVal}
                                </span>
                              </div>
                            </td>

                            {/* 멤버 삭제 */}
                            <td className="py-1 px-1 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  handleMemberDeleteClick(member.memberName)
                                }
                                title={
                                  deleteMemberTarget === member.memberName
                                    ? "한 번 더 클릭하면 삭제됩니다"
                                    : "멤버 삭제"
                                }
                                className={[
                                  "transition-colors opacity-0 group-hover/row:opacity-100",
                                  deleteMemberTarget === member.memberName
                                    ? "text-destructive opacity-100"
                                    : "text-muted-foreground hover:text-destructive",
                                ].join(" ")}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* 기술별 평균 행 */}
                      <tr className="border-t border-border">
                        <td className="pr-3 pt-2 pb-1 font-semibold text-muted-foreground whitespace-nowrap">
                          평균
                        </td>
                        {data.skills.map((skill) => {
                          const avg = getSkillAvg(skill.id);
                          return (
                            <td key={skill.id} className="pt-2 pb-1 px-1 text-center">
                              <div className="w-9 h-7 rounded bg-muted/60 mx-auto flex items-center justify-center">
                                <span className="text-[10px] font-semibold text-muted-foreground">
                                  {avg === 0 ? "-" : avg}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                        <td className="pt-2 pb-1 px-1 text-center">
                          <div className="w-9 h-7 rounded bg-blue-50 mx-auto flex items-center justify-center">
                            <span className="text-[10px] font-semibold text-blue-600">
                              {overallAvg === 0 ? "-" : overallAvg}
                            </span>
                          </div>
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── 안내 문구 ────────────────────────────── */}
              {totalMembers > 0 && totalSkills > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  셀을 클릭하면 레벨이 순환됩니다. 우클릭하면 목표 레벨·평가일을 설정할 수 있습니다.
                </p>
              )}

            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* ── 상세 설정 다이얼로그 ─────────────────────────────── */}
      {detailDialog && detailData && (
        <SkillDetailDialog
          open={!!detailDialog}
          onOpenChange={(open) => {
            if (!open) setDetailDialog(null);
          }}
          memberName={detailDialog.memberName}
          skillName={detailData.skillName}
          currentLevel={detailData.currentLevel}
          targetLevel={detailData.targetLevel}
          lastEvaluatedAt={detailData.lastEvaluatedAt}
          note={detailData.note}
          onSave={handleDetailSave}
        />
      )}
    </>
  );
}
