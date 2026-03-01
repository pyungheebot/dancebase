// ============================================
// Formation Editor (포메이션 에디터)
// ============================================

export type FormationPosition = {
  memberId: string;
  memberName: string;
  x: number;
  y: number;
  color: string;
};

export type FormationScene = {
  id: string;
  label: string;
  positions: FormationPosition[];
  createdAt: string;
};

export type FormationProject = {
  scenes: FormationScene[];
  updatedAt: string;
};

// ============================================
// Stage Formation (무대 포메이션 디자이너)
// ============================================

export type StageFormationPosition = {
  id: string;
  memberName: string;
  x: number;
  y: number;
  color: string;
};

export type StageFormationScene = {
  id: string;
  name: string;
  description: string;
  positions: StageFormationPosition[];
  order: number;
  durationSec: number | null;
};

export type StageFormationData = {
  projectId: string;
  scenes: StageFormationScene[];
  stageWidth: number;
  stageDepth: number;
  notes: string;
  updatedAt: string;
};

// ============================================
// Formation Note (동선 노트)
// ============================================

export type FormationNotePosition = {
  memberName: string;
  x: number;
  y: number;
};

export type FormationSnapshot = {
  id: string;
  name: string;
  timestamp: string;
  positions: FormationNotePosition[];
  notes?: string;
  createdAt: string;
};

export type FormationNoteData = {
  snapshots: FormationSnapshot[];
};

// ============================================
// Sound Cue Sheet (공연 음향 큐시트)
// ============================================

export type SoundCueType =
  | "bgm"
  | "sfx"
  | "narration"
  | "live"
  | "silence";

export type SoundCueAction =
  | "play"
  | "stop"
  | "fade_in"
  | "fade_out"
  | "crossfade"
  | "loop";

export type SoundCueEntry = {
  id: string;
  cueNumber: number;
  name: string;
  trackName?: string;
  artist?: string;
  type: SoundCueType;
  action: SoundCueAction;
  startTime?: string;
  endTime?: string;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
  scene?: string;
  triggerTime?: string;
  duration?: string;
  source?: string;
  notes?: string;
  isActive: boolean;
  isChecked: boolean;
};

export type SoundCueSheet = {
  id: string;
  projectId: string;
  title: string;
  cues: SoundCueEntry[];
  createdAt: string;
};

// ============================================
// Stage Risk Assessment (공연 무대 리스크 평가)
// ============================================

export type StageRiskCategory =
  | "stage_structure"
  | "lighting_electric"
  | "sound"
  | "audience_safety"
  | "performer_safety"
  | "weather"
  | "other";

export type StageRiskLevel = "low" | "medium" | "high" | "critical";
export type StageRiskResponseStatus = "pending" | "in_progress" | "done";

export type StageRiskItem = {
  id: string;
  title: string;
  category: StageRiskCategory;
  likelihood: number;
  impact: number;
  score: number;
  level: StageRiskLevel;
  mitigation: string;
  responseStatus: StageRiskResponseStatus;
  createdAt: string;
  updatedAt: string;
};

export type StageRiskData = {
  projectId: string;
  items: StageRiskItem[];
  updatedAt: string;
};

// ============================================
// Rehearsal Schedule (공연 리허설 스케줄)
// ============================================

export type RehearsalType =
  | "full_run"
  | "tech_rehearsal"
  | "dress_rehearsal"
  | "section"
  | "blocking"
  | "other"
  | "full"
  | "partial"
  | "tech"
  | "dress";

export type RehearsalScheduleEntry = {
  id: string;
  title: string;
  type: RehearsalType;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  focusAreas: string[];
  requiredMembers: string[];
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
};

export type RehearsalScheduleCheckItem = {
  id: string;
  title: string;
  isChecked: boolean;
};

export type RehearsalScheduleType = "full" | "partial" | "tech" | "dress" | "blocking";
export type RehearsalScheduleStatus = "scheduled" | "completed" | "cancelled";

export type RehearsalScheduleItem = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string | null;
  location: string | null;
  type: RehearsalScheduleType;
  participants: string[];
  checklist: RehearsalScheduleCheckItem[];
  notes: string;
  status: RehearsalScheduleStatus;
  createdAt: string;
};

export type RehearsalScheduleData = {
  projectId: string;
  rehearsals: RehearsalScheduleItem[];
  updatedAt: string;
};

// ============================================
// Rehearsal Log (리허설 진행 기록)
// ============================================

export type RehearsalIssue = {
  id: string;
  description: string;
  resolved: boolean;
};

