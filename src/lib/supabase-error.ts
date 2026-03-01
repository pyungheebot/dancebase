type SupabaseError = {
  code?: string;
  message?: string;
  details?: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  "23505": "이미 존재하는 데이터입니다.",
  "23503": "참조된 데이터가 존재하지 않습니다.",
  "23502": "필수 항목이 누락되었습니다.",
  "42501": "권한이 없습니다.",
  "42P01": "존재하지 않는 테이블입니다.",
  "PGRST116": "데이터를 찾을 수 없습니다.",
  "PGRST301": "요청 시간이 초과되었습니다.",
  "PGRST204": "결과가 없습니다.",
};

export function getSupabaseErrorMessage(error: SupabaseError | null | undefined): string {
  if (!error) return "알 수 없는 오류가 발생했습니다.";
  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  return error.message ?? "알 수 없는 오류가 발생했습니다.";
}
