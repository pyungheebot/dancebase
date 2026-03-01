/** 그룹 관련 토스트 메시지 */

/** 그룹 챌린지 */
export const GROUP_CHALLENGE_TOAST = {
  CREATED: "챌린지가 생성되었습니다.",
  DELETED: "챌린지가 삭제되었습니다.",
} as const;

/** 문화/가치 */
export const CULTURE_TOAST = {
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
} as const;

/** FAQ */
export const FAQ_TOAST = {
  ADDED: "FAQ가 추가되었습니다",
  UPDATED: "FAQ가 수정되었습니다",
  DELETED: "FAQ가 삭제되었습니다",
  ADD_ERROR: "FAQ 추가에 실패했습니다",
  UPDATE_ERROR: "FAQ 수정에 실패했습니다",
  DELETE_ERROR: "FAQ 삭제에 실패했습니다",
} as const;

/** 규칙/가이드라인 */
export const RULE_TOAST = {
  ADDED: "규칙이 추가되었습니다",
  UPDATED: "규칙이 수정되었습니다",
  DELETED: "규칙이 삭제되었습니다",
  NOT_FOUND: "규칙을 찾을 수 없습니다",
  SECTION_ADDED: "규정 섹션이 추가되었습니다",
  SECTION_UPDATED: "규정 섹션이 수정되었습니다",
  SECTION_DELETED: "규정 섹션이 삭제되었습니다",
} as const;

/** 그룹 공지 */
export const GROUP_ANNOUNCEMENT_TOAST = {
  REGISTERED: "공지가 등록되었습니다.",
  DELETED: "공지를 삭제했습니다.",
  UPDATED: "공지를 수정했습니다.",
  TITLE_REQUIRED: "제목을 입력해주세요.",
  CONTENT_REQUIRED: "내용을 입력해주세요.",
  DATE_REQUIRED: "게시 날짜를 선택하세요.",
} as const;

/** 그룹 규칙 */
export const GROUP_RULES_TOAST = {
  RULE_TITLE_REQUIRED: "규칙 제목을 입력해주세요.",
  RULE_CONTENT_REQUIRED: "규칙 내용을 입력해주세요.",
  RULE_ADDED: "규칙이 추가되었습니다.",
  RULE_ADD_ERROR: "규칙 추가에 실패했습니다.",
  RULE_UPDATED: "규칙이 수정되었습니다.",
  RULE_UPDATE_ERROR: "규칙 수정에 실패했습니다.",
  RULE_DELETED: "규칙이 삭제되었습니다.",
  RULE_CONFIRMED: "규칙을 확인했습니다.",
} as const;

/** 그룹 규칙 카드 */
export const GROUP_RULES_CARD_TOAST = {
  AUTHOR_REQUIRED: "작성자를 선택해주세요.",
} as const;

/** 기념일 */
export const GROUP_ANNIVERSARY_TOAST = {
  TITLE_REQUIRED: "기념일 제목을 입력해주세요.",
  DATE_REQUIRED: "기념일 날짜를 선택해주세요.",
  ADDED: "기념일이 추가되었습니다.",
  UPDATED: "기념일이 수정되었습니다.",
  DELETED: "기념일이 삭제되었습니다.",
} as const;

/** 그룹 장비 */
export const GROUP_EQUIPMENT_TOAST = {
  RENTER_REQUIRED: "대여자를 입력해주세요.",
  DELETED: "대여 기록이 삭제되었습니다.",
  RENTAL_ERROR: "대여 처리 중 오류가 발생했습니다.",
  RENTAL_COMPLETED: "대여 처리가 완료되었습니다.",
  RENTAL_REGISTERED: "대여가 등록되었습니다.",
  RENTER_NAME_REQUIRED: "대여자 이름을 입력해주세요.",
  CANNOT_DELETE_RENTED: "대여 중인 장비는 삭제할 수 없습니다. 먼저 반납 처리해주세요.",
} as const;

/** 그룹 장비 카드 */
export const GROUP_EQUIPMENT_CARD_TOAST = {
  NAME_REQUIRED: "장비 이름을 입력해주세요.",
  QUANTITY_MIN: "수량은 1 이상의 숫자를 입력해주세요.",
  RENTER_REQUIRED: "대여자 이름을 입력해주세요.",
  ADDED: "장비가 추가되었습니다.",
  UPDATED: "장비 정보가 수정되었습니다.",
  DELETED: "장비가 삭제되었습니다.",
  RENTAL_REGISTERED: "대여가 등록되었습니다.",
  RETURN_DONE: "반납이 완료되었습니다.",
  RENTAL_DELETED: "대여 기록이 삭제되었습니다.",
} as const;

