"use client";

import { useState } from "react";
import {
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  MoveUp,
  MoveDown,
  Settings2,
  X,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useStageFormation } from "@/hooks/use-stage-formation";
import type { StageFormationScene, StageFormationPosition } from "@/types";

// ============================================================
// 색상 팔레트
// ============================================================

const POSITION_COLORS = [
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

interface SceneFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: {
    name: string;
    description: string;
    durationSec: number | null;
  }) => void;
  editScene?: StageFormationScene | null;
}

function SceneFormDialog({
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
      toast.error("씬 이름을 입력해주세요.");
      return;
    }
    const dur =
      durationSec.trim() === "" ? null : parseInt(durationSec, 10);
    if (dur !== null && (isNaN(dur) || dur < 0)) {
      toast.error("올바른 지속 시간을 입력해주세요.");
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

interface PositionFormDialogProps {
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

function PositionFormDialog({
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
      toast.error("멤버 이름을 입력해주세요.");
      return;
    }
    const xVal = parseFloat(x);
    const yVal = parseFloat(y);
    if (isNaN(xVal) || xVal < 0 || xVal > 100) {
      toast.error("가로 위치는 0~100 사이 값을 입력해주세요.");
      return;
    }
    if (isNaN(yVal) || yVal < 0 || yVal > 100) {
      toast.error("세로 위치는 0~100 사이 값을 입력해주세요.");
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

interface StageSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  stageWidth: number;
  stageDepth: number;
  notes: string;
  onSave: (stageWidth: number, stageDepth: number, notes: string) => void;
}

function StageSettingsDialog({
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
      toast.error("올바른 무대 너비를 입력해주세요.");
      return;
    }
    if (isNaN(d) || d <= 0) {
      toast.error("올바른 무대 깊이를 입력해주세요.");
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

// ============================================================
// 무대 뷰 컴포넌트
// ============================================================

interface StageViewProps {
  scene: StageFormationScene;
  stageWidth: number;
  stageDepth: number;
  onEditPosition: (pos: StageFormationPosition) => void;
  onRemovePosition: (posId: string) => void;
}

function StageView({
  scene,
  stageWidth,
  stageDepth,
  onEditPosition,
  onRemovePosition,
}: StageViewProps) {
  // 무대 비율 기반 높이 계산 (최대 200px)
  const aspectRatio = stageDepth / stageWidth;
  const stageHeightPercent = Math.min(Math.max(aspectRatio * 100, 40), 80);

  return (
    <div className="space-y-1.5">
      {/* 무대 크기 라벨 */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          무대: {stageWidth}m x {stageDepth}m
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            관객석
          </span>
        </div>
      </div>

      {/* 관객석 방향 표시 */}
      <div className="flex items-center gap-1 mb-0.5">
        <div className="flex-1 h-px bg-dashed border-t border-dashed border-muted-foreground/40" />
        <span className="text-[9px] text-muted-foreground px-1 flex-shrink-0">
          -- 앞 (관객석 방향) --
        </span>
        <div className="flex-1 h-px border-t border-dashed border-muted-foreground/40" />
      </div>

      {/* 무대 영역 */}
      <div
        className="relative w-full bg-gray-100 border-2 border-gray-300 rounded-md overflow-hidden"
        style={{ paddingBottom: `${stageHeightPercent}%` }}
      >
        {/* 격자 오버레이 */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)",
            backgroundSize: "10% 10%",
          }}
        />

        {/* 중앙선 */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-blue-200/60 -translate-x-1/2" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-blue-200/60 -translate-y-1/2" />

        {/* 빈 상태 */}
        {scene.positions.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <MapPin className="h-5 w-5 text-muted-foreground/40 mb-1" />
            <p className="text-[10px] text-muted-foreground/60">
              멤버 포지션을 추가하세요
            </p>
          </div>
        )}

        {/* 멤버 마커 */}
        {scene.positions.map((pos) => (
          <div
            key={pos.id}
            className="absolute group"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* 마커 원 */}
            <div
              className="relative w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: pos.color }}
              title={pos.memberName}
            >
              <span className="text-[8px] text-white font-bold leading-none text-center px-0.5 break-all max-w-[28px] overflow-hidden">
                {pos.memberName.slice(0, 3)}
              </span>
            </div>

            {/* 호버 툴팁 & 액션 */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
              <div className="bg-gray-900/90 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap shadow-lg pointer-events-none">
                {pos.memberName}
                <br />
                <span className="text-gray-400">
                  X:{Math.round(pos.x)} Y:{Math.round(pos.y)}
                </span>
              </div>
              <div className="w-1.5 h-1.5 bg-gray-900/90 rotate-45 -mt-0.5" />
            </div>

            {/* 수정/삭제 버튼 (항상 보임 on hover) */}
            <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-0.5 pointer-events-auto">
              <button
                className="w-4 h-4 bg-background border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditPosition(pos);
                }}
                title="수정"
              >
                <Pencil className="h-2 w-2 text-blue-600" />
              </button>
              <button
                className="w-4 h-4 bg-background border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePosition(pos.id);
                }}
                title="삭제"
              >
                <X className="h-2 w-2 text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 뒤 방향 라벨 */}
      <div className="flex items-center gap-1 mt-0.5">
        <div className="flex-1 h-px border-t border-dashed border-muted-foreground/40" />
        <span className="text-[9px] text-muted-foreground px-1 flex-shrink-0">
          -- 뒤 --
        </span>
        <div className="flex-1 h-px border-t border-dashed border-muted-foreground/40" />
      </div>

      {/* 범례 */}
      {scene.positions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {scene.positions.map((pos) => (
            <div key={pos.id} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full border border-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: pos.color }}
              />
              <span className="text-[10px] text-muted-foreground">
                {pos.memberName}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 씬 행 (사이드 목록용)
// ============================================================

interface SceneRowProps {
  scene: StageFormationScene;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SceneRow({
  scene,
  isActive,
  isFirst,
  isLast,
  onClick,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SceneRowProps) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors group ${
        isActive
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-muted/60"
      }`}
      onClick={onClick}
    >
      {/* 순서 번호 */}
      <div
        className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {scene.order}
      </div>

      {/* 씬 정보 */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-medium truncate ${
            isActive ? "text-primary" : "text-foreground"
          }`}
        >
          {scene.name}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {scene.positions.length}명
          {scene.durationSec != null && ` · ${scene.durationSec}초`}
        </p>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          disabled={isFirst}
          title="위로"
        >
          <MoveUp className="h-2.5 w-2.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          disabled={isLast}
          title="아래로"
        >
          <MoveDown className="h-2.5 w-2.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="수정"
        >
          <Pencil className="h-2.5 w-2.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="삭제"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface StageFormationCardProps {
  projectId: string;
}

export function StageFormationCard({ projectId }: StageFormationCardProps) {
  const {
    scenes,
    stageWidth,
    stageDepth,
    notes,
    loading,
    stats,
    addScene,
    updateScene,
    deleteScene,
    reorderScenes,
    addPosition,
    updatePosition,
    removePosition,
    setStageSize,
    setNotes,
  } = useStageFormation(projectId);

  const [isOpen, setIsOpen] = useState(false);

  // 씬 다이얼로그
  const [sceneDialogOpen, setSceneDialogOpen] = useState(false);
  const [editTargetScene, setEditTargetScene] = useState<StageFormationScene | null>(
    null
  );

  // 포지션 다이얼로그
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [editTargetPosition, setEditTargetPosition] =
    useState<StageFormationPosition | null>(null);

  // 무대 설정 다이얼로그
  const [stageSettingsOpen, setStageSettingsOpen] = useState(false);

  // 현재 활성 씬 인덱스
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);

  const activeScene = scenes[activeSceneIdx] ?? null;

  // 씬 추가/수정 제출
  const handleSceneSubmit = (params: {
    name: string;
    description: string;
    durationSec: number | null;
  }) => {
    if (editTargetScene) {
      const ok = updateScene(editTargetScene.id, params);
      if (ok) {
        toast.success("씬이 수정되었습니다.");
      } else {
        toast.error("씬 수정에 실패했습니다.");
      }
    } else {
      addScene(params);
      toast.success("씬이 추가되었습니다.");
      // 새로 추가한 씬으로 이동
      setActiveSceneIdx(scenes.length);
    }
    setSceneDialogOpen(false);
    setEditTargetScene(null);
  };

  // 씬 삭제
  const handleDeleteScene = (sceneId: string) => {
    const ok = deleteScene(sceneId);
    if (ok) {
      toast.success("씬이 삭제되었습니다.");
      if (activeSceneIdx >= scenes.length - 1) {
        setActiveSceneIdx(Math.max(0, scenes.length - 2));
      }
    } else {
      toast.error("씬 삭제에 실패했습니다.");
    }
  };

  // 포지션 추가/수정 제출
  const handlePositionSubmit = (params: {
    memberName: string;
    x: number;
    y: number;
    color: string;
  }) => {
    if (!activeScene) return;

    if (editTargetPosition) {
      const ok = updatePosition(activeScene.id, editTargetPosition.id, params);
      if (ok) {
        toast.success("포지션이 수정되었습니다.");
      } else {
        toast.error("포지션 수정에 실패했습니다.");
      }
    } else {
      const result = addPosition(activeScene.id, params);
      if (result) {
        toast.success("포지션이 추가되었습니다.");
      } else {
        toast.error("포지션 추가에 실패했습니다.");
      }
    }
    setPositionDialogOpen(false);
    setEditTargetPosition(null);
  };

  // 포지션 삭제
  const handleRemovePosition = (posId: string) => {
    if (!activeScene) return;
    const ok = removePosition(activeScene.id, posId);
    if (ok) {
      toast.success("포지션이 삭제되었습니다.");
    } else {
      toast.error("포지션 삭제에 실패했습니다.");
    }
  };

  // 무대 설정 저장
  const handleSaveStageSettings = (
    newWidth: number,
    newDepth: number,
    newNotes: string
  ) => {
    setStageSize(newWidth, newDepth);
    setNotes(newNotes);
    toast.success("무대 설정이 저장되었습니다.");
    setStageSettingsOpen(false);
  };

  // 이전/다음 씬 이동
  const goToPrevScene = () => {
    setActiveSceneIdx((prev) => Math.max(0, prev - 1));
  };
  const goToNextScene = () => {
    setActiveSceneIdx((prev) => Math.min(scenes.length - 1, prev + 1));
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="w-full">
          <CardHeader className="pb-2 pt-3 px-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 flex-wrap">
                  <Users className="h-4 w-4 text-violet-500 flex-shrink-0" />
                  <CardTitle className="text-sm font-semibold">
                    무대 포메이션 디자이너
                  </CardTitle>
                  {stats.totalScenes > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground"
                    >
                      {stats.totalScenes}개 씬
                    </Badge>
                  )}
                  {stats.totalPositions > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-violet-50 text-violet-700 border-violet-200"
                    >
                      총 {stats.totalPositions}개 포지션
                    </Badge>
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-4">
              {loading ? (
                <p className="text-xs text-muted-foreground py-2">
                  불러오는 중...
                </p>
              ) : (
                <>
                  {/* 통계 요약 */}
                  {scenes.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-md bg-muted/40 border text-center">
                        <p className="text-[10px] text-muted-foreground">
                          씬 수
                        </p>
                        <p className="text-sm font-bold tabular-nums">
                          {stats.totalScenes}
                        </p>
                      </div>
                      <div className="p-2 rounded-md bg-violet-50 border border-violet-200 text-center">
                        <p className="text-[10px] text-violet-600">
                          전체 포지션
                        </p>
                        <p className="text-sm font-bold tabular-nums text-violet-700">
                          {stats.totalPositions}
                        </p>
                      </div>
                      <div className="p-2 rounded-md bg-blue-50 border border-blue-200 text-center">
                        <p className="text-[10px] text-blue-600">씬당 평균</p>
                        <p className="text-sm font-bold tabular-nums text-blue-700">
                          {stats.averagePositionsPerScene}명
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 씬 목록 + 무대 뷰 영역 */}
                  <div className="space-y-3">
                    {/* 헤더 버튼 */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        씬 목록
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2 text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStageSettingsOpen(true);
                          }}
                          title="무대 설정"
                        >
                          <Settings2 className="h-3 w-3 mr-1" />
                          설정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditTargetScene(null);
                            setSceneDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          씬 추가
                        </Button>
                      </div>
                    </div>

                    {/* 빈 상태 */}
                    {scenes.length === 0 ? (
                      <div className="py-10 text-center space-y-2">
                        <Users className="h-8 w-8 text-muted-foreground mx-auto" />
                        <p className="text-xs text-muted-foreground">
                          등록된 씬이 없습니다.
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          씬을 추가하여 포메이션을 디자인하세요.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 md:flex-row">
                        {/* 왼쪽: 씬 목록 */}
                        <div className="md:w-40 flex-shrink-0 space-y-1">
                          {scenes.map((scene, idx) => (
                            <SceneRow
                              key={scene.id}
                              scene={scene}
                              isActive={idx === activeSceneIdx}
                              isFirst={idx === 0}
                              isLast={idx === scenes.length - 1}
                              onClick={() => setActiveSceneIdx(idx)}
                              onEdit={() => {
                                setEditTargetScene(scene);
                                setSceneDialogOpen(true);
                              }}
                              onDelete={() => handleDeleteScene(scene.id)}
                              onMoveUp={() => reorderScenes(scene.id, "up")}
                              onMoveDown={() =>
                                reorderScenes(scene.id, "down")
                              }
                            />
                          ))}
                        </div>

                        {/* 오른쪽: 무대 뷰 */}
                        {activeScene && (
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* 씬 헤더 */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={goToPrevScene}
                                  disabled={activeSceneIdx === 0}
                                  title="이전 씬"
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate">
                                    {activeScene.name}
                                  </p>
                                  {activeScene.description && (
                                    <p className="text-[10px] text-muted-foreground truncate">
                                      {activeScene.description}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={goToNextScene}
                                  disabled={
                                    activeSceneIdx === scenes.length - 1
                                  }
                                  title="다음 씬"
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              {/* 포지션 추가 버튼 */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditTargetPosition(null);
                                  setPositionDialogOpen(true);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                멤버 추가
                              </Button>
                            </div>

                            {/* 씬 인디케이터 */}
                            <div className="flex items-center gap-1">
                              {scenes.map((s, idx) => (
                                <button
                                  key={s.id}
                                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                                    idx === activeSceneIdx
                                      ? "bg-primary scale-125"
                                      : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                                  }`}
                                  onClick={() => setActiveSceneIdx(idx)}
                                  title={s.name}
                                />
                              ))}
                              <span className="text-[10px] text-muted-foreground ml-1">
                                {activeSceneIdx + 1} / {scenes.length}
                              </span>
                            </div>

                            {/* 무대 뷰 */}
                            <StageView
                              scene={activeScene}
                              stageWidth={stageWidth}
                              stageDepth={stageDepth}
                              onEditPosition={(pos) => {
                                setEditTargetPosition(pos);
                                setPositionDialogOpen(true);
                              }}
                              onRemovePosition={handleRemovePosition}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 전체 메모 */}
                  {notes && (
                    <div className="rounded-md bg-muted/40 border px-3 py-2">
                      <p className="text-[10px] font-medium text-muted-foreground mb-1">
                        전체 메모
                      </p>
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                        {notes}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 씬 등록/수정 다이얼로그 */}
      <SceneFormDialog
        open={sceneDialogOpen}
        onClose={() => {
          setSceneDialogOpen(false);
          setEditTargetScene(null);
        }}
        onSubmit={handleSceneSubmit}
        editScene={editTargetScene}
      />

      {/* 포지션 등록/수정 다이얼로그 */}
      <PositionFormDialog
        open={positionDialogOpen}
        onClose={() => {
          setPositionDialogOpen(false);
          setEditTargetPosition(null);
        }}
        onSubmit={handlePositionSubmit}
        editPosition={editTargetPosition}
      />

      {/* 무대 설정 다이얼로그 */}
      <StageSettingsDialog
        open={stageSettingsOpen}
        onClose={() => setStageSettingsOpen(false)}
        stageWidth={stageWidth}
        stageDepth={stageDepth}
        notes={notes}
        onSave={handleSaveStageSettings}
      />
    </>
  );
}
