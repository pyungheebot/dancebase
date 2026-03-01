"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Crown,
  Plus,
  Trash2,
  Vote,
  CheckCircle2,
  Lock,
  Unlock,
  Music2,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useStyleVote } from "@/hooks/use-style-vote";
import type { StyleVoteSession } from "@/types";

interface StyleVoteCardProps {
  groupId: string;
  currentUserName: string;
}

// ─── 세션 생성 폼 ─────────────────────────────────────────────
function CreateSessionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (topic: string, maxVotes: number) => void;
  onCancel: () => void;
}) {
  const [topic, setTopic] = useState("");
  const [maxVotes, setMaxVotes] = useState(1);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed) {
      toast.error(TOAST.STYLE_VOTE.TOPIC_REQUIRED);
      return;
    }
    onSubmit(trimmed, maxVotes);
    setTopic("");
    setMaxVotes(1);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/40">
      <p className="text-xs font-medium text-foreground">새 투표 세션 만들기</p>
      <div className="space-y-1">
        <Label htmlFor="vote-topic" className="text-xs">투표 주제</Label>
        <Input
          id="vote-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="예: 다음 공연 곡 선택, 안무 스타일 결정..."
          className="h-7 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="max-votes" className="text-xs">1인 최대 투표 수</Label>
        <Input
          id="max-votes"
          type="number"
          min={1}
          max={10}
          value={maxVotes}
          onChange={(e) => setMaxVotes(Number(e.target.value))}
          className="h-7 text-xs w-24"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          세션 생성
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

// ─── 후보 추가 폼 ─────────────────────────────────────────────
function AddCandidateForm({
  onSubmit,
  onCancel,
  defaultProposer,
}: {
  onSubmit: (title: string, description: string, proposedBy: string) => void;
  onCancel: () => void;
  defaultProposer: string;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proposedBy, setProposedBy] = useState(defaultProposer);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error(TOAST.STYLE_VOTE.CANDIDATE_TITLE_REQUIRED);
      return;
    }
    onSubmit(trimmedTitle, description.trim(), proposedBy.trim() || defaultProposer);
    setTitle("");
    setDescription("");
    setProposedBy(defaultProposer);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 p-3 bg-muted/20 rounded border border-border/40">
      <p className="text-xs font-medium text-foreground">후보 추가</p>
      <div className="space-y-1">
        <Label htmlFor="cand-title" className="text-xs">곡명 / 스타일명</Label>
        <Input
          id="cand-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: Ditto (NewJeans), K-Pop 팝핑 스타일..."
          className="h-7 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cand-desc" className="text-xs">설명 (선택)</Label>
        <Textarea
          id="cand-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="이 곡/스타일을 제안하는 이유..."
          className="text-xs resize-none min-h-[50px]"
          rows={2}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cand-proposer" className="text-xs">제안자</Label>
        <Input
          id="cand-proposer"
          value={proposedBy}
          onChange={(e) => setProposedBy(e.target.value)}
          placeholder="제안자 이름"
          className="h-7 text-xs"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          후보 추가
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

