"use client";

import { useState, KeyboardEvent } from "react";
import { useSkillMatrix } from "@/hooks/use-skill-matrix";
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
  Grid3X3,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { SkillMatrixLevel } from "@/types";

// ============================================
// 레벨 관련 스타일 헬퍼
// ============================================

const LEVEL_LABELS: Record<SkillMatrixLevel, string> = {
  0: "미평가",
  1: "초급",
  2: "입문",
  3: "중급",
  4: "고급",
  5: "마스터",
};

function getLevelBg(level: SkillMatrixLevel): string {
  switch (level) {
    case 1:
      return "bg-red-200";
    case 2:
      return "bg-orange-200";
    case 3:
      return "bg-yellow-200";
    case 4:
      return "bg-green-200";
    case 5:
      return "bg-emerald-400";
    default:
      return "bg-gray-100";
  }
}

function getLevelText(level: SkillMatrixLevel): string {
  return level === 5 ? "text-white" : level === 0 ? "text-gray-400" : "text-gray-700";
}

// 레벨 순환: 0→1→2→3→4→5→0
function cycleLevel(current: SkillMatrixLevel): SkillMatrixLevel {
  return ((current + 1) % 6) as SkillMatrixLevel;
}

// ============================================
// 셀 컴포넌트
// ============================================

