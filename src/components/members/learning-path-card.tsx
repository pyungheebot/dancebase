"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLearningPath } from "@/hooks/use-learning-path";
import { ChevronDown, ChevronUp, Plus, Trash2, GraduationCap, Check } from "lucide-react";
import type { LearningLevel } from "@/types";

const LEVEL_CONFIG = {
  beginner: { label: "초급", color: "bg-green-50 text-green-700 border-green-200" },
  intermediate: { label: "중급", color: "bg-orange-50 text-orange-700 border-orange-200" },
  advanced: { label: "고급", color: "bg-red-50 text-red-700 border-red-200" },
} as const;

export function LearningPathCard({ groupId }: { groupId: string }) {
  const { paths, addPath, deletePath, toggleStep, getCompletionRate } = useLearningPath(groupId);
  const [open, setOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 생성 폼 상태
  const [newTitle, setNewTitle] = useState("");
  const [newLevel, setNewLevel] = useState<LearningLevel>("beginner");
  const [newSteps, setNewSteps] = useState<{ title: string; description: string }[]>([]);
  const [stepTitle, setStepTitle] = useState("");
  const [stepDesc, setStepDesc] = useState("");

  function handleAddStep() {
    if (!stepTitle.trim()) return;
    if (newSteps.length >= 15) return;
    setNewSteps([...newSteps, { title: stepTitle.trim(), description: stepDesc.trim() }]);
    setStepTitle("");
    setStepDesc("");
  }

  function handleCreate() {
    if (!newTitle.trim() || newSteps.length === 0) return;
    addPath({ title: newTitle.trim(), level: newLevel, steps: newSteps });
    setNewTitle("");
    setNewLevel("beginner");
    setNewSteps([]);
    setDialogOpen(false);
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <CardTitle className="text-sm font-semibold">학습 경로</CardTitle>
              <Badge variant="secondary" className="text-xs">{paths.length}개</Badge>
            </div>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="w-full"><Plus className="h-3 w-3 mr-1" />경로 추가</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>학습 경로 생성</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>경로 제목</Label><Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="예: 기초 힙합" /></div>
                  <div>
                    <Label>레벨</Label>
                    <Select value={newLevel} onValueChange={(v) => setNewLevel(v as LearningLevel)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">초급</SelectItem>
                        <SelectItem value="intermediate">중급</SelectItem>
                        <SelectItem value="advanced">고급</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>스텝 ({newSteps.length}/15)</Label>
                    {newSteps.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs border rounded p-1.5">
                        <span className="font-mono text-muted-foreground w-4">{i + 1}</span>
                        <span className="font-medium">{s.title}</span>
                        <Button variant="ghost" size="icon" className="h-4 w-4 ml-auto" onClick={() => setNewSteps(newSteps.filter((_, j) => j !== i))}>×</Button>
                      </div>
                    ))}
                    <div className="flex gap-1">
                      <Input value={stepTitle} onChange={(e) => setStepTitle(e.target.value)} placeholder="스텝 제목" className="text-xs h-7" />
                      <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleAddStep} disabled={!stepTitle.trim() || newSteps.length >= 15}>추가</Button>
                    </div>
                    <Input value={stepDesc} onChange={(e) => setStepDesc(e.target.value)} placeholder="스텝 설명 (선택)" className="text-xs h-7" />
                  </div>
                  <Button onClick={handleCreate} disabled={!newTitle.trim() || newSteps.length === 0} className="w-full">생성</Button>
                </div>
              </DialogContent>
            </Dialog>

            {paths.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">학습 경로가 없습니다.</p>}

            {paths.map((path) => {
              const rate = getCompletionRate(path);
              const levelCfg = LEVEL_CONFIG[path.level];
              const isExpanded = expandedPath === path.id;
              return (
                <div key={path.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedPath(isExpanded ? null : path.id)}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{path.title}</span>
                      <Badge variant="outline" className={`text-[10px] ${levelCfg.color}`}>{levelCfg.label}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{rate}%</span>
                      <Button
                        variant="ghost" size="icon" className={`h-5 w-5 ${deleteConfirm === path.id ? "text-red-600" : ""}`}
                        onClick={(e) => { e.stopPropagation(); if (deleteConfirm === path.id) { deletePath(path.id); setDeleteConfirm(null); } else setDeleteConfirm(path.id); }}
                        onBlur={() => setDeleteConfirm(null)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {/* 진행 바 */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${rate}%` }} />
                  </div>
                  {isExpanded && (
                    <div className="space-y-1 pt-1">
                      {path.steps.map((step, i) => (
                        <div
                          key={step.id}
                          className={`flex items-start gap-2 p-1.5 rounded text-xs cursor-pointer hover:bg-muted/50 ${step.completed ? "opacity-60" : ""}`}
                          onClick={() => toggleStep(path.id, step.id)}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${step.completed ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}>
                            {step.completed && <Check className="h-3 w-3" />}
                          </div>
                          <div>
                            <span className={`font-medium ${step.completed ? "line-through" : ""}`}>{i + 1}. {step.title}</span>
                            {step.description && <p className="text-muted-foreground">{step.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
