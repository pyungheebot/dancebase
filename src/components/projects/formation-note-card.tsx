"use client";

import { useState } from "react";
import { useFormationNote } from "@/hooks/use-formation-note";
import type { FormationNotePosition } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Move,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Users,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// 멤버 색상 팔레트
// ============================================

const MEMBER_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#64748b",
  "#a855f7",
];

function getMemberColor(memberName: string, memberNames: string[]): string {
  const idx = memberNames.indexOf(memberName);
  if (idx === -1) return "#94a3b8";
  return MEMBER_COLORS[idx % MEMBER_COLORS.length] ?? "#94a3b8";
}

// ============================================
// 이니셜 추출
// ============================================

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  if (/^[가-힣]/.test(trimmed)) {
    return trimmed.slice(0, 2);
  }
  const parts = trimmed.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

// ============================================
// 텍스트 대비 색상
// ============================================

function getTextColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

// ============================================
// 스테이지 뷰 (200x120)
// ============================================

interface StageViewProps {
  positions: FormationNotePosition[];
  memberNames: string[];
}

function StageView({ positions, memberNames }: StageViewProps) {
  return (
    <div
      className="relative bg-gray-900 border border-gray-600 rounded overflow-hidden"
      style={{ width: 200, height: 120 }}
    >
      {/* 무대 라벨 */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 select-none">
        STAGE
      </div>
      {/* 무대 경계선 */}
      <div className="absolute inset-2 border border-dashed border-gray-700 rounded pointer-events-none" />

      {positions.map((pos) => {
        const color = getMemberColor(pos.memberName, memberNames);
        const textColor = getTextColor(color);
        const left = `${pos.x}%`;
        const top = `${pos.y}%`;
        return (
          <div
            key={pos.memberName}
            className="absolute flex items-center justify-center rounded-full text-[8px] font-bold select-none"
            style={{
              width: 22,
              height: 22,
              left,
              top,
              transform: "translate(-50%, -50%)",
              backgroundColor: color,
              color: textColor,
              border: "1.5px solid rgba(255,255,255,0.3)",
              zIndex: 10,
            }}
            title={pos.memberName}
          >
            {getInitials(pos.memberName)}
          </div>
        );
      })}

      {positions.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-600">
          멤버 없음
        </div>
      )}
    </div>
  );
}

// ============================================
// 스냅샷 추가 다이얼로그
// ============================================

interface AddSnapshotDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  memberNames: string[];
  onAdd: (
    name: string,
    timestamp: string,
    positions: FormationNotePosition[],
    notes?: string
  ) => void;
}

