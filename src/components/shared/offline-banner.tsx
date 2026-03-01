"use client";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useEffect, useRef } from "react";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";

export function OfflineBanner() {
  const online = useNetworkStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      toast.success("연결이 복구되었습니다");
    }
  }, [online]);

  if (online) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 text-center text-sm py-2 px-4 flex items-center justify-center gap-2"
    >
      <WifiOff className="h-4 w-4" />
      인터넷 연결이 끊겼습니다. 일부 기능이 제한될 수 있습니다.
    </div>
  );
}
