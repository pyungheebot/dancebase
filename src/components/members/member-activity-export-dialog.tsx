"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useMemberActivityExport } from "@/hooks/use-member-activity-export";
import type {
  MemberActivityExportPeriod,
  MemberActivityExportItems,
} from "@/types";

type MemberActivityExportDialogProps = {
  userId: string;
  memberName: string;
  /** 트리거 버튼을 외부에서 커스터마이징하고 싶을 때 사용. 없으면 기본 버튼 렌더링 */
  trigger?: React.ReactNode;
};

export function MemberActivityExportDialog({
  userId,
  memberName,
  trigger,
}: MemberActivityExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<MemberActivityExportPeriod>("all");
  const [items, setItems] = useState<MemberActivityExportItems>({
    attendance: true,
    posts: true,
    comments: true,
  });

  const { exportActivity, loading } = useMemberActivityExport();

  function toggleItem(key: keyof MemberActivityExportItems) {
    setItems((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const noneSelected = !items.attendance && !items.posts && !items.comments;

  async function handleExport() {
    await exportActivity(userId, memberName, period, items);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            <Download className="h-3 w-3" />
            활동 내보내기
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            활동 내보내기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* 대상 멤버 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">대상 멤버</span>
            <span className="text-xs font-medium">{memberName}</span>
          </div>

          <Separator />

          {/* 기간 선택 */}
          <div className="space-y-2">
            <p className="text-xs font-medium">기간 선택</p>
            <RadioGroup
              value={period}
              onValueChange={(v) => setPeriod(v as MemberActivityExportPeriod)}
              className="flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="all" id="period-all" />
                <Label htmlFor="period-all" className="text-xs cursor-pointer">
                  전체
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="last30" id="period-last30" />
                <Label htmlFor="period-last30" className="text-xs cursor-pointer">
                  최근 30일
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="last90" id="period-last90" />
                <Label htmlFor="period-last90" className="text-xs cursor-pointer">
                  최근 90일
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* 항목 선택 */}
          <div className="space-y-2">
            <p className="text-xs font-medium">내보내기 항목</p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="item-attendance"
                  checked={items.attendance}
                  onCheckedChange={() => toggleItem("attendance")}
                />
                <Label
                  htmlFor="item-attendance"
                  className="text-xs cursor-pointer"
                >
                  출석 기록 (날짜 · 일정명 · 출석상태)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="item-posts"
                  checked={items.posts}
                  onCheckedChange={() => toggleItem("posts")}
                />
                <Label
                  htmlFor="item-posts"
                  className="text-xs cursor-pointer"
                >
                  게시글 목록 (날짜 · 제목)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="item-comments"
                  checked={items.comments}
                  onCheckedChange={() => toggleItem("comments")}
                />
                <Label
                  htmlFor="item-comments"
                  className="text-xs cursor-pointer"
                >
                  댓글 목록 (날짜 · 게시글 제목)
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleExport}
            disabled={loading || noneSelected}
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                내보내는 중...
              </>
            ) : (
              <>
                <Download className="h-3 w-3" />
                CSV 내보내기
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
