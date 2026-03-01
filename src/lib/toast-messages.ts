/** 전역 토스트 메시지 상수. 일관된 사용자 피드백을 위해 사용 */
export const TOAST = {
  SAVE_SUCCESS: "저장되었습니다.",
  SAVE_ERROR: "저장에 실패했습니다.",
  UPDATE_SUCCESS: "수정되었습니다.",
  UPDATE_ERROR: "수정에 실패했습니다.",
  DELETE_SUCCESS: "삭제되었습니다.",
  DELETE_ERROR: "삭제에 실패했습니다.",
  ADD_SUCCESS: "추가되었습니다.",
  ADD_ERROR: "추가에 실패했습니다.",
  COPY_SUCCESS: "클립보드에 복사되었습니다.",
  COPY_ERROR: "복사에 실패했습니다.",
  PERMISSION_ERROR: "권한이 없습니다.",
  NETWORK_ERROR: "네트워크 오류가 발생했습니다.",
} as const;
