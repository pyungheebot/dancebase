"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus, Trash2, BookOpen, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { useGroupSkillShare } from "@/hooks/use-group-skill-share";
import type {
  SkillShareCategory,
  SkillShareDifficulty,
  SkillShareItem,
  SkillShareRequestStatus,
} from "@/types";

// ─── 상수 ───────────────────────────────────────
const CATEGORIES: SkillShareCategory[] = ["동작", "리듬", "표현", "체력", "기타"];
const DIFFICULTIES: SkillShareDifficulty[] = ["초급", "중급", "고급"];
const REQUEST_STATUSES: SkillShareRequestStatus[] = ["요청", "수락", "완료"];

// ─── 배지 헬퍼 ──────────────────────────────────
function difficultyBadgeClass(difficulty: SkillShareDifficulty): string {
  switch (difficulty) {
    case "초급":
      return "bg-green-100 text-green-700";
    case "중급":
      return "bg-yellow-100 text-yellow-700";
    case "고급":
      return "bg-red-100 text-red-700";
  }
}

function categoryBadgeClass(category: SkillShareCategory): string {
  switch (category) {
    case "동작":
      return "bg-purple-100 text-purple-700";
    case "리듬":
      return "bg-pink-100 text-pink-700";
    case "표현":
      return "bg-orange-100 text-orange-700";
    case "체력":
      return "bg-cyan-100 text-cyan-700";
    case "기타":
      return "bg-gray-100 text-gray-600";
  }
}

function requestStatusBadgeClass(status: SkillShareRequestStatus): string {
  switch (status) {
    case "요청":
      return "bg-blue-100 text-blue-700";
    case "수락":
      return "bg-green-100 text-green-700";
    case "완료":
      return "bg-gray-100 text-gray-600";
  }
}