export type RehearsalLogEntry = {
  id: string;
  date: string;
  rehearsalNumber: number;
  songsRehearsed: string[];
  completionRate: number;
  issues: RehearsalIssue[];
  nextGoals: string[];
  attendeeCount: number;
  note: string;
  createdAt: string;
};

// ============================================
// Program Book (공연 프로그램 북)
// ============================================

export type ProgramSectionType =
  | "cover"
  | "greeting"
  | "program_list"
  | "performer_intro"
  | "sponsor"
  | "notes"
  | "credits";

export type ProgramBookSection = {
  id: string;
  type: ProgramSectionType;
  title: string;
  content: string;
  order: number;
  imageUrl?: string;
  createdAt: string;
};

export type ProgramBookData = {
  id: string;
  showTitle: string;
  showDate: string;
  venue: string;
  sections: ProgramBookSection[];
  createdAt: string;
};

export type ProgramBookItemType =
  | "performance"
  | "intermission"
  | "opening"
  | "closing"
  | "special";

export type ProgramBookItem = {
  id: string;
  order: number;
  type: ProgramBookItemType;
  title: string;
  performers: string[];
  duration: string | null;
  description: string;
  musicTitle: string | null;
};

export type ProgramBookCast = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photoUrl: string | null;
};

export type ProgramBookEditorData = {
  projectId: string;
  items: ProgramBookItem[];
  cast: ProgramBookCast[];
  showTitle: string;
  showDate: string | null;
  venue: string | null;
  notes: string;
  updatedAt: string;
};

// ============================================
// Audience Feedback (공연 관객 피드백)
// ============================================

export type AudienceFeedbackRating = {
  choreography: number;
  music: number;
  costumes: number;
  stagePresence: number;
  overall: number;
};

export type AudienceFeedbackEntry = {
  id: string;
  name?: string;
  email?: string;
  ratings: AudienceFeedbackRating;
  favoritePerformance?: string;
  comment?: string;
  wouldRecommend: boolean;
  submittedAt: string;
};

export type AudienceFeedbackSurvey = {
  id: string;
  projectId: string;
  title: string;
  isActive: boolean;
  entries: AudienceFeedbackEntry[];
  createdAt: string;
};

export type AudienceFeedbackQuestion = {
  id: string;
  question: string;
  type: "rating" | "text" | "choice";
  choices: string[] | null;
};

export type AudienceFeedbackResponse = {
  id: string;
  respondentName: string | null;
  answers: Record<string, string | number>;
  submittedAt: string;
};

export type AudienceFeedbackSurveyItem = {
  id: string;
  title: string;
  questions: AudienceFeedbackQuestion[];
  responses: AudienceFeedbackResponse[];
  isActive: boolean;
  createdAt: string;
};

export type AudienceFeedbackData = {
  projectId: string;
  surveys: AudienceFeedbackSurveyItem[];
  updatedAt: string;
};

// ============================================
// Stage Memo (공연 무대 메모)
// ============================================

export type StageMemoZone =
  | "upstage-left"
  | "upstage-center"
  | "upstage-right"
  | "center-left"
  | "center"
  | "center-right"
  | "downstage-left"
  | "downstage-center"
  | "downstage-right";

export type StageMemoPriority = "high" | "medium" | "low";

export type StageMemoNote = {
  id: string;
  zone: StageMemoZone;
  priority: StageMemoPriority;
  content: string;
  author: string;
  tags: string[];
  isResolved: boolean;
  createdAt: string;
};

export type StageMemoBoard = {
  id: string;
  projectId: string;
  title: string;
  notes: StageMemoNote[];
  createdAt: string;
};

// ============================================
// Lighting Cue Sheet (무대 조명 큐시트)
// ============================================

export type LightingCueAction =
  | "on"
  | "off"
  | "fade_in"
  | "fade_out"
  | "color_change"
  | "strobe"
  | "spotlight"
  | "blackout";

export type LightingCueColor =
  | "white"
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "pink"
  | "warm"
  | "cool";

export type LightingCueEntry = {
  id: string;
  cueNumber: number;
  timestamp: string;
  action: LightingCueAction;
  color?: LightingCueColor;
  intensity: number;
  zone: string;
  notes?: string;
  createdAt: string;
};

// ============================================
// Show Review (공연 리뷰 수집)
// ============================================

export type ShowReviewSource = "audience" | "member" | "judge" | "instructor";

export type ShowReviewEntry = {
  id: string;
  reviewerName: string;
  source: ShowReviewSource;
  rating: number;
  choreographyRating: number;
  stagePresenceRating: number;
  teamworkRating: number;
  comment: string;
  highlights: string[];
  improvements: string[];
  createdAt: string;
};

