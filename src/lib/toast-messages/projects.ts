/** 프로젝트/공연 관련 토스트 메시지 */

/** 챌린지 */
export const CHALLENGE_TOAST = {
  CREATED: "챌린지가 생성되었습니다.",
  DELETED: "챌린지가 삭제되었습니다.",
  CREATED_NO_DOT: "챌린지가 생성되었습니다",
  DELETED_NO_DOT: "챌린지가 삭제되었습니다",
  UPDATED: "챌린지가 수정되었습니다",
  COMPLETED: "챌린지를 완료했습니다!",
  NOT_FOUND: "챌린지를 찾을 수 없습니다.",
  TITLE_REQUIRED: "챌린지 제목을 입력해주세요.",
  CREATE_ERROR: "챌린지 생성에 실패했습니다.",
  CREATE_ERROR_NO_DOT: "챌린지 생성에 실패했습니다",
  DELETE_ERROR: "챌린지 삭제에 실패했습니다.",
  DELETE_ERROR_NO_DOT: "챌린지 삭제에 실패했습니다",
  JOIN_ERROR: "챌린지 참여에 실패했습니다.",
  TASK_COMPLETED: "과제 완료!",
} as const;

/** 도전 과제 */
export const MISSION_TOAST = {
  CREATED: "도전 과제가 생성되었습니다.",
  UPDATED: "도전 과제가 수정되었습니다.",
  DELETED: "도전 과제가 삭제되었습니다.",
  COMPLETED: "도전 과제를 완료했습니다!",
  COMPLETE_PROCESSED: "도전 과제가 완료 처리되었습니다.",
  NOT_FOUND: "도전 과제를 찾을 수 없습니다.",
  TITLE_REQUIRED: "도전 과제 제목을 입력해주세요.",
  CREATE_ERROR: "도전 과제 생성에 실패했습니다.",
  UPDATE_ERROR: "도전 과제 수정에 실패했습니다.",
  DELETE_ERROR: "도전 과제 삭제에 실패했습니다.",
  COMPLETE_ERROR: "완료 처리에 실패했습니다.",
} as const;

/** 평가 */
export const EVALUATION_TOAST = {
  SESSION_CREATED: "평가 세션이 생성되었습니다.",
  SESSION_UPDATED: "평가 세션이 수정되었습니다.",
  SESSION_DELETED: "평가 세션이 삭제되었습니다.",
  SESSION_NOT_FOUND: "평가 세션을 찾을 수 없습니다.",
  SESSION_TITLE_REQUIRED: "평가 세션 제목을 입력해주세요.",
  SESSION_CREATE_ERROR: "평가 세션 생성에 실패했습니다.",
  SESSION_UPDATE_ERROR: "평가 세션 수정에 실패했습니다.",
  SESSION_DELETE_ERROR: "평가 세션 삭제에 실패했습니다.",
  EVALUATOR_REQUIRED: "평가자를 입력해주세요.",
  DATE_REQUIRED: "평가 날짜를 입력해주세요.",
  CRITERIA_REQUIRED: "평가 기준을 하나 이상 추가해주세요.",
  CRITERIA_NAME_REQUIRED: "기준 이름을 입력해주세요.",
  CRITERIA_ADD_ERROR: "기준 추가에 실패했습니다.",
  CRITERIA_DELETE_ERROR: "기준 삭제에 실패했습니다.",
  MAX_SCORE_REQUIRED: "최대 점수는 1 이상이어야 합니다.",
  RESULT_DELETED: "평가 결과가 삭제되었습니다.",
  RESULT_DELETE_ERROR: "평가 결과 삭제에 실패했습니다.",
  SAVE_ERROR: "평가 저장에 실패했습니다.",
} as const;

/** 스트레칭 루틴 */
export const ROUTINE_TOAST = {
  ADDED: "루틴이 추가되었습니다.",
  UPDATED: "루틴이 수정되었습니다.",
  DELETED: "루틴이 삭제되었습니다.",
  NOT_FOUND: "루틴을 찾을 수 없습니다.",
  SELECT_REQUIRED: "루틴을 선택해주세요.",
  NAME_REQUIRED: "루틴 이름을 입력해주세요.",
  ADD_ERROR: "루틴 추가에 실패했습니다.",
  UPDATE_ERROR: "루틴 수정에 실패했습니다.",
  DELETE_ERROR: "루틴 삭제에 실패했습니다.",
} as const;

/** 운동 */
export const EXERCISE_TOAST = {
  ADDED: "운동이 추가되었습니다.",
  UPDATED: "운동이 수정되었습니다.",
  DELETED: "운동이 삭제되었습니다.",
  NOT_FOUND: "운동을 찾을 수 없습니다.",
  NAME_REQUIRED: "운동 이름을 입력해주세요.",
  ADD_ERROR: "운동 추가에 실패했습니다.",
  UPDATE_ERROR: "운동 수정에 실패했습니다.",
  DELETE_ERROR: "운동 삭제에 실패했습니다.",
  HOLD_TIME_REQUIRED: "유지 시간을 1초 이상으로 입력해주세요.",
  SET_COUNT_REQUIRED: "세트 수를 1 이상으로 입력해주세요.",
  FLEXIBILITY_RANGE: "유연성 평가는 1~5 사이로 입력해주세요.",
  LOG_SAVED: "운동 기록이 저장되었습니다.",
  LOG_DELETED: "운동 기록이 삭제되었습니다.",
  LOG_SAVE_ERROR: "운동 기록 저장에 실패했습니다.",
  LOG_DELETE_ERROR: "운동 기록 삭제에 실패했습니다.",
  DATE_REQUIRED: "날짜를 입력해주세요.",
} as const;

/** 포토콜 */
export const PHOTO_CALL_TOAST = {
  ADDED: "포토콜 항목이 추가되었습니다",
  UPDATED: "항목이 수정되었습니다",
  DELETED: "항목이 삭제되었습니다",
  NOT_FOUND: "항목을 찾을 수 없습니다",
  TYPE_REQUIRED: "촬영 유형을 선택해주세요",
} as const;

/** 촬영 계획 */
export const PHOTO_SHOOT_TOAST = {
  ADDED: "촬영 계획이 추가되었습니다",
  UPDATED: "촬영 계획이 수정되었습니다",
  DELETED: "촬영 계획이 삭제되었습니다",
  NOT_FOUND: "촬영 계획을 찾을 수 없습니다",
  TITLE_REQUIRED: "촬영 계획 제목을 입력해주세요",
  ASSIGNEE_UPDATED: "촬영 담당자가 업데이트되었습니다",
} as const;

/** 관객 */
export const AUDIENCE_TOAST = {
  ADDED: "관객 수가 추가되었습니다",
  UPDATED: "항목이 수정되었습니다",
  DELETED: "항목이 삭제되었습니다",
  NOT_FOUND: "항목을 찾을 수 없습니다",
  DATE_REQUIRED: "공연 날짜를 입력해주세요",
  SEAT_REQUIRED: "총 좌석 수는 1 이상이어야 합니다",
  COUNT_REQUIRED: "관객 수는 0 이상이어야 합니다",
  PERFORMANCE_DATE_REQUIRED: "공연 날짜를 입력해주세요.",
} as const;

/** 동선 노트 */
export const BLOCKING_TOAST = {
  ADDED: "동선 노트가 추가되었습니다",
  UPDATED: "동선 노트가 수정되었습니다",
  DELETED: "동선 노트가 삭제되었습니다",
  SECTION_TITLE_REQUIRED: "섹션 제목을 입력해주세요",
  SECTION_NOT_FOUND: "섹션을 찾을 수 없습니다",
  NOTE_NOT_FOUND: "노트를 찾을 수 없습니다",
} as const;

/** 소품 */
export const PROP_TOAST = {
  ADDED: "소품이 추가되었습니다",
  UPDATED: "소품이 수정되었습니다",
  DELETED: "소품이 삭제되었습니다",
  NOT_FOUND: "소품을 찾을 수 없습니다",
  NAME_REQUIRED: "소품 이름을 입력해주세요",
  QUANTITY_REQUIRED: "수량은 1 이상이어야 합니다",
} as const;

/** 의상 변경 */
export const COSTUME_CHANGE_TOAST = {
  ADDED: "의상 변경 항목이 추가되었습니다",
  UPDATED: "의상 변경 항목이 수정되었습니다",
  DELETED: "의상 변경 항목이 삭제되었습니다",
} as const;

/** 인터콤/통신 */
export const INTERCOM_TOAST = {
  ADDED: "채널이 추가되었습니다",
  UPDATED: "채널이 수정되었습니다",
  DELETED: "채널이 삭제되었습니다",
  NOT_FOUND: "채널을 찾을 수 없습니다",
  NAME_REQUIRED: "채널명을 입력해주세요",
  FREQ_REQUIRED: "주파수/채널 번호를 입력해주세요",
  SEND_ERROR: "메시지 발송에 실패했습니다",
} as const;