/** 회의록 */
export const MEETING_MINUTES_TOAST = {
  DATE_REQUIRED: "회의 날짜를 입력해주세요.",
  TITLE_REQUIRED: "회의 제목을 입력해주세요.",
  REGISTER_ERROR: "회의록 등록에 실패했습니다.",
  REGISTERED: "회의록이 등록되었습니다.",
  DELETED: "회의록이 삭제되었습니다.",
  RECORDER_REQUIRED: "기록자를 입력해주세요.",
  ASSIGNEE_REQUIRED: "담당자를 입력하세요.",
  ASSIGNEE_CHANGE_ERROR: "담당자 변경에 실패했습니다.",
} as const;

/** 그룹 멘토 */
export const GROUP_MENTOR_TOAST = {
  RANDOM_MATCHED: "랜덤 매칭이 완료되었습니다.",
} as const;

/** 그룹 멘토 카드 */
export const GROUP_MENTOR_CARD_TOAST = {
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
} as const;

/** 그룹 음악 라이브러리 */
export const GROUP_MUSIC_LIBRARY_TOAST = {
  TITLE_REQUIRED: "곡 제목을 입력해주세요",
  ARTIST_REQUIRED: "아티스트를 입력해주세요",
} as const;

/** 그룹 투표 */
export const GROUP_VOTE_TOAST = {
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
} as const;

/** 그룹 투표 카드 */
export const GROUP_VOTE_CARD_TOAST = {
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
} as const;

/** 그룹 보팅 카드 */
export const GROUP_VOTING_TOAST = {
  CANNOT_VOTE: "투표할 수 없습니다.",
  OPTION_REQUIRED: "하나 이상의 선택지를 선택하세요.",
  REFLECTED: "투표가 반영되었습니다.",
  DELETED: "투표가 삭제되었습니다.",
  OPTIONS_MAX: "선택지는 최대 6개까지 추가할 수 있습니다.",
  OPTIONS_MIN: "선택지는 최소 2개 이상이어야 합니다.",
  TITLE_REQUIRED: "투표 제목을 입력하세요.",
  OPTIONS_INPUT_MIN: "선택지를 2개 이상 입력하세요.",
} as const;

/** 그룹 투표 (polls) */
export const GROUP_POLLS_TOAST = {
  VOTED: "투표했습니다",
  OPTION_REQUIRED: "선택지를 하나 이상 선택해주세요",
  QUESTION_REQUIRED: "투표 질문을 입력해주세요",
  OPTIONS_MIN: "선택지를 2개 이상 입력해주세요",
  DELETED: "투표가 삭제되었습니다",
  CANCELLED: "투표가 취소되었습니다",
} as const;

/** 위시리스트 */
export const GROUP_WISHLIST_TOAST = {
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
} as const;

/** 성장 일지 */
export const GROWTH_JOURNAL_TOAST = {
  MEMBER_REQUIRED: "멤버 이름을 입력해주세요.",
  TITLE_REQUIRED: "제목을 입력해주세요.",
  CONTENT_REQUIRED: "내용을 입력해주세요.",
  ADDED: "성장 일지가 추가되었습니다.",
  UPDATED: "성장 일지가 수정되었습니다.",
  DELETED: "성장 일지가 삭제되었습니다.",
} as const;

/** 초청 강사 */
export const GUEST_INSTRUCTOR_TOAST = {
  REFRESHED: "새로고침했습니다.",
} as const;

/** 소감 벽 */
export const IMPRESSION_WALL_TOAST = {
  NAME_REQUIRED: "이름을 입력해주세요.",
  PERFORMANCE_REQUIRED: "공연/연습명을 입력해주세요.",
  CONTENT_REQUIRED: "소감 내용을 입력해주세요.",
  REGISTERED: "소감이 등록되었습니다.",
  REGISTER_ERROR: "소감 등록에 실패했습니다.",
  LIKE_ERROR: "좋아요 처리에 실패했습니다.",
  DELETED: "소감이 삭제되었습니다.",
} as const;

/** 회의 투표 */
export const MEETING_VOTE_TOAST = {
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
} as const;

/** 그룹 카풀 */
export const GROUP_CARPOOL_TOAST = {
  DEST_REQUIRED: "도착지를 입력하세요.",
  SEATS_REQUIRED: "탑승 가능 인원을 1명 이상 입력하세요.",
  PASSENGER_REQUIRED: "탑승자 이름을 입력하세요.",
  BOARD_ERROR: "탑승 신청에 실패했습니다. (좌석 부족 또는 마감)",
  PASSENGER_DELETED: "탑승자가 삭제되었습니다.",
  PASSENGER_DELETE_ERROR: "탑승자 삭제에 실패했습니다.",
  ALIGHT_ERROR: "하차에 실패했습니다",
} as const;

/** 그룹 카풀 카드 */
export const GROUP_CARPOOL_CARD_TOAST = {
  DRIVER_REQUIRED: "운전자명을 입력하세요.",
  DEPARTURE_REQUIRED: "출발지를 입력하세요.",
  TIME_REQUIRED: "출발 시간을 선택하세요.",
  REGISTERED: "카풀이 등록되었습니다.",
  DELETED: "카풀이 삭제되었습니다.",
  STATUS_ERROR: "상태 변경에 실패했습니다.",
} as const;

