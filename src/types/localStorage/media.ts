// ============================================
// Video Library (연습 영상 라이브러리)
// ============================================

export type VideoCategory = "reference" | "tutorial" | "practice" | "performance" | "other";

export type VideoLibraryItem = {
  id: string;
  title: string;
  url: string;
  category: VideoCategory;
  addedBy: string;
  note: string;
  createdAt: string;
};

export type VideoLibraryStore = {
  items: VideoLibraryItem[];
  updatedAt: string;
};

// ============================================
// Video Feedback (영상 피드백)
// ============================================

export type VideoFeedbackTimestamp = {
  id: string;
  time: string;
  authorName: string;
  comment: string;
  category: "praise" | "correction" | "question" | "idea";
  createdAt: string;
};

export type VideoFeedbackItem = {
  id: string;
  title: string;
  videoUrl: string;
  timestamps: VideoFeedbackTimestamp[];
  createdAt: string;
};

// ============================================
// Show Gallery (공연 사진 갤러리)
// ============================================

export type ShowGalleryCategory =
  | "rehearsal"
  | "backstage"
  | "performance"
  | "group_photo"
  | "poster"
  | "other";

export type ShowGalleryPhoto = {
  id: string;
  title: string;
  description?: string;
  category: ShowGalleryCategory;
  photographer?: string;
  tags: string[];
  likes: string[];
  isFavorite: boolean;
  uploadedAt: string;
  createdAt: string;
};

export type ShowGalleryAlbum = {
  id: string;
  name: string;
  description?: string;
  photos: ShowGalleryPhoto[];
  coverPhotoId?: string;
  createdAt: string;
};

// ============================================
// Photo Album (포토 앨범)
// ============================================

export type PhotoAlbumItem = {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  tags: string[];
  takenAt: string;
  uploadedBy: string;
  createdAt: string;
};

export type PhotoAlbum = {
  id: string;
  name: string;
  coverUrl: string;
  photos: PhotoAlbumItem[];
  createdAt: string;
};

// ============================================
// Media Gallery (미디어 갤러리)
// ============================================

export type MediaGalleryItem = {
  id: string;
  type: "photo" | "video";
  title: string;
  url: string;
  thumbnailUrl: string | null;
  description: string | null;
  uploadedBy: string;
  tags: string[];
  albumId: string | null;
  createdAt: string;
};

export type MediaAlbum = {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  createdAt: string;
};

export type MediaGalleryData = {
  groupId: string;
  items: MediaGalleryItem[];
  albums: MediaAlbum[];
  updatedAt: string;
};

// ============================================
// Inspiration Board (영감 보드)
// ============================================

export type InspirationMediaType = "video" | "image" | "article" | "quote" | "idea";
export type InspirationTag = string;

export type InspirationCategory =
  | "choreography"
  | "music"
  | "fashion"
  | "stage_design"
  | "artwork"
  | "other";

export type InspirationBoardItem = {
  id: string;
  title: string;
  mediaType: InspirationMediaType;
  category: InspirationCategory;
  url?: string;
  content: string;
  tags: InspirationTag[];
  isFavorite: boolean;
  source?: string;
  createdAt: string;
};

export type InspirationBoardData = {
  memberId: string;
  items: InspirationBoardItem[];
  updatedAt: string;
};

// ============================================
// Shared File Library (그룹 공유 파일함)
// ============================================

export type SharedFileCategory =
  | "document"
  | "image"
  | "video"
  | "audio"
  | "spreadsheet"
  | "other";

export type SharedFileItem = {
  id: string;
  name: string;
  url: string;
  category: SharedFileCategory;
  description: string | null;
  uploadedBy: string;
  fileSize: string | null;
  tags: string[];
  folderId: string | null;
  createdAt: string;
};

export type SharedFileFolderItem = {
  id: string;
  name: string;
  parentId: string | null;
};

export type SharedFileData = {
  groupId: string;
  files: SharedFileItem[];
  folders: SharedFileFolderItem[];
  updatedAt: string;
};

// DanceVideoItem, DanceVideoPortfolioData — dance.ts에 정의됨
