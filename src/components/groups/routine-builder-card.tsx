"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Play,
  ListChecks,
  Clock,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  useRoutineBuilder,
  BLOCK_TYPE_LABELS,
  BLOCK_TYPE_COLORS,
  BLOCK_DEFAULT_MINUTES,
  type AddBlockParams,
} from "@/hooks/use-routine-builder";
import type { PracticeRoutine, RoutineBlock, RoutineBlockType } from "@/types";

// ─── 상수 ──────────────────────────────────────────────────────────────────

const BLOCK_TYPES: RoutineBlockType[] = [
  "warmup",
  "basics",
  "technique",
  "choreography",
  "freestyle",
  "cooldown",
  "break",
];

// ─── 유틸 ──────────────────────────────────────────────────────────────────

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

// ─── 블록 타입 아이콘 (단순 색상 원으로 대체) ────────────────────────────────

function BlockTypeDot({ type }: { type: RoutineBlockType }) {
  const colors = BLOCK_TYPE_COLORS[type];
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${colors.bg} border ${colors.border} shrink-0`}
    />
  );
}

// ─── 블록 분포 바 ─────────────────────────────────────────────────────────

function BlockDistributionBar({ blocks }: { blocks: RoutineBlock[] }) {
  const total = blocks.reduce((s, b) => s + b.durationMinutes, 0);
  if (total === 0 || blocks.length === 0) return null;

  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full">
      {blocks.map((block) => {
        const pct = (block.durationMinutes / total) * 100;
        const colors = BLOCK_TYPE_COLORS[block.type];
        return (
          <div
            key={block.id}
            style={{ width: `${pct}%` }}
            className={`${colors.bg} border-r border-white last:border-r-0`}
            title={`${BLOCK_TYPE_LABELS[block.type]}: ${block.durationMinutes}분`}
          />
        );
      })}
    </div>
  );
}

// ─── 블록 분포 범례 ──────────────────────────────────────────────────────────

function BlockLegend({ blocks }: { blocks: RoutineBlock[] }) {
  // 타입별로 합산
  const typeMap = new Map<RoutineBlockType, number>();
  for (const b of blocks) {
    typeMap.set(b.type, (typeMap.get(b.type) ?? 0) + b.durationMinutes);
  }

  if (typeMap.size === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
      {Array.from(typeMap.entries()).map(([type, mins]) => (
        <span key={type} className="flex items-center gap-0.5 text-[10px] text-gray-500">
          <BlockTypeDot type={type} />
          {BLOCK_TYPE_LABELS[type]} {mins}분
        </span>
      ))}
    </div>
  );
}

// ─── 블록 추가 폼 ─────────────────────────────────────────────────────────

interface AddBlockFormProps {
  routineId: string;
  onAdd: (routineId: string, params: AddBlockParams) => boolean;
  onClose: () => void;
}

function AddBlockForm({ routineId, onAdd, onClose }: AddBlockFormProps) {
  const [selectedType, setSelectedType] = useState<RoutineBlockType>("warmup");
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(
    BLOCK_DEFAULT_MINUTES["warmup"]
  );
  const [description, setDescription] = useState("");

  const handleTypeChange = (type: RoutineBlockType) => {
    setSelectedType(type);
    setDurationMinutes(BLOCK_DEFAULT_MINUTES[type]);
    if (!title || BLOCK_TYPES.some((t) => BLOCK_TYPE_LABELS[t] === title)) {
      setTitle(BLOCK_TYPE_LABELS[type]);
    }
  };

  const handleSubmit = () => {
    if (durationMinutes < 1 || durationMinutes > 300) {
      toast.error("시간은 1~300분 사이로 입력해주세요.");
      return;
    }
    const ok = onAdd(routineId, {
      type: selectedType,
      title: title.trim() || BLOCK_TYPE_LABELS[selectedType],
      durationMinutes,
      description: description.trim(),
    });
    if (ok) {
      toast.success("블록이 추가되었습니다.");
      onClose();
    } else {
      toast.error("블록 추가에 실패했습니다.");
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 mt-2">
      <p className="mb-2 text-xs font-semibold text-gray-700">블록 추가</p>

      {/* 타입 선택 */}
      <div className="mb-2 flex flex-wrap gap-1">
        {BLOCK_TYPES.map((type) => {
          const colors = BLOCK_TYPE_COLORS[type];
          const isSelected = type === selectedType;
          return (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium border transition-all ${
                isSelected
                  ? `${colors.bg} ${colors.text} ${colors.border}`
                  : "bg-background text-gray-400 border-gray-200 hover:border-gray-300"
              }`}
            >
              {BLOCK_TYPE_LABELS[type]}
            </button>
          );
        })}
      </div>

      {/* 제목 + 시간 */}
      <div className="mb-2 flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 40))}
          placeholder={BLOCK_TYPE_LABELS[selectedType]}
          className="h-8 flex-1 text-xs"
        />
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            min={1}
            max={300}
            className="h-8 w-16 text-xs text-center"
          />
          <span className="text-[11px] text-gray-500 whitespace-nowrap">분</span>
        </div>
      </div>

      {/* 설명 */}
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value.slice(0, 200))}
        placeholder="블록 설명 (선택, 최대 200자)"
        className="mb-2 min-h-[48px] resize-none text-xs"
      />

      <div className="flex gap-2">
        <Button size="sm" className="h-7 flex-1 text-xs" onClick={handleSubmit}>
          <Plus className="mr-1 h-3 w-3" />
          추가
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-gray-500"
          onClick={onClose}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ─── 단일 블록 행 ────────────────────────────────────────────────────────────

