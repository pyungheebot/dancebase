"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Trash2,
  Vote,
  Lock,
  BarChart3,
  PlusCircle,
  X,
  CheckCircle2,
  Clock,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useMeetingVote } from "@/hooks/use-meeting-vote";
import type { MeetingVoteAgendaItem } from "@/types";

// ——————————————————————————————
// 안건 생성 다이얼로그
// ——————————————————————————————

interface CreateAgendaDialogProps {
  onSubmit: (params: {
    meetingTitle: string;
    question: string;
    options: string[];
    isMultiSelect: boolean;
    isAnonymous: boolean;
    deadline: string | null;
  }) => void;
}

function CreateAgendaDialog({ onSubmit }: CreateAgendaDialogProps) {
  const [open, setOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [deadline, setDeadline] = useState("");

  const reset = () => {
    setMeetingTitle("");
    setQuestion("");
    setOptions(["", ""]);
    setIsMultiSelect(false);
    setIsAnonymous(false);
    setDeadline("");
  };

  const addOption = () => {
    if (options.length >= 10) {
      toast.error("선택지는 최대 10개까지 추가할 수 있습니다.");
      return;
    }
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast.error("선택지는 최소 2개 이상 필요합니다.");
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    setOptions(options.map((opt, i) => (i === index ? value : opt)));
  };

  const handleSubmit = () => {
    if (!meetingTitle.trim()) {
      toast.error("회의 제목을 입력해주세요.");
      return;
    }
    if (!question.trim()) {
      toast.error("안건 질문을 입력해주세요.");
      return;
    }
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      toast.error("선택지를 최소 2개 이상 입력해주세요.");
      return;
    }
    onSubmit({
      meetingTitle: meetingTitle.trim(),
      question: question.trim(),
      options: validOptions,
      isMultiSelect,
      isAnonymous,
      deadline: deadline ? new Date(deadline).toISOString() : null,
    });
    toast.success("안건이 등록되었습니다.");
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          안건 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">새 안건 등록</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* 회의 제목 */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">회의 제목</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 2024년 1월 정기 회의"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
            />
          </div>

          {/* 안건 질문 */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">안건 질문</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 다음 공연 의상 색상을 결정해주세요."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          {/* 선택지 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">선택지</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1 px-2"
                onClick={addOption}
              >
                <PlusCircle className="h-3 w-3" />
                추가
              </Button>
            </div>
            <div className="flex flex-col gap-1.5">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground w-4 text-right shrink-0">
                    {i + 1}.
                  </span>
                  <Input
                    className="h-7 text-xs flex-1"
                    placeholder={`선택지 ${i + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeOption(i)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* 옵션 설정 */}
          <div className="flex flex-col gap-2 rounded-md border p-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium">복수 선택 허용</span>
                <span className="text-[10px] text-muted-foreground">
                  여러 항목을 동시에 선택할 수 있습니다
                </span>
              </div>
              <Switch
                checked={isMultiSelect}
                onCheckedChange={setIsMultiSelect}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium">익명 투표</span>
                <span className="text-[10px] text-muted-foreground">
                  투표자 이름이 공개되지 않습니다
                </span>
              </div>
              <Switch
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
            </div>
          </div>

          {/* 마감일 */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">마감일 (선택)</Label>
            <Input
              type="datetime-local"
              className="h-8 text-xs"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => { reset(); setOpen(false); }}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ——————————————————————————————
// 투표 결과 바 차트
// ——————————————————————————————

function ResultBar({
  text,
  count,
  percentage,
  isWinner,
}: {
  text: string;
  count: number;
  percentage: number;
  isWinner: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span
          className={`text-xs truncate max-w-[60%] ${
            isWinner ? "font-semibold text-primary" : "text-muted-foreground"
          }`}
        >
          {isWinner && <span className="mr-1">1위</span>}
          {text}
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {count}표 ({percentage}%)
        </span>
      </div>
      <div className="relative h-5 rounded-full bg-muted overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
            isWinner ? "bg-primary" : "bg-muted-foreground/30"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ——————————————————————————————
// 개별 안건 카드
// ——————————————————————————————

interface AgendaItemCardProps {
  agenda: MeetingVoteAgendaItem;
  voterName: string;
  onCastVote: (agendaId: string, optionIds: string[], voterName: string) => void;
  onRemoveVote: (agendaId: string, voterName: string) => void;
  onCloseAgenda: (agendaId: string) => void;
  onDeleteAgenda: (agendaId: string) => void;
}

function AgendaItemCard({
  agenda,
  voterName,
  onCastVote,
  onRemoveVote,
  onCloseAgenda,
  onDeleteAgenda,
}: AgendaItemCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showVote, setShowVote] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // 현재 사용자 투표 여부
  const myVotes = agenda.votes.filter((v) => v.voterName === voterName);
  const hasVoted = myVotes.length > 0;
  const myOptionIds = myVotes.map((v) => v.optionId);

  // 마감 여부 (기간 초과 포함)
  const isExpired =
    agenda.deadline !== null && new Date(agenda.deadline) < new Date();
  const effectivelyClosed = agenda.isClosed || isExpired;

  // 결과 계산
  const totalVotes = agenda.votes.length;
  const optionResults = useMemo(() => {
    return agenda.options.map((opt) => {
      const count = agenda.votes.filter((v) => v.optionId === opt.id).length;
      const percentage =
        totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
      return { ...opt, count, percentage };
    });
  }, [agenda.options, agenda.votes, totalVotes]);

  const maxCount = Math.max(...optionResults.map((r) => r.count), 0);

  // 단일 선택 변경
  const handleRadioChange = (optionId: string) => {
    setSelectedOptions([optionId]);
  };

  // 복수 선택 변경
  const handleCheckboxChange = (optionId: string, checked: boolean) => {
    if (checked) {
      setSelectedOptions((prev) => [...prev, optionId]);
    } else {
      setSelectedOptions((prev) => prev.filter((id) => id !== optionId));
    }
  };

  const handleVoteSubmit = () => {
    if (!voterName.trim()) {
      toast.error("투표자 이름을 입력해주세요.");
      return;
    }
    if (selectedOptions.length === 0) {
      toast.error("선택지를 하나 이상 선택해주세요.");
      return;
    }
    onCastVote(agenda.id, selectedOptions, voterName);
    toast.success("투표가 등록되었습니다.");
    setShowVote(false);
    setSelectedOptions([]);
  };

  const handleRemoveVote = () => {
    onRemoveVote(agenda.id, voterName);
    toast.success("투표가 취소되었습니다.");
  };

  const handleClose = () => {
    onCloseAgenda(agenda.id);
    toast.success("안건이 마감되었습니다.");
  };

  const handleDelete = () => {
    onDeleteAgenda(agenda.id);
    toast.success("안건이 삭제되었습니다.");
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2 px-3 py-2.5">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground font-medium">
              {agenda.meetingTitle}
            </span>
            {effectivelyClosed ? (
              <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border-0">
                마감
              </Badge>
            ) : (
              <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-0">
                진행중
              </Badge>
            )}
            {agenda.isAnonymous && (
              <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-0 gap-0.5">
                <EyeOff className="h-2.5 w-2.5" />
                익명
              </Badge>
            )}
            {agenda.isMultiSelect && (
              <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-0">
                복수선택
              </Badge>
            )}
          </div>
          <p className="text-xs font-medium leading-tight">{agenda.question}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground">
              {totalVotes}명 투표
            </span>
            {agenda.deadline && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {new Date(agenda.deadline).toLocaleDateString("ko-KR", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                까지
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 shrink-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* 본문 (접기/펼치기) */}
      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-3">
          {/* 결과 차트 */}
          <div className="flex flex-col gap-1.5">
            {optionResults.map((opt) => (
              <ResultBar
                key={opt.id}
                text={opt.text}
                count={opt.count}
                percentage={opt.percentage}
                isWinner={opt.count === maxCount && maxCount > 0}
              />
            ))}
          </div>

          {/* 투표 폼 */}
          {!effectivelyClosed && showVote && (
            <div className="rounded-md border bg-muted/30 p-2.5 flex flex-col gap-2">
              <p className="text-xs font-medium">
                {agenda.isMultiSelect ? "복수 선택 가능" : "하나만 선택"}
              </p>
              {agenda.isMultiSelect ? (
                <div className="flex flex-col gap-1.5">
                  {agenda.options.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`check-${agenda.id}-${opt.id}`}
                        checked={selectedOptions.includes(opt.id)}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(opt.id, checked === true)
                        }
                      />
                      <label
                        htmlFor={`check-${agenda.id}-${opt.id}`}
                        className="text-xs cursor-pointer"
                      >
                        {opt.text}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <RadioGroup
                  value={selectedOptions[0] ?? ""}
                  onValueChange={handleRadioChange}
                  className="gap-1.5"
                >
                  {agenda.options.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <RadioGroupItem
                        id={`radio-${agenda.id}-${opt.id}`}
                        value={opt.id}
                      />
                      <label
                        htmlFor={`radio-${agenda.id}-${opt.id}`}
                        className="text-xs cursor-pointer"
                      >
                        {opt.text}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              <div className="flex items-center gap-1.5 pt-1">
                <Button
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={handleVoteSubmit}
                >
                  투표
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => { setShowVote(false); setSelectedOptions([]); }}
                >
                  취소
                </Button>
              </div>
            </div>
          )}

          {/* 내 투표 정보 */}
          {hasVoted && !agenda.isAnonymous && (
            <div className="flex items-center gap-1.5 text-[10px] text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              <span>
                투표 완료:{" "}
                {myOptionIds
                  .map(
                    (id) =>
                      agenda.options.find((o) => o.id === id)?.text ?? id
                  )
                  .join(", ")}
              </span>
            </div>
          )}
          {hasVoted && agenda.isAnonymous && (
            <div className="flex items-center gap-1.5 text-[10px] text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              <span>투표 완료 (익명)</span>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {!effectivelyClosed && !showVote && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  setSelectedOptions(hasVoted ? [...myOptionIds] : []);
                  setShowVote(true);
                }}
              >
                <Vote className="h-3 w-3" />
                {hasVoted ? "재투표" : "투표하기"}
              </Button>
            )}
            {hasVoted && !effectivelyClosed && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={handleRemoveVote}
              >
                투표 취소
              </Button>
            )}
            {!effectivelyClosed && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground"
                onClick={handleClose}
              >
                <Lock className="h-3 w-3" />
                마감
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-destructive hover:text-destructive ml-auto"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
              삭제
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ——————————————————————————————
// 메인 카드 컴포넌트
// ——————————————————————————————

interface MeetingVoteCardProps {
  groupId: string;
}

export function MeetingVoteCard({ groupId }: MeetingVoteCardProps) {
  const {
    voteData,
    loading,
    createAgenda,
    deleteAgenda,
    closeAgenda,
    castVote,
    removeVote,
    totalAgendas,
    activeAgendas,
    totalVotes,
  } = useMeetingVote(groupId);

  const [voterName, setVoterName] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");

  const filteredAgendas = useMemo(() => {
    const agendas = voteData.agendas;
    if (filter === "active") {
      return agendas.filter(
        (a) =>
          !a.isClosed &&
          (a.deadline === null || new Date(a.deadline) >= new Date())
      );
    }
    if (filter === "closed") {
      return agendas.filter(
        (a) =>
          a.isClosed ||
          (a.deadline !== null && new Date(a.deadline) < new Date())
      );
    }
    return agendas;
  }, [voteData.agendas, filter]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-xs text-muted-foreground">불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">회의록 투표</CardTitle>
          </div>
          <CreateAgendaDialog onSubmit={createAgenda} />
        </div>

        {/* 통계 뱃지 */}
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-0">
            전체 {totalAgendas}건
          </Badge>
          <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-0">
            진행중 {activeAgendas}건
          </Badge>
          <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-0">
            총 {totalVotes}표
          </Badge>
        </div>

        {/* 투표자 이름 입력 */}
        <div className="flex items-center gap-1.5 mt-2">
          <Label className="text-xs shrink-0 text-muted-foreground">
            내 이름
          </Label>
          <Input
            className="h-7 text-xs flex-1 max-w-[160px]"
            placeholder="투표 시 사용할 이름"
            value={voterName}
            onChange={(e) => setVoterName(e.target.value)}
          />
        </div>

        {/* 필터 탭 */}
        <div className="flex items-center gap-1 mt-2">
          {(["all", "active", "closed"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "ghost"}
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "전체" : f === "active" ? "진행중" : "마감"}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2.5 pt-0">
        {filteredAgendas.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2 text-center">
            <Vote className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              {filter === "all"
                ? "등록된 안건이 없습니다."
                : filter === "active"
                ? "진행 중인 안건이 없습니다."
                : "마감된 안건이 없습니다."}
            </p>
            {filter === "all" && (
              <p className="text-[10px] text-muted-foreground">
                상단의 '안건 추가' 버튼으로 첫 번째 안건을 등록해보세요.
              </p>
            )}
          </div>
        ) : (
          filteredAgendas.map((agenda) => (
            <AgendaItemCard
              key={agenda.id}
              agenda={agenda}
              voterName={voterName}
              onCastVote={castVote}
              onRemoveVote={removeVote}
              onCloseAgenda={closeAgenda}
              onDeleteAgenda={deleteAgenda}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