// ─── 스킬 등록 다이얼로그 ────────────────────────
function AddSkillDialog({
  onAdd,
}: {
  onAdd: (input: Omit<SkillShareItem, "id" | "createdAt">) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [category, setCategory] = useState<SkillShareCategory>("동작");
  const [difficulty, setDifficulty] = useState<SkillShareDifficulty>("초급");
  const [providerName, setProviderName] = useState("");
  const [description, setDescription] = useState("");
  const { pending: loading, execute } = useAsyncAction();

  function reset() {
    setSkillName("");
    setCategory("동작");
    setDifficulty("초급");
    setProviderName("");
    setDescription("");
  }

  async function handleSubmit() {
    if (!skillName.trim()) {
      toast.error("스킬명을 입력해주세요.");
      return;
    }
    if (!providerName.trim()) {
      toast.error("제공자명을 입력해주세요.");
      return;
    }
    await execute(async () => {
      try {
        await onAdd({ skillName: skillName.trim(), category, difficulty, providerName: providerName.trim(), description: description.trim() });
        toast.success("스킬이 등록되었습니다.");
        reset();
        setOpen(false);
      } catch {
        toast.error("스킬 등록에 실패했습니다.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          스킬 등록
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">스킬 등록</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs">스킬명 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예) 백플립 기초"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">카테고리</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as SkillShareCategory)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">난이도</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as SkillShareDifficulty)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">제공자명 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="가르쳐줄 멤버 이름"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">설명</Label>
            <Textarea
              className="text-xs resize-none"
              rows={3}
              placeholder="스킬에 대한 간단한 설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button
            className="w-full h-8 text-xs"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "등록 중..." : "등록"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 학습 요청 다이얼로그 ────────────────────────
function AddRequestDialog({
  skill,
  onAdd,
}: {
  skill: SkillShareItem;
  onAdd: (skillId: string, requesterName: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [requesterName, setRequesterName] = useState("");
  const { pending: loading, execute: executeRequest } = useAsyncAction();

  async function handleSubmit() {
    if (!requesterName.trim()) {
      toast.error("요청자명을 입력해주세요.");
      return;
    }
    await executeRequest(async () => {
      try {
        await onAdd(skill.id, requesterName.trim());
        toast.success("학습 요청이 접수되었습니다.");
        setRequesterName("");
        setOpen(false);
      } catch {
        toast.error("학습 요청에 실패했습니다.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
          요청
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">학습 요청</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{skill.skillName}</span> 스킬을 배우고 싶습니다.
        </p>
        <div className="space-y-2 pt-1">
          <div className="space-y-1">
            <Label className="text-xs">요청자명 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="이름을 입력하세요"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
            />
          </div>
          <Button
            className="w-full h-8 text-xs"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "요청 중..." : "학습 요청"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────
export function GroupSkillShareCard({ groupId }: { groupId: string }) {
  const {
    data,
    loading,
    totalSkills,
    totalRequests,
    categoryStats,
    popularSkills,
    addSkill,
    removeSkill,
    addRequest,
    updateRequestStatus,
    removeRequest,
  } = useGroupSkillShare(groupId);

  const [filterCategory, setFilterCategory] = useState<SkillShareCategory | "전체">("전체");
  const [skillsOpen, setSkillsOpen] = useState(true);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [popularOpen, setPopularOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);

  // 카테고리 필터 적용
  const filteredSkills =
    filterCategory === "전체"
      ? data.skills
      : data.skills.filter((s) => s.category === filterCategory);

  // 카테고리별 바 차트 최대값
  const maxCategoryCount = Math.max(...Object.values(categoryStats), 1);

  async function handleAddRequest(skillId: string, requesterName: string) {
    await addRequest({ skillId, requesterName });
  }

  async function handleRemoveSkill(skillId: string) {
    await removeSkill(skillId);
    toast.success("스킬이 삭제되었습니다.");
  }

  async function handleRemoveRequest(requestId: string) {
    await removeRequest(requestId);
    toast.success("요청이 삭제되었습니다.");
  }

  async function handleStatusChange(requestId: string, status: SkillShareRequestStatus) {
    await updateRequestStatus(requestId, status);
    toast.success("상태가 변경되었습니다.");
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-xs text-muted-foreground">
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            스킬 공유
          </CardTitle>
          <AddSkillDialog onAdd={addSkill} />
        </div>
        {/* 통계 */}
        <div className="flex gap-3 pt-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            <span>총 스킬</span>
            <span className="font-semibold text-foreground">{totalSkills}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>총 요청</span>
            <span className="font-semibold text-foreground">{totalRequests}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-1">
          {(["전체", ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat as SkillShareCategory | "전체")}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                filterCategory === cat
                  ? "bg-indigo-500 text-white border-indigo-500"
                  : "bg-transparent text-muted-foreground border-border hover:border-indigo-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 스킬 목록 */}
        <Collapsible open={skillsOpen} onOpenChange={setSkillsOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full text-xs font-medium py-1 hover:text-indigo-600 transition-colors">
              <span>스킬 목록 ({filteredSkills.length})</span>
              {skillsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {filteredSkills.length === 0 ? (
              <p className="text-[10px] text-muted-foreground py-2 text-center">
                등록된 스킬이 없습니다.
              </p>
            ) : (
              <ul className="space-y-2 pt-1">
                {filteredSkills.map((skill) => {
                  const reqCount = data.requests.filter((r) => r.skillId === skill.id).length;
                  return (
                    <li
                      key={skill.id}
                      className="rounded-md border p-2.5 space-y-1.5 bg-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-medium truncate">{skill.skillName}</span>
                            <Badge className={`text-[10px] px-1.5 py-0 ${categoryBadgeClass(skill.category)}`}>
                              {skill.category}
                            </Badge>
                            <Badge className={`text-[10px] px-1.5 py-0 ${difficultyBadgeClass(skill.difficulty)}`}>
                              {skill.difficulty}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            제공자: <span className="font-medium text-foreground">{skill.providerName}</span>
                            {reqCount > 0 && (
                              <span className="ml-2 text-indigo-500">요청 {reqCount}건</span>
                            )}
                          </p>
                          {skill.description && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                              {skill.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <AddRequestDialog skill={skill} onAdd={handleAddRequest} />
                          <button
                            onClick={() => handleRemoveSkill(skill.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* 학습 요청 목록 */}
        <Collapsible open={requestsOpen} onOpenChange={setRequestsOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full text-xs font-medium py-1 hover:text-indigo-600 transition-colors border-t pt-2">
              <span>학습 요청 목록 ({data.requests.length})</span>
              {requestsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {data.requests.length === 0 ? (
              <p className="text-[10px] text-muted-foreground py-2 text-center">
                학습 요청이 없습니다.
              </p>
            ) : (
              <ul className="space-y-1.5 pt-1">
                {data.requests.map((req) => {
                  const skill = data.skills.find((s) => s.id === req.skillId);
                  return (
                    <li
                      key={req.id}
                      className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium truncate">
                          {req.requesterName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {skill ? skill.skillName : "삭제된 스킬"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Select
                          value={req.status}
                          onValueChange={(v) => handleStatusChange(req.id, v as SkillShareRequestStatus)}
                        >
                          <SelectTrigger className="h-6 text-[10px] w-16 px-1.5 py-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {REQUEST_STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Badge className={`text-[10px] px-1.5 py-0 ${requestStatusBadgeClass(req.status)}`}>
                          {req.status}
                        </Badge>
                        <button
                          onClick={() => handleRemoveRequest(req.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* 인기 스킬 */}
        <Collapsible open={popularOpen} onOpenChange={setPopularOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full text-xs font-medium py-1 hover:text-indigo-600 transition-colors border-t pt-2">
              <span>인기 스킬</span>
              {popularOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {popularSkills.filter((p) => p.requestCount > 0).length === 0 ? (
              <p className="text-[10px] text-muted-foreground py-2 text-center">
                아직 요청된 스킬이 없습니다.
              </p>
            ) : (
              <ol className="space-y-1.5 pt-1">
                {popularSkills
                  .filter((p) => p.requestCount > 0)
                  .slice(0, 5)
                  .map(({ skill, requestCount }, idx) => (
                    <li key={skill.id} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground w-3 shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs truncate block">{skill.skillName}</span>
                      </div>
                      <Badge className={`text-[10px] px-1.5 py-0 ${categoryBadgeClass(skill.category)}`}>
                        {skill.category}
                      </Badge>
                      <span className="text-[10px] text-indigo-600 font-semibold shrink-0">
                        {requestCount}건
                      </span>
                    </li>
                  ))}
              </ol>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* 카테고리별 바 차트 */}
        <Collapsible open={chartOpen} onOpenChange={setChartOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full text-xs font-medium py-1 hover:text-indigo-600 transition-colors border-t pt-2">
              <span>카테고리별 현황</span>
              {chartOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {totalSkills === 0 ? (
              <p className="text-[10px] text-muted-foreground py-2 text-center">
                등록된 스킬이 없습니다.
              </p>
            ) : (
              <div className="space-y-1.5 pt-2">
                {CATEGORIES.map((cat) => {
                  const count = categoryStats[cat] ?? 0;
                  const pct = Math.round((count / maxCategoryCount) * 100);
                  return (
                    <div key={cat} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-8 shrink-0">{cat}</span>
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-400 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium w-4 text-right shrink-0">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
