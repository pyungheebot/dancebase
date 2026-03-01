"use client";

import { useState } from "react";
import { useChoreoSection } from "@/hooks/use-choreo-section";
import type { ChoreoSectionEntry, ChoreoSectionDifficulty } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  ChevronDown,
  ChevronRight,
  Scissors,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  BarChart3,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useAsyncAction } from "@/hooks/use-async-action";

// ============================================
// 난이도 유틸
// ============================================

function difficultyColor(difficulty: number): string {
  if (difficulty === 1) return "bg-green-500";
  if (difficulty === 2) return "bg-lime-500";
  if (difficulty === 3) return "bg-yellow-500";
  if (difficulty === 4) return "bg-orange-500";
  return "bg-red-500";
}

function difficultyTextColor(difficulty: number): string {
  if (difficulty === 1) return "text-green-600";
  if (difficulty === 2) return "text-lime-600";
  if (difficulty === 3) return "text-yellow-600";
  if (difficulty === 4) return "text-orange-600";
  return "text-red-600";
}

function difficultyLabel(difficulty: number): string {
  if (difficulty === 1) return "쉬움";
  if (difficulty === 2) return "보통이하";
  if (difficulty === 3) return "보통";
  if (difficulty === 4) return "어려움";
  return "최고난도";
}

