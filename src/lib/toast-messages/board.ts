/** 게시판 관련 토스트 메시지 */
export const BOARD_TOAST = {
  CREATED: "게시글이 등록되었습니다",
  UPDATED: "게시글이 수정되었습니다",
  DELETED: "게시글이 삭제되었습니다",
  CREATE_ERROR: "게시글 추가에 실패했습니다",
  UPDATE_ERROR: "게시글 수정에 실패했습니다",
  DELETE_ERROR: "게시글 삭제에 실패했습니다",
  LOAD_ERROR: "게시글 목록을 불러오지 못했습니다.",
  COMMENT_CREATED: "댓글이 등록되었습니다",
  COMMENT_UPDATED: "댓글이 수정되었습니다",
  COMMENT_DELETED: "댓글이 삭제되었습니다",
  COMMENT_CREATE_ERROR: "댓글 추가에 실패했습니다",
  COMMENT_UPDATE_ERROR: "댓글 수정에 실패했습니다",
  COMMENT_DELETE_ERROR: "댓글 삭제에 실패했습니다",
  COMMENT_LOAD_ERROR: "댓글 목록을 불러오지 못했습니다.",
  REACTION_ERROR: "공감 처리에 실패했습니다.",
  PIN_ERROR: "고정 설정에 실패했습니다",
  EXPORTED: "게시판 활동 데이터를 내보냈습니다.",
  BOOKMARK_LOGIN_REQUIRED: "로그인이 필요합니다",
  BOOKMARK_REMOVED: "북마크를 해제했습니다",
  BOOKMARK_ADDED: "북마크에 추가했습니다",
  BOOKMARK_ERROR: "북마크 처리에 실패했습니다",
  BOOKMARK_REMOVE_ERROR: "북마크 해제에 실패했습니다",
  LIKE_LOGIN_REQUIRED: "로그인이 필요합니다",
  LIKE_ERROR: "좋아요 처리에 실패했습니다",
  REPORT_LOGIN_REQUIRED: "로그인이 필요합니다",
  REPORT_DUPLICATE: "이미 신고한 콘텐츠입니다",
  REPORT_ERROR: "신고 제출에 실패했습니다",
  REPORT_SUBMITTED: "신고가 접수되었습니다",
  MODERATION_HIDE_SUCCESS: "댓글이 숨김 처리되었습니다",
  MODERATION_STATUS_ERROR: "신고 상태 업데이트에 실패했습니다",
  MODERATION_PROCESS_ERROR: "처리에 실패했습니다",
  MODERATION_IGNORE_SUCCESS: "신고가 무시 처리되었습니다",
  TRASH_RESTORE_ERROR: "복구에 실패했습니다",
  TRASH_RESTORED: "게시글이 복구되었습니다",
  TRASH_PERM_DELETE_ERROR: "영구 삭제에 실패했습니다",
  TRASH_PERM_DELETED: "게시글이 영구 삭제되었습니다",
  DRAFT_RESTORED: "이전 작성 내용을 복원했습니다.",
  POST_UPDATE_ERROR: "글 수정에 실패했습니다",
  POST_CREATE_ERROR: "글 작성에 실패했습니다",
} as const;

/** QnA 게시판 토스트 메시지 */
export const QNA_BOARD_TOAST = {
  ANSWER_REQUIRED: "답변 내용을 입력하세요.",
  ANSWER_REQUIRED_DOT: "답변 내용을 입력해주세요.",
  ANSWER_REGISTER_ERROR: "답변 등록에 실패했습니다.",
  ANSWER_REGISTERED: "답변이 등록되었습니다.",
} as const;

/** Q&A 보드 카드 토스트 메시지 */
export const QNA_BOARD_CARD_TOAST = {
  TITLE_REQUIRED: "제목을 입력해주세요.",
  CONTENT_REQUIRED: "질문 내용을 입력해주세요.",
  REGISTERED: "질문이 등록되었습니다.",
  DELETED: "질문이 삭제되었습니다.",
} as const;