// ─── 단일 세션 패널 ───────────────────────────────────────────
function SessionPanel({
  session,
  currentUserName,
  onClose,
  onReopen,
  onDelete,
  onAddCandidate,
  onRemoveCandidate,
  onCastVote,
  getVoteRate,
  getWinner,
  hasVoted,
  getMyVoteCount,
}: {
  session: StyleVoteSession;
  currentUserName: string;
  onClose: () => void;
  onReopen: () => void;
  onDelete: () => void;
  onAddCandidate: (title: string, description: string, proposedBy: string) => void;
  onRemoveCandidate: (candidateId: string) => void;
  onCastVote: (candidateId: string) => void;
  getVoteRate: (candidateId: string) => number;
  getWinner: () => { id: string } | null;
  hasVoted: (candidateId: string) => boolean;
  getMyVoteCount: () => number;
}) {
  const [open, setOpen] = useState(true);
  const [showAddCandidate, setShowAddCandidate] = useState(false);

  const isOpen = session.status === "open";
  const winner = getWinner();
  const myVoteCount = getMyVoteCount();
  const totalVotes = session.candidates.reduce((sum, c) => sum + c.votes.length, 0);

  // 후보를 득표 수 내림차순으로 정렬
  const sortedCandidates = [...session.candidates].sort(
    (a, b) => b.votes.length - a.votes.length
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border border-border/50 rounded-lg overflow-hidden">
        {/* 세션 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-3 py-2 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <Vote className="h-3.5 w-3.5 text-purple-500 shrink-0" />
              <span className="text-xs font-medium truncate">{session.topic}</span>
              <Badge
                className={`text-[10px] px-1.5 py-0 shrink-0 ${
                  isOpen
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {isOpen ? "진행 중" : "마감됨"}
              </Badge>
              {totalVotes > 0 && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  총 {totalVotes}표
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {/* 세션 마감/열기 토글 */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] px-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOpen) {
                    onClose();
                    toast.success(TOAST.STYLE_VOTE.SESSION_CLOSED);
                  } else {
                    onReopen();
                    toast.success(TOAST.STYLE_VOTE.SESSION_REOPENED);
                  }
                }}
                title={isOpen ? "투표 마감" : "투표 다시 열기"}
              >
                {isOpen ? (
                  <Lock className="h-3 w-3 text-orange-500" />
                ) : (
                  <Unlock className="h-3 w-3 text-green-500" />
                )}
              </Button>
              {/* 세션 삭제 */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] px-1.5 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  toast.success(TOAST.STYLE_VOTE.SESSION_DELETED);
                }}
                title="세션 삭제"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              {open ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 py-3 space-y-3">
            {/* 투표 현황 안내 */}
            {isOpen && (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>
                  내 투표: {myVoteCount} / {session.maxVotesPerPerson}표 사용
                </span>
                {myVoteCount >= session.maxVotesPerPerson && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700">
                    최대 투표 완료
                  </Badge>
                )}
              </div>
            )}

            {/* 후보 목록 */}
            {sortedCandidates.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                아직 후보가 없습니다. 후보를 추가해보세요.
              </p>
            ) : (
              <div className="space-y-2">
                {sortedCandidates.map((candidate) => {
                  const voteRate = getVoteRate(candidate.id);
                  const voted = hasVoted(candidate.id);
                  const isWinner = winner?.id === candidate.id && candidate.votes.length > 0;
                  const canVote =
                    isOpen &&
                    (voted || myVoteCount < session.maxVotesPerPerson);

                  return (
                    <div
                      key={candidate.id}
                      className={`rounded border p-2.5 space-y-2 transition-colors ${
                        isWinner
                          ? "border-yellow-300 bg-yellow-50/60"
                          : "border-border/40 bg-background"
                      }`}
                    >
                      {/* 후보 헤더 */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isWinner && (
                            <Crown className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                          )}
                          <Music2 className="h-3 w-3 text-purple-400 shrink-0" />
                          <span className="text-xs font-medium truncate">
                            {candidate.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* 투표 버튼 */}
                          <Button
                            variant={voted ? "default" : "outline"}
                            size="sm"
                            className={`h-6 text-[10px] px-2 gap-1 ${
                              voted
                                ? "bg-purple-600 hover:bg-purple-700 border-purple-600"
                                : ""
                            }`}
                            onClick={() => {
                              if (!isOpen) {
                                toast.error(TOAST.STYLE_VOTE.CLOSED_SESSION);
                                return;
                              }
                              if (!canVote) {
                                toast.error(
                                  `최대 ${session.maxVotesPerPerson}표까지만 투표할 수 있습니다.`
                                );
                                return;
                              }
                              onCastVote(candidate.id);
                              if (voted) {
                                toast.success(TOAST.STYLE_VOTE.VOTE_CANCELLED);
                              } else {
                                toast.success(`"${candidate.title}"에 투표했습니다.`);
                              }
                            }}
                            disabled={!isOpen && !voted}
                            title={voted ? "투표 취소" : "투표하기"}
                          >
                            {voted ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <Vote className="h-3 w-3" />
                            )}
                            {voted ? "투표함" : "투표"}
                          </Button>
                          {/* 후보 삭제 */}
                          {isOpen && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-1 text-destructive hover:text-destructive"
                              onClick={() => {
                                onRemoveCandidate(candidate.id);
                                toast.success(TOAST.STYLE_VOTE.CANDIDATE_DELETED);
                              }}
                              title="후보 삭제"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* 설명 */}
                      {candidate.description && (
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          {candidate.description}
                        </p>
                      )}

                      {/* 제안자 */}
                      <span className="text-[10px] text-muted-foreground">
                        제안: {candidate.proposedBy}
                      </span>

                      {/* 득표 바 차트 */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">
                            {candidate.votes.length}표
                          </span>
                          <span
                            className={`font-medium ${
                              isWinner ? "text-yellow-600" : "text-foreground"
                            }`}
                          >
                            {voteRate}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isWinner ? "bg-yellow-400" : "bg-purple-400"
                            }`}
                            style={{ width: `${voteRate}%` }}
                          />
                        </div>
                        {/* 투표한 멤버 목록 */}
                        {candidate.votes.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {candidate.votes.map((name) => (
                              <span
                                key={name}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 후보 추가 */}
            {isOpen && (
              <>
                {showAddCandidate ? (
                  <AddCandidateForm
                    defaultProposer={currentUserName}
                    onSubmit={(title, description, proposedBy) => {
                      onAddCandidate(title, description, proposedBy);
                      setShowAddCandidate(false);
                      toast.success(TOAST.STYLE_VOTE.CANDIDATE_ADDED);
                    }}
                    onCancel={() => setShowAddCandidate(false)}
                  />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs w-full border-dashed"
                    onClick={() => setShowAddCandidate(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    후보 추가
                  </Button>
                )}
              </>
            )}

            {/* 마감 결과 요약 */}
            {!isOpen && winner && (
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Crown className="h-4 w-4 text-yellow-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-yellow-700 font-medium">최종 선택</p>
                  <p className="text-xs font-semibold text-yellow-800 truncate">
                    {winner.id &&
                      session.candidates.find((c) => c.id === winner.id)?.title}
                  </p>
                </div>
              </div>
            )}

            {/* 세션 날짜 정보 */}
            <div className="text-[10px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/30">
              <p>
                생성:{" "}
                {new Date(session.createdAt).toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {session.closedAt && (
                <p>
                  마감:{" "}
                  {new Date(session.closedAt).toLocaleDateString("ko-KR", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────
export function StyleVoteCard({ groupId, currentUserName }: StyleVoteCardProps) {
  const [cardOpen, setCardOpen] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    getSessions,
    createSession,
    closeSession,
    reopenSession,
    deleteSession,
    addCandidate,
    removeCandidate,
    castVote,
    getVoteRate,
    getWinner,
    hasVoted,
    getMyVoteCount,
  } = useStyleVote(groupId);

  const sessions = getSessions();
  const openCount = sessions.filter((s) => s.status === "open").length;

  return (
    <Card className="shadow-sm">
      <Collapsible open={cardOpen} onOpenChange={setCardOpen}>
        <CardHeader className="py-2 px-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Vote className="h-4 w-4 text-purple-500" />
                <CardTitle className="text-sm font-semibold">
                  안무 스타일 투표
                </CardTitle>
                {openCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700">
                    진행 중 {openCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateForm((v) => !v);
                    if (!cardOpen) setCardOpen(true);
                  }}
                  title="새 투표 세션"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                {cardOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0 space-y-3">
            {/* 새 세션 생성 폼 */}
            {showCreateForm && (
              <CreateSessionForm
                onSubmit={(topic, maxVotes) => {
                  createSession(topic, maxVotes);
                  setShowCreateForm(false);
                  toast.success(TOAST.STYLE_VOTE.SESSION_CREATED);
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            )}

            {/* 세션 목록 */}
            {sessions.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <Vote className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-xs text-muted-foreground">
                  아직 투표 세션이 없습니다.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  첫 번째 투표 만들기
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <SessionPanel
                    key={session.id}
                    session={session}
                    currentUserName={currentUserName}
                    onClose={() => closeSession(session.id)}
                    onReopen={() => reopenSession(session.id)}
                    onDelete={() => deleteSession(session.id)}
                    onAddCandidate={(title, description, proposedBy) =>
                      addCandidate(session.id, title, description, proposedBy)
                    }
                    onRemoveCandidate={(candidateId) =>
                      removeCandidate(session.id, candidateId)
                    }
                    onCastVote={(candidateId) =>
                      castVote(session.id, candidateId, currentUserName)
                    }
                    getVoteRate={(candidateId) =>
                      getVoteRate(session, candidateId)
                    }
                    getWinner={() => getWinner(session)}
                    hasVoted={(candidateId) =>
                      hasVoted(session, candidateId, currentUserName)
                    }
                    getMyVoteCount={() => getMyVoteCount(session, currentUserName)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
