import { toast } from "sonner";

/**
 * 텍스트를 클립보드에 복사하는 순수 함수 (훅 외부에서 사용)
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