/** 스태프콜 */
export const STAFF_CALL_TOAST = {
  ADDED: "스태프가 추가되었습니다",
  NAME_REQUIRED: "스태프 이름을 입력해주세요",
  CALL_TIME_REQUIRED: "콜 시간을 입력해주세요",
  PARTICIPANT_NAME_REQUIRED: "참여자 이름을 입력해주세요",
  PARTICIPANT_ADDED: "인원이 추가되었습니다",
  PARTICIPANT_DELETED: "인원이 삭제되었습니다",
} as const;

/** 입장 게이트 */
export const ENTRANCE_TOAST = {
  ADDED: "게이트가 추가되었습니다",
  UPDATED: "게이트가 수정되었습니다",
  DELETED: "게이트가 삭제되었습니다",
  NOT_FOUND: "게이트를 찾을 수 없습니다",
  NAME_REQUIRED: "게이트 이름을 입력해주세요",
  NUMBER_REQUIRED: "게이트 번호는 1 이상이어야 합니다",
  RESET: "카운트가 초기화되었습니다",
  RESET_ALL: "모든 게이트 카운트가 초기화되었습니다",
  ALLOW_TYPE_REQUIRED: "허용 입장 유형을 하나 이상 선택해주세요",
} as const;

/** 쇼 타임라인 */
export const SHOW_TIMELINE_TOAST = {
  EVENT_ADDED: "이벤트가 추가되었습니다",
  EVENT_ADDED_DOT: "이벤트가 추가되었습니다.",
  EVENT_UPDATED: "이벤트가 수정되었습니다",
  EVENT_UPDATED_DOT: "이벤트가 수정되었습니다.",
  EVENT_DELETED: "이벤트가 삭제되었습니다",
  EVENT_DELETED_DOT: "이벤트가 삭제되었습니다.",
  EVENT_REGISTERED: "이벤트가 등록되었습니다.",
  EVENT_TITLE_REQUIRED: "이벤트 제목을 입력해주세요",
  EVENT_TITLE_REQUIRED_DOT: "이벤트 제목을 입력해주세요.",
  EVENT_DATE_REQUIRED: "이벤트 날짜를 입력해주세요.",
  EVENT_NOT_FOUND: "이벤트를 찾을 수 없습니다",
  EVENT_NOT_FOUND_DOT: "이벤트를 찾을 수 없습니다.",
  EVENT_ADD_ERROR: "이벤트 추가에 실패했습니다.",
  EVENT_UPDATE_ERROR: "이벤트 수정에 실패했습니다.",
  EVENT_DELETE_ERROR: "이벤트 삭제에 실패했습니다.",
} as const;

/** 공연장/장소 */
export const VENUE_TOAST = {
  ADDED: "공연장이 추가되었습니다",
  UPDATED: "공연장 정보가 수정되었습니다",
  DELETED: "공연장이 삭제되었습니다",
  NOT_FOUND: "공연장을 찾을 수 없습니다",
  NAME_REQUIRED: "공연장 이름을 입력해주세요",
} as const;

/** 곡 */
export const SONG_TOAST = {
  ADDED: "곡이 추가되었습니다",
  DELETED: "곡이 삭제되었습니다",
  TITLE_REQUIRED: "곡 제목을 입력해주세요",
  ADD_ERROR: "곡 추가에 실패했습니다",
} as const;

/** 파트 */
export const PART_TOAST = {
  ASSIGNED: "파트가 배정되었습니다",
  UPDATED: "파트가 수정되었습니다",
  DELETED: "파트가 삭제되었습니다",
  ASSIGN_ERROR: "파트 배정에 실패했습니다",
  UPDATE_ERROR: "파트 수정에 실패했습니다",
  DELETE_ERROR: "파트 삭제에 실패했습니다",
  DUPLICATE: "해당 멤버에게 이미 같은 파트 타입이 배정되어 있습니다",
} as const;

/** 곡 노트 */
export const SONG_NOTES_TOAST = {
  TRACK_ADDED: "트랙이 추가되었습니다",
  TRACK_UPDATED: "트랙이 수정되었습니다",
  TRACK_DELETED: "트랙이 삭제되었습니다",
  TRACK_NOT_FOUND: "트랙을 찾을 수 없습니다",
  TRACK_TITLE_REQUIRED: "트랙 제목을 입력해주세요",
} as const;

/** 장비/체크리스트 */
export const EQUIPMENT_TOAST = {
  CHECKLIST_CREATED: "체크리스트 기록이 생성되었습니다",
  CHECK_ADDED: "체크 항목이 추가되었습니다.",
  CHECK_DELETED: "체크 항목이 삭제되었습니다.",
  ALL_CHECK_REQUIRED: "모든 항목을 체크한 후 완료할 수 있습니다.",
} as const;

/** 의사결정 */
export const DECISION_TOAST = {
  CREATED: "의사결정이 기록되었습니다.",
  DELETED: "의사결정 기록이 삭제되었습니다.",
  DECIDER_REQUIRED: "결정자를 입력해주세요.",
} as const;

/** 기여 */
export const CONTRIBUTION_TOAST = {
  DELETED: "기여 기록이 삭제되었습니다.",
  ADD_ERROR: "기여 기록 추가에 실패했습니다.",
  DELETE_ERROR: "기여 기록 삭제에 실패했습니다.",
  GIVER_REQUIRED: "부여자를 입력해주세요",
  GIVER_NAME_REQUIRED: "부여자 이름을 입력해주세요.",
  POINTS_REQUIRED: "포인트를 입력해주세요 (0 제외)",
  POINTS_RANGE: "포인트는 1~10 사이여야 합니다.",
} as const;

/** 게스트 강사 */
export const INSTRUCTOR_TOAST = {
  CREATED: "강사가 등록되었습니다",
  UPDATED: "강사 정보가 수정되었습니다",
  DELETED: "강사가 삭제되었습니다",
  NOT_FOUND: "강사 정보를 찾을 수 없습니다",
  NAME_REQUIRED: "강사 이름을 입력해주세요",
  CLASS_ADDED: "수업 이력이 추가되었습니다",
  CLASS_DELETED: "수업 이력이 삭제되었습니다",
  CLASS_TOPIC_REQUIRED: "수업 주제를 입력해주세요",
  CLASS_DATE_REQUIRED: "수업 날짜를 선택해주세요",
} as const;

/** 보도자료 */
export const PRESS_TOAST = {
  ADDED: "보도자료가 추가되었습니다",
  UPDATED: "보도자료가 수정되었습니다",
  DELETED: "보도자료가 삭제되었습니다",
  NOT_FOUND: "보도자료를 찾을 수 없습니다",
  TITLE_REQUIRED: "보도자료 제목을 입력해주세요",
  MEDIA_REQUIRED: "매체명을 입력해주세요",
  MEDIA_ADDED: "매체가 추가되었습니다",
  MEDIA_DELETED: "매체가 삭제되었습니다",
} as const;

/** 성과 */
export const PERFORMANCE_RECORD_TOAST = {
  CREATED: "성과가 기록되었습니다",
  UPDATED: "성과가 수정되었습니다",
  DELETED: "성과 기록이 삭제되었습니다",
  ADD_ERROR: "성과 기록 추가에 실패했습니다",
  UPDATE_ERROR: "성과 기록 수정에 실패했습니다",
  DELETE_ERROR: "성과 기록 삭제에 실패했습니다",
} as const;

/** 공연 */
export const PERFORMANCE_TOAST = {
  NAME_REQUIRED: "공연명을 입력해주세요.",
  DATE_REQUIRED: "공연 날짜를 입력해주세요.",
  DATE_REQUIRED_NO_DOT: "공연 날짜를 입력해주세요",
} as const;

/** 감사편지 */
export const THANK_YOU_TOAST = {
  ADDED: "감사편지가 추가되었습니다",
  UPDATED: "감사편지가 수정되었습니다",
  DELETED: "감사편지가 삭제되었습니다",
  CONTENT_REQUIRED: "감사편지 내용을 입력해주세요",
  SENT: "발송 완료로 표시되었습니다",
  SPONSOR_REQUIRED: "후원사명을 입력해주세요",
} as const;

/** 케이터링 */
export const CATERING_TOAST = {
  TIME_REQUIRED: "식사 시간을 입력하세요.",
  MENU_REQUIRED: "메뉴 설명을 입력하세요.",
  HEADCOUNT_REQUIRED: "인원 수는 1명 이상이어야 합니다.",
  ITEM_ADDED: "케이터링 항목이 추가되었습니다.",
  ITEM_UPDATED: "케이터링 항목이 수정되었습니다.",
} as const;

