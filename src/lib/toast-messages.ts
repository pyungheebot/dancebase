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

  // 전환/세트 변경
  SET_CHANGE: {
    SCENE_REQUIRED: "이전/다음 장면을 모두 입력하세요.",
    TARGET_TIME_REQUIRED: "목표 시간은 1초 이상이어야 합니다.",
    ITEM_ADDED: "전환 항목이 추가되었습니다.",
  },

  // 리스크
  RISK: {
    TITLE_REQUIRED: "위험 요소 제목을 입력해주세요.",
    COUNTERMEASURE_REQUIRED: "대응 방안을 입력해주세요.",
    UPDATED: "리스크가 수정되었습니다.",
    REGISTERED: "리스크가 등록되었습니다.",
    DELETED: "리스크가 삭제되었습니다.",
  },

  // 케이터링
  CATERING: {
    TIME_REQUIRED: "식사 시간을 입력하세요.",
    MENU_REQUIRED: "메뉴 설명을 입력하세요.",
    HEADCOUNT_REQUIRED: "인원 수는 1명 이상이어야 합니다.",
    ITEM_ADDED: "케이터링 항목이 추가되었습니다.",
    ITEM_UPDATED: "케이터링 항목이 수정되었습니다.",
  },

  // 영상 피드백
  VIDEO_FEEDBACK: {
    TITLE_REQUIRED: "영상 제목을 입력해주세요.",
    URL_REQUIRED: "영상 URL을 입력해주세요.",
    ADDED: "영상이 추가되었습니다.",
    TIMESTAMP_REQUIRED: "타임스탬프를 입력해주세요.",
    TIMESTAMP_FORMAT: '타임스탬프는 "MM:SS" 형식으로 입력해주세요. (예: 01:30)',
    AUTHOR_REQUIRED: "작성자 이름을 입력해주세요.",
    COMMENT_REQUIRED: "코멘트 내용을 입력해주세요.",
    COMMENT_ADDED: "코멘트가 추가되었습니다.",
  },

  // 티켓
  TICKET: {
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
  },

  // 대형 편집기
  FORMATION_EDITOR: {
    MEMBER_REQUIRED: "멤버 이름을 입력하세요.",
    SECTION_REQUIRED: "구간 이름을 입력하세요.",
    SECTION_MAX: "구간은 최대 10개까지 추가할 수 있습니다.",
    MEMBER_REMOVED: "멤버가 무대에서 제거되었습니다.",
    NO_PREV_SECTION: "이전 구간이 없습니다.",
    COPY_SUCCESS: "이전 구간의 대형을 복사했습니다.",
    COPY_ERROR: "복사에 실패했습니다.",
    DUPLICATE_MEMBER: "은(는) 이미 이 구간에 추가되어 있습니다.",
  },

  // 마케팅 캠페인
  CAMPAIGN: {
    TASK_TITLE_REQUIRED: "태스크 제목을 입력해주세요.",
    NAME_REQUIRED: "캠페인 이름을 입력해주세요.",
    TASK_ADDED: "태스크가 추가되었습니다.",
    TASK_UPDATED: "태스크가 수정되었습니다.",
    TASK_DELETED: "태스크가 삭제되었습니다.",
    INFO_SAVED: "캠페인 정보가 저장되었습니다.",
  },

  // 무대 안전
  STAGE_SAFETY: {
    CHECK_CONTENT_REQUIRED: "점검 내용을 입력해주세요.",
    CHECK_ITEM_ADDED: "점검 항목이 추가되었습니다.",
    CHECK_TITLE_REQUIRED: "점검 제목을 입력해주세요.",
    CHECK_DATE_REQUIRED: "점검 일자를 선택해주세요.",
    CHECK_CREATED: "점검 기록이 생성되었습니다.",
    CHECK_DELETED: "점검 기록이 삭제되었습니다.",
    RESULT_UPDATED: "전체 결과가 업데이트되었습니다.",
  },

  // 동의서
  CONSENT: {
    MEMBER_NAME_REQUIRED: "멤버 이름을 입력해주세요.",
    BATCH_MEMBER_FORMAT: "멤버 이름을 한 줄에 한 명씩 입력해주세요.",
    ITEM_ADDED: "동의서 항목이 추가되었습니다.",
    ITEM_UPDATED: "동의서 항목이 수정되었습니다.",
    SIGNED: "서명 처리되었습니다.",
    SIGN_ERROR: "서명 처리에 실패했습니다.",
    REJECTED: "거부 처리되었습니다.",
    REJECT_ERROR: "거부 처리에 실패했습니다.",
    NO_ITEMS: "생성할 항목이 없습니다.",
  },

  // 피팅
  FITTING: {
    MEMBER_REQUIRED: "멤버 이름을 입력해주세요.",
    COSTUME_REQUIRED: "의상 이름을 입력해주세요.",
    RECORD_ADDED: "핏팅 기록이 추가되었습니다.",
    RECORD_UPDATED: "핏팅 기록이 수정되었습니다.",
    RECORD_DELETED: "핏팅 기록이 삭제되었습니다.",
  },

  // 체크인 이벤트
  CHECKIN_EVENT: {
    NAME_REQUIRED: "이벤트명을 입력해주세요.",
    DATE_REQUIRED: "날짜를 입력해주세요.",
    GATHERING_TIME_REQUIRED: "집합 시간을 입력해주세요.",
    DELETED: "이벤트가 삭제되었습니다.",
    MEMBER_ADD_ERROR: "멤버 추가에 실패했습니다.",
    CREATE_ERROR: "이벤트 생성에 실패했습니다. 필수 항목을 확인해주세요.",
  },

  // 연습 큐
  PRACTICE_QUEUE: {
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
  },

  // 라이브 피드
  LIVE_FEED: {
    MESSAGE_REQUIRED: "메시지를 입력해주세요.",
    AUTHOR_REQUIRED: "작성자를 입력해주세요.",
    UPDATED: "피드가 수정되었습니다.",
    ADDED: "피드가 추가되었습니다.",
    DELETED: "피드가 삭제되었습니다.",
  },

  // 의상 디자인
  COSTUME_DESIGN: {
    TITLE_REQUIRED: "디자인 제목을 입력해주세요.",
    DESIGNER_REQUIRED: "디자이너를 선택해주세요.",
    COMMENT_REQUIRED: "댓글 내용을 입력해주세요.",
    COMMENT_ADDED: "댓글을 추가했습니다.",
    VOTE_CANCELLED: "투표를 취소했습니다.",
    VOTED: "투표했습니다.",
    COMMENT_DELETED: "댓글을 삭제했습니다.",
    DESIGN_DELETED: "디자인을 삭제했습니다.",
    IDEA_ADDED: "디자인 아이디어를 추가했습니다.",
  },

  // 조명 큐
  LIGHTING_CUE: {
    TIME_FORMAT: '시간은 "MM:SS" 형식으로 입력해주세요. (예: 01:30)',
    ZONE_REQUIRED: "구역을 입력해주세요.",
    CUE_ADDED: "조명 큐가 추가되었습니다.",
    CUE_DELETED: "큐가 삭제되었습니다.",
  },

  // 포스터 관리
  POSTER: {
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
  },

  // 백스테이지 통신
  BACKSTAGE_COMM: {
    MESSAGE_REQUIRED: "메시지 내용을 입력하세요.",
    SENDER_REQUIRED: "발신자 이름을 입력하세요.",
    RECIPIENT_REQUIRED: "수신 대상(개인/팀)의 이름을 입력하세요.",
    MESSAGE_SENT: "메시지가 전송되었습니다.",
    MESSAGE_DELETED: "메시지가 삭제되었습니다.",
  },

  // 무대 통행증
  STAGE_PASS: {
    NAME_REQUIRED: "이름을 입력해주세요.",
    PASS_NUMBER_REQUIRED: "패스 번호를 입력해주세요.",
    UPDATED: "패스가 수정되었습니다.",
    ADDED: "패스가 추가되었습니다.",
    DELETED: "패스가 삭제되었습니다.",
  },

  // 설치 체크리스트
  SETUP_CHECKLIST: {
    CONTENT_REQUIRED: "항목 내용을 입력해주세요.",
    ITEM_ADDED: "항목이 추가되었습니다.",
    ITEM_UPDATED: "항목이 수정되었습니다.",
    ITEM_COMPLETED: "항목을 완료 처리했습니다.",
    ALL_RESET: "모든 항목이 미완료 상태로 초기화되었습니다.",
  },

  // 큐시트
  CUE_SHEET: {
    NAME_REQUIRED: "항목명을 입력해 주세요.",
    ITEM_ADDED: "큐 항목이 추가되었습니다.",
    ITEM_UPDATED: "큐 항목이 수정되었습니다.",
    ITEM_DELETED: "큐 항목이 삭제되었습니다.",
  },

  // 안무 노트
  CHOREO_NOTES: {
    SECTION_TITLE_REQUIRED: "구간 제목을 입력하세요.",
    SECTION_TIME_REQUIRED: "시작/종료 시간을 입력하세요.",
    SECTION_ADDED: "구간이 추가되었습니다.",
    SECTION_MAX: "구간은 노트당 최대 20개까지 추가할 수 있습니다.",
    SONG_REQUIRED: "곡명을 입력하세요.",
    NOTE_ADDED: "안무 노트가 추가되었습니다.",
    NOTE_MAX: "안무 노트는 최대 5개까지 추가할 수 있습니다.",
  },

  // 갤러리
  GALLERY: {
    ALBUM_NAME_REQUIRED: "앨범 이름을 입력해주세요.",
    PHOTO_TITLE_REQUIRED: "사진 제목을 입력해주세요.",
    ALBUM_SELECT_REQUIRED: "앨범을 선택해주세요.",
    PHOTO_DELETED: "사진을 삭제했습니다.",
    ALBUM_DELETED: "앨범을 삭제했습니다.",
    ALBUM_CREATED: "앨범을 만들었습니다.",
    PHOTO_ADDED: "사진을 추가했습니다.",
  },

  // 좌석 배치
  SEATING: {
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
  },

  // 의상 추적기
  WARDROBE: {
    COSTUME_NAME_REQUIRED: "의상명을 입력해주세요.",
    MEMBER_REQUIRED: "배정 멤버명을 입력해주세요.",
    COSTUME_UPDATED: "의상 정보가 수정되었습니다.",
    COSTUME_ADDED: "의상이 추가되었습니다.",
    COSTUME_DELETED: "의상이 삭제되었습니다.",
  },

  // 출연료
  PERFORMANCE_FEE: {
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
  },

  // 메이크업/헤어
  MAKEUP_HAIR: {
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
  },

  // 드레스 리허설
  DRESS_REHEARSAL: {
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
  },

  // 협찬품
  SPONSORED_GOODS: {
    ITEM_NAME_REQUIRED: "물품명을 입력해주세요.",
    SPONSOR_NAME_REQUIRED: "스폰서명을 입력해주세요.",
    QUANTITY_REQUIRED: "수량은 1 이상의 숫자여야 합니다.",
    ITEM_UPDATED: "물품 정보가 수정되었습니다.",
    ITEM_ADDED: "협찬품이 추가되었습니다.",
    DISTRIBUTE_ERROR: "배분에 실패했습니다.",
    MEMBER_REQUIRED: "멤버 이름을 입력해주세요.",
    DISTRIBUTE_QUANTITY_REQUIRED: "수량은 1 이상이어야 합니다.",
  },

  // 공연 크레딧
  SHOW_CREDITS: {
    NAME_REQUIRED: "이름을 입력해주세요",
    SECTION_ADDED: "섹션이 추가되었습니다",
    SECTION_DELETED: "섹션이 삭제되었습니다",
    SECTION_DELETE_ERROR: "섹션 삭제에 실패했습니다",
    MEMBER_ADD_ERROR: "인원 추가에 실패했습니다",
    MOVE_ERROR: "이동할 수 없습니다",
    TITLE_UPDATE_ERROR: "제목 수정에 실패했습니다",
  },

  // 스테이지 레이아웃
  STAGE_LAYOUT: {
    PLAN_NAME_REQUIRED: "플랜 이름을 입력해주세요.",
    PLAN_ADDED: "플랜이 추가되었습니다.",
    PLAN_DELETED: "플랜이 삭제되었습니다.",
    PLAN_DELETE_ERROR: "플랜 삭제에 실패했습니다.",
    LABEL_REQUIRED: "라벨을 입력해주세요.",
    ITEM_ADDED: "아이템이 추가되었습니다.",
    ITEM_UPDATED: "아이템이 수정되었습니다.",
    ITEM_DELETED: "아이템이 삭제되었습니다.",
    ITEM_DELETE_ERROR: "아이템 삭제에 실패했습니다.",
  },

  // 무대 효과
  STAGE_EFFECT: {
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
  },

  // 스테이지 메모
  STAGE_MEMO: {
    BOARD_TITLE_REQUIRED: "보드 제목을 입력해주세요.",
    MEMO_CONTENT_REQUIRED: "메모 내용을 입력해주세요.",
    BOARD_DELETED: "보드를 삭제했습니다.",
    MEMO_DELETED: "메모를 삭제했습니다.",
    BOARD_CREATED: "보드를 만들었습니다.",
    MEMO_ADDED: "메모를 추가했습니다.",
  },

  // 안무 버전
  CHOREO_VERSION: {
    SECTION_MAX: "구간은 최대 20개까지 추가할 수 있습니다.",
    LABEL_REQUIRED: "버전 라벨을 입력하세요. (예: 초안, 수정본)",
    VERSION_ADDED: "새 버전이 추가되었습니다.",
    VERSION_MAX: "버전은 최대 20개까지 추가할 수 있습니다.",
    SONG_TITLE_SAVED: "곡 제목이 저장되었습니다.",
    COMPARE_MAX: "두 버전만 선택할 수 있습니다.",
    COMPARE_SELECT: "비교할 두 버전을 선택하세요.",
  },

  // VIP 게스트
  VIP_GUEST: {
    NAME_REQUIRED: "게스트 이름을 입력해주세요.",
    INFO_UPDATED: "게스트 정보가 수정되었습니다.",
    ADDED: "VIP 게스트가 추가되었습니다.",
  },

  // 리뷰
  REVIEW: {
    NAME_REQUIRED: "이름을 입력해주세요.",
    DELETED: "리뷰가 삭제되었습니다.",
    REGISTERED: "리뷰가 등록되었습니다.",
  },

  // 기술 요구사항
  TECH_REQ: {
    EQUIPMENT_REQUIRED: "장비명을 입력해주세요.",
    QUANTITY_REQUIRED: "수량은 1 이상의 숫자여야 합니다.",
    EQUIPMENT_UPDATED: "장비 정보가 수정되었습니다.",
    EQUIPMENT_ADDED: "장비가 추가되었습니다.",
  },

  // 스테이지 대형
  STAGE_FORMATION: {
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
  },

  // 영상 라이브러리
  VIDEO_LIBRARY: {
    TITLE_REQUIRED: "제목을 입력해주세요.",
    URL_REQUIRED: "URL을 입력해주세요.",
    URL_HTTPS: "URL은 https://로 시작해야 합니다.",
    ADDED: "영상이 추가되었습니다.",
    INVALID_URL: "URL이 유효하지 않거나 최대 개수를 초과했습니다.",
  },

  // 프로그램북 편집기
  PROGRAM_BOOK_EDITOR: {
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
  },

  // 리허설 일정
  REHEARSAL_SCHEDULE: {
    TITLE_REQUIRED: "리허설 제목을 입력해주세요.",
    DATE_REQUIRED: "날짜를 선택해주세요.",
    START_TIME_REQUIRED: "시작 시간을 입력해주세요.",
    ADDED: "리허설 일정이 추가되었습니다.",
    UPDATED: "리허설 일정이 수정되었습니다.",
    DELETED: "리허설 일정이 삭제되었습니다.",
    COMPLETED: "리허설이 완료 처리되었습니다.",
    CANCELLED: "리허설이 취소되었습니다.",
  },

  // 사운드 큐
  SOUND_CUE: {
    CUE_NAME_REQUIRED: "큐 이름을 입력해주세요.",
    CUE_NUMBER_REQUIRED: "올바른 큐 번호를 입력해주세요.",
    SHEET_TITLE_REQUIRED: "시트 제목을 입력해주세요.",
    SHEET_ADDED: "큐시트가 추가되었습니다.",
    SHEET_UPDATED: "큐시트가 수정되었습니다.",
    SHEET_DELETED: "큐시트가 삭제되었습니다.",
    CUE_ADDED: "큐가 추가되었습니다.",
    CUE_UPDATED: "큐가 수정되었습니다.",
    CUE_DELETED: "큐가 삭제되었습니다.",
  },

  // 스폰서 트래킹
  SPONSOR_TRACKING: {
    NAME_REQUIRED: "후원사 이름을 입력해주세요.",
    AMOUNT_REQUIRED: "올바른 후원 금액을 입력해주세요.",
    ADDED: "스폰서가 추가되었습니다.",
    UPDATED: "스폰서 정보가 수정되었습니다.",
    PAYMENT_STATUS_ERROR: "입금 상태 변경에 실패했습니다.",
    BENEFIT_STATUS_ERROR: "혜택 상태 변경에 실패했습니다.",
  },

  // 의상 관리
  COSTUME_MGMT: {
    NAME_REQUIRED: "의상 이름을 입력하세요.",
    QUANTITY_REQUIRED: "수량은 1개 이상이어야 합니다.",
    REGISTERED: "의상이 등록되었습니다.",
    REGISTER_ERROR: "의상 등록에 실패했습니다.",
    MEMBER_REQUIRED: "멤버 이름을 입력하세요.",
    ASSIGN_ERROR: "배정에 실패했습니다. 재고가 부족하거나 이미 배정된 멤버입니다.",
  },

  // 음악 큐시트
  MUSIC_CUESHEET: {
    TITLE_REQUIRED: "큐시트 제목을 입력해주세요.",
    CREATED: "큐시트가 생성되었습니다.",
    SONG_NAME_REQUIRED: "곡명을 입력해주세요.",
    START_TIME_FORMAT: '시작 시간은 "분:초" 형식으로 입력해주세요. (예: 02:30)',
    PLAY_TIME_FORMAT: '재생 시간은 "분:초" 형식으로 입력해주세요. (예: 03:45)',
    ITEM_ADDED: "큐 항목이 추가되었습니다.",
  },

  // 런다운
  RUNDOWN: {
    TIME_REQUIRED: "시작 시간과 종료 시간을 입력해 주세요.",
    ACTIVITY_REQUIRED: "활동명을 입력해 주세요.",
    END_AFTER_START: "종료 시간은 시작 시간보다 늦어야 합니다.",
    ITEM_UPDATED: "항목이 수정되었습니다.",
    ITEM_ADDED: "런다운 항목이 추가되었습니다.",
  },

  // 커튼콜
  CURTAIN_CALL: {
    PLAN_NAME_REQUIRED: "플랜 이름을 입력해주세요.",
    PLAN_UPDATED: "플랜이 수정되었습니다.",
    PLAN_ADDED: "플랜이 추가되었습니다.",
    DESCRIPTION_REQUIRED: "설명을 입력해주세요.",
    DURATION_RANGE: "소요시간은 1 이상의 숫자여야 합니다.",
    STEP_UPDATED: "스텝이 수정되었습니다.",
    STEP_ADDED: "스텝이 추가되었습니다.",
    STEP_DELETED: "스텝이 삭제되었습니다.",
  },

  // 성과 체크인
  PERFORMANCE_CHECKIN: {
    EVENT_CREATED: "체크인 이벤트가 생성되었습니다.",
  },

  // 공연 준비도
  PERFORMANCE_READINESS: {
    ITEM_NAME_REQUIRED: "항목 이름을 입력해주세요.",
    ITEM_ADDED: "항목이 추가되었습니다.",
    ITEM_ADD_ERROR: "항목 추가에 실패했습니다.",
    CHECKLIST_DELETED: "체크리스트가 삭제되었습니다.",
    SHOW_NAME_REQUIRED: "공연/행사 이름을 입력해주세요.",
    CHECKLIST_CREATED: "체크리스트가 생성되었습니다.",
  },

  // 쇼 프로그램
  SHOW_PROGRAM: {
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
  },

  // 공연 셋리스트
  PERFORMANCE_SETLIST: {
    SONG_TITLE_REQUIRED: "곡 제목을 입력해주세요.",
    SHOW_TITLE_SAVED: "공연 제목이 저장되었습니다.",
    SONG_ADDED: "곡이 추가되었습니다.",
    SONG_UPDATED: "곡 정보가 수정되었습니다.",
    SONG_DELETED: "곡이 삭제되었습니다.",
  },

  // 셋리스트 관리
  SETLIST_MGMT: {
    SHOW_NAME_REQUIRED: "공연 이름을 입력해주세요.",
    SHOW_INFO_SAVED: "공연 정보가 저장되었습니다.",
    ITEM_TITLE_REQUIRED: "항목 제목을 입력해주세요.",
    ITEM_ADDED: "항목이 추가되었습니다.",
    ITEM_DELETED: "항목이 삭제되었습니다.",
  },

  // 공연 스폰서
  PERFORMANCE_SPONSOR: {
    NAME_REQUIRED: "스폰서 이름을 입력해주세요.",
    AMOUNT_REQUIRED: "후원 금액을 올바르게 입력해주세요.",
    FEE_AMOUNT_REQUIRED: "올바른 금액을 입력해주세요.",
    ADDED: "스폰서가 추가되었습니다.",
    UPDATED: "스폰서 정보가 수정되었습니다.",
    DELETED: "스폰서가 삭제되었습니다.",
  },

  // 안전 체크리스트
  SAFETY_CHECKLIST: {
    CONTENT_REQUIRED: "항목 내용을 입력해주세요.",
    ITEM_ADDED: "항목이 추가되었습니다.",
    ITEM_UPDATED: "항목이 수정되었습니다.",
    ALL_RESET: "모든 항목이 미확인 상태로 초기화되었습니다.",
    ITEM_DELETED: "항목이 삭제되었습니다.",
  },

  // 쇼 인벤토리
  SHOW_INVENTORY: {
    NAME_REQUIRED: "물품명을 입력해주세요.",
    QUANTITY_REQUIRED: "수량은 1 이상의 숫자여야 합니다.",
    ITEM_ADDED: "물품이 추가되었습니다.",
    ITEM_ADD_ERROR: "물품 추가에 실패했습니다. 물품명을 확인해주세요.",
    ITEM_DELETED: "물품이 삭제되었습니다.",
  },

  // 안무 구간
  CHOREO_SECTION: {
    NAME_REQUIRED: "구간 이름을 입력하세요.",
    START_TIME_REQUIRED: "시작 시간을 입력하세요.",
    END_TIME_REQUIRED: "종료 시간을 입력하세요.",
    COMPLETION_UPDATED: "완성도가 업데이트되었습니다.",
    ADD_ERROR: "구간 추가에 실패했습니다.",
  },

  // 의상 대여
  COSTUME_RENTAL: {
    NAME_REQUIRED: "의상 이름을 입력해주세요",
    ADDED: "의상을 추가했습니다",
    RENTER_REQUIRED: "대여자 이름을 입력해주세요",
    RETURN_DATE_REQUIRED: "반납 예정일을 선택해주세요",
  },

  // 관객 안내
  AUDIENCE_GUIDE: {
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
  },

  // 공연 후 보고서
  POST_SHOW_REPORT: {
    TITLE_REQUIRED: "보고서 제목을 입력해주세요.",
    DATE_REQUIRED: "공연 날짜를 선택해주세요.",
    SUMMARY_REQUIRED: "총평을 입력해주세요.",
    AUTHOR_REQUIRED: "작성자를 입력해주세요.",
    AUDIENCE_REQUIRED: "관객 수는 0 이상의 숫자를 입력해주세요.",
    REVENUE_REQUIRED: "매출은 0 이상의 숫자를 입력해주세요.",
    CREATED: "사후 분석 보고서가 작성되었습니다.",
    UPDATED: "보고서가 수정되었습니다.",
    DELETED: "보고서가 삭제되었습니다.",
  },

  // 관객 피드백
  AUDIENCE_FEEDBACK: {
    TITLE_REQUIRED: "설문 제목을 입력해주세요",
    CREATED: "설문이 생성되었습니다",
    SUBMITTED: "응답이 제출되었습니다",
    DELETED: "설문이 삭제되었습니다",
  },

  // 대형 노트
  FORMATION_NOTE: {
    NAME_REQUIRED: "대형 이름을 입력해주세요.",
    TIME_FORMAT: "시간은 MM:SS 형식으로 입력해주세요. (예: 1:30)",
    COORD_INVALID: "좌표 값이 유효하지 않습니다.",
    POSITION_UPDATED: "위치를 업데이트했습니다.",
    SNAPSHOT_ADDED: "스냅샷이 추가되었습니다.",
    SNAPSHOT_DELETED: "스냅샷이 삭제되었습니다.",
  },

  // 백스테이지 체크
  BACKSTAGE_CHECK: {
    EVENT_NAME_REQUIRED: "이벤트명을 입력해주세요.",
    DATE_REQUIRED: "날짜를 입력해주세요.",
    ITEM_TITLE_REQUIRED: "항목 제목을 입력해주세요.",
    SESSION_COMPLETED: "세션이 완료 처리되었습니다.",
    ALL_CHECK_REQUIRED: "모든 항목을 체크해야 완료할 수 있습니다.",
    SESSION_CREATE_ERROR: "세션 생성에 실패했습니다. 필수 항목을 확인해주세요.",
    CHECK_ITEM_ADDED: "체크 항목이 추가되었습니다.",
    CHECK_ITEM_ADD_ERROR: "항목 추가에 실패했습니다.",
  },

  // 프로그램북
  PROGRAM_BOOK: {
    SHOW_NAME_REQUIRED: "공연명을 입력해주세요.",
    SECTION_TITLE_REQUIRED: "섹션 제목을 입력해주세요.",
    INFO_SAVED: "프로그램북 기본 정보가 저장되었습니다.",
    SETUP_REQUIRED: "먼저 프로그램북 기본 정보를 입력해주세요.",
    SECTION_ADDED: "섹션이 추가되었습니다.",
    SECTION_UPDATED: "섹션이 수정되었습니다.",
    SECTION_DELETED: "섹션이 삭제되었습니다.",
  },

  // 사운드체크
  SOUNDCHECK: {
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
  },

  // 리허설 플래너
  REHEARSAL_PLANNER: {
    SHOW_TITLE_REQUIRED: "공연 제목을 입력해주세요",
    DATE_REQUIRED: "공연 날짜를 선택해주세요",
    DATE_FUTURE: "공연 날짜는 오늘 이후여야 합니다",
    CREATED: "리허설 플래너가 생성되었습니다",
    RESET: "리허설 플래너가 초기화되었습니다",
  },

  // 날씨
  WEATHER: {
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
  },

  // 스타일 투표
  STYLE_VOTE: {
    TOPIC_REQUIRED: "투표 주제를 입력해주세요.",
    CANDIDATE_TITLE_REQUIRED: "후보 제목을 입력해주세요.",
    SESSION_CLOSED: "투표를 마감했습니다.",
    SESSION_REOPENED: "투표를 다시 열었습니다.",
    SESSION_DELETED: "투표 세션을 삭제했습니다.",
    CLOSED_SESSION: "마감된 투표입니다.",
    VOTE_CANCELLED: "투표를 취소했습니다.",
    CANDIDATE_DELETED: "후보를 삭제했습니다.",
    CANDIDATE_ADDED: "후보를 추가했습니다.",
    SESSION_CREATED: "투표 세션을 생성했습니다.",
  },

  // 연습 플레이리스트
  PRACTICE_PLAYLIST: {
    SONG_REQUIRED: "곡명을 입력해주세요.",
    BPM_RANGE: "BPM은 1~300 사이의 숫자를 입력해주세요.",
    TIME_FORMAT: '시간은 "분:초" 형식으로 입력해주세요. (예: 3:45)',
    SONG_ADDED: "곡이 추가되었습니다.",
  },

  // 소셜 포스트 플래너
  SOCIAL_POST: {
    TITLE_REQUIRED: "포스트 제목을 입력해주세요.",
    CONTENT_REQUIRED: "본문 내용을 입력해주세요.",
    MANAGER_REQUIRED: "담당자를 입력해주세요.",
    DATE_REQUIRED: "예정 날짜를 선택해주세요.",
    ADDED: "소셜 포스트 계획이 추가되었습니다.",
    UPDATED: "포스트 계획이 수정되었습니다.",
    DELETED: "포스트 계획이 삭제되었습니다.",
  },

  // 앵콜 계획
  ENCORE: {
    PLAN_NAME_REQUIRED: "플랜 이름을 입력해주세요.",
    MAX_ENCORE_REQUIRED: "최대 앵콜 수는 1 이상이어야 합니다.",
    PLAN_UPDATED: "플랜이 수정되었습니다.",
    PLAN_ADDED: "플랜이 추가되었습니다.",
    SONG_TITLE_REQUIRED: "곡 제목을 입력해주세요.",
    SONG_DURATION_REQUIRED: "곡 길이는 1초 이상이어야 합니다.",
    SONG_UPDATED: "곡이 수정되었습니다.",
    SONG_ADDED: "곡이 추가되었습니다.",
    SONG_DELETED: "곡이 삭제되었습니다.",
  },

  // 메이크업 시트
  MAKEUP_SHEET: {
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
  },

  // 아티스트 라이더
  ARTIST_RIDER: {
    ARTIST_REQUIRED: "아티스트/팀명을 입력해 주세요.",
    REQUEST_REQUIRED: "요청 내용을 입력해 주세요.",
    QUANTITY_REQUIRED: "수량은 1 이상이어야 합니다.",
    ITEM_UPDATED: "항목이 수정되었습니다.",
    ITEM_ADDED: "항목이 추가되었습니다.",
    ITEM_DELETED: "항목이 삭제되었습니다.",
  },

  // 드레스 코드
  DRESS_CODE: {
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
  },

  // 안무 난도
  CHOREO_DIFFICULTY: {
    SONG_REQUIRED: "곡명을 입력하세요.",
    RATING_MAX: "평가는 최대 20개까지 등록할 수 있습니다.",
    REGISTERED: "난도 평가가 등록되었습니다.",
  },

  // 리허설 로그
  REHEARSAL_LOG: {
    DATE_REQUIRED: "날짜를 입력해주세요.",
    RECORD_DELETED: "기록이 삭제되었습니다.",
    ISSUE_ADDED: "이슈가 추가되었습니다.",
  },

  // 백스테이지 로그
  BACKSTAGE_LOG: {
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
  },

  // 마일스톤
  MILESTONE: {
    TITLE_REQUIRED: "마일스톤 제목을 입력해주세요",
    DATE_REQUIRED: "마감일을 선택해주세요",
    TASK_NAME_REQUIRED: "작업 이름을 입력해주세요",
    TASK_ADDED: "작업을 추가했습니다",
    ADDED: "마일스톤을 추가했습니다",
  },

  // 티켓 판매
  TICKET_SALES: {
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
  },

  // 관객 설문
  AUDIENCE_SURVEY: {
    TITLE_REQUIRED: "제목을 입력해주세요.",
    DATE_REQUIRED: "수집 날짜를 선택해주세요.",
    RESPONSE_COUNT_REQUIRED: "응답 수는 0 이상이어야 합니다.",
    RESULT_ADDED: "설문 결과가 추가되었습니다.",
    RESULT_UPDATED: "설문 결과가 수정되었습니다.",
    RESULT_DELETED: "설문 결과가 삭제되었습니다.",
  },

  // 전환 구간
  STAGE_TRANSITION: {
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
  },

  // 공연 회고
  PERFORMANCE_RETROSPECTIVE: {
    ITEM_ADDED: "항목이 추가되었습니다.",
  },

  // 감사 카드
  APPRECIATION_CARD: {
    RECIPIENT_REQUIRED: "받는 멤버를 선택해주세요.",
    CATEGORY_REQUIRED: "카테고리를 선택해주세요.",
    MESSAGE_REQUIRED: "메시지를 입력해주세요.",
    DELETED: "감사 카드가 삭제되었습니다.",
    LIKE_NAME_REQUIRED: "좋아요를 누르려면 멤버 이름이 필요합니다.",
  },

  // 출석부
  ATTENDANCE_BOOK: {
    DATE_REQUIRED: "날짜를 선택해주세요.",
    TITLE_REQUIRED: "제목을 입력해주세요.",
    NO_MEMBERS: "그룹에 멤버가 없습니다.",
    CREATED: "출석부가 생성되었습니다.",
    DELETED: "출석부가 삭제되었습니다.",
    ALL_PRESENT: "전체 출석 처리되었습니다.",
  },

  // 출결 예외
  ATTENDANCE_EXCEPTION: {
    MEMBER_REQUIRED: "멤버를 선택해주세요.",
    DATE_REQUIRED: "날짜를 입력해주세요.",
    REASON_REQUIRED: "사유를 입력해주세요.",
    DURATION_REQUIRED: "시간(분)은 1 이상의 숫자를 입력해주세요.",
    APPROVER_REQUIRED: "승인자 이름을 입력해주세요.",
    REGISTERED: "출결 예외가 등록되었습니다.",
    APPROVED: "출결 예외가 승인되었습니다.",
    REJECTED: "출결 예외가 거절되었습니다.",
    DELETED: "출결 예외가 삭제되었습니다.",
  },

  // 사유서
  ATTENDANCE_EXCUSE: {
    MEMBER_REQUIRED: "멤버 이름을 입력하세요.",
    DATE_REQUIRED: "날짜를 선택하세요.",
    REASON_REQUIRED: "상세 사유를 입력하세요.",
    SUBMITTED: "사유서가 제출되었습니다.",
    APPROVED: "사유서를 승인했습니다.",
    REJECTED: "사유서를 반려했습니다.",
    DELETED: "사유서가 삭제되었습니다.",
  },

  // 출석 예측
  ATTENDANCE_FORECAST: {
    SESSION_TITLE_REQUIRED: "세션 제목을 입력해주세요.",
    DATE_REQUIRED: "날짜를 선택해주세요.",
    SESSION_ADDED: "연습 세션이 추가되었습니다.",
    SESSION_DELETED: "세션이 삭제되었습니다.",
  },

  // 배틀 스코어보드
  BATTLE_SCOREBOARD: {
    PLAYER1_REQUIRED: "참가자 1 이름을 입력해주세요.",
    PLAYER2_REQUIRED: "참가자 2 이름을 입력해주세요.",
    SAME_NAME: "참가자 이름이 동일합니다.",
    DATE_REQUIRED: "날짜를 선택해주세요.",
    MATCH_RECORDED: "매치가 기록되었습니다.",
    MATCH_RECORD_ERROR: "매치 기록에 실패했습니다.",
    MATCH_DELETED: "매치가 삭제되었습니다.",
    MATCH_DELETE_ERROR: "매치 삭제에 실패했습니다.",
  },

  // 배틀 토너먼트
  BATTLE_TOURNAMENT: {
    NAME_REQUIRED: "토너먼트 이름을 입력해주세요.",
    MIN_PARTICIPANTS: "참가자를 2명 이상 선택해주세요.",
    CREATED: "토너먼트가 생성되었습니다.",
    STARTED: "토너먼트가 시작되었습니다.",
    START_ERROR: "토너먼트 시작에 실패했습니다.",
    RESULT_RECORDED: "결과가 기록되었습니다.",
    RESULT_ERROR: "결과 기록에 실패했습니다.",
    COMPLETED: "토너먼트가 완료되었습니다.",
    COMPLETE_ERROR: "토너먼트 완료에 실패했습니다.",
    DELETED: "토너먼트가 삭제되었습니다.",
    DELETE_ERROR: "토너먼트 삭제에 실패했습니다.",
  },

  // 생일 캘린더
  BIRTHDAY_CALENDAR: {
    MESSAGE_REQUIRED: "메시지 내용을 입력해주세요.",
    CONGRATULATION_ADDED: "축하 메시지가 추가되었습니다.",
    MEMBER_REQUIRED: "멤버 이름을 입력해주세요.",
    BIRTHDAY_FORMAT: "생일을 MM-DD 형식으로 입력해주세요. (예: 03-15)",
    BIRTHDAY_INVALID: "올바른 생일 날짜를 입력해주세요.",
    DELETED: "생일 정보가 삭제되었습니다.",
  },

  // 예산 플래너
  BUDGET_PLANNER: {
    PLAN_NAME_REQUIRED: "계획 이름을 입력해주세요.",
    ITEM_NAME_REQUIRED: "항목 이름을 입력해주세요.",
    BUDGET_AMOUNT_REQUIRED: "유효한 예산 금액을 입력해주세요.",
    ACTUAL_AMOUNT_REQUIRED: "유효한 실제 지출 금액을 입력해주세요.",
    PLAN_ADDED: "예산 계획이 추가되었습니다.",
    PLAN_UPDATED: "예산 계획이 수정되었습니다.",
    PLAN_DELETED: "예산 계획이 삭제되었습니다.",
    BUDGET_ITEM_ADDED: "예산 항목이 추가되었습니다.",
    BUDGET_ITEM_UPDATED: "예산 항목이 수정되었습니다.",
    BUDGET_ITEM_DELETED: "항목이 삭제되었습니다.",
  },

  // 카풀 관리
  CARPOOL: {
    PASSENGER_REQUIRED: "탑승자를 선택해주세요",
    DRIVER_REQUIRED: "운전자를 선택해주세요",
    DEPARTURE_REQUIRED: "출발지를 입력해주세요",
    DESTINATION_REQUIRED: "도착지를 입력해주세요",
    SEATS_REQUIRED: "좌석 수는 1 이상이어야 합니다",
    REGISTERED: "카풀이 등록되었습니다",
    DELETED: "카풀이 삭제되었습니다",
    BOARD_ERROR: "탑승에 실패했습니다 (좌석 부족 또는 이미 탑승)",
    ALIGHT_ERROR: "하차에 실패했습니다",
    STATUS_CHANGED: "상태가 변경되었습니다",
  },

  // 대회 준비
  COMPETITION_PREP: {
    COMPETITION_NAME_REQUIRED: "대회명을 입력해주세요.",
    DATE_REQUIRED: "대회 날짜를 선택해주세요.",
    VENUE_REQUIRED: "장소를 입력해주세요.",
    COMPETITION_ADDED: "대회가 추가되었습니다.",
    COMPETITION_ADD_ERROR: "대회 추가에 실패했습니다.",
    TASK_NAME_REQUIRED: "과제명을 입력해주세요.",
    CHECK_ITEM_ADDED: "체크 항목이 추가되었습니다.",
    CHECK_ITEM_ADD_ERROR: "항목 추가에 실패했습니다.",
    COMPETITION_DELETED: "대회가 삭제되었습니다.",
    ITEM_DELETED: "항목이 삭제되었습니다.",
  },

  // 댄스 용어
  DANCE_GLOSSARY: {
    TERM_REQUIRED: "용어명을 입력해주세요.",
    DEFINITION_REQUIRED: "정의를 입력해주세요.",
    TERM_UPDATED: "용어가 수정되었습니다.",
    TERM_REGISTERED: "용어가 등록되었습니다.",
    TERM_REGISTER_ERROR: "용어 등록에 실패했습니다.",
    TERM_DELETED: "용어가 삭제되었습니다.",
  },

  // 의사결정 투표
  DECISION_POLL: {
    TITLE_REQUIRED: "안건 제목을 입력해주세요.",
    DATE_REQUIRED: "마감일을 선택해주세요.",
    REGISTERED: "투표 안건이 등록되었습니다.",
    REGISTER_ERROR: "투표 등록에 실패했습니다.",
    NAME_REQUIRED: "이름을 입력해주세요.",
    STANCE_REQUIRED: "찬성/반대/보류 중 하나를 선택해주세요.",
    VOTED: "투표가 반영되었습니다.",
    COMPLETED: "투표가 완료되었습니다.",
    VOTE_ERROR: "투표에 실패했습니다.",
    VOTE_CLOSED: "투표가 종료되었습니다.",
    CLOSE_ERROR: "투표 종료에 실패했습니다.",
    DELETED: "투표가 삭제되었습니다.",
  },

  // 그룹 공지
  GROUP_ANNOUNCEMENT: {
    REGISTERED: "공지가 등록되었습니다.",
    DELETED: "공지를 삭제했습니다.",
    UPDATED: "공지를 수정했습니다.",
    TITLE_REQUIRED: "제목을 입력해주세요.",
    CONTENT_REQUIRED: "내용을 입력해주세요.",
    DATE_REQUIRED: "게시 날짜를 선택하세요.",
  },

  // 그룹 예산
  GROUP_BUDGET: {
    TRANSACTION_DELETED: "거래가 삭제되었습니다",
    CATEGORY_REQUIRED: "카테고리를 선택해주세요",
    CONTENT_REQUIRED: "내용을 입력해주세요",
    AMOUNT_INVALID: "올바른 금액을 입력해주세요",
    DATE_REQUIRED: "날짜를 선택해주세요",
    CATEGORY_NAME_REQUIRED: "카테고리명을 입력해주세요",
    CATEGORY_ADDED: "카테고리가 추가되었습니다",
    BUDGET_LIMIT_RELEASED: "예산 한도가 해제되었습니다",
    MONTHLY_BUDGET_SET: "월별 예산 한도가 설정되었습니다",
  },

  // 이벤트 RSVP
  EVENT_RSVP: {
    RSVP_ERROR: "RSVP 처리에 실패했습니다.",
  },

  // 그룹 규칙
  GROUP_RULES: {
    RULE_TITLE_REQUIRED: "규칙 제목을 입력해주세요.",
    RULE_CONTENT_REQUIRED: "규칙 내용을 입력해주세요.",
    RULE_ADDED: "규칙이 추가되었습니다.",
    RULE_ADD_ERROR: "규칙 추가에 실패했습니다.",
    RULE_UPDATED: "규칙이 수정되었습니다.",
    RULE_UPDATE_ERROR: "규칙 수정에 실패했습니다.",
    RULE_DELETED: "규칙이 삭제되었습니다.",
    RULE_CONFIRMED: "규칙을 확인했습니다.",
  },

  // 기념일
  GROUP_ANNIVERSARY: {
    TITLE_REQUIRED: "기념일 제목을 입력해주세요.",
    DATE_REQUIRED: "기념일 날짜를 선택해주세요.",
    ADDED: "기념일이 추가되었습니다.",
    UPDATED: "기념일이 수정되었습니다.",
    DELETED: "기념일이 삭제되었습니다.",
  },

  // 일정 관련 그룹
  GROUP_SCHEDULE: {
    DATE_TITLE_TIME_REQUIRED: "날짜, 제목, 시작 시간을 모두 입력해주세요.",
    PERSONAL_REGISTERED: "개인 일정이 등록되었습니다.",
  },

  // 장비 관련 그룹
  GROUP_EQUIPMENT: {
    RENTER_REQUIRED: "대여자를 입력해주세요.",
    DELETED: "대여 기록이 삭제되었습니다.",
    RENTAL_ERROR: "대여 처리 중 오류가 발생했습니다.",
    RENTAL_COMPLETED: "대여 처리가 완료되었습니다.",
    RENTAL_REGISTERED: "대여가 등록되었습니다.",
    RENTER_NAME_REQUIRED: "대여자 이름을 입력해주세요.",
    CANNOT_DELETE_RENTED: "대여 중인 장비는 삭제할 수 없습니다. 먼저 반납 처리해주세요.",
  },

  // 회의록
  MEETING_MINUTES: {
    DATE_REQUIRED: "회의 날짜를 입력해주세요.",
    TITLE_REQUIRED: "회의 제목을 입력해주세요.",
    REGISTER_ERROR: "회의록 등록에 실패했습니다.",
    REGISTERED: "회의록이 등록되었습니다.",
    DELETED: "회의록이 삭제되었습니다.",
    RECORDER_REQUIRED: "기록자를 입력해주세요.",
    ASSIGNEE_REQUIRED: "담당자를 입력하세요.",
    ASSIGNEE_CHANGE_ERROR: "담당자 변경에 실패했습니다.",
  },

  // 그룹 멘토
  GROUP_MENTOR: {
    RANDOM_MATCHED: "랜덤 매칭이 완료되었습니다.",
  },

  // 연습 피드백
  PRACTICE_FEEDBACK: {
    CONTENT_REQUIRED: "피드백 내용을 5자 이상 입력하세요.",
    CONTENT_SIMPLE_REQUIRED: "피드백 내용을 입력하세요.",
    REGISTER_ERROR: "피드백 등록에 실패했습니다.",
    REGISTERED: "피드백이 등록되었습니다.",
    DELETED: "피드백이 삭제되었습니다.",
    ANONYMOUS_SUBMITTED: "피드백이 익명으로 제출되었습니다.",
    SAVED: "피드백이 저장되었습니다.",
    SUBMITTED: "피드백이 제출되었습니다.",
    SUBMIT_ERROR: "피드백 제출에 실패했습니다.",
    SESSION_CREATED: "피드백 세션이 생성되었습니다.",
  },

  // QnA 게시판
  QNA_BOARD: {
    ANSWER_REQUIRED: "답변 내용을 입력하세요.",
    ANSWER_REQUIRED_DOT: "답변 내용을 입력해주세요.",
    ANSWER_REGISTER_ERROR: "답변 등록에 실패했습니다.",
    ANSWER_REGISTERED: "답변이 등록되었습니다.",
  },

  // 공유 메모
  SHARED_MEMO: {
    CONTENT_REQUIRED: "내용을 입력해주세요.",
    NOTE_DELETED: "노트가 삭제되었습니다.",
    NOTE_REGISTER_ERROR: "노트 등록에 실패했습니다.",
  },

  // 역할 배정
  ROLE_ASSIGNMENT: {
    DATE_REQUIRED: "날짜를 선택해주세요.",
    ASSIGNEE_REQUIRED: "대상 멤버를 입력해주세요.",
    NEW_ASSIGNEE_REQUIRED: "새 담당자를 입력하세요.",
    CHANGE_ERROR: "담당자 변경에 실패했습니다.",
    ROLE_REQUIRED: "역할 이름을 입력하세요.",
    START_DATE_REQUIRED: "시작일을 입력하세요.",
    ADD_ERROR: "역할 추가에 실패했습니다.",
  },

  // 플레이리스트
  PLAYLIST: {
    CREATED: "플레이리스트가 생성되었습니다.",
    DELETED: "플레이리스트가 삭제되었습니다.",
    TRACK_ADDED: "트랙이 추가되었습니다.",
    TRACK_DELETED: "트랙이 삭제되었습니다.",
    SONG_TITLE_REQUIRED: "곡 제목을 입력해주세요",
    SONG_TITLE_REQUIRED_DOT: "곡 제목을 입력해주세요.",
    SONG_NAME_REQUIRED: "곡명을 입력해주세요.",
    SONG_ADDED: "곡이 추가되었습니다.",
    SONG_DELETED: "곡이 삭제되었습니다.",
  },

  // 연습 체크인
  PRACTICE_CHECKIN: {
    QR_REQUIRED: "QR 코드를 입력해주세요.",
  },

  // 음악 라이선스
  MUSIC_LICENSE: {
    ADDED: "라이선스가 추가되었습니다.",
    UPDATED: "라이선스 정보가 수정되었습니다.",
    DELETED: "라이선스가 삭제되었습니다.",
    URL_REQUIRED: "URL을 입력해주세요.",
  },

  // 루틴 빌더
  ROUTINE_BUILDER: {
    NAME_REQUIRED: "루틴 이름을 입력해주세요.",
    CREATE_ERROR: "루틴 생성에 실패했습니다.",
    DELETED: "루틴이 삭제되었습니다.",
    TIME_RANGE: "시간은 1~300분 사이로 입력해주세요.",
    BLOCK_ADDED: "블록이 추가되었습니다.",
    BLOCK_ADD_ERROR: "블록 추가에 실패했습니다.",
    BLOCK_DELETED: "블록이 삭제되었습니다.",
    CLONE_ERROR: "복제에 실패했습니다.",
  },

  // 그룹 투표
  GROUP_VOTE: {
    TITLE_REQUIRED: "투표 제목을 입력하세요.",
    TITLE_REQUIRED_DOT: "투표 제목을 입력해주세요",
    QUESTION_REQUIRED: "투표 질문을 입력해주세요",
    CREATE_ERROR: "투표 생성에 실패했습니다",
    REGISTERED: "투표가 등록되었습니다.",
    VOTED: "투표했습니다",
    VOTER_NAME_REQUIRED: "투표자 이름을 입력해주세요.",
    CANNOT_VOTE: "투표할 수 없습니다.",
    VOTE_FAILED: "투표에 실패했습니다.",
    CANCELLED: "투표가 취소되었습니다",
    CREATED: "투표가 생성되었습니다",
    CREATED_DOT: "투표가 생성되었습니다.",
    ENDED: "투표가 종료되었습니다",
    ENDED_DOT: "투표가 종료되었습니다.",
    END_ERROR: "투표 종료에 실패했습니다.",
    COMPLETED: "투표가 완료되었습니다",
    COMPLETED_DOT: "투표가 완료되었습니다.",
    DELETED: "투표가 삭제되었습니다",
    DELETED_DOT: "투표가 삭제되었습니다.",
    REGISTER_ERROR: "투표 등록에 실패했습니다.",
    CHOICE_REQUIRED: "하나 이상의 선택지를 선택하세요.",
  },

  // 시간 캡슐
  TIME_CAPSULE: {
    MAX_EXCEEDED: "타임캡슐은 최대 30개까지 생성할 수 있습니다.",
    OPENED: "타임캡슐이 개봉되었습니다!",
    SEALED: "타임캡슐이 봉인되었습니다.",
    DELETED: "타임캡슐이 삭제되었습니다.",
    CREATED: "타임캡슐이 생성되었습니다.",
    OPEN_DATE_REQUIRED: "개봉 예정일을 선택해주세요.",
    OPEN_ERROR: "개봉에 실패했습니다.",
    OPEN_DATE_PAST: "개봉일을 선택해주세요.",
  },

  // 공유 파일
  SHARED_FILE: {
    NAME_REQUIRED: "파일 이름을 입력해주세요.",
    DELETED: "파일이 삭제되었습니다.",
    ADDED: "파일이 추가되었습니다.",
    FOLDER_NAME_REQUIRED: "폴더 이름을 입력해주세요.",
    FOLDER_RENAMED: "폴더 이름이 변경되었습니다.",
    FOLDER_DELETED: "폴더가 삭제되었습니다.",
    FOLDER_CREATED: "폴더가 생성되었습니다.",
  },

  // 타임스탬프
  TIMESTAMP: {
    ADDED: "타임스탬프가 추가되었습니다.",
    ADD_ERROR: "타임스탬프 추가에 실패했습니다.",
    DELETED: "타임스탬프가 삭제되었습니다.",
  },

  // 연습 하이라이트
  PRACTICE_HIGHLIGHT: {
    TITLE_REQUIRED: "하이라이트 제목을 입력해주세요.",
    REGISTERED: "하이라이트가 등록되었습니다.",
    DELETED: "하이라이트가 삭제되었습니다.",
  },

  // 그룹 공연 기록
  GROUP_PERFORMANCE: {
    SHOW_NAME_REQUIRED: "공연명을 입력해주세요.",
    SHOW_DATE_REQUIRED: "공연 날짜를 선택해주세요.",
    HISTORY_DELETED: "공연 기록이 삭제되었습니다.",
    SHOW_PERFORMANCE_REQUIRED: "공연/연습명을 입력해주세요.",
  },

  // 월별 하이라이트
  MONTHLY_HIGHLIGHT: {
    TITLE_REQUIRED: "하이라이트 제목을 입력해주세요.",
    REGISTERED: "하이라이트가 등록되었습니다.",
    DELETED: "하이라이트가 삭제되었습니다.",
  },

  // 세션 평가
  SESSION_RATING: {
    SCORE_REQUIRED: "평가 점수를 선택해주세요.",
    RATING_REQUIRED: "평점을 선택해주세요.",
    DIFFICULTY_REQUIRED: "난이도 별점을 선택해주세요.",
    EFFICIENCY_REQUIRED: "효율 별점을 선택해주세요.",
    EVALUATOR_REQUIRED: "평가자 이름을 입력해주세요.",
    IMPROVEMENT_REQUIRED: "개선할 점을 입력해주세요.",
    REGISTERED: "평가가 등록되었습니다.",
    DELETED: "평가가 삭제되었습니다.",
    ADD_ERROR: "평가 추가에 실패했습니다. (최대 200개)",
    RATING_REGISTERED: "평점이 등록되었습니다.",
  },

  // 타이머
  TIMER: {
    NO_CHANGE_RUNNING: "타이머 실행 중에는 설정을 변경할 수 없습니다.",
  },

  // 팀빌딩
  TEAM_BUILDING: {
    ACTIVITY_ADDED: "팀빌딩 활동이 추가되었습니다.",
    ACTIVITY_REQUIRED: "활동명을 입력해주세요.",
    DATE_REQUIRED: "날짜를 선택해주세요.",
    HOST_REQUIRED: "주최자를 입력해주세요.",
    RATING_REQUIRED: "별점을 선택해주세요.",
    FEEDBACK_SAVED: "피드백이 저장되었습니다.",
    LOGIN_REQUIRED: "참가하려면 로그인이 필요합니다.",
    JOIN_DONE: "참가 신청이 완료되었습니다.",
    JOIN_CANCELLED: "참가 취소되었습니다.",
    DELETED: "활동이 삭제되었습니다.",
  },

  // 장르 탐색기
  GENRE_EXPLORER: {
    TITLE_REQUIRED: "제목을 입력해주세요.",
    DESC_REQUIRED: "설명을 입력해주세요.",
    ADDED: "장르 정보가 추가되었습니다.",
    MEMBER_REQUIRED: "멤버를 선택해주세요.",
    NO_GENRES: "선택한 멤버에 해당 장르가 없습니다.",
    GENRE_REMOVED: "장르가 제거되었습니다.",
    DELETED: "장르 정보가 삭제되었습니다.",
  },

  // 동의서
  WAIVER: {
    TITLE_REQUIRED: "동의서 제목을 입력해주세요.",
    CONTENT_REQUIRED: "동의서 본문을 입력해주세요.",
    REGISTERED: "동의서가 등록되었습니다.",
    REGISTER_ERROR: "동의서 등록에 실패했습니다.",
    DELETED: "동의서가 삭제되었습니다.",
    DELETE_ERROR: "동의서 삭제에 실패했습니다.",
    AGREE_CHECK: "내용을 확인하고 동의 체크박스를 선택해주세요.",
  },

  // 학습 요청
  LEARNING_REQUEST: {
    REQUESTED: "학습 요청이 접수되었습니다.",
    REQUEST_ERROR: "학습 요청에 실패했습니다.",
  },

  // 스킬 매트릭스
  SKILL_MATRIX: {
    SKILL_NAME_REQUIRED: "기술 이름을 입력하세요",
    POINT_REQUIRED: "포인트는 1 이상의 숫자를 입력해주세요.",
    SKILL_EXISTS: "이미 존재하는 기술입니다",
    MEMBER_REQUIRED: "멤버 이름을 입력하세요",
    MEMBER_EXISTS: "이미 존재하는 멤버입니다",
    UPDATED: "업데이트되었습니다",
  },

  // 활동 기록
  ACTIVITY_LOG: {
    ACTIVITY_NAME_REQUIRED: "활동명을 입력해주세요.",
    DELETED: "활동이 삭제되었습니다.",
    RECORD_DELETED: "기록이 삭제되었습니다.",
  },

  // 회원비
  MEMBERSHIP_FEE: {
    AMOUNT_REQUIRED: "납부 금액을 입력해주세요.",
    DEADLINE_REQUIRED: "납부 기한을 선택해주세요.",
  },

  // 코칭 노트
  COACHING_NOTE: {
    ADDED: "코칭 노트가 추가되었습니다.",
    UPDATED: "코칭 노트가 수정되었습니다.",
  },

  // 목표 게시판
  GOAL_BOARD: {
    SUB_GOAL_ADD_ERROR: "하위 목표 추가에 실패했습니다.",
  },

  // 그룹 게시물
  GROUP_POST: {
    ADDED: "게시물이 추가되었습니다.",
    UPDATED: "게시물이 수정되었습니다.",
    DELETED: "게시물이 삭제되었습니다.",
  },

  // 카풀 (groups)
  GROUP_CARPOOL: {
    DEST_REQUIRED: "도착지를 입력하세요.",
    SEATS_REQUIRED: "탑승 가능 인원을 1명 이상 입력하세요.",
    PASSENGER_REQUIRED: "탑승자 이름을 입력하세요.",
    BOARD_ERROR: "탑승 신청에 실패했습니다. (좌석 부족 또는 마감)",
    PASSENGER_DELETED: "탑승자가 삭제되었습니다.",
    PASSENGER_DELETE_ERROR: "탑승자 삭제에 실패했습니다.",
    ALIGHT_ERROR: "하차에 실패했습니다",
  },

  // 회비 추적기
  DUES_TRACKER: {
    SHOW_NAME_REQUIRED: "공연/연습명을 입력해주세요.",
  },

  // 지출 승인
  EXPENSE_APPROVAL: {
    RECOMMENDATION_REQUIRED: "권장사항을 입력해주세요.",
  },

  // 일정 충돌
  SCHEDULE_CONFLICT: {
    ACTIVE_SET_CHANGED: "활성 세트가 변경되었습니다.",
  },

  // 장비 인벤토리
  EQUIPMENT_INVENTORY: {
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
  },

  // 장비 대여
  EQUIPMENT_RENTAL: {
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
  },

  // 이벤트 캘린더
  EVENT_CALENDAR: {
    TITLE_REQUIRED: "이벤트 제목을 입력해주세요.",
    DATE_REQUIRED: "날짜를 선택해주세요.",
    ADDED: "이벤트가 추가되었습니다.",
    DELETED: "이벤트가 삭제되었습니다.",
    RSVP_ERROR: "RSVP 처리에 실패했습니다.",
  },

  // 이벤트 스폰서십
  EVENT_SPONSORSHIP: {
    NAME_REQUIRED: "스폰서/협력사 이름을 입력해주세요.",
    EVENT_NAME_REQUIRED: "연관 이벤트명을 입력해주세요.",
    REGISTERED: "스폰서가 등록되었습니다.",
    REGISTER_ERROR: "스폰서 등록에 실패했습니다.",
    STATUS_CHANGED: "상태가 변경되었습니다.",
    STATUS_ERROR: "상태 변경에 실패했습니다.",
    DELETED: "스폰서가 삭제되었습니다.",
    DELETE_ERROR: "스폰서 삭제에 실패했습니다.",
    REFRESHED: "새로고침했습니다.",
  },

  // 포커스 타이머
  FOCUS_TIMER: {
    SETTING_ERROR: "타이머 실행 중에는 설정을 변경할 수 없습니다.",
  },

  // 그룹 카풀
  GROUP_CARPOOL_CARD: {
    DRIVER_REQUIRED: "운전자명을 입력하세요.",
    DEPARTURE_REQUIRED: "출발지를 입력하세요.",
    TIME_REQUIRED: "출발 시간을 선택하세요.",
    REGISTERED: "카풀이 등록되었습니다.",
    DELETED: "카풀이 삭제되었습니다.",
    STATUS_ERROR: "상태 변경에 실패했습니다.",
  },

  // 그룹 회비 추적기
  GROUP_DUES: {
    DUPLICATE_NAME: "이미 추가된 이름입니다.",
    YEAR_MONTH_INVALID: "올바른 년도/월을 입력해주세요.",
    AMOUNT_REQUIRED: "납부 금액을 입력해주세요.",
    DUE_DATE_REQUIRED: "납부 기한을 선택해주세요.",
    PERIOD_EXISTS: "이미 해당 월의 납부 기간이 존재합니다.",
    STATUS_ERROR: "상태 변경에 실패했습니다.",
    MEMBER_REQUIRED: "멤버를 선택해주세요.",
    BULK_ERROR: "일괄 변경에 실패했습니다.",
    MEMBER_ADD_ERROR: "멤버 추가에 실패했습니다.",
  },

  // 그룹 장비
  GROUP_EQUIPMENT_CARD: {
    NAME_REQUIRED: "장비 이름을 입력해주세요.",
    QUANTITY_MIN: "수량은 1 이상의 숫자를 입력해주세요.",
    RENTER_REQUIRED: "대여자 이름을 입력해주세요.",
    ADDED: "장비가 추가되었습니다.",
    UPDATED: "장비 정보가 수정되었습니다.",
    DELETED: "장비가 삭제되었습니다.",
    RENTAL_REGISTERED: "대여가 등록되었습니다.",
    RETURN_DONE: "반납이 완료되었습니다.",
    RENTAL_DELETED: "대여 기록이 삭제되었습니다.",
  },

  // 그룹 피드백함
  GROUP_FEEDBACK_BOX: {
    CONTENT_REQUIRED: "피드백 내용을 입력하세요.",
    MIN_CHARS: "피드백 내용을 5자 이상 입력하세요.",
    SUBMITTED: "피드백이 익명으로 제출되었습니다.",
    REPLY_REQUIRED: "답변 내용을 입력하세요.",
    REPLY_REGISTERED: "답변이 등록되었습니다.",
    REPLY_ERROR: "답변 등록에 실패했습니다.",
    DELETED: "피드백이 삭제되었습니다.",
  },

  // 분실물
  GROUP_LOST_FOUND: {
    ITEM_REQUIRED: "물품명을 입력하세요.",
    REPORTER_REQUIRED: "신고자명을 입력하세요.",
    DATE_REQUIRED: "분실 날짜를 선택하세요.",
    STATUS_ERROR: "상태 변경에 실패했습니다.",
    DELETED: "분실물이 삭제되었습니다.",
    UPDATED: "분실물 정보가 수정되었습니다.",
    REGISTERED: "분실물이 등록되었습니다.",
  },

  // 그룹 멘토
  GROUP_MENTOR_CARD: {
    SESSION_CONTENT_REQUIRED: "세션 내용을 입력해주세요.",
    RATING_REQUIRED: "평가 점수를 선택해주세요.",
    MENTOR_REQUIRED: "멘토 이름을 입력해주세요.",
    MENTEE_REQUIRED: "멘티 이름을 입력해주세요.",
    SAME_PERSON_ERROR: "멘토와 멘티는 다른 사람이어야 합니다.",
    MATCHING_ADDED: "멘토링 매칭이 추가되었습니다.",
    MATCHING_UPDATED: "매칭이 수정되었습니다.",
    MATCHING_DELETED: "매칭이 삭제되었습니다.",
    SESSION_RECORDED: "세션이 기록되었습니다.",
    SESSION_ADD_ERROR: "세션 추가에 실패했습니다.",
    SESSION_DELETED: "세션이 삭제되었습니다.",
  },

  // 그룹 음악 라이브러리
  GROUP_MUSIC_LIBRARY: {
    TITLE_REQUIRED: "곡 제목을 입력해주세요",
    ARTIST_REQUIRED: "아티스트를 입력해주세요",
  },

  // 벌칙 카드
  GROUP_PENALTY: {
    VIOLATION_REQUIRED: "위반 상세 내용을 입력하세요.",
    PENALTY_REQUIRED: "벌칙 내용을 입력하세요.",
    POINTS_MIN: "벌점은 1 이상이어야 합니다.",
    RULE_ADDED: "벌칙 규칙이 추가되었습니다.",
    MEMBER_REQUIRED: "멤버명을 입력하세요.",
    DATE_REQUIRED: "날짜를 선택하세요.",
    RECORD_ADDED: "벌칙 기록이 추가되었습니다.",
    RULE_DELETED: "규칙이 삭제되었습니다.",
    RECORD_DELETED: "기록이 삭제되었습니다.",
    POINTS_RESET: "벌점 기록이 초기화되었습니다.",
  },

  // 그룹 투표
  GROUP_POLLS: {
    VOTED: "투표했습니다",
    OPTION_REQUIRED: "선택지를 하나 이상 선택해주세요",
    QUESTION_REQUIRED: "투표 질문을 입력해주세요",
    OPTIONS_MIN: "선택지를 2개 이상 입력해주세요",
    DELETED: "투표가 삭제되었습니다",
    CANCELLED: "투표가 취소되었습니다",
  },

  // 그룹 연습 피드백
  GROUP_PRACTICE_FEEDBACK: {
    AUTHOR_REQUIRED: "작성자 이름을 입력해주세요.",
    DATE_REQUIRED: "연습 날짜를 입력해주세요.",
    GOOD_REQUIRED: "잘한 점을 입력해주세요.",
    IMPROVE_REQUIRED: "개선할 점을 입력해주세요.",
  },

  // 그룹 규칙
  GROUP_RULES_CARD: {
    AUTHOR_REQUIRED: "작성자를 선택해주세요.",
  },

  // 스킬 쉐어
  GROUP_SKILL_SHARE: {
    SKILL_REQUIRED: "스킬명을 입력해주세요.",
    PROVIDER_REQUIRED: "제공자명을 입력해주세요.",
    SKILL_REGISTERED: "스킬이 등록되었습니다.",
    SKILL_REGISTER_ERROR: "스킬 등록에 실패했습니다.",
    REQUESTER_REQUIRED: "요청자명을 입력해주세요.",
    REQUEST_SUBMITTED: "학습 요청이 접수되었습니다.",
    REQUEST_ERROR: "학습 요청에 실패했습니다.",
    SKILL_DELETED: "스킬이 삭제되었습니다.",
    REQUEST_DELETED: "요청이 삭제되었습니다.",
    STATUS_CHANGED: "상태가 변경되었습니다.",
  },

  // 그룹 스트릭
  GROUP_STREAK: {
    MEMBER_NAME_REQUIRED: "멤버명을 입력해주세요.",
    MEMBER_EXISTS: "이미 등록된 멤버명입니다.",
    MEMBER_ADD_ERROR: "멤버 추가에 실패했습니다.",
    MEMBER_DELETE_ERROR: "멤버 삭제에 실패했습니다.",
    ATTENDANCE_SAVE_ERROR: "출석 기록 저장에 실패했습니다.",
  },

  // 그룹 타임라인
  GROUP_TIMELINE: {
    DATE_REQUIRED: "날짜를 입력해주세요.",
    TITLE_REQUIRED: "제목을 입력해주세요.",
    EVENT_ADDED: "이벤트가 추가되었습니다.",
    EVENT_ADD_ERROR: "이벤트 추가에 실패했습니다.",
    EVENT_UPDATED: "이벤트가 수정되었습니다.",
    EVENT_UPDATE_ERROR: "이벤트 수정에 실패했습니다.",
    EVENT_DELETED: "이벤트가 삭제되었습니다.",
    EVENT_DELETE_ERROR: "이벤트 삭제에 실패했습니다.",
  },

  // 그룹 투표 카드
  GROUP_VOTE_CARD: {
    TITLE_REQUIRED: "투표 제목을 입력해주세요",
    OPTIONS_MIN: "선택지를 2개 이상 입력해주세요",
    AUTHOR_REQUIRED: "작성자 이름을 입력해주세요",
    CREATED: "투표가 생성되었습니다",
    NAME_REQUIRED: "이름을 입력해주세요",
    OPTION_REQUIRED: "선택지를 선택해주세요",
    ALREADY_VOTED: "이미 투표했거나 투표할 수 없습니다",
    COMPLETED: "투표가 완료되었습니다",
    STARTED: "투표가 시작되었습니다",
    DELETED: "투표가 삭제되었습니다",
    CREATE_ERROR: "투표 생성에 실패했습니다",
  },

  // 그룹 보팅 카드
  GROUP_VOTING: {
    CANNOT_VOTE: "투표할 수 없습니다.",
    OPTION_REQUIRED: "하나 이상의 선택지를 선택하세요.",
    REFLECTED: "투표가 반영되었습니다.",
    DELETED: "투표가 삭제되었습니다.",
    OPTIONS_MAX: "선택지는 최대 6개까지 추가할 수 있습니다.",
    OPTIONS_MIN: "선택지는 최소 2개 이상이어야 합니다.",
    TITLE_REQUIRED: "투표 제목을 입력하세요.",
    OPTIONS_INPUT_MIN: "선택지를 2개 이상 입력하세요.",
  },

  // 위시리스트
  GROUP_WISHLIST: {
    TITLE_REQUIRED: "제목을 입력해주세요.",
    PROPOSER_REQUIRED: "제안자 이름을 입력해주세요.",
    ADDED: "위시가 추가되었습니다.",
    ADD_ERROR: "위시 추가에 실패했습니다.",
    UPDATED: "위시가 수정되었습니다.",
    LIKE_ERROR: "좋아요 처리에 실패했습니다.",
    LIKED: "좋아요를 눌렀습니다.",
    DELETED: "위시가 삭제되었습니다.",
    STATUS_CHANGED: "상태가 변경되었습니다.",
    STATUS_ERROR: "상태 변경에 실패했습니다.",
  },

  // 성장 일지
  GROWTH_JOURNAL: {
    MEMBER_REQUIRED: "멤버 이름을 입력해주세요.",
    TITLE_REQUIRED: "제목을 입력해주세요.",
    CONTENT_REQUIRED: "내용을 입력해주세요.",
    ADDED: "성장 일지가 추가되었습니다.",
    UPDATED: "성장 일지가 수정되었습니다.",
    DELETED: "성장 일지가 삭제되었습니다.",
  },

  // 초청 강사
  GUEST_INSTRUCTOR: {
    REFRESHED: "새로고침했습니다.",
  },

  // 소감 벽
  IMPRESSION_WALL: {
    NAME_REQUIRED: "이름을 입력해주세요.",
    PERFORMANCE_REQUIRED: "공연/연습명을 입력해주세요.",
    CONTENT_REQUIRED: "소감 내용을 입력해주세요.",
    REGISTERED: "소감이 등록되었습니다.",
    REGISTER_ERROR: "소감 등록에 실패했습니다.",
    LIKE_ERROR: "좋아요 처리에 실패했습니다.",
    DELETED: "소감이 삭제되었습니다.",
  },

  // 미디어 갤러리
  MEDIA_GALLERY: {
    TITLE_REQUIRED: "제목을 입력해주세요.",
    URL_REQUIRED: "미디어 URL을 입력해주세요.",
    ALBUM_REQUIRED: "앨범 이름을 입력해주세요.",
    ADDED: "미디어가 추가되었습니다.",
    DELETED: "미디어가 삭제되었습니다.",
  },

  // 회의 투표
  MEETING_VOTE: {
    AGENDA_REQUIRED: "안건 질문을 입력해주세요.",
    OPTIONS_MIN: "선택지를 최소 2개 이상 입력해주세요.",
    AGENDA_REGISTERED: "안건이 등록되었습니다.",
    VOTER_REQUIRED: "투표자 이름을 입력해주세요.",
    OPTION_REQUIRED: "선택지를 하나 이상 선택해주세요.",
    VOTE_REGISTERED: "투표가 등록되었습니다.",
    VOTE_CANCELLED: "투표가 취소되었습니다.",
    AGENDA_CLOSED: "안건이 마감되었습니다.",
    AGENDA_DELETED: "안건이 삭제되었습니다.",
    OPTIONS_MAX: "선택지는 최대 10개까지 추가할 수 있습니다.",
    OPTIONS_MIN_2: "선택지는 최소 2개 이상 필요합니다.",
    TITLE_REQUIRED: "회의 제목을 입력해주세요.",
  },

  // 멤버 가용성
  MEMBER_AVAILABILITY: {
    END_AFTER_START: "종료 시각은 시작 시각보다 늦어야 합니다.",
    SLOT_ADDED: "시간대가 추가되었습니다.",
    MEMBER_REQUIRED: "멤버 이름을 입력하세요.",
    MEMBER_EXISTS: "이미 같은 이름의 멤버가 있습니다.",
  },

  // 멤버 생일
  MEMBER_BIRTHDAY: {
    NAME_REQUIRED: "멤버 이름을 입력해주세요.",
    MONTH_RANGE: "생일 월을 1~12 사이로 입력해주세요.",
    DAY_RANGE: "생일 일을 1~31 사이로 입력해주세요.",
    MESSAGE_REQUIRED: "축하 메시지를 입력해주세요.",
    MESSAGE_ADDED: "축하 메시지가 추가되었습니다.",
  },

  // 멤버십 비용
  MEMBERSHIP_FEE_CARD: {
    NO_MEMBERS: "멤버 목록이 없습니다.",
    AMOUNT_INVALID: "올바른 금액을 입력해주세요.",
    FEE_SAVED: "월 회비 금액이 저장됐습니다.",
  },

  // 정신 코칭
  MENTAL_COACHING: {
    MEMBER_REQUIRED: "대상 멤버를 입력해주세요.",
    COACH_REQUIRED: "코치 이름을 입력해주세요.",
    CONTENT_REQUIRED: "코칭 내용을 입력해주세요.",
    NOTE_DELETED: "코칭 노트가 삭제되었습니다.",
    STATUS_ERROR: "상태 변경에 실패했습니다.",
  },

  // 멘토링 매칭
  MENTORING_MATCH: {
    TOPIC_REQUIRED: "세션 주제를 입력해주세요.",
    TIME_INVALID: "유효한 시간(분)을 입력해주세요.",
    MENTOR_REQUIRED: "멘토를 선택해주세요.",
    MENTEE_REQUIRED: "멘티를 선택해주세요.",
    SAME_PERSON_ERROR: "멘토와 멘티는 다른 멤버여야 합니다.",
    SKILL_REQUIRED: "스킬 포커스를 1개 이상 입력해주세요.",
    CREATED: "멘토링 매칭이 생성되었습니다.",
    DELETED: "매칭이 삭제되었습니다.",
    SESSION_RECORDED: "세션이 기록되었습니다.",
    SESSION_ADD_ERROR: "세션 추가에 실패했습니다.",
    SESSION_DELETED: "세션이 삭제되었습니다.",
  },

  // 미션 보드
  MISSION_BOARD: {
    TITLE_REQUIRED: "미션 제목을 입력해주세요.",
    DESC_REQUIRED: "미션 설명을 입력해주세요.",
    POINTS_MIN: "포인트는 1 이상의 숫자를 입력해주세요.",
    MAX_COUNT_MIN: "최대 완료 수는 1 이상의 숫자를 입력해주세요.",
    ADDED: "미션이 추가되었습니다.",
    MEMBER_REQUIRED: "완료 처리를 위해 멤버 이름이 필요합니다.",
    COMPLETED: "미션을 완료했습니다!",
    STATUS_ERROR: "상태 변경에 실패했습니다.",
    DELETED: "미션이 삭제되었습니다.",
    DELETE_ERROR: "미션 삭제에 실패했습니다.",
  },

  // 음악 라이선스
  MUSIC_LICENSE_CARD: {
    SONG_REQUIRED: "곡명을 입력해주세요.",
    ARTIST_REQUIRED: "아티스트를 입력해주세요.",
    LICENSEE_REQUIRED: "사용자(licensee)를 입력해주세요.",
    SCOPE_REQUIRED: "사용 범위를 입력해주세요.",
  },

  // 음악 큐
  MUSIC_QUEUE: {
    TIME_INVALID: "올바른 시간을 입력해주세요. (예: 3:30)",
    TRACK_ADDED: "트랙이 추가되었습니다.",
    SET_NAME_REQUIRED: "세트 이름을 입력해주세요.",
    SET_ADDED: "세트가 추가되었습니다.",
    ACTIVE_SET_CHANGED: "활성 세트가 변경되었습니다.",
    TRACK_DELETED: "트랙이 삭제되었습니다.",
    TITLE_REQUIRED: "곡 제목을 입력해주세요.",
  },

  // 공연 히스토리
  PERFORMANCE_HISTORY: {
    DATE_REQUIRED: "날짜를 선택해주세요.",
    VENUE_REQUIRED: "장소를 입력해주세요.",
  },

  // 연습 체크인 카드
  PRACTICE_CHECKIN_CARD: {
    INFO_REQUIRED: "날짜, 제목, 시작 시간을 모두 입력해주세요.",
    SESSION_STARTED: "연습 세션이 시작되었습니다.",
    SESSION_ENDED: "세션이 종료되었습니다.",
    SESSION_DELETED: "세션이 삭제되었습니다.",
    ALL_CHECKIN: "전원 체크인 완료",
    ALL_ABSENT: "전원 결석 처리",
  },

  // 연습 피드백 카드
  PRACTICE_FEEDBACK_CARD: {
    MEMBER_REQUIRED: "멤버를 선택해주세요.",
    DATE_REQUIRED: "날짜를 선택해주세요.",
    MOOD_REQUIRED: "오늘의 무드를 선택해주세요.",
  },

  // 연습 피드백 수집
  PRACTICE_FEEDBACK_COLLECTION: {
    DATE_REQUIRED: "연습 날짜를 선택해주세요.",
    NAME_REQUIRED: "이름을 입력해주세요.",
    SESSION_DELETED: "세션이 삭제되었습니다.",
  },

  // 연습 목표 보드
  PRACTICE_GOAL_BOARD: {
    TITLE_REQUIRED: "목표 제목을 입력해주세요.",
    ADDED: "목표가 추가되었습니다.",
    ADD_ERROR: "목표 추가에 실패했습니다.",
    DELETED: "목표가 삭제되었습니다.",
  },

  // 연습 하이라이트 카드
  PRACTICE_HIGHLIGHT_CARD: {
    MEMBER_REQUIRED: "멤버를 선택해주세요.",
    CATEGORY_REQUIRED: "카테고리를 선택해주세요.",
    DATE_REQUIRED: "날짜를 선택해주세요.",
  },

  // 연습 일지
  PRACTICE_JOURNAL: {
    DATE_REQUIRED: "연습 날짜를 선택해주세요.",
    TIME_REQUIRED: "연습 시간을 입력해주세요.",
    AUTHOR_REQUIRED: "작성자 이름을 입력해주세요.",
    WRITTEN: "연습 일지가 작성되었습니다.",
    WRITE_ERROR: "일지 작성에 실패했습니다.",
    UPDATED: "연습 일지가 수정되었습니다.",
    UPDATE_ERROR: "일지 수정에 실패했습니다.",
    DELETED: "연습 일지가 삭제되었습니다.",
  },

  // 연습 노트
  PRACTICE_NOTES: {
    AUTHOR_REQUIRED: "작성자 이름을 입력해주세요.",
    TITLE_REQUIRED: "제목을 입력해주세요.",
    CONTENT_REQUIRED: "내용을 입력해주세요.",
    DATE_REQUIRED: "날짜를 선택해주세요.",
    NOTE_REGISTERED: "연습 노트가 등록되었습니다.",
    NOTE_REGISTER_ERROR: "노트 등록에 실패했습니다.",
    COMMENT_AUTHOR_REQUIRED: "코멘트 작성자 이름을 입력해주세요.",
    COMMENT_REQUIRED: "코멘트 내용을 입력해주세요.",
    COMMENT_REGISTERED: "코멘트가 등록되었습니다.",
    COMMENT_REGISTER_ERROR: "코멘트 등록에 실패했습니다.",
    NOTE_DELETED: "노트가 삭제되었습니다.",
    COMMENT_DELETED: "코멘트가 삭제되었습니다.",
  },

  // 연습 파트너
  PRACTICE_PARTNER: {
    NAME_REQUIRED: "이름을 입력해주세요.",
    MEMBER_REGISTERED: "멤버가 등록되었습니다.",
    DIFFERENT_MEMBERS: "서로 다른 두 멤버를 선택해주세요.",
    MATCH_CREATED: "매칭이 생성되었습니다.",
    RATING_REQUIRED: "별점을 선택해주세요.",
    REVIEW_REGISTERED: "평가가 등록되었습니다.",
    MIN_MEMBERS: "매칭 가능한 멤버가 2명 이상이어야 합니다.",
    RANDOM_MATCHED: "랜덤 매칭이 완료되었습니다.",
    MATCH_RELEASED: "매칭이 해제되었습니다.",
    MEMBER_DELETED: "멤버가 삭제되었습니다.",
  },

  // 연습 플레이리스트 카드
  PRACTICE_PLAYLIST_CARD: {
    TITLE_REQUIRED: "제목을 입력해주세요.",
  },

  // 연습실 예약
  PRACTICE_ROOM_BOOKING: {
    ROOM_REGISTERED: "연습실이 등록되었습니다.",
    ROOM_UPDATED: "연습실 정보가 수정되었습니다.",
    ROOM_DELETED: "연습실이 삭제되었습니다.",
    BOOKING_CREATED: "예약이 생성되었습니다.",
    BOOKING_CREATE_ERROR: "예약 생성에 실패했습니다. 시간 충돌을 확인해주세요.",
    BOOKING_UPDATED: "예약이 수정되었습니다.",
    BOOKING_UPDATE_ERROR: "수정에 실패했습니다. 시간 충돌을 확인해주세요.",
    BOOKING_DELETED: "예약이 삭제되었습니다.",
  },

  // 연습 타이머 로그
  PRACTICE_TIMER_LOG: {
    DATE_REQUIRED: "날짜를 입력해주세요.",
    TIME_INVALID: "올바른 시간(분)을 입력해주세요.",
    RECORD_ADDED: "연습 기록이 추가되었습니다.",
    RECORD_DELETED: "기록이 삭제되었습니다.",
  },

  // 연습 장소
  PRACTICE_VENUE: {
    NAME_REQUIRED: "장소명을 입력해주세요.",
    HOURLY_COST_INVALID: "시간당 비용을 올바르게 입력해주세요.",
    CAPACITY_INVALID: "수용 인원을 올바르게 입력해주세요.",
    AREA_INVALID: "면적을 올바르게 입력해주세요.",
    REGISTERED: "장소가 등록되었습니다.",
    RATING_REQUIRED: "평점을 선택해주세요.",
    RATING_REGISTERED: "평점이 등록되었습니다.",
    STATUS_CHANGED: "상태가 변경되었습니다.",
    DELETED: "장소가 삭제되었습니다.",
  },

  // Q&A 보드
  QNA_BOARD_CARD: {
    TITLE_REQUIRED: "제목을 입력해주세요.",
    CONTENT_REQUIRED: "질문 내용을 입력해주세요.",
    REGISTERED: "질문이 등록되었습니다.",
    DELETED: "질문이 삭제되었습니다.",
  },

  // QR 체크인
  QR_CHECK_IN: {
    MEMBER_REQUIRED: "멤버 이름을 입력해주세요.",
    QR_REQUIRED: "QR 코드를 입력해주세요.",
    SESSION_TITLE_REQUIRED: "세션 제목을 입력해주세요.",
    DATE_REQUIRED: "날짜를 선택해주세요.",
    START_TIME_REQUIRED: "시작 시간을 입력해주세요.",
    SESSION_CREATED: "새 출석 세션이 생성되었습니다.",
    SESSION_ENDED: "세션이 종료되었습니다.",
    SESSION_DELETED: "세션이 삭제되었습니다.",
  },

  // 읽음 확인
  READ_RECEIPT: {
    MEMBER_EXISTS: "이미 추가된 멤버입니다.",
    TITLE_REQUIRED: "제목을 입력해주세요.",
    CONTENT_REQUIRED: "내용을 입력해주세요.",
    TARGET_REQUIRED: "대상 멤버를 1명 이상 추가해주세요.",
    READ_MARKED: "읽음으로 표시했습니다.",
    READ_CANCELLED: "읽음을 취소했습니다.",
    NOTICE_DELETED: "공지를 삭제했습니다.",
    NOTICE_REGISTERED: "공지가 등록되었습니다.",
  },

  // 역할 로테이션
  ROLE_ROTATION: {
    MEMBER_REQUIRED: "멤버 이름을 입력하세요.",
    MEMBER_EXISTS: "이미 등록된 멤버이거나 추가에 실패했습니다.",
    MEMBER_DELETE_ERROR: "멤버 삭제에 실패했습니다.",
    WEEKS_RANGE: "주 수는 1~52 사이로 입력하세요.",
    NO_ROLES: "먼저 역할을 추가해주세요.",
    NO_MEMBERS: "먼저 멤버를 추가해주세요.",
    SCHEDULE_ERROR: "스케줄 생성에 실패했습니다.",
    STATUS_ERROR: "상태 변경에 실패했습니다.",
    ROLE_REQUIRED: "역할 이름을 입력하세요.",
    ROLE_ADD_ERROR: "역할 추가에 실패했습니다.",
    ROLE_DELETE_ERROR: "역할 삭제에 실패했습니다.",
  },

  // 일정 충돌 카드
  SCHEDULE_CONFLICT_CARD: {
    MEMBER_REQUIRED: "멤버를 선택해주세요.",
    TITLE_REQUIRED: "일정 제목을 입력해주세요.",
    DATE_REQUIRED: "날짜를 입력해주세요.",
    TIME_REQUIRED: "시작 시간과 종료 시간을 입력해주세요.",
    END_AFTER_START: "종료 시간은 시작 시간보다 늦어야 합니다.",
    SCHEDULE_ADDED: "개인 일정이 등록되었습니다.",
    DATE_SELECT: "날짜를 선택해주세요.",
    SCHEDULE_DELETED: "일정이 삭제되었습니다.",
  },

  // 세션 평가
  SESSION_RATING_CARD: {
    DATE_REQUIRED: "세션 날짜를 선택해주세요.",
    SESSION_REQUIRED: "세션명을 입력해주세요.",
    RATING_REQUIRED: "만족도 별점을 선택해주세요.",
  },

  // 공유 파일
  SHARED_FILES: {
    URL_REQUIRED: "URL을 입력해주세요.",
    FOLDER_REQUIRED: "폴더 이름을 입력해주세요.",
  },

  // 공유 자료함
  SHARED_LIBRARY: {
    TITLE_REQUIRED: "자료 제목을 입력해주세요.",
    UPLOADER_REQUIRED: "업로더 이름을 입력해주세요.",
    ADDED: "자료가 추가되었습니다.",
    DELETED: "자료가 삭제되었습니다.",
  },

  // 공유 메모
  SHARED_MEMO_CARD: {
    MAX_LIMIT: "메모는 최대 30개까지 저장할 수 있습니다.",
    ADDED: "메모가 추가되었습니다.",
    ADD_ERROR: "메모 추가에 실패했습니다.",
    DELETED: "메모가 삭제되었습니다.",
  },



  // 소셜 캘린더
  SOCIAL_CALENDAR: {
    TITLE_REQUIRED: "제목을 입력하세요.",
    DATE_REQUIRED: "게시 날짜를 선택하세요.",
    UPDATED: "게시물이 수정되었습니다.",
    ADDED: "게시물이 추가되었습니다.",
    DELETED: "게시물이 삭제되었습니다.",
  },



  // 감사 보드
  THANK_YOU_BOARD: {
    MEMBER_REQUIRED: "받는 멤버를 선택해주세요.",
    CATEGORY_REQUIRED: "카테고리를 선택해주세요.",
    MESSAGE_REQUIRED: "메시지를 입력해주세요.",
    MESSAGE_DELETED: "메시지가 삭제되었습니다.",
    LIKE_REQUIRED: "좋아요를 누르려면 멤버 이름이 필요합니다.",
  },

  // 타임캡슐 카드
  TIME_CAPSULE_CARD: {
    TITLE_REQUIRED: "캡슐 제목을 입력해주세요.",
    ALREADY_ADDED: "이미 추가된 레퍼토리입니다.",
    MAX_LIMIT: "타임캡슐은 최대 30개까지 생성할 수 있습니다.",
    CREATED: "스냅샷 타임캡슐이 생성되었습니다.",
    NAME_REQUIRED: "이름을 입력해주세요.",
    MESSAGE_REQUIRED: "메시지 내용을 입력해주세요.",
    MESSAGE_ADD_ERROR: "메시지 추가에 실패했습니다.",
    MESSAGE_ADDED: "메시지가 추가되었습니다.",
    SEALED: "스냅샷 타임캡슐이 봉인되었습니다.",
    SEAL_ERROR: "봉인에 실패했습니다.",
    OPENED: "스냅샷 타임캡슐이 개봉되었습니다!",
    OPEN_ERROR: "개봉에 실패했습니다.",
  },

  // 통합 캘린더
  UNIFIED_CALENDAR: {
    TITLE_REQUIRED: "제목을 입력해주세요.",
    DATE_REQUIRED: "날짜를 선택해주세요.",
    END_AFTER_START: "종료 시간은 시작 시간보다 늦어야 합니다.",
    ADDED: "일정이 추가되었습니다.",
    DELETED: "일정이 삭제되었습니다.",
  },

  // 장소 리뷰
  VENUE_REVIEW: {
    NAME_REQUIRED: "장소명을 입력해주세요.",
    OVERALL_RATING_REQUIRED: "종합 별점을 선택해주세요.",
    DETAIL_RATING_REQUIRED: "모든 세부 별점을 선택해주세요.",
    AUTHOR_REQUIRED: "작성자를 입력해주세요.",
    VISIT_DATE_REQUIRED: "방문일을 입력해주세요.",
    HOURLY_PRICE_INVALID: "시간당 가격을 올바르게 입력해주세요.",
    CAPACITY_INVALID: "수용 인원을 올바르게 입력해주세요.",
    REVIEW_REGISTERED: "리뷰가 등록되었습니다.",
    REVIEW_DELETED: "리뷰가 삭제되었습니다.",
  },

  // 영상 리뷰
  VIDEO_REVIEW: {
    TITLE_REQUIRED: "영상 제목을 입력해주세요.",
    DATE_REQUIRED: "촬영 날짜를 선택해주세요.",
    VIDEO_ADDED: "영상이 추가되었습니다.",
    VIDEO_ADD_ERROR: "영상 추가에 실패했습니다.",
    TIME_REQUIRED: "시간을 입력해주세요. (예: 01:23)",
    TIME_FORMAT_ERROR: "시간 형식이 올바르지 않습니다. MM:SS 형식으로 입력해주세요.",
    COMMENT_REQUIRED: "코멘트를 입력해주세요.",
    TIMESTAMP_ADDED: "타임스탬프가 추가되었습니다.",
    TIMESTAMP_ADD_ERROR: "타임스탬프 추가에 실패했습니다.",
    TIMESTAMP_DELETED: "타임스탬프가 삭제되었습니다.",
    VIDEO_DELETED: "영상 리뷰가 삭제되었습니다.",
  },

  // 면책 동의서 관리
  WAIVER_MANAGEMENT: {
    VALIDITY_MIN: "유효기간은 1 이상의 숫자를 입력해주세요.",
    MEMBER_REQUIRED: "멤버 이름을 입력해주세요.",
    SIGNATURE_EXISTS: "이미 유효한 서명이 존재하거나 처리 중 오류가 발생했습니다.",
    SIGNATURE_CANCELLED: "서명이 취소되었습니다.",
    CANCEL_ERROR: "서명 취소에 실패했습니다.",
  },

  // 워밍업 루틴
  WARMUP_ROUTINE: {
    NAME_REQUIRED: "루틴 이름을 입력해주세요.",
    CREATED: "루틴이 생성되었습니다.",
    EXERCISE_REQUIRED: "운동 이름을 입력해주세요.",
    TIME_INVALID: "올바른 시간(초)을 입력해주세요.",
    EXERCISE_ADDED: "운동이 추가되었습니다.",
    ROUTINE_DELETED: "루틴이 삭제되었습니다.",
    EXERCISE_DELETED: "운동이 삭제되었습니다.",
  },

  // 날씨 알림
  WEATHER_ALERT: {
    DATE_REQUIRED: "날짜를 선택해주세요.",
    RECOMMENDATION_REQUIRED: "권장사항을 입력해주세요.",
    ADDED: "날씨 알림이 추가되었습니다.",
    ADD_ERROR: "날씨 알림 추가에 실패했습니다.",
    DELETED: "날씨 알림이 삭제되었습니다.",
  },

  // 주간 시간표
  WEEKLY_TIMETABLE: {
    TITLE_REQUIRED: "제목을 입력해주세요.",
    TIME_REQUIRED: "시간을 입력해주세요.",
    END_AFTER_START: "종료 시간은 시작 시간보다 늦어야 합니다.",
    SLOT_ADDED: "슬롯이 추가되었습니다.",
    SLOT_ADD_ERROR: "슬롯 추가에 실패했습니다.",
    SLOT_DELETED: "슬롯이 삭제되었습니다.",
    SLOT_DELETE_ERROR: "슬롯 삭제에 실패했습니다.",
  },

  // 카풀 관리
  CARPOOL_MANAGEMENT: {
    PASSENGER_REQUIRED: "탑승자를 선택해주세요",
  },

  // 댄스 용어집
  DANCE_GLOSSARY_CARD: {
    TERM_REQUIRED: "용어명을 입력해주세요.",
    DEFINITION_REQUIRED: "정의를 입력해주세요.",
  },

  // 멤버 가용성 2
  MEMBER_AVAILABILITY2: {
    TIME_INVALID: "올바른 시간을 입력해주세요. (예: 01:23)",
  },

} as const;
