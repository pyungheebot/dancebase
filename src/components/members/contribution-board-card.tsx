"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Award,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Filter,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { useContributionBoard } from "@/hooks/use-contribution-board";
import type { ContributionType } from "@/types";

// ─── 유형 설정 ──────────────────────────────────────────────

const ALL_CONTRIBUTION_TYPES: ContributionType[] = [
  "teaching",
  "organizing",
  "choreography",
  "music",
  "logistics",
  "mentoring",
  "other",
];

const CONTRIBUTION_TYPE_LABEL: Record<ContributionType, string> = {
  teaching: "교육",
  organizing: "운영",
  choreography: "안무",
  music: "음악",
  logistics: "행사",
  mentoring: "멘토",
  other: "기타",
};

const CONTRIBUTION_TYPE_COLOR: Record<
  ContributionType,
  { bg: string; text: string; border: string }
> = {
  teaching: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  organizing: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  choreography: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  music: { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
  logistics: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  mentoring: { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200" },
  other: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
};

// 유형별 바 색상 (CSS background)
const TYPE_BAR_BG: Record<ContributionType, string> = {
  teaching: "bg-blue-400",
  organizing: "bg-green-400",
  choreography: "bg-purple-400",
  music: "bg-pink-400",
  logistics: "bg-orange-400",
  mentoring: "bg-cyan-400",
  other: "bg-gray-400",
};

const TOP_MEDALS = ["1", "2", "3"];

// ─── 기여 추가 다이얼로그 ────────────────────────────────────

type AddRecordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    memberName: string;
    type: ContributionType;
    description: string;
    points: number;
    date: string;
    awardedBy: string;
  }) => void;
};

