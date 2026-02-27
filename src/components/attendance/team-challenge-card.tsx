"use client";

import { useState } from "react";
import { Trophy, ChevronDown, ChevronUp, Plus, Trash2, Loader2 } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useGroupChallenges } from "@/hooks/use-group-challenges";
import type { GroupChallenge } from "@/types";

type TeamChallengeCardProps = {
  groupId: string;
  canEdit: boolean;
};

export function TeamChallengeCard({ groupId, canEdit }: TeamChallengeCardProps) {
  const { challenges, activeChallenge, currentRate, createChallenge, deleteChallenge, loading } =
    useGroupChallenges(groupId);

  const [pastOpen, setPastOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // 생성 폼 상태
  const [title, setTitle] = useState("");
  const [targetRate, setTargetRate] = useState(90);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [description, setDescription] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const pastChallenges = challenges.filter(
    (c: GroupChallenge) => c.ends_at < today && c.id !== activeChallenge?.id
  );

  const handleCreate = async () => {
    if (!title.trim() || !startsAt || !endsAt) return;
    if (startsAt > endsAt) return;
    setCreating(true);
    const ok = await createChallenge({
      title: title.trim(),
      targetRate,
      startsAt,
      endsAt,
      description: description.trim() || undefined,
    });
    setCreating(false);
    if (ok) {
      setCreateOpen(false);
      setTitle("");
      setTargetRate(90);
      setStartsAt("");
      setEndsAt("");
      setDescription("");
    }
  };

  const handleDelete = async (id: string) => {
    await deleteChallenge(id);
  };

  // 진행률 바 색상
  const getRateColor = (rate: number, target: number) => {
    if (rate >= target) return "bg-green-500";
    if (rate >= target * 0.85) return "bg-yellow-500";
    return "bg-red-500";
  };

  // 남은 일수 계산
  const getRemainingDays = (endsAt: string) => {
    const end = parseISO(endsAt);
    const now = new Date();
    return differenceInDays(end, now);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              팀 챌린지
            </CardTitle>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3 w-3" />
                챌린지 생성
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : activeChallenge ? (
            <div className="space-y-3">
              {/* 챌린지 헤더 */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold">{activeChallenge.title}</span>
                    <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                      진행중
                    </Badge>
                  </div>
                  {activeChallenge.description && (
                    <p className="text-xs text-muted-foreground">{activeChallenge.description}</p>
                  )}
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 shrink-0"
                    onClick={() => handleDelete(activeChallenge.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* 기간 및 목표 */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span>
                  {format(parseISO(activeChallenge.starts_at), "M/d")} ~{" "}
                  {format(parseISO(activeChallenge.ends_at), "M/d")}
                </span>
                <span className="text-muted-foreground/50">|</span>
                <span>목표: {activeChallenge.target_rate}%</span>
                <span className="text-muted-foreground/50">|</span>
                <span>
                  {getRemainingDays(activeChallenge.ends_at) > 0
                    ? `${getRemainingDays(activeChallenge.ends_at)}일 남음`
                    : "오늘 마지막 날"}
                </span>
              </div>

              {/* 진행률 바 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">현재 출석률</span>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      currentRate >= activeChallenge.target_rate
                        ? "text-green-600"
                        : currentRate >= activeChallenge.target_rate * 0.85
                        ? "text-yellow-600"
                        : "text-red-500"
                    }`}
                  >
                    {currentRate}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getRateColor(
                      currentRate,
                      activeChallenge.target_rate
                    )}`}
                    style={{ width: `${Math.min(currentRate, 100)}%` }}
                  />
                </div>
                {/* 목표선 표시 */}
                <div className="relative h-0">
                  <div
                    className="absolute -top-3.5 w-0.5 h-4 bg-muted-foreground/30"
                    style={{ left: `${activeChallenge.target_rate}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  목표 {activeChallenge.target_rate}%{" "}
                  {currentRate >= activeChallenge.target_rate
                    ? "달성!"
                    : `까지 ${activeChallenge.target_rate - currentRate}% 남음`}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-xs text-muted-foreground">진행 중인 챌린지가 없습니다</p>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 mt-2"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  첫 챌린지 만들기
                </Button>
              )}
            </div>
          )}

          {/* 과거 챌린지 */}
          {pastChallenges.length > 0 && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs w-full gap-1 text-muted-foreground"
                onClick={() => setPastOpen(!pastOpen)}
              >
                {pastOpen ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                과거 챌린지 {pastChallenges.length}개
              </Button>

              {pastOpen && (
                <div className="mt-2 space-y-2">
                  {pastChallenges.map((c: GroupChallenge) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/40"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium truncate">{c.title}</span>
                          {c.is_achieved ? (
                            <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                              달성
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 text-muted-foreground"
                            >
                              미달성
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {format(parseISO(c.starts_at), "M/d")} ~{" "}
                          {format(parseISO(c.ends_at), "M/d")} | 목표 {c.target_rate}%
                        </p>
                      </div>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 shrink-0"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 챌린지 생성 다이얼로그 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">팀 챌린지 생성</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">챌린지 제목 *</Label>
              <Input
                placeholder="예: 11월 연습 출석 챌린지"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">목표 출석률 (%) *</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={targetRate}
                onChange={(e) => setTargetRate(Number(e.target.value))}
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">시작일 *</Label>
                <Input
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">종료일 *</Label>
                <Input
                  type="date"
                  value={endsAt}
                  min={startsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">설명 (선택)</Label>
              <Textarea
                placeholder="챌린지 설명을 입력하세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleCreate}
              disabled={creating || !title.trim() || !startsAt || !endsAt}
            >
              {creating && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
