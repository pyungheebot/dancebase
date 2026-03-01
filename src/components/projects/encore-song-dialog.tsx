"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Music, Clock } from "lucide-react";
import { formatDuration, type SongFormData } from "./encore-plan-types";

// ============================================================
// 앵콜 곡 추가/편집 다이얼로그
// React.memo로 불필요한 리렌더링 방지
// ============================================================

type SongDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: SongFormData;
  setForm: (f: SongFormData) => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
  memberNames: string[];
  onTogglePerformer: (name: string) => void;
};

export const SongDialog = memo(function SongDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  saving,
  isEdit,
  memberNames,
  onTogglePerformer,
}: SongDialogProps) {
  // 폼 필드 단일 업데이트 헬퍼
  function set<K extends keyof SongFormData>(key: K, value: SongFormData[K]) {
    setForm({ ...form, [key]: value });
  }

  // 초 값이 유효할 때 미리보기 포맷
  const durationPreview =
    form.durationSeconds && !isNaN(parseInt(form.durationSeconds))
      ? formatDuration(parseInt(form.durationSeconds))
      : null;

  const descriptionId = "song-dialog-description";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto"
        aria-describedby={descriptionId}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Music className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            {isEdit ? "곡 수정" : "앵콜 곡 추가"}
          </DialogTitle>
          {/* aria-describedby 대상 - 스크린리더용 설명 */}
          <p id={descriptionId} className="sr-only">
            {isEdit
              ? "앵콜 곡 정보를 수정합니다."
              : "새 앵콜 곡을 추가합니다."}
          </p>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 곡 제목 */}
          <div className="space-y-1">
            <Label htmlFor="song-title" className="text-xs">
              곡 제목 <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="song-title"
              className="h-8 text-xs"
              placeholder="예: 봄날, Dynamite"
              value={form.songTitle}
              onChange={(e) => set("songTitle", e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 아티스트 */}
          <div className="space-y-1">
            <Label htmlFor="song-artist" className="text-xs">아티스트</Label>
            <Input
              id="song-artist"
              className="h-8 text-xs"
              placeholder="예: BTS, 아이유"
              value={form.artist}
              onChange={(e) => set("artist", e.target.value)}
            />
          </div>

          {/* 곡 길이 (초) */}
          <div className="space-y-1">
            <Label htmlFor="song-duration" className="text-xs">
              곡 길이 (초) <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <div className="relative">
              <Clock
                className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="song-duration"
                className="h-8 text-xs pl-6"
                type="number"
                min="1"
                placeholder="예: 210"
                value={form.durationSeconds}
                onChange={(e) => set("durationSeconds", e.target.value)}
                aria-required="true"
              />
            </div>
            {/* 초 → 분:초 변환 미리보기 */}
            {durationPreview && (
              <p className="text-[10px] text-muted-foreground" aria-live="polite">
                = {durationPreview}
              </p>
            )}
          </div>

          {/* 출연자 선택 - 멤버 목록이 있을 때 토글 버튼으로 선택 */}
          {memberNames.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">출연자 (다중 선택)</Label>
              <div
                className="flex flex-wrap gap-1 p-2 rounded-md border bg-muted/30 min-h-[40px]"
                role="group"
                aria-label="출연자 선택"
              >
                {memberNames.map((name) => {
                  const selected = form.performers.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onTogglePerformer(name)}
                      aria-pressed={selected}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        selected
                          ? "bg-indigo-100 border-indigo-400 text-indigo-800 font-semibold"
                          : "bg-background border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
              {form.performers.length > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  선택됨: {form.performers.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* 출연자 직접 입력 - 멤버 목록이 없을 때 */}
          {memberNames.length === 0 && (
            <div className="space-y-1">
              <Label htmlFor="song-performers" className="text-xs">출연자</Label>
              <Input
                id="song-performers"
                className="h-8 text-xs"
                placeholder="예: 홍길동, 김철수 (쉼표로 구분)"
                value={form.performers.join(", ")}
                onChange={(e) =>
                  set(
                    "performers",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
              />
            </div>
          )}

          {/* 메모 */}
          <div className="space-y-1">
            <Label htmlFor="song-notes" className="text-xs">메모</Label>
            <Textarea
              id="song-notes"
              className="text-xs min-h-[48px] resize-none"
              placeholder="예: 관객과 함께 부르는 파트"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
