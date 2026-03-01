/** 공통 토스트 메시지 */
export const COMMON_TOAST = {
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

  // 메모
  MEMO: {
    ADDED: "메모가 추가되었습니다",
    DELETED: "메모가 삭제되었습니다",
    ADD_ERROR: "메모 추가에 실패했습니다",
    DELETE_ERROR: "메모 삭제에 실패했습니다",
  },

  // 즐겨찾기
  BOOKMARK: {
    ADDED: "즐겨찾기에 추가되었습니다",
    REMOVED: "즐겨찾기에서 제거되었습니다",
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

  // 내역
  HISTORY: {
    DELETED: "내역이 삭제되었습니다",
  },

  // 버전
  VERSION: {
    UPDATED: "버전이 업데이트되었습니다",
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

  // 세션
  SESSION: {
    DELETED: "세션이 삭제되었습니다.",
    NOT_FOUND: "세션을 찾을 수 없습니다.",
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

  // 위캠백
  WINBACK: {
    MESSAGE_SEND_ERROR: "메시지 발송에 실패했습니다",
  },

  // 타임스탬프
  TIMESTAMP: {
    ADDED: "타임스탬프가 추가되었습니다.",
    ADD_ERROR: "타임스탬프 추가에 실패했습니다.",
    DELETED: "타임스탬프가 삭제되었습니다.",
  },

  // 리마인더
  REMINDER: {
    SEND_ERROR: "리마인더 발송에 실패했습니다",
  },

  // 전환/세트 변경
  SET_CHANGE: {
    SCENE_REQUIRED: "이전/다음 장면을 모두 입력하세요.",
    TARGET_TIME_REQUIRED: "목표 시간은 1초 이상이어야 합니다.",
    ITEM_ADDED: "전환 항목이 추가되었습니다.",
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
} as const;