/** 영상 피드백 */
export const VIDEO_FEEDBACK_TOAST = {
  TITLE_REQUIRED: "영상 제목을 입력해주세요.",
  URL_REQUIRED: "영상 URL을 입력해주세요.",
  ADDED: "영상이 추가되었습니다.",
  TIMESTAMP_REQUIRED: "타임스탬프를 입력해주세요.",
  TIMESTAMP_FORMAT: '타임스탬프는 "MM:SS" 형식으로 입력해주세요. (예: 01:30)',
  AUTHOR_REQUIRED: "작성자 이름을 입력해주세요.",
  COMMENT_REQUIRED: "코멘트 내용을 입력해주세요.",
  COMMENT_ADDED: "코멘트가 추가되었습니다.",
} as const;

/** 티켓 */
export const TICKET_TOAST = {
  GRADE_NAME_REQUIRED: "등급 이름을 입력해주세요.",
  GRADE_PRICE_REQUIRED: "올바른 가격을 입력해주세요.",
  QUANTITY_REQUIRED: "수량은 1 이상이어야 합니다.",
  GRADE_SELECT_REQUIRED: "등급을 선택해주세요.",
  RECIPIENT_REQUIRED: "수령인 이름을 입력해주세요.",
  TARGET_QUANTITY_REQUIRED: "올바른 목표 수량을 입력해주세요.",
  GRADE_DELETED: "등급이 삭제되었습니다.",
  CANCELLED: "취소 처리되었습니다.",
  ALLOCATION_DELETED: "배분이 삭제되었습니다.",
  GRADE_UPDATED: "등급이 수정되었습니다.",
  GRADE_ADDED: "등급이 추가되었습니다.",
  ALLOCATION_UPDATED: "배분이 수정되었습니다.",
  ALLOCATION_ADDED: "배분이 추가되었습니다.",
  TIER_DUPLICATE: "이미 동일한 유형의 티어가 존재합니다.",
  TIER_PRICE_REQUIRED: "가격은 0 이상의 숫자를 입력해주세요.",
  TIER_SEAT_REQUIRED: "총 좌석 수는 1 이상의 숫자를 입력해주세요.",
  TIER_ADDED: "티어가 추가되었습니다.",
  TIER_ADD_REQUIRED: "먼저 티어를 추가해주세요.",
  SALES_ADDED: "판매 기록이 추가되었습니다.",
  TIER_DELETED: "티어가 삭제되었습니다.",
  SALES_DELETED: "판매 기록이 삭제되었습니다.",
  GRADE_NAME_REQUIRED_NO_DOT: "등급명을 입력해주세요.",
  BUYER_REQUIRED: "구매자명을 입력해주세요.",
} as const;

/** 대형 편집기 */
export const FORMATION_EDITOR_TOAST = {
  MEMBER_REQUIRED: "멤버 이름을 입력하세요.",
  SECTION_REQUIRED: "구간 이름을 입력하세요.",
  SECTION_MAX: "구간은 최대 10개까지 추가할 수 있습니다.",
  MEMBER_REMOVED: "멤버가 무대에서 제거되었습니다.",
  NO_PREV_SECTION: "이전 구간이 없습니다.",
  COPY_SUCCESS: "이전 구간의 대형을 복사했습니다.",
  COPY_ERROR: "복사에 실패했습니다.",
  DUPLICATE_MEMBER: "은(는) 이미 이 구간에 추가되어 있습니다.",
} as const;

/** 마케팅 캠페인 */
export const CAMPAIGN_TOAST = {
  TASK_TITLE_REQUIRED: "태스크 제목을 입력해주세요.",
  NAME_REQUIRED: "캠페인 이름을 입력해주세요.",
  TASK_ADDED: "태스크가 추가되었습니다.",
  TASK_UPDATED: "태스크가 수정되었습니다.",
  TASK_DELETED: "태스크가 삭제되었습니다.",
  INFO_SAVED: "캠페인 정보가 저장되었습니다.",
} as const;

/** 무대 안전 */
export const STAGE_SAFETY_TOAST = {
  CHECK_CONTENT_REQUIRED: "점검 내용을 입력해주세요.",
  CHECK_ITEM_ADDED: "점검 항목이 추가되었습니다.",
  CHECK_TITLE_REQUIRED: "점검 제목을 입력해주세요.",
  CHECK_DATE_REQUIRED: "점검 일자를 선택해주세요.",
  CHECK_CREATED: "점검 기록이 생성되었습니다.",
  CHECK_DELETED: "점검 기록이 삭제되었습니다.",
  RESULT_UPDATED: "전체 결과가 업데이트되었습니다.",
} as const;

/** 동의서 */
export const CONSENT_TOAST = {
  MEMBER_NAME_REQUIRED: "멤버 이름을 입력해주세요.",
  BATCH_MEMBER_FORMAT: "멤버 이름을 한 줄에 한 명씩 입력해주세요.",
  ITEM_ADDED: "동의서 항목이 추가되었습니다.",
  ITEM_UPDATED: "동의서 항목이 수정되었습니다.",
  SIGNED: "서명 처리되었습니다.",
  SIGN_ERROR: "서명 처리에 실패했습니다.",
  REJECTED: "거부 처리되었습니다.",
  REJECT_ERROR: "거부 처리에 실패했습니다.",
  NO_ITEMS: "생성할 항목이 없습니다.",
} as const;

/** 피팅 */
export const FITTING_TOAST = {
  MEMBER_REQUIRED: "멤버 이름을 입력해주세요.",
  COSTUME_REQUIRED: "의상 이름을 입력해주세요.",
  RECORD_ADDED: "핏팅 기록이 추가되었습니다.",
  RECORD_UPDATED: "핏팅 기록이 수정되었습니다.",
  RECORD_DELETED: "핏팅 기록이 삭제되었습니다.",
} as const;

/** 체크인 이벤트 */
export const CHECKIN_EVENT_TOAST = {
  NAME_REQUIRED: "이벤트명을 입력해주세요.",
  DATE_REQUIRED: "날짜를 입력해주세요.",
  GATHERING_TIME_REQUIRED: "집합 시간을 입력해주세요.",
  DELETED: "이벤트가 삭제되었습니다.",
  MEMBER_ADD_ERROR: "멤버 추가에 실패했습니다.",
  CREATE_ERROR: "이벤트 생성에 실패했습니다. 필수 항목을 확인해주세요.",
} as const;

/** 연습 큐 */
export const PRACTICE_QUEUE_TOAST = {
  QUEUE_NAME_REQUIRED: "큐 이름을 입력해주세요.",
  SONG_NAME_REQUIRED: "곡명을 입력해주세요.",
  SONG_LENGTH_FORMAT: '길이는 "분:초" 형식으로 입력해주세요. (예: 3:45)',
  REPEAT_RANGE: "반복 횟수는 1~20 사이로 입력해주세요.",
  SONG_ADDED: "곡이 추가되었습니다.",
  QUEUE_CREATE_ERROR: "큐 생성에 실패했습니다.",
  SONG_ADD_ERROR: "곡 추가에 실패했습니다.",
  SONG_DELETED: "곡이 삭제되었습니다.",
  SONG_DELETE_ERROR: "곡 삭제에 실패했습니다.",
  ALL_COMPLETED: "모든 곡을 완료했습니다!",
  QUEUE_RESET_ERROR: "큐 초기화에 실패했습니다.",
} as const;

/** 라이브 피드 */
export const LIVE_FEED_TOAST = {
  MESSAGE_REQUIRED: "메시지를 입력해주세요.",
  AUTHOR_REQUIRED: "작성자를 입력해주세요.",
  UPDATED: "피드가 수정되었습니다.",
  ADDED: "피드가 추가되었습니다.",
  DELETED: "피드가 삭제되었습니다.",
} as const;

/** 의상 디자인 */
export const COSTUME_DESIGN_TOAST = {
  TITLE_REQUIRED: "디자인 제목을 입력해주세요.",
  DESIGNER_REQUIRED: "디자이너를 선택해주세요.",
  COMMENT_REQUIRED: "댓글 내용을 입력해주세요.",
  COMMENT_ADDED: "댓글을 추가했습니다.",
  VOTE_CANCELLED: "투표를 취소했습니다.",
  VOTED: "투표했습니다.",
  COMMENT_DELETED: "댓글을 삭제했습니다.",
  DESIGN_DELETED: "디자인을 삭제했습니다.",
  IDEA_ADDED: "디자인 아이디어를 추가했습니다.",
} as const;

/** 조명 큐 */
export const LIGHTING_CUE_TOAST = {
  TIME_FORMAT: '시간은 "MM:SS" 형식으로 입력해주세요. (예: 01:30)',
  ZONE_REQUIRED: "구역을 입력해주세요.",
  CUE_ADDED: "조명 큐가 추가되었습니다.",
  CUE_DELETED: "큐가 삭제되었습니다.",
} as const;