// ============================================
// Poster Management (공연 포스터 관리)
// ============================================

export type PosterVersionStatus =
  | "draft"
  | "review"
  | "approved"
  | "rejected"
  | "final";

export type PosterVote = {
  memberName: string;
  rating: number;
  comment?: string;
};

export type PosterVersion = {
  id: string;
  versionNumber: number;
  title: string;
  designer: string;
  description: string;
  dimensions?: string;
  colorScheme?: string[];
  status: PosterVersionStatus;
  votes: PosterVote[];
  createdAt: string;
};

export type PosterProject = {
  id: string;
  projectId: string;
  posterName: string;
  versions: PosterVersion[];
  selectedVersionId?: string;
  deadline?: string;
  createdAt: string;
};

// ============================================
// Sponsor Tracking (공연 스폰서 후원 추적)
// ============================================

export type SponsorTier =
  | "platinum"
  | "gold"
  | "silver"
  | "bronze"
  | "individual";

export type SponsorBenefitItem = {
  id: string;
  description: string;
  isDelivered: boolean;
};

export type SponsorTrackingEntry = {
  id: string;
  sponsorName: string;
  tier: SponsorTier;
  amount: number;
  contactPerson?: string;
  contactEmail?: string;
  benefits: SponsorBenefitItem[];
  paymentReceived: boolean;
  paymentDate?: string;
  notes?: string;
  createdAt: string;
};

export type SponsorType = "financial" | "venue" | "equipment" | "media" | "other";
export type SponsorStatus = "prospect" | "negotiating" | "confirmed" | "completed";

export type SponsorEntry = {
  id: string;
  name: string;
  type: SponsorType;
  status: SponsorStatus;
  contactName: string;
  contactInfo: string;
  supportAmount: number;
  supportDescription: string;
  eventName: string;
  note: string;
  createdAt: string;
};

// ============================================
// Ticket Management (공연 티켓 관리)
// ============================================

export type TicketMgmtType =
  | "vip"
  | "general"
  | "student"
  | "early_bird"
  | "free";

export type TicketMgmtSale = {
  id: string;
  buyerName?: string;
  ticketType: TicketMgmtType;
  quantity: number;
  totalPrice: number;
  soldAt: string;
  seatInfo?: string;
  notes?: string;
};

export type TicketMgmtTier = {
  id: string;
  type: TicketMgmtType;
  price: number;
  totalSeats: number;
  description?: string;
};

export type TicketMgmtEvent = {
  id: string;
  projectId: string;
  eventName: string;
  eventDate: string;
  tiers: TicketMgmtTier[];
  sales: TicketMgmtSale[];
  createdAt: string;
};

export type TicketTier = "vip" | "general" | "student" | "free";

export type TicketReservation = {
  id: string;
  buyerName: string;
  buyerContact: string;
  tier: TicketTier;
  quantity: number;
  totalPrice: number;
  isPaid: boolean;
  reservedAt: string;
  note: string;
};

export type TicketConfig = {
  id: string;
  eventName: string;
  eventDate: string;
  tiers: { tier: TicketTier; price: number; capacity: number }[];
  reservations: TicketReservation[];
  createdAt: string;
};

// ============================================
// Seating Chart (좌석 배치도)
// ============================================

export type SeatStatus = "available" | "reserved" | "blocked";

export type SeatInfo = {
  id: string;
  row: string;
  number: number;
  status: SeatStatus;
  reservedBy: string;
  tier: "vip" | "standard" | "economy";
};

export type SeatingChart = {
  id: string;
  eventName: string;
  rows: number;
  seatsPerRow: number;
  seats: SeatInfo[];
  createdAt: string;
};

// ============================================
// Show Timeline (공연 타임라인)
// ============================================

export type ShowMilestoneStatus = "pending" | "in_progress" | "completed" | "delayed";

export type ShowMilestone = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: ShowMilestoneStatus;
  assignee: string;
  completedAt?: string;
  order: number;
};

export type ShowTimeline = {
  id: string;
  showName: string;
  showDate: string;
  milestones: ShowMilestone[];
  createdAt: string;
};

// ============================================
// Music Cuesheet (음악 큐시트)
// ============================================

export type CueAction = "play" | "fade_in" | "fade_out" | "stop" | "transition";

export type CueEntry = {
  id: string;
  order: number;
  songTitle: string;
  artist: string;
  startTime: string;
  duration: string;
  action: CueAction;
  note: string;
  volume: number;
};