function MatrixCell({
  level,
  onClick,
}: {
  level: SkillMatrixLevel;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${LEVEL_LABELS[level]} (클릭하여 변경)`}
      className={[
        "w-9 h-7 rounded flex items-center justify-center mx-auto",
        "transition-opacity hover:opacity-70 cursor-pointer select-none",
        getLevelBg(level),
        getLevelText(level),
      ].join(" ")}
    >
      <span className="text-[10px] font-semibold">
        {level === 0 ? "-" : level}
      </span>
    </button>
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
    config,
    loading,
    addSkill,
    removeSkill,
    addMember,
    removeMember,
    updateLevel,
    getSkillAvg,
    totalMembers,
    totalSkills,
    overallAvg,
  } = useSkillMatrix(groupId);

  const [isOpen, setIsOpen] = useState(true);
  const [skillInput, setSkillInput] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [deleteSkillTarget, setDeleteSkillTarget] = useState<string | null>(null);
  const [deleteMemberTarget, setDeleteMemberTarget] = useState<string | null>(null);

  // ── 스킬 추가 핸들러 ────────────────────────────────────

  function handleAddSkill() {
    const name = skillInput.trim();
    if (!name) {
      toast.error(TOAST.MEMBERS.SKILL_MATRIX_CARD_SKILL_REQUIRED);
      return;
    }
    const ok = addSkill(name);
    if (!ok) {
      toast.error(TOAST.MEMBERS.SKILL_MATRIX_CARD_SKILL_DUPLICATE);
      return;
    }
    toast.success(`'${name}' 스킬이 추가되었습니다`);
    setSkillInput("");
  }

  function handleSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAddSkill();
  }

  // ── 멤버 추가 핸들러 ────────────────────────────────────

  function handleAddMember() {
    const name = memberInput.trim();
    if (!name) {
      toast.error(TOAST.MEMBERS.SKILL_MATRIX_CARD_MEMBER_REQUIRED);
      return;
    }
    const ok = addMember(name);
    if (!ok) {
      toast.error(TOAST.MEMBERS.SKILL_MATRIX_CARD_MEMBER_DUPLICATE);
      return;
    }
    toast.success(`'${name}' 멤버가 추가되었습니다`);
    setMemberInput("");
  }

  function handleMemberKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAddMember();
  }

  // ── 스킬 삭제 핸들러 (더블클릭 확인) ─────────────────────

  function handleSkillDeleteClick(skillName: string) {
    if (deleteSkillTarget === skillName) {
      removeSkill(skillName);
      toast.success(`'${skillName}' 스킬이 삭제되었습니다`);
      setDeleteSkillTarget(null);
    } else {
      setDeleteSkillTarget(skillName);
      // 3초 후 자동 취소
      setTimeout(() => {
        setDeleteSkillTarget((prev) => (prev === skillName ? null : prev));
      }, 3000);
    }
  }

  // ── 멤버 삭제 핸들러 (더블클릭 확인) ─────────────────────

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

  // ── 셀 클릭: 레벨 순환 ──────────────────────────────────

  function handleCellClick(memberName: string, skillName: string) {
    const currentLevel = (config.entries.find((e) => e.memberName === memberName)?.skills[skillName] ?? 0) as SkillMatrixLevel;
    const nextLevel = cycleLevel(currentLevel);
    updateLevel(memberName, skillName, nextLevel);
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

  return (
    <Card className="mt-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* ── 헤더 ─────────────────────────────────────── */}
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 pt-3 px-4 cursor-pointer hover:bg-muted/30 rounded-t-lg transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <Grid3X3 className="h-3.5 w-3.5 text-muted-foreground" />
                스킬 매트릭스
                {totalMembers > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100 ml-1">
                    멤버 {totalMembers}
                  </Badge>
                )}
                {totalSkills > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 hover:bg-purple-100">
                    스킬 {totalSkills}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-1.5">
                {overallAvg > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    평균 {overallAvg}
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
              {/* 스킬 추가 */}
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="스킬 추가 (예: 팝핑)"
                  className="h-7 text-xs flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs shrink-0 px-2"
                  onClick={handleAddSkill}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  스킬
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
              </div>
            )}

            {/* ── 빈 상태 안내 ────────────────────────── */}
            {totalMembers === 0 && totalSkills === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                스킬과 멤버를 추가하면 매트릭스를 관리할 수 있습니다.
              </p>
            )}

            {totalSkills === 0 && totalMembers > 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                위 입력란에서 스킬을 추가해 주세요.
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
                      {/* 멤버 이름 헤더 */}
                      <th className="text-left pr-3 pb-2 font-medium text-muted-foreground whitespace-nowrap min-w-[80px]">
                        멤버
                      </th>

                      {/* 스킬 헤더 */}
                      {config.skillNames.map((skillName) => (
                        <th
                          key={skillName}
                          className="pb-2 px-1 font-medium text-center min-w-[60px]"
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="whitespace-nowrap text-[11px]">
                              {skillName}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSkillDeleteClick(skillName)}
                              title={
                                deleteSkillTarget === skillName
                                  ? "한 번 더 클릭하면 삭제됩니다"
                                  : "스킬 삭제"
                              }
                              className={[
                                "transition-colors",
                                deleteSkillTarget === skillName
                                  ? "text-destructive"
                                  : "text-muted-foreground hover:text-destructive",
                              ].join(" ")}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                            {deleteSkillTarget === skillName && (
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

                      {/* 멤버 삭제 헤더 */}
                      <th className="pb-2 px-1 text-center w-6" />
                    </tr>
                  </thead>

                  <tbody>
                    {config.entries.map((entry) => (
                      <tr key={entry.memberName} className="group/row">
                        {/* 멤버 이름 셀 */}
                        <td className="pr-3 py-1 font-medium whitespace-nowrap text-muted-foreground">
                          {entry.memberName}
                        </td>

                        {/* 스킬 레벨 셀 */}
                        {config.skillNames.map((skillName) => {
                          const level = (entry.skills[skillName] ?? 0) as SkillMatrixLevel;
                          return (
                            <td key={skillName} className="py-1 px-1 text-center">
                              <MatrixCell
                                level={level}
                                onClick={() =>
                                  handleCellClick(entry.memberName, skillName)
                                }
                              />
                            </td>
                          );
                        })}

                        {/* 멤버 삭제 버튼 셀 */}
                        <td className="py-1 px-1 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleMemberDeleteClick(entry.memberName)
                            }
                            title={
                              deleteMemberTarget === entry.memberName
                                ? "한 번 더 클릭하면 삭제됩니다"
                                : "멤버 삭제"
                            }
                            className={[
                              "transition-colors opacity-0 group-hover/row:opacity-100",
                              deleteMemberTarget === entry.memberName
                                ? "text-destructive opacity-100"
                                : "text-muted-foreground hover:text-destructive",
                            ].join(" ")}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* ── 스킬별 평균 행 ─────────────────── */}
                    <tr className="border-t border-border">
                      <td className="pr-3 pt-2 pb-1 font-semibold text-muted-foreground whitespace-nowrap">
                        평균
                      </td>
                      {config.skillNames.map((skillName) => {
                        const avg = getSkillAvg(skillName);
                        return (
                          <td
                            key={skillName}
                            className="pt-2 pb-1 px-1 text-center"
                          >
                            <div className="w-9 h-7 rounded bg-muted/60 mx-auto flex items-center justify-center">
                              <span className="text-[10px] font-semibold text-muted-foreground">
                                {avg === 0 ? "-" : avg}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