/** 포스터 관리 */
export const POSTER_TOAST = {
  VERSION_TITLE_REQUIRED: "버전 제목을 입력해주세요.",
  DESIGNER_REQUIRED: "디자이너 이름을 입력해주세요.",
  DESCRIPTION_REQUIRED: "설명을 입력해주세요.",
  VERSION_ADDED: "버전이 추가되었습니다.",
  VERSION_ADD_ERROR: "버전 추가에 실패했습니다.",
  NAME_REQUIRED: "포스터 이름을 입력해주세요.",
  PROJECT_ADDED: "포스터 프로젝트가 추가되었습니다.",
  VOTER_REQUIRED: "투표할 멤버를 선택해주세요.",
  RATING_REQUIRED: "별점을 선택해주세요.",
  VOTE_REGISTERED: "투표가 등록되었습니다.",
  VOTE_ERROR: "투표 등록에 실패했습니다.",
  FINALIZED: "최종 포스터로 선정되었습니다.",
  FINALIZE_ERROR: "최종 선정에 실패했습니다.",
  VERSION_DELETED: "버전이 삭제되었습니다.",
  VERSION_DELETE_ERROR: "버전 삭제에 실패했습니다.",
  PROJECT_DELETED: "포스터 프로젝트가 삭제되었습니다.",
} as const;

/** 백스테이지 통신 */
export const BACKSTAGE_COMM_TOAST = {
  MESSAGE_REQUIRED: "메시지 내용을 입력하세요.",
  SENDER_REQUIRED: "발신자 이름을 입력하세요.",
  RECIPIENT_REQUIRED: "수신 대상(개인/팀)의 이름을 입력하세요.",
  MESSAGE_SENT: "메시지가 전송되었습니다.",
  MESSAGE_DELETED: "메시지가 삭제되었습니다.",
} as const;

/** 무대 통행증 */
export const STAGE_PASS_TOAST = {
  NAME_REQUIRED: "이름을 입력해주세요.",
  PASS_NUMBER_REQUIRED: "패스 번호를 입력해주세요.",
  UPDATED: "패스가 수정되었습니다.",
  ADDED: "패스가 추가되었습니다.",
  DELETED: "패스가 삭제되었습니다.",
} as const;

/** 설치 체크리스트 */
export const SETUP_CHECKLIST_TOAST = {
  CONTENT_REQUIRED: "항목 내용을 입력해주세요.",
  ITEM_ADDED: "항목이 추가되었습니다.",
  ITEM_UPDATED: "항목이 수정되었습니다.",
  ITEM_COMPLETED: "항목을 완료 처리했습니다.",
  ALL_RESET: "모든 항목이 미완료 상태로 초기화되었습니다.",
} as const;

/** 큐시트 */
export const CUE_SHEET_TOAST = {
  NAME_REQUIRED: "항목명을 입력해 주세요.",
  ITEM_ADDED: "큐 항목이 추가되었습니다.",
  ITEM_UPDATED: "큐 항목이 수정되었습니다.",
  ITEM_DELETED: "큐 항목이 삭제되었습니다.",
} as const;

/** 안무 노트 */
export const CHOREO_NOTES_TOAST = {
  SECTION_TITLE_REQUIRED: "구간 제목을 입력하세요.",
  SECTION_TIME_REQUIRED: "시작/종료 시간을 입력하세요.",
  SECTION_ADDED: "구간이 추가되었습니다.",
  SECTION_MAX: "구간은 노트당 최대 20개까지 추가할 수 있습니다.",
  SONG_REQUIRED: "곡명을 입력하세요.",
  NOTE_ADDED: "안무 노트가 추가되었습니다.",
  NOTE_MAX: "안무 노트는 최대 5개까지 추가할 수 있습니다.",
} as const;

/** 좌석 배치 */
export const SEATING_TOAST = {
  LAYOUT_NAME_REQUIRED: "배치 이름을 입력해주세요.",
  ROW_RANGE: "행 수는 1~26 사이여야 합니다.",
  SEAT_PER_ROW_RANGE: "행당 좌석 수는 1~50 사이여야 합니다.",
  LAYOUT_CREATED: "좌석 배치가 생성되었습니다.",
  LAYOUT_CREATE_ERROR: "배치 생성에 실패했습니다.",
  LAYOUT_DELETE_ERROR: "배치 삭제에 실패했습니다.",
  RESERVER_REQUIRED: "예약자 이름을 입력해주세요.",
  AUDIENCE_REQUIRED: "관객 이름을 입력해주세요.",
  RESERVE_ERROR: "예약에 실패했습니다.",
  CANCEL_ERROR: "예약 취소에 실패했습니다.",
  PROCESS_ERROR: "처리에 실패했습니다.",
  EVENT_NAME_REQUIRED: "이벤트명을 입력해주세요.",
  ROW_COL_RANGE: "행 수는 1~26 사이의 숫자를 입력해주세요.",
  COL_RANGE: "열 수는 1~50 사이의 숫자를 입력해주세요.",
  CHART_CREATED: "좌석 배치도가 생성되었습니다.",
  BOOKER_REQUIRED: "예약자 이름을 입력해주세요.",
} as const;

/** 의상 추적기 */
export const WARDROBE_TOAST = {
  COSTUME_NAME_REQUIRED: "의상명을 입력해주세요.",
  MEMBER_REQUIRED: "배정 멤버명을 입력해주세요.",
  COSTUME_UPDATED: "의상 정보가 수정되었습니다.",
  COSTUME_ADDED: "의상이 추가되었습니다.",
  COSTUME_DELETED: "의상이 삭제되었습니다.",
} as const;

/** 출연료 */
export const PERFORMANCE_FEE_TOAST = {
  MEMBER_REQUIRED: "멤버 이름을 입력해주세요.",
  BASE_FEE_REQUIRED: "올바른 기본 출연료를 입력해주세요.",
  AMOUNT_REQUIRED: "올바른 금액을 입력해주세요.",
  MEMBER_ADDED: "멤버가 추가되었습니다.",
  INFO_UPDATED: "정보가 수정되었습니다.",
  SETTLE_CANCELLED: "정산이 취소되었습니다.",
  SETTLE_CANCEL_ERROR: "정산 취소에 실패했습니다.",
  SETTLED: "정산 완료로 처리했습니다.",
  SETTLE_ERROR: "정산 처리에 실패했습니다.",
  ITEM_ADDED: "항목이 추가되었습니다.",
  ITEM_ADD_ERROR: "항목 추가에 실패했습니다.",
  ITEM_DELETE_ERROR: "항목 삭제에 실패했습니다.",
} as const;

/** 메이크업/헤어 */
export const MAKEUP_HAIR_TOAST = {
  MEMBER_REQUIRED: "멤버명을 입력해주세요.",
  SCENE_NUMBER_REQUIRED: "유효한 장면 번호를 입력해주세요.",
  START_TIME_REQUIRED: "시작 시간을 입력해주세요.",
  DURATION_REQUIRED: "유효한 소요 시간을 입력해주세요.",
  ARTIST_REQUIRED: "아티스트 이름을 입력해주세요.",
  PLAN_ADDED: "플랜이 추가되었습니다.",
  PLAN_UPDATED: "플랜이 수정되었습니다.",
  PLAN_DELETED: "플랜이 삭제되었습니다.",
  TIMELINE_ADDED: "타임라인이 추가되었습니다.",
  TIMELINE_UPDATED: "타임라인이 수정되었습니다.",
  TIMELINE_DELETED: "타임라인이 삭제되었습니다.",
  CHECKLIST_ITEM_NAME_REQUIRED: "아이템명을 입력해주세요.",
  CHECKLIST_ITEM_ADDED: "체크리스트 아이템이 추가되었습니다.",
  ARTIST_ADDED: "아티스트가 추가되었습니다.",
  ARTIST_UPDATED: "아티스트 정보가 수정되었습니다.",
  ARTIST_DELETED: "아티스트가 삭제되었습니다.",
} as const;

