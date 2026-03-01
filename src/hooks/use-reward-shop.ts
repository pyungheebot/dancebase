"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RewardShopData, RewardShopItem, RewardExchangeRecord } from "@/types";

// ============================================
// 포인트 규칙
// ============================================
export const REWARD_SHOP_POINT_RULES = {
  attendance: 10,       // 출석 1회
  late: 5,              // 지각 1회
  post: 15,             // 게시글 작성
  comment: 5,           // 댓글 작성
  weeklyChallenge: 20,  // 주간 챌린지 완료
} as const;

export const REWARD_SHOP_POINT_LABELS: Record<keyof typeof REWARD_SHOP_POINT_RULES, string> = {
  attendance: "출석",
  late: "지각",
  post: "게시글 작성",
  comment: "댓글 작성",
  weeklyChallenge: "주간 챌린지 완료",
};

// ============================================
// localStorage 헬퍼
// ============================================
function getStorageKey(groupId: string): string {
  return `dancebase:reward-shop:${groupId}`;
}

function loadShopData(groupId: string): RewardShopData {
  if (typeof window === "undefined") return { items: [], exchanges: [] };
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return { items: [], exchanges: [] };
    const parsed = JSON.parse(raw) as Partial<RewardShopData>;
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      exchanges: Array.isArray(parsed.exchanges) ? parsed.exchanges : [],
    };
  } catch {
    return { items: [], exchanges: [] };
  }
}

function saveShopData(groupId: string, data: RewardShopData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(data));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ============================================
// 포인트 트랜잭션 스토리지 (기존 REWARD_SHOP_POINT_RULES 기반 적립)
// ============================================
type PointEntry = {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  createdAt: string;
};

function getTxKey(groupId: string): string {
  return `dancebase:reward-shop-tx:${groupId}`;
}

function loadTxList(groupId: string): PointEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getTxKey(groupId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PointEntry[]) : [];
  } catch {
    return [];
  }
}

function saveTxList(groupId: string, list: PointEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getTxKey(groupId), JSON.stringify(list));
  } catch {
    // 무시
  }
}

