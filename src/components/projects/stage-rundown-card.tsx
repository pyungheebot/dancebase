"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Clock,
  MapPin,
  User,
  Users,
  FileText,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Timer,
  ListChecks,
  TrendingUp,
  PlayCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useStageRundown, timeToMinutes } from "@/hooks/use-stage-rundown";
import type { ShowRundownItem } from "@/types";

// ─── 헬퍼 ────────────────────────────────────────────────────

/** 현재 시각이 해당 항목의 시간대에 포함되는지 판단 */
function isCurrentItem(startTime: string, endTime: string, nowMinutes: number): boolean {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return nowMinutes >= start && nowMinutes < end;
}

/** "HH:MM" ~ "HH:MM" 형태의 소요 시간 문자열 반환 */
function formatDuration(startTime: string, endTime: string): string {
  const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
  if (diff <= 0) return "-";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

// ─── 빈 폼 ────────────────────────────────────────────────────

const EMPTY_FORM = {
  startTime: "",
  endTime: "",
  activity: "",
  location: "",
  owner: "",
  participants: "",
  note: "",
};

type FormState = typeof EMPTY_FORM;

// ─── 항목 폼 컴포넌트 ─────────────────────────────────────────

function RundownItemForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: FormState;
  onSubmit: (form: FormState) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<FormState>(initial);

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.startTime || !form.endTime) {
      toast.error("시작 시간과 종료 시간을 입력해 주세요.");
      return;
    }
    if (!form.activity.trim()) {
      toast.error("활동명을 입력해 주세요.");
      return;
    }
    if (timeToMinutes(form.endTime) <= timeToMinutes(form.startTime)) {
      toast.error("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }
    onSubmit(form);
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      {/* 시간 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">시작 시간 *</Label>
          <Input
            type="time"
            value={form.startTime}
            onChange={(e) => set("startTime", e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">종료 시간 *</Label>
          <Input
            type="time"
            value={form.endTime}
            onChange={(e) => set("endTime", e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* 활동명 */}
      <div className="space-y-1">
        <Label className="text-xs">활동명 *</Label>
        <Input
          placeholder="예: 음향 점검, 안무 리허설"
          value={form.activity}
          onChange={(e) => set("activity", e.target.value)}
          className="h-7 text-xs"
        />
      </div>

      {/* 장소 & 담당자 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">장소</Label>
          <Input
            placeholder="예: 메인 무대"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">담당자</Label>
          <Input
            placeholder="예: 김민준"
            value={form.owner}
            onChange={(e) => set("owner", e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* 참여자 */}
      <div className="space-y-1">
        <Label className="text-xs">참여자 (쉼표로 구분)</Label>
        <Input
          placeholder="예: 이수진, 박지현, 최동욱"
          value={form.participants}
          onChange={(e) => set("participants", e.target.value)}
          className="h-7 text-xs"
        />
      </div>

      {/* 비고 */}
      <div className="space-y-1">
        <Label className="text-xs">비고</Label>
        <Textarea
          placeholder="추가 메모..."
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          className="min-h-[52px] text-xs"
        />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
        <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

// ─── 항목 카드 ────────────────────────────────────────────────

function RundownItemCard({
  item,
  isCurrent,
  onToggleDone,
  onUpdate,
  onRemove,
}: {
  item: ShowRundownItem;
  isCurrent: boolean;
  onToggleDone: () => void;
  onUpdate: (patch: Partial<Omit<ShowRundownItem, "id">>) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);

  function handleUpdate(form: FormState) {
    onUpdate(form);
    setEditing(false);
    toast.success("항목이 수정되었습니다.");
  }

  const duration = formatDuration(item.startTime, item.endTime);
  const participantList = item.participants
    ? item.participants.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <div
      className={[
        "rounded-lg border p-3 transition-colors",
        item.done
          ? "bg-muted/40 opacity-70"
          : isCurrent
          ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20"
          : "bg-card",
      ].join(" ")}
    >
      {editing ? (
        <RundownItemForm
          initial={{
            startTime: item.startTime,
            endTime: item.endTime,
            activity: item.activity,
            location: item.location,
            owner: item.owner,
            participants: item.participants,
            note: item.note,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitLabel="수정 저장"
        />
      ) : (
        <div className="space-y-2">
          {/* 헤더 행 */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* 완료 토글 */}
              <button
                onClick={onToggleDone}
                className="text-muted-foreground hover:text-primary shrink-0"
              >
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </button>

              {/* 시간 범위 */}
              <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <Clock className="h-3 w-3" />
                {item.startTime} ~ {item.endTime}
              </span>

              {/* 소요 시간 */}
              <Badge className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {duration}
              </Badge>

              {/* 진행 중 뱃지 */}
              {isCurrent && !item.done && (
                <Badge className="text-[10px] px-1.5 py-0 bg-orange-500 text-white animate-pulse">
                  진행 중
                </Badge>
              )}

              {/* 완료 뱃지 */}
              {item.done && (
                <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  완료
                </Badge>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={onRemove}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* 활동명 */}
          <p
            className={[
              "text-sm font-medium pl-6",
              item.done ? "line-through text-muted-foreground" : "",
            ].join(" ")}
          >
            {item.activity}
          </p>

          {/* 메타 정보 */}
          <div className="pl-6 flex flex-wrap gap-x-4 gap-y-1">
            {item.location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {item.location}
              </span>
            )}
            {item.owner && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {item.owner}
              </span>
            )}
            {participantList.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {participantList.join(", ")}
              </span>
            )}
          </div>

          {/* 비고 */}
          {item.note && (
            <p className="pl-6 flex items-start gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3 mt-0.5 shrink-0" />
              {item.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

export function StageRundownCard({ projectId }: { projectId: string }) {
  const { data, addItem, updateItem, removeItem, toggleDone, stats } =
    useStageRundown(projectId);

  const [showForm, setShowForm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [nowMinutes, setNowMinutes] = useState<number>(0);

  // 현재 시각 (분)을 1분마다 갱신
  useEffect(() => {
    function update() {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  function handleAdd(form: FormState) {
    addItem(form);
    setShowForm(false);
    toast.success("런다운 항목이 추가되었습니다.");
  }

  function handleRemove(itemId: string, activity: string) {
    removeItem(itemId);
    toast.success(`"${activity}" 항목이 삭제되었습니다.`);
  }

  const { totalCount, doneCount, doneRate, totalHours, remainMinutes } = stats;

  return (
    <Card>
      <Collapsible open={!collapsed} onOpenChange={(o) => setCollapsed(!o)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <PlayCircle className="h-4 w-4 text-orange-500" />
              리허설 런다운
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {collapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          {/* 통계 요약 */}
          <div className="flex flex-wrap gap-3 pt-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ListChecks className="h-3 w-3" />
              총 {totalCount}개
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              완료 {doneCount}개 ({doneRate}%)
            </span>
            {totalHours > 0 || remainMinutes > 0 ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Timer className="h-3 w-3" />
                {totalHours > 0 ? `${totalHours}시간 ` : ""}
                {remainMinutes > 0 ? `${remainMinutes}분` : ""}
              </span>
            ) : null}
          </div>

          {/* 진행률 프로그레스 바 */}
          {totalCount > 0 && (
            <div className="pt-1 space-y-1">
              <Progress value={doneRate} className="h-1.5" />
            </div>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {/* 항목 추가 폼 */}
            {showForm && (
              <RundownItemForm
                initial={EMPTY_FORM}
                onSubmit={handleAdd}
                onCancel={() => setShowForm(false)}
                submitLabel="추가"
              />
            )}

            {/* 항목 목록 */}
            {data.items.length === 0 && !showForm ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                런다운 항목이 없습니다.
                <br />
                아래 버튼으로 항목을 추가해 보세요.
              </div>
            ) : (
              <div className="space-y-2">
                {data.items.map((item) => (
                  <RundownItemCard
                    key={item.id}
                    item={item}
                    isCurrent={isCurrentItem(
                      item.startTime,
                      item.endTime,
                      nowMinutes
                    )}
                    onToggleDone={() => toggleDone(item.id)}
                    onUpdate={(patch) => updateItem(item.id, patch)}
                    onRemove={() => handleRemove(item.id, item.activity)}
                  />
                ))}
              </div>
            )}

            <Separator />

            {/* 추가 버튼 */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs w-full"
              onClick={() => {
                setShowForm((v) => !v);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              항목 추가
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