/** 드레스 리허설 */
export const DRESS_REHEARSAL_TOAST = {
  DATE_REQUIRED: "날짜를 입력해주세요.",
  VENUE_REQUIRED: "장소를 입력해주세요.",
  SCENE_REQUIRED: "장면/섹션을 입력해주세요.",
  ISSUE_REQUIRED: "이슈 내용을 입력해주세요.",
  SESSION_ADDED: "리허설 회차가 추가되었습니다.",
  SESSION_UPDATED: "회차 정보가 수정되었습니다.",
  SESSION_UPDATE_ERROR: "회차 수정에 실패했습니다.",
  SESSION_DELETED: "회차가 삭제되었습니다.",
  SESSION_DELETE_ERROR: "회차 삭제에 실패했습니다.",
  ISSUE_ADDED: "이슈가 추가되었습니다.",
  ISSUE_ADD_ERROR: "이슈 추가에 실패했습니다.",
  ISSUE_UPDATED: "이슈가 수정되었습니다.",
  ISSUE_UPDATE_ERROR: "이슈 수정에 실패했습니다.",
  ISSUE_DELETED: "이슈가 삭제되었습니다.",
  ISSUE_DELETE_ERROR: "이슈 삭제에 실패했습니다.",
  ISSUE_RESOLVED: "이슈를 해결 처리했습니다.",
} as const;

/** 협찬품 */
export const SPONSORED_GOODS_TOAST = {
  ITEM_NAME_REQUIRED: "물품명을 입력해주세요.",
  SPONSOR_NAME_REQUIRED: "스폰서명을 입력해주세요.",
  QUANTITY_REQUIRED: "수량은 1 이상의 숫자여야 합니다.",
  ITEM_UPDATED: "물품 정보가 수정되었습니다.",
  ITEM_ADDED: "협찬품이 추가되었습니다.",
  DISTRIBUTE_ERROR: "배분에 실패했습니다.",
  MEMBER_REQUIRED: "멤버 이름을 입력해주세요.",
  DISTRIBUTE_QUANTITY_REQUIRED: "수량은 1 이상이어야 합니다.",
} as const;

/** 공연 크레딧 */
export const SHOW_CREDITS_TOAST = {
  NAME_REQUIRED: "이름을 입력해주세요",
  SECTION_ADDED: "섹션이 추가되었습니다",
  SECTION_DELETED: "섹션이 삭제되었습니다",
  SECTION_DELETE_ERROR: "섹션 삭제에 실패했습니다",
  MEMBER_ADD_ERROR: "인원 추가에 실패했습니다",
  MOVE_ERROR: "이동할 수 없습니다",
  TITLE_UPDATE_ERROR: "제목 수정에 실패했습니다",
} as const;

/** 스테이지 레이아웃 */
export const STAGE_LAYOUT_TOAST = {
  PLAN_NAME_REQUIRED: "플랜 이름을 입력해주세요.",
  PLAN_ADDED: "플랜이 추가되었습니다.",
  PLAN_DELETED: "플랜이 삭제되었습니다.",
  PLAN_DELETE_ERROR: "플랜 삭제에 실패했습니다.",
  LABEL_REQUIRED: "라벨을 입력해주세요.",
  ITEM_ADDED: "아이템이 추가되었습니다.",
  ITEM_UPDATED: "아이템이 수정되었습니다.",
  ITEM_DELETED: "아이템이 삭제되었습니다.",
  ITEM_DELETE_ERROR: "아이템 삭제에 실패했습니다.",
} as const;

/** 무대 효과 */
export const STAGE_EFFECT_TOAST = {
  CUE_NUMBER_REQUIRED: "큐 번호를 입력해주세요.",
  TRIGGER_REQUIRED: "트리거 시점을 입력해주세요. (예: 01:30)",
  TRIGGER_FORMAT: "트리거 시점 형식이 올바르지 않습니다. (예: 01:30)",
  DURATION_REQUIRED: "올바른 지속 시간(초)을 입력해주세요.",
  POSITION_REQUIRED: "무대 위치를 입력해주세요.",
  INTENSITY_REQUIRED: "커스텀 강도 값을 입력해주세요.",
  CUE_ADDED: "큐가 추가되었습니다.",
  CUE_ADD_ERROR: "큐 추가에 실패했습니다.",
  CUE_UPDATED: "큐가 수정되었습니다.",
  CUE_UPDATE_ERROR: "큐 수정에 실패했습니다.",
  CUE_DELETED: "큐가 삭제되었습니다.",
  CUE_DELETE_ERROR: "큐 삭제에 실패했습니다.",
} as const;

/** 스테이지 메모 */
export const STAGE_MEMO_TOAST = {
  BOARD_TITLE_REQUIRED: "보드 제목을 입력해주세요.",
  MEMO_CONTENT_REQUIRED: "메모 내용을 입력해주세요.",
  BOARD_DELETED: "보드를 삭제했습니다.",
  MEMO_DELETED: "메모를 삭제했습니다.",
  BOARD_CREATED: "보드를 만들었습니다.",
  MEMO_ADDED: "메모를 추가했습니다.",
} as const;

/** 안무 버전 */
export const CHOREO_VERSION_TOAST = {
  SECTION_MAX: "구간은 최대 20개까지 추가할 수 있습니다.",
  LABEL_REQUIRED: "버전 라벨을 입력하세요. (예: 초안, 수정본)",
  VERSION_ADDED: "새 버전이 추가되었습니다.",
  VERSION_MAX: "버전은 최대 20개까지 추가할 수 있습니다.",
  SONG_TITLE_SAVED: "곡 제목이 저장되었습니다.",
  COMPARE_MAX: "두 버전만 선택할 수 있습니다.",
  COMPARE_SELECT: "비교할 두 버전을 선택하세요.",
} as const;

/** VIP 게스트 */
export const VIP_GUEST_TOAST = {
  NAME_REQUIRED: "게스트 이름을 입력해주세요.",
  INFO_UPDATED: "게스트 정보가 수정되었습니다.",
  ADDED: "VIP 게스트가 추가되었습니다.",
} as const;

/** 리뷰 */
export const REVIEW_TOAST = {
  NAME_REQUIRED: "이름을 입력해주세요.",
  DELETED: "리뷰가 삭제되었습니다.",
  REGISTERED: "리뷰가 등록되었습니다.",
} as const;

/** 기술 요구사항 */
export const TECH_REQ_TOAST = {
  EQUIPMENT_REQUIRED: "장비명을 입력해주세요.",
  QUANTITY_REQUIRED: "수량은 1 이상의 숫자여야 합니다.",
  EQUIPMENT_UPDATED: "장비 정보가 수정되었습니다.",
  EQUIPMENT_ADDED: "장비가 추가되었습니다.",
} as const;

/** 스테이지 대형 */
export const STAGE_FORMATION_TOAST = {
  SCENE_NAME_REQUIRED: "씬 이름을 입력해주세요.",
  DURATION_REQUIRED: "올바른 지속 시간을 입력해주세요.",
  MEMBER_REQUIRED: "멤버 이름을 입력해주세요.",
  X_RANGE: "가로 위치는 0~100 사이 값을 입력해주세요.",
  Y_RANGE: "세로 위치는 0~100 사이 값을 입력해주세요.",
  STAGE_WIDTH_REQUIRED: "올바른 무대 너비를 입력해주세요.",
  STAGE_DEPTH_REQUIRED: "올바른 무대 깊이를 입력해주세요.",
  SCENE_UPDATED: "씬이 수정되었습니다.",
  SCENE_UPDATE_ERROR: "씬 수정에 실패했습니다.",
  SCENE_ADDED: "씬이 추가되었습니다.",
  SCENE_DELETED: "씬이 삭제되었습니다.",
  SCENE_DELETE_ERROR: "씬 삭제에 실패했습니다.",
  POSITION_UPDATED: "포지션이 수정되었습니다.",
  POSITION_UPDATE_ERROR: "포지션 수정에 실패했습니다.",
  POSITION_ADDED: "포지션이 추가되었습니다.",
  POSITION_ADD_ERROR: "포지션 추가에 실패했습니다.",
  POSITION_DELETED: "포지션이 삭제되었습니다.",
  POSITION_DELETE_ERROR: "포지션 삭제에 실패했습니다.",
  STAGE_SAVED: "무대 설정이 저장되었습니다.",
} as const;

/** 영상 라이브러리 */
export const VIDEO_LIBRARY_TOAST = {
  TITLE_REQUIRED: "제목을 입력해주세요.",
  URL_REQUIRED: "URL을 입력해주세요.",
  URL_HTTPS: "URL은 https://로 시작해야 합니다.",
  ADDED: "영상이 추가되었습니다.",
  INVALID_URL: "URL이 유효하지 않거나 최대 개수를 초과했습니다.",
} as const;

/** 프로그램북 편집기 */
export const PROGRAM_BOOK_EDITOR_TOAST = {
  SHOW_NAME_REQUIRED: "공연명을 입력해주세요.",
  PROGRAM_TITLE_REQUIRED: "프로그램 제목을 입력해주세요.",
  CAST_NAME_REQUIRED: "출연진 이름을 입력해주세요.",
  ROLE_REQUIRED: "역할을 입력해주세요.",
  SHOW_INFO_SAVED: "공연 정보가 저장되었습니다.",
  PROGRAM_ADDED: "프로그램이 추가되었습니다.",
  PROGRAM_UPDATED: "프로그램이 수정되었습니다.",
  PROGRAM_DELETED: "프로그램이 삭제되었습니다.",
  CAST_ADDED: "출연진이 추가되었습니다.",
  CAST_UPDATED: "출연진 정보가 수정되었습니다.",
  CAST_DELETED: "출연진이 삭제되었습니다.",
} as const;