/** 그룹 피드백함 */
export const GROUP_FEEDBACK_BOX_TOAST = {
  CONTENT_REQUIRED: "피드백 내용을 입력하세요.",
  MIN_CHARS: "피드백 내용을 5자 이상 입력하세요.",
  SUBMITTED: "피드백이 익명으로 제출되었습니다.",
  REPLY_REQUIRED: "답변 내용을 입력하세요.",
  REPLY_REGISTERED: "답변이 등록되었습니다.",
  REPLY_ERROR: "답변 등록에 실패했습니다.",
  DELETED: "피드백이 삭제되었습니다.",
} as const;

/** 분실물 */
export const GROUP_LOST_FOUND_TOAST = {
  ITEM_REQUIRED: "물품명을 입력하세요.",
  REPORTER_REQUIRED: "신고자명을 입력하세요.",
  DATE_REQUIRED: "분실 날짜를 선택하세요.",
  STATUS_ERROR: "상태 변경에 실패했습니다.",
  DELETED: "분실물이 삭제되었습니다.",
  UPDATED: "분실물 정보가 수정되었습니다.",
  REGISTERED: "분실물이 등록되었습니다.",
} as const;

/** 그룹 연습 피드백 */
export const GROUP_PRACTICE_FEEDBACK_TOAST = {
  AUTHOR_REQUIRED: "작성자 이름을 입력해주세요.",
  DATE_REQUIRED: "연습 날짜를 입력해주세요.",
  GOOD_REQUIRED: "잘한 점을 입력해주세요.",
  IMPROVE_REQUIRED: "개선할 점을 입력해주세요.",
} as const;

/** 스킬 쉐어 */
export const GROUP_SKILL_SHARE_TOAST = {
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
} as const;

/** 그룹 스트릭 */
export const GROUP_STREAK_TOAST = {
  MEMBER_NAME_REQUIRED: "멤버명을 입력해주세요.",
  MEMBER_EXISTS: "이미 등록된 멤버명입니다.",
  MEMBER_ADD_ERROR: "멤버 추가에 실패했습니다.",
  MEMBER_DELETE_ERROR: "멤버 삭제에 실패했습니다.",
  ATTENDANCE_SAVE_ERROR: "출석 기록 저장에 실패했습니다.",
} as const;

/** 그룹 타임라인 */
export const GROUP_TIMELINE_TOAST = {
  DATE_REQUIRED: "날짜를 입력해주세요.",
  TITLE_REQUIRED: "제목을 입력해주세요.",
  EVENT_ADDED: "이벤트가 추가되었습니다.",
  EVENT_ADD_ERROR: "이벤트 추가에 실패했습니다.",
  EVENT_UPDATED: "이벤트가 수정되었습니다.",
  EVENT_UPDATE_ERROR: "이벤트 수정에 실패했습니다.",
  EVENT_DELETED: "이벤트가 삭제되었습니다.",
  EVENT_DELETE_ERROR: "이벤트 삭제에 실패했습니다.",
} as const;

/** 그룹 게시물 */
export const GROUP_POST_TOAST = {
  ADDED: "게시물이 추가되었습니다.",
  UPDATED: "게시물이 수정되었습니다.",
  DELETED: "게시물이 삭제되었습니다.",
} as const;

/** 그룹 벌칙 카드 */
export const GROUP_PENALTY_TOAST = {
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
} as const;

/** 시간 캡슐 */
export const TIME_CAPSULE_TOAST = {
  MAX_EXCEEDED: "타임캡슐은 최대 30개까지 생성할 수 있습니다.",
  OPENED: "타임캡슐이 개봉되었습니다!",
  SEALED: "타임캡슐이 봉인되었습니다.",
  DELETED: "타임캡슐이 삭제되었습니다.",
  CREATED: "타임캡슐이 생성되었습니다.",
  OPEN_DATE_REQUIRED: "개봉 예정일을 선택해주세요.",
  OPEN_ERROR: "개봉에 실패했습니다.",
  OPEN_DATE_PAST: "개봉일을 선택해주세요.",
} as const;

/** 타임캡슐 카드 */
export const TIME_CAPSULE_CARD_TOAST = {
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
} as const;

/** 통합 캘린더 */
export const UNIFIED_CALENDAR_TOAST = {
  TITLE_REQUIRED: "제목을 입력해주세요.",
  DATE_REQUIRED: "날짜를 선택해주세요.",
  END_AFTER_START: "종료 시간은 시작 시간보다 늦어야 합니다.",
  ADDED: "일정이 추가되었습니다.",
  DELETED: "일정이 삭제되었습니다.",
} as const;

/** 소셜 캘린더 */
export const SOCIAL_CALENDAR_TOAST = {
  TITLE_REQUIRED: "제목을 입력하세요.",
  DATE_REQUIRED: "게시 날짜를 선택하세요.",
  UPDATED: "게시물이 수정되었습니다.",
  ADDED: "게시물이 추가되었습니다.",
  DELETED: "게시물이 삭제되었습니다.",
} as const;

