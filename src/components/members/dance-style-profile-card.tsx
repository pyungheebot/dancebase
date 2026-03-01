"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Star,
  User,
  Clock,
  BarChart2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDanceStyleProfileV2 } from "@/hooks/use-dance-style-profile-v2";
import type { DanceProfilePosition, DanceProfilePracticeTime } from "@/types";
import { cn } from "@/lib/utils";

import {
  POSITION_META,
  PRACTICE_TIME_META,
  PRACTICE_TIME_ORDER,
} from "./dance-style-profile-types";
import { GenreDialog, InspirationDialog } from "./dance-style-profile-dialogs";
import { GenreBarChart } from "./dance-style-genre-chart";
import { GenreListItem } from "./dance-style-genre-list-item";
import { InspirationListItem } from "./dance-style-inspiration-list-item";
import { DanceStyleBioSection } from "./dance-style-bio-section";
import { DanceStyleBpmSection } from "./dance-style-bpm-section";

// ============================================================
// 메인 컴포넌트
// ============================================================

export function DanceStyleProfileCard({ memberId }: { memberId: string }) {
  const [open, setOpen] = useState(true);

  const {
    profile,
    addGenre,
    updateGenre,
    removeGenre,
    setPosition,
    setBio,
    addInspiration,
    updateInspiration,
    removeInspiration,
    togglePracticeTime,
    setBpmRange,
    stats,
  } = useDanceStyleProfileV2(memberId);

  // 포지션 변경
  async function handlePositionChange(pos: string) {
    try {
      await setPosition(pos === "none" ? null : (pos as DanceProfilePosition));
      toast.success(TOAST.MEMBERS.PERSONALITY_POSITION_SAVED);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    }
  }

  // 장르 삭제
  async function handleRemoveGenre(genreName: string) {
    try {
      await removeGenre(genreName);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // 영감 댄서 삭제
  async function handleRemoveInspiration(name: string) {
    try {
      await removeInspiration(name);
      toast.success(`"${name}"을 삭제했습니다.`);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  // 연습 시간 토글
  async function handlePracticeTimeToggle(time: DanceProfilePracticeTime) {
    try {
      await togglePracticeTime(time);
    } catch {
      toast.error(TOAST.SAVE_ERROR);
    }
  }

  const hasContent =
    profile.genres.length > 0 ||
    profile.position !== null ||
    profile.bio ||
    profile.inspirations.length > 0 ||
    profile.practiceTimes.length > 0;

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <CardHeader
            className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg pb-3"
            aria-expanded={open}
            aria-controls="dance-style-profile-content"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-indigo-100" aria-hidden="true">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                </div>
                <CardTitle className="text-sm font-semibold">
                  댄스 스타일 프로필
                </CardTitle>
                {stats.totalGenres > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-600 border-indigo-200"
                    aria-label={`${stats.totalGenres}개 장르 등록됨`}
                  >
                    {stats.totalGenres}개 장르
                  </Badge>
                )}
              </div>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent id="dance-style-profile-content">
          <CardContent className="pt-0 space-y-5">
            {/* 빈 상태 */}
            {!hasContent && (
              <p
                className="text-[11px] text-muted-foreground text-center py-4 border border-dashed rounded-md"
                aria-live="polite"
              >
                아직 등록된 정보가 없습니다. 장르, 포지션 등을 추가해보세요.
              </p>
            )}

            {/* 1. 선호 장르 & 숙련도 */}
            <section aria-labelledby="section-genres" className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  id="section-genres"
                  className="text-xs font-medium text-muted-foreground flex items-center gap-1"
                >
                  <BarChart2 className="h-3 w-3" aria-hidden="true" />
                  선호 장르 &amp; 숙련도
                </span>
                <GenreDialog
                  existingGenres={profile.genres.map((g) => g.genre)}
                  onSave={addGenre}
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2"
                      aria-label="선호 장르 추가"
                    >
                      <Plus className="h-3 w-3 mr-0.5" aria-hidden="true" />
                      장르 추가
                    </Button>
                  }
                />
              </div>

              {profile.genres.length > 0 ? (
                <div className="space-y-3">
                  <div className="rounded-md border bg-muted/10 px-3 py-2.5">
                    <GenreBarChart genres={profile.genres} />
                  </div>
                  <div
                    className="space-y-1.5"
                    role="list"
                    aria-label="등록된 선호 장르 목록"
                    aria-live="polite"
                  >
                    {profile.genres.map((entry) => (
                      <GenreListItem
                        key={entry.genre}
                        entry={entry}
                        onUpdate={updateGenre}
                        onRemove={handleRemoveGenre}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground text-center py-2.5 border border-dashed rounded-md">
                  선호 장르를 추가해보세요.
                </p>
              )}
            </section>

            {/* 2. 선호 포지션 */}
            <section aria-labelledby="section-position" className="space-y-2">
              <span
                id="section-position"
                className="text-xs font-medium text-muted-foreground flex items-center gap-1"
              >
                <User className="h-3 w-3" aria-hidden="true" />
                선호 포지션
              </span>
              <div className="flex items-center gap-2">
                <Select
                  value={profile.position ?? "none"}
                  onValueChange={handlePositionChange}
                >
                  <SelectTrigger
                    className="h-8 text-xs w-36"
                    aria-label="선호 포지션 선택"
                  >
                    <SelectValue placeholder="포지션 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">
                      미설정
                    </SelectItem>
                    {(["center", "side", "back"] as DanceProfilePosition[]).map((pos) => (
                      <SelectItem key={pos} value={pos} className="text-xs">
                        {POSITION_META[pos].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {profile.position && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      POSITION_META[profile.position].color
                    )}
                    aria-label={`현재 포지션: ${POSITION_META[profile.position].label}`}
                  >
                    {POSITION_META[profile.position].label}
                  </Badge>
                )}
              </div>
            </section>

            {/* 3. 자기소개 */}
            <DanceStyleBioSection bio={profile.bio} onSave={setBio} />

            {/* 4. 영감 받은 댄서 */}
            <section aria-labelledby="section-inspirations" className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  id="section-inspirations"
                  className="text-xs font-medium text-muted-foreground flex items-center gap-1"
                >
                  <Star className="h-3 w-3" aria-hidden="true" />
                  영감 받은 댄서
                </span>
                <InspirationDialog
                  existingNames={profile.inspirations.map((i) => i.name)}
                  onSave={addInspiration}
                  trigger={
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2"
                      aria-label="영감 받은 댄서 추가"
                    >
                      <Plus className="h-3 w-3 mr-0.5" aria-hidden="true" />
                      댄서 추가
                    </Button>
                  }
                />
              </div>

              {profile.inspirations.length > 0 ? (
                <div
                  className="space-y-1.5"
                  role="list"
                  aria-label="영감 받은 댄서 목록"
                  aria-live="polite"
                >
                  {profile.inspirations.map((item) => (
                    <InspirationListItem
                      key={item.name}
                      item={item}
                      onUpdate={updateInspiration}
                      onRemove={handleRemoveInspiration}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground text-center py-2.5 border border-dashed rounded-md">
                  영감 받은 댄서를 추가해보세요.
                </p>
              )}
            </section>

            {/* 5. 연습 시간 선호도 */}
            <section aria-labelledby="section-practice-times" className="space-y-2">
              <span
                id="section-practice-times"
                className="text-xs font-medium text-muted-foreground flex items-center gap-1"
              >
                <Clock className="h-3 w-3" aria-hidden="true" />
                연습 시간 선호도
              </span>
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-labelledby="section-practice-times"
              >
                {PRACTICE_TIME_ORDER.map((time) => {
                  const meta = PRACTICE_TIME_META[time];
                  const selected = profile.practiceTimes.includes(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handlePracticeTimeToggle(time)}
                      aria-pressed={selected}
                      aria-label={`${meta.label} 연습 시간 ${selected ? "선택됨" : "선택 안됨"}`}
                      className={cn(
                        "flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected
                          ? meta.color
                          : "bg-muted/20 text-muted-foreground border-border hover:border-muted-foreground/40"
                      )}
                    >
                      <span aria-hidden="true">{meta.icon}</span>
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 6. BPM 범위 */}
            <DanceStyleBpmSection bpmRange={profile.bpmRange} onSave={setBpmRange} />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
