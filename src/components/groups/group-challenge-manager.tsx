"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useGroupChallengeManager } from "@/hooks/use-group-challenge-manager";
import { Trophy, Plus, Trash2, Users, Calendar } from "lucide-react";
import type { GroupChallengeItem, GroupChallengeType } from "@/types";

const STATUS_COLORS = {
  active: "bg-green-50 text-green-700 border-green-200",
  upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-gray-50 text-gray-600 border-gray-200",
} as const;

const STATUS_LABELS = { active: "진행 중", upcoming: "예정", completed: "완료" };
const TYPE_LABELS = { individual: "개인", team: "팀" };

function daysRemaining(endDate: string) {
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

function progressPercent(startDate: string, endDate: string) {
  const total = new Date(endDate).getTime() - new Date(startDate).getTime();
  const elapsed = Date.now() - new Date(startDate).getTime();
  if (total <= 0) return 100;
  return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);
}

function ChallengeCard({
  challenge,
  onDelete,
  onJoin,
  onLeave,
}: {
  challenge: GroupChallengeItem;
  onDelete: (id: string) => void;
  onJoin: (id: string, name: string) => void;
  onLeave: (id: string, name: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [joinName, setJoinName] = useState("");

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{challenge.title}</span>
          <Badge variant="outline" className={STATUS_COLORS[challenge.status]}>{STATUS_LABELS[challenge.status]}</Badge>
          <Badge variant="secondary" className="text-xs">{TYPE_LABELS[challenge.type]}</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 ${confirmDelete ? "text-red-600" : ""}`}
          onClick={() => {
            if (confirmDelete) { onDelete(challenge.id); setConfirmDelete(false); }
            else setConfirmDelete(true);
          }}
          onBlur={() => setConfirmDelete(false)}
          aria-label="챌린지 삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{challenge.goal}</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{challenge.startDate} ~ {challenge.endDate}</span>
        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{challenge.participants.length}명</span>
      </div>
      {challenge.status === "active" && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>진행률</span>
            <span>D-{daysRemaining(challenge.endDate)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progressPercent(challenge.startDate, challenge.endDate)}%` }} />
          </div>
        </div>
      )}
      {challenge.participants.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {challenge.participants.map((p) => (
            <Badge key={p} variant="secondary" className="text-xs cursor-pointer" onClick={() => onLeave(challenge.id, p)}>
              {p} ×
            </Badge>
          ))}
        </div>
      )}
      {challenge.status !== "completed" && (
        <div className="flex gap-1">
          <Input placeholder="참가자명" value={joinName} onChange={(e) => setJoinName(e.target.value)} className="h-7 text-xs" />
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { if (joinName.trim()) { onJoin(challenge.id, joinName.trim()); setJoinName(""); } }}>참가</Button>
        </div>
      )}
    </div>
  );
}

export function GroupChallengeManager({ groupId }: { groupId: string }) {
  const { active, upcoming, completed, addChallenge, deleteChallenge, joinChallenge, leaveChallenge } = useGroupChallengeManager(groupId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<GroupChallengeType>("individual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [goal, setGoal] = useState("");
  const [tab, setTab] = useState<"active" | "upcoming" | "completed">("active");

  const total = active.length + upcoming.length + completed.length;
  const items = tab === "active" ? active : tab === "upcoming" ? upcoming : completed;

  function handleCreate() {
    if (!title.trim() || !startDate || !endDate || !goal.trim()) return;
    addChallenge({ title: title.trim(), description: description.trim(), type, startDate, endDate, goal: goal.trim() });
    setTitle(""); setDescription(""); setType("individual"); setStartDate(""); setEndDate(""); setGoal("");
    setDialogOpen(false);
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Trophy className="h-4 w-4 mr-1" />챌린지
          {active.length > 0 && <Badge className="ml-1 h-4 px-1 text-[10px]">{active.length}</Badge>}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            챌린지 <Badge variant="secondary">{total}개</Badge>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />새 챌린지</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>챌린지 생성</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>제목</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="챌린지 제목" /></div>
                  <div><Label>설명</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="챌린지 설명" rows={2} /></div>
                  <div>
                    <Label>유형</Label>
                    <RadioGroup value={type} onValueChange={(v) => setType(v as GroupChallengeType)} className="flex gap-4 mt-1">
                      <div className="flex items-center gap-1"><RadioGroupItem value="individual" id="ct-ind" /><Label htmlFor="ct-ind" className="text-sm">개인</Label></div>
                      <div className="flex items-center gap-1"><RadioGroupItem value="team" id="ct-team" /><Label htmlFor="ct-team" className="text-sm">팀</Label></div>
                    </RadioGroup>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>시작일</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                    <div><Label>종료일</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
                  </div>
                  <div><Label>목표</Label><Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="예: 매일 30분 연습" /></div>
                  <Button onClick={handleCreate} disabled={!title.trim() || !startDate || !endDate || !goal.trim()} className="w-full">생성</Button>
                </div>
              </DialogContent>
            </Dialog>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="flex gap-1">
            {(["active", "upcoming", "completed"] as const).map((t) => (
              <Button key={t} variant={tab === t ? "default" : "outline"} size="sm" onClick={() => setTab(t)} className="text-xs">
                {STATUS_LABELS[t]}({t === "active" ? active.length : t === "upcoming" ? upcoming.length : completed.length})
              </Button>
            ))}
          </div>
          {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">{STATUS_LABELS[tab]} 챌린지가 없습니다.</p>}
          {items.map((c) => (
            <ChallengeCard key={c.id} challenge={c} onDelete={deleteChallenge} onJoin={joinChallenge} onLeave={leaveChallenge} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