export type MusicCuesheet = {
  id: string;
  title: string;
  entries: CueEntry[];
  totalDuration: string;
  createdAt: string;
  updatedAt: string;
};

// ============================================
// ShowCueSheet 타입 (공연 큐시트)
// ============================================

export type ShowCueStatus = "대기" | "진행중" | "완료";

export type ShowCueItem = {
  id: string;
  order: number;
  time: string;
  title: string;
  assignee: string;
  description: string;
  note: string;
  status: ShowCueStatus;
};

export type ShowCueSheet = {
  projectId: string;
  items: ShowCueItem[];
  updatedAt: string;
};

// ============================================
// Performance Checkin (공연 체크인)
// ============================================

export type CheckinStatus = "pending" | "arrived" | "costume_ready" | "stage_ready";

export type CheckinMember = {
  id: string;
  memberName: string;
  status: CheckinStatus;
  arrivedAt?: string;
  costumeNote: string;
  isReady: boolean;
};

export type PerformanceCheckinEvent = {
  id: string;
  eventName: string;
  eventDate: string;
  callTime: string;
  members: CheckinMember[];
  createdAt: string;
};

// ============================================
// Show Inventory (공연 물품 목록)
// ============================================

export type ShowInventoryCategory =
  | "costume"
  | "prop"
  | "tech"
  | "music"
  | "document"
  | "first_aid"
  | "other";

export type ShowInventoryItem = {
  id: string;
  name: string;
  category: ShowInventoryCategory;
  quantity: number;
  assignedTo?: string;
  packed: boolean;
  packedBy?: string;
  packedAt?: string;
  notes?: string;
  priority: "essential" | "important" | "optional";
  createdAt: string;
};

// ============================================
// Backstage Check (공연 백스테이지 체크)
// ============================================

export type BackstageCategory =
  | "sound"
  | "lighting"
  | "costume"
  | "props"
  | "safety"
  | "communication"
  | "other";

export type BackstageCheckItem = {
  id: string;
  category: BackstageCategory;
  title: string;
  description?: string;
  assignedTo?: string;
  checked: boolean;
  checkedAt?: string;
  checkedBy?: string;
  priority: "high" | "medium" | "low";
  order: number;
  createdAt: string;
};

export type BackstageCheckSession = {
  id: string;
  eventName: string;
  eventDate: string;
  items: BackstageCheckItem[];
  startedAt: string;
  completedAt?: string;
  notes?: string;
};

// ============================================
// Readiness Checklist (공연 준비도)
// ============================================

export type ReadinessCategory = "choreography" | "costume" | "music" | "stage" | "logistics" | "other";

export type ReadinessCheckItem = {
  id: string;
  category: ReadinessCategory;
  title: string;
  assignee: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  note: string;
};

export type ReadinessChecklist = {
  id: string;
  eventName: string;
  eventDate: string;
  items: ReadinessCheckItem[];
  createdAt: string;
};

// ============================================
// Performance Retro (공연 회고)
// ============================================

export type RetroCategory = "keep" | "problem" | "try";

export type RetroItem = {
  id: string;
  category: RetroCategory;
  content: string;
  authorName: string;
  votes: number;
  createdAt: string;
};

export type PerformanceRetro = {
  id: string;
  performanceTitle: string;
  performanceDate: string;
  overallRating: number;
  items: RetroItem[];
  actionItems: string[];
  createdAt: string;
};

// ============================================
// Setlist Management (세트리스트 관리)
// ============================================

export type SetlistItemType = "performance" | "mc" | "break" | "costume_change";

export type PerformanceSetlistItem = {
  id: string;
  order: number;
  type: SetlistItemType;
  title: string;
  durationSeconds: number;
  costumeChange: boolean;
  performers: string[];
  note: string;
};

export type PerformanceSetlistData = {
  id: string;
  eventName: string;
  eventDate: string;
  items: PerformanceSetlistItem[];
  createdAt: string;
  updatedAt: string;
};

export type SetListItemType =
  | "performance"
  | "mc_talk"
  | "intermission"
  | "opening"
  | "closing"
  | "encore";

export type SetListItem = {
  id: string;
  order: number;
  type: SetListItemType;
  title: string;
  artist?: string;
  duration: number;
  performers: string[];
  notes?: string;
  transitionNote?: string;
  createdAt: string;
};

// ============================================
// ShowSetlist (공연 세트리스트 v2)
// ============================================

export type ShowSetlistItem = {
  id: string;
  order: number;
  songTitle: string;
  artist: string | null;
  genre: string | null;
  duration: string | null;
  transitionNote: string | null;
  performers: string[];
  isEncore: boolean;
  notes: string;
};

