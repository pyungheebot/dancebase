"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import { useMemberSkills } from "@/hooks/use-member-skills";
import { invalidateMemberSkills } from "@/lib/swr/invalidate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Plus, Trash2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import type { EntityMember } from "@/types/entity-context";


// 기본 스킬 제안 목록
const SUGGESTED_SKILLS = [
  "힙합",
  "팝핀",
  "락킹",
  "하우스",
  "왁킹",
  "크럼프",
  "현대무용",
  "한국무용",
  "발레",
  "재즈",
];

// 스킬 레벨 → 배경색 매핑
function getSkillLevelBg(level: number): string {
  switch (level) {
    case 1:
      return "bg-blue-100";
    case 2:
      return "bg-blue-200";
    case 3:
      return "bg-blue-300";
    case 4:
      return "bg-blue-500";
    case 5:
      return "bg-blue-700";
    default:
      return "bg-muted";
  }
}

// 스킬 레벨 → 텍스트색 매핑 (4, 5는 흰색)
function getSkillLevelText(level: number): string {
  return level >= 4 ? "text-white" : "text-foreground";
}

type SkillMatrixSectionProps = {
  groupId: string;
  members: EntityMember[];
  canEdit: boolean;
};

export function SkillMatrixSection({
  groupId,
  members,
  canEdit,
}: SkillMatrixSectionProps) {
  const { skills, loading } = useMemberSkills(groupId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [skillNameInput, setSkillNameInput] = useState("");
  const [levelMap, setLevelMap] = useState<Record<string, number>>({});
  const { pending: saving, execute: executeSave } = useAsyncAction();
  const deleteConfirm = useDeleteConfirm<string>();
  const { pending: deleting, execute: executeDelete } = useAsyncAction();

  // 고유 스킬 이름 목록 추출 (현재 등록된 스킬)
  const allSkillNames = Array.from(new Set(skills.map((s) => s.skill_name))).sort();

  // 히트맵 데이터: memberUserId → skillName → level
  const skillMatrix: Record<string, Record<string, number>> = {};
  for (const skill of skills) {
    if (!skillMatrix[skill.user_id]) {
      skillMatrix[skill.user_id] = {};
    }
    skillMatrix[skill.user_id][skill.skill_name] = skill.skill_level;
  }

  // Dialog 초기화
  const openDialog = () => {
    setSkillNameInput("");
    // 기본 레벨: 모든 멤버 1
    const initLevels: Record<string, number> = {};
    for (const m of members) {
      initLevels[m.userId] = 1;
    }
    setLevelMap(initLevels);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const skillName = skillNameInput.trim();
    if (!skillName) {
      toast.error("스킬 이름을 입력하세요");
      return;
    }
    if (allSkillNames.includes(skillName)) {
      toast.error("이미 존재하는 스킬입니다");
      return;
    }

    await executeSave(async () => {
      const supabase = createClient();

      // 각 멤버별로 upsert
      const rows = members.map((m) => ({
        group_id: groupId,
        user_id: m.userId,
        skill_name: skillName,
        skill_level: levelMap[m.userId] ?? 1,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("member_skills")
        .upsert(rows, { onConflict: "group_id,user_id,skill_name" });

      if (error) {
        toast.error("스킬 저장에 실패했습니다");
        return;
      }

      toast.success(`'${skillName}' 스킬이 추가되었습니다`);
      invalidateMemberSkills(groupId);
      setDialogOpen(false);
    });
  };

  const handleLevelChange = async (
    userId: string,
    skillName: string,
    newLevel: number
  ) => {
    if (!canEdit) return;
    const supabase = createClient();

    const { error } = await supabase.from("member_skills").upsert(
      {
        group_id: groupId,
        user_id: userId,
        skill_name: skillName,
        skill_level: newLevel,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "group_id,user_id,skill_name" }
    );

    if (error) {
      toast.error("레벨 변경에 실패했습니다");
      return;
    }

    invalidateMemberSkills(groupId);
  };

  const handleDeleteSkill = async (skillName: string) => {
    await executeDelete(async () => {
      const supabase = createClient();

      const { error } = await supabase
        .from("member_skills")
        .delete()
        .eq("group_id", groupId)
        .eq("skill_name", skillName);

      deleteConfirm.cancel();

      if (error) {
        toast.error("스킬 삭제에 실패했습니다");
        return;
      }

      toast.success(`'${skillName}' 스킬이 삭제되었습니다`);
      invalidateMemberSkills(groupId);
    });
  };

  if (loading) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            멤버 역량 맵
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
            <BarChart3 className="h-4 w-4" />
            멤버 역량 맵
          </CardTitle>
          {canEdit && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={openDialog}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  스킬 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>스킬 추가</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* 스킬 이름 입력 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      스킬 이름
                    </label>
                    <Input
                      value={skillNameInput}
                      onChange={(e) => setSkillNameInput(e.target.value)}
                      placeholder="예: 힙합"
                      className="h-8 text-sm"
                    />
                    {/* 제안 칩 */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {SUGGESTED_SKILLS.filter(
                        (s) => !allSkillNames.includes(s)
                      ).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSkillNameInput(s)}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-muted hover:bg-muted/80 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 멤버별 레벨 설정 */}
                  {members.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        멤버별 초기 레벨 설정 (1~5)
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {members.map((m) => {
                          const displayName = m.nickname || m.profile.name;
                          const level = levelMap[m.userId] ?? 1;
                          return (
                            <div
                              key={m.userId}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="text-xs truncate flex-1">
                                {displayName}
                              </span>
                              <div className="flex items-center gap-0.5 shrink-0">
                                {[1, 2, 3, 4, 5].map((lv) => (
                                  <button
                                    key={lv}
                                    type="button"
                                    onClick={() =>
                                      setLevelMap((prev) => ({
                                        ...prev,
                                        [m.userId]: lv,
                                      }))
                                    }
                                    className={`w-6 h-6 rounded text-[10px] font-medium transition-colors ${
                                      level === lv
                                        ? `${getSkillLevelBg(lv)} ${getSkillLevelText(lv)}`
                                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                                    }`}
                                  >
                                    {lv}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleSave}
                    disabled={saving || !skillNameInput.trim()}
                  >
                    {saving ? "저장 중..." : "저장"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {allSkillNames.length === 0 ? (
          <div className="text-xs text-muted-foreground py-2">
            {canEdit
              ? "스킬을 추가하면 멤버별 역량을 히트맵으로 확인할 수 있습니다."
              : "등록된 스킬이 없습니다."}
          </div>
        ) : (
          <>
            {/* 레벨 범례 */}
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[10px] text-muted-foreground">레벨:</span>
              {[1, 2, 3, 4, 5].map((lv) => (
                <span
                  key={lv}
                  className={`text-[10px] px-1.5 py-0.5 rounded ${getSkillLevelBg(lv)} ${getSkillLevelText(lv)}`}
                >
                  {lv}
                </span>
              ))}
            </div>

            {/* 히트맵 그리드 */}
            <div className="overflow-x-auto">
              <table className="text-xs border-collapse min-w-full">
                <thead>
                  <tr>
                    {/* 멤버 이름 헤더 (빈 셀) */}
                    <th className="text-left pr-3 pb-1.5 font-medium text-muted-foreground whitespace-nowrap min-w-[80px]">
                      멤버
                    </th>
                    {allSkillNames.map((skillName) => (
                      <th
                        key={skillName}
                        className="pb-1.5 font-medium text-center"
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="whitespace-nowrap px-1">
                            {skillName}
                          </span>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() =>
                                deleteConfirm.target === skillName
                                  ? handleDeleteSkill(skillName)
                                  : deleteConfirm.request(skillName)
                              }
                              disabled={deleting}
                              className={`transition-colors ${
                                deleteConfirm.target === skillName
                                  ? "text-destructive"
                                  : "text-muted-foreground hover:text-destructive"
                              }`}
                              title={
                                deleteConfirm.target === skillName
                                  ? "다시 클릭하면 삭제됩니다"
                                  : "스킬 삭제"
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                          {deleteConfirm.target === skillName && (
                            <button
                              type="button"
                              onClick={() => deleteConfirm.cancel()}
                              className="text-[9px] text-muted-foreground underline"
                            >
                              취소
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const displayName = member.nickname || member.profile.name;
                    const memberSkillMap = skillMatrix[member.userId] ?? {};

                    return (
                      <tr key={member.userId}>
                        <td className="pr-3 py-1 font-medium whitespace-nowrap text-muted-foreground">
                          {displayName}
                        </td>
                        {allSkillNames.map((skillName) => {
                          const level = memberSkillMap[skillName] ?? 0;
                          return (
                            <td
                              key={skillName}
                              className="py-1 px-1 text-center"
                            >
                              {canEdit ? (
                                <SkillLevelSelector
                                  level={level}
                                  onChange={(newLevel) =>
                                    handleLevelChange(
                                      member.userId,
                                      skillName,
                                      newLevel
                                    )
                                  }
                                />
                              ) : (
                                <SkillLevelCell level={level} />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// 읽기 전용 셀
function SkillLevelCell({ level }: { level: number }) {
  if (level === 0) {
    return (
      <div className="w-8 h-6 rounded bg-muted mx-auto flex items-center justify-center">
        <span className="text-[10px] text-muted-foreground">-</span>
      </div>
    );
  }
  return (
    <div
      className={`w-8 h-6 rounded mx-auto flex items-center justify-center ${getSkillLevelBg(level)} ${getSkillLevelText(level)}`}
    >
      <span className="text-[10px] font-medium">{level}</span>
    </div>
  );
}

// 편집 가능한 셀 (클릭하면 레벨 순환)
function SkillLevelSelector({
  level,
  onChange,
}: {
  level: number;
  onChange: (newLevel: number) => void;
}) {
  const handleClick = () => {
    // 0 → 1 → 2 → 3 → 4 → 5 → 1 순환
    const next = level === 0 ? 1 : level === 5 ? 1 : level + 1;
    onChange(next);
  };

  if (level === 0) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="w-8 h-6 rounded bg-muted mx-auto flex items-center justify-center hover:bg-blue-100 transition-colors"
        title="클릭하여 레벨 설정"
      >
        <span className="text-[10px] text-muted-foreground">-</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-8 h-6 rounded mx-auto flex items-center justify-center transition-colors ${getSkillLevelBg(level)} ${getSkillLevelText(level)} hover:opacity-80`}
      title={`레벨 ${level} (클릭하여 변경)`}
    >
      <span className="text-[10px] font-medium">{level}</span>
    </button>
  );
}
