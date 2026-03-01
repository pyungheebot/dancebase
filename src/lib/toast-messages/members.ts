/** 멤버 관련 토스트 메시지 */
export const MEMBER_TOAST = {
  INVITE_REQUIRED: "초대할 멤버를 선택해주세요",
  INVITE_ERROR: "멤버 초대에 실패했습니다",
  SELECT_REQUIRED: "멤버를 선택해주세요",
  NAME_SELECT_REQUIRED: "멤버 이름을 선택해주세요.",
} as const;

/** 멤버 공통 (members/ 폴더 전용) 토스트 메시지 */
export const MEMBERS_TOAST = {
  // CSV 내보내기
  CSV_DOWNLOADED: "CSV 파일이 다운로드되었습니다",
  EXPORT_EMPTY: "내보낼 데이터가 없습니다",

  // 역할/멤버 관리
  ROLE_CHANGE_ERROR: "역할 변경에 실패했습니다",
  MEMBER_REMOVED: "멤버가 제거되었습니다",
  MEMBER_REMOVE_ERROR: "멤버 제거에 실패했습니다",
  MEMBER_SELECT_DOT: "멤버를 선택해주세요.",
  MEMBER_SELECT_KO: "멤버를 선택해 주세요",
  MEMBER_NAME_REQUIRED_KO: "멤버 이름을 입력해주세요.",
  MEMBER_NAME_INPUT: "멤버 이름을 입력하세요",
  ROLE_SELECT: "역할을 선택해주세요.",
  ROLE_EXTRA_REQUIRED: "기타 역할명을 입력해주세요.",
  START_DATE_REQUIRED: "시작일을 입력해주세요.",
  END_DATE_REQUIRED: "종료일을 입력해주세요.",

  // 목표
  GOAL_TITLE_REQUIRED: "목표 제목을 입력해주세요",
  GOAL_TITLE_REQUIRED_DOT: "목표 제목을 입력하세요.",
  GOAL_DATE_REQUIRED: "목표 날짜를 선택해주세요",
  GOAL_ABANDONED: "목표를 포기 처리했습니다",
  GOAL_DELETED: "목표가 삭제되었습니다",
  GOAL_DELETED_DOT: "목표가 삭제되었습니다.",
  GOAL_ADDED: "목표가 추가되었습니다",
  GOAL_ADDED_DOT: "목표가 추가되었습니다.",
  GOAL_COMPLETED: "목표를 완료했습니다! 수고하셨어요.",
  GOAL_UPDATED_DOT: "목표가 수정되었습니다.",
  GOAL_IN_PROGRESS: "목표를 진행 중으로 변경했습니다.",
  GOAL_PAUSED: "목표를 일시중지했습니다.",
  GOAL_MARKED_DONE: "목표를 완료로 표시했습니다.",

  // 마일스톤
  MILESTONE_TITLE_REQUIRED: "단계 제목을 입력해주세요",
  MILESTONE_ADDED: "단계가 추가되었습니다",
  MILESTONE_ADDED_DOT: "마일스톤이 추가되었습니다.",
  MILESTONE_REMOVED_DOT: "마일스톤이 제거되었습니다.",
  MILESTONE_MAX: "마일스톤은 최대 10개까지 추가할 수 있습니다",

  // 기여/공헌
  CONTRIBUTION_MEMBER_REQUIRED: "멤버 이름을 입력해주세요.",
  CONTRIBUTION_GIVER_REQUIRED: "부여자 이름을 입력해주세요.",
  CONTRIBUTION_CONTENT_REQUIRED: "활동 내용을 입력해주세요.",
  CONTRIBUTION_DATE_REQUIRED: "날짜를 선택해주세요.",

  // 연습 강도
  INTENSITY_REQUIRED: "강도를 선택해주세요.",
  PRACTICE_TIME_INVALID: "연습 시간을 올바르게 입력해주세요.",
  INTENSITY_SAVED: "연습 강도가 저장되었습니다.",

  // 기록 공통
  RECORD_DELETED: "기록이 삭제되었습니다.",
  RECORD_DELETED_NO_DOT: "기록이 삭제되었습니다",
  RECORD_UPDATED: "기록이 수정되었습니다",
  RECORD_UPDATED_DOT: "기록이 수정되었습니다.",
  RECORD_SAVE_ERROR: "기록 저장에 실패했습니다.",
  RECORD_DELETE_ERROR: "기록 삭제에 실패했습니다.",

  // 과제
  ASSIGNMENT_TITLE_REQUIRED: "과제 제목을 입력해주세요",
  ASSIGNMENT_MEMBER_REQUIRED: "대상 멤버를 1명 이상 선택해주세요",
  ASSIGNMENT_DELETED: "과제가 삭제되었습니다",
  ASSIGNMENT_CREATED: "연습 과제가 생성되었습니다",

  // 메모
  MEMO_SAVED: "메모가 저장되었습니다",
  MEMO_SAVED_DOT: "메모가 저장되었습니다.",
  MEMO_ADDED: "메모가 추가되었습니다",
  MEMO_ADDED_DOT: "메모가 추가되었습니다.",
  MEMO_UPDATED: "메모가 수정되었습니다",
  MEMO_DELETED: "메모가 삭제되었습니다",
  MEMO_CONTENT_REQUIRED: "메모 내용을 입력해주세요",
  MEMO_SAVE_ERROR: "메모 저장에 실패했습니다",
  MEMO_DELETE_ERROR: "메모 삭제에 실패했습니다",

  // 스킬 자가 평가
  SKILL_EVAL_SAVED: "스킬 자가 평가가 저장되었습니다",

  // 댄스 스타일
  DANCE_STYLE_SAVED: "댄스 스타일 프로필이 저장되었습니다",

  // 챌린지 기록
  CHALLENGE_NAME_REQUIRED: "챌린지명을 입력해주세요",
  CHALLENGE_DATE_REQUIRED: "참여 날짜를 입력해주세요",
  CHALLENGE_VIEW_COUNT_INVALID: "조회수는 숫자로 입력해주세요",
  CHALLENGE_LIKE_COUNT_INVALID: "좋아요 수는 숫자로 입력해주세요",
  CHALLENGE_RECORD_ADDED: "챌린지 기록이 추가되었습니다",

  // 플레이리스트
  SONG_NAME_REQUIRED: "곡명을 입력해주세요",
  ARTIST_REQUIRED: "아티스트를 입력해주세요",
  PLAYLIST_NAME_REQUIRED: "플레이리스트 이름을 입력해주세요",
  PLAYLIST_CREATED: "플레이리스트를 만들었습니다",
  PLAYLIST_DELETED: "플레이리스트를 삭제했습니다",
  SONG_ADDED: "곡을 추가했습니다",
  SONG_ADD_ERROR: "곡 추가에 실패했습니다",
  SONG_UPDATED: "곡을 수정했습니다",
  SONG_UPDATE_ERROR: "곡 수정에 실패했습니다",
  SONG_DELETED: "곡을 삭제했습니다",
  SONG_DELETE_ERROR: "곡 삭제에 실패했습니다",

  // 피트니스 테스트
  FITNESS_ITEM_NAME_REQUIRED: "항목명을 입력하세요.",
  FITNESS_CATEGORY_REQUIRED: "카테고리를 선택하세요.",
  FITNESS_UNIT_REQUIRED: "단위를 입력하세요.",
  FITNESS_MEMBER_REQUIRED: "멤버를 선택하세요.",
  FITNESS_DATE_REQUIRED: "날짜를 입력하세요.",
  FITNESS_MIN_VALUE_REQUIRED: "최소 하나 이상의 항목에 수치를 입력하세요.",

  // 유연성 테스트
  FLEX_DATE_REQUIRED: "날짜를 입력하세요.",
  FLEX_ITEM_NAME_REQUIRED: "항목명을 입력하세요.",
  FLEX_ITEM_DUPLICATE: "이미 존재하는 항목명입니다.",
  FLEX_GOAL_INVALID: "올바른 목표값을 입력하세요.",
  FLEX_DEFAULT_ADDED: "기본 유연성 테스트 항목이 추가되었습니다.",

  // 포트폴리오
  PORTFOLIO_TITLE_REQUIRED: "제목을 입력해주세요.",
  PORTFOLIO_DATE_REQUIRED: "날짜를 입력해주세요.",
  PORTFOLIO_ITEM_DELETED: "항목이 삭제되었습니다.",

  // 체형 기록
  BODY_DATE_REQUIRED: "날짜를 입력해주세요.",
  BODY_VALUE_REQUIRED: "체중, 체지방률 등 측정값을 하나 이상 입력해주세요.",
  BODY_UPDATED: "체형 기록이 수정되었습니다.",
  BODY_SAVED: "체형 기록이 저장되었습니다.",

  // 자기소개 카드
  INTRO_CARD_MIN_REQUIRED: "최소 한 가지 항목을 입력해주세요",
  INTRO_CARD_SAVED: "자기소개 카드가 저장되었습니다",
  INTRO_CARD_DELETED: "자기소개 카드가 삭제되었습니다",
  GENRE_MAX: "장르는 최대 3개까지 입력할 수 있습니다",
  GENRE_DUPLICATE: "이미 추가된 장르입니다",

  // 감사 편지
  LETTER_SENDER_REQUIRED: "보내는 사람 이름을 입력해주세요.",
  LETTER_RECEIVER_REQUIRED: "받는 사람을 선택해주세요.",
  LETTER_CONTENT_REQUIRED: "감사 메시지를 입력해주세요.",
  LETTER_SELF_SEND_ERROR: "자신에게는 편지를 보낼 수 없어요.",
  LETTER_SEND_ERROR: "편지 전송 중 오류가 발생했습니다.",
  LETTER_DELETED: "편지를 삭제했습니다.",

  // 영상 포트폴리오
  VIDEO_TITLE_REQUIRED: "영상 제목을 입력하세요.",
  VIDEO_URL_REQUIRED: "영상 URL을 입력하세요.",
  VIDEO_URL_INVALID: "유효한 URL 형식이 아닙니다.",
  VIDEO_ADDED: "영상 포트폴리오가 추가되었습니다.",
  VIDEO_UPDATED: "영상 정보가 수정되었습니다.",
  VIDEO_DELETED: "영상이 삭제되었습니다.",

  // 스킬 인증
  SKILL_NAME_REQUIRED: "스킬명을 입력하세요.",
  SKILL_CATEGORY_REQUIRED: "카테고리를 입력하세요.",
  SKILL_LEVEL_REQUIRED: "레벨을 선택하세요.",
  CERT_SELECT_REQUIRED: "인증을 선택하세요.",
  CERT_CERTIFIER_REQUIRED: "인증자를 입력하세요.",
  CERT_DUPLICATE: "이미 해당 멤버에게 수여된 인증입니다.",

  // 출석 히트맵
  ATTENDANCE_NAME_REQUIRED: "이름을 입력해주세요.",
  ATTENDANCE_DATE_REQUIRED: "날짜를 선택해주세요.",
  ATTENDANCE_TYPE_REQUIRED: "활동 종류를 선택해주세요.",
  ATTENDANCE_DUPLICATE_MEMBER: "이미 등록된 이름이거나 입력이 잘못되었습니다.",
  ATTENDANCE_MEMBER_DELETE_ERROR: "멤버 삭제에 실패했습니다.",
  ATTENDANCE_SAVE_ERROR: "활동 기록 저장에 실패했습니다.",
  ATTENDANCE_DEMO_ERROR: "데모 데이터 생성에 실패했습니다.",

  // 출석 보상
  REWARD_MEMBER_REQUIRED: "멤버를 선택해주세요",
  REWARD_RATE_RANGE: "출석률을 0~100 사이로 입력해주세요",
  REWARD_POINT_REQUIRED: "포인트를 입력해주세요",
  REWARD_REQUIRED_RATE_RANGE: "필요 출석률을 0~100 사이로 입력해주세요",
  REWARD_NAME_REQUIRED: "보상명을 입력해주세요",
  REWARD_RULE_ADDED: "보상 규칙이 추가되었습니다",
  REWARD_CANCELLED: "보상이 취소되었습니다",
  REWARD_RULE_DELETED: "규칙이 삭제되었습니다",

  // 성장 궤적
  GROWTH_MONTH_REQUIRED: "월을 선택해주세요.",
  GROWTH_DATA_ADDED: "데이터가 추가되었습니다.",
  GROWTH_MEMBER_REQUIRED: "멤버 이름을 입력해주세요.",
  GROWTH_SCORE_RANGE: "목표 점수는 1~100 사이로 입력해주세요.",
  GROWTH_DUPLICATE_MEMBER: "이미 등록된 멤버이거나 이름이 올바르지 않습니다.",
  GROWTH_TRAJECTORY_DELETED: "멤버 궤적이 삭제되었습니다.",
  GROWTH_DATA_ADD_ERROR: "데이터 추가에 실패했습니다.",

  // 영양 기록
  NUTRITION_MENU_REQUIRED: "메뉴명을 입력해주세요.",
  NUTRITION_DATE_REQUIRED: "날짜를 선택해주세요.",
  NUTRITION_CALORIE_INVALID: "목표 칼로리를 올바르게 입력해주세요.",
  NUTRITION_WATER_INVALID: "목표 수분을 올바르게 입력해주세요.",
  NUTRITION_LOGGED: "식단이 기록되었습니다.",
  NUTRITION_UPDATED: "식단이 수정되었습니다.",
  NUTRITION_DELETED: "식단 기록이 삭제되었습니다.",
  NUTRITION_GOAL_SAVED: "목표가 저장되었습니다.",

  // 댄스 목표 (dance-goal-card)
  DANCE_GOAL_TITLE_REQUIRED: "목표 제목을 입력하세요.",
  DANCE_GOAL_CHECKPOINT_ADDED: "체크포인트가 추가되었습니다.",

  // 손상 기록
  INJURY_STATUS_ERROR: "상태 변경에 실패했습니다.",

  // 활동 리포트
  ACTIVITY_EXPORT_EMPTY: "내보낼 데이터가 없습니다",

  // 달성률
  ACHIEVEMENT_REFRESHED: "달성률을 새로고침했습니다",

  // 퀴즈
  QUIZ_QUESTION_REQUIRED: "질문을 입력해주세요.",
  QUIZ_CHOICES_REQUIRED: "4개 선택지를 모두 입력해주세요.",
  QUIZ_MEMBER_REQUIRED: "대상 멤버를 선택해주세요.",
  QUIZ_AUTHOR_REQUIRED: "출제자 이름을 입력해주세요.",
  QUIZ_ADDED: "문제가 추가되었습니다.",
  QUIZ_PARTICIPANT_REQUIRED: "참여자 이름을 입력해주세요.",
  QUIZ_NO_QUESTIONS: "문제가 없습니다. 먼저 문제를 추가해주세요.",
  QUIZ_CHOICE_REQUIRED: "선택지를 선택해주세요.",
  QUIZ_DELETED: "문제가 삭제되었습니다.",

  // 마스터리 커브
  MASTERY_DATE_REQUIRED: "날짜를 입력해주세요.",
  MASTERY_PROGRESS_RANGE: "진도는 0~100 사이 숫자를 입력해주세요.",
  MASTERY_CHECKPOINT_ADDED: "체크포인트가 추가되었습니다.",
  MASTERY_CHOREO_NAME_REQUIRED: "안무 이름을 입력해주세요.",
  MASTERY_TARGET_DATE_REQUIRED: "목표 완성일을 입력해주세요.",
  MASTERY_INIT_PROGRESS_RANGE: "초기 진도는 0~100 사이 숫자를 입력해주세요.",
  MASTERY_CHOREO_ADDED: "안무가 추가되었습니다.",
  MASTERY_CHOREO_DELETED: "안무가 삭제되었습니다.",

  // 연습 플랜
  PRACTICE_PLAN_CONTENT_REQUIRED: "플랜 내용을 입력해주세요",
  PRACTICE_PLAN_SAVED: "연습 플랜이 저장되었습니다",
  PRACTICE_PLAN_DELETED: "연습 플랜이 삭제되었습니다",
  PRACTICE_PLAN_FIRST_REQUIRED: "먼저 플랜을 저장해주세요",
  PRACTICE_PLAN_ANALYZE_SUCCESS: "분석을 완료했습니다",
  PRACTICE_PLAN_ANALYZE_ERROR: "분석 중 오류가 발생했습니다",

  // 유연성 테스트 카드
  FLEX_CARD_DEFAULT_ADDED: "기본 유연성 테스트 항목이 추가되었습니다.",
  FLEX_CARD_GOAL_INVALID: "올바른 목표값을 입력하세요.",
  FLEX_CARD_GOAL_SET: "목표값이 설정되었습니다.",
  FLEX_CARD_GOAL_DELETED: "목표값이 삭제되었습니다.",
  FLEX_CARD_RECORD_DELETED: "기록이 삭제되었습니다.",
  FLEX_CARD_MIN_VALUE_REQUIRED: "최소 하나 이상의 항목에 값을 입력하세요.",
  FLEX_CARD_RECORD_ADDED: "유연성 테스트 기록이 추가되었습니다.",

  // 댄스 뮤직 / 트랙
  DANCE_MUSIC_TRACK_ADDED: "트랙을 추가했습니다",
  DANCE_MUSIC_TRACK_ADD_ERROR: "트랙 추가에 실패했습니다",

  // 댄스 인증
  DANCE_CERT_NAME_REQUIRED: "이름을 입력하세요.",
  DANCE_CERT_ISSUER_REQUIRED: "발급기관을 입력하세요.",
  DANCE_CERT_DATE_REQUIRED: "취득일을 입력하세요.",
  DANCE_CERT_EXPIRY_AFTER_DATE: "만료일은 취득일 이후여야 합니다.",
  DANCE_CERT_DELETE_ERROR: "삭제 중 오류가 발생했습니다.",
  DANCE_CERT_UPDATE_ERROR: "수정 중 오류가 발생했습니다.",
  DANCE_CERT_ADD_ERROR: "추가 중 오류가 발생했습니다.",

  // 배지
  BADGE_NAME_REQUIRED: "배지 이름을 입력해주세요.",
  BADGE_DATE_REQUIRED: "획득 날짜를 입력해주세요.",
  BADGE_ADD_ERROR: "배지 추가에 실패했습니다.",
  BADGE_LEVEL_UP_SELECT: "업그레이드할 배지를 선택해주세요.",
  BADGE_LEVELED_UP: "배지 레벨이 업그레이드되었습니다.",
  BADGE_LEVEL_UP_ERROR: "레벨 업그레이드에 실패했습니다.",
  BADGE_DELETE_ERROR: "배지 삭제에 실패했습니다.",

  // 뱃지 (member-badge-card)
  MEMBER_BADGE_NAME_REQUIRED: "뱃지 이름을 입력해주세요.",
  MEMBER_BADGE_EMOJI_REQUIRED: "이모지를 입력해주세요.",
  MEMBER_BADGE_CATEGORY_REQUIRED: "카테고리를 입력해주세요.",
  MEMBER_BADGE_SELECT_REQUIRED: "수여할 뱃지를 선택해주세요.",
  MEMBER_BADGE_RECEIVER_REQUIRED: "수여받을 멤버를 선택해주세요.",
  MEMBER_BADGE_GIVER_REQUIRED: "수여자 이름을 입력해주세요.",

  // 멘토-멘티 섹션
  MENTOR_MENTEE_MATCH_ADDED: "매칭이 추가되었습니다",
  MENTOR_MENTEE_COMPLETED: "매칭이 완료 처리되었습니다",
  MENTOR_MENTEE_DELETED: "매칭이 삭제되었습니다",
  MENTOR_MENTEE_SAME_PERSON: "멘토와 멘티를 다른 멤버로 선택하세요",
  MENTOR_MENTEE_ALL_REQUIRED: "모든 항목을 선택하세요",

  // 목표 설정 다이얼로그
  GOAL_DIALOG_VALUE_MIN: "목표치는 1 이상의 숫자를 입력해주세요",
  GOAL_DIALOG_MONTH_REQUIRED: "월을 선택해주세요",
  GOAL_DIALOG_DUPLICATE: "이미 같은 유형의 목표가 해당 월에 존재합니다",
  GOAL_DIALOG_SET: "목표가 설정되었습니다",
  GOAL_DIALOG_DELETED: "목표가 삭제되었습니다",

  // 멘토링
  MENTORING_PAIR_ADDED: "멘토링 매칭이 추가되었습니다",
  MENTORING_COMPLETED: "멘토링이 완료 처리되었습니다",
  MENTORING_PAUSED: "멘토링이 일시정지되었습니다",
  MENTORING_PAIR_DELETED: "멘토링 매칭이 삭제되었습니다",
  MENTORING_FEEDBACK_ADDED: "피드백이 추가되었습니다",
  MENTORING_RESUMED: "멘토링이 재개되었습니다",
  MENTORING_SAME_PERSON_ERROR: "멘토와 멘티 이름을 다르게 입력하세요",
  MENTORING_ALL_REQUIRED: "모든 항목을 입력하세요",
  MENTORING_FEEDBACK_REQUIRED: "내용과 만족도를 입력하세요",

  // 목표 (member-goal-card)
  GOAL_MILESTONE_MAX: "마일스톤은 최대 10개까지 추가할 수 있습니다",
  GOAL_MEMBER_REQUIRED: "멤버를 선택해주세요",
  GOAL_FINISHED: "목표를 완료했습니다!",
  GOAL_FINISHED_PROCESS: "목표를 완료 처리했습니다",

  // 보상 포인트 샵
  REWARD_SHOP_NAME_REQUIRED: "보상 이름을 입력해주세요",
  REWARD_SHOP_POINT_COST_MIN: "포인트 비용은 1 이상이어야 합니다",
  REWARD_SHOP_EMOJI_REQUIRED: "이모지를 입력해주세요",
  REWARD_SHOP_UPDATED: "보상이 수정되었습니다",
  REWARD_SHOP_ADDED: "보상이 추가되었습니다",
  REWARD_SHOP_MEMBER_REQUIRED: "멤버를 선택해주세요",
  REWARD_SHOP_POINT_MIN: "포인트는 1 이상이어야 합니다",
  REWARD_SHOP_REASON_REQUIRED: "사유를 입력해주세요",
  REWARD_SHOP_DELETED: "보상이 삭제되었습니다",

  // 익명 피드백
  ANON_RECEIVER_REQUIRED: "받는 사람을 선택해주세요.",
  ANON_CONTENT_MIN: "최소 5자 이상 작성해주세요",
  ANON_SEND_SUCCESS: "피드백이 익명으로 전송되었습니다",

  // 출석 스트릭
  ATTENDANCE_STREAK_DATE_REQUIRED: "날짜를 선택해주세요.",
  ATTENDANCE_STREAK_TYPE_REQUIRED: "활동 종류를 선택해주세요.",
  ATTENDANCE_STREAK_SAVE_ERROR: "기록 저장에 실패했습니다.",
  ATTENDANCE_STREAK_RECORD_DELETED: "기록이 삭제되었습니다.",
  ATTENDANCE_STREAK_DELETE_ERROR: "기록 삭제에 실패했습니다.",
  ATTENDANCE_STREAK_DUPLICATE: "해당 날짜의 기록이 이미 있습니다. 수정 버튼을 이용해 주세요.",

  // 협업 효율
  COLLAB_SENDER_REQUIRED: "보내는 사람 이름을 입력해주세요.",
  COLLAB_RECEIVER_REQUIRED: "받는 사람을 선택해주세요.",
  COLLAB_CONTENT_REQUIRED: "내용을 입력해주세요.",
  COLLAB_SAME_PERSON: "서로 다른 멤버를 선택하세요",
  COLLAB_KUDOS_ERROR: "칭찬 전송 중 오류가 발생했습니다.",
  COLLAB_KUDOS_DELETED: "칭찬 메시지를 삭제했습니다.",
  COLLAB_KUDOS_REQUIRED: "칭찬 메시지를 입력해주세요.",

  // 소통 설정
  COMM_QUIET_START_FORMAT: "조용한 시간 시작을 HH:MM 형식으로 입력해 주세요.",
  COMM_QUIET_END_FORMAT: "조용한 시간 종료를 HH:MM 형식으로 입력해 주세요.",
  COMM_QUIET_SAVED: "조용한 시간대가 저장되었습니다.",

  // 궁합 매칭
  COMPAT_MEMBER_MIN: "매칭하려면 멤버가 2명 이상 필요합니다",
  COMPAT_MEMBER_SELECT: "멤버를 선택하세요",
  COMPAT_SAME_PERSON: "서로 다른 멤버를 선택하세요",
  COMPAT_MATCHED: "짝꿍 매칭이 완료되었습니다",

  // 연락처 인증
  CONTACT_VERIFY_ERROR: "연락처 확인에 실패했습니다",
  CONTACT_VERIFY_SUCCESS: "연락처가 확인되었습니다",
  CONTACT_REVERIFY_ERROR: "연락처 재확인 요청에 실패했습니다",
  CONTACT_AUTH_REQUIRED: "인증 정보를 확인할 수 없습니다",

  // 연락처 배너
  CONTACT_PHONE_REQUIRED: "전화번호를 입력해주세요.",
  CONTACT_NAME_REQUIRED: "연락처 이름을 입력해주세요.",
  CONTACT_UPDATED: "연락처를 수정했습니다.",

  // 오디션
  AUDITION_TITLE_REQUIRED: "제목을 입력해주세요.",
  AUDITION_DATE_REQUIRED: "날짜를 입력해주세요.",
  AUDITION_EDIT_ERROR: "오디션 기록 수정 중 오류가 발생했습니다.",
  AUDITION_DELETE_ERROR: "오디션 기록 삭제 중 오류가 발생했습니다.",
  AUDITION_UPDATED: "오디션 기록이 수정되었습니다.",

  // 수업 기록
  CLASS_LOG_DATE_REQUIRED: "날짜를 입력해주세요.",
  CLASS_LOG_LESSON_REQUIRED: "배운 점, 개선할 점, 느낀 점 중 하나 이상 작성해주세요.",
  CLASS_LOG_EDIT_ERROR: "수업 기록 수정 중 오류가 발생했습니다.",
  CLASS_LOG_DELETE_ERROR: "수업 기록 삭제 중 오류가 발생했습니다.",
  CLASS_LOG_UPDATED: "수업 기록이 수정되었습니다.",

  // 수업 평가
  CLASS_REVIEW_DATE_REQUIRED: "세션 날짜를 선택해주세요.",
  CLASS_REVIEW_EDIT_ERROR: "수업 평가 수정 중 오류가 발생했습니다.",
  CLASS_REVIEW_DELETE_ERROR: "수업 평가 삭제 중 오류가 발생했습니다.",
  CLASS_REVIEW_UPDATED: "수업 평가가 수정되었습니다.",

  // 대회 기록
  COMPETITION_TITLE_REQUIRED: "대회명을 입력해주세요.",
  COMPETITION_DATE_REQUIRED: "날짜를 입력해주세요.",
  COMPETITION_ADDED: "대회 기록이 추가되었습니다.",

  // 댄스 컨디션
  CONDITION_DATE_REQUIRED: "날짜를 선택해주세요.",
  CONDITION_SAVED: "컨디션 기록이 저장되었습니다.",
  CONDITION_ADDED: "컨디션 기록이 추가되었습니다.",
  CONDITION_UPDATED: "컨디션 기록이 수정되었습니다.",

  // 댄스 컨디션 저널
  CONDITION_JOURNAL_DATE_REQUIRED: "날짜를 선택해 주세요.",
  CONDITION_JOURNAL_MOOD_REQUIRED: "기분을 선택해주세요.",
  CONDITION_JOURNAL_SAVED: "오늘의 심리 상태가 저장되었습니다.",
  CONDITION_JOURNAL_UPDATED: "심리 상태 기록이 수정되었습니다.",

  // 댄스 일기
  DIARY_DATE_REQUIRED: "날짜를 입력해주세요.",
  DIARY_TITLE_REQUIRED: "제목을 입력해주세요.",
  DIARY_CONTENT_REQUIRED: "내용을 입력해주세요.",
  DIARY_SAVED: "일기가 저장되었습니다.",
  DIARY_UPDATED: "일기가 수정되었습니다.",
  DIARY_DELETED: "일기가 삭제되었습니다.",

  // 유연성 카드
  FLEXIBILITY_GENRE_REQUIRED: "장르 이름을 입력해주세요.",
  FLEXIBILITY_GENRE_DUPLICATE: "이미 추가된 장르입니다.",
  FLEXIBILITY_GOAL_INVALID: "올바른 목표값을 입력하세요.",
  FLEXIBILITY_BPM_SAVED: "BPM 범위가 저장되었습니다.",
  FLEXIBILITY_GENRE_UPDATED: "장르가 수정되었습니다.",
  FLEXIBILITY_GENRE_MAIN_REQUIRED: "주력 장르를 1개 이상 입력하세요.",

  // 네트워킹
  NETWORKING_DANCER_REQUIRED: "댄서 이름을 입력해주세요.",
  NETWORKING_DANCER_DUPLICATE: "이미 추가된 댄서입니다.",
  NETWORKING_DANCER_UPDATED: "댄서 정보가 수정되었습니다.",
  NETWORKING_RELATION_ADDED: "관계가 추가되었습니다",
  NETWORKING_RELATION_DELETED: "관계가 삭제되었습니다",

  // 댄스 스타일 분석
  STYLE_ANALYSIS_DATE_REQUIRED: "날짜를 입력해주세요.",
  STYLE_ANALYSIS_ADDED: "분석 기록이 추가되었습니다.",
  STYLE_ANALYSIS_UPDATED: "분석 기록이 수정되었습니다.",
  STYLE_ANALYSIS_DELETED: "분석 기록이 삭제되었습니다.",

  // 댄스 스타일 프로필
  STYLE_PROFILE_GENRE_MIN: "주력 장르를 1개 이상 입력하세요.",
  STYLE_PROFILE_SAVED: "프로필이 저장되었습니다.",

  // 영상 포트폴리오 (dance-video-portfolio-card)
  VIDEO_PORTFOLIO_URL_REQUIRED: "영상 URL을 입력해주세요.",
  VIDEO_PORTFOLIO_DELETED: "영상이 삭제되었습니다.",

  // 워크숍
  WORKSHOP_DATE_REQUIRED: "날짜를 입력해주세요.",
  WORKSHOP_EDIT_ERROR: "워크숍 수정 중 오류가 발생했습니다.",
  WORKSHOP_DELETE_ERROR: "워크숍 삭제 중 오류가 발생했습니다.",
  WORKSHOP_UPDATED: "워크숍 이력이 수정되었습니다.",

  // 식단 트래커
  DIET_FOOD_REQUIRED: "음식을 하나 이상 입력하세요.",
  DIET_DATE_REQUIRED: "날짜를 입력해주세요.",
  DIET_WATER_RANGE: "수분 섭취량은 0~10000ml 범위여야 합니다.",
  DIET_SAVED: "식사가 기록되었습니다.",
  DIET_UPDATED: "식사 기록이 수정되었습니다.",
  DIET_DELETED: "식사 기록이 삭제되었습니다.",

  // 긴급 연락처
  EMERGENCY_CONTACT_NAME_REQUIRED: "이름을 입력해주세요.",
  EMERGENCY_CONTACT_PHONE_REQUIRED: "전화번호를 입력해주세요.",
  EMERGENCY_CONTACT_MEMBER_REQUIRED: "멤버를 선택해 주세요",
  EMERGENCY_CONTACT_DUPLICATE: "이미 등록된 이름이거나 입력이 잘못되었습니다.",
  EMERGENCY_CONTACT_DELETE_ERROR: "멤버 삭제에 실패했습니다.",

  // 참여 캠페인
  CAMPAIGN_MEMBER_REQUIRED: "발송할 멤버를 선택해주세요",
  CAMPAIGN_CONTENT_REQUIRED: "메시지를 입력해주세요",
  CAMPAIGN_SEND_ERROR: "메시지 발송 중 오류가 발생했습니다",
  CAMPAIGN_SEND_ERROR2: "메시지 발송에 실패했습니다",
  CAMPAIGN_CREATED: "캠페인이 생성되었습니다.",
  CAMPAIGN_DELETED: "캠페인이 삭제되었습니다.",
  CAMPAIGN_COMPLETED: "캠페인이 완료 처리되었습니다.",

  // 성장 일지
  GROWTH_JOURNAL_DATE_REQUIRED: "날짜를 입력해주세요.",
  GROWTH_JOURNAL_CONTENT_REQUIRED: "내용을 입력해주세요.",
  GROWTH_JOURNAL_SAVED: "일지가 저장되었습니다.",
  GROWTH_JOURNAL_UPDATED: "일지가 수정되었습니다.",
  GROWTH_JOURNAL_DELETED: "일지가 삭제되었습니다.",

  // 건강 트래킹
  HEALTH_DATE_REQUIRED: "날짜를 선택해주세요.",
  HEALTH_VALUE_INVALID: "올바른 측정값을 입력하세요.",
  HEALTH_DUPLICATE: "해당 날짜의 기록이 이미 있습니다. 수정 버튼을 이용해 주세요.",
  HEALTH_SAVED: "성장 일지가 저장되었습니다.",

  // 비활성 멤버
  INACTIVE_AUTH_REQUIRED: "로그인이 필요합니다",
  INACTIVE_ALERT_ERROR: "알림 발송에 실패했습니다",
  INACTIVE_MEMBER_MIN: "그룹에 멤버가 없습니다",

  // 부상 기록 (injury-log-card)
  INJURY_LOG_MEMBER_REQUIRED: "멤버를 선택해주세요.",
  INJURY_LOG_PART_REQUIRED: "부상 부위를 선택해주세요.",
  INJURY_LOG_DESC_REQUIRED: "부상 설명을 입력해주세요.",
  INJURY_LOG_SEVERITY_REQUIRED: "심각도를 선택해주세요.",
  INJURY_LOG_DATE_REQUIRED: "부상 날짜를 입력해주세요.",
  INJURY_LOG_ADDED: "부상 기록이 추가되었습니다.",
  INJURY_LOG_UPDATED: "부상 기록이 수정되었습니다.",
  INJURY_LOG_DELETED: "부상 기록이 삭제되었습니다.",
  INJURY_LOG_RECOVERED: "완치 처리되었습니다.",
  INJURY_LOG_RECOVERING: "회복중으로 변경되었습니다.",

  // 부상 트래커 (injury-tracker-card)
  INJURY_TRACKER_REQUIRED: "멤버, 부위, 설명, 심각도, 부상일은 필수입니다.",
  INJURY_TRACKER_MEMBER_REQUIRED: "멤버 이름을 입력하세요",
  INJURY_TRACKER_DATE_REQUIRED: "발생일을 입력해주세요.",
  INJURY_TRACKER_TYPE_REQUIRED: "부상 유형을 선택해주세요.",
  INJURY_TRACKER_ADDED: "부상이 기록되었습니다.",
  INJURY_TRACKER_REGISTERED: "부상이 등록되었습니다.",

  // 영감 보드
  INSPIRATION_ITEM_ADDED: "영감 아이템이 추가되었습니다.",
  INSPIRATION_ITEM_DELETED: "아이템이 삭제되었습니다.",

  // 초대
  INVITE_MEMBER_REQUIRED: "수신자를 선택해주세요",
  INVITE_SEND_ERROR: "멤버 초대에 실패했습니다",

  // 칭찬 보드
  KUDOS_NAME_REQUIRED: "이름을 입력해주세요.",
  KUDOS_RECEIVER_REQUIRED: "받는 사람을 선택해주세요.",
  KUDOS_MESSAGE_REQUIRED: "칭찬 메시지를 입력해주세요.",
  KUDOS_DELETED: "칭찬 메시지를 삭제했습니다.",
  KUDOS_SEND_ERROR: "칭찬 전송 중 오류가 발생했습니다.",

  // 휴가 관리
  LEAVE_DATE_REQUIRED: "시작일과 종료일을 입력해주세요.",
  LEAVE_DATE_ORDER: "시작일이 종료일보다 늦을 수 없습니다.",
  LEAVE_REASON_REQUIRED: "휴가 사유를 선택해주세요.",
  LEAVE_DELETED: "휴가 기록이 삭제되었습니다.",

  // 마스터리 커브
  MASTERY_DELETED: "안무가 삭제되었습니다.",

  // 멤버 필터 프리셋
  PRESET_NAME_REQUIRED: "프리셋 이름을 입력해주세요",
  PRESET_DEFAULT_DELETE_ERROR: "기본 프리셋은 삭제할 수 없습니다",
  PRESET_DELETED: "프리셋이 삭제되었습니다",

  // 멤버 소개 카드 다이얼로그
  INTRO_CARD_DIALOG_MIN_REQUIRED: "최소 한 가지 항목을 입력해주세요",
  INTRO_CARD_DIALOG_SAVED: "자기소개 카드가 저장되었습니다",

  // 멤버 메모
  NOTE_CONTENT_REQUIRED: "메모 내용을 입력해주세요",
  NOTE_SAVE_ERROR: "메모 저장에 실패했습니다",
  NOTE_DELETE_ERROR: "메모 삭제에 실패했습니다",
  NOTE_SAVED: "메모가 저장되었습니다",
  NOTE_ADDED: "메모가 추가되었습니다",
  NOTE_UPDATED: "메모가 수정되었습니다",
  NOTE_DELETED: "메모가 삭제되었습니다",

  // 멤버 역할 배지
  ROLE_BADGE_DEFAULT_DELETE_ERROR: "기본 배지는 삭제할 수 없습니다.",
  ROLE_BADGE_LEVEL_ERROR: "레벨 변경에 실패했습니다",
  ROLE_BADGE_SKILL_REQUIRED: "스킬 이름을 입력하세요",
  ROLE_BADGE_SKILL_DUPLICATE: "이미 존재하는 스킬입니다",
  ROLE_BADGE_SKILL_SAVE_ERROR: "스킬 저장에 실패했습니다",
  ROLE_BADGE_SKILL_DELETE_ERROR: "스킬 삭제에 실패했습니다",
  ROLE_BADGE_SKILL_UNLOCK_ERROR: "스킬을 해금할 수 없습니다",
  ROLE_BADGE_TREE_RESET: "스킬 트리가 초기화되었습니다",
  ROLE_BADGE_MONTHLY_SAVED: "이번 달 스킬이 기록되었습니다",

  // 멘탈 웰니스
  MENTAL_DATE_REQUIRED: "날짜를 선택해주세요.",
  MENTAL_MOOD_REQUIRED: "기분을 선택해주세요.",
  MENTAL_SAVED: "오늘의 심리 상태가 저장되었습니다.",
  MENTAL_UPDATED: "심리 상태 기록이 수정되었습니다.",

  // 무드 체크인
  MOOD_DATE_REQUIRED: "날짜를 선택해주세요.",
  MOOD_SAVED: "기분이 저장되었습니다.",

  // 파트너 매칭
  PARTNER_MEMBER_REQUIRED: "멤버를 선택해 주세요",
  PARTNER_SAME_PERSON: "서로 다른 멤버를 선택하세요",
  PARTNER_MATCHED: "짝꿍 매칭이 완료되었습니다",

  // 동료 피드백
  PEER_FEEDBACK_EVALUATOR_REQUIRED: "평가자 이름을 입력해주세요.",
  PEER_FEEDBACK_EVALUATEE_REQUIRED: "평가 대상자 이름을 입력해주세요.",
  PEER_FEEDBACK_PEER_REQUIRED: "평가할 동료를 선택해주세요.",
  PEER_FEEDBACK_ALL_REQUIRED: "모든 항목에 점수를 입력해주세요.",
  PEER_FEEDBACK_PARTIAL_ERROR: "일부 점수 저장에 실패했습니다.",

  // 동료 점수
  PEER_SCORE_TITLE_REQUIRED: "제목을 입력해 주세요.",
  PEER_SCORE_MEMBER_REQUIRED: "멤버명을 입력해주세요",
  PEER_SCORE_MEMBER_DUPLICATE: "이미 존재하는 멤버입니다",
  PEER_SCORE_DELETED: "점수가 삭제되었습니다.",

  // 성격 프로필
  PERSONALITY_INTRO_REQUIRED: "설명을 입력해주세요",
  PERSONALITY_TAG_DUPLICATE: "이미 추가된 태그입니다.",
  PERSONALITY_ITEM_DUPLICATE: "이미 추가된 항목입니다.",
  PERSONALITY_SAVED: "자기소개가 저장되었습니다.",
  PERSONALITY_POSITION_SAVED: "포지션이 저장되었습니다.",

  // 연습 일지
  PRACTICE_JOURNAL_DATE_REQUIRED: "날짜를 입력해주세요.",
  PRACTICE_JOURNAL_CONTENT_REQUIRED: "내용을 입력해주세요.",
  PRACTICE_JOURNAL_SAVED: "일지가 저장되었습니다.",
  PRACTICE_JOURNAL_UPDATED: "일지가 수정되었습니다.",
  PRACTICE_JOURNAL_DELETED: "일지가 삭제되었습니다.",

  // 보상 포인트 카드
  REWARD_POINTS_MEMBER_REQUIRED: "멤버를 선택해주세요.",
  REWARD_POINTS_POINT_REQUIRED: "포인트를 입력해주세요",

  // 역할 승격
  ROLE_PROMOTION_ERROR: "역할 승격에 실패했습니다",

  // 일정 선호도
  SCHEDULE_PREF_DATE_REQUIRED: "날짜를 선택해주세요.",
  SCHEDULE_PREF_TIME_REQUIRED: "시작일과 종료일을 입력해주세요.",

  // 스킬 진화 트래커
  SKILL_EVOL_NAME_REQUIRED: "스킬 이름을 입력하세요",
  SKILL_EVOL_DUPLICATE: "이미 존재하는 스킬입니다",
  SKILL_EVOL_SAVE_ERROR: "스킬 저장에 실패했습니다",
  SKILL_EVOL_DELETE_ERROR: "스킬 삭제에 실패했습니다",
  SKILL_EVOL_HISTORY_DELETED: "이력이 삭제되었습니다",

  // 스킬 매트릭스
  SKILL_MATRIX_MEMBER_REQUIRED: "멤버를 선택해주세요.",
  SKILL_MATRIX_DATE_REQUIRED: "날짜를 선택해주세요.",
  SKILL_MATRIX_SECTION_AUTH_REQUIRED: "로그인이 필요합니다",

  // 스킬 트리
  SKILL_TREE_NAME_REQUIRED: "스킬 이름을 입력하세요",
  SKILL_TREE_DUPLICATE: "이미 존재하는 스킬입니다",
  SKILL_TREE_SAVE_ERROR: "스킬 저장에 실패했습니다",
  SKILL_TREE_DELETE_ERROR: "스킬 삭제에 실패했습니다",
  SKILL_TREE_UNLOCK_ERROR: "스킬을 해금할 수 없습니다",
  SKILL_TREE_RESET: "스킬 트리가 초기화되었습니다",

  // 수면 트래커
  SLEEP_DATE_REQUIRED: "날짜, 취침 시간, 기상 시간을 모두 입력해주세요.",
  SLEEP_NAP_INVALID: "낮잠 시간은 숫자로 입력해주세요.",
  SLEEP_ADDED: "수면 기록이 추가되었습니다.",
  SLEEP_DELETED: "수면 기록이 삭제되었습니다.",

  // 소셜 그래프
  SOCIAL_GRAPH_MEMBER_MIN: "매칭하려면 멤버가 2명 이상 필요합니다",

  // 윈백 메시지
  WINBACK_MEMBER_REQUIRED: "발송할 멤버를 선택해주세요",
  WINBACK_MESSAGE_REQUIRED: "메시지를 입력해주세요",
  WINBACK_SEND_ERROR: "메시지 발송 중 오류가 발생했습니다",
  WINBACK_SEND_ERROR2: "메시지 발송에 실패했습니다",

  // 윈백 캠페인
  WINBACK_CAMPAIGN_CREATED: "캠페인이 생성되었습니다.",
  WINBACK_CAMPAIGN_DELETED: "캠페인이 삭제되었습니다.",
  WINBACK_CAMPAIGN_COMPLETED: "캠페인이 완료 처리되었습니다.",

  // 영감 보드 추가
  INSPIRATION_TITLE_REQUIRED: "제목 또는 내용을 입력해주세요.",

  // 댄스 무드보드
  MOOD_BOARD_TAG_DUPLICATE: "이미 추가된 태그입니다.",
  MOOD_BOARD_ITEM_DUPLICATE: "이미 추가된 항목입니다.",
  MOOD_BOARD_ITEM_ADDED: "영감 아이템이 추가되었습니다.",
  MOOD_BOARD_ITEM_DELETED: "아이템이 삭제되었습니다.",
  MOOD_BOARD_TITLE_REQUIRED: "제목을 입력해주세요.",
  MOOD_BOARD_ITEM_UPDATED: "항목이 수정되었습니다.",
  MOOD_BOARD_ITEM_SAVED: "항목이 추가되었습니다.",

  // 댄스 스타일 프로필
  STYLE_PROFILE_GENRE_REQUIRED: "장르 이름을 입력해주세요.",
  STYLE_PROFILE_GENRE_DUPLICATE: "이미 추가된 장르입니다.",
  STYLE_PROFILE_GENRE_UPDATED: "장르가 수정되었습니다.",
  STYLE_PROFILE_GENRE_ADDED: "장르가 추가되었습니다.",
  STYLE_PROFILE_DANCER_REQUIRED: "댄서 이름을 입력해주세요.",
  STYLE_PROFILE_DANCER_DUPLICATE: "이미 추가된 댄서입니다.",
  STYLE_PROFILE_DANCER_UPDATED: "댄서 정보가 수정되었습니다.",
  STYLE_PROFILE_DANCER_ADDED: "댄서가 추가되었습니다.",

  // 사회 그래프 관계
  SOCIAL_RELATION_ADDED: "관계가 추가되었습니다",
  SOCIAL_RELATION_DELETED: "관계가 삭제되었습니다",

  // 동료 피드백 다이얼로그
  PEER_FEEDBACK_CONTENT_REQUIRED: "내용을 입력해주세요.",
  PEER_FEEDBACK_MEMBER_REQUIRED: "멤버를 선택해주세요.",

  // 댄스 다이어리 - 제목/내용 복합 필수
  DIARY_TITLE_CONTENT_REQUIRED: "제목 또는 내용을 입력해주세요.",

  // 댄스 네트워킹 - 장르 중복
  NETWORKING_GENRE_DUPLICATE: "이미 추가된 장르입니다.",

  // 영감 보드 - 태그/제목 추가
  INSPIRATION_TAG_DUPLICATE: "이미 추가된 태그입니다.",
  INSPIRATION_TITLE_INPUT_REQUIRED: "제목을 입력해 주세요.",

  // 댄스 스타일 분석 - 항목 중복
  STYLE_ANALYSIS_ITEM_DUPLICATE: "이미 추가된 항목입니다.",
  STYLE_ANALYSIS_GENRE_REQUIRED: "주력 장르를 1개 이상 입력하세요.",

  // 영상 포트폴리오 - 제목 필수
  VIDEO_PORTFOLIO_TITLE_REQUIRED: "제목을 입력해주세요.",

  // 긴급 연락처 - 멤버/연락처 선택
  EMERGENCY_MEMBER_SELECT: "멤버를 선택해주세요.",
  EMERGENCY_CONTACT_NAME_REQUIRED2: "연락처 이름을 입력해주세요.",

  // 칭찬 보드 - 보내는 사람
  KUDOS_SENDER_REQUIRED: "보내는 사람 이름을 입력해주세요.",

  // 배지 이름
  ROLE_BADGE_NAME_REQUIRED: "배지 이름을 입력해 주세요.",

  // 멤버 노트 팝오버 - 인증
  NOTE_AUTH_REQUIRED: "인증 정보를 확인할 수 없습니다",

  // 멘탈 - 날짜 필수 (날짜 입력)
  MENTAL_DATE_INPUT_REQUIRED: "날짜를 입력해주세요.",

  // 파트너 매칭 - 멤버 수 부족 / 이력 삭제
  PARTNER_MEMBER_MIN: "매칭하려면 멤버가 2명 이상 필요합니다",
  PARTNER_HISTORY_DELETED: "이력이 삭제되었습니다",

  // 동료 피드백 다이얼로그 - 내용 없음 / 전송 성공
  PEER_FEEDBACK_CONTENT_REQUIRED2: "내용을 입력해주세요",
  PEER_FEEDBACK_SENT: "피드백이 익명으로 전송되었습니다",

  // 동료 점수 - 대상자/평가자/날짜
  PEER_SCORE_EVALUATEE_REQUIRED: "평가 대상자 이름을 입력해주세요.",
  PEER_SCORE_EVALUATOR_REQUIRED: "평가자 이름을 입력해주세요.",
  PEER_SCORE_DATE_REQUIRED: "세션 날짜를 선택해주세요.",

  // 성격 프로필 - 저장
  PERSONALITY_PROFILE_SAVED: "프로필이 저장되었습니다.",

  // 연습 일지 - 제목/내용 필수
  PRACTICE_JOURNAL_TITLE_REQUIRED: "제목을 입력해주세요.",
  PRACTICE_JOURNAL_CONTENT_REQUIRED2: "배운 점, 개선할 점, 느낀 점 중 하나 이상 작성해주세요.",

  // 보상 포인트 - 멤버명/설명
  REWARD_POINTS_MEMBER_NAME_REQUIRED: "멤버명을 입력해주세요",
  REWARD_POINTS_DESC_REQUIRED: "설명을 입력해주세요",

  // 일정 선호도 - 멤버 선택
  SCHEDULE_PREF_MEMBER_REQUIRED: "멤버를 선택해주세요.",

  // 스킬 진화 트래커 - 이번 달 스킬
  SKILL_EVOL_MONTHLY_SAVED: "이번 달 스킬이 기록되었습니다",

  // 스킬 매트릭스 카드 - 스킬/멤버 중복
  SKILL_MATRIX_CARD_SKILL_REQUIRED: "스킬 이름을 입력하세요",
  SKILL_MATRIX_CARD_SKILL_DUPLICATE: "이미 존재하는 스킬입니다",
  SKILL_MATRIX_CARD_MEMBER_REQUIRED: "멤버 이름을 입력하세요",
  SKILL_MATRIX_CARD_MEMBER_DUPLICATE: "이미 존재하는 멤버입니다",

  // 스킬 매트릭스 섹션 - 스킬/레벨/삭제
  SKILL_MATRIX_SECTION_SKILL_REQUIRED: "스킬 이름을 입력하세요",
  SKILL_MATRIX_SECTION_SKILL_DUPLICATE: "이미 존재하는 스킬입니다",
  SKILL_MATRIX_SECTION_SAVE_ERROR: "스킬 저장에 실패했습니다",
  SKILL_MATRIX_SECTION_LEVEL_ERROR: "레벨 변경에 실패했습니다",
  SKILL_MATRIX_SECTION_DELETE_ERROR: "스킬 삭제에 실패했습니다",

  // 소셜 그래프 - 멤버 선택/같은 사람
  SOCIAL_GRAPH_SAME_PERSON: "서로 다른 멤버를 선택하세요",
  SOCIAL_GRAPH_MEMBER_SELECT: "멤버를 선택하세요",

  // 윈백 메시지 - 수신자/로그인
  WINBACK_MESSAGE_RECEIVER_REQUIRED: "수신자를 선택해주세요",
  WINBACK_MESSAGE_LOGIN_REQUIRED: "로그인이 필요합니다",

  // 참여 캠페인 - 메모 추가 성공
  CAMPAIGN_MEMO_ADDED: "메모가 추가되었습니다.",

  // 성장 일지 - 저장
  GROWTH_JOURNAL_SAVE_SUCCESS: "성장 일지가 저장되었습니다.",

  // 성장 일지 폼 - 멤버/제목
  GROWTH_JOURNAL_MEMBER_REQUIRED: "멤버를 선택해주세요.",
  GROWTH_JOURNAL_TITLE_REQUIRED: "제목을 입력해주세요.",

  // 건강 트래킹 - 부상 설명/발생일/기록/삭제/메모
  HEALTH_INJURY_DESC_REQUIRED: "부상 설명을 입력해주세요.",
  HEALTH_INJURY_DATE_REQUIRED: "발생일을 입력해주세요.",
  HEALTH_INJURY_RECORDED: "부상이 기록되었습니다.",
  HEALTH_RECORD_DELETED: "기록이 삭제되었습니다.",
  HEALTH_MEMO_SAVED: "메모가 저장되었습니다.",

  // 부상 트래커 - 삭제/회복/완치/상태 변경 오류
  INJURY_TRACKER_DELETED: "부상 기록이 삭제되었습니다.",
  INJURY_TRACKER_RECOVERING: "회복중으로 변경되었습니다.",
  INJURY_TRACKER_RECOVERED: "완치 처리되었습니다.",
  INJURY_TRACKER_STATUS_ERROR: "상태 변경에 실패했습니다.",

  // 부상 기록 (injury-log-card) - 부상 유형
  INJURY_LOG_TYPE_REQUIRED: "부상 유형을 선택해주세요.",

  // 기분 체크인 - 기분 선택
  MOOD_CHECKIN_SELECT: "기분을 선택해주세요.",

  // 휴가 관리 - 멤버 선택
  LEAVE_MEMBER_REQUIRED: "멤버를 선택해주세요.",

  // 댄스 컨디션 카드 - 기록 삭제
  CONDITION_RECORD_DELETED: "기록이 삭제되었습니다.",

  // 댄스 컨디션 저널 - 기록 수정/삭제/추가
  CONDITION_JOURNAL_RECORD_UPDATED: "기록이 수정되었습니다.",
  CONDITION_JOURNAL_RECORD_DELETED: "기록이 삭제되었습니다.",
  CONDITION_JOURNAL_RECORD_ADDED: "컨디션 기록이 추가되었습니다.",

  // 대회 기록 - 수정/삭제
  COMPETITION_RECORD_DELETED: "기록이 삭제되었습니다.",
  COMPETITION_RECORD_UPDATED: "기록이 수정되었습니다.",

  // 댄스 네트워킹 - 이름/연락처 수정
  NETWORKING_NAME_REQUIRED: "이름을 입력해주세요.",
  NETWORKING_CONTACT_UPDATED: "연락처를 수정했습니다.",

  // 영상 포트폴리오 - 동적 추가/수정
  VIDEO_PORTFOLIO_UPDATED: "영상 정보가 수정되었습니다.",
  VIDEO_PORTFOLIO_ADDED_NEW: "영상이 추가되었습니다.",

  // 멘탈 웰니스 - 기록 삭제
  MENTAL_RECORD_DELETED: "기록이 삭제되었습니다.",

  // 윈백 캠페인 - 멤버/메시지
  WINBACK_CAMPAIGN_MEMBER_REQUIRED: "발송할 멤버를 선택해주세요",
  WINBACK_CAMPAIGN_MESSAGE_REQUIRED: "메시지를 입력해주세요",
} as const;

/** 멤버 가용성 토스트 메시지 */
export const MEMBER_AVAILABILITY_TOAST = {
  END_AFTER_START: "종료 시각은 시작 시각보다 늦어야 합니다.",
  SLOT_ADDED: "시간대가 추가되었습니다.",
  MEMBER_REQUIRED: "멤버 이름을 입력하세요.",
  MEMBER_EXISTS: "이미 같은 이름의 멤버가 있습니다.",
} as const;

/** 멤버 가용성2 토스트 메시지 */
export const MEMBER_AVAILABILITY2_TOAST = {
  TIME_INVALID: "올바른 시간을 입력해주세요. (예: 01:23)",
} as const;

/** 멤버 생일 토스트 메시지 */
export const MEMBER_BIRTHDAY_TOAST = {
  NAME_REQUIRED: "멤버 이름을 입력해주세요.",
  MONTH_RANGE: "생일 월을 1~12 사이로 입력해주세요.",
  DAY_RANGE: "생일 일을 1~31 사이로 입력해주세요.",
  MESSAGE_REQUIRED: "축하 메시지를 입력해주세요.",
  MESSAGE_ADDED: "축하 메시지가 추가되었습니다.",
} as const;
