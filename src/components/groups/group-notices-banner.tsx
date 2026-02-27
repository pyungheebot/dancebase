"use client";

import { AlertTriangle, Bell, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGroupNotices } from "@/hooks/use-group-notices";
import { type GroupNotice, type NoticePriority } from "@/types";

type GroupNoticesBannerProps = {
  groupId: string;
  userId: string;
};

type PriorityStyle = {
  container: string;
  icon: string;
  title: string;
  content: string;
  closeHover: string;
  IconComponent: React.ComponentType<{ className?: string }>;
};

const PRIORITY_STYLES: Record<NoticePriority, PriorityStyle> = {
  urgent: {
    container: "bg-red-50 border border-red-200 border-l-4 border-l-red-500",
    icon: "text-red-500",
    title: "text-red-800",
    content: "text-red-700",
    closeHover: "hover:bg-red-100 text-red-400 hover:text-red-600",
    IconComponent: AlertTriangle,
  },
  important: {
    container: "bg-orange-50 border border-orange-200 border-l-4 border-l-orange-500",
    icon: "text-orange-500",
    title: "text-orange-800",
    content: "text-orange-700",
    closeHover: "hover:bg-orange-100 text-orange-400 hover:text-orange-600",
    IconComponent: Bell,
  },
  normal: {
    container: "bg-blue-50 border border-blue-200 border-l-4 border-l-blue-500",
    icon: "text-blue-500",
    title: "text-blue-800",
    content: "text-blue-700",
    closeHover: "hover:bg-blue-100 text-blue-400 hover:text-blue-600",
    IconComponent: Info,
  },
};

function NoticeBannerItem({
  notice,
  onClose,
}: {
  notice: GroupNotice;
  onClose: (id: string) => void;
}) {
  const style = PRIORITY_STYLES[notice.priority];
  const { IconComponent } = style;

  const contentPreview =
    notice.content.length > 80
      ? notice.content.slice(0, 80).trimEnd() + "..."
      : notice.content;

  return (
    <div className={`rounded-lg px-3 py-2 ${style.container}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          <IconComponent className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${style.icon}`} />
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold truncate ${style.title}`}>
              {notice.title}
            </p>
            {contentPreview && (
              <p className={`text-[11px] mt-0.5 leading-relaxed ${style.content}`}>
                {contentPreview}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 shrink-0 rounded-md ${style.closeHover}`}
          onClick={() => onClose(notice.id)}
          aria-label="공지 닫기"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function GroupNoticesBanner({ groupId, userId }: GroupNoticesBannerProps) {
  const { activeNotices, readSet, markAsRead } = useGroupNotices(groupId, userId);

  const visibleNotices = activeNotices.filter((n) => !readSet.has(n.id));

  if (visibleNotices.length === 0) return null;

  return (
    <div className="space-y-1.5 mb-3">
      {visibleNotices.map((notice) => (
        <NoticeBannerItem
          key={notice.id}
          notice={notice}
          onClose={markAsRead}
        />
      ))}
    </div>
  );
}
