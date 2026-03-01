"use client";

import { useState, useEffect, startTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ClipboardList, Smile, Wrench, Target, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useScheduleRetro } from "@/hooks/use-schedule-retro";
import { useAsyncAction } from "@/hooks/use-async-action";
import { formatFullDate } from "@/lib/date-utils";

type ScheduleRetroSheetProps = {
  scheduleId: string;
  /** 리더/매니저 여부 (true이면 작성/수정 가능) */
  canEdit: boolean;
};

export function ScheduleRetroSheet({
  scheduleId,
  canEdit,
}: ScheduleRetroSheetProps) {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [good, setGood] = useState("");
  const [improve, setImprove] = useState("");
  const [nextGoal, setNextGoal] = useState("");
  const { pending: submitting, execute } = useAsyncAction();

  const { retro, save, remove } = useScheduleRetro(scheduleId);

  // Sheet 열릴 때 초기값 세팅
  useEffect(() => {
    if (open) {
      if (retro) {
        startTransition(() => {
          setGood(retro.good);
          setImprove(retro.improve);
          setNextGoal(retro.nextGoal);
          // 이미 작성된 경우 읽기 모드로 시작
          setEditMode(false);
        });
      } else {
        startTransition(() => {
          setGood("");
          setImprove("");
          setNextGoal("");
          // 새로 작성하는 경우 편집 모드로 시작
          setEditMode(canEdit);
        });
      }
    }
  }, [open, retro, canEdit]);

  const handleSave = async () => {
    if (!good.trim() && !improve.trim() && !nextGoal.trim()) {
      toast.error("최소 한 가지 항목을 입력해주세요");
      return;
    }

    await execute(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("로그인이 필요합니다");
        return;
      }

      try {
        save({ good, improve, nextGoal }, user.id);
        toast.success("회고록을 저장했습니다");
        setEditMode(false);
      } catch {
        toast.error("회고록 저장에 실패했습니다");
      }
    });
  };

  const handleDelete = () => {
    remove();
    toast.success("회고록을 삭제했습니다");
    setEditMode(false);
    setGood("");
    setImprove("");
    setNextGoal("");
  };

  const handleEditStart = () => {
    if (retro) {
      setGood(retro.good);
      setImprove(retro.improve);
      setNextGoal(retro.nextGoal);
    }
    setEditMode(true);
  };

  const handleCancel = () => {
    if (retro) {
      setGood(retro.good);
      setImprove(retro.improve);
      setNextGoal(retro.nextGoal);
    }
    setEditMode(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => setOpen(true)}
      >
        <ClipboardList className="h-3 w-3" />
        {retro ? "회고록 보기" : "회고 작성"}
        {retro && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 ml-0.5 bg-green-100 text-green-700"
          >
            작성됨
          </Badge>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-sm flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              일정 회고록
            </SheetTitle>
            {retro && !editMode && (
              <p className="text-[11px] text-muted-foreground">
                {formatFullDate(new Date(retro.createdAt))} 작성
              </p>
            )}
          </SheetHeader>

          <div className="px-4 pb-4 space-y-4">
            {/* 잘된 점 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Smile className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-medium">잘된 점</span>
              </div>
              {editMode ? (
                <Textarea
                  value={good}
                  onChange={(e) => setGood(e.target.value)}
                  placeholder="이번 연습에서 잘 됐던 점을 적어주세요"
                  className="text-xs min-h-[80px] resize-none"
                  disabled={submitting}
                />
              ) : (
                <div className="rounded border bg-muted/30 px-3 py-2 min-h-[60px]">
                  {retro?.good ? (
                    <p className="text-xs whitespace-pre-wrap">{retro.good}</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">내용 없음</p>
                  )}
                </div>
              )}
            </div>

            {/* 개선할 점 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-xs font-medium">개선할 점</span>
              </div>
              {editMode ? (
                <Textarea
                  value={improve}
                  onChange={(e) => setImprove(e.target.value)}
                  placeholder="앞으로 개선해야 할 점을 적어주세요"
                  className="text-xs min-h-[80px] resize-none"
                  disabled={submitting}
                />
              ) : (
                <div className="rounded border bg-muted/30 px-3 py-2 min-h-[60px]">
                  {retro?.improve ? (
                    <p className="text-xs whitespace-pre-wrap">{retro.improve}</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">내용 없음</p>
                  )}
                </div>
              )}
            </div>

            {/* 다음 목표 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-medium">다음 목표</span>
              </div>
              {editMode ? (
                <Textarea
                  value={nextGoal}
                  onChange={(e) => setNextGoal(e.target.value)}
                  placeholder="다음 연습까지의 목표를 적어주세요"
                  className="text-xs min-h-[80px] resize-none"
                  disabled={submitting}
                />
              ) : (
                <div className="rounded border bg-muted/30 px-3 py-2 min-h-[60px]">
                  {retro?.nextGoal ? (
                    <p className="text-xs whitespace-pre-wrap">{retro.nextGoal}</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">내용 없음</p>
                  )}
                </div>
              )}
            </div>

            {/* 액션 버튼 영역 */}
            {editMode ? (
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={handleSave}
                  disabled={submitting}
                >
                  {submitting ? "저장 중..." : "저장"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  취소
                </Button>
              </div>
            ) : (
              canEdit && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1 flex-1"
                    onClick={handleEditStart}
                  >
                    <Pencil className="h-3 w-3" />
                    {retro ? "수정" : "작성하기"}
                  </Button>
                  {retro && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs gap-1"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-3 w-3" />
                      삭제
                    </Button>
                  )}
                </div>
              )
            )}

            {/* 멤버 안내 문구 */}
            {!canEdit && !retro && (
              <p className="text-[11px] text-muted-foreground text-center pt-2">
                아직 작성된 회고록이 없습니다
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