/** 리허설 일정 */
export const REHEARSAL_SCHEDULE_TOAST = {
  TITLE_REQUIRED: "리허설 제목을 입력해주세요.",
  DATE_REQUIRED: "날짜를 선택해주세요.",
  START_TIME_REQUIRED: "시작 시간을 입력해주세요.",
  ADDED: "리허설 일정이 추가되었습니다.",
  UPDATED: "리허설 일정이 수정되었습니다.",
  DELETED: "리허설 일정이 삭제되었습니다.",
  COMPLETED: "리허설이 완료 처리되었습니다.",
  CANCELLED: "리허설이 취소되었습니다.",
} as const;

/** 사운드 큐 */
export const SOUND_CUE_TOAST = {
  CUE_NAME_REQUIRED: "큐 이름을 입력해주세요.",
  CUE_NUMBER_REQUIRED: "올바른 큐 번호를 입력해주세요.",
  SHEET_TITLE_REQUIRED: "시트 제목을 입력해주세요.",
  SHEET_ADDED: "큐시트가 추가되었습니다.",
  SHEET_UPDATED: "큐시트가 수정되었습니다.",
  SHEET_DELETED: "큐시트가 삭제되었습니다.",
  CUE_ADDED: "큐가 추가되었습니다.",
  CUE_UPDATED: "큐가 수정되었습니다.",
  CUE_DELETED: "큐가 삭제되었습니다.",
} as const;

/** 스폰서 트래킹 */
export const SPONSOR_TRACKING_TOAST = {
  NAME_REQUIRED: "후원사 이름을 입력해주세요.",
  AMOUNT_REQUIRED: "올바른 후원 금액을 입력해주세요.",
  ADDED: "스폰서가 추가되었습니다.",
  UPDATED: "스폰서 정보가 수정되었습니다.",
  PAYMENT_STATUS_ERROR: "입금 상태 변경에 실패했습니다.",
  BENEFIT_STATUS_ERROR: "혜택 상태 변경에 실패했습니다.",
} as const;

/** 의상 관리 */
export const COSTUME_MGMT_TOAST = {
  NAME_REQUIRED: "의상 이름을 입력하세요.",
  QUANTITY_REQUIRED: "수량은 1개 이상이어야 합니다.",
  REGISTERED: "의상이 등록되었습니다.",
  REGISTER_ERROR: "의상 등록에 실패했습니다.",
  MEMBER_REQUIRED: "멤버 이름을 입력하세요.",
  ASSIGN_ERROR: "배정에 실패했습니다. 재고가 부족하거나 이미 배정된 멤버입니다.",
} as const;

/** 음악 큐시트 */
export const MUSIC_CUESHEET_TOAST = {
  TITLE_REQUIRED: "큐시트 제목을 입력해주세요.",
  CREATED: "큐시트가 생성되었습니다.",
  SONG_NAME_REQUIRED: "곡명을 입력해주세요.",
  START_TIME_FORMAT: '시작 시간은 "분:초" 형식으로 입력해주세요. (예: 02:30)',
  PLAY_TIME_FORMAT: '재생 시간은 "분:초" 형식으로 입력해주세요. (예: 03:45)',
  ITEM_ADDED: "큐 항목이 추가되었습니다.",
} as const;

/** 런다운 */
export const RUNDOWN_TOAST = {
  TIME_REQUIRED: "시작 시간과 종료 시간을 입력해 주세요.",
  ACTIVITY_REQUIRED: "활동명을 입력해 주세요.",
  END_AFTER_START: "종료 시간은 시작 시간보다 늦어야 합니다.",
  ITEM_UPDATED: "항목이 수정되었습니다.",
  ITEM_ADDED: "런다운 항목이 추가되었습니다.",
} as const;

/** 커튼콜 */
export const CURTAIN_CALL_TOAST = {
  PLAN_NAME_REQUIRED: "플랜 이름을 입력해주세요.",
  PLAN_UPDATED: "플랜이 수정되었습니다.",
  PLAN_ADDED: "플랜이 추가되었습니다.",
  DESCRIPTION_REQUIRED: "설명을 입력해주세요.",
  DURATION_RANGE: "소요시간은 1 이상의 숫자여야 합니다.",
  STEP_UPDATED: "스텝이 수정되었습니다.",
  STEP_ADDED: "스텝이 추가되었습니다.",
  STEP_DELETED: "스텝이 삭제되었습니다.",
} as const;

/** 성과 체크인 */
export const PERFORMANCE_CHECKIN_TOAST = {
  EVENT_CREATED: "체크인 이벤트가 생성되었습니다.",
} as const;

/** 공연 준비도 */
export const PERFORMANCE_READINESS_TOAST = {
  ITEM_NAME_REQUIRED: "항목 이름을 입력해주세요.",
  ITEM_ADDED: "항목이 추가되었습니다.",
  ITEM_ADD_ERROR: "항목 추가에 실패했습니다.",
  CHECKLIST_DELETED: "체크리스트가 삭제되었습니다.",
  SHOW_NAME_REQUIRED: "공연/행사 이름을 입력해주세요.",
  CHECKLIST_CREATED: "체크리스트가 생성되었습니다.",
} as const;

/** 쇼 프로그램 */
export const SHOW_PROGRAM_TOAST = {
  SHOW_TITLE_REQUIRED: "공연 제목을 입력해주세요.",
  INFO_SAVED: "공연 정보가 저장되었습니다.",
  PIECE_REQUIRED: "작품/곡명을 입력해주세요.",
  PROGRAM_UPDATED: "프로그램 항목이 수정되었습니다.",
  PROGRAM_ADDED: "프로그램 항목이 추가되었습니다.",
  CREDIT_MANAGER_REQUIRED: "담당자 이름을 입력해주세요.",
  CREDIT_UPDATED: "크레딧이 수정되었습니다.",
  CREDIT_ADDED: "크레딧이 추가되었습니다.",
  SPONSOR_NAME_REQUIRED: "스폰서명을 입력해주세요.",
  SPONSOR_UPDATED: "스폰서가 수정되었습니다.",
  SPONSOR_ADDED: "스폰서가 추가되었습니다.",
} as const;

/** 공연 셋리스트 */
export const PERFORMANCE_SETLIST_TOAST = {
  SONG_TITLE_REQUIRED: "곡 제목을 입력해주세요.",
  SHOW_TITLE_SAVED: "공연 제목이 저장되었습니다.",
  SONG_ADDED: "곡이 추가되었습니다.",
  SONG_UPDATED: "곡 정보가 수정되었습니다.",
  SONG_DELETED: "곡이 삭제되었습니다.",
} as const;

/** 셋리스트 관리 */
export const SETLIST_MGMT_TOAST = {
  SHOW_NAME_REQUIRED: "공연 이름을 입력해주세요.",
  SHOW_INFO_SAVED: "공연 정보가 저장되었습니다.",
  ITEM_TITLE_REQUIRED: "항목 제목을 입력해주세요.",
  ITEM_ADDED: "항목이 추가되었습니다.",
  ITEM_DELETED: "항목이 삭제되었습니다.",
} as const;

/** 공연 스폰서 */
export const PERFORMANCE_SPONSOR_TOAST = {
  NAME_REQUIRED: "스폰서 이름을 입력해주세요.",
  AMOUNT_REQUIRED: "후원 금액을 올바르게 입력해주세요.",
  FEE_AMOUNT_REQUIRED: "올바른 금액을 입력해주세요.",
  ADDED: "스폰서가 추가되었습니다.",
  UPDATED: "스폰서 정보가 수정되었습니다.",
  DELETED: "스폰서가 삭제되었습니다.",
} as const;

/** 안전 체크리스트 */
export const SAFETY_CHECKLIST_TOAST = {
  CONTENT_REQUIRED: "항목 내용을 입력해주세요.",
  ITEM_ADDED: "항목이 추가되었습니다.",
  ITEM_UPDATED: "항목이 수정되었습니다.",
  ALL_RESET: "모든 항목이 미확인 상태로 초기화되었습니다.",
  ITEM_DELETED: "항목이 삭제되었습니다.",
} as const;

/** 쇼 인벤토리 */
export const SHOW_INVENTORY_TOAST = {
  NAME_REQUIRED: "물품명을 입력해주세요.",
  QUANTITY_REQUIRED: "수량은 1 이상의 숫자여야 합니다.",
  ITEM_ADDED: "물품이 추가되었습니다.",
  ITEM_ADD_ERROR: "물품 추가에 실패했습니다. 물품명을 확인해주세요.",
  ITEM_DELETED: "물품이 삭제되었습니다.",
} as const;