export type ShowSetlistData = {
  projectId: string;
  items: ShowSetlistItem[];
  showTitle: string;
  totalDuration: string | null;
  updatedAt: string;
};

// ============================================
// Stage Props (공연 무대 소품 관리 v2)
// ============================================

export type StagePropCategory =
  | "furniture"
  | "decoration"
  | "handheld"
  | "backdrop"
  | "lighting_prop"
  | "other";

export type StagePropItemStatus =
  | "available"
  | "in_use"
  | "damaged"
  | "missing";

export type StagePropItem = {
  id: string;
  name: string;
  category: StagePropCategory;
  quantity: number;
  scene: string | null;
  placement: string | null;
  responsiblePerson: string | null;
  status: StagePropItemStatus;
  notes: string;
  createdAt: string;
};

export type StagePropData = {
  projectId: string;
  props: StagePropItem[];
  updatedAt: string;
};

// ============================================
// Marketing Campaign (공연 마케팅 캠페인 관리)
// ============================================

export type MarketingChannel =
  | "instagram"
  | "youtube"
  | "tiktok"
  | "twitter"
  | "facebook"
  | "poster"
  | "flyer"
  | "email"
  | "other";

export type MarketingCampaignTask = {
  id: string;
  title: string;
  channel: MarketingChannel;
  assignee: string | null;
  dueDate: string | null;
  status: "todo" | "in_progress" | "done";
  contentUrl: string | null;
  notes: string;
  createdAt: string;
};

export type MarketingCampaignData = {
  projectId: string;
  tasks: MarketingCampaignTask[];
  campaignName: string;
  targetAudience: string | null;
  budget: number | null;
  updatedAt: string;
};

// ============================================
// Consent Form (공연 출연 동의서 관리)
// ============================================

export type ConsentFormType =
  | "performance"
  | "photo"
  | "video"
  | "medical"
  | "liability"
  | "other";

export type ConsentFormStatus = "pending" | "signed" | "declined";

export type ConsentFormItem = {
  id: string;
  memberName: string;
  formType: ConsentFormType;
  status: ConsentFormStatus;
  signedAt: string | null;
  notes: string | null;
  createdAt: string;
};

export type ConsentFormData = {
  projectId: string;
  items: ConsentFormItem[];
  updatedAt: string;
};

// ============================================
// Photo Shoot Plan (공연 사진 촬영 계획)
// ============================================

export type PhotoShootPlanType =
  | "group"
  | "individual"
  | "action"
  | "backstage"
  | "detail";

export type PhotoShootPlan = {
  id: string;
  title: string;
  type: PhotoShootPlanType;
  location: string | null;
  timing: string | null;
  participants: string[];
  poseDescription: string | null;
  referenceUrl: string | null;
  isCompleted: boolean;
  notes: string;
  createdAt: string;
};

export type PhotoShootData = {
  projectId: string;
  plans: PhotoShootPlan[];
  photographerName: string | null;
  updatedAt: string;
};

// ============================================
// Role Rotation (역할 로테이션)
// ============================================

export type RotationRole = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

export type RotationAssignment = {
  id: string;
  roleId: string;
  memberName: string;
  weekStart: string;
  completed: boolean;
};

export type RoleRotationConfig = {
  roles: RotationRole[];
  members: string[];
  assignments: RotationAssignment[];
  rotationWeeks: number;
  createdAt: string;
};

// ============================================
// VIP Guest Management
// ============================================

export type VipGuestTier = "VVIP" | "VIP" | "general";

export type VipGuestStatus =
  | "pending"
  | "invited"
  | "confirmed"
  | "declined";

export type VipGuestEntry = {
  id: string;
  name: string;
  organization?: string;
  title?: string;
  phone?: string;
  email?: string;
  tier: VipGuestTier;
  status: VipGuestStatus;
  seatZone?: string;
  seatNumber?: string;
  specialRequest?: string;
  createdAt: string;
  updatedAt: string;
};

export type VipGuestStore = {
  groupId: string;
  projectId: string;
  entries: VipGuestEntry[];
  updatedAt: string;
};

// ============================================
// Membership Fee (공연 회원비 관리)
// ============================================

export type MembershipFeePayment = {
  id: string;
  memberName: string;
  month: string;
  amount: number;
  paidAt: string | null;
  status: "paid" | "unpaid" | "partial" | "exempt";
  notes: string | null;
};

export type MembershipFeeData = {
  groupId: string;
  payments: MembershipFeePayment[];
  monthlyFee: number;
  currency: string;
  updatedAt: string;
};
