"use client";

import { useState, useRef, useCallback } from "react";
import { useFormationEditor } from "@/hooks/use-formation-editor";
import type { FormationScene, FormationPosition } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronRight,
  Grid3X3,
  Plus,
  Trash2,
  ChevronUp,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  Copy,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// 색상 팔레트
// ============================================

const MEMBER_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f59e0b", // amber
];

// ============================================
// 멤버 이름 약자 추출
// ============================================

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // 한글인 경우 첫 글자
  if (/^[가-힣]/.test(trimmed)) {
    return trimmed.slice(0, 2);
  }
  // 영문인 경우 이니셜
  const parts = trimmed.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

// ============================================
// 텍스트 대비 색상 (배경색에 따라 흰색/검정 결정)
// ============================================

function getTextColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // 밝기 계산 (YIQ)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

// ============================================
// 무대 캔버스 컴포넌트
// ============================================

interface StageCanvasProps {
  scene: FormationScene;
  selectedMemberId: string | null;
  onSelectMember: (memberId: string | null) => void;
  onMoveToClick: (x: number, y: number) => void;
}

function StageCanvas({
  scene,
  selectedMemberId,
  onSelectMember,
  onMoveToClick,
}: StageCanvasProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  const handleStageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // 멤버 뱃지 클릭이면 무시 (버블링 방지는 뱃지 쪽에서 처리)
      if ((e.target as HTMLElement).closest("[data-member-badge]")) return;

      if (!selectedMemberId) return;
      if (!stageRef.current) return;

      const rect = stageRef.current.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / rect.width) * 100;
      const relY = ((e.clientY - rect.top) / rect.height) * 100;
      onMoveToClick(relX, relY);
    },
    [selectedMemberId, onMoveToClick]
  );

  return (
    <div className="space-y-1">
      {/* 객석 방향 표시 */}
      <div className="flex items-center justify-center gap-1.5">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] text-muted-foreground font-medium tracking-wider px-1">
          객석 (앞)
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* 무대 영역 */}
      <div
        ref={stageRef}
        className="relative w-full bg-muted/40 border-2 border-dashed border-border rounded-md overflow-hidden select-none"
        style={{
          aspectRatio: "16/9",
          cursor: selectedMemberId ? "crosshair" : "default",
        }}
        onClick={handleStageClick}
      >
        {/* 무대 격자 (희미한 가이드라인) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)",
            backgroundSize: "25% 33.33%",
          }}
        />

        {/* 클릭 안내 */}
        {selectedMemberId && scene.positions.length > 0 && (
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 pointer-events-none z-10">
            <span className="text-[9px] text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded-full border">
              무대를 클릭해 이동
            </span>
          </div>
        )}

        {/* 멤버 위치 뱃지 */}
        {scene.positions.map((pos) => (
          <MemberBadge
            key={pos.memberId}
            position={pos}
            isSelected={selectedMemberId === pos.memberId}
            onSelect={() =>
              onSelectMember(
                selectedMemberId === pos.memberId ? null : pos.memberId
              )
            }
          />
        ))}

        {/* 빈 상태 */}
        {scene.positions.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none">
            <Grid3X3 className="h-6 w-6 mb-1.5 opacity-30" />
            <p className="text-[11px] opacity-60">
              아래에서 멤버를 추가하세요
            </p>
          </div>
        )}
      </div>

      {/* 뒤쪽 표시 */}
      <div className="flex items-center justify-center gap-1.5">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] text-muted-foreground font-medium tracking-wider px-1">
          무대 뒤
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}

// ============================================
// 멤버 배지 (무대 위)
// ============================================

interface MemberBadgeProps {
  position: FormationPosition;
  isSelected: boolean;
  onSelect: () => void;
}

