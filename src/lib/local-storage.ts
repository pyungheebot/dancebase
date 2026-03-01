/**
 * localStorage에서 JSON 파싱하여 값을 읽음 (SSR 안전)
 * @param key - localStorage 키
 * @param defaultValue - 값이 없거나 파싱 실패 시 반환할 기본값
 * @returns 파싱된 값 또는 기본값
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 값을 JSON 직렬화하여 localStorage에 저장 (SSR 안전)
 * @param key - localStorage 키
 * @param value - 저장할 값 (JSON 직렬화 가능한 타입)
 */
export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 스토리지 용량 초과 등 무시
  }
}

/**
 * localStorage에서 특정 키의 값을 삭제 (SSR 안전)
 * @param key - 삭제할 localStorage 키
 */
export function removeFromStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // 무시
  }
}
