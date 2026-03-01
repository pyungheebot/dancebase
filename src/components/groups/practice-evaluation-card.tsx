"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Star,
  Users,
  Trophy,
  Calendar,
  TrendingUp,
  Edit3,
  X,

} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { usePracticeEvaluation } from "@/hooks/use-practice-evaluation";
import type {
  PracticeEvalSession,
  PracticeEvalCriteria,
  PracticeEvalScore,
} from "@/types";

// ─── Props ────────────────────────────────────────────────────

interface PracticeEvaluationCardProps {
  groupId: string;
  memberNames?: string[];
}

// ─── 새 세션 폼 ───────────────────────────────────────────────

interface NewSessionForm {
  date: string;
  title: string;
  evaluator: string;
  notes: string;
  criteria: { name: string; maxScore: number }[];
}

function emptyForm(): NewSessionForm {
  return {
    date: new Date().toISOString().slice(0, 10),
    title: "",
    evaluator: "",
    notes: "",
    criteria: [{ name: "기술", maxScore: 10 }],
  };
}

// ─── 헬퍼 ────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  } catch {
    return dateStr;
  }
}

function scoreColor(ratio: number): string {
  if (ratio >= 0.9) return "text-emerald-600";
  if (ratio >= 0.7) return "text-blue-600";
  if (ratio >= 0.5) return "text-yellow-600";
  return "text-red-500";
}

function scoreBarColor(ratio: number): string {
  if (ratio >= 0.9) return "bg-emerald-500";
  if (ratio >= 0.7) return "bg-blue-400";
  if (ratio >= 0.5) return "bg-yellow-400";
  return "bg-red-400";
}

function calcMaxTotal(criteria: PracticeEvalCriteria[]): number {
  return criteria.reduce((sum, c) => sum + c.maxScore, 0);
}

// ─── 새 세션 다이얼로그 ───────────────────────────────────────

