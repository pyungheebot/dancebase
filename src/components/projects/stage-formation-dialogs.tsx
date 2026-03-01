"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

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

import type { StageFormationScene, StageFormationPosition } from "@/types";

// ============================================================
// 색상 팔레트 (공유 상수)
// ============================================================

export const POSITION_COLORS = [
  "#ef4444", // 빨강
  "#f97316", // 주황
  "#eab308", // 노랑
  "#22c55e", // 초록
  "#06b6d4", // 시안
  "#3b82f6", // 파랑
  "#8b5cf6", // 보라
  "#ec4899", // 분홍
  "#14b8a6", // 청록
  "#f59e0b", // 앰버
];

// ============================================================
// 씬 등록/수정 다이얼로그
// ============================================================

export interface SceneFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: {
    name: string;
    description: string;
    durationSec: number | null;
  }) => void;
  editScene?: StageFormationScene | null;
}

export function SceneFormDialog({
  open,
  onClose,
  onSubmit,
  editScene,
}: SceneFormDialogProps) {
  const [name, setName] = useState(editScene?.name ?? "");
  const [description, setDescription] = useState(editScene?.description ?? "");
  const [durationSec, setDurationSec] = useState(
    editScene?.durationSec != null ? String(editScene.durationSec) : ""
  );

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setName(editScene?.name ?? "");
      setDescription(editScene?.description ?? "");
      setDurationSec(
        editScene?.durationSec != null ? String(editScene.durationSec) : ""
      );
    } else {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(TOAST.STAGE_FORMATION.SCENE_NAME_REQUIRED);
      return;
    }
    const dur =
      durationSec.trim() === "" ? null : parseInt(durationSec, 10);
    if (dur !== null && (isNaN(dur) || dur < 0)) {
      toast.error(TOAST.STAGE_FORMATION.DURATION_REQUIRED);
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      durationSec: dur,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editScene ? "씬 수정" : "씬 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">씬 이름 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 인트로, 1절, 클라이맥스"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">설명</Label>
            <Textarea
              className="text-xs min-h-[56px] resize-none"
              placeholder="씬에 대한 설명 (선택)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              지속 시간 (초, 선택)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                className="h-8 text-xs w-24"
                placeholder="비워두면 미지정"
                value={durationSec}
                onChange={(e) => setDurationSec(e.target.value)}
              />
              {durationSec !== "" &&
                !isNaN(parseInt(durationSec, 10)) &&
                parseInt(durationSec, 10) > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {Math.floor(parseInt(durationSec, 10) / 60) > 0
                      ? `${Math.floor(parseInt(durationSec, 10) / 60)}분 `
                      : ""}
                    {parseInt(durationSec, 10) % 60 > 0
                      ? `${parseInt(durationSec, 10) % 60}초`
                      : ""}
                  </span>
                )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {editScene ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 포지션 등록/수정 다이얼로그
// ============================================================

export interface PositionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: {
    memberName: string;
    x: number;
    y: number;
    color: string;
  }) => void;
  editPosition?: StageFormationPosition | null;
}

export function PositionFormDialog({
  open,
  onClose,
  onSubmit,
  editPosition,
}: PositionFormDialogProps) {
  const [memberName, setMemberName] = useState(
    editPosition?.memberName ?? ""
  );
  const [x, setX] = useState(String(editPosition?.x ?? 50));
  const [y, setY] = useState(String(editPosition?.y ?? 50));
  const [color, setColor] = useState(
    editPosition?.color ?? POSITION_COLORS[0]
  );

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setMemberName(editPosition?.memberName ?? "");
      setX(String(editPosition?.x ?? 50));
      setY(String(editPosition?.y ?? 50));
      setColor(editPosition?.color ?? POSITION_COLORS[0]);
    } else {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (!memberName.trim()) {
      toast.error(TOAST.STAGE_FORMATION.MEMBER_REQUIRED);
      return;
    }
    const xVal = parseFloat(x);
    const yVal = parseFloat(y);
    if (isNaN(xVal) || xVal < 0 || xVal > 100) {
      toast.error(TOAST.STAGE_FORMATION.X_RANGE);
      return;
    }
    if (isNaN(yVal) || yVal < 0 || yVal > 100) {
      toast.error(TOAST.STAGE_FORMATION.Y_RANGE);
      return;
    }
    onSubmit({
      memberName: memberName.trim(),
      x: xVal,
      y: yVal,
      color,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editPosition ? "포지션 수정" : "멤버 포지션 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">멤버 이름 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 김민준"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                가로 위치 (0~100)
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                className="h-8 text-xs"
                placeholder="50"
                value={x}
                onChange={(e) => setX(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                0=왼쪽, 100=오른쪽
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                세로 위치 (0~100)
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                className="h-8 text-xs"
                placeholder="50"
                value={y}
                onChange={(e) => setY(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                0=무대 앞, 100=무대 뒤
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">마커 색상</Label>
            <div className="flex flex-wrap gap-2">
              {POSITION_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-6 h-6 rounded-full transition-all ${
                    color === c
                      ? "ring-2 ring-offset-1 ring-foreground scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {editPosition ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 무대 설정 다이얼로그
// ============================================================

export interface StageSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  stageWidth: number;
  stageDepth: number;
  notes: string;
  onSave: (stageWidth: number, stageDepth: number, notes: string) => void;
}

export function StageSettingsDialog({
  open,
  onClose,
  stageWidth,
  stageDepth,
  notes,
  onSave,
}: StageSettingsDialogProps) {
  const [width, setWidth] = useState(String(stageWidth));
  const [depth, setDepth] = useState(String(stageDepth));
  const [localNotes, setLocalNotes] = useState(notes);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setWidth(String(stageWidth));
      setDepth(String(stageDepth));
      setLocalNotes(notes);
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    const w = parseFloat(width);
    const d = parseFloat(depth);
    if (isNaN(w) || w <= 0) {
      toast.error(TOAST.STAGE_FORMATION.STAGE_WIDTH_REQUIRED);
      return;
    }
    if (isNaN(d) || d <= 0) {
      toast.error(TOAST.STAGE_FORMATION.STAGE_DEPTH_REQUIRED);
      return;
    }
    onSave(w, d, localNotes.trim());
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            무대 설정
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">너비 (m)</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                placeholder="10"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">깊이 (m)</Label>
              <Input
                type="number"
                min={1}
                className="h-8 text-xs"
                placeholder="8"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">전체 메모</Label>
            <Textarea
              className="text-xs min-h-[72px] resize-none"
              placeholder="포메이션 관련 전체 메모"
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
