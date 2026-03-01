"use client";

/**
 * 그룹 연습 평가표 - 다이얼로그 컴포넌트
 *
 * - NewSessionDialog: 새 평가 세션 생성
 * - MemberEvalDialog: 멤버별 점수 입력
 */

import { useState } from "react";
import { Plus, X, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PracticeEvalScore, PracticeEvalSession } from "@/types";
import {
  type NewSessionForm,
  emptyNewSessionForm,
  scoreTextColor,
} from "./practice-evaluation-types";

// ─── 새 세션 다이얼로그 ───────────────────────────────────────

interface NewSessionDialogProps {
  onAdd: (form: NewSessionForm) => boolean;
}

export function NewSessionDialog({ onAdd }: NewSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewSessionForm>(emptyNewSessionForm());
  const [newCriteriaName, setNewCriteriaName] = useState("");
  const [newCriteriaMax, setNewCriteriaMax] = useState(10);

  function handleAddCriteria() {
    if (!newCriteriaName.trim()) return;
    setForm((f) => ({
      ...f,
      criteria: [
        ...f.criteria,
        { name: newCriteriaName.trim(), maxScore: newCriteriaMax },
      ],
    }));
    setNewCriteriaName("");
    setNewCriteriaMax(10);
  }

  function handleRemoveCriteria(idx: number) {
    setForm((f) => ({
      ...f,
      criteria: f.criteria.filter((_, i) => i !== idx),
    }));
  }

  function handleSubmit() {
    const success = onAdd(form);
    if (success) {
      setOpen(false);
      setForm(emptyNewSessionForm());
    }
  }

  const criteriaListId = "new-session-criteria-list";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" aria-hidden="true" />
          새 평가 세션
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        aria-describedby="new-session-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-sm">새 평가 세션 만들기</DialogTitle>
        </DialogHeader>
        <p id="new-session-desc" className="sr-only">
          평가 세션의 제목, 날짜, 평가자, 기준을 입력한 뒤 세션을 생성합니다.
        </p>
        <div className="space-y-4 pt-2">
          {/* 기본 정보 */}
          <div className="space-y-2">
            <label htmlFor="session-title" className="text-xs font-medium text-gray-600">
              세션 제목 <span className="text-red-400" aria-hidden="true">*</span>
            </label>
            <Input
              id="session-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="예) 3월 정기 연습 평가"
              className="text-xs h-8"
              aria-required="true"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label htmlFor="session-date" className="text-xs font-medium text-gray-600">
                평가 날짜 <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <Input
                id="session-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="text-xs h-8"
                aria-required="true"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="session-evaluator" className="text-xs font-medium text-gray-600">
                평가자 <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <Input
                id="session-evaluator"
                value={form.evaluator}
                onChange={(e) => setForm((f) => ({ ...f, evaluator: e.target.value }))}
                placeholder="평가자 이름"
                className="text-xs h-8"
                aria-required="true"
              />
            </div>
          </div>

          {/* 평가 기준 */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-gray-600">평가 기준</legend>
            <ul
              id={criteriaListId}
              role="list"
              className="space-y-1"
              aria-label="현재 평가 기준 목록"
            >
              {form.criteria.map((c, idx) => (
                <li
                  key={idx}
                  role="listitem"
                  className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1"
                >
                  <span className="text-xs flex-1 text-gray-700">{c.name}</span>
                  <span className="text-xs text-gray-400">최대 {c.maxScore}점</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCriteria(idx)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                    aria-label={`${c.name} 기준 제거`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2" role="group" aria-label="새 기준 추가">
              <Input
                id="new-criteria-name"
                value={newCriteriaName}
                onChange={(e) => setNewCriteriaName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCriteria()}
                placeholder="기준명 (예: 표현력)"
                className="text-xs h-7 flex-1"
                aria-label="새 기준 이름"
              />
              <Input
                type="number"
                value={newCriteriaMax}
                onChange={(e) => setNewCriteriaMax(Math.max(1, Number(e.target.value)))}
                min={1}
                className="text-xs h-7 w-20"
                aria-label="최대 점수"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2"
                onClick={handleAddCriteria}
                aria-label="기준 추가"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
            <p className="text-[10px] text-gray-400">
              기준명을 입력 후 Enter 또는 + 버튼으로 추가
            </p>
          </fieldset>

          {/* 메모 */}
          <div className="space-y-2">
            <label htmlFor="session-notes" className="text-xs font-medium text-gray-600">
              메모
            </label>
            <Textarea
              id="session-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="평가 세션 관련 메모..."
              className="text-xs min-h-[60px] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              세션 생성
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 멤버 평가 입력 다이얼로그 ───────────────────────────────

interface MemberEvalDialogProps {
  session: PracticeEvalSession;
  memberNames: string[];
  onSave: (
    sessionId: string,
    memberName: string,
    scores: PracticeEvalScore[],
    feedback?: string
  ) => boolean;
}

export function MemberEvalDialog({
  session,
  memberNames,
  onSave,
}: MemberEvalDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(memberNames[0] ?? "");
  const [customMember, setCustomMember] = useState("");
  const [useCustom, setUseCustom] = useState(memberNames.length === 0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");

  function initScores(member: string) {
    const existing = session.results.find(
      (r) => r.memberName.toLowerCase() === member.toLowerCase()
    );
    if (existing) {
      const s: Record<string, number> = {};
      const c: Record<string, string> = {};
      existing.scores.forEach((sc) => {
        s[sc.criteriaId] = sc.score;
        if (sc.comment) c[sc.criteriaId] = sc.comment;
      });
      setScores(s);
      setComments(c);
      setFeedback(existing.feedback ?? "");
    } else {
      const s: Record<string, number> = {};
      session.criteria.forEach((cr) => {
        s[cr.id] = 0;
      });
      setScores(s);
      setComments({});
      setFeedback("");
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      const member = useCustom ? customMember : selectedMember;
      initScores(member);
    }
    setOpen(nextOpen);
  }

  function handleMemberChange(member: string) {
    setSelectedMember(member);
    initScores(member);
  }

  function handleSave() {
    const member = useCustom ? customMember.trim() : selectedMember;
    if (!member) return;
    const evalScores: PracticeEvalScore[] = session.criteria.map((cr) => ({
      criteriaId: cr.id,
      score: scores[cr.id] ?? 0,
      comment: comments[cr.id] ?? undefined,
    }));
    const ok = onSave(session.id, member, evalScores, feedback);
    if (ok) setOpen(false);
  }

  const memberSelectGroupId = "member-select-group";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
          <Edit3 className="h-3 w-3" aria-hidden="true" />
          멤버 평가 입력
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto"
        aria-describedby="member-eval-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-sm">멤버 평가 입력</DialogTitle>
        </DialogHeader>
        <p id="member-eval-desc" className="sr-only">
          평가할 멤버를 선택하고 기준별 점수를 입력한 뒤 저장합니다.
        </p>
        <div className="space-y-4 pt-2">
          {/* 멤버 선택 */}
          <div className="space-y-2">
            <p
              id={memberSelectGroupId}
              className="text-xs font-medium text-gray-600"
            >
              평가 대상
            </p>
            {memberNames.length > 0 && (
              <div
                role="group"
                aria-labelledby={memberSelectGroupId}
                className="flex gap-2 mb-1"
              >
                <Button
                  size="sm"
                  variant={!useCustom ? "default" : "outline"}
                  className="h-6 text-[10px] px-2"
                  onClick={() => {
                    setUseCustom(false);
                    initScores(selectedMember);
                  }}
                  aria-pressed={!useCustom}
                >
                  멤버 목록
                </Button>
                <Button
                  size="sm"
                  variant={useCustom ? "default" : "outline"}
                  className="h-6 text-[10px] px-2"
                  onClick={() => setUseCustom(true)}
                  aria-pressed={useCustom}
                >
                  직접 입력
                </Button>
              </div>
            )}
            {useCustom ? (
              <Input
                id="custom-member-name"
                value={customMember}
                onChange={(e) => setCustomMember(e.target.value)}
                placeholder="멤버 이름 입력"
                className="text-xs h-8"
                aria-label="멤버 이름 직접 입력"
              />
            ) : (
              <div
                role="radiogroup"
                aria-label="멤버 선택"
                className="flex flex-wrap gap-1"
              >
                {memberNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    role="radio"
                    aria-checked={selectedMember === name}
                    onClick={() => handleMemberChange(name)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      selectedMember === name
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-background text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* 기준별 점수 */}
          <div className="space-y-3" role="group" aria-label="기준별 점수 입력">
            <p className="text-xs font-medium text-gray-600">기준별 점수</p>
            {session.criteria.map((cr) => {
              const current = scores[cr.id] ?? 0;
              const ratio = cr.maxScore > 0 ? current / cr.maxScore : 0;
              const scoreId = `score-${cr.id}`;
              const commentId = `comment-${cr.id}`;
              return (
                <div key={cr.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor={scoreId} className="text-xs text-gray-700">
                      {cr.name}
                    </label>
                    <span
                      className={`text-xs font-semibold ${scoreTextColor(ratio)}`}
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {current} / {cr.maxScore}
                    </span>
                  </div>
                  <input
                    id={scoreId}
                    type="range"
                    min={0}
                    max={cr.maxScore}
                    value={current}
                    onChange={(e) =>
                      setScores((s) => ({
                        ...s,
                        [cr.id]: Number(e.target.value),
                      }))
                    }
                    className="w-full h-1.5 accent-indigo-500"
                    aria-valuemin={0}
                    aria-valuemax={cr.maxScore}
                    aria-valuenow={current}
                    aria-valuetext={`${current}점 (최대 ${cr.maxScore}점)`}
                  />
                  <Input
                    id={commentId}
                    value={comments[cr.id] ?? ""}
                    onChange={(e) =>
                      setComments((c) => ({
                        ...c,
                        [cr.id]: e.target.value,
                      }))
                    }
                    placeholder="기준별 코멘트 (선택)"
                    className="text-[10px] h-6"
                    aria-label={`${cr.name} 코멘트`}
                  />
                </div>
              );
            })}
          </div>

          {/* 종합 피드백 */}
          <div className="space-y-1">
            <label htmlFor="member-feedback" className="text-xs font-medium text-gray-600">
              종합 피드백
            </label>
            <Textarea
              id="member-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="종합 피드백 입력 (선택)..."
              className="text-xs min-h-[60px] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