// ============================================
// 메인 훅
// ============================================
export function useRewardShop(groupId: string) {
  const [shopData, setShopData] = useState<RewardShopData>(() => loadShopData(groupId));
  const [txList, setTxList] = useState<PointEntry[]>(() => loadTxList(groupId));
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");

  // 마운트 시 현재 유저 로드
  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return;
      setCurrentUserId(user.id);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      const profile = profileData as { name?: string } | null;
      if (profile?.name) setCurrentUserName(profile.name);
    };
    fetchUser();
  }, [groupId]);

  // ---- 포인트 잔액 계산 ----

  const getBalance = useCallback(
    (userId: string): number => {
      const allTx = loadTxList(groupId);
      const earned = allTx
        .filter((t) => t.userId === userId)
        .reduce((sum, t) => sum + t.amount, 0);

      const shopDataNow = loadShopData(groupId);
      const spent = shopDataNow.exchanges
        .filter((e) => e.userId === userId)
        .reduce((sum, e) => sum + e.pointsSpent, 0);

      return earned - spent;
    },
    [groupId]
  );

  const myBalance = currentUserId ? getBalance(currentUserId) : 0;

  // ---- 포인트 적립 ----

  const earnPoints = useCallback(
    (userId: string, type: keyof typeof REWARD_SHOP_POINT_RULES) => {
      const amount = REWARD_SHOP_POINT_RULES[type];
      const reason = REWARD_SHOP_POINT_LABELS[type];
      const allTx = loadTxList(groupId);
      const newEntry: PointEntry = {
        id: crypto.randomUUID(),
        userId,
        amount,
        reason,
        createdAt: new Date().toISOString(),
      };
      const updated = [...allTx, newEntry];
      saveTxList(groupId, updated);
      setTxList(updated);
    },
    [groupId]
  );

  const getMyTransactions = useCallback((): PointEntry[] => {
    if (!currentUserId) return [];
    return loadTxList(groupId)
      .filter((t) => t.userId === currentUserId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [groupId, currentUserId]);

  // ---- 아이템 관리 (리더 전용) ----

  const addItem = useCallback(
    (params: Omit<RewardShopItem, "id" | "createdAt">) => {
      const data = loadShopData(groupId);
      const newItem: RewardShopItem = {
        ...params,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const updated: RewardShopData = { ...data, items: [...data.items, newItem] };
      saveShopData(groupId, updated);
      setShopData(updated);
    },
    [groupId]
  );

  const updateItem = useCallback(
    (id: string, params: Partial<Omit<RewardShopItem, "id" | "createdAt">>) => {
      const data = loadShopData(groupId);
      const updated: RewardShopData = {
        ...data,
        items: data.items.map((item) =>
          item.id === id ? { ...item, ...params } : item
        ),
      };
      saveShopData(groupId, updated);
      setShopData(updated);
    },
    [groupId]
  );

  const deleteItem = useCallback(
    (id: string) => {
      const data = loadShopData(groupId);
      const updated: RewardShopData = {
        ...data,
        items: data.items.filter((item) => item.id !== id),
      };
      saveShopData(groupId, updated);
      setShopData(updated);
    },
    [groupId]
  );

  // ---- 아이템 교환 ----

  const exchangeItem = useCallback(
    (itemId: string): { success: boolean; message: string } => {
      if (!currentUserId || !currentUserName) {
        return { success: false, message: "로그인이 필요합니다" };
      }

      const data = loadShopData(groupId);
      const item = data.items.find((i) => i.id === itemId);
      if (!item) return { success: false, message: "아이템을 찾을 수 없습니다" };

      // 품절 체크 (quantity >= 0이고 남은 수량 확인)
      if (item.quantity !== -1) {
        const exchangedCount = data.exchanges.filter((e) => e.itemId === itemId).length;
        if (exchangedCount >= item.quantity) {
          return { success: false, message: "품절된 아이템입니다" };
        }
      }

      // 포인트 잔액 체크
      const balance = getBalance(currentUserId);
      if (balance < item.pointCost) {
        const diff = item.pointCost - balance;
        return { success: false, message: `포인트가 ${diff}점 부족합니다` };
      }

      // 교환 이력 추가
      const newExchange: RewardExchangeRecord = {
        id: crypto.randomUUID(),
        userId: currentUserId,
        userName: currentUserName,
        itemId: item.id,
        itemName: item.name,
        pointsSpent: item.pointCost,
        exchangedAt: new Date().toISOString(),
      };
      const updated: RewardShopData = {
        ...data,
        exchanges: [newExchange, ...data.exchanges],
      };
      saveShopData(groupId, updated);
      setShopData(updated);

      return { success: true, message: `${item.name} 교환이 완료되었습니다` };
    },
    [groupId, currentUserId, currentUserName, getBalance]
  );

  // ---- 아이템별 잔여 수량 계산 ----

  const getRemainingQuantity = useCallback(
    (item: RewardShopItem): number => {
      if (item.quantity === -1) return -1;
      const exchangedCount = shopData.exchanges.filter(
        (e) => e.itemId === item.id
      ).length;
      return Math.max(0, item.quantity - exchangedCount);
    },
    [shopData.exchanges]
  );

  // ---- 최근 교환 이력 (최대 10건) ----

  const recentExchanges = shopData.exchanges.slice(0, 10);

  // ---- 내 교환 이력 ----

  const myExchanges = currentUserId
    ? shopData.exchanges.filter((e) => e.userId === currentUserId)
    : [];

  return {
    loading: false,
    currentUserId,
    currentUserName,
    // 상점 데이터
    items: shopData.items,
    exchanges: shopData.exchanges,
    recentExchanges,
    myExchanges,
    // 포인트
    myBalance,
    getBalance,
    earnPoints,
    getMyTransactions,
    // 아이템 관리
    addItem,
    updateItem,
    deleteItem,
    exchangeItem,
    getRemainingQuantity,
  };
}
