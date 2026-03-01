"use client";

// ============================================================
// 동선 노트 폼 다이얼로그 - 추가/수정 공용 다이얼로그
// ============================================================

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAsyncAction } from "@/hooks/use-async-action";
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
import { MemberMoveFormRow } from "./stage-blocking-form-row";
import { EMPTY_MEMBER_MOVE } from "./stage-blocking-types";
import type { StageBlockingNote } from "@/types";
import type {
  AddStageBlockingInput,
  AddMemberMoveInput,
} from "@/hooks/use-stage-blocking";

// ── 빈 폼 기본값 ──
const EMPTY_FORM: AddStageBlockingInput = {
  songTitle: "",
  sceneNumber: "",
  timeStart: "",
  timeEnd: "",
  formation: "",
  memberMoves: [],
  caution: "",
  memo: "",
};

type StageBlockingFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 수정 시 초기 데이터를 전달합니다. 없으면 추가 모드 */
  initial?: StageBlockingNote;
  onSubmit: (input: AddStageBlockingInput) => Promise<boolean>;
  title: string;
};

/**
 * 동선 노트 추가/수정 다이얼로그입니다.
 * - 추가 시: initial 없이 사용
 * - 수정 시: initial에 기존 데이터 전달
 */
export function StageBlockingFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  title,
}: StageBlockingFormDialogProps) {
  // 초기 폼 상태 설정 (수정 시 기존 값으로 초기화)
  const [form, setForm] = useState<AddStageBlockingInput>(
    initial
      ? {
          songTitle: initial.songTitle,
          sceneNumber: initial.sceneNumber ?? "",
          timeStart: initial.timeStart ?? "",
          timeEnd: initial.timeEnd ?? "",
          countStart: initial.countStart,
          countEnd: initial.countEnd,
          formation: initial.formation ?? "",
          memberMoves: initial.memberMoves.map((m) => ({
            memberName: m.memberName,
            fromPosition: m.fromPosition,
            toPosition: m.toPosition,
            direction: m.direction,
            note: m.note,
          })),
          caution: initial.caution ?? "",
          memo: initial.memo ?? "",
        }
      : EMPTY_FORM
  );

  const { pending: saving, execute } = useAsyncAction();

  // 특정 필드 업데이트 헬퍼
  function setField<K extends keyof AddStageBlockingInput>(
    key: K,
    value: AddStageBlockingInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // 멤버 동선 행 변경
  function handleMoveChange(index: number, move: AddMemberMoveInput) {
    const updated = [...form.memberMoves];
    updated[index] = move;
    setField("memberMoves", updated);
  }

  // 멤버 동선 행 삭제
  function handleMoveRemove(index: number) {
    setField(
      "memberMoves",
      form.memberMoves.filter((_, i) => i !== index)
    );
  }

  // 멤버 동선 행 추가
  function handleMoveAdd() {
    setField("memberMoves", [...form.memberMoves, { ...EMPTY_MEMBER_MOVE }]);
  }

  // 저장 처리
  async function handleSubmit() {
    await execute(async () => {
      const ok = await onSubmit(form);
      if (ok) {
        setForm(EMPTY_FORM);
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        aria-describedby="stage-blocking-form-desc"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p id="stage-blocking-form-desc" className="sr-only">
            무대 동선 노트를 입력하는 폼입니다.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 곡/장면 이름 & 장면 번호 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                곡/장면 <span className="text-red-500" aria-hidden="true">*</span>
              </Label>
              <Input
                placeholder="예: 첫 번째 곡, 오프닝"
                value={form.songTitle}
                onChange={(e) => setField("songTitle", e.target.value)}
                className="h-8 text-sm"
                aria-required="true"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">장면/섹션 번호</Label>
              <Input
                placeholder="예: A1, 2절, 브릿지"
                value={form.sceneNumber}
                onChange={(e) => setField("sceneNumber", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* 시간 구간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">시간 시작 (mm:ss)</Label>
              <Input
                placeholder="예: 00:15"
                value={form.timeStart}
                onChange={(e) => setField("timeStart", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">시간 종료 (mm:ss)</Label>
              <Input
                placeholder="예: 00:45"
                value={form.timeEnd}
                onChange={(e) => setField("timeEnd", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* 카운트 구간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">카운트 시작</Label>
              <Input
                type="number"
                placeholder="예: 1"
                value={form.countStart ?? ""}
                onChange={(e) =>
                  setField("countStart", e.target.value ? Number(e.target.value) : undefined)
                }
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">카운트 종료</Label>
              <Input
                type="number"
                placeholder="예: 8"
                value={form.countEnd ?? ""}
                onChange={(e) =>
                  setField("countEnd", e.target.value ? Number(e.target.value) : undefined)
                }
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* 포메이션 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">포메이션</Label>
            <Input
              placeholder="예: 삼각형, V자, 일렬 종대"
              value={form.formation}
              onChange={(e) => setField("formation", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* 멤버별 동선 입력 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">멤버별 동선</Label>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] gap-1 px-2"
                onClick={handleMoveAdd}
                aria-label="멤버 동선 행 추가"
              >
                <Plus className="h-2.5 w-2.5" aria-hidden="true" />
                멤버 추가
              </Button>
            </div>

            {/* 멤버 없을 때 안내 */}
            {form.memberMoves.length === 0 && (
              <div className="rounded-md border border-dashed py-4 text-center text-[11px] text-muted-foreground">
                멤버를 추가하여 동선을 기록하세요
              </div>
            )}

            {/* 멤버 동선 행 목록 */}
            <div className="space-y-2" role="list" aria-label="멤버 동선 목록">
              {form.memberMoves.map((move, idx) => (
                <MemberMoveFormRow
                  key={idx}
                  move={move}
                  index={idx}
                  onChange={handleMoveChange}
                  onRemove={handleMoveRemove}
                />
              ))}
            </div>
          </div>

          {/* 주의사항 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">주의사항</Label>
            <Input
              placeholder="예: 반드시 왼쪽 다리부터 시작, 충돌 주의"
              value={form.caution}
              onChange={(e) => setField("caution", e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* 추가 메모 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">추가 메모</Label>
            <Textarea
              placeholder="기타 참고 사항, 연출 의도 등을 입력하세요"
              value={form.memo}
              onChange={(e) => setField("memo", e.target.value)}
              rows={2}
              className="text-sm resize-none"
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
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
