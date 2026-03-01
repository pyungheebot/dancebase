/** 출석 관련 토스트 메시지 */
export const ATTENDANCE_TOAST = {
  ADDED: "출석 기록이 추가되었습니다.",
  UPDATED: "출석 기록이 수정되었습니다.",
  DELETED: "출석 기록이 삭제되었습니다.",
  ADD_ERROR: "출석 기록 추가에 실패했습니다.",
  UPDATE_ERROR: "출석 기록 수정에 실패했습니다.",
  DELETE_ERROR: "출석 기록 삭제에 실패했습니다.",
  LOAD_ERROR: "출석 기록을 불러오지 못했습니다.",
  DATA_LOAD_ERROR: "출석 데이터를 불러오지 못했습니다",
  EXPORTED: "출석 데이터를 내보냈습니다.",
  MEMBER_NAME_REQUIRED: "멤버 이름을 입력해주세요.",
  DATE_REQUIRED: "날짜를 입력해주세요.",
  SCHEDULE_LOAD_ERROR: "일정 데이터를 불러오지 못했습니다",
  STATUS_CHANGE_ERROR: "출석 상태 변경에 실패했습니다",
  CHECK_ERROR: "출석 체크에 실패했습니다",
  CHECKOUT_TIME_ERROR: "체크아웃 가능 시간이 아닙니다",
  CHECKOUT_ERROR: "종료확인에 실패했습니다",
  BATCH_ERROR: "일괄 처리에 실패했습니다",
  PROCESS_ERROR: "처리에 실패했습니다",
  GOAL_RANGE: "목표 출석률은 1~100 사이의 숫자여야 합니다",
  GOAL_SAVED: "출석 목표가 저장되었습니다",
  GOAL_SAVE_ERROR: "목표 저장에 실패했습니다",
  GOAL_DELETED: "출석 목표가 삭제되었습니다",
  GOAL_DELETE_ERROR: "목표 삭제에 실패했습니다",
  EXCUSE_REASON_REQUIRED: "결석 사유를 입력해주세요",
  EXCUSE_REASON_MIN: "사유를 5자 이상 입력해주세요",
  EXCUSE_ERROR: "면제 신청에 실패했습니다",
  EXCUSE_SUBMITTED: "면제 신청이 제출되었습니다. 리더의 승인을 기다려주세요.",
  EXCUSE_BADGE_ERROR: "처리에 실패했습니다",
  EXPORT_NO_MEMBER: "멤버 데이터가 없습니다",
  EXPORT_SCHEDULE_ERROR: "일정 데이터를 불러오지 못했습니다",
  EXPORT_ATTENDANCE_ERROR: "출석 데이터를 불러오지 못했습니다",
  EXPORT_NO_DATA: "내보낼 데이터가 없습니다",
  CSV_DOWNLOADED: "CSV 파일이 다운로드되었습니다",
} as const;

/** 출석부 토스트 메시지 */
export const ATTENDANCE_BOOK_TOAST = {
  DATE_REQUIRED: "날짜를 선택해주세요.",
  TITLE_REQUIRED: "제목을 입력해주세요.",
  NO_MEMBERS: "그룹에 멤버가 없습니다.",
  CREATED: "출석부가 생성되었습니다.",
  DELETED: "출석부가 삭제되었습니다.",
  ALL_PRESENT: "전체 출석 처리되었습니다.",
} as const;

/** 출결 예외 토스트 메시지 */
export const ATTENDANCE_EXCEPTION_TOAST = {
  MEMBER_REQUIRED: "멤버를 선택해주세요.",
  DATE_REQUIRED: "날짜를 입력해주세요.",
  REASON_REQUIRED: "사유를 입력해주세요.",
  DURATION_REQUIRED: "시간(분)은 1 이상의 숫자를 입력해주세요.",
  APPROVER_REQUIRED: "승인자 이름을 입력해주세요.",
  REGISTERED: "출결 예외가 등록되었습니다.",
  APPROVED: "출결 예외가 승인되었습니다.",
  REJECTED: "출결 예외가 거절되었습니다.",
  DELETED: "출결 예외가 삭제되었습니다.",
} as const;

/** 사유서 토스트 메시지 */
export const ATTENDANCE_EXCUSE_TOAST = {
  MEMBER_REQUIRED: "멤버 이름을 입력하세요.",
  DATE_REQUIRED: "날짜를 선택하세요.",
  REASON_REQUIRED: "상세 사유를 입력하세요.",
  SUBMITTED: "사유서가 제출되었습니다.",
  APPROVED: "사유서를 승인했습니다.",
  REJECTED: "사유서를 반려했습니다.",
  DELETED: "사유서가 삭제되었습니다.",
} as const;

/** 출석 예측 토스트 메시지 */
export const ATTENDANCE_FORECAST_TOAST = {
  SESSION_TITLE_REQUIRED: "세션 제목을 입력해주세요.",
  DATE_REQUIRED: "날짜를 선택해주세요.",
  SESSION_ADDED: "연습 세션이 추가되었습니다.",
  SESSION_DELETED: "세션이 삭제되었습니다.",
} as const;