function AddRecordDialog({ open, onOpenChange, onSubmit }: AddRecordDialogProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [memberName, setMemberName] = useState("");
  const [type, setType] = useState<ContributionType>("teaching");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(5);
  const [date, setDate] = useState(today);
  const [awardedBy, setAwardedBy] = useState("");

  function handleReset() {
    setMemberName("");
    setType("teaching");
    setDescription("");
    setPoints(5);
    setDate(today);
    setAwardedBy("");
  }

  function handleSubmit() {
    if (!memberName.trim()) {
      toast.error("멤버 이름을 입력해주세요.");
      return;
    }
    if (!awardedBy.trim()) {
      toast.error("부여자 이름을 입력해주세요.");
      return;
    }
    if (!description.trim()) {
      toast.error("활동 내용을 입력해주세요.");
      return;
    }
    if (!date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    onSubmit({ memberName, type, description, points, date, awardedBy });
    handleReset();
    onOpenChange(false);
  }

  function handleClose() {
    handleReset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">기여 활동 기록</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 멤버명 / 부여자 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">멤버명</Label>
              <Input
                className="h-7 text-xs"
                placeholder="기여자 이름"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">부여자</Label>
              <Input
                className="h-7 text-xs"
                placeholder="기록한 사람"
                value={awardedBy}
                onChange={(e) => setAwardedBy(e.target.value)}
              />
            </div>
          </div>

          {/* 유형 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">기여 유형</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as ContributionType)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CONTRIBUTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {CONTRIBUTION_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 활동 내용 */}
          <div className="space-y-1">
            <Label className="text-xs">활동 내용</Label>
            <Textarea
              className="text-xs min-h-[60px] resize-none"
              placeholder="어떤 기여를 했는지 간략히 적어주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 150))}
            />
            <p className="text-right text-[10px] text-muted-foreground">
              {description.length}/150
            </p>
          </div>

          {/* 포인트 슬라이더 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">포인트</Label>
              <span className="text-xs font-semibold tabular-nums text-amber-600">
                {points}점
              </span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[points]}
              onValueChange={(val) => setPoints(val[0])}
              className="w-full"
            />
            <div className="flex justify-between px-0.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <span
                  key={n}
                  className={`text-[9px] tabular-nums ${
                    points === n
                      ? "text-amber-600 font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs">활동 날짜</Label>
            <Input
              type="date"
              className="h-7 text-xs"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 유형별 비율 CSS 바 ─────────────────────────────────────

type TypeBreakdownBarProps = {
  typeBreakdown: Record<ContributionType, number>;
  totalPoints: number;
};

function TypeBreakdownBar({ typeBreakdown, totalPoints }: TypeBreakdownBarProps) {
  if (totalPoints === 0) return null;

  const segments = ALL_CONTRIBUTION_TYPES.filter(
    (t) => typeBreakdown[t] > 0
  ).map((t) => ({
    type: t,
    points: typeBreakdown[t],
    pct: Math.round((typeBreakdown[t] / totalPoints) * 100),
  }));

  return (
    <div className="flex h-1.5 w-full rounded-full overflow-hidden gap-px">
      {segments.map((s) => (
        <div
          key={s.type}
          className={`${TYPE_BAR_BG[s.type]} h-full`}
          style={{ width: `${s.pct}%` }}
          title={`${CONTRIBUTION_TYPE_LABEL[s.type]}: ${s.points}pt`}
        />
      ))}
    </div>
  );
}

// ─── 메인 카드 컴포넌트 ──────────────────────────────────────

type ContributionBoardCardProps = {
  groupId: string;
};

export function ContributionBoardCard({ groupId }: ContributionBoardCardProps) {
  const [open, setOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<ContributionType | "all">("all");

  const {
    records,
    addRecord,
    deleteRecord,
    getAllSummaries,
    totalRecords,
    totalPoints,
    topContributor,
  } = useContributionBoard(groupId);

  const summaries = getAllSummaries();

  const filteredRecords =
    filterType === "all"
      ? records
      : records.filter((r) => r.type === filterType);

  function handleSubmit(data: {
    memberName: string;
    type: ContributionType;
    description: string;
    points: number;
    date: string;
    awardedBy: string;
  }) {
    addRecord(data);
  }

  function handleDelete(id: string) {
    deleteRecord(id);
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className="w-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Award className="h-4 w-4 text-amber-500" />
                <span>멤버 기여도 보드</span>
                {totalRecords > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200">
                    총 {totalPoints}pt
                  </Badge>
                )}
              </CardTitle>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  {open ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* 통계 요약 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">기록 수</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {totalRecords}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">총 포인트</p>
                  <p className="text-sm font-semibold tabular-nums text-amber-600">
                    {totalPoints}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">최고 기여</p>
                  <p
                    className="text-xs font-semibold truncate"
                    title={topContributor ?? "-"}
                  >
                    {topContributor ?? "-"}
                  </p>
                </div>
              </div>

              {/* 기여 추가 버튼 */}
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs w-full"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                기여 활동 기록
              </Button>

              {/* 멤버 랭킹 */}
              {summaries.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-amber-500" />
                    멤버 랭킹
                  </p>
                  <ul className="space-y-2">
                    {summaries.map((s, idx) => (
                      <li
                        key={s.memberName}
                        className="flex items-center gap-2 rounded-lg border bg-muted/20 px-2.5 py-2"
                      >
                        {/* 순위 */}
                        <span
                          className={`text-xs font-bold tabular-nums w-5 shrink-0 ${
                            idx === 0
                              ? "text-yellow-500"
                              : idx === 1
                              ? "text-gray-400"
                              : idx === 2
                              ? "text-amber-700"
                              : "text-muted-foreground"
                          }`}
                        >
                          {idx < TOP_MEDALS.length ? `#${TOP_MEDALS[idx]}` : `#${idx + 1}`}
                        </span>

                        {/* 이름 + 바 */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-medium truncate">
                              {s.memberName}
                            </span>
                            <span className="text-[10px] font-semibold tabular-nums text-amber-600 shrink-0">
                              {s.totalPoints}pt
                            </span>
                          </div>
                          <TypeBreakdownBar
                            typeBreakdown={s.typeBreakdown}
                            totalPoints={s.totalPoints}
                          />
                          {/* 유형별 미니 배지 */}
                          <div className="flex flex-wrap gap-0.5 pt-0.5">
                            {ALL_CONTRIBUTION_TYPES.filter(
                              (t) => s.typeBreakdown[t] > 0
                            ).map((t) => {
                              const c = CONTRIBUTION_TYPE_COLOR[t];
                              return (
                                <span
                                  key={t}
                                  className={`text-[9px] px-1 py-0 rounded-full border ${c.bg} ${c.text} ${c.border}`}
                                >
                                  {CONTRIBUTION_TYPE_LABEL[t]} {s.typeBreakdown[t]}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 유형 필터 */}
              {records.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-border">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Filter className="h-3 w-3 text-muted-foreground shrink-0" />
                    <button
                      type="button"
                      className={`text-[10px] px-1.5 py-0 rounded-full border transition-colors ${
                        filterType === "all"
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : "border-border text-muted-foreground hover:bg-muted/50"
                      }`}
                      onClick={() => setFilterType("all")}
                    >
                      전체
                    </button>
                    {ALL_CONTRIBUTION_TYPES.map((t) => {
                      const hasRecords = records.some((r) => r.type === t);
                      if (!hasRecords) return null;
                      const c = CONTRIBUTION_TYPE_COLOR[t];
                      return (
                        <button
                          key={t}
                          type="button"
                          className={`text-[10px] px-1.5 py-0 rounded-full border transition-colors ${
                            filterType === t
                              ? `${c.bg} ${c.text} ${c.border}`
                              : "border-border text-muted-foreground hover:bg-muted/50"
                          }`}
                          onClick={() => setFilterType(t)}
                        >
                          {CONTRIBUTION_TYPE_LABEL[t]}
                        </button>
                      );
                    })}
                  </div>

                  {/* 기록 목록 */}
                  {filteredRecords.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      해당 유형의 기록이 없습니다.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                      {filteredRecords.map((r) => {
                        const c = CONTRIBUTION_TYPE_COLOR[r.type];
                        return (
                          <li
                            key={r.id}
                            className="flex items-start gap-2 rounded-md border bg-muted/20 px-2.5 py-2 group"
                          >
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-medium">
                                  {r.memberName}
                                </span>
                                <Badge
                                  className={`text-[9px] px-1 py-0 ${c.bg} ${c.text} ${c.border}`}
                                >
                                  {CONTRIBUTION_TYPE_LABEL[r.type]}
                                </Badge>
                                <span className="text-[10px] font-semibold tabular-nums text-amber-600">
                                  +{r.points}pt
                                </span>
                              </div>
                              <p className="text-xs text-foreground leading-relaxed">
                                {r.description}
                              </p>
                              <p className="text-[9px] text-muted-foreground">
                                {r.date} &middot; 부여자: {r.awardedBy}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDelete(r.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 text-muted-foreground hover:text-destructive"
                              aria-label="삭제"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {records.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <Award className="h-6 w-6 mb-2 text-muted-foreground/40" />
                  <p className="text-xs">아직 기여 기록이 없어요.</p>
                  <p className="text-[10px]">첫 기여 활동을 기록해보세요!</p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <AddRecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </>
  );
}
