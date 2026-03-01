/** 설정 관련 토스트 메시지 */
export const SETTINGS_TOAST = {
  SAVE_ERROR: "설정 저장에 실패했습니다.",
} as const;

/** 안내서/템플릿 토스트 메시지 */
export const TEMPLATE_TOAST = {
  ADDED: "템플릿이 추가되었습니다",
  UPDATED: "템플릿이 수정되었습니다",
  DELETED: "템플릿이 삭제되었습니다",
  NOT_FOUND: "템플릿을 찾을 수 없습니다",
  NAME_REQUIRED: "템플릿 이름을 입력해주세요",
  EMPTY: "템플릿 항목이 없습니다",
  TITLE_REQUIRED: "제목 템플릿을 입력해주세요",
  BODY_REQUIRED: "본문 템플릿을 입력해주세요",
} as const;

/** 온보딩 토스트 메시지 */
export const ONBOARDING_TOAST = {
  COMPLETED: "온보딩 완료!",
  STEP_COMPLETED: "단계 완료!",
  STEP_ADVANCED: "단계를 완료했습니다! 다음 단계가 열렸습니다.",
  STEP_REVERTED: "단계를 되돌렸습니다.",
  PROGRESS_ERROR: "진행률 업데이트에 실패했습니다.",
  PROGRESS_UPDATED: "진행률이 업데이트되었습니다.",
  TASK_COMPLETED: "과제 완료!",
  TASK_DELETE_ERROR: "할 일 추가에 실패했습니다",
  TASK_DELETED: "할 일이 삭제되었습니다",
} as const;

/** 리포트 토스트 메시지 */
export const REPORT_TOAST = {
  CREATED: "활동 리포트가 생성되었습니다.",
  DELETED: "리포트가 삭제되었습니다.",
  CREATE_ERROR: "리포트 생성에 실패했습니다.",
  DELETE_ERROR: "리포트 삭제에 실패했습니다.",
  FINANCE_EXPORTED: "재무 데이터를 내보냈습니다.",
  BOARD_EXPORTED: "게시판 활동 데이터를 내보냈습니다.",
} as const;

/** 회고 토스트 메시지 */
export const RETROSPECTIVE_TOAST = {
  CREATED: "회고가 생성되었습니다.",
  DELETED: "회고가 삭제되었습니다.",
  CREATE_ERROR: "회고 생성에 실패했습니다.",
  DELETE_ERROR: "회고 삭제에 실패했습니다.",
  ACTION_ITEM_REQUIRED: "액션 아이템을 입력해주세요.",
  ACTION_ITEM_ADDED: "액션 아이템이 추가되었습니다.",
  ACTION_ITEM_ADD_ERROR: "액션 아이템 추가에 실패했습니다.",
} as const;

/** 학습 경로 토스트 메시지 */
export const LEARNING_TOAST = {
  CREATED: "학습 경로가 생성되었습니다.",
  DELETED: "학습 경로가 삭제되었습니다.",
} as const;
