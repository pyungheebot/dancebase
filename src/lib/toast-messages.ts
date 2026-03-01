/** 전역 토스트 메시지 상수. 일관된 사용자 피드백을 위해 사용 */
export const TOAST = {
  // 공통 CRUD
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

  // 인증
  LOGIN_REQUIRED: "로그인이 필요합니다",

  // 공통 액션
  ORDER_ERROR: "순서 변경에 실패했습니다",
  STATUS_ERROR: "상태 변경에 실패했습니다",
  DELETE_SIMPLE_ERROR: "삭제에 실패했습니다",
  READ_ERROR: "읽음 처리에 실패했습니다",
  EXPORT_EMPTY: "선택한 기간에 내보낼 데이터가 없습니다.",
  EXPORT_ERROR: "내보내기 중 오류가 발생했습니다.",
  LOAD_ERROR: "데이터를 불러오지 못했습니다",

  // 유효성 검사
  TITLE_REQUIRED: "제목을 입력해주세요",
  TITLE_REQUIRED_DOT: "제목을 입력해주세요.",
  CONTENT_REQUIRED: "내용을 입력해주세요",
  CONTENT_REQUIRED_DOT: "내용을 입력해주세요.",
  NAME_REQUIRED: "이름을 입력해주세요",
  NAME_REQUIRED_DOT: "이름을 입력해주세요.",
  DATE_REQUIRED: "날짜를 입력해주세요",
  DATE_REQUIRED_DOT: "날짜를 입력해주세요.",
  DATE_SELECT: "날짜를 선택해주세요",
  DATE_SELECT_DOT: "날짜를 선택해주세요.",
  NOT_FOUND: "항목을 찾을 수 없습니다",
  MEMBER_NAME_REQUIRED: "멤버 이름을 입력해주세요",
  MEMBER_NAME_REQUIRED_DOT: "멤버 이름을 입력해주세요.",
  MEMBER_SELECT: "멤버를 선택해주세요",

  // 공통 항목
  ITEM_ADDED: "항목이 추가되었습니다",
  ITEM_UPDATED: "항목이 수정되었습니다",
  ITEM_DELETED: "항목이 삭제되었습니다",
  ITEM_ADD_ERROR: "항목 추가에 실패했습니다.",
  ITEM_TITLE_REQUIRED: "항목 제목을 입력해주세요.",
  ITEM_NAME_REQUIRED: "항목 이름을 입력해주세요",

  // 출석
  ATTENDANCE: {
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
  },

  // 게시판
  BOARD: {
    CREATED: "게시글이 등록되었습니다",
    UPDATED: "게시글이 수정되었습니다",
    DELETED: "게시글이 삭제되었습니다",
    CREATE_ERROR: "게시글 추가에 실패했습니다",
    UPDATE_ERROR: "게시글 수정에 실패했습니다",
    DELETE_ERROR: "게시글 삭제에 실패했습니다",
    LOAD_ERROR: "게시글 목록을 불러오지 못했습니다.",
    COMMENT_CREATED: "댓글이 등록되었습니다",
    COMMENT_DELETED: "댓글이 삭제되었습니다",
    COMMENT_CREATE_ERROR: "댓글 추가에 실패했습니다",
    COMMENT_DELETE_ERROR: "댓글 삭제에 실패했습니다",
    COMMENT_LOAD_ERROR: "댓글 목록을 불러오지 못했습니다.",
    REACTION_ERROR: "공감 처리에 실패했습니다.",
    PIN_ERROR: "고정 설정에 실패했습니다",
    EXPORTED: "게시판 활동 데이터를 내보냈습니다.",
  },

  // 일정
  SCHEDULE: {
    DATA_LOAD_ERROR: "일정 데이터를 불러오지 못했습니다",
  },

  // 링크
  LINK: {
    ADDED: "링크가 추가되었습니다",
    UPDATED: "링크가 수정되었습니다",
    DELETED: "링크가 삭제되었습니다",
    ADD_ERROR: "링크 추가에 실패했습니다",
    UPDATE_ERROR: "링크 수정에 실패했습니다",
    DELETE_ERROR: "링크 삭제에 실패했습니다",
    SHARE_CREATED: "공유 링크가 생성되었습니다",
    SHARE_DELETED: "공유 링크가 삭제되었습니다",
    SHARE_CREATE_ERROR: "공유 링크 생성에 실패했습니다",
    SHARE_DELETE_ERROR: "공유 링크 삭제에 실패했습니다",
  },

  // 알림
  NOTIFICATION: {
    READ_ERROR: "읽음 처리에 실패했습니다.",
    READ_ERROR_NO_DOT: "읽음 처리에 실패했습니다",
  },

  // 멤버
  MEMBER: {
    INVITE_REQUIRED: "초대할 멤버를 선택해주세요",
    INVITE_ERROR: "멤버 초대에 실패했습니다",
    SELECT_REQUIRED: "멤버를 선택해주세요",
    NAME_SELECT_REQUIRED: "멤버 이름을 선택해주세요.",
  },

  // 위키
  WIKI: {
    CREATED: "위키 문서가 작성되었습니다.",
    UPDATED: "위키 문서가 수정되었습니다.",
    DELETED: "위키 문서가 삭제되었습니다.",
    TITLE_REQUIRED: "제목을 입력해주세요.",
    CONTENT_REQUIRED: "내용을 입력해주세요.",
  },

  // 하이라이트
  HIGHLIGHT: {
    CREATED: "하이라이트가 등록되었습니다.",
    DELETED: "하이라이트가 삭제되었습니다.",
  },

  // 영상
  VIDEO: {
    ADDED: "영상이 추가되었습니다",
    DELETED: "영상이 삭제되었습니다",
    ADD_ERROR: "영상 추가에 실패했습니다",
    DELETE_SIMPLE_ERROR: "삭제에 실패했습니다",
  },

  // 공지사항
  ANNOUNCEMENT: {
    CREATED: "공지사항이 등록되었습니다.",
    DELETED: "공지사항이 삭제되었습니다.",
  },

  // 에너지
  ENERGY: {
    SAVED: "에너지 기록이 저장되었습니다",
    DELETED: "기록이 삭제되었습니다",
  },

  // 챌린지
  CHALLENGE: {
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
  },

  // 도전 과제
  MISSION: {
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
  },

  // 평가
  EVALUATION: {
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
  },

  // 스트레칭 루틴
  ROUTINE: {
    ADDED: "루틴이 추가되었습니다.",
    UPDATED: "루틴이 수정되었습니다.",
    DELETED: "루틴이 삭제되었습니다.",
    NOT_FOUND: "루틴을 찾을 수 없습니다.",
    SELECT_REQUIRED: "루틴을 선택해주세요.",
    NAME_REQUIRED: "루틴 이름을 입력해주세요.",
    ADD_ERROR: "루틴 추가에 실패했습니다.",
    UPDATE_ERROR: "루틴 수정에 실패했습니다.",
    DELETE_ERROR: "루틴 삭제에 실패했습니다.",
  },

  // 운동
  EXERCISE: {
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
  },

  // 포토콜
  PHOTO_CALL: {
    ADDED: "포토콜 항목이 추가되었습니다",
    UPDATED: "항목이 수정되었습니다",
    DELETED: "항목이 삭제되었습니다",
    NOT_FOUND: "항목을 찾을 수 없습니다",
    TYPE_REQUIRED: "촬영 유형을 선택해주세요",
  },

  // 촬영 계획
  PHOTO_SHOOT: {
    ADDED: "촬영 계획이 추가되었습니다",
    UPDATED: "촬영 계획이 수정되었습니다",
    DELETED: "촬영 계획이 삭제되었습니다",
    NOT_FOUND: "촬영 계획을 찾을 수 없습니다",
    TITLE_REQUIRED: "촬영 계획 제목을 입력해주세요",
    ASSIGNEE_UPDATED: "촬영 담당자가 업데이트되었습니다",
  },

  // 관객
  AUDIENCE: {
    ADDED: "관객 수가 추가되었습니다",
    UPDATED: "항목이 수정되었습니다",
    DELETED: "항목이 삭제되었습니다",
    NOT_FOUND: "항목을 찾을 수 없습니다",
    DATE_REQUIRED: "공연 날짜를 입력해주세요",
    SEAT_REQUIRED: "총 좌석 수는 1 이상이어야 합니다",
    COUNT_REQUIRED: "관객 수는 0 이상이어야 합니다",
    PERFORMANCE_DATE_REQUIRED: "공연 날짜를 입력해주세요.",
  },

  // 그룹 챌린지
  GROUP_CHALLENGE: {
    CREATED: "챌린지가 생성되었습니다.",
    DELETED: "챌린지가 삭제되었습니다.",
  },

  // 문화/가치
  CULTURE: {
    VALUES_SAVED: "그룹 이상 가치가 저장되었습니다.",
    VALUES_SAVE_ERROR: "이상 가치 저장에 실패했습니다.",
    MEMBER_NAME_REQUIRED: "멤버 이름을 입력해주세요.",
    MEMBER_DUPLICATE: "이미 등록된 멤버 이름입니다.",
    PROFILE_ADD_ERROR: "프로필 추가에 실패했습니다.",
    PROFILE_NOT_FOUND: "프로필을 찾을 수 없습니다.",
    PROFILE_UPDATED: "프로필이 업데이트되었습니다.",
    PROFILE_UPDATE_ERROR: "프로필 업데이트에 실패했습니다.",
    PROFILE_DELETED: "프로필이 삭제되었습니다.",
    PROFILE_DELETE_ERROR: "프로필 삭제에 실패했습니다.",
  },

  // FAQ
  FAQ: {
    ADDED: "FAQ가 추가되었습니다",
    UPDATED: "FAQ가 수정되었습니다",
    DELETED: "FAQ가 삭제되었습니다",
    ADD_ERROR: "FAQ 추가에 실패했습니다",
    UPDATE_ERROR: "FAQ 수정에 실패했습니다",
    DELETE_ERROR: "FAQ 삭제에 실패했습니다",
  },

  // 규칙/가이드라인
  RULE: {
    ADDED: "규칙이 추가되었습니다",
    UPDATED: "규칙이 수정되었습니다",
    DELETED: "규칙이 삭제되었습니다",
    NOT_FOUND: "규칙을 찾을 수 없습니다",
    SECTION_ADDED: "규정 섹션이 추가되었습니다",
    SECTION_UPDATED: "규정 섹션이 수정되었습니다",
    SECTION_DELETED: "규정 섹션이 삭제되었습니다",
  },

  // 메모
  MEMO: {
    ADDED: "메모가 추가되었습니다",
    DELETED: "메모가 삭제되었습니다",
    ADD_ERROR: "메모 추가에 실패했습니다",
    DELETE_ERROR: "메모 삭제에 실패했습니다",
  },

  // 동선 노트
  BLOCKING: {
    ADDED: "동선 노트가 추가되었습니다",
    UPDATED: "동선 노트가 수정되었습니다",
    DELETED: "동선 노트가 삭제되었습니다",
    SECTION_TITLE_REQUIRED: "섹션 제목을 입력해주세요",
    SECTION_NOT_FOUND: "섹션을 찾을 수 없습니다",
    NOTE_NOT_FOUND: "노트를 찾을 수 없습니다",
  },

  // 소품
  PROP: {
    ADDED: "소품이 추가되었습니다",
    UPDATED: "소품이 수정되었습니다",
    DELETED: "소품이 삭제되었습니다",
    NOT_FOUND: "소품을 찾을 수 없습니다",
    NAME_REQUIRED: "소품 이름을 입력해주세요",
    QUANTITY_REQUIRED: "수량은 1 이상이어야 합니다",
  },

  // 의상 변경
  COSTUME_CHANGE: {
    ADDED: "의상 변경 항목이 추가되었습니다",
    UPDATED: "의상 변경 항목이 수정되었습니다",
    DELETED: "의상 변경 항목이 삭제되었습니다",
  },

  // 인터콤/통신
  INTERCOM: {
    ADDED: "채널이 추가되었습니다",
    UPDATED: "채널이 수정되었습니다",
    DELETED: "채널이 삭제되었습니다",
    NOT_FOUND: "채널을 찾을 수 없습니다",
    NAME_REQUIRED: "채널명을 입력해주세요",
    FREQ_REQUIRED: "주파수/채널 번호를 입력해주세요",
    SEND_ERROR: "메시지 발송에 실패했습니다",
  },

  // 스태프콜
  STAFF_CALL: {
    ADDED: "스태프가 추가되었습니다",
    NAME_REQUIRED: "스태프 이름을 입력해주세요",
    CALL_TIME_REQUIRED: "콜 시간을 입력해주세요",
    PARTICIPANT_NAME_REQUIRED: "참여자 이름을 입력해주세요",
    PARTICIPANT_ADDED: "인원이 추가되었습니다",
    PARTICIPANT_DELETED: "인원이 삭제되었습니다",
  },

  // 입장 게이트
  ENTRANCE: {
    ADDED: "게이트가 추가되었습니다",
    UPDATED: "게이트가 수정되었습니다",
    DELETED: "게이트가 삭제되었습니다",
    NOT_FOUND: "게이트를 찾을 수 없습니다",
    NAME_REQUIRED: "게이트 이름을 입력해주세요",
    NUMBER_REQUIRED: "게이트 번호는 1 이상이어야 합니다",
    RESET: "카운트가 초기화되었습니다",
    RESET_ALL: "모든 게이트 카운트가 초기화되었습니다",
    ALLOW_TYPE_REQUIRED: "허용 입장 유형을 하나 이상 선택해주세요",
  },

  // 쇼 타임라인
  SHOW_TIMELINE: {
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
  },

  // 공연장/장소
  VENUE: {
    ADDED: "공연장이 추가되었습니다",
    UPDATED: "공연장 정보가 수정되었습니다",
    DELETED: "공연장이 삭제되었습니다",
    NOT_FOUND: "공연장을 찾을 수 없습니다",
    NAME_REQUIRED: "공연장 이름을 입력해주세요",
  },

  // 곡
  SONG: {
    ADDED: "곡이 추가되었습니다",
    DELETED: "곡이 삭제되었습니다",
    TITLE_REQUIRED: "곡 제목을 입력해주세요",
    ADD_ERROR: "곡 추가에 실패했습니다",
  },

  // 파트
  PART: {
    ASSIGNED: "파트가 배정되었습니다",
    UPDATED: "파트가 수정되었습니다",
    DELETED: "파트가 삭제되었습니다",
    ASSIGN_ERROR: "파트 배정에 실패했습니다",
    UPDATE_ERROR: "파트 수정에 실패했습니다",
    DELETE_ERROR: "파트 삭제에 실패했습니다",
    DUPLICATE: "해당 멤버에게 이미 같은 파트 타입이 배정되어 있습니다",
  },

  // 곡 노트
  SONG_NOTES: {
    TRACK_ADDED: "트랙이 추가되었습니다",
    TRACK_UPDATED: "트랙이 수정되었습니다",
    TRACK_DELETED: "트랙이 삭제되었습니다",
    TRACK_NOT_FOUND: "트랙을 찾을 수 없습니다",
    TRACK_TITLE_REQUIRED: "트랙 제목을 입력해주세요",
  },

  // 장비/체크리스트
  EQUIPMENT: {
    CHECKLIST_CREATED: "체크리스트 기록이 생성되었습니다",
    CHECK_ADDED: "체크 항목이 추가되었습니다.",
    CHECK_DELETED: "체크 항목이 삭제되었습니다.",
    ALL_CHECK_REQUIRED: "모든 항목을 체크한 후 완료할 수 있습니다.",
  },

  // 온보딩
  ONBOARDING: {
    COMPLETED: "온보딩 완료!",
    STEP_COMPLETED: "단계 완료!",
    STEP_ADVANCED: "단계를 완료했습니다! 다음 단계가 열렸습니다.",
    STEP_REVERTED: "단계를 되돌렸습니다.",
    PROGRESS_ERROR: "진행률 업데이트에 실패했습니다.",
    PROGRESS_UPDATED: "진행률이 업데이트되었습니다.",
    TASK_COMPLETED: "과제 완료!",
    TASK_DELETE_ERROR: "할 일 추가에 실패했습니다",
    TASK_DELETED: "할 일이 삭제되었습니다",
  },

  // 리포트
  REPORT: {
    CREATED: "활동 리포트가 생성되었습니다.",
    DELETED: "리포트가 삭제되었습니다.",
    CREATE_ERROR: "리포트 생성에 실패했습니다.",
    DELETE_ERROR: "리포트 삭제에 실패했습니다.",
    FINANCE_EXPORTED: "재무 데이터를 내보냈습니다.",
    BOARD_EXPORTED: "게시판 활동 데이터를 내보냈습니다.",
  },

  // 회고
  RETROSPECTIVE: {
    CREATED: "회고가 생성되었습니다.",
    DELETED: "회고가 삭제되었습니다.",
    CREATE_ERROR: "회고 생성에 실패했습니다.",
    DELETE_ERROR: "회고 삭제에 실패했습니다.",
    ACTION_ITEM_REQUIRED: "액션 아이템을 입력해주세요.",
    ACTION_ITEM_ADDED: "액션 아이템이 추가되었습니다.",
    ACTION_ITEM_ADD_ERROR: "액션 아이템 추가에 실패했습니다.",
  },

  // 앨범/사진
  ALBUM: {
    CREATED: "앨범이 생성되었습니다.",
    DELETED: "앨범이 삭제되었습니다.",
    NOT_FOUND: "앨범을 찾을 수 없습니다.",
    NAME_REQUIRED: "앨범 이름을 입력해주세요.",
    CREATE_ERROR: "앨범 생성에 실패했습니다.",
    DELETE_ERROR: "앨범 삭제에 실패했습니다.",
    PHOTO_ADDED: "사진이 추가되었습니다.",
    PHOTO_UPDATED: "사진이 수정되었습니다.",
    PHOTO_DELETED: "사진이 삭제되었습니다.",
    PHOTO_TITLE_REQUIRED: "사진 제목을 입력해주세요.",
    PHOTO_ADD_ERROR: "사진 추가에 실패했습니다.",
    PHOTO_UPDATE_ERROR: "사진 수정에 실패했습니다.",
    PHOTO_DELETE_ERROR: "사진 삭제에 실패했습니다.",
    MEMORY_CREATED: "추억이 기록되었습니다.",
    MEMORY_DELETED: "추억이 삭제되었습니다.",
  },

  // 학습 경로
  LEARNING: {
    CREATED: "학습 경로가 생성되었습니다.",
    DELETED: "학습 경로가 삭제되었습니다.",
  },

  // 긴급 연락처
  EMERGENCY_CONTACT: {
    ADDED: "긴급 연락처가 추가되었습니다",
    UPDATED: "긴급 연락처가 수정되었습니다",
    DELETED: "긴급 연락처가 삭제되었습니다",
    NAME_REQUIRED: "긴급 연락처 이름을 입력해주세요",
    PHONE_REQUIRED: "긴급 연락처 전화번호를 입력해주세요",
  },

  // 의사결정
  DECISION: {
    CREATED: "의사결정이 기록되었습니다.",
    DELETED: "의사결정 기록이 삭제되었습니다.",
    DECIDER_REQUIRED: "결정자를 입력해주세요.",
  },

  // 모금
  FUNDRAISING: {
    GOAL_ADDED: "모금 목표가 추가되었습니다.",
    GOAL_UPDATED: "모금 목표가 수정되었습니다.",
    GOAL_DELETED: "모금 목표가 삭제되었습니다.",
    GOAL_ADD_ERROR: "모금 목표 추가에 실패했습니다.",
    GOAL_UPDATE_ERROR: "모금 목표 수정에 실패했습니다.",
    GOAL_DELETE_ERROR: "모금 목표 삭제에 실패했습니다.",
    CANCELLED: "모금이 취소되었습니다.",
    CANCEL_ERROR: "모금 취소에 실패했습니다.",
    GOAL_ACHIEVED: "목표 금액을 달성했습니다! 모금이 완료되었습니다.",
    AMOUNT_REQUIRED: "목표 금액은 0보다 커야 합니다.",
    ALREADY_CANCELLED: "이미 취소된 목표입니다.",
    ACTIVE_ONLY: "활성 상태의 목표에만 기부를 추가할 수 있습니다.",
    DONATION_ADDED: "기부금이 추가되었습니다.",
    DONATION_ADD_ERROR: "기부금 추가에 실패했습니다.",
    DONOR_REQUIRED: "기부자 이름을 입력해주세요.",
    DONATION_AMOUNT_REQUIRED: "기부 금액은 0보다 커야 합니다.",
  },

  // 기여
  CONTRIBUTION: {
    DELETED: "기여 기록이 삭제되었습니다.",
    ADD_ERROR: "기여 기록 추가에 실패했습니다.",
    DELETE_ERROR: "기여 기록 삭제에 실패했습니다.",
    GIVER_REQUIRED: "부여자를 입력해주세요",
    GIVER_NAME_REQUIRED: "부여자 이름을 입력해주세요.",
    POINTS_REQUIRED: "포인트를 입력해주세요 (0 제외)",
    POINTS_RANGE: "포인트는 1~10 사이여야 합니다.",
  },

  // 게스트 강사
  INSTRUCTOR: {
    CREATED: "강사가 등록되었습니다",
    UPDATED: "강사 정보가 수정되었습니다",
    DELETED: "강사가 삭제되었습니다",
    NOT_FOUND: "강사 정보를 찾을 수 없습니다",
    NAME_REQUIRED: "강사 이름을 입력해주세요",
    CLASS_ADDED: "수업 이력이 추가되었습니다",
    CLASS_DELETED: "수업 이력이 삭제되었습니다",
    CLASS_TOPIC_REQUIRED: "수업 주제를 입력해주세요",
    CLASS_DATE_REQUIRED: "수업 날짜를 선택해주세요",
  },

  // 보도자료
  PRESS: {
    ADDED: "보도자료가 추가되었습니다",
    UPDATED: "보도자료가 수정되었습니다",
    DELETED: "보도자료가 삭제되었습니다",
    NOT_FOUND: "보도자료를 찾을 수 없습니다",
    TITLE_REQUIRED: "보도자료 제목을 입력해주세요",
    MEDIA_REQUIRED: "매체명을 입력해주세요",
    MEDIA_ADDED: "매체가 추가되었습니다",
    MEDIA_DELETED: "매체가 삭제되었습니다",
  },

  // 성과
  PERFORMANCE_RECORD: {
    CREATED: "성과가 기록되었습니다",
    UPDATED: "성과가 수정되었습니다",
    DELETED: "성과 기록이 삭제되었습니다",
    ADD_ERROR: "성과 기록 추가에 실패했습니다",
    UPDATE_ERROR: "성과 기록 수정에 실패했습니다",
    DELETE_ERROR: "성과 기록 삭제에 실패했습니다",
  },

  // 리마인더
  REMINDER: {
    SEND_ERROR: "리마인더 발송에 실패했습니다",
  },

  // 설정
  SETTINGS: {
    SAVE_ERROR: "설정 저장에 실패했습니다.",
  },

  // 안내서/템플릿
  TEMPLATE: {
    ADDED: "템플릿이 추가되었습니다",
    UPDATED: "템플릿이 수정되었습니다",
    DELETED: "템플릿이 삭제되었습니다",
    NOT_FOUND: "템플릿을 찾을 수 없습니다",
    NAME_REQUIRED: "템플릿 이름을 입력해주세요",
    EMPTY: "템플릿 항목이 없습니다",
    TITLE_REQUIRED: "제목 템플릿을 입력해주세요",
    BODY_REQUIRED: "본문 템플릿을 입력해주세요",
  },

  // 즐겨찾기
  BOOKMARK: {
    ADDED: "즐겨찾기에 추가되었습니다",
    REMOVED: "즐겨찾기에서 제거되었습니다",
  },

  // 감사편지
  THANK_YOU: {
    ADDED: "감사편지가 추가되었습니다",
    UPDATED: "감사편지가 수정되었습니다",
    DELETED: "감사편지가 삭제되었습니다",
    CONTENT_REQUIRED: "감사편지 내용을 입력해주세요",
    SENT: "발송 완료로 표시되었습니다",
    SPONSOR_REQUIRED: "후원사명을 입력해주세요",
  },

  // 목표
  GOAL: {
    TITLE_REQUIRED: "목표 제목을 입력해주세요.",
    VALUE_REQUIRED: "목표값을 1 이상으로 입력해주세요.",
    COUNT_REQUIRED: "목표 횟수를 1 이상으로 입력해주세요.",
    NOT_FOUND: "목표를 찾을 수 없습니다.",
    UNIT_REQUIRED: "단위를 입력해주세요.",
  },

  // 활동
  ACTIVITY: {
    CONTENT_REQUIRED: "활동 내용을 입력해주세요.",
  },

  // 공연
  PERFORMANCE: {
    NAME_REQUIRED: "공연명을 입력해주세요.",
    DATE_REQUIRED: "공연 날짜를 입력해주세요.",
    DATE_REQUIRED_NO_DOT: "공연 날짜를 입력해주세요",
  },

  // 데이터
  DATA: {
    NO_ATTENDANCE: "해당 기간에 출석 데이터가 없습니다.",
    NO_FINANCE: "해당 기간에 재무 데이터가 없습니다.",
    NO_BOARD: "해당 기간에 게시판 데이터가 없습니다.",
    DUPLICATE_DATE: "해당 날짜에 이미 기록이 존재합니다",
  },

  // 날짜 유효성
  DATE: {
    START_END_REQUIRED: "시작일과 종료일을 입력해주세요.",
    START_END_REQUIRED_NO_DOT: "시작일과 종료일을 입력해주세요",
    START_TIME_REQUIRED: "시작 시간을 입력해주세요",
    END_AFTER_START: "종료일은 시작일 이후여야 합니다",
    END_LATER_THAN_START: "종료일은 시작일보다 늦어야 합니다.",
    END_TIME_AFTER_START: "종료 시간은 시작 시간 이후여야 합니다",
  },

  // 위캠백
  WINBACK: {
    MESSAGE_SEND_ERROR: "메시지 발송에 실패했습니다",
  },

  // 내역
  HISTORY: {
    DELETED: "내역이 삭제되었습니다",
  },

  // 버전
  VERSION: {
    UPDATED: "버전이 업데이트되었습니다",
  },

  // 인포메이션
  INFO: {
    MADE_DRAFT: "작성중으로 변경되었습니다",
    DEADLINE_REQUIRED: "마감일을 선택해주세요.",
    ASSIGNEE_REQUIRED: "담당자를 입력해주세요",
    ASSIGNEE_CHANGED: "담당자가 변경되었습니다",
    REASON_REQUIRED: "사유를 입력해주세요",
    GENRE_REQUIRED: "전문 장르를 입력해주세요",
    ARTIST_REQUIRED: "아티스트명을 입력해주세요",
    DATE_WRITTEN_REQUIRED: "작성일을 입력해주세요",
    AMBASSADOR_REQUIRED: "홍보 담당자를 입력해주세요",
    CALLSIGN_REQUIRED: "호출부호를 입력해주세요",
    BOOKING_STATUS_CHANGED: "예약 상태가 변경되었습니다",
    IMPLEMENTATION_DATE_UPDATED: "시행일이 업데이트되었습니다",
  },

  // 세션
  SESSION: {
    DELETED: "세션이 삭제되었습니다.",
    NOT_FOUND: "세션을 찾을 수 없습니다.",
  },

  // 기록
  RECORD: {
    NOT_FOUND: "기록을 찾을 수 없습니다",
    DELETED: "기록이 삭제되었습니다",
  },

  // 공지사항 (그룹)
  NOTICE: {
    CREATED: "공지사항이 등록되었습니다.",
    DELETED: "공지사항이 삭제되었습니다.",
  },

  // 온라인 이벤트
  EVENT: {
    REGISTERED: "이벤트가 등록되었습니다.",
  },

  // 기타
  MISC: {
    RESPONDED_ERROR: "응답 등록에 실패했습니다.",
    JOIN_ERROR: "참가에 실패했습니다.",
    DUPLICATE_MEMBER: "이미 참여 중인 멤버입니다",
    DUPLICATE_MEMBER_DOT: "이미 참가 중인 멤버입니다.",
    DUPLICATE_NAME: "이미 참여 중인 이름입니다.",
    RATING_RANGE: "평점은 1~5 사이여야 합니다",
    SCORE_RANGE: "평가는 1~5점 사이로 입력해주세요.",
    SKILL_LEVEL_ERROR: "해당 레벨 조합에 맞는 단계를 생성할 수 없습니다.",
    POINT_REQUIRED: "포인트를 입력해주세요 (0 제외)",
  },
} as const;
