import { mutate } from "swr";

/**
 * SWR 낙관적 업데이트 + 자동 롤백 헬퍼
 *
 * 동작 순서:
 * 1. 현재 SWR 캐시 스냅샷 저장
 * 2. optimisticData로 즉시 UI 업데이트 (revalidate 없이)
 * 3. serverAction 실행
 * 4. 성공 시: revalidate 옵션이 true면 서버에서 최신 데이터 재가져오기
 * 5. 실패 시: rollbackOnError가 true면 스냅샷으로 캐시 복원 후 onError 콜백 호출
 * 6. 성공 여부를 boolean으로 반환
 *
 * @param key - SWR 캐시 키 (swrKeys 팩토리 반환값)
 * @param optimisticData - 현재 캐시 데이터를 받아 즉시 보여줄 데이터를 반환하는 함수
 * @param serverAction - 실제 서버 요청 함수
 * @param options - 추가 옵션
 * @returns 서버 액션 성공 여부
 *
 * @example
 * // 좋아요 토글
 * const ok = await optimisticMutate(
 *   swrKeys.boardPostLikes(postId),
 *   (prev) => ({ ...prev, likedByMe: true, likes: [...(prev?.likes ?? []), newLike] }),
 *   () => supabase.from("board_post_likes").insert({ post_id: postId, user_id: userId }),
 *   { onError: () => toast.error("좋아요 처리에 실패했습니다.") }
 * );
 */
export async function optimisticMutate<T>(
  key: string,
  optimisticData: (current: T | undefined) => T,
  serverAction: () => Promise<unknown>,
  options?: {
    /** 성공 후 서버에서 데이터를 다시 가져올지 여부. 기본값: true */
    revalidate?: boolean;
    /** 실패 시 이전 캐시 스냅샷으로 복원할지 여부. 기본값: true */
    rollbackOnError?: boolean;
    /** 성공 콜백 */
    onSuccess?: () => void;
    /** 실패 콜백 */
    onError?: (error: unknown) => void;
  }
): Promise<boolean> {
  const {
    revalidate = true,
    rollbackOnError = true,
    onSuccess,
    onError,
  } = options ?? {};

  // 1. 현재 캐시 스냅샷 저장 (롤백용)
  // SWR의 전역 cache에서 현재 값을 읽기 위해 updater 함수 내에서 캡처
  let snapshot: T | undefined;

  // optimisticData를 적용하면서 동시에 현재 값을 스냅샷으로 저장
  await mutate<T>(
    key,
    (current: T | undefined) => {
      snapshot = current;
      return optimisticData(current);
    },
    { revalidate: false }
  );

  try {
    // 3. 서버 액션 실행
    await serverAction();

    // 4. 성공 시 처리
    if (revalidate) {
      // 서버에서 최신 데이터 재가져오기
      await mutate(key);
    }

    onSuccess?.();
    return true;
  } catch (error) {
    // 5. 실패 시 처리
    if (rollbackOnError) {
      // 스냅샷으로 캐시 복원 (재검증 없이)
      await mutate<T>(key, snapshot, { revalidate: false });
    }

    onError?.(error);
    return false;
  }
}

/**
 * 단일 타겟 엔트리 타입 — 각 항목이 독립적인 타입을 가질 수 있도록 제네릭으로 정의
 */
export type OptimisticTarget<T> = {
  key: string;
  updater: (current: T | undefined) => T;
};

/**
 * 여러 SWR 키에 대해 낙관적 업데이트를 동시에 적용하는 헬퍼
 * 단일 서버 액션으로 타입이 다른 여러 캐시를 동시에 업데이트해야 할 때 사용
 *
 * 각 타겟은 독립적인 타입을 가질 수 있으므로, 배열 원소마다 타입을 명시하거나
 * updater의 파라미터 타입으로 추론합니다.
 *
 * @example
 * // 읽음 처리 시 알림 목록(Notification[]) + 읽지 않은 카운트(number) 동시 업데이트
 * await optimisticMutateMany(
 *   [
 *     {
 *       key: swrKeys.notifications(),
 *       updater: (prev: Notification[] | undefined) =>
 *         (prev ?? []).map(n => n.id === id ? { ...n, is_read: true } : n),
 *     },
 *     {
 *       key: swrKeys.unreadNotificationCount(),
 *       updater: (prev: number | undefined) => Math.max(0, (prev ?? 0) - 1),
 *     },
 *   ] as OptimisticTarget<unknown>[],
 *   serverAction,
 *   options,
 * );
 */
export async function optimisticMutateMany(
  targets: Array<OptimisticTarget<unknown>>,
  serverAction: () => Promise<unknown>,
  options?: {
    revalidate?: boolean;
    rollbackOnError?: boolean;
    onSuccess?: () => void;
    onError?: (error: unknown) => void;
  }
): Promise<boolean> {
  const {
    revalidate = true,
    rollbackOnError = true,
    onSuccess,
    onError,
  } = options ?? {};

  // 1. 현재 캐시 스냅샷 저장
  const snapshots = new Map<string, unknown>();

  // 2. 모든 타겟에 낙관적 업데이트 적용
  await Promise.all(
    targets.map(({ key, updater }) =>
      mutate(
        key,
        (current: unknown) => {
          snapshots.set(key, current);
          return updater(current);
        },
        { revalidate: false }
      )
    )
  );

  try {
    // 3. 서버 액션 실행
    await serverAction();

    // 4. 성공 시 처리
    if (revalidate) {
      await Promise.all(targets.map(({ key }) => mutate(key)));
    }

    onSuccess?.();
    return true;
  } catch (error) {
    // 5. 실패 시 롤백
    if (rollbackOnError) {
      await Promise.all(
        targets.map(({ key }) =>
          mutate(key, snapshots.get(key), { revalidate: false })
        )
      );
    }

    onError?.(error);
    return false;
  }
}