/** 감사 보드 */
export const THANK_YOU_BOARD_TOAST = {
  MEMBER_REQUIRED: "받는 멤버를 선택해주세요.",
  CATEGORY_REQUIRED: "카테고리를 선택해주세요.",
  MESSAGE_REQUIRED: "메시지를 입력해주세요.",
  MESSAGE_DELETED: "메시지가 삭제되었습니다.",
  LIKE_REQUIRED: "좋아요를 누르려면 멤버 이름이 필요합니다.",
} as const;

/** 감사 카드 */
export const APPRECIATION_CARD_TOAST = {
  RECIPIENT_REQUIRED: "받는 멤버를 선택해주세요.",
  CATEGORY_REQUIRED: "카테고리를 선택해주세요.",
  MESSAGE_REQUIRED: "메시지를 입력해주세요.",
  DELETED: "감사 카드가 삭제되었습니다.",
  LIKE_NAME_REQUIRED: "좋아요를 누르려면 멤버 이름이 필요합니다.",
} as const;

/** 이벤트 RSVP */
export const EVENT_RSVP_TOAST = {
  RSVP_ERROR: "RSVP 처리에 실패했습니다.",
} as const;

/** 이벤트 캘린더 */
export const EVENT_CALENDAR_TOAST = {
  TITLE_REQUIRED: "이벤트 제목을 입력해주세요.",
  DATE_REQUIRED: "날짜를 선택해주세요.",
  ADDED: "이벤트가 추가되었습니다.",
  DELETED: "이벤트가 삭제되었습니다.",
  RSVP_ERROR: "RSVP 처리에 실패했습니다.",
} as const;

/** 이벤트 스폰서십 */
export const EVENT_SPONSORSHIP_TOAST = {
  NAME_REQUIRED: "스폰서/협력사 이름을 입력해주세요.",
  EVENT_NAME_REQUIRED: "연관 이벤트명을 입력해주세요.",
  REGISTERED: "스폰서가 등록되었습니다.",
  REGISTER_ERROR: "스폰서 등록에 실패했습니다.",
  STATUS_CHANGED: "상태가 변경되었습니다.",
  STATUS_ERROR: "상태 변경에 실패했습니다.",
  DELETED: "스폰서가 삭제되었습니다.",
  DELETE_ERROR: "스폰서 삭제에 실패했습니다.",
  REFRESHED: "새로고침했습니다.",
} as const;

/** 생일 캘린더 */
export const BIRTHDAY_CALENDAR_TOAST = {
  MESSAGE_REQUIRED: "메시지 내용을 입력해주세요.",
  CONGRATULATION_ADDED: "축하 메시지가 추가되었습니다.",
  MEMBER_REQUIRED: "멤버 이름을 입력해주세요.",
  BIRTHDAY_FORMAT: "생일을 MM-DD 형식으로 입력해주세요. (예: 03-15)",
  BIRTHDAY_INVALID: "올바른 생일 날짜를 입력해주세요.",
  DELETED: "생일 정보가 삭제되었습니다.",
} as const;

/** 팀빌딩 */
export const TEAM_BUILDING_TOAST = {
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
} as const;

/** 장르 탐색기 */
export const GENRE_EXPLORER_TOAST = {
  TITLE_REQUIRED: "제목을 입력해주세요.",
  DESC_REQUIRED: "설명을 입력해주세요.",
  ADDED: "장르 정보가 추가되었습니다.",
  MEMBER_REQUIRED: "멤버를 선택해주세요.",
  NO_GENRES: "선택한 멤버에 해당 장르가 없습니다.",
  GENRE_REMOVED: "장르가 제거되었습니다.",
  DELETED: "장르 정보가 삭제되었습니다.",
} as const;

/** 동의서 */
export const WAIVER_TOAST = {
  TITLE_REQUIRED: "동의서 제목을 입력해주세요.",
  CONTENT_REQUIRED: "동의서 본문을 입력해주세요.",
  REGISTERED: "동의서가 등록되었습니다.",
  REGISTER_ERROR: "동의서 등록에 실패했습니다.",
  DELETED: "동의서가 삭제되었습니다.",
  DELETE_ERROR: "동의서 삭제에 실패했습니다.",
  AGREE_CHECK: "내용을 확인하고 동의 체크박스를 선택해주세요.",
} as const;

/** 학습 요청 */
export const LEARNING_REQUEST_TOAST = {
  REQUESTED: "학습 요청이 접수되었습니다.",
  REQUEST_ERROR: "학습 요청에 실패했습니다.",
} as const;

/** 스킬 매트릭스 */
export const SKILL_MATRIX_TOAST = {
  SKILL_NAME_REQUIRED: "기술 이름을 입력하세요",
  POINT_REQUIRED: "포인트는 1 이상의 숫자를 입력해주세요.",
  SKILL_EXISTS: "이미 존재하는 기술입니다",
  MEMBER_REQUIRED: "멤버 이름을 입력하세요",
  MEMBER_EXISTS: "이미 존재하는 멤버입니다",
  UPDATED: "업데이트되었습니다",
} as const;