function difficultyBgLight(difficulty: number): string {
  if (difficulty === 1) return "bg-green-100 text-green-700";
  if (difficulty === 2) return "bg-lime-100 text-lime-700";
  if (difficulty === 3) return "bg-yellow-100 text-yellow-700";
  if (difficulty === 4) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

// ============================================
// 완성도 바 (인라인 수정 가능)
// ============================================

interface CompletionBarProps {
  value: number; // 0~100
  onUpdate: (rate: number) => void;
}

function CompletionBar({ value, onUpdate }: CompletionBarProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function completionColor(rate: number): string {
    if (rate >= 80) return "bg-green-500";
    if (rate >= 50) return "bg-blue-500";
    if (rate >= 30) return "bg-yellow-500";
    return "bg-red-400";
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 w-full">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={draft}
          onChange={(e) => setDraft(Number(e.target.value))}
          className="flex-1 h-1.5 accent-blue-500 cursor-pointer"
          autoFocus
        />
        <span className="text-[10px] font-medium w-7 text-right shrink-0">
          {draft}%
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0 shrink-0"
          onClick={() => {
            onUpdate(draft);
            setEditing(false);
            toast.success(TOAST.CHOREO_SECTION.COMPLETION_UPDATED);
          }}
        >
          <span className="text-[10px] font-bold text-blue-600">저장</span>
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="flex items-center gap-1.5 w-full group cursor-pointer"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      title="클릭하여 완성도 수정"
    >
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${completionColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] font-medium w-7 text-right shrink-0 group-hover:text-blue-600 transition-colors">
        {value}%
      </span>
    </button>
  );
}

// ============================================
// 구간 행
// ============================================

interface SectionRowProps {
  section: ChoreoSectionEntry;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onDelete: () => void;
  onUpdateCompletion: (rate: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SectionRow({
  section,
  index,
  isFirst,
  isLast,
  onDelete,
  onUpdateCompletion,
  onMoveUp,
  onMoveDown,
}: SectionRowProps) {
  return (
    <div className="border rounded-md px-3 py-2 space-y-1.5 group hover:bg-muted/20 transition-colors">
      {/* 상단: 번호, 이름, 시간, 난이도 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 순서 번호 */}
        <span className="text-[10px] text-muted-foreground font-mono w-4 shrink-0 text-right">
          #{index + 1}
        </span>
        {/* 이름 */}
        <span className="text-sm font-medium flex-1 min-w-0 truncate">
          {section.name}
        </span>
        {/* 시간 범위 */}
        <span className="text-[11px] text-muted-foreground font-mono shrink-0">
          {section.startTime} ~ {section.endTime}
        </span>
        {/* 난이도 배지 */}
        <Badge
          className={`text-[10px] px-1.5 py-0 border-0 shrink-0 ${difficultyBgLight(section.difficulty)}`}
        >
          {"★".repeat(section.difficulty)}{"☆".repeat(5 - section.difficulty)} {difficultyLabel(section.difficulty)}
        </Badge>
        {/* 순서 이동 + 삭제 버튼 */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            disabled={isFirst}
            onClick={onMoveUp}
            aria-label="위로 이동"
          >
            <ArrowUp className="h-3 w-3 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            disabled={isLast}
            onClick={onMoveDown}
            aria-label="아래로 이동"
          >
            <ArrowDown className="h-3 w-3 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onDelete}
            aria-label="구간 삭제"
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>

      {/* 완성도 바 */}
      <CompletionBar value={section.completionRate} onUpdate={onUpdateCompletion} />

      {/* 키 동작 칩 */}
      {section.keyMoves.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-muted-foreground shrink-0">키 동작:</span>
          {section.keyMoves.map((move, i) => (
            <span
              key={i}
              className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0"
            >
              {move}
            </span>
          ))}
        </div>
      )}

      {/* 담당 멤버 */}
      {section.assignedMembers.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-muted-foreground shrink-0">멤버:</span>
          {section.assignedMembers.map((member, i) => (
            <span
              key={i}
              className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 rounded px-1.5 py-0"
            >
              {member}
            </span>
          ))}
        </div>
      )}

      {/* 메모 */}
      {section.notes && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {section.notes}
        </p>
      )}
    </div>
  );
}

// ============================================
// 구간 추가 다이얼로그
// ============================================

interface AddSectionDialogProps {
  open: boolean;
  onClose: () => void;
  memberNames: string[];
  onAdd: (
    name: string,
    startTime: string,
    endTime: string,
    difficulty: ChoreoSectionDifficulty,
    keyMoves: string[],
    assignedMembers: string[],
    notes?: string
  ) => boolean;
}

function AddSectionDialog({
  open,
  onClose,
  memberNames,
  onAdd,
}: AddSectionDialogProps) {
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [difficulty, setDifficulty] = useState<ChoreoSectionDifficulty>(3);
  const [keyMovesRaw, setKeyMovesRaw] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const { pending: submitting, execute } = useAsyncAction();

  function reset() {
    setName("");
    setStartTime("");
    setEndTime("");
    setDifficulty(3);
    setKeyMovesRaw("");
    setSelectedMembers([]);
    setNotes("");
  }

  function toggleMember(member: string) {
    setSelectedMembers((prev) =>
      prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]
    );
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error(TOAST.CHOREO_SECTION.NAME_REQUIRED);
      return;
    }
    if (!startTime.trim()) {
      toast.error(TOAST.CHOREO_SECTION.START_TIME_REQUIRED);
      return;
    }
    if (!endTime.trim()) {
      toast.error(TOAST.CHOREO_SECTION.END_TIME_REQUIRED);
      return;
    }

    const keyMoves = keyMovesRaw
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    await execute(async () => {
      const ok = onAdd(
        name,
        startTime,
        endTime,
        difficulty,
        keyMoves,
        selectedMembers,
        notes || undefined
      );

      if (ok) {
        toast.success(`"${name.trim()}" 구간이 추가되었습니다.`);
        reset();
        onClose();
      } else {
        toast.error(TOAST.CHOREO_SECTION.ADD_ERROR);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Scissors className="h-4 w-4" />
            안무 구간 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 구간 이름 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-0.5 block">
              구간 이름 *
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 인트로, 메인 훅, 브릿지"
              className="h-7 text-xs"
              autoFocus
            />
          </div>

          {/* 시간 범위 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground mb-0.5 block">
                시작 시간 (MM:SS) *
              </Label>
              <Input
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="예: 00:00"
                className="h-7 text-xs font-mono"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-0.5 block">
                종료 시간 (MM:SS) *
              </Label>
              <Input
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="예: 00:30"
                className="h-7 text-xs font-mono"
              />
            </div>
          </div>

          {/* 난이도 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-0.5 block">
              난이도
            </Label>
            <Select
              value={String(difficulty)}
              onValueChange={(v) => setDifficulty(Number(v) as ChoreoSectionDifficulty)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1" className="text-xs">
                  <span className="text-green-600">★☆☆☆☆ 쉬움</span>
                </SelectItem>
                <SelectItem value="2" className="text-xs">
                  <span className="text-lime-600">★★☆☆☆ 보통이하</span>
                </SelectItem>
                <SelectItem value="3" className="text-xs">
                  <span className="text-yellow-600">★★★☆☆ 보통</span>
                </SelectItem>
                <SelectItem value="4" className="text-xs">
                  <span className="text-orange-600">★★★★☆ 어려움</span>
                </SelectItem>
                <SelectItem value="5" className="text-xs">
                  <span className="text-red-600">★★★★★ 최고난도</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 키 동작 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-0.5 block">
              키 동작 (쉼표로 구분)
            </Label>
            <Input
              value={keyMovesRaw}
              onChange={(e) => setKeyMovesRaw(e.target.value)}
              placeholder="예: 바디웨이브, 팝핑, 스핀"
              className="h-7 text-xs"
            />
          </div>

          {/* 담당 멤버 체크박스 */}
          {memberNames.length > 0 && (
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                담당 멤버
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {memberNames.map((member) => (
                  <button
                    key={member}
                    type="button"
                    onClick={() => toggleMember(member)}
                    className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                      selectedMembers.includes(member)
                        ? "bg-purple-100 text-purple-700 border-purple-300"
                        : "bg-muted text-muted-foreground border-border hover:border-purple-300"
                    }`}
                  >
                    {member}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 메모 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-0.5 block">
              메모 (선택)
            </Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="구간 관련 메모"
              className="h-7 text-xs"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-1.5 pt-1">
            <Button
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={handleSubmit}
              disabled={submitting || !name.trim()}
            >
              <Plus className="h-3 w-3 mr-1" />
              구간 추가
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => { reset(); onClose(); }}
            >
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 타임라인 바
// ============================================

interface TimelineBarProps {
  sections: ChoreoSectionEntry[];
}

function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
  return 0;
}

function TimelineBar({ sections }: TimelineBarProps) {
  if (sections.length === 0) return null;

  const allTimes = sections.flatMap((s) => [
    parseTimeToSeconds(s.startTime),
    parseTimeToSeconds(s.endTime),
  ]);
  const minTime = Math.min(...allTimes);
  const maxTime = Math.max(...allTimes);
  const totalRange = maxTime - minTime;

  if (totalRange <= 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-muted-foreground font-medium">전체 구간 타임라인</p>
      <div className="relative h-6 bg-muted/40 rounded-md overflow-hidden border">
        {sections.map((section) => {
          const start = parseTimeToSeconds(section.startTime);
          const end = parseTimeToSeconds(section.endTime);
          const leftPct = ((start - minTime) / totalRange) * 100;
          const widthPct = ((end - start) / totalRange) * 100;

          return (
            <div
              key={section.id}
              className={`absolute top-0 h-full flex items-center justify-center overflow-hidden rounded-sm border border-white/20 ${difficultyColor(section.difficulty)} opacity-80 hover:opacity-100 transition-opacity cursor-default`}
              style={{
                left: `${leftPct}%`,
                width: `${Math.max(widthPct, 2)}%`,
              }}
              title={`${section.name} (${section.startTime}~${section.endTime}) 난이도:${section.difficulty}`}
            >
              {widthPct >= 8 && (
                <span className="text-[9px] text-white font-medium truncate px-0.5">
                  {section.name}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* 시간 레이블 */}
      <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
        <span>{sections[0]?.startTime || "00:00"}</span>
        <span>{sections[sections.length - 1]?.endTime || "00:00"}</span>
      </div>
    </div>
  );
}

// ============================================
// 통계 패널
// ============================================

interface StatsPanelProps {
  totalSections: number;
  averageDifficulty: number;
  averageCompletion: number;
  hardestSection: string | null;
  leastCompletedSection: string | null;
}

function StatsPanel({
  totalSections,
  averageDifficulty,
  averageCompletion,
  hardestSection,
  leastCompletedSection,
}: StatsPanelProps) {
  return (
    <div className="border rounded-md p-3 bg-muted/20 space-y-2">
      <p className="text-[10px] text-muted-foreground font-medium">구간 분석 요약</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">{totalSections}</div>
          <div className="text-[10px] text-muted-foreground">전체 구간</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold ${difficultyTextColor(Math.round(averageDifficulty))}`}>
            {averageDifficulty}
          </div>
          <div className="text-[10px] text-muted-foreground">평균 난이도</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{averageCompletion}%</div>
          <div className="text-[10px] text-muted-foreground">평균 완성도</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-medium text-foreground truncate">
            {hardestSection ?? "-"}
          </div>
          <div className="text-[10px] text-muted-foreground">가장 어려운 구간</div>
        </div>
      </div>
      {leastCompletedSection && (
        <div className="pt-1 border-t">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">완성도가 낮은 구간</span>
            <span className="font-medium text-orange-600">{leastCompletedSection}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 카드
// ============================================

interface ChoreoSectionCardProps {
  groupId: string;
  projectId: string;
  memberNames: string[];
}

export function ChoreoSectionCard({
  groupId,
  projectId,
  memberNames,
}: ChoreoSectionCardProps) {
  const {
    sections,
    loading,
    totalSections,
    averageDifficulty,
    averageCompletion,
    hardestSection,
    leastCompletedSection,
    addSection,
    deleteSection,
    updateCompletionRate,
    moveSection,
  } = useChoreoSection(groupId, projectId);

  const [cardExpanded, setCardExpanded] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  function handleDelete(id: string, name: string) {
    deleteSection(id);
    toast.success(`"${name}" 구간이 삭제되었습니다.`);
  }

  return (
    <>
      <Collapsible open={cardExpanded} onOpenChange={setCardExpanded}>
        <div className="border rounded-lg overflow-hidden">
          {/* 카드 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 bg-card border-b">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 text-left min-w-0">
                {cardExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <Scissors className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="text-sm font-semibold">안무 구간 분석</span>
                {totalSections > 0 && (
                  <>
                    <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
                      {totalSections}개 구간
                    </Badge>
                    <Badge className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                      완성도 {averageCompletion}%
                    </Badge>
                  </>
                )}
              </button>
            </CollapsibleTrigger>

            <div className="flex items-center gap-1 shrink-0">
              {totalSections > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setStatsOpen((v) => !v)}
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  통계
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                구간 추가
              </Button>
            </div>
          </div>

          {/* 카드 본문 */}
          <CollapsibleContent>
            <div className="p-4 space-y-3">
              {/* 통계 패널 */}
              {statsOpen && totalSections > 0 && (
                <StatsPanel
                  totalSections={totalSections}
                  averageDifficulty={averageDifficulty}
                  averageCompletion={averageCompletion}
                  hardestSection={hardestSection}
                  leastCompletedSection={leastCompletedSection}
                />
              )}

              {/* 타임라인 바 */}
              {totalSections > 0 && <TimelineBar sections={sections} />}

              {/* 구간 목록 */}
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-md" />
                  ))}
                </div>
              ) : sections.length === 0 ? (
                <EmptyState
                  icon={Scissors}
                  title="등록된 안무 구간이 없습니다"
                  description="'구간 추가' 버튼으로 안무를 구간별로 나눠 관리해보세요."
                  action={{
                    label: "구간 추가",
                    onClick: () => setDialogOpen(true),
                  }}
                />
              ) : (
                <div className="space-y-2">
                  {sections.map((section, i) => (
                    <SectionRow
                      key={section.id}
                      section={section}
                      index={i}
                      isFirst={i === 0}
                      isLast={i === sections.length - 1}
                      onDelete={() => handleDelete(section.id, section.name)}
                      onUpdateCompletion={(rate) =>
                        updateCompletionRate(section.id, rate)
                      }
                      onMoveUp={() => moveSection(section.id, "up")}
                      onMoveDown={() => moveSection(section.id, "down")}
                    />
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* 구간 추가 다이얼로그 */}
      <AddSectionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        memberNames={memberNames}
        onAdd={addSection}
      />
    </>
  );
}