function MemberBadge({ position, isSelected, onSelect }: MemberBadgeProps) {
  const initials = getInitials(position.memberName);
  const textColor = getTextColor(position.color);

  return (
    <button
      data-member-badge="true"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 focus:outline-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) scale(${isSelected ? 1.2 : 1})`,
        zIndex: isSelected ? 10 : 1,
      }}
      title={position.memberName}
    >
      <div
        className="flex items-center justify-center rounded-full font-bold shadow-md transition-all duration-150"
        style={{
          width: 34,
          height: 34,
          backgroundColor: position.color,
          color: textColor,
          fontSize: initials.length > 1 ? 10 : 13,
          outline: isSelected ? `2.5px solid white` : "none",
          boxShadow: isSelected
            ? `0 0 0 2px ${position.color}, 0 2px 8px rgba(0,0,0,0.3)`
            : "0 2px 4px rgba(0,0,0,0.25)",
        }}
      >
        {initials}
      </div>
    </button>
  );
}

// ============================================
// 선택된 멤버 컨트롤 패널
// ============================================

interface SelectedMemberControlProps {
  position: FormationPosition;
  onMove: (dx: number, dy: number) => void;
  onRemove: () => void;
  onDeselect: () => void;
}

function SelectedMemberControl({
  position,
  onMove,
  onRemove,
  onDeselect,
}: SelectedMemberControlProps) {
  const STEP = 2; // 2% 씩 이동

  return (
    <div className="border rounded-md p-2.5 bg-muted/30 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div
            className="h-4 w-4 rounded-full shrink-0"
            style={{ backgroundColor: position.color }}
          />
          <span className="text-xs font-medium truncate max-w-[120px]">
            {position.memberName}
          </span>
          <span className="text-[10px] text-muted-foreground">
            ({Math.round(position.x)}%, {Math.round(position.y)}%)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            title="무대에서 제거"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] text-muted-foreground"
            onClick={onDeselect}
          >
            닫기
          </Button>
        </div>
      </div>

      {/* 방향키 버튼 */}
      <div className="flex flex-col items-center gap-0.5">
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onMove(0, -STEP)}
          title="위로"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <div className="flex gap-0.5">
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onMove(-STEP, 0)}
            title="왼쪽"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onMove(0, STEP)}
            title="아래로"
          >
            <ChevronDownIcon className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onMove(STEP, 0)}
            title="오른쪽"
          >
            <ChevronRightIcon className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 씬 탭 선택기
// ============================================

interface SceneTabsProps {
  scenes: FormationScene[];
  activeSceneId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function SceneTabs({
  scenes,
  activeSceneId,
  onSelect,
  onDelete,
}: SceneTabsProps) {
  if (scenes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {scenes.map((scene) => {
        const isActive = scene.id === activeSceneId;
        return (
          <div key={scene.id} className="flex items-center gap-0.5">
            <button
              onClick={() => onSelect(scene.id)}
              className={[
                "text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted",
              ].join(" ")}
            >
              {scene.label}
              {scene.positions.length > 0 && (
                <span className="ml-1 opacity-70">·{scene.positions.length}</span>
              )}
            </button>
            {isActive && (
              <button
                onClick={() => onDelete(scene.id)}
                className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="씬 삭제"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// 멤버 목록 패널 (씬별)
// ============================================

interface MemberListPanelProps {
  scene: FormationScene;
  selectedMemberId: string | null;
  onSelectMember: (id: string | null) => void;
  onAddMember: (name: string, color: string) => void;
  onRemoveMember: (memberId: string) => void;
}

function MemberListPanel({
  scene,
  selectedMemberId,
  onSelectMember,
  onAddMember,
  onRemoveMember,
}: MemberListPanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberColor, setMemberColor] = useState(MEMBER_COLORS[0]!);

  function handleAdd() {
    if (!memberName.trim()) {
      toast.error("멤버 이름을 입력하세요.");
      return;
    }
    onAddMember(memberName.trim(), memberColor);
    setMemberName("");
    setMemberColor(MEMBER_COLORS[0]!);
    setAddOpen(false);
  }

  return (
    <div className="space-y-1.5">
      {/* 멤버 목록 */}
      <div className="flex flex-wrap gap-1.5">
        {scene.positions.map((pos) => {
          const isSelected = selectedMemberId === pos.memberId;
          return (
            <button
              key={pos.memberId}
              onClick={() =>
                onSelectMember(isSelected ? null : pos.memberId)
              }
              className={[
                "flex items-center gap-1 pl-1 pr-2 py-0.5 rounded-full text-[11px] font-medium transition-colors border-2",
                isSelected
                  ? "bg-muted"
                  : "border-transparent hover:bg-muted",
              ].join(" ")}
              style={
                isSelected
                  ? { borderColor: pos.color }
                  : {}
              }
            >
              <div
                className="h-4 w-4 rounded-full shrink-0 flex items-center justify-center text-[8px] font-bold"
                style={{
                  backgroundColor: pos.color,
                  color: getTextColor(pos.color),
                }}
              >
                {getInitials(pos.memberName).slice(0, 1)}
              </div>
              <span className="truncate max-w-[80px]">{pos.memberName}</span>
            </button>
          );
        })}

        {/* 멤버 추가 버튼 */}
        {!addOpen && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full border border-dashed text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            <UserPlus className="h-3 w-3" />
            추가
          </button>
        )}
      </div>

      {/* 멤버 추가 인라인 폼 */}
      {addOpen && (
        <div className="border rounded-md p-2.5 space-y-2 bg-muted/30">
          <p className="text-[10px] font-medium text-muted-foreground">
            멤버 추가
          </p>
          <div className="flex gap-1.5">
            <Input
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="이름 입력"
              className="h-7 text-xs flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setAddOpen(false);
              }}
              autoFocus
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              색상 선택
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {MEMBER_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setMemberColor(color)}
                  className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor:
                      memberColor === color ? "white" : "transparent",
                    boxShadow:
                      memberColor === color
                        ? `0 0 0 2px ${color}`
                        : "none",
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={handleAdd}
              disabled={!memberName.trim()}
            >
              <Plus className="h-3 w-3 mr-1" />
              무대에 배치
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setAddOpen(false);
                setMemberName("");
              }}
            >
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 씬 추가 다이얼로그
// ============================================

interface AddSceneDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (label: string) => void;
  scenes: FormationScene[];
}

function AddSceneDialog({ open, onClose, onAdd, scenes }: AddSceneDialogProps) {
  const [label, setLabel] = useState("");

  const QUICK_LABELS = ["인트로", "1절", "프리코러스", "후렴", "2절", "브릿지", "아웃트로", "엔딩"];

  function handleAdd() {
    if (!label.trim()) {
      toast.error("구간 이름을 입력하세요.");
      return;
    }
    onAdd(label.trim());
    setLabel("");
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
          setLabel("");
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Grid3X3 className="h-4 w-4 text-indigo-500" />
            구간(씬) 추가
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              구간 이름
            </Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="예: 인트로, 후렴, 브릿지"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              autoFocus
            />
          </div>
          {/* 빠른 선택 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1.5 block">
              빠른 선택
            </Label>
            <div className="flex flex-wrap gap-1">
              {QUICK_LABELS.filter(
                (l) => !scenes.some((s) => s.label === l)
              ).map((l) => (
                <button
                  key={l}
                  onClick={() => setLabel(l)}
                  className={[
                    "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
                    label === l
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted",
                  ].join(" ")}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              onClose();
              setLabel("");
            }}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={handleAdd}
            disabled={!label.trim()}
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 메인 카드
// ============================================

interface FormationEditorCardProps {
  groupId: string;
  projectId: string;
}

export function FormationEditorCard({
  groupId,
  projectId,
}: FormationEditorCardProps) {
  const {
    scenes,
    loading,
    canAddScene,
    addScene,
    deleteScene,
    addPosition,
    updatePosition,
    removePosition,
    copyPositionsFromScene,
  } = useFormationEditor(groupId, projectId);

  const [cardExpanded, setCardExpanded] = useState(true);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [addSceneDialogOpen, setAddSceneDialogOpen] = useState(false);

  // 현재 활성 씬
  const activeScene = scenes.find((s) => s.id === activeSceneId) ?? scenes[0] ?? null;
  const effectiveSceneId = activeScene?.id ?? null;

  // 선택된 멤버의 위치 정보
  const selectedPosition = activeScene?.positions.find(
    (p) => p.memberId === selectedMemberId
  ) ?? null;

  function handleAddScene(label: string) {
    const ok = addScene(label);
    if (ok) {
      // 새로 추가된 씬으로 이동
      toast.success(`"${label}" 구간이 추가되었습니다.`);
    } else {
      toast.error("구간은 최대 10개까지 추가할 수 있습니다.");
    }
  }

  function handleDeleteScene(sceneId: string) {
    const scene = scenes.find((s) => s.id === sceneId);
    deleteScene(sceneId);
    if (activeSceneId === sceneId) {
      setActiveSceneId(null);
      setSelectedMemberId(null);
    }
    toast.success(`"${scene?.label ?? ""}" 구간이 삭제되었습니다.`);
  }

  function handleAddMember(name: string, color: string) {
    if (!effectiveSceneId) return;
    const ok = addPosition(effectiveSceneId, name, color);
    if (!ok) {
      toast.error(`"${name}"은(는) 이미 이 구간에 추가되어 있습니다.`);
    } else {
      toast.success(`${name} 멤버가 무대 중앙에 배치되었습니다.`);
    }
  }

  function handleRemoveMember(memberId: string) {
    if (!effectiveSceneId) return;
    removePosition(effectiveSceneId, memberId);
    setSelectedMemberId(null);
    toast.success("멤버가 무대에서 제거되었습니다.");
  }

  function handleMoveToClick(x: number, y: number) {
    if (!effectiveSceneId || !selectedMemberId) return;
    updatePosition(effectiveSceneId, selectedMemberId, x, y);
  }

  function handleFineMove(dx: number, dy: number) {
    if (!effectiveSceneId || !selectedMemberId || !selectedPosition) return;
    updatePosition(
      effectiveSceneId,
      selectedMemberId,
      selectedPosition.x + dx,
      selectedPosition.y + dy
    );
  }

  function handleCopyFromPrev() {
    if (!effectiveSceneId) return;
    const currentIndex = scenes.findIndex((s) => s.id === effectiveSceneId);
    if (currentIndex <= 0) {
      toast.error("이전 구간이 없습니다.");
      return;
    }
    const prevSceneId = scenes[currentIndex - 1]!.id;
    const ok = copyPositionsFromScene(prevSceneId, effectiveSceneId);
    if (ok) {
      toast.success("이전 구간의 대형을 복사했습니다.");
    } else {
      toast.error("복사에 실패했습니다.");
    }
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
                <Grid3X3 className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="text-sm font-semibold">포메이션 에디터</span>
                {scenes.length > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100 shrink-0">
                    {scenes.length}/10
                  </Badge>
                )}
              </button>
            </CollapsibleTrigger>
            {canAddScene && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs shrink-0"
                onClick={() => setAddSceneDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                구간 추가
              </Button>
            )}
          </div>

          {/* 본문 */}
          <CollapsibleContent>
            <div className="p-4 space-y-3">
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : scenes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Grid3X3 className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-xs">등록된 구간이 없습니다.</p>
                  <p className="text-[10px] mt-0.5">
                    위 &apos;구간 추가&apos; 버튼으로 시작하세요.
                  </p>
                </div>
              ) : (
                <>
                  {/* 씬 탭 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <SceneTabs
                      scenes={scenes}
                      activeSceneId={effectiveSceneId}
                      onSelect={(id) => {
                        setActiveSceneId(id);
                        setSelectedMemberId(null);
                      }}
                      onDelete={handleDeleteScene}
                    />
                    {/* 이전 구간 복사 버튼 */}
                    {effectiveSceneId &&
                      scenes.findIndex((s) => s.id === effectiveSceneId) > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] text-muted-foreground gap-1"
                          onClick={handleCopyFromPrev}
                        >
                          <Copy className="h-2.5 w-2.5" />
                          이전 복사
                        </Button>
                      )}
                  </div>

                  {/* 무대 + 컨트롤 */}
                  {activeScene && (
                    <div className="space-y-2">
                      {/* 무대 캔버스 */}
                      <StageCanvas
                        scene={activeScene}
                        selectedMemberId={selectedMemberId}
                        onSelectMember={setSelectedMemberId}
                        onMoveToClick={handleMoveToClick}
                      />

                      {/* 선택된 멤버 컨트롤 */}
                      {selectedPosition && (
                        <SelectedMemberControl
                          position={selectedPosition}
                          onMove={handleFineMove}
                          onRemove={() => handleRemoveMember(selectedMemberId!)}
                          onDeselect={() => setSelectedMemberId(null)}
                        />
                      )}

                      {/* 멤버 목록 */}
                      <div className="border-t pt-2">
                        <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">
                          멤버 ({activeScene.positions.length}명)
                        </p>
                        <MemberListPanel
                          scene={activeScene}
                          selectedMemberId={selectedMemberId}
                          onSelectMember={setSelectedMemberId}
                          onAddMember={handleAddMember}
                          onRemoveMember={handleRemoveMember}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* 씬 추가 다이얼로그 */}
      <AddSceneDialog
        open={addSceneDialogOpen}
        onClose={() => setAddSceneDialogOpen(false)}
        onAdd={handleAddScene}
        scenes={scenes}
      />
    </>
  );
}