/** 활동 기록 */
export const ACTIVITY_LOG_TOAST = {
  ACTIVITY_NAME_REQUIRED: "활동명을 입력해주세요.",
  DELETED: "활동이 삭제되었습니다.",
  RECORD_DELETED: "기록이 삭제되었습니다.",
} as const;

/** 코칭 노트 */
export const COACHING_NOTE_TOAST = {
  ADDED: "코칭 노트가 추가되었습니다.",
  UPDATED: "코칭 노트가 수정되었습니다.",
} as const;

/** 목표 게시판 */
export const GOAL_BOARD_TOAST = {
  SUB_GOAL_ADD_ERROR: "하위 목표 추가에 실패했습니다.",
} as const;

/** 역할 배정 */
export const ROLE_ASSIGNMENT_TOAST = {
  DATE_REQUIRED: "날짜를 선택해주세요.",
  ASSIGNEE_REQUIRED: "대상 멤버를 입력해주세요.",
  NEW_ASSIGNEE_REQUIRED: "새 담당자를 입력하세요.",
  CHANGE_ERROR: "담당자 변경에 실패했습니다.",
  ROLE_REQUIRED: "역할 이름을 입력하세요.",
  START_DATE_REQUIRED: "시작일을 입력하세요.",
  ADD_ERROR: "역할 추가에 실패했습니다.",
} as const;

/** 역할 로테이션 */
export const ROLE_ROTATION_TOAST = {
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
} as const;

/** 의사결정 투표 */
export const DECISION_POLL_TOAST = {
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
} as const;

/** 플레이리스트 */
export const PLAYLIST_TOAST = {
  CREATED: "플레이리스트가 생성되었습니다.",
  DELETED: "플레이리스트가 삭제되었습니다.",
  TRACK_ADDED: "트랙이 추가되었습니다.",
  TRACK_DELETED: "트랙이 삭제되었습니다.",
  SONG_TITLE_REQUIRED: "곡 제목을 입력해주세요",
  SONG_TITLE_REQUIRED_DOT: "곡 제목을 입력해주세요.",
  SONG_NAME_REQUIRED: "곡명을 입력해주세요.",
  SONG_ADDED: "곡이 추가되었습니다.",
  SONG_DELETED: "곡이 삭제되었습니다.",
} as const;

/** 연습 체크인 */
export const PRACTICE_CHECKIN_TOAST = {
  QR_REQUIRED: "QR 코드를 입력해주세요.",
} as const;

/** 음악 라이선스 */
export const MUSIC_LICENSE_TOAST = {
  ADDED: "라이선스가 추가되었습니다.",
  UPDATED: "라이선스 정보가 수정되었습니다.",
  DELETED: "라이선스가 삭제되었습니다.",
  URL_REQUIRED: "URL을 입력해주세요.",
} as const;

/** 루틴 빌더 */
export const ROUTINE_BUILDER_TOAST = {
  NAME_REQUIRED: "루틴 이름을 입력해주세요.",
  CREATE_ERROR: "루틴 생성에 실패했습니다.",
  DELETED: "루틴이 삭제되었습니다.",
  TIME_RANGE: "시간은 1~300분 사이로 입력해주세요.",
  BLOCK_ADDED: "블록이 추가되었습니다.",
  BLOCK_ADD_ERROR: "블록 추가에 실패했습니다.",
  BLOCK_DELETED: "블록이 삭제되었습니다.",
  CLONE_ERROR: "복제에 실패했습니다.",
} as const;

/** 연습 피드백 */
export const PRACTICE_FEEDBACK_TOAST = {
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
} as const;

/** 연습 체크인 카드 */
export const PRACTICE_CHECKIN_CARD_TOAST = {
  INFO_REQUIRED: "날짜, 제목, 시작 시간을 모두 입력해주세요.",
  SESSION_STARTED: "연습 세션이 시작되었습니다.",
  SESSION_ENDED: "세션이 종료되었습니다.",
  SESSION_DELETED: "세션이 삭제되었습니다.",
  ALL_CHECKIN: "전원 체크인 완료",
  ALL_ABSENT: "전원 결석 처리",
} as const;

/** 연습 피드백 카드 */
export const PRACTICE_FEEDBACK_CARD_TOAST = {
  MEMBER_REQUIRED: "멤버를 선택해주세요.",
  DATE_REQUIRED: "날짜를 선택해주세요.",
  MOOD_REQUIRED: "오늘의 무드를 선택해주세요.",
} as const;

/** 연습 피드백 수집 */
export const PRACTICE_FEEDBACK_COLLECTION_TOAST = {
  DATE_REQUIRED: "연습 날짜를 선택해주세요.",
  NAME_REQUIRED: "이름을 입력해주세요.",
  SESSION_DELETED: "세션이 삭제되었습니다.",
} as const;

