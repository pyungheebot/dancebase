"use client";

import { useState, useEffect, startTransition } from "react";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEntitySettings } from "@/hooks/use-entity-settings";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  REMINDER_SETTING_KEY,
  DEFAULT_REMINDER_SETTING,
  type ReminderSettingValue,
} from "@/types";

type ReminderOption = {
  label: string;
  value: number; // 분 단위
};

const REMINDER_OPTIONS: ReminderOption[] = [
  { label: "1시간 전", value: 60 },
  { label: "3시간 전", value: 180 },
  { label: "하루 전", value: 1440 },
];

type ReminderSettingsSectionProps = {
  entityType: "group" | "project";
  entityId: string;
};

export function ReminderSettingsSection({
  entityType,
  entityId,
}: ReminderSettingsSectionProps) {
  const { value: savedValue, loading, save } = useEntitySettings<ReminderSettingValue>(
    { entityType, entityId, key: REMINDER_SETTING_KEY },
    DEFAULT_REMINDER_SETTING
  );

  const [enabled, setEnabled] = useState(false);
  const [selectedOffsets, setSelectedOffsets] = useState<number[]>([60]);
  const { pending: saving, execute } = useAsyncAction();

  // 저장된 값으로 로컬 상태 초기화
  useEffect(() => {
    if (!loading) {
      const offsets = savedValue.offsets.length > 0 ? savedValue.offsets : [60];
      startTransition(() => {
        setEnabled(savedValue.enabled);
        setSelectedOffsets(offsets);
      });
    }
  }, [loading, savedValue.enabled, savedValue.offsets]);

  const handleToggleOffset = (offset: number) => {
    setSelectedOffsets((prev) => {
      if (prev.includes(offset)) {
        // 마지막 하나는 제거하지 않음
        if (prev.length === 1) return prev;
        return prev.filter((o) => o !== offset);
      }
      return [...prev, offset];
    });
  };

  const handleSave = async () => {
    await execute(async () => {
      const { error } = await save({
        enabled,
        offsets: selectedOffsets,
      });

      if (error) {
        toast.error("알림 설정 저장에 실패했습니다");
      } else {
        toast.success("알림 설정이 저장되었습니다");
      }
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            알림 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5" />
          알림 설정
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 일정 리마인더 ON/OFF */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium">일정 리마인더</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              일정 시작 전 멤버에게 알림을 발송합니다
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {/* 시작 전 알림 시간 선택 */}
        {enabled && (
          <div className="space-y-2 pl-1">
            <p className="text-xs font-medium text-muted-foreground">시작 전 알림</p>
            <div className="space-y-2">
              {REMINDER_OPTIONS.map((option) => {
                const isChecked = selectedOffsets.includes(option.value);
                return (
                  <div key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`reminder-offset-${option.value}`}
                      checked={isChecked}
                      onCheckedChange={() => handleToggleOffset(option.value)}
                      disabled={isChecked && selectedOffsets.length === 1}
                    />
                    <Label
                      htmlFor={`reminder-offset-${option.value}`}
                      className="text-xs cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              최소 한 개 이상의 알림 시간을 선택해야 합니다
            </p>
          </div>
        )}

        {/* 저장 버튼 */}
        <Button
          size="sm"
          className="h-7 text-xs w-full"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : null}
          알림 설정 저장
        </Button>
      </CardContent>
    </Card>
  );
}
