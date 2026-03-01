"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";
import { ShareButton } from "@/components/shared/share-button";
import type { Group } from "@/types";

type GroupInviteSectionProps = {
  group: Group;
  inviteCodeEnabled: boolean;
  inviteCodeExpiry: string;
  regenerating: boolean;
  savingInviteSettings: boolean;
  onInviteCodeEnabledChange: (enabled: boolean) => void;
  onInviteCodeExpiryChange: (expiry: string) => void;
  onRegenerate: () => void;
  onSaveInviteSettings: () => void;
};

export function GroupInviteSection({
  group,
  inviteCodeEnabled,
  inviteCodeExpiry,
  regenerating,
  savingInviteSettings,
  onInviteCodeEnabledChange,
  onInviteCodeExpiryChange,
  onRegenerate,
  onSaveInviteSettings,
}: GroupInviteSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-semibold">초대 코드</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            value={inviteCodeEnabled ? group.invite_code : "비활성화됨"}
            readOnly
            className={`font-mono ${!inviteCodeEnabled ? "text-muted-foreground" : ""}`}
          />
          <Button
            variant="outline"
            onClick={onRegenerate}
            disabled={regenerating}
          >
            {regenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">재생성</span>
          </Button>
          {inviteCodeEnabled && (
            <ShareButton
              title={`${group.name} 그룹 초대`}
              text={`DanceBase에서 "${group.name}" 그룹에 참여하세요!`}
              url={`${typeof window !== "undefined" ? window.location.origin : ""}/join/${group.invite_code}`}
              label="초대 공유"
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          재생성하면 기존 초대 코드는 무효화되며 만료일이 초기화됩니다
        </p>

        <Separator />

        {/* 활성화/비활성화 토글 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">초대 코드 활성화</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              비활성화하면 기존 코드로 참여할 수 없습니다
            </p>
          </div>
          <Switch
            checked={inviteCodeEnabled}
            onCheckedChange={onInviteCodeEnabledChange}
          />
        </div>

        {!inviteCodeEnabled && (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-[11px] text-yellow-700 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300">
            초대 코드가 비활성화되어 있습니다. 멤버 초대를 원하면 활성화하세요.
          </div>
        )}

        {/* 만료일 설정 */}
        <div className="space-y-1.5">
          <Label className="text-xs">만료 기간 설정</Label>
          <Select
            value={inviteCodeExpiry}
            onValueChange={onInviteCodeExpiryChange}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="만료 기간 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">만료 없음</SelectItem>
              <SelectItem value="1" className="text-xs">1일 후 만료</SelectItem>
              <SelectItem value="7" className="text-xs">7일 후 만료</SelectItem>
              <SelectItem value="30" className="text-xs">30일 후 만료</SelectItem>
            </SelectContent>
          </Select>
          {inviteCodeExpiry !== "none" && (
            <p className="text-[11px] text-muted-foreground">
              저장 시점부터 {inviteCodeExpiry}일 후에 초대 코드가 만료됩니다
            </p>
          )}
        </div>

        <Button
          size="sm"
          className="h-7 text-xs w-full"
          onClick={onSaveInviteSettings}
          disabled={savingInviteSettings}
        >
          {savingInviteSettings ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : null}
          초대 코드 설정 저장
        </Button>
      </CardContent>
    </Card>
  );
}
