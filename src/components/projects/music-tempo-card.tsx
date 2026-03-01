"use client";

import { useState } from "react";
import {
  useMusicTempo,
  TEMPO_CATEGORY_LABELS,
  TEMPO_CATEGORY_COLOR,
  TEMPO_CATEGORY_BPM_RANGE,
  BPM_MIN,
  BPM_MAX,
  classifyTempo,
} from "@/hooks/use-music-tempo";
import type { MusicTempoEntry, TempoSection } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Music,
  Timer,
  Play,
  Pause,
  Circle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,

  Hand,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================
// 유틸리티
// ============================================

// ============================================
// 섹션 입력 서브컴포넌트
// ============================================

interface SectionInputProps {
  sections: TempoSection[];
  onChange: (sections: TempoSection[]) => void;
}

function SectionInput({ sections, onChange }: SectionInputProps) {
  function addSection() {
    onChange([
      ...sections,
      { label: "", bpm: 120, startTime: "0:00" },
    ]);
  }

  function removeSection(idx: number) {
    onChange(sections.filter((_, i) => i !== idx));
  }

  function updateSection(idx: number, field: keyof TempoSection, value: string | number) {
    onChange(
      sections.map((s, i) =>
        i === idx ? { ...s, [field]: value } : s
      )
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground font-medium">섹션별 BPM (선택)</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={addSection}
        >
          <Plus className="h-2.5 w-2.5 mr-0.5" />
          섹션 추가
        </Button>
      </div>
      {sections.map((s, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <Input
            value={s.startTime}
            onChange={(e) => updateSection(idx, "startTime", e.target.value)}
            placeholder="0:00"
            className="h-6 text-[10px] w-14 shrink-0"
          />
          <Input
            value={s.label}
            onChange={(e) => updateSection(idx, "label", e.target.value)}
            placeholder="인트로"
            className="h-6 text-[10px] flex-1 min-w-0"
          />
          <Input
            type="number"
            value={s.bpm}
            onChange={(e) => updateSection(idx, "bpm", Number(e.target.value))}
            min={BPM_MIN}
            max={BPM_MAX}
            className="h-6 text-[10px] w-14 shrink-0"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0"
            onClick={() => removeSection(idx)}
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
      ))}
      {sections.length > 0 && (
        <p className="text-[10px] text-muted-foreground">시작 / 구간명 / BPM 순으로 입력</p>
      )}
    </div>
  );
}

// ============================================
// 곡 추가 폼
// ============================================

interface AddEntryFormProps {
  onAdd: (payload: {
    songTitle: string;
    artist: string;
    bpm: number;
    sections: TempoSection[];
    note: string;
  }) => boolean;
  onClose: () => void;
  initialBpm?: number | null;
}

function AddEntryForm({ onAdd, onClose, initialBpm }: AddEntryFormProps) {
  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [bpm, setBpm] = useState(initialBpm ?? 120);
  const [sections, setSections] = useState<TempoSection[]>([]);
  const [note, setNote] = useState("");

  const tempoCat = classifyTempo(bpm);

  function handleSubmit() {
    if (!songTitle.trim()) {
      toast.error("곡명을 입력해주세요.");
      return;
    }
    if (bpm < BPM_MIN || bpm > BPM_MAX) {
      toast.error(`BPM은 ${BPM_MIN}~${BPM_MAX} 사이여야 합니다.`);
      return;
    }
    const ok = onAdd({ songTitle, artist, bpm, sections, note });
    if (ok) {
      toast.success("곡이 등록되었습니다.");
      onClose();
    } else {
      toast.error(`곡은 최대 30개까지 등록할 수 있습니다.`);
    }
  }

  return (
    <div className="border rounded-md p-3 space-y-3 bg-muted/30 mt-2">
      <p className="text-xs font-medium text-muted-foreground">새 곡 등록</p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground mb-0.5 block">곡명 *</Label>
          <Input
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder="예: Dynamite"
            className="h-7 text-xs"
            autoFocus
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-0.5 block">아티스트</Label>
          <Input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="예: BTS"
            className="h-7 text-xs"
          />
        </div>
      </div>

      <div>
        <Label className="text-[10px] text-muted-foreground mb-0.5 block">
          BPM *{" "}
          <span className={`inline-flex items-center px-1.5 py-0 rounded text-[9px] border ml-1 ${TEMPO_CATEGORY_COLOR[tempoCat]}`}>
            {TEMPO_CATEGORY_LABELS[tempoCat]}
          </span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            min={BPM_MIN}
            max={BPM_MAX}
            className="h-7 text-xs w-24"
          />
          <input
            type="range"
            min={BPM_MIN}
            max={BPM_MAX}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
        </div>
      </div>

      <SectionInput sections={sections} onChange={setSections} />

      <div>
        <Label className="text-[10px] text-muted-foreground mb-0.5 block">메모</Label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="간단한 메모 (선택)"
          className="h-7 text-xs"
        />
      </div>

      <div className="flex gap-1.5 pt-1">
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={handleSubmit}
          disabled={!songTitle.trim()}
        >
          <Plus className="h-3 w-3 mr-1" />
          등록
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>
          취소
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 개별 곡 행
// ============================================

interface EntryRowProps {
  entry: MusicTempoEntry;
  onDelete: () => void;
  onStartMetronome: (bpm: number) => void;
}

function EntryRow({ entry, onDelete, onStartMetronome }: EntryRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="border rounded-md overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors group">
            <div className="flex items-center gap-2 min-w-0">
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <Music className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <span className="text-sm font-medium truncate block">{entry.songTitle}</span>
                {entry.artist && (
                  <span className="text-[10px] text-muted-foreground truncate block">
                    {entry.artist}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                className={`text-[10px] px-1.5 py-0 border ${TEMPO_CATEGORY_COLOR[entry.tempoCategory]}`}
              >
                {entry.bpm} BPM
              </Badge>
              <Badge
                className={`text-[10px] px-1.5 py-0 border ${TEMPO_CATEGORY_COLOR[entry.tempoCategory]} hidden sm:inline-flex`}
              >
                {TEMPO_CATEGORY_LABELS[entry.tempoCategory]}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartMetronome(entry.bpm);
                }}
                title="이 BPM으로 메트로놈 시작"
              >
                <Play className="h-3 w-3 text-muted-foreground hover:text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-2 border-t space-y-2">
            {entry.sections.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-medium">섹션별 BPM</p>
                <div className="grid grid-cols-1 gap-1">
                  {entry.sections.map((sec, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px]">
                      <span className="text-muted-foreground w-10 shrink-0">{sec.startTime}</span>
                      <span className="flex-1 text-foreground">{sec.label}</span>
                      <Badge
                        className={`text-[9px] px-1 py-0 border ${TEMPO_CATEGORY_COLOR[classifyTempo(sec.bpm)]}`}
                      >
                        {sec.bpm}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => onStartMetronome(sec.bpm)}
                        title={`${sec.label} BPM으로 메트로놈 시작`}
                      >
                        <Play className="h-2.5 w-2.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {entry.note && (
              <p className="text-[11px] text-muted-foreground">{entry.note}</p>
            )}
            <p className="text-[10px] text-muted-foreground/60">
              {formatYearMonthDay(entry.createdAt)}
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================
// 메트로놈 패널
// ============================================

interface MetronomePanelProps {
  active: boolean;
  bpm: number;
  effectiveBpm: number;
  beat: boolean;
  speedMultiplier: number;
  soundEnabled: boolean;
  onBpmChange: (bpm: number) => void;
  onSpeedChange: (speed: number) => void;
  onSoundToggle: (enabled: boolean) => void;
  onStart: () => void;
  onStop: () => void;
  // 탭 BPM
  tappedBpm: number | null;
  tapCount: number;
  onTap: () => void;
  onResetTap: () => void;
}

function MetronomePanel({
  active,
  bpm,
  effectiveBpm,
  beat,
  speedMultiplier,
  soundEnabled,
  onBpmChange,
  onSpeedChange,
  onSoundToggle,
  onStart,
  onStop,
  tappedBpm,
  tapCount,
  onTap,
  onResetTap,
}: MetronomePanelProps) {
  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  return (
    <div className="border rounded-md p-3 space-y-3 bg-muted/20">
      {/* 타이틀 */}
      <div className="flex items-center gap-2">
        <Timer className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-medium">메트로놈</p>
      </div>

      {/* 비트 표시 원 + BPM 수치 */}
      <div className="flex flex-col items-center gap-2 py-2">
        <div
          className="relative flex items-center justify-center"
          style={{ width: 72, height: 72 }}
        >
          {/* 외부 원 (배경) */}
          <div className="absolute inset-0 rounded-full border-2 border-muted-foreground/20" />
          {/* 내부 원 (깜빡임) */}
          <div
            className="rounded-full transition-all"
            style={{
              width: active && beat ? 56 : 40,
              height: active && beat ? 56 : 40,
              backgroundColor: active
                ? beat
                  ? "hsl(var(--primary))"
                  : "hsl(var(--primary) / 0.3)"
                : "hsl(var(--muted))",
              transitionDuration: active ? `${Math.round(60000 / Math.max(1, effectiveBpm) / 4)}ms` : "150ms",
            }}
          />
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums leading-none">{effectiveBpm}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">BPM</p>
          {speedMultiplier !== 1.0 && (
            <p className="text-[10px] text-muted-foreground">
              원본 {bpm} × {speedMultiplier}x
            </p>
          )}
        </div>
      </div>

      {/* BPM 슬라이더 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-[10px] text-muted-foreground">기준 BPM</Label>
          <Input
            type="number"
            value={bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            min={BPM_MIN}
            max={BPM_MAX}
            className="h-6 text-xs w-16 text-right"
          />
        </div>
        <input
          type="range"
          min={BPM_MIN}
          max={BPM_MAX}
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
          <span>{BPM_MIN}</span>
          <span>{BPM_MAX}</span>
        </div>
      </div>

      {/* 배속 선택 */}
      <div>
        <Label className="text-[10px] text-muted-foreground block mb-1">연습 배속</Label>
        <div className="flex flex-wrap gap-1">
          {speedOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                speedMultiplier === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-muted-foreground/30 hover:border-primary/60"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* 시작/정지 + 음소거 버튼 */}
      <div className="flex gap-2">
        {active ? (
          <Button
            size="sm"
            variant="destructive"
            className="h-8 text-xs flex-1"
            onClick={onStop}
          >
            <Pause className="h-3 w-3 mr-1" />
            정지
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-8 text-xs flex-1"
            onClick={onStart}
          >
            <Play className="h-3 w-3 mr-1" />
            시작
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onSoundToggle(!soundEnabled)}
          aria-label={soundEnabled ? "소리 끄기" : "소리 켜기"}
        >
          {soundEnabled ? (
            <Volume2 className="h-3.5 w-3.5" />
          ) : (
            <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* 탭 BPM */}
      <div className="border-t pt-2 space-y-2">
        <div className="flex items-center gap-1.5">
          <Hand className="h-3 w-3 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground font-medium">탭으로 BPM 측정</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full h-10 text-sm font-medium select-none active:scale-95 transition-transform"
          onClick={onTap}
        >
          여기를 탭하세요
          {tapCount >= 2 && tappedBpm !== null && (
            <span className="ml-2 text-xs text-muted-foreground">→ {tappedBpm} BPM</span>
          )}
        </Button>
        {tappedBpm !== null && (
          <div className="flex items-center gap-2">
            <div className="flex-1 text-center">
              <p className="text-lg font-bold tabular-nums">{tappedBpm}</p>
              <p className="text-[10px] text-muted-foreground">측정된 BPM ({tapCount}회 탭)</p>
            </div>
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                className="h-6 text-[10px]"
                onClick={() => onBpmChange(tappedBpm)}
              >
                적용
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px]"
                onClick={onResetTap}
              >
                초기화
              </Button>
            </div>
          </div>
        )}
        {tapCount === 1 && (
          <p className="text-[10px] text-muted-foreground text-center">계속 탭하면 BPM이 계산됩니다</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// 메인 카드
// ============================================

interface MusicTempoCardProps {
  groupId: string;
  projectId: string;
}

export function MusicTempoCard({ groupId, projectId }: MusicTempoCardProps) {
  const {
    entries,
    loading,
    canAdd,
    addEntry,
    deleteEntry,
    // 메트로놈
    metronomeActive,
    metronomeBpm,
    setMetronomeBpm,
    metronomeBeat,
    effectiveBpm,
    startMetronome,
    stopMetronome,
    // 사운드
    soundEnabled,
    setSoundEnabled,
    speedMultiplier,
    setSpeedMultiplier,
    // 탭
    tappedBpm,
    tapCount,
    tapBpm,
    resetTap,
  } = useMusicTempo(groupId, projectId);

  const [cardExpanded, setCardExpanded] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [metronomeOpen, setMetronomeOpen] = useState(false);

  function handleStartFromEntry(bpm: number) {
    startMetronome(bpm);
    setMetronomeOpen(true);
    toast.success(`메트로놈 시작: ${bpm} BPM`);
  }

  function handleDelete(id: string, title: string) {
    deleteEntry(id);
    toast.success(`"${title}" 이(가) 삭제되었습니다.`);
  }

  // 카테고리별 통계
  const categoryCounts = entries.reduce(
    (acc, e) => {
      acc[e.tempoCategory] = (acc[e.tempoCategory] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
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
              <Music className="h-4 w-4 text-purple-500 shrink-0" />
              <span className="text-sm font-semibold">음악 템포 매칭</span>
              {entries.length > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
                  {entries.length}곡
                </Badge>
              )}
              {metronomeActive && (
                <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 hover:bg-green-100 animate-pulse">
                  {effectiveBpm} BPM
                </Badge>
              )}
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant={metronomeOpen ? "secondary" : "ghost"}
              className="h-7 text-xs"
              onClick={() => setMetronomeOpen((v) => !v)}
            >
              <Timer className="h-3 w-3 mr-1" />
              메트로놈
            </Button>
            {canAdd && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setFormOpen((v) => !v)}
              >
                <Plus className="h-3 w-3 mr-1" />
                곡 추가
              </Button>
            )}
          </div>
        </div>

        {/* 카드 본문 */}
        <CollapsibleContent>
          <div className="p-4 space-y-3">
            {/* 메트로놈 패널 */}
            {metronomeOpen && (
              <MetronomePanel
                active={metronomeActive}
                bpm={metronomeBpm}
                effectiveBpm={effectiveBpm}
                beat={metronomeBeat}
                speedMultiplier={speedMultiplier}
                soundEnabled={soundEnabled}
                onBpmChange={(v) => setMetronomeBpm(Math.max(BPM_MIN, Math.min(BPM_MAX, v)))}
                onSpeedChange={setSpeedMultiplier}
                onSoundToggle={setSoundEnabled}
                onStart={() => startMetronome()}
                onStop={stopMetronome}
                tappedBpm={tappedBpm}
                tapCount={tapCount}
                onTap={tapBpm}
                onResetTap={resetTap}
              />
            )}

            {/* 곡 추가 폼 */}
            {formOpen && (
              <AddEntryForm
                onAdd={addEntry}
                onClose={() => setFormOpen(false)}
                initialBpm={tappedBpm}
              />
            )}

            {/* 카테고리 요약 (곡이 있을 때) */}
            {!loading && entries.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {(Object.entries(categoryCounts) as [string, number][]).map(
                  ([cat, count]) => (
                    <Badge
                      key={cat}
                      className={`text-[10px] px-1.5 py-0 border ${TEMPO_CATEGORY_COLOR[cat as keyof typeof TEMPO_CATEGORY_COLOR]}`}
                    >
                      {TEMPO_CATEGORY_LABELS[cat as keyof typeof TEMPO_CATEGORY_LABELS]}{" "}
                      {TEMPO_CATEGORY_BPM_RANGE[cat as keyof typeof TEMPO_CATEGORY_BPM_RANGE]}{" "}
                      · {count}곡
                    </Badge>
                  )
                )}
              </div>
            )}

            {/* 곡 목록 */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Circle className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-xs">등록된 곡이 없습니다.</p>
                <p className="text-[10px] mt-0.5">
                  &apos;곡 추가&apos; 버튼으로 BPM을 등록하거나 메트로놈을 활용해보세요.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    onDelete={() => handleDelete(entry.id, entry.songTitle)}
                    onStartMetronome={handleStartFromEntry}
                  />
                ))}
              </div>
            )}

            {!canAdd && (
              <p className="text-[11px] text-muted-foreground text-center pt-1">
                곡은 최대 30개까지 등록할 수 있습니다.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>

    </Collapsible>
  );
}