/** 연습 목표 보드 */
export const PRACTICE_GOAL_BOARD_TOAST = {
  TITLE_REQUIRED: "목표 제목을 입력해주세요.",
  ADDED: "목표가 추가되었습니다.",
  ADD_ERROR: "목표 추가에 실패했습니다.",
  DELETED: "목표가 삭제되었습니다.",
} as const;

/** 연습 하이라이트 카드 */
export const PRACTICE_HIGHLIGHT_CARD_TOAST = {
  MEMBER_REQUIRED: "멤버를 선택해주세요.",
  CATEGORY_REQUIRED: "카테고리를 선택해주세요.",
  DATE_REQUIRED: "날짜를 선택해주세요.",
} as const;

/** 연습 일지 */
export const PRACTICE_JOURNAL_TOAST = {
  DATE_REQUIRED: "연습 날짜를 선택해주세요.",
  TIME_REQUIRED: "연습 시간을 입력해주세요.",
  AUTHOR_REQUIRED: "작성자 이름을 입력해주세요.",
  WRITTEN: "연습 일지가 작성되었습니다.",
  WRITE_ERROR: "일지 작성에 실패했습니다.",
  UPDATED: "연습 일지가 수정되었습니다.",
  UPDATE_ERROR: "일지 수정에 실패했습니다.",
  DELETED: "연습 일지가 삭제되었습니다.",
} as const;

/** 연습 노트 */
export const PRACTICE_NOTES_TOAST = {
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
} as const;

/** 연습 파트너 */
export const PRACTICE_PARTNER_TOAST = {
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
} as const;

/** 연습 플레이리스트 카드 */
export const PRACTICE_PLAYLIST_CARD_TOAST = {
  TITLE_REQUIRED: "제목을 입력해주세요.",
} as const;

/** 연습실 예약 */
export const PRACTICE_ROOM_BOOKING_TOAST = {
  ROOM_REGISTERED: "연습실이 등록되었습니다.",
  ROOM_UPDATED: "연습실 정보가 수정되었습니다.",
  ROOM_DELETED: "연습실이 삭제되었습니다.",
  BOOKING_CREATED: "예약이 생성되었습니다.",
  BOOKING_CREATE_ERROR: "예약 생성에 실패했습니다. 시간 충돌을 확인해주세요.",
  BOOKING_UPDATED: "예약이 수정되었습니다.",
  BOOKING_UPDATE_ERROR: "수정에 실패했습니다. 시간 충돌을 확인해주세요.",
  BOOKING_DELETED: "예약이 삭제되었습니다.",
} as const;

/** 연습 타이머 로그 */
export const PRACTICE_TIMER_LOG_TOAST = {
  DATE_REQUIRED: "날짜를 입력해주세요.",
  TIME_INVALID: "올바른 시간(분)을 입력해주세요.",
  RECORD_ADDED: "연습 기록이 추가되었습니다.",
  RECORD_DELETED: "기록이 삭제되었습니다.",
} as const;

/** 연습 장소 */
export const PRACTICE_VENUE_TOAST = {
  NAME_REQUIRED: "장소명을 입력해주세요.",
  HOURLY_COST_INVALID: "시간당 비용을 올바르게 입력해주세요.",
  CAPACITY_INVALID: "수용 인원을 올바르게 입력해주세요.",
  AREA_INVALID: "면적을 올바르게 입력해주세요.",
  REGISTERED: "장소가 등록되었습니다.",
  RATING_REQUIRED: "평점을 선택해주세요.",
  RATING_REGISTERED: "평점이 등록되었습니다.",
  STATUS_CHANGED: "상태가 변경되었습니다.",
  DELETED: "장소가 삭제되었습니다.",
} as const;

/** QR 체크인 */
export const QR_CHECK_IN_TOAST = {
  MEMBER_REQUIRED: "멤버 이름을 입력해주세요.",
  QR_REQUIRED: "QR 코드를 입력해주세요.",
  SESSION_TITLE_REQUIRED: "세션 제목을 입력해주세요.",
  DATE_REQUIRED: "날짜를 선택해주세요.",
  START_TIME_REQUIRED: "시작 시간을 입력해주세요.",
  SESSION_CREATED: "새 출석 세션이 생성되었습니다.",
  SESSION_ENDED: "세션이 종료되었습니다.",
  SESSION_DELETED: "세션이 삭제되었습니다.",
} as const;

/** 세션 평가 카드 */
export const SESSION_RATING_CARD_TOAST = {
  DATE_REQUIRED: "세션 날짜를 선택해주세요.",
  SESSION_REQUIRED: "세션명을 입력해주세요.",
  RATING_REQUIRED: "만족도 별점을 선택해주세요.",
} as const;

