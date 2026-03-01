"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

type PostgresEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export interface RealtimeSubscription {
  event: PostgresEvent;
  schema?: string; // 기본 "public"
  table: string;
  filter?: string; // "user_id=eq.xxx" 형태
  callback: (
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void;
}

/**
 * Supabase Realtime 구독 관리 훅
 * - 자동 구독/해제 (마운트/언마운트)
 * - 채널 이름은 channelKey 그대로 사용 (Math.random() 불필요)
 * - channelKey 또는 enabled 변경 시 이전 채널 자동 정리 후 재구독
 * - subscriptions는 ref로 최신값 유지 (리렌더 시 불필요한 재구독 방지)
 */
export function useRealtime(
  channelKey: string,
  subscriptions: RealtimeSubscription[],
  options?: {
    enabled?: boolean; // 기본 true, false면 구독 안함
  }
): void {
  const enabled = options?.enabled ?? true;

  // 현재 채널 참조 (cleanup용)
  const channelRef = useRef<RealtimeChannel | null>(null);

  // subscriptions를 ref로 유지 — 매 렌더마다 배열 참조가 바뀌어도
  // channelKey/enabled가 바뀌지 않으면 재구독하지 않음
  const subscriptionsRef = useRef(subscriptions);
  useEffect(() => {
    subscriptionsRef.current = subscriptions;
  });

  useEffect(() => {
    if (!enabled) {
      // 비활성화 시 기존 채널 정리
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const supabase = createClient();

    // 채널 생성 및 구독 등록
    let channel = supabase.channel(channelKey);

    for (const sub of subscriptionsRef.current) {
      // Supabase channel.on()은 이벤트 타입별로 오버로드가 나뉘어 있어
      // 제네릭 루프 내에서 직접 매칭이 어려우므로 unknown을 경유해 안전하게 캐스팅
      channel = (
        channel.on as (
          type: "postgres_changes",
          filter: {
            event: PostgresEvent;
            schema: string;
            table: string;
            filter?: string;
          },
          callback: (
            payload: RealtimePostgresChangesPayload<Record<string, unknown>>
          ) => void
        ) => RealtimeChannel
      )(
        "postgres_changes",
        {
          event: sub.event,
          schema: sub.schema ?? "public",
          table: sub.table,
          ...(sub.filter ? { filter: sub.filter } : {}),
        },
        sub.callback
      );
    }

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // channelKey, enabled 변경 시에만 재구독
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelKey, enabled]);
}