/** 안무 구간 */
export const CHOREO_SECTION_TOAST = {
  NAME_REQUIRED: "구간 이름을 입력하세요.",
  START_TIME_REQUIRED: "시작 시간을 입력하세요.",
  END_TIME_REQUIRED: "종료 시간을 입력하세요.",
  COMPLETION_UPDATED: "완성도가 업데이트되었습니다.",
  ADD_ERROR: "구간 추가에 실패했습니다.",
} as const;

/** 의상 대여 */
export const COSTUME_RENTAL_TOAST = {
  NAME_REQUIRED: "의상 이름을 입력해주세요",
  ADDED: "의상을 추가했습니다",
  RENTER_REQUIRED: "대여자 이름을 입력해주세요",
  RETURN_DATE_REQUIRED: "반납 예정일을 선택해주세요",
} as const;

/** 관객 안내 */
export const AUDIENCE_GUIDE_TOAST = {
  QA_REQUIRED: "질문과 답변을 모두 입력해 주세요.",
  SECTION_TITLE_REQUIRED: "섹션 제목을 입력해 주세요.",
  MANUAL_TITLE_REQUIRED: "매뉴얼 제목을 입력해 주세요.",
  MANUAL_INFO_SAVED: "매뉴얼 정보가 저장되었습니다.",
  SECTION_ADDED: "섹션이 추가되었습니다.",
  SECTION_DELETED: "섹션이 삭제되었습니다.",
  FAQ_UPDATED: "FAQ가 수정되었습니다.",
  FAQ_DELETED: "FAQ가 삭제되었습니다.",
  TITLE_UPDATED: "제목이 수정되었습니다.",
  CONTENT_SAVED: "내용이 저장되었습니다.",
  FAQ_ADDED: "FAQ가 추가되었습니다.",
} as const;

/** 공연 후 보고서 */
export const POST_SHOW_REPORT_TOAST = {
  TITLE_REQUIRED: "보고서 제목을 입력해주세요.",
  DATE_REQUIRED: "공연 날짜를 선택해주세요.",
  SUMMARY_REQUIRED: "총평을 입력해주세요.",
  AUTHOR_REQUIRED: "작성자를 입력해주세요.",
  AUDIENCE_REQUIRED: "관객 수는 0 이상의 숫자를 입력해주세요.",
  REVENUE_REQUIRED: "매출은 0 이상의 숫자를 입력해주세요.",
  CREATED: "사후 분석 보고서가 작성되었습니다.",
  UPDATED: "보고서가 수정되었습니다.",
  DELETED: "보고서가 삭제되었습니다.",
} as const;

/** 관객 피드백 */
export const AUDIENCE_FEEDBACK_TOAST = {
  TITLE_REQUIRED: "설문 제목을 입력해주세요",
  CREATED: "설문이 생성되었습니다",
  SUBMITTED: "응답이 제출되었습니다",
  DELETED: "설문이 삭제되었습니다",
} as const;

/** 대형 노트 */
export const FORMATION_NOTE_TOAST = {
  NAME_REQUIRED: "대형 이름을 입력해주세요.",
  TIME_FORMAT: "시간은 MM:SS 형식으로 입력해주세요. (예: 1:30)",
  COORD_INVALID: "좌표 값이 유효하지 않습니다.",
  POSITION_UPDATED: "위치를 업데이트했습니다.",
  SNAPSHOT_ADDED: "스냅샷이 추가되었습니다.",
  SNAPSHOT_DELETED: "스냅샷이 삭제되었습니다.",
} as const;

/** 백스테이지 체크 */
export const BACKSTAGE_CHECK_TOAST = {
  EVENT_NAME_REQUIRED: "이벤트명을 입력해주세요.",
  DATE_REQUIRED: "날짜를 입력해주세요.",
  ITEM_TITLE_REQUIRED: "항목 제목을 입력해주세요.",
  SESSION_COMPLETED: "세션이 완료 처리되었습니다.",
  ALL_CHECK_REQUIRED: "모든 항목을 체크해야 완료할 수 있습니다.",
  SESSION_CREATE_ERROR: "세션 생성에 실패했습니다. 필수 항목을 확인해주세요.",
  CHECK_ITEM_ADDED: "체크 항목이 추가되었습니다.",
  CHECK_ITEM_ADD_ERROR: "항목 추가에 실패했습니다.",
} as const;

/** 프로그램북 */
export const PROGRAM_BOOK_TOAST = {
  SHOW_NAME_REQUIRED: "공연명을 입력해주세요.",
  SECTION_TITLE_REQUIRED: "섹션 제목을 입력해주세요.",
  INFO_SAVED: "프로그램북 기본 정보가 저장되었습니다.",
  SETUP_REQUIRED: "먼저 프로그램북 기본 정보를 입력해주세요.",
  SECTION_ADDED: "섹션이 추가되었습니다.",
  SECTION_UPDATED: "섹션이 수정되었습니다.",
  SECTION_DELETED: "섹션이 삭제되었습니다.",
} as const;

/** 사운드체크 */
export const SOUNDCHECK_TOAST = {
  SHEET_NAME_REQUIRED: "시트 이름을 입력해주세요.",
  SHEET_UPDATED: "시트가 수정되었습니다.",
  SHEET_ADDED: "시트가 추가되었습니다.",
  SOURCE_NAME_REQUIRED: "소스 이름을 입력해주세요.",
  CHANNEL_REQUIRED: "채널 번호는 1 이상의 숫자여야 합니다.",
  VOLUME_RANGE: "볼륨은 0~100 사이 값이어야 합니다.",
  PAN_RANGE: "팬은 -100~100 사이 값이어야 합니다.",
  CHANNEL_UPDATED: "채널이 수정되었습니다.",
  CHANNEL_ADDED: "채널이 추가되었습니다.",
  CHANNEL_DELETED: "채널이 삭제되었습니다.",
} as const;

/** 리허설 플래너 */
export const REHEARSAL_PLANNER_TOAST = {
  SHOW_TITLE_REQUIRED: "공연 제목을 입력해주세요",
  DATE_REQUIRED: "공연 날짜를 선택해주세요",
  DATE_FUTURE: "공연 날짜는 오늘 이후여야 합니다",
  CREATED: "리허설 플래너가 생성되었습니다",
  RESET: "리허설 플래너가 초기화되었습니다",
} as const;

/** 날씨 */
export const WEATHER_TOAST = {
  DATE_REQUIRED: "공연 날짜를 입력해주세요.",
  TEMP_REQUIRED: "기온을 숫자로 입력해주세요.",
  HUMIDITY_RANGE: "습도는 0~100 사이의 숫자로 입력해주세요.",
  RESPONSE_REQUIRED: "대응 내용을 입력해주세요.",
  FORECAST_ADDED: "날씨 예보가 추가되었습니다.",
  FORECAST_DELETED: "예보가 삭제되었습니다.",
  CHECKLIST_REQUIRED: "체크리스트 항목을 입력해주세요.",
  CHECKLIST_ITEM_ADDED: "항목이 추가되었습니다.",
  RESPONSE_PLAN_ADDED: "대응 플랜이 추가되었습니다.",
  PLAN_DELETED: "플랜이 삭제되었습니다.",
} as const;

/** 리스크 */
export const RISK_TOAST = {
  TITLE_REQUIRED: "위험 요소 제목을 입력해주세요.",
  COUNTERMEASURE_REQUIRED: "대응 방안을 입력해주세요.",
  UPDATED: "리스크가 수정되었습니다.",
  REGISTERED: "리스크가 등록되었습니다.",
  DELETED: "리스크가 삭제되었습니다.",
} as const;

/** 티켓 판매 */
export const TICKET_SALES_TOAST = {
  NAME_REQUIRED: "등급명을 입력해주세요.",
  PRICE_REQUIRED: "올바른 가격을 입력해주세요.",
  TOTAL_QUANTITY_REQUIRED: "총 수량은 1 이상이어야 합니다.",
  GRADE_ADDED: "등급이 추가되었습니다.",
  BUYER_REQUIRED: "구매자명을 입력해주세요.",
  GRADE_SELECT_REQUIRED: "등급을 선택해주세요.",
  QUANTITY_REQUIRED: "수량은 1 이상이어야 합니다.",
  DATE_REQUIRED: "날짜를 입력해주세요.",
  SALES_ADDED: "판매 기록이 추가되었습니다.",
  GRADE_DELETED: "등급이 삭제되었습니다.",
} as const;