/** 주간 시간표 */
export const WEEKLY_TIMETABLE_TOAST = {
  TITLE_REQUIRED: "제목을 입력해주세요.",
  TIME_REQUIRED: "시간을 입력해주세요.",
  END_AFTER_START: "종료 시간은 시작 시간보다 늦어야 합니다.",
  SLOT_ADDED: "슬롯이 추가되었습니다.",
  SLOT_ADD_ERROR: "슬롯 추가에 실패했습니다.",
  SLOT_DELETED: "슬롯이 삭제되었습니다.",
  SLOT_DELETE_ERROR: "슬롯 삭제에 실패했습니다.",
} as const;

/** 카풀 관리 */
export const CARPOOL_MANAGEMENT_TOAST = {
  PASSENGER_REQUIRED: "탑승자를 선택해주세요",
} as const;

/** 카풀 */
export const CARPOOL_TOAST = {
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
} as const;

/** 댄스 용어 */
export const DANCE_GLOSSARY_TOAST = {
  TERM_REQUIRED: "용어명을 입력해주세요.",
  DEFINITION_REQUIRED: "정의를 입력해주세요.",
  TERM_UPDATED: "용어가 수정되었습니다.",
  TERM_REGISTERED: "용어가 등록되었습니다.",
  TERM_REGISTER_ERROR: "용어 등록에 실패했습니다.",
  TERM_DELETED: "용어가 삭제되었습니다.",
} as const;

/** 댄스 용어집 카드 */
export const DANCE_GLOSSARY_CARD_TOAST = {
  TERM_REQUIRED: "용어명을 입력해주세요.",
  DEFINITION_REQUIRED: "정의를 입력해주세요.",
} as const;

/** 대회 준비 */
export const COMPETITION_PREP_TOAST = {
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
} as const;

/** 배틀 스코어보드 */
export const BATTLE_SCOREBOARD_TOAST = {
  PLAYER1_REQUIRED: "참가자 1 이름을 입력해주세요.",
  PLAYER2_REQUIRED: "참가자 2 이름을 입력해주세요.",
  SAME_NAME: "참가자 이름이 동일합니다.",
  DATE_REQUIRED: "날짜를 선택해주세요.",
  MATCH_RECORDED: "매치가 기록되었습니다.",
  MATCH_RECORD_ERROR: "매치 기록에 실패했습니다.",
  MATCH_DELETED: "매치가 삭제되었습니다.",
  MATCH_DELETE_ERROR: "매치 삭제에 실패했습니다.",
} as const;

/** 배틀 토너먼트 */
export const BATTLE_TOURNAMENT_TOAST = {
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
} as const;

/** 그룹 공연 기록 */
export const GROUP_PERFORMANCE_TOAST = {
  SHOW_NAME_REQUIRED: "공연명을 입력해주세요.",
  SHOW_DATE_REQUIRED: "공연 날짜를 선택해주세요.",
  HISTORY_DELETED: "공연 기록이 삭제되었습니다.",
  SHOW_PERFORMANCE_REQUIRED: "공연/연습명을 입력해주세요.",
} as const;

/** 월별 하이라이트 */
export const MONTHLY_HIGHLIGHT_TOAST = {
  TITLE_REQUIRED: "하이라이트 제목을 입력해주세요.",
  REGISTERED: "하이라이트가 등록되었습니다.",
  DELETED: "하이라이트가 삭제되었습니다.",
} as const;

/** 세션 평가 */
export const SESSION_RATING_TOAST = {
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
} as const;

/** 타이머 */
export const TIMER_TOAST = {
  NO_CHANGE_RUNNING: "타이머 실행 중에는 설정을 변경할 수 없습니다.",
} as const;

/** 포커스 타이머 */
export const FOCUS_TIMER_TOAST = {
  SETTING_ERROR: "타이머 실행 중에는 설정을 변경할 수 없습니다.",
} as const;

/** 마일스톤 */
export const MILESTONE_TOAST = {
  TITLE_REQUIRED: "마일스톤 제목을 입력해주세요",
  DATE_REQUIRED: "마감일을 선택해주세요",
  TASK_NAME_REQUIRED: "작업 이름을 입력해주세요",
  TASK_ADDED: "작업을 추가했습니다",
  ADDED: "마일스톤을 추가했습니다",
} as const;

/** 멘토링 매칭 */
export const MENTORING_MATCH_TOAST = {
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
} as const;

/** 정신 코칭 */
export const MENTAL_COACHING_TOAST = {
  MEMBER_REQUIRED: "대상 멤버를 입력해주세요.",
  COACH_REQUIRED: "코치 이름을 입력해주세요.",
  CONTENT_REQUIRED: "코칭 내용을 입력해주세요.",
  NOTE_DELETED: "코칭 노트가 삭제되었습니다.",
  STATUS_ERROR: "상태 변경에 실패했습니다.",
} as const;

/** 미션 보드 */
export const MISSION_BOARD_TOAST = {
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
} as const;

