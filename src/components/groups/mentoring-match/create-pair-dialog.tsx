"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { CreatePairDialogProps } from "./types";
import { today } from "./types";

export function CreatePairDialog({
  open,
  onClose,
  memberNames,
  onSave,
}: CreatePairDialogProps) {
  const [mentorName, setMentorName] = useState("");
  const [menteeName, setMenteeName] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(today());
  const skillRef = useRef<HTMLInputElement>(null);
  const goalRef = useRef<HTMLInputElement>(null);

  function reset() {
    setMentorName("");
    setMenteeName("");
    setSkillInput("");
    setSkills([]);
    setGoalInput("");
    setGoals([]);
    setStartDate(today());
  }

  function addSkill() {
    const v = skillInput.trim();
    if (!v || skills.includes(v)) return;
    setSkills([...skills, v]);
    setSkillInput("");
    skillRef.current?.focus();
  }

  function removeSkill(s: string) {
    setSkills(skills.filter((x) => x !== s));
  }

  function addGoal() {
    const v = goalInput.trim();
    if (!v) return;
    setGoals([...goals, v]);
    setGoalInput("");
    goalRef.current?.focus();
  }

  function removeGoal(idx: number) {
    setGoals(goals.filter((_, i) => i !== idx));
  }

  function handleSave() {
    if (!mentorName) {
      toast.error(TOAST.MENTORING_MATCH.MENTOR_REQUIRED);
      return;
    }
    if (!menteeName) {
      toast.error(TOAST.MENTORING_MATCH.MENTEE_REQUIRED);
      return;
    }
    if (mentorName === menteeName) {
      toast.error(TOAST.MENTORING_MATCH.SAME_PERSON_ERROR);
      return;
    }
    if (skills.length === 0) {
      toast.error(TOAST.MENTORING_MATCH.SKILL_REQUIRED);
      return;
    }
    onSave({ mentorName, menteeName, skillFocus: skills, goals, startDate });
    reset();
    onClose();
  }

  const menteeOptions = memberNames.filter((n) => n !== mentorName);
  const mentorOptions = memberNames.filter((n) => n !== menteeName);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent
        className="max-w-sm max-h-[90vh] overflow-y-auto"
        aria-describedby="create-pair-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-sm">멘토링 매칭 생성</DialogTitle>
        </DialogHeader>
        <p id="create-pair-desc" className="sr-only">
          멘토와 멘티를 선택하고 스킬 포커스와 목표를 설정합니다.
        </p>
        <div className="space-y-3 py-2">
          {/* 멘토 선택 */}
          <div className="space-y-1">
            <Label htmlFor="mentor-select" className="text-xs">
              멘토 *
            </Label>
            {memberNames.length > 0 ? (
              <Select value={mentorName} onValueChange={setMentorName}>
                <SelectTrigger id="mentor-select" className="h-8 text-xs" aria-required="true">
                  <SelectValue placeholder="멘토 선택" />
                </SelectTrigger>
                <SelectContent>
                  {mentorOptions.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="mentor-select"
                placeholder="멘토 이름 입력"
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
                className="h-8 text-xs"
                aria-required="true"
              />
            )}
          </div>

          {/* 멘티 선택 */}
          <div className="space-y-1">
            <Label htmlFor="mentee-select" className="text-xs">
              멘티 *
            </Label>
            {memberNames.length > 0 ? (
              <Select value={menteeName} onValueChange={setMenteeName}>
                <SelectTrigger id="mentee-select" className="h-8 text-xs" aria-required="true">
                  <SelectValue placeholder="멘티 선택" />
                </SelectTrigger>
                <SelectContent>
                  {menteeOptions.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="mentee-select"
                placeholder="멘티 이름 입력"
                value={menteeName}
                onChange={(e) => setMenteeName(e.target.value)}
                className="h-8 text-xs"
                aria-required="true"
              />
            )}
          </div>

          {/* 스킬 포커스 */}
          <fieldset className="space-y-1">
            <legend className="text-xs font-medium">스킬 포커스 *</legend>
            <div className="flex gap-1">
              <Input
                ref={skillRef}
                id="skill-input"
                placeholder="예: 비보잉, 팝핑"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill()}
                className="h-8 text-xs flex-1"
                aria-label="스킬 포커스 입력"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs px-2"
                onClick={addSkill}
                aria-label="스킬 추가"
              >
                추가
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1" role="list" aria-label="추가된 스킬 목록">
                {skills.map((s) => (
                  <Badge
                    key={s}
                    role="listitem"
                    className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 cursor-pointer hover:bg-purple-200"
                    onClick={() => removeSkill(s)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        removeSkill(s);
                      }
                    }}
                    tabIndex={0}
                    aria-label={`${s} 삭제`}
                  >
                    {s} ×
                  </Badge>
                ))}
              </div>
            )}
          </fieldset>

          {/* 목표 */}
          <fieldset className="space-y-1">
            <legend className="text-xs font-medium">목표</legend>
            <div className="flex gap-1">
              <Input
                ref={goalRef}
                id="goal-input"
                placeholder="예: 3개월 내 기본기 완성"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGoal()}
                className="h-8 text-xs flex-1"
                aria-label="목표 입력"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs px-2"
                onClick={addGoal}
                aria-label="목표 추가"
              >
                추가
              </Button>
            </div>
            {goals.length > 0 && (
              <ul className="space-y-0.5 mt-1" aria-label="추가된 목표 목록">
                {goals.map((g, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                  >
                    <span className="flex-1">{g}</span>
                    <button
                      type="button"
                      onClick={() => removeGoal(i)}
                      className="text-red-400 hover:text-red-600 text-[10px]"
                      aria-label={`목표 "${g}" 삭제`}
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          {/* 시작일 */}
          <div className="space-y-1">
            <Label htmlFor="start-date" className="text-xs">
              시작일
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
