import { toast } from "sonner";

/**
 * 텍스트를 클립보드에 복사하는 순수 함수 (훅 외부에서 사용)
 * React 훅이 필요 없는 이벤트 핸들러나 유틸리티 함수에서 직접 호출할 때 사용
 * @param text - 클립보드에 복사할 텍스트
 * @param successMessage - 복사 성공 시 표시할 토스트 메시지 (null 전달 시 토스트 비활성화, 기본값: "복사되었습니다")
 * @param errorMessage - 복사 실패 시 표시할 토스트 메시지 (null 전달 시 토스트 비활성화, 기본값: "복사에 실패했습니다")
 * @returns 복사 성공 여부 (성공: true, 실패: false)
 * @example
 * await copyToClipboard("https://example.com");
 * await copyToClipboard(token, null, null); // 토스트 없이 복사만
 */
export async function copyToClipboard(
  text: string,
  successMessage?: string | null,
  errorMessage?: string | null
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    if (successMessage !== null) {
      toast.success(successMessage ?? "복사되었습니다");
    }
    return true;
  } catch {
    if (errorMessage !== null) {
      toast.error(errorMessage ?? "복사에 실패했습니다");
    }
    return false;
  }
}