interface BlockRowProps {
  block: RoutineBlock;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

function BlockRow({ block, isFirst, isLast, onMoveUp, onMoveDown, onDelete }: BlockRowProps) {
  const colors = BLOCK_TYPE_COLORS[block.type];

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${colors.bg} ${colors.border}`}
    >
      {/* 순서 표시 */}
      <span className="shrink-0 text-[11px] font-bold text-gray-400 w-4 text-center">
        {block.order + 1}
      </span>

      {/* 타입 배지 */}
      <Badge className={`shrink-0 text-[10px] px-1.5 py-0 ${colors.badge}`}>
        {BLOCK_TYPE_LABELS[block.type]}
      </Badge>

      {/* 제목 + 설명 */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold truncate ${colors.text}`}>{block.title}</p>
        {block.description && (
          <p className="text-[10px] text-gray-500 truncate leading-tight">
            {block.description}
          </p>
        )}
      </div>

      {/* 시간 */}
      <span className="shrink-0 flex items-center gap-0.5 text-[11px] text-gray-500">
        <Clock className="h-3 w-3" />
        {block.durationMinutes}분
      </span>

      {/* 이동/삭제 버튼 */}
      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          onClick={onMoveUp}
          disabled={isFirst}
          title="위로"
        >
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          onClick={onMoveDown}
          disabled={isLast}
          title="아래로"
        >
          <ArrowDown className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
          onClick={onDelete}
          title="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── 루틴 편집 패널 ──────────────────────────────────────────────────────────

interface RoutineEditorProps {
  routine: PracticeRoutine;
  onAddBlock: (routineId: string, params: AddBlockParams) => boolean;
  onDeleteBlock: (routineId: string, blockId: string) => void;
  onMoveBlock: (routineId: string, blockId: string, dir: "up" | "down") => void;
  onUseRoutine: (routineId: string) => void;
  onClose: () => void;
}

function RoutineEditor({
  routine,
  onAddBlock,
  onDeleteBlock,
  onMoveBlock,
  onUseRoutine,
  onClose,
}: RoutineEditorProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleUse = () => {
    onUseRoutine(routine.id);
    toast.success(`"${routine.name}" 루틴을 사용했습니다.`);
  };

  return (
    <div className="rounded-b-lg border-x border-b border-gray-200 bg-card p-3">
      {/* 블록 목록 */}
      {routine.blocks.length === 0 ? (
        <p className="py-4 text-center text-[11px] text-gray-400">
          블록이 없습니다. 아래에서 블록을 추가하세요.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5 mb-3">
          {routine.blocks.map((block, idx) => (
            <BlockRow
              key={block.id}
              block={block}
              isFirst={idx === 0}
              isLast={idx === routine.blocks.length - 1}
              onMoveUp={() => onMoveBlock(routine.id, block.id, "up")}
              onMoveDown={() => onMoveBlock(routine.id, block.id, "down")}
              onDelete={() => {
                onDeleteBlock(routine.id, block.id);
                toast.success("블록이 삭제되었습니다.");
              }}
            />
          ))}
        </div>
      )}

      {/* 블록 추가 버튼 / 폼 */}
      {showAddForm ? (
        <AddBlockForm
          routineId={routine.id}
          onAdd={onAddBlock}
          onClose={() => setShowAddForm(false)}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full text-xs border-dashed"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="mr-1 h-3 w-3" />
          블록 추가
        </Button>
      )}

      {/* 하단 요약 */}
      {routine.blocks.length > 0 && (
        <div className="mt-3">
          <Separator className="mb-2" />
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">
              총 {routine.blocks.length}개 블록 ·{" "}
              <span className="font-semibold text-gray-700">
                {formatMinutes(routine.totalMinutes)}
              </span>
            </span>
            <Button
              size="sm"
              className="h-6 text-[10px] px-2 bg-indigo-600 hover:bg-indigo-700"
              onClick={handleUse}
            >
              <Play className="mr-1 h-3 w-3" />
              사용하기
            </Button>
          </div>
          <BlockDistributionBar blocks={routine.blocks} />
          <BlockLegend blocks={routine.blocks} />
        </div>
      )}

      {/* 닫기 */}
      <div className="mt-2 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] text-gray-400"
          onClick={onClose}
        >
          접기
        </Button>
      </div>
    </div>
  );
}

// ─── 루틴 목록 아이템 ─────────────────────────────────────────────────────────

interface RoutineListItemProps {
  routine: PracticeRoutine;
  isEditing: boolean;
  onToggleEdit: () => void;
  onAddBlock: (routineId: string, params: AddBlockParams) => boolean;
  onDeleteBlock: (routineId: string, blockId: string) => void;
  onMoveBlock: (routineId: string, blockId: string, dir: "up" | "down") => void;
  onUseRoutine: (routineId: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function RoutineListItem({
  routine,
  isEditing,
  onToggleEdit,
  onAddBlock,
  onDeleteBlock,
  onMoveBlock,
  onUseRoutine,
  onDelete,
  onDuplicate,
}: RoutineListItemProps) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      {/* 루틴 헤더 */}
      <div
        className={`flex items-center gap-2 px-3 py-2 bg-card cursor-pointer hover:bg-muted/30 transition-colors ${
          isEditing ? "border-b border-gray-100" : ""
        }`}
        onClick={onToggleEdit}
      >
        <ListChecks className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 truncate">{routine.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-400">
              {formatMinutes(routine.totalMinutes)} · {routine.blocks.length}개 블록
            </span>
            {routine.usageCount > 0 && (
              <span className="text-[10px] text-gray-400">· {routine.usageCount}회 사용</span>
            )}
          </div>
        </div>

        {/* 블록 미리보기 분포 */}
        {routine.blocks.length > 0 && (
          <div className="hidden sm:flex items-center gap-0.5">
            {routine.blocks.slice(0, 6).map((b) => (
              <span
                key={b.id}
                className={`h-4 w-1.5 rounded-sm ${BLOCK_TYPE_COLORS[b.type].bg} border ${BLOCK_TYPE_COLORS[b.type].border}`}
                title={BLOCK_TYPE_LABELS[b.type]}
              />
            ))}
            {routine.blocks.length > 6 && (
              <span className="text-[10px] text-gray-400">+{routine.blocks.length - 6}</span>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500"
            onClick={onDuplicate}
            title="복제"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
            onClick={onDelete}
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          {isEditing ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          )}
        </div>
      </div>

      {/* 편집 패널 */}
      {isEditing && (
        <RoutineEditor
          routine={routine}
          onAddBlock={onAddBlock}
          onDeleteBlock={onDeleteBlock}
          onMoveBlock={onMoveBlock}
          onUseRoutine={onUseRoutine}
          onClose={onToggleEdit}
        />
      )}
    </div>
  );
}

// ─── 루틴 생성 폼 ────────────────────────────────────────────────────────────

interface CreateRoutineFormProps {
  onCreate: (name: string) => PracticeRoutine | null;
  onClose: () => void;
}

function CreateRoutineForm({ onCreate, onClose }: CreateRoutineFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("루틴 이름을 입력해주세요.");
      return;
    }
    const result = onCreate(name.trim());
    if (result) {
      toast.success(`"${result.name}" 루틴이 생성되었습니다.`);
      onClose();
    } else {
      toast.error("루틴 생성에 실패했습니다.");
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 mt-2">
      <p className="mb-2 text-xs font-semibold text-gray-700">새 루틴 만들기</p>
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 50))}
          placeholder="루틴 이름 (최대 50자)"
          className="h-8 flex-1 text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") onClose();
          }}
          autoFocus
        />
        <Button size="sm" className="h-8 px-3 text-xs" onClick={handleSubmit}>
          <Check className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-gray-400"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── 메인 카드 ───────────────────────────────────────────────────────────────