/** 관객 설문 */
export const AUDIENCE_SURVEY_TOAST = {
  TITLE_REQUIRED: "제목을 입력해주세요.",
  DATE_REQUIRED: "수집 날짜를 선택해주세요.",
  RESPONSE_COUNT_REQUIRED: "응답 수는 0 이상이어야 합니다.",
  RESULT_ADDED: "설문 결과가 추가되었습니다.",
  RESULT_UPDATED: "설문 결과가 수정되었습니다.",
  RESULT_DELETED: "설문 결과가 삭제되었습니다.",
} as const;

/** 전환 구간 */
export const STAGE_TRANSITION_TOAST = {
  FROM_SCENE_REQUIRED: "이전 장면을 입력해주세요.",
  TO_SCENE_REQUIRED: "다음 장면을 입력해주세요.",
  TIME_REQUIRED: "올바른 전환 시간을 입력해주세요.",
  TODO_REQUIRED: "할 일 내용을 입력해주세요.",
  UPDATED: "전환 구간이 수정되었습니다.",
  REGISTERED: "전환 구간이 등록되었습니다.",
  DELETED: "전환 구간이 삭제되었습니다.",
  TODO_ADDED: "할 일이 추가되었습니다.",
  TODO_ADD_ERROR: "할 일 추가에 실패했습니다.",
  TODO_DELETED: "할 일이 삭제되었습니다.",
} as const;

/** 공연 회고 */
export const PERFORMANCE_RETROSPECTIVE_TOAST = {
  ITEM_ADDED: "항목이 추가되었습니다.",
} as const;

/** 공연 히스토리 */
export const PERFORMANCE_HISTORY_TOAST = {
  DATE_REQUIRED: "날짜를 선택해주세요.",
  VENUE_REQUIRED: "장소를 입력해주세요.",
} as const;

/** 장비 인벤토리 */
export const EQUIPMENT_INVENTORY_TOAST = {
  NAME_REQUIRED: "장비 이름을 입력해주세요.",
  QUANTITY_MIN: "수량은 1 이상이어야 합니다.",
  REGISTERED: "장비가 등록되었습니다.",
  REGISTER_ERROR: "장비 등록에 실패했습니다.",
  SELECT_REQUIRED: "장비를 선택해주세요.",
  RENTER_REQUIRED: "대여자 이름을 입력해주세요.",
  RETURN_DATE_REQUIRED: "반납 예정일을 선택해주세요.",
  RENTAL_DONE: "대여 처리가 완료되었습니다.",
  RENTAL_ACTIVE_DELETE_ERROR: "대여 중인 장비는 삭제할 수 없습니다. 먼저 반납 처리해주세요.",
  DELETED: "장비가 삭제되었습니다.",
  DELETE_ERROR: "장비 삭제에 실패했습니다.",
  RETURN_DONE: "반납 처리가 완료되었습니다.",
  RETURN_ERROR: "반납 처리에 실패했습니다.",
  REFRESHED: "새로고침했습니다.",
} as const;

/** 장비 대여 */
export const EQUIPMENT_RENTAL_TOAST = {
  NAME_REQUIRED: "장비 이름을 입력해주세요.",
  QUANTITY_MIN: "수량은 1 이상이어야 합니다.",
  UPDATED: "장비 정보가 수정되었습니다.",
  ADDED: "장비가 추가되었습니다.",
  SAVE_ERROR: "저장 중 오류가 발생했습니다.",
  DELETED: "장비가 삭제되었습니다.",
  DELETE_ERROR: "삭제 중 오류가 발생했습니다.",
  RETURN_DATE_REQUIRED: "반납 예정일을 선택해주세요.",
  RETURN_DONE: "반납 처리 완료",
  RETURN_ERROR: "반납 처리 중 오류가 발생했습니다.",
} as const;

/** 리허설 로그 */
export const REHEARSAL_LOG_TOAST = {
  DATE_REQUIRED: "날짜를 입력해주세요.",
  RECORD_DELETED: "기록이 삭제되었습니다.",
  ISSUE_ADDED: "이슈가 추가되었습니다.",
} as const;

/** 백스테이지 로그 */
export const BACKSTAGE_LOG_TOAST = {
  SHOW_NAME_REQUIRED: "공연명을 입력해주세요.",
  DATE_REQUIRED: "공연 날짜를 선택해주세요.",
  SENDER_REQUIRED: "발신자 이름을 입력해주세요.",
  MESSAGE_REQUIRED: "메시지를 입력해주세요.",
  LOG_ADDED: "로그가 추가되었습니다.",
  SESSION_ENDED: "세션이 종료되었습니다.",
  HANDLER_REQUIRED: "처리자 이름을 입력해주세요.",
  ITEM_RESOLVED: "항목이 해결됨으로 처리되었습니다.",
  ITEM_DELETED: "항목이 삭제되었습니다.",
  SESSION_DELETED: "세션이 삭제되었습니다.",
} as const;

/** 안무 난도 */
export const CHOREO_DIFFICULTY_TOAST = {
  SONG_REQUIRED: "곡명을 입력하세요.",
  RATING_MAX: "평가는 최대 20개까지 등록할 수 있습니다.",
  REGISTERED: "난도 평가가 등록되었습니다.",
} as const;

/** 메이크업 시트 */
export const MAKEUP_SHEET_TOAST = {
  PRODUCT_NAME_REQUIRED: "제품명을 입력해주세요.",
  LOOK_NAME_REQUIRED: "룩 이름을 입력해주세요.",
  SHOW_NAME_REQUIRED: "공연 이름을 입력해주세요.",
  LOOK_ADDED: "룩이 추가되었습니다.",
  LOOK_UPDATED: "룩이 수정되었습니다.",
  LOOK_DELETED: "룩이 삭제되었습니다.",
  PRODUCT_ADDED: "제품이 추가되었습니다.",
  PRODUCT_UPDATED: "제품이 수정되었습니다.",
  PRODUCT_DELETED: "제품이 삭제되었습니다.",
  MEMBER_DUPLICATE: "이미 배정된 멤버입니다.",
} as const;

/** 아티스트 라이더 */
export const ARTIST_RIDER_TOAST = {
  ARTIST_REQUIRED: "아티스트/팀명을 입력해 주세요.",
  REQUEST_REQUIRED: "요청 내용을 입력해 주세요.",
  QUANTITY_REQUIRED: "수량은 1 이상이어야 합니다.",
  ITEM_UPDATED: "항목이 수정되었습니다.",
  ITEM_ADDED: "항목이 추가되었습니다.",
  ITEM_DELETED: "항목이 삭제되었습니다.",
} as const;

/** 드레스 코드 */
export const DRESS_CODE_TOAST = {
  ITEM_TITLE_REQUIRED: "항목 제목을 입력해주세요.",
  ITEM_DESC_REQUIRED: "항목 설명을 입력해주세요.",
  SHOW_NAME_REQUIRED: "공연명을 입력해주세요.",
  SET_ADDED: "드레스 코드 세트가 추가되었습니다.",
  SET_DELETED: "드레스 코드 세트가 삭제되었습니다.",
  GUIDE_ADDED: "가이드 항목이 추가되었습니다.",
  GUIDE_ADD_ERROR: "가이드 항목 추가에 실패했습니다.",
  GUIDE_UPDATED: "가이드 항목이 수정되었습니다.",
  GUIDE_UPDATE_ERROR: "가이드 항목 수정에 실패했습니다.",
  GUIDE_DELETED: "가이드 항목이 삭제되었습니다.",
  GUIDE_DELETE_ERROR: "가이드 항목 삭제에 실패했습니다.",
} as const;

/** 앙콜 계획 */
export const ENCORE_TOAST = {
  PLAN_NAME_REQUIRED: "플랜 이름을 입력해주세요.",
  MAX_ENCORE_REQUIRED: "최대 앵콜 수는 1 이상이어야 합니다.",
  PLAN_UPDATED: "플랜이 수정되었습니다.",
  PLAN_ADDED: "플랜이 추가되었습니다.",
  SONG_TITLE_REQUIRED: "곡 제목을 입력해주세요.",
  SONG_DURATION_REQUIRED: "곡 길이는 1초 이상이어야 합니다.",
  SONG_UPDATED: "곡이 수정되었습니다.",
  SONG_ADDED: "곡이 추가되었습니다.",
  SONG_DELETED: "곡이 삭제되었습니다.",
} as const;

/** 긴급 연락처 */
export const EMERGENCY_CONTACT_TOAST = {
  ADDED: "긴급 연락처가 추가되었습니다",
  UPDATED: "긴급 연락처가 수정되었습니다",
  DELETED: "긴급 연락처가 삭제되었습니다",
  NAME_REQUIRED: "긴급 연락처 이름을 입력해주세요",
  PHONE_REQUIRED: "긴급 연락처 전화번호를 입력해주세요",
} as const;