/** 음악 라이선스 카드 */
export const MUSIC_LICENSE_CARD_TOAST = {
  SONG_REQUIRED: "곡명을 입력해주세요.",
  ARTIST_REQUIRED: "아티스트를 입력해주세요.",
  LICENSEE_REQUIRED: "사용자(licensee)를 입력해주세요.",
  SCOPE_REQUIRED: "사용 범위를 입력해주세요.",
} as const;

/** 음악 큐 */
export const MUSIC_QUEUE_TOAST = {
  TIME_INVALID: "올바른 시간을 입력해주세요. (예: 3:30)",
  TRACK_ADDED: "트랙이 추가되었습니다.",
  SET_NAME_REQUIRED: "세트 이름을 입력해주세요.",
  SET_ADDED: "세트가 추가되었습니다.",
  ACTIVE_SET_CHANGED: "활성 세트가 변경되었습니다.",
  TRACK_DELETED: "트랙이 삭제되었습니다.",
  TITLE_REQUIRED: "곡 제목을 입력해주세요.",
} as const;

/** 연습 하이라이트 */
export const PRACTICE_HIGHLIGHT_TOAST = {
  TITLE_REQUIRED: "하이라이트 제목을 입력해주세요.",
  REGISTERED: "하이라이트가 등록되었습니다.",
  DELETED: "하이라이트가 삭제되었습니다.",
} as const;

/** 연습 플레이리스트 */
export const PRACTICE_PLAYLIST_TOAST = {
  SONG_REQUIRED: "곡명을 입력해주세요.",
  BPM_RANGE: "BPM은 1~300 사이의 숫자를 입력해주세요.",
  TIME_FORMAT: '시간은 "분:초" 형식으로 입력해주세요. (예: 3:45)',
  SONG_ADDED: "곡이 추가되었습니다.",
} as const;

/** 소셜 포스트 플래너 */
export const SOCIAL_POST_TOAST = {
  TITLE_REQUIRED: "포스트 제목을 입력해주세요.",
  CONTENT_REQUIRED: "본문 내용을 입력해주세요.",
  MANAGER_REQUIRED: "담당자를 입력해주세요.",
  DATE_REQUIRED: "예정 날짜를 선택해주세요.",
  ADDED: "소셜 포스트 계획이 추가되었습니다.",
  UPDATED: "포스트 계획이 수정되었습니다.",
  DELETED: "포스트 계획이 삭제되었습니다.",
} as const;

/** 날씨 알림 */
export const WEATHER_ALERT_TOAST = {
  DATE_REQUIRED: "날짜를 선택해주세요.",
  RECOMMENDATION_REQUIRED: "권장사항을 입력해주세요.",
  ADDED: "날씨 알림이 추가되었습니다.",
  ADD_ERROR: "날씨 알림 추가에 실패했습니다.",
  DELETED: "날씨 알림이 삭제되었습니다.",
} as const;

/** 장소 리뷰 */
export const VENUE_REVIEW_TOAST = {
  NAME_REQUIRED: "장소명을 입력해주세요.",
  OVERALL_RATING_REQUIRED: "종합 별점을 선택해주세요.",
  DETAIL_RATING_REQUIRED: "모든 세부 별점을 선택해주세요.",
  AUTHOR_REQUIRED: "작성자를 입력해주세요.",
  VISIT_DATE_REQUIRED: "방문일을 입력해주세요.",
  HOURLY_PRICE_INVALID: "시간당 가격을 올바르게 입력해주세요.",
  CAPACITY_INVALID: "수용 인원을 올바르게 입력해주세요.",
  REVIEW_REGISTERED: "리뷰가 등록되었습니다.",
  REVIEW_DELETED: "리뷰가 삭제되었습니다.",
} as const;

/** 영상 리뷰 */
export const VIDEO_REVIEW_TOAST = {
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
} as const;

/** 면책 동의서 관리 */
export const WAIVER_MANAGEMENT_TOAST = {
  VALIDITY_MIN: "유효기간은 1 이상의 숫자를 입력해주세요.",
  MEMBER_REQUIRED: "멤버 이름을 입력해주세요.",
  SIGNATURE_EXISTS: "이미 유효한 서명이 존재하거나 처리 중 오류가 발생했습니다.",
  SIGNATURE_CANCELLED: "서명이 취소되었습니다.",
  CANCEL_ERROR: "서명 취소에 실패했습니다.",
} as const;

/** 워밍업 루틴 */
export const WARMUP_ROUTINE_TOAST = {
  NAME_REQUIRED: "루틴 이름을 입력해주세요.",
  CREATED: "루틴이 생성되었습니다.",
  EXERCISE_REQUIRED: "운동 이름을 입력해주세요.",
  TIME_INVALID: "올바른 시간(초)을 입력해주세요.",
  EXERCISE_ADDED: "운동이 추가되었습니다.",
  ROUTINE_DELETED: "루틴이 삭제되었습니다.",
  EXERCISE_DELETED: "운동이 삭제되었습니다.",
} as const;

/** 스타일 투표 */
export const STYLE_VOTE_TOAST = {
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
} as const;
