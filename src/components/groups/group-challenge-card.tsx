"use client";

import { useState } from "react";
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Users,
  Calendar,
  Medal,
  Pencil,
  CheckCircle2,
  Clock,
  Circle,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGroupChallengeCard } from "@/hooks/use-group-challenge-card";
import type {
  DanceGroupChallengeCategory,
  DanceGroupChallengeEntry,
  DanceGroupChallengeParticipantStatus,
} from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<DanceGroupChallengeCategory, string> = {
  choreography: "안무도전",
  freestyle: "프리스타일",
  cover: "커버댄스",
  fitness: "체력챌린지",
};

const CATEGORY_BADGE_CLASS: Record<DanceGroupChallengeCategory, string> = {
  choreography: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  freestyle: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  cover: "bg-pink-100 text-pink-700 hover:bg-pink-100",
  fitness: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
};

const PARTICIPANT_STATUS_LABELS: Record<DanceGroupChallengeParticipantStatus, string> = {
  not_started: "미시작",
  in_progress: "진행중",
  completed: "완료",
};

const PARTICIPANT_STATUS_ICON: Record<DanceGroupChallengeParticipantStatus, React.ReactNode> = {
  not_started: <Circle className="h-3 w-3 text-gray-400" />,
  in_progress: <Clock className="h-3 w-3 text-blue-500" />,
  completed: <CheckCircle2 className="h-3 w-3 text-green-500" />,
};

const PARTICIPANT_STATUS_CLASS: Record<DanceGroupChallengeParticipantStatus, string> = {
  not_started: "text-gray-500",
  in_progress: "text-blue-600",
  completed: "text-green-600",
};

// ─── 날짜 유틸 ────────────────────────────────────────────────

function calcStatus(startDate: string, endDate: string): "upcoming" | "active" | "completed" {
  const today = new Date().toISOString().slice(0, 10);
  if (today < startDate) return "upcoming";
  if (today > endDate) return "completed";
  return "active";
}

