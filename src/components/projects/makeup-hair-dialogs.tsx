"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type {
  MakeupHairMakeupType,
  MakeupHairStyle,
  MakeupHairPlan,
  MakeupHairTimelineEntry,
  MakeupHairArtist,
} from "@/types";

// ============================================================
// 상수 (dialogs 파일 내 공유)
// ============================================================

const MAKEUP_TYPES: MakeupHairMakeupType[] = ["내추럴", "스테이지", "특수분장"];
const HAIR_STYLES: MakeupHairStyle[] = ["업스타일", "다운스타일", "반묶음", "특수"];

// ============================================================
// PlanDialog
// ============================================================

export interface PlanDialogProps {
  open: boolean;
  mode: "add" | "edit";
  initial?: Partial<Omit<MakeupHairPlan, "id" | "createdAt">>;
  onClose: () => void;
  onSubmit: (data: Omit<MakeupHairPlan, "id" | "createdAt">) => void;
}

export function PlanDialog({ open, mode, initial, onClose, onSubmit }: PlanDialogProps) {
  const [memberName, setMemberName] = useState(initial?.memberName ?? "");
  const [scene, setScene] = useState(String(initial?.scene ?? "1"));
  const [makeupType, setMakeupType] = useState<MakeupHairMakeupType>(
    initial?.makeupType ?? "내추럴"
  );
  const [hairStyle, setHairStyle] = useState<MakeupHairStyle>(
    initial?.hairStyle ?? "업스타일"
  );
  const [colorTone, setColorTone] = useState(initial?.colorTone ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");

  const handleSubmit = () => {
    if (!memberName.trim()) {
      toast.error(TOAST.MAKEUP_HAIR.MEMBER_REQUIRED);
      return;
    }
    const sceneNum = parseInt(scene, 10);
    if (isNaN(sceneNum) || sceneNum < 1) {
      toast.error(TOAST.MAKEUP_HAIR.SCENE_NUMBER_REQUIRED);
      return;
    }
    onSubmit({
      memberName: memberName.trim(),
      scene: sceneNum,
      makeupType,
      hairStyle,
      colorTone: colorTone.trim() || null,
      memo: memo.trim() || null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "플랜 추가" : "플랜 편집"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">멤버명</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 김민지"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">장면(Scene) 번호</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min={1}
                placeholder="1"
                value={scene}
                onChange={(e) => setScene(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">분장 유형</Label>
              <Select
                value={makeupType}
                onValueChange={(v) => setMakeupType(v as MakeupHairMakeupType)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAKEUP_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">헤어 스타일</Label>
              <Select
                value={hairStyle}
                onValueChange={(v) => setHairStyle(v as MakeupHairStyle)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HAIR_STYLES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">색상 톤 (선택)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 웜톤, 쿨톤, 누드핑크"
              value={colorTone}
              onChange={(e) => setColorTone(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">특이사항 메모 (선택)</Label>
            <Textarea
              className="text-xs min-h-[52px] resize-none"
              placeholder="알레르기, 주의사항 등"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// TimelineDialog
// ============================================================

export interface TimelineDialogProps {
  open: boolean;
  mode: "add" | "edit";
  initial?: Partial<Omit<MakeupHairTimelineEntry, "id">>;
  onClose: () => void;
  onSubmit: (data: Omit<MakeupHairTimelineEntry, "id">) => void;
}

export function TimelineDialog({ open, mode, initial, onClose, onSubmit }: TimelineDialogProps) {
  const [memberName, setMemberName] = useState(initial?.memberName ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [duration, setDuration] = useState(String(initial?.durationMinutes ?? "30"));

  const handleSubmit = () => {
    if (!memberName.trim()) {
      toast.error(TOAST.MAKEUP_HAIR.MEMBER_REQUIRED);
      return;
    }
    if (!startTime) {
      toast.error(TOAST.MAKEUP_HAIR.START_TIME_REQUIRED);
      return;
    }
    const dur = parseInt(duration, 10);
    if (isNaN(dur) || dur < 1) {
      toast.error(TOAST.MAKEUP_HAIR.DURATION_REQUIRED);
      return;
    }
    onSubmit({
      memberName: memberName.trim(),
      startTime,
      durationMinutes: dur,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "타임라인 추가" : "타임라인 편집"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">멤버명</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 박서연"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">시작 시간</Label>
              <Input
                className="h-8 text-xs"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">소요 시간 (분)</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min={1}
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// ArtistDialog
// ============================================================

export interface ArtistDialogProps {
  open: boolean;
  mode: "add" | "edit";
  initial?: Partial<Omit<MakeupHairArtist, "id">>;
  onClose: () => void;
  onSubmit: (data: Omit<MakeupHairArtist, "id">) => void;
}

export function ArtistDialog({ open, mode, initial, onClose, onSubmit }: ArtistDialogProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [contact, setContact] = useState(initial?.contact ?? "");
  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(TOAST.MAKEUP_HAIR.ARTIST_REQUIRED);
      return;
    }
    onSubmit({
      name: name.trim(),
      contact: contact.trim() || null,
      specialty: specialty.trim() || null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "아티스트 추가" : "아티스트 편집"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">이름</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 이수진"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">연락처 (선택)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 010-1234-5678"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">전문 분야 (선택)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 스테이지 메이크업, 헤어 스타일링"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