function AddSnapshotDialog({
  open,
  onOpenChange,
  memberNames,
  onAdd,
}: AddSnapshotDialogProps) {
  const [name, setName] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  function reset() {
    setName("");
    setTimestamp("");
    setNotes("");
    setSelectedMembers([]);
  }

  function handleToggleMember(memberName: string, checked: boolean) {
    setSelectedMembers((prev) =>
      checked ? [...prev, memberName] : prev.filter((m) => m !== memberName)
    );
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("대형 이름을 입력해주세요.");
      return;
    }
    if (timestamp && !/^\d{1,2}:\d{2}$/.test(timestamp.trim())) {
      toast.error("시간은 MM:SS 형식으로 입력해주세요. (예: 1:30)");
      return;
    }

    // 선택된 멤버를 격자 배치로 초기 위치 할당
    const positions: FormationNotePosition[] = selectedMembers.map((memberName, idx) => {
      const cols = Math.ceil(Math.sqrt(selectedMembers.length));
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const totalRows = Math.ceil(selectedMembers.length / cols);
      const x = cols <= 1 ? 50 : 20 + (col / (cols - 1)) * 60;
      const y = totalRows <= 1 ? 50 : 25 + (row / (totalRows - 1)) * 50;
      return { memberName, x: Math.round(x), y: Math.round(y) };
    });

    onAdd(name.trim(), timestamp.trim(), positions, notes.trim() || undefined);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">스냅샷 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* 이름 */}
          <div className="space-y-1">
            <Label className="text-xs">대형 이름 *</Label>
            <Input
              className="h-7 text-xs"
              placeholder="예: 인트로 대형"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* 시간 */}
          <div className="space-y-1">
            <Label className="text-xs">시간 (MM:SS)</Label>
            <Input
              className="h-7 text-xs"
              placeholder="예: 0:30"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
            />
          </div>

          {/* 참여 멤버 */}
          {memberNames.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">참여 멤버</Label>
              <div className="border rounded p-2 max-h-32 overflow-y-auto space-y-1">
                {memberNames.map((memberName) => (
                  <div key={memberName} className="flex items-center gap-2">
                    <Checkbox
                      id={`member-${memberName}`}
                      checked={selectedMembers.includes(memberName)}
                      onCheckedChange={(checked) =>
                        handleToggleMember(memberName, !!checked)
                      }
                    />
                    <label
                      htmlFor={`member-${memberName}`}
                      className="text-xs cursor-pointer"
                    >
                      {memberName}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Textarea
              className="text-xs resize-none"
              rows={2}
              placeholder="대형 관련 메모 입력..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => { reset(); onOpenChange(false); }}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 위치 편집 패널
// ============================================

interface PositionEditorProps {
  snapshotId: string;
  positions: FormationNotePosition[];
  memberNames: string[];
  onUpdatePosition: (snapshotId: string, memberName: string, x: number, y: number) => void;
  onAddMember: (snapshotId: string, memberName: string) => void;
  onRemoveMember: (snapshotId: string, memberName: string) => void;
}

function PositionEditor({
  snapshotId,
  positions,
  memberNames,
  onUpdatePosition,
  onAddMember,
  onRemoveMember,
}: PositionEditorProps) {
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [xInput, setXInput] = useState("50");
  const [yInput, setYInput] = useState("50");

  const presentMembers = positions.map((p) => p.memberName);
  const absentMembers = memberNames.filter((m) => !presentMembers.includes(m));

  function handleSelectMember(memberName: string) {
    setSelectedMember(memberName);
    const pos = positions.find((p) => p.memberName === memberName);
    if (pos) {
      setXInput(String(pos.x));
      setYInput(String(pos.y));
    }
  }

  function handleApply() {
    if (!selectedMember) return;
    const x = Math.min(100, Math.max(0, Number(xInput)));
    const y = Math.min(100, Math.max(0, Number(yInput)));
    if (isNaN(x) || isNaN(y)) {
      toast.error("좌표 값이 유효하지 않습니다.");
      return;
    }
    onUpdatePosition(snapshotId, selectedMember, x, y);
    toast.success("위치를 업데이트했습니다.");
  }

  return (
    <div className="space-y-2 pt-2 border-t">
      <p className="text-[10px] text-gray-500 font-medium">위치 편집</p>

      {/* 멤버 선택 */}
      <Select value={selectedMember} onValueChange={handleSelectMember}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue placeholder="멤버 선택" />
        </SelectTrigger>
        <SelectContent>
          {presentMembers.map((name) => (
            <SelectItem key={name} value={name} className="text-xs">
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedMember && (
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-1">
            <Label className="text-[10px] text-gray-500">X (0~100)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              className="h-7 text-xs"
              value={xInput}
              onChange={(e) => setXInput(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-[10px] text-gray-500">Y (0~100)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              className="h-7 text-xs"
              value={yInput}
              onChange={(e) => setYInput(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1 pt-4">
            <Button size="sm" className="h-7 text-xs px-2" onClick={handleApply}>
              적용
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2 text-red-500 hover:text-red-600"
              onClick={() => {
                onRemoveMember(snapshotId, selectedMember);
                setSelectedMember("");
                toast.success(`${selectedMember} 제거됨`);
              }}
            >
              제거
            </Button>
          </div>
        </div>
      )}

      {/* 멤버 추가 */}
      {absentMembers.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-gray-400">멤버 추가</p>
          <div className="flex flex-wrap gap-1">
            {absentMembers.map((name) => (
              <button
                key={name}
                onClick={() => {
                  onAddMember(snapshotId, name);
                  toast.success(`${name} 추가됨`);
                }}
                className="text-[10px] px-2 py-0.5 rounded border border-dashed border-gray-300 text-gray-500 hover:border-gray-500 hover:text-gray-700 transition-colors"
              >
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

interface FormationNoteCardProps {
  groupId: string;
  projectId: string;
  memberNames: string[];
}

export function FormationNoteCard({
  groupId,
  projectId,
  memberNames,
}: FormationNoteCardProps) {
  const [open, setOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showPositionEditor, setShowPositionEditor] = useState(false);

  const {
    snapshots,
    totalSnapshots,
    memberCount,
    addSnapshot,
    deleteSnapshot,
    updatePosition,
    addMemberToSnapshot,
    removeMemberFromSnapshot,
  } = useFormationNote(groupId, projectId);

  const selectedSnapshot = snapshots[selectedIdx] ?? null;

  function handleAdd(
    name: string,
    timestamp: string,
    positions: FormationNotePosition[],
    notes?: string
  ) {
    addSnapshot(name, timestamp, positions, notes);
    setSelectedIdx(snapshots.length); // 새로 추가된 항목으로 이동
    toast.success("스냅샷이 추가되었습니다.");
  }

  function handleDelete(id: string) {
    deleteSnapshot(id);
    setSelectedIdx((prev) => Math.max(0, prev - 1));
    toast.success("스냅샷이 삭제되었습니다.");
  }

  function handlePrev() {
    setSelectedIdx((prev) => Math.max(0, prev - 1));
    setShowPositionEditor(false);
  }

  function handleNext() {
    setSelectedIdx((prev) => Math.min(snapshots.length - 1, prev + 1));
    setShowPositionEditor(false);
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="border rounded-lg bg-white shadow-sm">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors rounded-t-lg">
              <div className="flex items-center gap-2">
                <Move className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-xs font-semibold text-gray-800">동선 노트</span>
                {totalSnapshots > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
                    {totalSnapshots}개
                  </Badge>
                )}
                {memberCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">
                    최대 {memberCount}명
                  </Badge>
                )}
              </div>
              {open ? (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
              )}
            </button>
          </CollapsibleTrigger>

          {/* 본문 */}
          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-3">
              {/* 추가 버튼 */}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  스냅샷 추가
                </Button>
              </div>

              {snapshots.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs">
                  스냅샷이 없습니다. 추가 버튼을 눌러 대형을 기록하세요.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 스냅샷 목록 */}
                  <div className="space-y-1">
                    {snapshots.map((snapshot, idx) => (
                      <button
                        key={snapshot.id}
                        onClick={() => {
                          setSelectedIdx(idx);
                          setShowPositionEditor(false);
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left transition-colors ${
                          idx === selectedIdx
                            ? "bg-indigo-50 border border-indigo-200"
                            : "hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-xs font-medium truncate ${
                              idx === selectedIdx
                                ? "text-indigo-700"
                                : "text-gray-700"
                            }`}
                          >
                            {snapshot.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {snapshot.timestamp && (
                            <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                              <Clock className="h-2.5 w-2.5" />
                              {snapshot.timestamp}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                            <Users className="h-2.5 w-2.5" />
                            {snapshot.positions.length}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* 선택된 스냅샷 상세 */}
                  {selectedSnapshot && (
                    <div className="border rounded p-2 space-y-2 bg-gray-50">
                      {/* 헤더 정보 */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-800">
                            {selectedSnapshot.name}
                          </p>
                          {selectedSnapshot.timestamp && (
                            <p className="text-[10px] text-gray-400">
                              {selectedSnapshot.timestamp}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(selectedSnapshot.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* 스테이지 뷰 */}
                      <div className="flex justify-center">
                        <StageView
                          positions={selectedSnapshot.positions}
                          memberNames={memberNames}
                        />
                      </div>

                      {/* 멤버 범례 */}
                      {selectedSnapshot.positions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedSnapshot.positions.map((pos) => {
                            const color = getMemberColor(pos.memberName, memberNames);
                            const textColor = getTextColor(color);
                            return (
                              <div
                                key={pos.memberName}
                                className="flex items-center gap-1 text-[10px]"
                              >
                                <div
                                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: color }}
                                >
                                  <span
                                    style={{
                                      color: textColor,
                                      fontSize: "7px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {getInitials(pos.memberName)[0]}
                                  </span>
                                </div>
                                <span className="text-gray-600">{pos.memberName}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 메모 */}
                      {selectedSnapshot.notes && (
                        <p className="text-[10px] text-gray-500 bg-white rounded px-2 py-1 border">
                          {selectedSnapshot.notes}
                        </p>
                      )}

                      {/* 위치 편집 토글 */}
                      <button
                        onClick={() => setShowPositionEditor((prev) => !prev)}
                        className="text-[10px] text-indigo-500 hover:text-indigo-700 transition-colors"
                      >
                        {showPositionEditor ? "위치 편집 닫기" : "위치 편집"}
                      </button>

                      {/* 위치 편집 패널 */}
                      {showPositionEditor && (
                        <PositionEditor
                          snapshotId={selectedSnapshot.id}
                          positions={selectedSnapshot.positions}
                          memberNames={memberNames}
                          onUpdatePosition={updatePosition}
                          onAddMember={addMemberToSnapshot}
                          onRemoveMember={removeMemberFromSnapshot}
                        />
                      )}

                      {/* 이전/다음 네비게이션 */}
                      <div className="flex items-center justify-between pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          disabled={selectedIdx === 0}
                          onClick={handlePrev}
                        >
                          <ChevronLeft className="h-3 w-3 mr-0.5" />
                          이전
                        </Button>
                        <span className="text-[10px] text-gray-400">
                          {selectedIdx + 1} / {snapshots.length}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          disabled={selectedIdx === snapshots.length - 1}
                          onClick={handleNext}
                        >
                          다음
                          <ChevronRightIcon className="h-3 w-3 ml-0.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* 추가 다이얼로그 */}
      <AddSnapshotDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        memberNames={memberNames}
        onAdd={handleAdd}
      />
    </>
  );
}