function NewSessionDialog({
  onAdd,
}: {
  onAdd: (form: NewSessionForm) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewSessionForm>(emptyForm());
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
      setForm(emptyForm());
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          새 평가 세션
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">새 평가 세션 만들기</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* 기본 정보 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">
              세션 제목 <span className="text-red-400">*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="예) 3월 정기 연습 평가"
              className="text-xs h-8"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">
                평가 날짜 <span className="text-red-400">*</span>
              </label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className="text-xs h-8"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">
                평가자 <span className="text-red-400">*</span>
              </label>
              <Input
                value={form.evaluator}
                onChange={(e) =>
                  setForm((f) => ({ ...f, evaluator: e.target.value }))
                }
                placeholder="평가자 이름"
                className="text-xs h-8"
              />
            </div>
          </div>

          {/* 평가 기준 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">
              평가 기준
            </label>
            <div className="space-y-1">
              {form.criteria.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1"
                >
                  <span className="text-xs flex-1 text-gray-700">{c.name}</span>
                  <span className="text-xs text-gray-400">
                    최대 {c.maxScore}점
                  </span>
                  <button
                    onClick={() => handleRemoveCriteria(idx)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCriteriaName}
                onChange={(e) => setNewCriteriaName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCriteria()}
                placeholder="기준명 (예: 표현력)"
                className="text-xs h-7 flex-1"
              />
              <Input
                type="number"
                value={newCriteriaMax}
                onChange={(e) =>
                  setNewCriteriaMax(Math.max(1, Number(e.target.value)))
                }
                min={1}
                className="text-xs h-7 w-20"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2"
                onClick={handleAddCriteria}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-[10px] text-gray-400">
              기준명을 입력 후 Enter 또는 + 버튼으로 추가
            </p>
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">메모</label>
            <Textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
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

function MemberEvalDialog({
  session,
  memberNames,
  onSave,
}: {
  session: PracticeEvalSession;
  memberNames: string[];
  onSave: (
    sessionId: string,
    memberName: string,
    scores: PracticeEvalScore[],
    feedback?: string
  ) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(
    memberNames[0] ?? ""
  );
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

  function handleOpen(open: boolean) {
    if (open) {
      const member = useCustom ? customMember : selectedMember;
      initScores(member);
    }
    setOpen(open);
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

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
          <Edit3 className="h-3 w-3" />
          멤버 평가 입력
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">멤버 평가 입력</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* 멤버 선택 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">
              평가 대상
            </label>
            {memberNames.length > 0 && (
              <div className="flex gap-2 mb-1">
                <Button
                  size="sm"
                  variant={!useCustom ? "default" : "outline"}
                  className="h-6 text-[10px] px-2"
                  onClick={() => {
                    setUseCustom(false);
                    initScores(selectedMember);
                  }}
                >
                  멤버 목록
                </Button>
                <Button
                  size="sm"
                  variant={useCustom ? "default" : "outline"}
                  className="h-6 text-[10px] px-2"
                  onClick={() => setUseCustom(true)}
                >
                  직접 입력
                </Button>
              </div>
            )}
            {useCustom ? (
              <Input
                value={customMember}
                onChange={(e) => setCustomMember(e.target.value)}
                placeholder="멤버 이름 입력"
                className="text-xs h-8"
              />
            ) : (
              <div className="flex flex-wrap gap-1">
                {memberNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleMemberChange(name)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      selectedMember === name
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
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
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-600">기준별 점수</p>
            {session.criteria.map((cr) => {
              const current = scores[cr.id] ?? 0;
              const ratio = cr.maxScore > 0 ? current / cr.maxScore : 0;
              return (
                <div key={cr.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-700">{cr.name}</span>
                    <span
                      className={`text-xs font-semibold ${scoreColor(ratio)}`}
                    >
                      {current} / {cr.maxScore}
                    </span>
                  </div>
                  <input
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
                  />
                  <Input
                    value={comments[cr.id] ?? ""}
                    onChange={(e) =>
                      setComments((c) => ({
                        ...c,
                        [cr.id]: e.target.value,
                      }))
                    }
                    placeholder="기준별 코멘트 (선택)"
                    className="text-[10px] h-6"
                  />
                </div>
              );
            })}
          </div>

          {/* 종합 피드백 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              종합 피드백
            </label>
            <Textarea
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

// ─── 멤버 성장 추이 ───────────────────────────────────────────

function MemberTrendChart({
  trend,
  maxPossible,
}: {
  trend: { date: string; title: string; totalScore: number }[];
  maxPossible: number;
}) {
  if (trend.length === 0) {
    return (
      <p className="text-[10px] text-gray-400 text-center py-2">
        데이터 없음
      </p>
    );
  }
  const maxVal = Math.max(maxPossible, ...trend.map((t) => t.totalScore), 1);
  const barWidth = Math.floor(100 / trend.length);

  return (
    <div className="flex items-end gap-1 h-16 w-full">
      {trend.map((t, idx) => {
        const ratio = t.totalScore / maxVal;
        const heightPct = Math.max(4, Math.round(ratio * 100));
        return (
          <div
            key={idx}
            className="flex-1 flex flex-col items-center gap-0.5"
            style={{ maxWidth: `${barWidth}%` }}
            title={`${t.title}: ${t.totalScore}점`}
          >
            <span className="text-[8px] text-gray-500 leading-none">
              {t.totalScore}
            </span>
            <div
              className={`w-full rounded-t ${scoreBarColor(ratio)} transition-all`}
              style={{ height: `${heightPct}%` }}
            />
            <span className="text-[8px] text-gray-400 leading-none truncate w-full text-center">
              {t.date.slice(5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── 세션 상세 패널 ───────────────────────────────────────────

function SessionDetailPanel({
  session,
  memberNames,
  onSaveMember,
  onDeleteMember,
  onAddCriteria,
  onDeleteCriteria,
  getMemberTrend,
}: {
  session: PracticeEvalSession;
  memberNames: string[];
  onSaveMember: (
    sessionId: string,
    memberName: string,
    scores: PracticeEvalScore[],
    feedback?: string
  ) => boolean;
  onDeleteMember: (sessionId: string, memberName: string) => boolean;
  onAddCriteria: (
    sessionId: string,
    criteria: { name: string; maxScore: number }
  ) => boolean;
  onDeleteCriteria: (sessionId: string, criteriaId: string) => boolean;
  getMemberTrend: (
    memberName: string
  ) => { date: string; title: string; totalScore: number }[];
}) {
  const [showTrend, setShowTrend] = useState<string | null>(null);
  const [newCriteriaName, setNewCriteriaName] = useState("");
  const [newCriteriaMax, setNewCriteriaMax] = useState(10);

  const maxTotal = calcMaxTotal(session.criteria);

  function handleAddCriteria() {
    if (!newCriteriaName.trim()) return;
    const ok = onAddCriteria(session.id, {
      name: newCriteriaName.trim(),
      maxScore: newCriteriaMax,
    });
    if (ok) {
      setNewCriteriaName("");
      setNewCriteriaMax(10);
    }
  }

  const sortedResults = [...session.results].sort(
    (a, b) => b.totalScore - a.totalScore
  );

  return (
    <div className="space-y-4 pt-2">
      {/* 기준 관리 */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-gray-600">평가 기준 관리</p>
        <div className="flex flex-wrap gap-1">
          {session.criteria.map((cr) => (
            <div
              key={cr.id}
              className="flex items-center gap-1 bg-white border border-gray-200 rounded px-2 py-0.5"
            >
              <span className="text-[10px] text-gray-600">{cr.name}</span>
              <span className="text-[10px] text-gray-400">
                /{cr.maxScore}점
              </span>
              <button
                onClick={() => onDeleteCriteria(session.id, cr.id)}
                className="text-gray-300 hover:text-red-400 transition-colors ml-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <Input
            value={newCriteriaName}
            onChange={(e) => setNewCriteriaName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCriteria()}
            placeholder="새 기준명"
            className="text-[10px] h-6 flex-1"
          />
          <Input
            type="number"
            value={newCriteriaMax}
            onChange={(e) =>
              setNewCriteriaMax(Math.max(1, Number(e.target.value)))
            }
            min={1}
            className="text-[10px] h-6 w-16"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] px-2"
            onClick={handleAddCriteria}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 평가 입력 버튼 */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-600">
          멤버별 평가표{" "}
          <span className="text-gray-400 font-normal">
            ({session.results.length}명)
          </span>
        </p>
        <MemberEvalDialog
          session={session}
          memberNames={memberNames}
          onSave={onSaveMember}
        />
      </div>

      {/* 멤버 결과 목록 */}
      {sortedResults.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3">
          아직 평가된 멤버가 없습니다.
        </p>
      ) : (
        <div className="space-y-2">
          {sortedResults.map((result, rank) => {
            const ratio = maxTotal > 0 ? result.totalScore / maxTotal : 0;
            const trend = getMemberTrend(result.memberName);
            const isTrendOpen = showTrend === result.memberName;

            return (
              <div
                key={result.memberName}
                className="border border-gray-100 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  {/* 순위 배지 */}
                  {rank === 0 && (
                    <span className="text-[10px] font-bold text-yellow-500">
                      1위
                    </span>
                  )}
                  {rank === 1 && (
                    <span className="text-[10px] font-bold text-gray-400">
                      2위
                    </span>
                  )}
                  {rank === 2 && (
                    <span className="text-[10px] font-bold text-orange-400">
                      3위
                    </span>
                  )}
                  {rank >= 3 && (
                    <span className="text-[10px] text-gray-300">
                      {rank + 1}위
                    </span>
                  )}

                  <span className="text-xs font-medium text-gray-700 flex-1">
                    {result.memberName}
                  </span>
                  <span
                    className={`text-xs font-bold ${scoreColor(ratio)}`}
                  >
                    {result.totalScore}
                    <span className="text-[10px] font-normal text-gray-400">
                      /{maxTotal}
                    </span>
                  </span>

                  {/* 성장 추이 토글 */}
                  <button
                    onClick={() =>
                      setShowTrend(isTrendOpen ? null : result.memberName)
                    }
                    className="text-gray-300 hover:text-indigo-400 transition-colors"
                    title="성장 추이 보기"
                  >
                    <TrendingUp className="h-3 w-3" />
                  </button>

                  <button
                    onClick={() =>
                      onDeleteMember(session.id, result.memberName)
                    }
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {/* 점수 바 */}
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${scoreBarColor(ratio)} transition-all`}
                    style={{ width: `${Math.round(ratio * 100)}%` }}
                  />
                </div>

                {/* 기준별 점수 */}
                <div className="flex flex-wrap gap-1">
                  {session.criteria.map((cr) => {
                    const sc = result.scores.find(
                      (s) => s.criteriaId === cr.id
                    );
                    const crRatio =
                      cr.maxScore > 0 ? (sc?.score ?? 0) / cr.maxScore : 0;
                    return (
                      <div
                        key={cr.id}
                        className="text-[10px] bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5"
                        title={sc?.comment}
                      >
                        <span className="text-gray-500">{cr.name}</span>{" "}
                        <span className={`font-medium ${scoreColor(crRatio)}`}>
                          {sc?.score ?? 0}
                        </span>
                        <span className="text-gray-300">/{cr.maxScore}</span>
                      </div>
                    );
                  })}
                </div>

                {/* 피드백 */}
                {result.feedback && (
                  <p className="text-[10px] text-gray-500 bg-indigo-50 rounded px-2 py-1">
                    {result.feedback}
                  </p>
                )}

                {/* 성장 추이 */}
                {isTrendOpen && (
                  <div className="pt-1">
                    <p className="text-[10px] text-gray-400 mb-1">
                      최근 5회 점수 추이
                    </p>
                    <MemberTrendChart trend={trend} maxPossible={maxTotal} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 세션 메모 */}
      {session.notes && (
        <div className="bg-yellow-50 border border-yellow-100 rounded p-2">
          <p className="text-[10px] text-yellow-700">{session.notes}</p>
        </div>
      )}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

export function PracticeEvaluationCard({
  groupId,
  memberNames = [],
}: PracticeEvaluationCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const {
    sessions,
    addSession,
    deleteSession,
    addCriteria,
    deleteCriteria,
    saveMemberResult,
    deleteMemberResult,
    getMemberTrend,
    stats,
  } = usePracticeEvaluation(groupId);

  function handleAddSession(form: NewSessionForm): boolean {
    const id = addSession({
      date: form.date,
      title: form.title,
      evaluator: form.evaluator,
      notes: form.notes || undefined,
      criteria: form.criteria.map((c) => ({
        id: crypto.randomUUID(),
        name: c.name,
        maxScore: c.maxScore,
      })),
    });
    if (id) {
      setExpandedSession(id);
      return true;
    }
    return false;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-gray-100 rounded-xl bg-white shadow-sm">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800">
                그룹 연습 평가표
              </span>
              {stats.totalSessions > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-600 hover:bg-indigo-50">
                  {stats.totalSessions}회
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* 요약 통계 */}
              {stats.totalSessions > 0 && (
                <div className="hidden sm:flex items-center gap-3 mr-2">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Star className="h-3 w-3 text-yellow-400" />
                    평균 {stats.averageScore}점
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Users className="h-3 w-3" />
                    {stats.topPerformers.length}명 집계
                  </div>
                </div>
              )}
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Separator />
          <div className="p-4 space-y-4">
            {/* 상위 성과자 */}
            {stats.topPerformers.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-xs font-medium text-gray-700">
                    상위 성과자
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stats.topPerformers.map((performer, idx) => {
                    const _medals = ["gold", "silver", "bronze"] as const;
                    const medalColors = [
                      "text-yellow-500",
                      "text-gray-400",
                      "text-orange-400",
                    ];
                    return (
                      <div
                        key={performer.memberName}
                        className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1 border border-yellow-100"
                      >
                        <span className={`text-xs ${medalColors[idx]}`}>
                          {idx === 0 ? "1" : idx === 1 ? "2" : "3"}위
                        </span>
                        <span className="text-xs font-medium text-gray-700">
                          {performer.memberName}
                        </span>
                        <Badge className="text-[10px] px-1 py-0 bg-yellow-50 text-yellow-600 hover:bg-yellow-50">
                          평균 {performer.averageScore}점
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 액션 */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                총 {stats.totalSessions}개 세션
              </p>
              <NewSessionDialog onAdd={handleAddSession} />
            </div>

            {/* 세션 목록 */}
            {sessions.length === 0 ? (
              <div className="text-center py-6">
                <ClipboardCheck className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  아직 평가 세션이 없습니다.
                </p>
                <p className="text-[10px] text-gray-300 mt-0.5">
                  새 평가 세션을 만들어 멤버를 평가해보세요.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => {
                  const isExpanded = expandedSession === session.id;
                  const maxTotal = calcMaxTotal(session.criteria);
                  const avgScore =
                    session.results.length > 0
                      ? Math.round(
                          session.results.reduce(
                            (s, r) => s + r.totalScore,
                            0
                          ) / session.results.length
                        )
                      : null;

                  return (
                    <div
                      key={session.id}
                      className="border border-gray-100 rounded-lg overflow-hidden"
                    >
                      {/* 세션 헤더 */}
                      <div
                        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() =>
                          setExpandedSession(isExpanded ? null : session.id)
                        }
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 min-w-0">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span className="shrink-0">
                            {formatDate(session.date)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">
                            {session.title}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            평가자: {session.evaluator}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {avgScore !== null && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-600 hover:bg-indigo-50">
                              평균 {avgScore}/{maxTotal}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Users className="h-3 w-3" />
                            {session.results.length}명
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.id);
                              if (isExpanded) setExpandedSession(null);
                            }}
                            className="text-gray-200 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* 세션 상세 */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 px-3 pb-3">
                          <SessionDetailPanel
                            session={session}
                            memberNames={memberNames}
                            onSaveMember={saveMemberResult}
                            onDeleteMember={deleteMemberResult}
                            onAddCriteria={addCriteria}
                            onDeleteCriteria={deleteCriteria}
                            getMemberTrend={getMemberTrend}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
