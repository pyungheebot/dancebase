"use client";

import {
  Calendar,
  UserCheck,
  Wallet,
  MessageSquare,
  Users,
  BellRing,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  useNotificationPreferences,
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
} from "@/hooks/use-notification-preferences";

// ============================================================
// 카테고리별 아이콘 매핑
// ============================================================

const CATEGORY_ICONS: Record<
  NotificationCategory,
  React.ComponentType<{ className?: string }>
> = {
  schedule: Calendar,
  attendance: UserCheck,
  finance: Wallet,
  board: MessageSquare,
  member: Users,
};

// ============================================================
// Props
// ============================================================

type NotificationPreferencesSectionProps = {
  groupId: string;
  userId: string | null | undefined;
};

// ============================================================
// 컴포넌트
// ============================================================

export function NotificationPreferencesSection({
  groupId,
  userId,
}: NotificationPreferencesSectionProps) {
  const {
    preferences,
    toggle,
    enableAll,
    disableAll,
    isAllEnabled,
    isAllDisabled,
  } = useNotificationPreferences(groupId, userId);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
            <BellRing className="h-3.5 w-3.5" />
            개인 알림 설정
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={enableAll}
              disabled={isAllEnabled}
            >
              모두 켜기
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={disableAll}
              disabled={isAllDisabled}
            >
              모두 끄기
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          받고 싶은 알림 유형을 선택하세요. 변경 사항은 즉시 저장됩니다.
        </p>
      </CardHeader>
      <CardContent className="space-y-1 pt-1">
        {NOTIFICATION_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.key];
          const enabled = preferences[cat.key];
          const switchId = `notif-pref-${cat.key}`;
          return (
            <div
              key={cat.key}
              className="flex items-center justify-between py-2 px-1 rounded-md hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`flex-shrink-0 rounded-md p-1.5 ${
                    enabled
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                </div>
                <div className="min-w-0">
                  <Label
                    htmlFor={switchId}
                    className="text-xs font-medium cursor-pointer leading-tight"
                  >
                    {cat.label}
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                    {cat.description}
                  </p>
                </div>
              </div>
              <Switch
                id={switchId}
                checked={enabled}
                onCheckedChange={() => toggle(cat.key)}
                className="flex-shrink-0 ml-2"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