/** 공유 메모 토스트 메시지 */
export const SHARED_MEMO_TOAST = {
  CONTENT_REQUIRED: "내용을 입력해주세요.",
  NOTE_DELETED: "노트가 삭제되었습니다.",
  NOTE_REGISTER_ERROR: "노트 등록에 실패했습니다.",
} as const;

/** 공유 메모 카드 토스트 메시지 */
export const SHARED_MEMO_CARD_TOAST = {
  MAX_LIMIT: "메모는 최대 30개까지 저장할 수 있습니다.",
  ADDED: "메모가 추가되었습니다.",
  ADD_ERROR: "메모 추가에 실패했습니다.",
  DELETED: "메모가 삭제되었습니다.",
} as const;

/** 공유 자료함 토스트 메시지 */
export const SHARED_LIBRARY_TOAST = {
  TITLE_REQUIRED: "자료 제목을 입력해주세요.",
  UPLOADER_REQUIRED: "업로더 이름을 입력해주세요.",
  ADDED: "자료가 추가되었습니다.",
  DELETED: "자료가 삭제되었습니다.",
} as const;

/** 공유 파일 토스트 메시지 */
export const SHARED_FILES_TOAST = {
  URL_REQUIRED: "URL을 입력해주세요.",
  FOLDER_REQUIRED: "폴더 이름을 입력해주세요.",
} as const;

/** 공유 파일 (상세) 토스트 메시지 */
export const SHARED_FILE_TOAST = {
  NAME_REQUIRED: "파일 이름을 입력해주세요.",
  DELETED: "파일이 삭제되었습니다.",
  ADDED: "파일이 추가되었습니다.",
  FOLDER_NAME_REQUIRED: "폴더 이름을 입력해주세요.",
  FOLDER_RENAMED: "폴더 이름이 변경되었습니다.",
  FOLDER_DELETED: "폴더가 삭제되었습니다.",
  FOLDER_CREATED: "폴더가 생성되었습니다.",
} as const;

/** 읽음 확인 토스트 메시지 */
export const READ_RECEIPT_TOAST = {
  MEMBER_EXISTS: "이미 추가된 멤버입니다.",
  TITLE_REQUIRED: "제목을 입력해주세요.",
  CONTENT_REQUIRED: "내용을 입력해주세요.",
  TARGET_REQUIRED: "대상 멤버를 1명 이상 추가해주세요.",
  READ_MARKED: "읽음으로 표시했습니다.",
  READ_CANCELLED: "읽음을 취소했습니다.",
  NOTICE_DELETED: "공지를 삭제했습니다.",
  NOTICE_REGISTERED: "공지가 등록되었습니다.",
} as const;

/** 갤러리 토스트 메시지 */
export const GALLERY_TOAST = {
  ALBUM_NAME_REQUIRED: "앨범 이름을 입력해주세요.",
  PHOTO_TITLE_REQUIRED: "사진 제목을 입력해주세요.",
  ALBUM_SELECT_REQUIRED: "앨범을 선택해주세요.",
  PHOTO_DELETED: "사진을 삭제했습니다.",
  ALBUM_DELETED: "앨범을 삭제했습니다.",
  ALBUM_CREATED: "앨범을 만들었습니다.",
  PHOTO_ADDED: "사진을 추가했습니다.",
} as const;

/** 미디어 갤러리 토스트 메시지 */
export const MEDIA_GALLERY_TOAST = {
  TITLE_REQUIRED: "제목을 입력해주세요.",
  URL_REQUIRED: "미디어 URL을 입력해주세요.",
  ALBUM_REQUIRED: "앨범 이름을 입력해주세요.",
  ADDED: "미디어가 추가되었습니다.",
  DELETED: "미디어가 삭제되었습니다.",
} as const;

/** 앨범/사진 토스트 메시지 */
export const ALBUM_TOAST = {
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
} as const;