function daysRemaining(endDate: string): number {
  const diff = Math.ceil(
    (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(diff, 0);
}

function progressPercent(startDate: string, endDate: string): number {
  const total = new Date(endDate).getTime() - new Date(startDate).getTime();
  const elapsed = Date.now() - new Date(startDate).getTime();
  if (total <= 0) return 100;
  return Math.min(Math.max(Math.round((elapsed / total) * 100), 0), 100);
}

// ─── 기본 폼 초기값 ──────────────────────────────────────────

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "choreography" as DanceGroupChallengeCategory,
  startDate: "",
  endDate: "",
};

// ─── 챌린지 상세 다이얼로그 ──────────────────────────────────

function ChallengeDetailDialog({
  challenge,
  open,
  onClose,
  onAddParticipant,
  onUpdateParticipantStatus,
  onRemoveParticipant,
}: {
  challenge: DanceGroupChallengeEntry;
  open: boolean;
  onClose: () => void;
  onAddParticipant: (challengeId: string, name: string) => boolean;
  onUpdateParticipantStatus: (
    challengeId: string,
    participantId: string,
    status: DanceGroupChallengeParticipantStatus
  ) => void;
  onRemoveParticipant: (challengeId: string, participantId: string) => void;
}) {
  const [newName, setNewName] = useState("");

  const handleAddParticipant = () => {
    const success = onAddParticipant(challenge.id, newName);
    if (success) setNewName("");
  };

  const sortedParticipants = [...challenge.participants].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return -1;
    if (b.status === "completed" && a.status !== "completed") return 1;
    if (a.completedRank !== null && b.completedRank !== null) {
      return a.completedRank - b.completedRank;
    }
    return 0;
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            {challenge.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 ${CATEGORY_BADGE_CLASS[challenge.category]}`}
            >
              {CATEGORY_LABELS[challenge.category]}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {challenge.startDate} ~ {challenge.endDate}
            </span>
          </div>

          {challenge.description && (
            <p className="text-sm text-muted-foreground">{challenge.description}</p>
          )}

          {calcStatus(challenge.startDate, challenge.endDate) === "active" && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>진행률</span>
                <span>D-{daysRemaining(challenge.endDate)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{
                    width: `${progressPercent(challenge.startDate, challenge.endDate)}%`,
                  }}
                />
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-medium flex items-center gap-1">
              <Users className="h-3 w-3" />
              참여자 ({challenge.participants.length}명)
            </p>

            <div className="flex gap-2">
              <Input
                className="h-7 text-xs"
                placeholder="참여자 이름 입력"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddParticipant();
                }}
              />
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleAddParticipant}
              >
                <Plus className="h-3 w-3 mr-1" />
                추가
              </Button>
            </div>

            {sortedParticipants.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                참여자가 없습니다
              </p>
            ) : (
              <div className="space-y-1.5">
                {sortedParticipants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/40"
                  >
                    <div className="flex items-center gap-2">
                      {p.completedRank !== null ? (
                        <span className="text-[10px] font-bold text-yellow-600 w-5 text-center">
                          {p.completedRank === 1 ? "1위" : p.completedRank === 2 ? "2위" : `${p.completedRank}위`}
                        </span>
                      ) : (
                        <span className="w-5" />
                      )}
                      <span className="text-xs font-medium">{p.name}</span>
                      <span
                        className={`flex items-center gap-0.5 text-[10px] ${PARTICIPANT_STATUS_CLASS[p.status]}`}
                      >
                        {PARTICIPANT_STATUS_ICON[p.status]}
                        {PARTICIPANT_STATUS_LABELS[p.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Select
                        value={p.status}
                        onValueChange={(v) =>
                          onUpdateParticipantStatus(
                            challenge.id,
                            p.id,
                            v as DanceGroupChallengeParticipantStatus
                          )
                        }
                      >
                        <SelectTrigger className="h-6 text-[10px] w-24 px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started" className="text-xs">
                            미시작
                          </SelectItem>
                          <SelectItem value="in_progress" className="text-xs">
                            진행중
                          </SelectItem>
                          <SelectItem value="completed" className="text-xs">
                            완료
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveParticipant(challenge.id, p.id)}
                        aria-label="참가자 제거"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {challenge.participants.some((p) => p.status === "completed") && (
              <div className="mt-2 p-2 bg-yellow-50 rounded-md border border-yellow-200">
                <p className="text-[10px] font-medium text-yellow-700 flex items-center gap-1 mb-1">
                  <Medal className="h-3 w-3" />
                  완료 순위
                </p>
                {[...challenge.participants]
                  .filter((p) => p.status === "completed" && p.completedRank !== null)
                  .sort((a, b) => (a.completedRank ?? 0) - (b.completedRank ?? 0))
                  .map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-xs text-yellow-800">
                      <span className="font-bold w-6">
                        {p.completedRank === 1
                          ? "1위"
                          : p.completedRank === 2
                          ? "2위"
                          : `${p.completedRank}위`}
                      </span>
                      <span>{p.name}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 챌린지 폼 다이얼로그 ────────────────────────────────────

function ChallengeFormDialog({
  open,
  onClose,
  onSubmit,
  initialValues,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: {
    title: string;
    description: string;
    category: DanceGroupChallengeCategory;
    startDate: string;
    endDate: string;
  }) => boolean;
  initialValues?: typeof EMPTY_FORM;
  mode: "create" | "edit";
}) {
  const [form, setForm] = useState(initialValues ?? EMPTY_FORM);

  const handleSubmit = () => {
    const success = onSubmit(form);
    if (success && mode === "create") {
      setForm(EMPTY_FORM);
      onClose();
    } else if (success && mode === "edit") {
      onClose();
    }
  };

  // initialValues 변경 시 폼 초기화
  const handleOpen = (v: boolean) => {
    if (v && initialValues) setForm(initialValues);
    if (!v) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "새 챌린지 만들기" : "챌린지 수정"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block">제목 *</label>
            <Input
              className="h-8 text-sm"
              placeholder="챌린지 제목"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">설명</label>
            <Input
              className="h-8 text-sm"
              placeholder="간단한 설명 (선택)"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">카테고리 *</label>
            <Select
              value={form.category}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  category: v as DanceGroupChallengeCategory,
                }))
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="choreography">안무도전</SelectItem>
                <SelectItem value="freestyle">프리스타일</SelectItem>
                <SelectItem value="cover">커버댄스</SelectItem>
                <SelectItem value="fitness">체력챌린지</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium mb-1 block">시작일 *</label>
              <Input
                type="date"
                className="h-8 text-sm"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">종료일 *</label>
              <Input
                type="date"
                className="h-8 text-sm"
                value={form.endDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endDate: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onClose}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
            >
              {mode === "create" ? "생성" : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 챌린지 아이템 ───────────────────────────────────────────

function ChallengeItem({
  challenge,
  onEdit,
  onDelete,
  onViewDetail,
}: {
  challenge: DanceGroupChallengeEntry;
  onEdit: (challenge: DanceGroupChallengeEntry) => void;
  onDelete: (id: string) => void;
  onViewDetail: (challenge: DanceGroupChallengeEntry) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = calcStatus(challenge.startDate, challenge.endDate);
  const completedCount = challenge.participants.filter(
    (p) => p.status === "completed"
  ).length;
  const totalCount = challenge.participants.length;

  return (
    <div className="border rounded-lg p-3 space-y-2 hover:bg-muted/20 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex-1 cursor-pointer"
          onClick={() => onViewDetail(challenge)}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{challenge.title}</span>
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 ${CATEGORY_BADGE_CLASS[challenge.category]}`}
            >
              {CATEGORY_LABELS[challenge.category]}
            </Badge>
          </div>
          {challenge.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {challenge.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground"
            onClick={() => onEdit(challenge)}
            aria-label="챌린지 수정"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${confirmDelete ? "text-destructive" : "text-muted-foreground"}`}
            onClick={() => {
              if (confirmDelete) {
                onDelete(challenge.id);
                setConfirmDelete(false);
              } else {
                setConfirmDelete(true);
              }
            }}
            onBlur={() => setConfirmDelete(false)}
            aria-label="챌린지 삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {challenge.startDate} ~ {challenge.endDate}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {totalCount}명 참여
        </span>
        {completedCount > 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            {completedCount}명 완료
          </span>
        )}
      </div>

      {status === "active" && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>기간 진행률</span>
            <span>D-{daysRemaining(challenge.endDate)}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{
                width: `${progressPercent(challenge.startDate, challenge.endDate)}%`,
              }}
            />
          </div>
        </div>
      )}

      {totalCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {challenge.participants.slice(0, 5).map((p) => (
            <span
              key={p.id}
              className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-muted ${PARTICIPANT_STATUS_CLASS[p.status]}`}
            >
              {PARTICIPANT_STATUS_ICON[p.status]}
              {p.name}
            </span>
          ))}
          {totalCount > 5 && (
            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5">
              +{totalCount - 5}명
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 카테고리별 바 차트 ──────────────────────────────────────

function CategoryBarChart({
  categoryCounts,
}: {
  categoryCounts: Record<DanceGroupChallengeCategory, number>;
}) {
  const maxCount = Math.max(...Object.values(categoryCounts), 1);
  const categories: DanceGroupChallengeCategory[] = [
    "choreography",
    "freestyle",
    "cover",
    "fitness",
  ];

  return (
    <div className="space-y-2">
      {categories.map((cat) => {
        const count = categoryCounts[cat];
        const pct = Math.round((count / maxCount) * 100);
        return (
          <div key={cat} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-16 shrink-0">
              {CATEGORY_LABELS[cat]}
            </span>
            <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden">
              <div
                className={`h-full rounded-sm transition-all ${
                  cat === "choreography"
                    ? "bg-purple-400"
                    : cat === "freestyle"
                    ? "bg-orange-400"
                    : cat === "cover"
                    ? "bg-pink-400"
                    : "bg-cyan-400"
                }`}
                style={{ width: count === 0 ? "0%" : `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-6 text-right shrink-0">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────

export function GroupChallengeCard({ groupId }: { groupId: string }) {
  const {
    activeChallenges,
    upcomingChallenges,
    completedList,
    total,
    completionRate,
    categoryCounts,
    popularCategory,
    loading,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    addParticipant,
    updateParticipantStatus,
    removeParticipant,
  } = useGroupChallengeCard(groupId);

  const [isOpen, setIsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DanceGroupChallengeEntry | null>(
    null
  );
  const [detailTarget, setDetailTarget] =
    useState<DanceGroupChallengeEntry | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "upcoming" | "completed">(
    "active"
  );
  const [showChart, setShowChart] = useState(false);

  const tabItems =
    activeTab === "active"
      ? activeChallenges
      : activeTab === "upcoming"
      ? upcomingChallenges
      : completedList;

  const handleEdit = (challenge: DanceGroupChallengeEntry) => {
    setEditTarget(challenge);
  };

  const handleEditSubmit = (values: {
    title: string;
    description: string;
    category: DanceGroupChallengeCategory;
    startDate: string;
    endDate: string;
  }): boolean => {
    if (!editTarget) return false;
    const result = updateChallenge(editTarget.id, values);
    if (result) setEditTarget(null);
    return result;
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="border rounded-lg bg-card shadow-sm">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-semibold">그룹 챌린지</span>
                {activeChallenges.length > 0 && (
                  <Badge className="h-4 px-1.5 text-[10px] bg-green-600">
                    진행중 {activeChallenges.length}
                  </Badge>
                )}
                {total > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    총 {total}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!loading && total > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    완료율 {completionRate}%
                  </span>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <Separator />
            <div className="p-3 space-y-3">
              {/* 통계 요약 */}
              {total > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md bg-muted/40 p-2 text-center">
                    <p className="text-xs font-bold text-foreground">{total}</p>
                    <p className="text-[10px] text-muted-foreground">총 챌린지</p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2 text-center">
                    <p className="text-xs font-bold text-green-600">
                      {completionRate}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">완료율</p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2 text-center">
                    <p className="text-xs font-bold text-purple-600 truncate">
                      {popularCategory
                        ? CATEGORY_LABELS[popularCategory]
                        : "-"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">인기 카테고리</p>
                  </div>
                </div>
              )}

              {/* 차트 토글 */}
              {total > 0 && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-muted-foreground px-2"
                    onClick={() => setShowChart((v) => !v)}
                  >
                    <BarChart2 className="h-3 w-3 mr-1" />
                    카테고리별 통계{showChart ? " 접기" : " 보기"}
                  </Button>
                  {showChart && (
                    <div className="mt-2 p-2 bg-muted/30 rounded-md">
                      <CategoryBarChart categoryCounts={categoryCounts} />
                    </div>
                  )}
                </div>
              )}

              {/* 툴바 */}
              <div className="flex items-center justify-between">
                <Tabs
                  value={activeTab}
                  onValueChange={(v) =>
                    setActiveTab(v as "active" | "upcoming" | "completed")
                  }
                >
                  <TabsList className="h-7">
                    <TabsTrigger value="active" className="text-[10px] px-2 h-6">
                      진행중 {activeChallenges.length > 0 && `(${activeChallenges.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="upcoming" className="text-[10px] px-2 h-6">
                      예정 {upcomingChallenges.length > 0 && `(${upcomingChallenges.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="text-[10px] px-2 h-6">
                      완료 {completedList.length > 0 && `(${completedList.length})`}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  챌린지 추가
                </Button>
              </div>

              {/* 챌린지 목록 */}
              <Tabs value={activeTab}>
                <TabsContent value={activeTab} className="mt-0">
                  {loading ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      로딩 중...
                    </div>
                  ) : tabItems.length === 0 ? (
                    <div className="text-center py-6 space-y-2">
                      <Trophy className="h-8 w-8 mx-auto text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground">
                        {activeTab === "active"
                          ? "진행 중인 챌린지가 없습니다"
                          : activeTab === "upcoming"
                          ? "예정된 챌린지가 없습니다"
                          : "완료된 챌린지가 없습니다"}
                      </p>
                      {activeTab === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setCreateOpen(true)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          첫 챌린지 만들기
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tabItems.map((challenge) => (
                        <ChallengeItem
                          key={challenge.id}
                          challenge={challenge}
                          onEdit={handleEdit}
                          onDelete={deleteChallenge}
                          onViewDetail={setDetailTarget}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* 생성 다이얼로그 */}
      <ChallengeFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={createChallenge}
        mode="create"
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <ChallengeFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditSubmit}
          initialValues={{
            title: editTarget.title,
            description: editTarget.description,
            category: editTarget.category,
            startDate: editTarget.startDate,
            endDate: editTarget.endDate,
          }}
          mode="edit"
        />
      )}

      {/* 상세 다이얼로그 */}
      {detailTarget && (
        <ChallengeDetailDialog
          challenge={detailTarget}
          open={!!detailTarget}
          onClose={() => setDetailTarget(null)}
          onAddParticipant={addParticipant}
          onUpdateParticipantStatus={updateParticipantStatus}
          onRemoveParticipant={removeParticipant}
        />
      )}
    </>
  );
}
