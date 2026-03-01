"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import type { Group } from "@/types";

type GroupDangerSectionProps = {
  group: Group;
  isGroupLeader: boolean;
  leavingGroup: boolean;
  dissolvingGroup: boolean;
  onLeaveGroup: () => void;
  onDissolveGroup: () => void;
};

export function GroupDangerSection({
  group,
  isGroupLeader,
  leavingGroup,
  dissolvingGroup,
  onLeaveGroup,
  onDissolveGroup,
}: GroupDangerSectionProps) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);
  const [dissolveNameInput, setDissolveNameInput] = useState("");

  return (
    <>
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          <span className="text-xs font-semibold text-destructive">위험 구역</span>
        </div>

        {/* 그룹 탈퇴 (일반 멤버 전용) */}
        {!isGroupLeader && (
          <div className="rounded-lg border border-destructive/30 p-3 space-y-2">
            <div>
              <p className="text-xs font-medium">그룹 탈퇴</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                그룹에서 탈퇴하면 모든 접근 권한을 잃게 됩니다.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setShowLeaveConfirm(true)}
              disabled={leavingGroup}
            >
              {leavingGroup ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              그룹 탈퇴
            </Button>
          </div>
        )}

        {/* 리더인 경우 탈퇴 불가 안내 */}
        {isGroupLeader && (
          <div className="rounded-lg border border-destructive/30 p-3 space-y-2">
            <div>
              <p className="text-xs font-medium">그룹 탈퇴</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                리더는 직접 탈퇴할 수 없습니다. 다른 멤버에게 리더 권한을 위임한 후 탈퇴하세요.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled
            >
              그룹 탈퇴 불가
            </Button>
          </div>
        )}

        {/* 그룹 해산 (리더 전용) */}
        {isGroupLeader && (
          <div className="rounded-lg border border-destructive/30 p-3 space-y-2">
            <div>
              <p className="text-xs font-medium">그룹 해산</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                그룹을 해산하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setDissolveNameInput("");
                setShowDissolveConfirm(true);
              }}
              disabled={dissolvingGroup}
            >
              {dissolvingGroup ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              그룹 해산
            </Button>
          </div>
        )}
      </div>

      {/* 그룹 탈퇴 확인 다이얼로그 */}
      <ConfirmDialog
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        title="그룹 탈퇴"
        description="정말 이 그룹을 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={onLeaveGroup}
        destructive
      />

      {/* 그룹 해산 확인 다이얼로그 */}
      <AlertDialog open={showDissolveConfirm} onOpenChange={setShowDissolveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>그룹 해산</AlertDialogTitle>
            <AlertDialogDescription>
              정말 이 그룹을 해산하시겠습니까? 모든 데이터가 삭제되며 되돌릴 수 없습니다.
              <br />
              확인을 위해 아래에 그룹 이름 <strong>&quot;{group?.name}&quot;</strong>을 입력하세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 pb-2">
            <Input
              placeholder={group?.name ?? "그룹 이름"}
              value={dissolveNameInput}
              onChange={(e) => setDissolveNameInput(e.target.value)}
              className="text-sm"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDissolveNameInput("")}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDissolveGroup}
              disabled={dissolveNameInput !== group?.name || dissolvingGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {dissolvingGroup ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              해산
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