interface RoutineBuilderCardProps {
  groupId: string;
}

export function RoutineBuilderCard({ groupId }: RoutineBuilderCardProps) {
  const [open, setOpen] = useState(true);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    routines,
    createRoutine,
    deleteRoutine,
    duplicateRoutine,
    useRoutine,
    addBlock,
    deleteBlock,
    moveBlock,
  } = useRoutineBuilder(groupId);

  const handleDelete = (routineId: string, name: string) => {
    deleteRoutine(routineId);
    toast.success(`"${name}" 루틴이 삭제되었습니다.`);
    if (editingRoutineId === routineId) setEditingRoutineId(null);
  };

  const handleDuplicate = (routineId: string) => {
    const result = duplicateRoutine(routineId);
    if (result) {
      toast.success(`"${result.name}"으로 복제되었습니다.`);
    } else {
      toast.error("복제에 실패했습니다.");
    }
  };

  const toggleEdit = (routineId: string) => {
    setEditingRoutineId((prev) => (prev === routineId ? null : routineId));
  };

  // 총 시간 및 루틴 수 통계
  const totalRoutines = routines.length;
  const totalUsages = routines.reduce((s, r) => s + r.usageCount, 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Pencil className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-800">연습 루틴 빌더</span>
          {totalRoutines > 0 && (
            <Badge className="bg-indigo-100 text-[10px] px-1.5 py-0 text-indigo-600 hover:bg-indigo-100">
              {totalRoutines}개
            </Badge>
          )}
          {totalUsages > 0 && (
            <Badge className="bg-green-100 text-[10px] px-1.5 py-0 text-green-600 hover:bg-green-100">
              {totalUsages}회 사용
            </Badge>
          )}
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            {open ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </CollapsibleTrigger>
      </div>

      {/* 카드 본문 */}
      <CollapsibleContent>
        <div className="rounded-b-lg border border-t-0 border-gray-200 bg-card p-4">
          {/* 루틴 목록 */}
          {routines.length === 0 && !showCreateForm ? (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-400 mb-1">아직 만든 루틴이 없습니다.</p>
              <p className="text-xs text-gray-300">
                워밍업, 기초훈련, 안무연습 등 블록을 조합하여 나만의 루틴을 만들어보세요.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mb-3">
              {routines.map((routine) => (
                <RoutineListItem
                  key={routine.id}
                  routine={routine}
                  isEditing={editingRoutineId === routine.id}
                  onToggleEdit={() => toggleEdit(routine.id)}
                  onAddBlock={addBlock}
                  onDeleteBlock={deleteBlock}
                  onMoveBlock={moveBlock}
                  onUseRoutine={useRoutine}
                  onDelete={() => handleDelete(routine.id, routine.name)}
                  onDuplicate={() => handleDuplicate(routine.id)}
                />
              ))}
            </div>
          )}

          <Separator className="mb-3" />

          {/* 루틴 생성 버튼 / 폼 */}
          {showCreateForm ? (
            <CreateRoutineForm
              onCreate={createRoutine}
              onClose={() => setShowCreateForm(false)}
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-full text-xs border-dashed"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="mr-1 h-3 w-3" />
              새 루틴 만들기
            </Button>
          )}

          {/* 하단 통계 요약 */}
          {routines.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="text-[10px] text-gray-400">
                총 {totalRoutines}개 루틴
              </span>
              <span className="text-[10px] text-gray-400">
                총 사용 {totalUsages}회
              </span>
              {routines.length > 0 && (
                <span className="text-[10px] text-gray-400">
                  평균{" "}
                  {formatMinutes(
                    Math.round(
                      routines.reduce((s, r) => s + r.totalMinutes, 0) / routines.length
                    )
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
