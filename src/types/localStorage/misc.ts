// ============================================
// Music Playlist (그룹 음악 플레이리스트)
// ============================================

export type MusicPlaylistTrack = {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  genre: string;
  memo: string;
  order: number;
};

export type MusicPlaylist = {
  id: string;
  groupId: string;
  name: string;
  description: string;
  tracks: MusicPlaylistTrack[];
  createdAt: string;
  updatedAt: string;
};

// ============================================
// Group Music Library (그룹 음악 라이브러리)
// ============================================

export type MusicTrackUseCase =
  | "practice"
  | "performance"
  | "warmup"
  | "cooldown"
  | "other";

export type GroupMusicTrack = {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  bpm: number | null;
  duration: string | null;
  url: string | null;
  addedBy: string;
  tags: string[];
  isFavorite: boolean;
  useCase: MusicTrackUseCase;
  createdAt: string;
};

export type GroupMusicLibraryData = {
  groupId: string;
  tracks: GroupMusicTrack[];
  updatedAt: string;
};

// ============================================
// Music License (그룹 음악 저작권 관리)
// ============================================

export type MusicLicenseType =
  | "royalty_free"
  | "licensed"
  | "original"
  | "cover"
  | "public_domain";

export type MusicLicenseStatus =
  | "active"
  | "expiring_soon"
  | "expired"
  | "pending";

export type MusicLicenseEntry = {
  id: string;
  songTitle: string;
  artist: string;
  licenseType: MusicLicenseType;
  status: MusicLicenseStatus;
  purchaseDate?: string;
  expiryDate?: string;
  cost?: number;
  licensee: string;
  usageScope: string;
  documentUrl?: string;
  notes?: string;
  createdAt: string;
};

// ============================================
// Social Calendar (그룹 소셜 미디어 캘린더)
// ============================================

export type SocialPlatformType =
  | "instagram"
  | "youtube"
  | "tiktok"
  | "twitter"
  | "facebook"
  | "blog";

export type SocialPostStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "cancelled";

export type SocialCalendarPost = {
  id: string;
  platform: SocialPlatformType;
  title: string;
  content: string;
  scheduledDate: string;
  scheduledTime?: string;
  status: SocialPostStatus;
  assignee?: string;
  hashtags: string[];
  mediaType?: "photo" | "video" | "reel" | "story" | "text";
  notes?: string;
  createdAt: string;
};

// ============================================
// Carpool Ride
// ============================================

export type CarpoolRideStatus =
  | "open"
  | "full"
  | "departed"
  | "completed"
  | "cancelled";

export type CarpoolRide = {
  id: string;
  driverName: string;
  date: string;
  departureTime: string;
  departureLocation: string;
  destination: string;
  totalSeats: number;
  passengers: string[];
  notes?: string;
  status: CarpoolRideStatus;
  createdAt: string;
};

export type CarPoolStatus = "모집중" | "마감" | "완료";

export type CarPoolPassenger = {
  id: string;
  name: string;
  addedAt: string;
};

export type CarPoolItem = {
  id: string;
  driverName: string;
  departurePlace: string;
  arrivalPlace: string;
  departureTime: string;
  maxPassengers: number;
  carInfo?: string;
  status: CarPoolStatus;
  passengers: CarPoolPassenger[];
  createdAt: string;
};

export type CarPoolData = {
  groupId: string;
  carpools: CarPoolItem[];
  updatedAt: string;
};

// ============================================
// Receipt Management (비용 영수증 관리)
// ============================================

export type ReceiptCategory =
  | "venue"
  | "costume"
  | "equipment"
  | "food"
  | "transport"
  | "marketing"
  | "other";

export type ReceiptStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "reimbursed";

export type ReceiptEntry = {
  id: string;
  title: string;
  amount: number;
  category: ReceiptCategory;
  date: string;
  submittedBy: string;
  status: ReceiptStatus;
  approvedBy?: string;
  receiptNumber?: string;
  vendor?: string;
  notes?: string;
  createdAt: string;
};

// ============================================
// Equipment Rental (그룹 장비 대여 관리)
// ============================================

export type EquipmentRentalStatus =
  | "available"
  | "rented"
  | "overdue"
  | "maintenance";

export type EquipmentRentalRecord = {
  id: string;
  borrower: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  condition?: string;
};

export type EquipmentRentalItem = {
  id: string;
  name: string;
  category: string;
  status: EquipmentRentalStatus;
  totalQuantity: number;
  availableQuantity: number;
  rentals: EquipmentRentalRecord[];
  description?: string;
  createdAt: string;
};

// ============================================
// Equipment Inventory (장비 인벤토리 관리)
// ============================================

export type EquipmentCondition = "excellent" | "good" | "fair" | "poor" | "broken";

export type EquipmentItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  condition: EquipmentCondition;
  location: string;
  lastCheckedAt: string;
  note: string;
  createdAt: string;
};

export type EquipmentCheckout = {
  id: string;
  equipmentId: string;
  borrowerName: string;
  borrowedAt: string;
  expectedReturn: string;
  returnedAt?: string;
  note: string;
};

// ============================================
// Group Equipment (그룹 장비 관리)
// ============================================

export type EquipmentCategory = "audio" | "lighting" | "costume" | "prop" | "other";
export type GroupEquipmentCondition = "good" | "fair" | "poor" | "broken";

export type GroupEquipmentItem = {
  id: string;
  name: string;
  category: EquipmentCategory;
  quantity: number;
  condition: GroupEquipmentCondition;
  location: string | null;
  notes: string;
  createdAt: string;
};

export type EquipmentLoanRecord = {
  id: string;
  equipmentId: string;
  borrowerName: string;
  borrowedAt: string;
  returnedAt: string | null;
  quantity: number;
  notes: string;
};

export type GroupEquipmentData = {
  groupId: string;
  items: GroupEquipmentItem[];
  loans: EquipmentLoanRecord[];
  updatedAt: string;
};

// ============================================
// Music Tempo Matching (음악 템포 매칭)
// ============================================

export type TempoCategory = "very_slow" | "slow" | "moderate" | "fast" | "very_fast";

export type TempoSection = {
  label: string;
  bpm: number;
  startTime: string;
};

export type MusicTempoEntry = {
  id: string;
  songTitle: string;
  artist: string;
  bpm: number;
  tempoCategory: TempoCategory;
  sections: TempoSection[];
  note: string;
  createdAt: string;
};

// ============================================
// Digital Waiver Management (디지털 동의서 관리)
// ============================================

export type WaiverType = "safety" | "activity" | "photo" | "liability" | "custom";

export type WaiverTemplate = {
  id: string;
  title: string;
  type: WaiverType;
  content: string;
  required: boolean;
  expiresInDays?: number;
  createdAt: string;
};

export type WaiverSignature = {
  id: string;
  waiverId: string;
  memberId: string;
  memberName: string;
  signedAt: string;
  expiresAt?: string;
};

export type WaiverStore = {
  templates: WaiverTemplate[];
  signatures: WaiverSignature[];
  updatedAt: string;
};

// ============================================
// Venue Entry (연습 장소 리뷰)
// ============================================

export type VenueFeature = "mirror" | "sound" | "parking" | "aircon" | "floor" | "shower" | "wifi" | "storage";

export type VenueEntry = {
  id: string;
  name: string;
  address: string;
  hourlyRate: number;
  features: VenueFeature[];
  note: string;
  createdAt: string;
};

export type VenueReview = {
  id: string;
  venueId: string;
  reviewerName: string;
  rating: number;
  pros: string;
  cons: string;
  createdAt: string;
};

export type VenueReviewEntry = {
  id: string;
  venueName: string;
  address?: string;
  rating: number;
  floorRating: number;
  mirrorRating: number;
  soundRating: number;
  accessRating: number;
  pricePerHour?: number;
  capacity?: number;
  pros: string[];
  cons: string[];
  comment?: string;
  reviewedBy: string;
  visitDate: string;
  createdAt: string;
};

// ============================================
// Project Role Assignment Board (프로젝트 역할 배정 보드)
// ============================================

export type ProjectRoleAssignment = {
  id: string;
  roleName: string;
  assignees: string[];
  status: "open" | "filled" | "completed";
  color: string;
  note: string;
  createdAt: string;
};

// ============================================
// Show Intercom (인터컴/통신 체계)
// ============================================

export type ShowIntercomZone =
  | "stage"
  | "sound"
  | "lighting"
  | "backstage"
  | "overall"
  | "other";

export type ShowIntercomPerson = {
  id: string;
  name: string;
  callSign: string;
};

export type ShowIntercomChannel = {
  id: string;
  name: string;
  frequency: string;
  zone: ShowIntercomZone;
  isEmergency: boolean;
  persons: ShowIntercomPerson[];
  createdAt: string;
  updatedAt?: string;
};

export type ShowIntercomData = {
  projectId: string;
  channels: ShowIntercomChannel[];
  updatedAt: string;
};

// ============================================
// Stage Weather (야외 공연 날씨 관리)
// ============================================

export type StageWeatherCondition =
  | "sunny"
  | "cloudy"
  | "rainy"
  | "snowy"
  | "windy";

export type StageWeatherSafety = "safe" | "caution" | "danger";

export type StageWeatherCheckItem = {
  id: string;
  label: string;
  done: boolean;
};

export type StageWeatherPlan = {
  id: string;
  condition: StageWeatherCondition;
  action: string;
  equipment: string[];
};

export type StageWeatherRainPlan = {
  venueChange: boolean;
  alternativeVenue: string;
  raincoatReady: boolean;
  tentReady: boolean;
};

export type StageWeatherForecast = {
  id: string;
  date: string;
  condition: StageWeatherCondition;
  temperature: number;
  humidity: number;
  windNote: string;
  safety: StageWeatherSafety;
  checklist: StageWeatherCheckItem[];
};

export type StageWeatherData = {
  projectId: string;
  forecasts: StageWeatherForecast[];
  plans: StageWeatherPlan[];
  rainPlan: StageWeatherRainPlan;
  updatedAt: string;
};

// ============================================
// Show Rundown
// ============================================

export type ShowRundownItem = {
  id: string;
  startTime: string;
  endTime: string;
  activity: string;
  location: string;
  owner: string;
  participants: string;
  note: string;
  done: boolean;
};

export type ShowRundownData = {
  projectId: string;
  items: ShowRundownItem[];
  updatedAt: string;
};

// ============================================
// Show Rider (아티스트 라이더)
// ============================================

export type ShowRiderCategory =
  | "technical"
  | "backstage"
  | "catering"
  | "accommodation"
  | "transport"
  | "etc";

export type ShowRiderPriority =
  | "required"
  | "preferred"
  | "optional";

export type ShowRiderStatus =
  | "pending"
  | "secured"
  | "unavailable";

export type ShowRiderItem = {
  id: string;
  artistName: string;
  category: ShowRiderCategory;
  request: string;
  quantity: number;
  priority: ShowRiderPriority;
  status: ShowRiderStatus;
  note: string;
};

export type ShowRiderData = {
  projectId: string;
  items: ShowRiderItem[];
  updatedAt: string;
};

// ============================================
// Set Change Log (세트 전환 기록)
// ============================================

export type SetChangeItem = {
  id: string;
  order: number;
  fromScene: string;
  toScene: string;
  targetSeconds: number;
  actualSeconds: number | null;
  staffList: string[];
  propList: string[];
  memo: string;
  completed: boolean;
  createdAt: string;
};

export type SetChangeLogData = {
  projectId: string;
  items: SetChangeItem[];
  updatedAt: string;
};

// ============================================
// Ticket Sales (티켓 판매)
// ============================================

export type TicketSalesTier = {
  id: string;
  name: string;
  price: number;
  totalQty: number;
};

export type TicketSalesRecord = {
  id: string;
  buyerName: string;
  tierId: string;
  qty: number;
  date: string;
};

export type TicketSalesData = {
  projectId: string;
  tiers: TicketSalesTier[];
  records: TicketSalesRecord[];
  updatedAt: string;
};

// ============================================
// Performance Ticket (공연 티켓 관리)
// ============================================

export type PerfTicketTier = {
  id: string;
  name: string;
  price: number;
  totalQuantity: number;
  color: string;
};

export type PerfAllocationStatus = "reserved" | "confirmed" | "cancelled";

export type PerfTicketAllocation = {
  id: string;
  tierId: string;
  recipientName: string;
  quantity: number;
  status: PerfAllocationStatus;
  notes?: string;
  createdAt: string;
};

export type PerfTicketData = {
  projectId: string;
  tiers: PerfTicketTier[];
  allocations: PerfTicketAllocation[];
  salesGoal: number | null;
  updatedAt: string;
};

// ============================================
// Stage Access (스테이지 접근 관리)
// ============================================

export type StageAccessRole =
  | "출연진"
  | "스태프"
  | "VIP"
  | "미디어"
  | "기타";

export type StageAccessZone =
  | "무대"
  | "백스테이지"
  | "관객석"
  | "모든구역";

export type StageAccessStatus = "활성" | "비활성" | "분실";

export type StageAccessPass = {
  id: string;
  name: string;
  role: StageAccessRole;
  zone: StageAccessZone;
  passNumber: string;
  issuedAt: string;
  expiresAt: string;
  status: StageAccessStatus;
  createdAt: string;
};

export type StageAccessData = {
  projectId: string;
  passes: StageAccessPass[];
  updatedAt: string;
};

// FlexTrackPart, FlexTrackUnit, FlexTrackRecord, FlexTrackPartConfig, FlexTrackData — dance.ts에 정의됨
// MoodBoardCategory, MoodBoardItem, MoodBoardData — dance.ts에 정의됨
// MyPlaylistSongPurpose, MyPlaylistSong, MyPlaylist, MyPlaylistData — dance.ts에 정의됨

// ============================================
// Q&A Board (Q&A 보드)
// ============================================

export type QnaBoardStatus = "open" | "answered" | "closed";

export type QnaBoardAnswer = {
  id: string;
  authorName: string;
  content: string;
  isAccepted: boolean;
  createdAt: string;
};

export type QnaBoardQuestion = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  tags: string[];
  status: QnaBoardStatus;
  answers: QnaBoardAnswer[];
  createdAt: string;
};

// ============================================
// Group Poll (그룹 설문)
// ============================================

export type GroupPollOption = {
  id: string;
  text: string;
  voterIds: string[];
};


// ============================================
// 누락된 타입 (원본 파일에서 복원)
// ============================================


// PersonalGoalStatus — member.ts에 정의됨

// ============================================
// Kudos Board (멤버 칭찬 보드)
// ============================================

export type KudosCategory = "teamwork" | "effort" | "creativity" | "leadership" | "improvement";

export type KudosMessage = {
  id: string;
  fromName: string;
  toName: string;
  category: KudosCategory;
  message: string;
  createdAt: string;
};


// DietTrackerWater — member.ts에 정의됨

// ============================================
// Group Energy Tracker (그룹 에너지 트래커)
// ============================================

export type EnergyDimension = "morale" | "motivation" | "fatigue";

export type EnergyRecord = {
  id: string;
  date: string;
  recordedBy: string;
  scores: Record<EnergyDimension, number>;
  note: string;
  createdAt: string;
};

// ============================================
// Goal Board (연습 목표 보드)
// ============================================

export type GoalBoardStatus = "todo" | "in_progress" | "done";
export type GoalBoardPriority = "low" | "medium" | "high";

export type GoalBoardItem = {
  id: string;
  title: string;
  description: string;
  status: GoalBoardStatus;
  priority: GoalBoardPriority;
  assignees: string[];
  dueDate?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
};

// ============================================
// Mentoring System (멘토링 매칭)
// ============================================

export type MentoringStatus = "active" | "completed" | "paused";

export type MentoringFeedback = {
  id: string;
  date: string;
  content: string;
  rating: number;
  writtenBy: "mentor" | "mentee";
};

export type MentoringPair = {
  id: string;
  mentorId: string;
  mentorName: string;
  menteeId: string;
  menteeName: string;
  goal: string;
  status: MentoringStatus;
  startDate: string;
  endDate?: string;
  feedbacks: MentoringFeedback[];
  createdAt: string;
};


// ============================================
// Onboarding Checklist (신입 멤버 온보딩 체크리스트)
// ============================================

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
};

export type OnboardingProgress = {
  userId: string;
  steps: OnboardingStep[];
  startedAt: string;
  completionRate: number;
};

// ============================================
// Group Activity Heatmap (그룹 활동 히트맵)
// ============================================

export type HeatmapCell = {
  dayIndex: number;
  hourSlot: number;
  attendanceCount: number;
  scheduleCount: number;
  avgAttendanceRate: number;
};

export type ActivityHeatmapData = {
  cells: HeatmapCell[];
  bestSlots: { dayIndex: number; hourSlot: number; rate: number }[];
};


// ============================================
// Attendance Streak (출결 스트릭)
// ============================================

export type StreakRecord = {
  date: string;
  attended: boolean;
};

export type MemberStreak = {
  id: string;
  memberName: string;
  records: StreakRecord[];
  currentStreak: number;
  longestStreak: number;
  totalAttended: number;
  totalSessions: number;
};


// ============================================
// Attendance Heatmap (출석 히트맵)
// ============================================

export type HeatmapDayData = {
  date: string;
  count: number;
  activities: string[];
};

export type AttendanceHeatmapData = {
  memberName: string;
  year: number;
  days: HeatmapDayData[];
  totalActiveDays: number;
  longestStreak: number;
};


export type AttendanceDashStatus = "present" | "late" | "absent" | "excused";

export type AttendanceDashRecord = {
  id: string;
  memberName: string;
  date: string;
  status: AttendanceDashStatus;
  notes?: string;
};

export type AttendanceDashSummary = {
  memberName: string;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  attendanceRate: number;
};

export type MusicQueueTrack = {
  id: string;
  title: string;
  artist?: string;
  durationSeconds: number;
  bpm?: number;
  genre?: string;
  notes?: string;
};

export type MusicQueueSet = {
  id: string;
  setName: string;
  tracks: MusicQueueTrack[];
  totalDuration: number;
  isActive: boolean;
  createdAt: string;
};

export type SharedLibFileType =
  | "document"
  | "spreadsheet"
  | "presentation"
  | "video"
  | "audio"
  | "image"
  | "link"
  | "other";

export type SharedLibItem = {
  id: string;
  title: string;
  fileType: SharedLibFileType;
  url?: string;
  description?: string;
  category: string;
  uploadedBy: string;
  tags: string[];
  downloadCount: number;
  isPinned: boolean;
  createdAt: string;
};


type StageTransitionTaskLegacy = {
  id: string;
  description: string;
  assignee?: string;
  durationSeconds: number;
  isCompleted: boolean;
};

export type StageTransitionEntry = {
  id: string;
  fromScene: string;
  toScene: string;
  transitionOrder: number;
  tasks: StageTransitionTaskLegacy[];
  totalDuration: number;
  notes?: string;
  lightingChange?: string;
  musicChange?: string;
  propsNeeded: string[];
  createdAt: string;
};

// AttendanceForecastIntent, AttendanceForecastResponse — event.ts에 정의됨



// ============================================================
// 공연 협찬품 관리
// ============================================================


export type SponsoredGoodsStatus =
  | "pending"
  | "received"
  | "distributed"
  | "returned";

export type SponsoredGoodsDistribution = {
  memberName: string;
  quantity: number;
  distributedAt: string;
};

export type SponsoredGoodsItem = {
  id: string;
  itemName: string;
  sponsor: string;
  quantity: number;
  status: SponsoredGoodsStatus;
  estimatedValue?: number;
  receivedDate?: string;
  returnDueDate?: string;
  distributions: SponsoredGoodsDistribution[];
  category?: string;
  notes?: string;
  createdAt: string;
};



// ============================================================
// 공연 관객 좌석 예약
// ============================================================


export type SeatReservationStatus =
  | "available"
  | "reserved"
  | "occupied"
  | "blocked";

export type SeatReservationEntry = {
  id: string;
  seatLabel: string;
  row: string;
  number: number;
  status: SeatReservationStatus;
  reservedBy?: string;
  reservedFor?: string;
  phone?: string;
  notes?: string;
  reservedAt?: string;
};

export type SeatReservationLayout = {
  id: string;
  projectId: string;
  layoutName: string;
  rows: number;
  seatsPerRow: number;
  seats: SeatReservationEntry[];
  createdAt: string;
};


// ============================================================
// 그룹 팀빌딩 활동
// ============================================================


export type TeamBuildingCategory =
  | "ice_breaker"
  | "trust"
  | "creativity"
  | "communication"
  | "party"
  | "outdoor"
  | "other";

export type TeamBuildingParticipant = {
  memberName: string;
  feedback?: string;
  rating?: number; // 1-5
};

export type TeamBuildingEvent = {
  id: string;
  title: string;
  category: TeamBuildingCategory;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  organizer: string;
  /** 소요 시간 (분) */
  duration?: number;
  budget?: number;
  participants: TeamBuildingParticipant[];
  maxParticipants?: number;
  isCompleted: boolean;
  photos?: string[];
  createdAt: string;
};


// ============================================================
// 그룹 연습 날씨 알림
// ============================================================


export type WeatherAlertCondition =
  | "sunny"
  | "cloudy"
  | "rainy"
  | "snowy"
  | "windy"
  | "hot"
  | "cold"
  | "humid";

export type WeatherAlertLevel = "safe" | "caution" | "warning" | "danger";

export type WeatherAlertEntry = {
  id: string;
  date: string;
  condition: WeatherAlertCondition;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  alertLevel: WeatherAlertLevel;
  recommendation: string;
  isOutdoorSafe: boolean;
  notes?: string;
  createdBy: string;
  createdAt: string;
};


// ============================================================
// 공연 기술 요구사항
// ============================================================


export type TechRequirementCategory =
  | "sound"
  | "lighting"
  | "video"
  | "stage"
  | "power"
  | "communication"
  | "other";

export type TechRequirementPriority =
  | "essential"
  | "important"
  | "nice_to_have";

export type TechRequirementItem = {
  id: string;
  category: TechRequirementCategory;
  title: string;
  description: string;
  priority: TechRequirementPriority;
  quantity?: number;
  isAvailable: boolean;
  supplier?: string;
  estimatedCost?: number;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
};


// ============================================================
// 그룹 공연 히스토리
// ============================================================


export type PerformanceHistoryType =
  | "concert"
  | "competition"
  | "festival"
  | "showcase"
  | "flash_mob"
  | "other";

export type PerformanceHistoryRecord = {
  id: string;
  title: string;
  type: PerformanceHistoryType;
  date: string;
  venue: string;
  audienceCount?: number;
  performers: string[];
  setlist: string[];
  awards?: string[];
  rating?: number;
  highlights?: string;
  lessonsLearned?: string;
  createdAt: string;
};


// ============================================
// 멤버 체중/체형 추적
// ============================================


export type BodyTrackerEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  weight?: number; // kg
  bodyFat?: number; // %
  muscleMass?: number; // kg
  height?: number; // cm
  waist?: number; // cm
  notes?: string;
  createdAt: string;
};


// ============================================================
// 공연 무대 평면도
// ============================================================


export type StageLayoutItemType =
  | "speaker"
  | "light"
  | "prop"
  | "screen"
  | "mic"
  | "camera"
  | "table"
  | "chair"
  | "other";

export type StageLayoutItem = {
  id: string;
  type: StageLayoutItemType;
  label: string;
  x: number; // 0-100 (%)
  y: number; // 0-100 (%)
  width?: number; // 상대 너비 (기본 8)
  height?: number; // 상대 높이 (기본 8)
  rotation?: number; // 도(degree)
  notes?: string;
};

export type StageLayoutPlan = {
  id: string;
  projectId: string;
  planName: string;
  items: StageLayoutItem[];
  stageWidth?: number; // 단위: m
  stageDepth?: number; // 단위: m
  createdAt: string;
};


// ============================================================
// 공연 커튼콜 계획
// ============================================================


export type CurtainCallStep = {
  id: string;
  order: number;
  description: string;
  performers: string[];
  position?: string;
  durationSeconds?: number;
  bowType?: "individual" | "group" | "lead" | "all";
};

export type CurtainCallPlan = {
  id: string;
  projectId: string;
  planName: string;
  steps: CurtainCallStep[];
  musicTrack?: string;
  totalDuration?: number;
  notes?: string;
  createdAt: string;
};

export type MentalWellnessEntry = {
  id: string;
  date: string;
  confidence: number; // 1-10 자신감
  stress: number; // 1-10 스트레스
  motivation: number; // 1-10 동기
  anxiety: number; // 1-10 불안
  overallMood: "great" | "good" | "okay" | "low" | "struggling";
  journalNote?: string;
  copingStrategies?: string[];
  createdAt: string;
};


// ============================================================
// 그룹 대회 준비 체크
// ============================================================


export type CompetitionPrepCategory =
  | "registration"
  | "choreography"
  | "music"
  | "costume"
  | "travel"
  | "documents"
  | "other";

export type CompetitionPrepItem = {
  id: string;
  category: CompetitionPrepCategory;
  task: string;
  assignee?: string;
  dueDate?: string;
  isCompleted: boolean;
  notes?: string;
};

export type CompetitionPrepEvent = {
  id: string;
  competitionName: string;
  date: string;
  location: string;
  category?: string;
  items: CompetitionPrepItem[];
  teamSize?: number;
  registrationDeadline?: string;
  notes?: string;
  createdAt: string;
};

export type SoundcheckChannel = {
  id: string;
  channelNumber: number;
  source: string;
  type: "vocal" | "instrument" | "playback" | "sfx" | "monitor";
  volume: number; // 0-100
  pan?: number; // -100 ~ 100
  eq?: string;
  isChecked: boolean;
  notes?: string;
};

export type SoundcheckSheet = {
  id: string;
  projectId: string;
  sheetName: string;
  channels: SoundcheckChannel[];
  engineer?: string;
  checkDate?: string;
  overallNotes?: string;
  createdAt: string;
};


// ============================================================
// 공연 앵콜 계획
// ============================================================


export type EncoreTriggerCondition =
  | "audience_request"
  | "standing_ovation"
  | "time_available"
  | "planned"
  | "spontaneous";

export type EncoreSong = {
  id: string;
  order: number;
  songTitle: string;
  artist?: string;
  durationSeconds: number;
  performers: string[];
  notes?: string;
};

export type EncorePlan = {
  id: string;
  projectId: string;
  planName: string;
  songs: EncoreSong[];
  triggerCondition: EncoreTriggerCondition;
  maxEncores: number;
  signalCue?: string;
  lightingNotes?: string;
  notes?: string;
  createdAt: string;
};


// ============================================================
// 그룹 연습 비디오 리뷰
// ============================================================


export type VideoReviewTimestampType = "praise" | "correction" | "question" | "note";

export type VideoReviewTimestamp = {
  id: string;
  time: string; // MM:SS 형식
  comment: string;
  author: string;
  type: VideoReviewTimestampType;
  createdAt: string;
};

export type VideoReviewEntry = {
  id: string;
  title: string;
  videoUrl?: string;
  date: string;
  duration?: string;
  description?: string;
  timestamps: VideoReviewTimestamp[];
  overallRating?: number; // 1-5
  reviewedBy: string[];
  createdAt: string;
};


// ============================================================
// 멤버 목표 달성 배지 (Achievement Badges)
// ============================================================


export type AchievementBadgeCategory =
  | "practice"   // 연습
  | "performance" // 공연
  | "teamwork"   // 팀워크
  | "attendance" // 출석
  | "skill"      // 실력
  | "leadership" // 리더십
  | "other";     // 기타

export type AchievementBadgeLevel =
  | "bronze"  // 브론즈
  | "silver"  // 실버
  | "gold";   // 골드

export type AchievementBadgeEntry = {
  id: string;
  memberId: string;
  memberName: string;
  title: string;
  description?: string;
  category: AchievementBadgeCategory;
  level: AchievementBadgeLevel;
  condition?: string;   // 획득 조건 설명
  earnedAt: string;     // ISO 날짜 문자열
  awardedBy?: string;   // 수여자 이름 (선택)
  createdAt: string;
};

export type PracticeVenueFacility =
  | "mirror"      // 거울
  | "sound"       // 음향
  | "parking"     // 주차
  | "shower"      // 샤워실
  | "locker"      // 사물함
  | "aircon"      // 에어컨
  | "heating"     // 난방
  | "piano"       // 피아노
  | "stage"       // 무대
  | "bar";        // 바(연습용 봉)

export type PracticeVenueStatus =
  | "available"   // 예약 가능
  | "booked"      // 예약됨
  | "unavailable" // 이용 불가
  | "unknown";    // 상태 미확인

export type PracticeVenueEntry = {
  id: string;
  name: string;           // 장소명
  address?: string;       // 주소
  phone?: string;         // 전화번호
  website?: string;       // 웹사이트 URL
  costPerHour?: number;   // 시간당 비용 (원)
  capacity?: number;      // 수용 인원
  size?: number;          // 면적 (m²)
  facilities: PracticeVenueFacility[]; // 시설 목록
  status: PracticeVenueStatus;         // 예약 상태
  rating?: number;        // 평점 (1-5)
  ratingCount: number;    // 평점 참여 수
  isFavorite: boolean;    // 즐겨찾기 여부
  memo?: string;          // 메모
  lastUsedAt?: string;    // 마지막 이용일 (ISO date string)
  createdAt: string;      // 생성일 (ISO datetime string)
};


// ============================================================
// 공연 프로그램 편집 (Show Program Editor)
// ============================================================


export type ShowProgramPiece = {
  id: string;
  order: number;           // 순서 인덱스 (1부터)
  title: string;           // 작품/곡명
  subtitle?: string;       // 부제 (선택)
  choreographer?: string;  // 안무가
  performers: string[];    // 출연자 목록
  duration?: string;       // 소요시간 (예: "3분 30초")
  notes?: string;          // 추가 메모
};

export type ShowProgramCreditRole =
  | "director"       // 연출
  | "choreographer"  // 안무
  | "music"          // 음악/음향
  | "lighting"       // 조명
  | "costume"        // 의상
  | "makeup"         // 메이크업
  | "stage"          // 무대 감독
  | "photography"    // 사진/영상
  | "design"         // 디자인
  | "sponsor"        // 후원
  | "other";         // 기타

export type ShowProgramCredit = {
  id: string;
  role: ShowProgramCreditRole;
  roleLabel?: string;  // 역할 커스텀 레이블 (role이 other일 때)
  names: string[];     // 담당자 이름 목록
};

export type ShowProgramSponsor = {
  id: string;
  name: string;        // 스폰서명
  tier?: string;       // 등급 (예: 골드, 실버, 브론즈)
  description?: string;
};

export type ShowProgramEntry = {
  id: string;
  groupId: string;
  projectId: string;
  showTitle: string;            // 공연 제목
  showSubtitle?: string;        // 부제
  showDate?: string;            // 공연 날짜 (ISO)
  venue?: string;               // 공연 장소
  greeting?: string;            // 인사말
  closingMessage?: string;      // 마무리 인사
  pieces: ShowProgramPiece[];   // 프로그램 순서
  credits: ShowProgramCredit[]; // 크레딧
  sponsors: ShowProgramSponsor[]; // 스폰서
  specialThanks?: string;       // 특별 감사
  createdAt: string;
  updatedAt: string;
};


// ============================================================
// 멤버 유연성 테스트 기록
// ============================================================


export type FlexibilityTestItemKey =
  | "sit_and_reach"         // 앉아서 앞으로 굽히기 (cm)
  | "standing_reach"        // 서서 앞으로 굽히기 (cm)
  | "side_split"            // 개각 (도)
  | "front_split"           // 전굴 (도)
  | "shoulder_flexibility"  // 어깨 유연성 (cm)
  | "hip_flexibility"       // 힙 유연성 (도)
  | "spine_flexibility"     // 척추 유연성 (cm)
  | "ankle_flexibility"     // 발목 유연성 (도)
  | "custom";               // 커스텀 항목

export type FlexibilityTestUnit = "cm" | "도" | "mm" | "초" | "회" | "기타";

export type FlexibilityTestItem = {
  id: string;
  key: FlexibilityTestItemKey;
  name: string;              // 표시 이름 (커스텀인 경우 직접 입력)
  unit: FlexibilityTestUnit;
  higherIsBetter: boolean;   // 값이 클수록 좋은지 여부
  targetValue?: number;      // 목표값
  description?: string;      // 항목 설명
};

export type FlexibilityTestEntry = {
  itemId: string;            // FlexibilityTestItem.id
  value: number;             // 측정값
};

export type FlexibilityTestRecord = {
  id: string;
  memberId: string;
  date: string;              // YYYY-MM-DD
  entries: FlexibilityTestEntry[];
  notes?: string;
  createdAt: string;
};

export type FlexibilityTestData = {
  items: FlexibilityTestItem[];
  records: FlexibilityTestRecord[];
};


// ============================================================
// 공연 백스테이지 커뮤니케이션
// ============================================================


export type BackstageCommType =
  | "urgent"     // 긴급
  | "notice"     // 공지
  | "cue"        // 큐 신호
  | "issue"      // 문제 보고
  | "general";   // 일반

export type BackstageCommTargetScope =
  | "all"        // 전체
  | "individual" // 개인
  | "team";      // 팀

export type BackstageCommTarget = {
  scope: BackstageCommTargetScope;
  label?: string; // 개인명 또는 팀명 (all 이면 undefined)
};

export type BackstageCommMessage = {
  id: string;
  type: BackstageCommType;
  content: string;
  senderName: string;
  target: BackstageCommTarget;
  isPinned: boolean;
  isRead: boolean;
  readBy: string[];    // 확인한 사람 이름 목록
  createdAt: string;   // ISO timestamp
};

export type BackstageCommEntry = {
  id: string;
  groupId: string;
  projectId: string;
  messages: BackstageCommMessage[];
  createdAt: string;
  updatedAt: string;
};


// ============================================================
// 그룹 멤버 생일 캘린더 (Birthday Calendar - localStorage 기반)
// ============================================================


export type BirthdayCalendarEntry = {
  id: string;
  groupId: string;
  /** 멤버 이름 */
  name: string;
  /** 생일 (MM-DD 형식, 예: "03-15") */
  birthday: string;
  /** 선호 선물 또는 케이크 */
  giftPreference?: string;
  /** 파티 계획 여부 */
  partyPlanned: boolean;
  /** 기타 메모 */
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type BirthdayCalendarMessage = {
  id: string;
  /** 해당하는 BirthdayCalendarEntry.id */
  entryId: string;
  groupId: string;
  /** 메시지 작성자 */
  author: string;
  /** 축하 메시지 내용 */
  content: string;
  createdAt: string;
};

export type BirthdayCalendarStore = {
  groupId: string;
  entries: BirthdayCalendarEntry[];
  messages: BirthdayCalendarMessage[];
  updatedAt: string;
};


// ============================================================
// 그룹 연습 룰/규칙 (Practice Rules & Etiquette)
// ============================================================


export type PracticeRuleCategory =
  | "attendance"    // 출석
  | "dress"         // 복장
  | "manner"        // 매너
  | "safety"        // 안전
  | "equipment"     // 장비/기자재
  | "hygiene"       // 위생
  | "communication" // 소통
  | "other";        // 기타

export type PracticeRulePriority =
  | "required"      // 필수 (반드시 지켜야 함)
  | "recommended"   // 권장 (지키는 것이 좋음)
  | "optional";     // 선택 (자율)

export type PracticeRulePenaltyType =
  | "none"          // 없음
  | "warning"       // 경고
  | "fine"          // 벌금
  | "exclusion"     // 연습 제외
  | "custom";       // 커스텀

export type PracticeRuleEntry = {
  id: string;
  groupId: string;
  category: PracticeRuleCategory;       // 카테고리
  priority: PracticeRulePriority;       // 중요도
  title: string;                        // 규칙 제목
  description?: string;                 // 상세 설명
  penaltyType: PracticeRulePenaltyType; // 페널티 유형
  penaltyDetail?: string;               // 페널티 상세 (벌금 금액, 커스텀 내용 등)
  isActive: boolean;                    // 활성화 여부
  order: number;                        // 정렬 순서
  createdAt: string;                    // 생성일 (ISO datetime)
  updatedAt: string;                    // 수정일 (ISO datetime)
};



// ============================================================
// 공연 의상 변경 시트 (Costume Change Sheet)
// ============================================================


export type CostumeChangeLocation =
  | "stage_left"    // 무대 좌측
  | "stage_right"   // 무대 우측
  | "backstage"     // 백스테이지
  | "dressing_room" // 분장실
  | "other";        // 기타

export type CostumeChangeEntry = {
  id: string;
  groupId: string;
  projectId: string;
  order: number;                    // 변경 순서 (곡 번호 순)
  songNumber: number;               // 곡 번호
  songName: string;                 // 곡 이름
  memberNames: string[];            // 변경 대상 멤버 목록
  costumeFrom: string;              // 변경 전 의상
  costumeTo: string;                // 변경 후 의상
  changeTimeSeconds: number;        // 변경 시간 (초)
  needsHelper: boolean;             // 도우미 필요 여부
  helperName?: string;              // 도우미 이름
  location: CostumeChangeLocation;  // 변경 위치
  locationDetail?: string;          // 위치 상세 설명
  notes?: string;                   // 주의사항
  createdAt: string;                // 생성일 (ISO datetime)
  updatedAt: string;                // 수정일 (ISO datetime)
};


// ============================================================
// 공연 무대 소품 관리 (Stage Props Management)
// ============================================================


export type StagePropStatus =
  | "ready"    // 준비됨
  | "in_use"   // 사용중
  | "stored"   // 보관중
  | "repair"   // 수리중
  | "lost";    // 분실

export type StagePropEntry = {
  id: string;
  groupId: string;
  projectId: string;
  name: string;                // 소품 이름
  scene?: string;              // 사용 곡/장면
  assignedTo?: string;         // 담당자
  storageLocation?: string;    // 보관 위치
  status: StagePropStatus;     // 상태
  quantity: number;            // 수량
  cost?: number;               // 비용 (원)
  photoUrl?: string;           // 사진 URL
  memo?: string;               // 메모
  createdAt: string;           // 생성일 (ISO datetime)
  updatedAt: string;           // 수정일 (ISO datetime)
};



// ============================================================
// 공연 타임라인 플래너 (Show Timeline Planner)
// ============================================================


export type ShowTimelineEventType =
  | "arrival"        // 도착
  | "soundcheck"     // 사운드체크
  | "rehearsal"      // 리허설
  | "makeup"         // 메이크업
  | "door_open"      // 개장
  | "show_start"     // 공연 시작
  | "intermission"   // 인터미션
  | "show_end"       // 공연 종료
  | "teardown"       // 철수
  | "custom";        // 기타

export type ShowTimelineStatus =
  | "scheduled"      // 예정
  | "in_progress"    // 진행중
  | "completed"      // 완료
  | "cancelled";     // 취소

export type ShowTimelineEvent = {
  id: string;
  groupId: string;
  projectId: string;
  title: string;                         // 이벤트 제목
  eventType: ShowTimelineEventType;      // 이벤트 유형
  startTime: string;                     // 시작 시간 (HH:MM)
  endTime?: string;                      // 종료 시간 (HH:MM, 선택)
  assignedTo?: string;                   // 담당자
  location?: string;                     // 장소
  status: ShowTimelineStatus;            // 상태
  notes?: string;                        // 메모
  createdAt: string;                     // 생성일 (ISO datetime)
  updatedAt: string;                     // 수정일 (ISO datetime)
};


// ============================================================
// 공연 포토 콜 시트 (PhotoCall)
// ============================================================


export type PhotoCallType =
  | "group"      // 단체
  | "subgroup"   // 소그룹
  | "individual" // 개인
  | "scene";     // 장면

export type PhotoCallEntry = {
  id: string;
  groupId: string;
  projectId: string;
  order: number;              // 촬영 순서
  time?: string;              // 촬영 시간 (HH:MM)
  type: PhotoCallType;        // 촬영 유형
  participants: string[];     // 참여자 목록
  location?: string;          // 촬영 위치
  poseDescription?: string;   // 포즈/구도 설명
  costume?: string;           // 의상 설명
  props?: string;             // 소품 설명
  photographer?: string;      // 촬영자 이름
  completed: boolean;         // 완료 여부
  memo?: string;              // 메모
  createdAt: string;          // 생성일 (ISO datetime)
  updatedAt: string;          // 수정일 (ISO datetime)
};



// ============================================================
// 그룹 연습 파트너 매칭 (Practice Partner Matching)
// ============================================================


export type PracticePartnerSkillLevel =
  | "beginner"     // 초급
  | "intermediate" // 중급
  | "advanced"     // 고급
  | "expert";      // 전문가

export type PracticePartnerMatchStatus = "active" | "ended";

export type PracticePartnerMatch = {
  id: string;
  memberAId: string;                    // 멤버 A ID
  memberAName: string;                  // 멤버 A 이름
  memberBId: string;                    // 멤버 B ID
  memberBName: string;                  // 멤버 B 이름
  status: PracticePartnerMatchStatus;   // 매칭 상태
  matchedAt: string;                    // 매칭 생성일 (ISO datetime)
  endedAt?: string;                     // 매칭 종료일 (ISO datetime)
  ratingAtoB?: number;                  // A가 B에게 준 평점 (1~5)
  ratingBtoA?: number;                  // B가 A에게 준 평점 (1~5)
  noteAtoB?: string;                    // A가 B에게 남긴 코멘트
  noteBtoA?: string;                    // B가 A에게 남긴 코멘트
};

export type PracticePartnerMember = {
  id: string;                            // 멤버 고유 ID
  name: string;                          // 멤버 이름
  skillLevel: PracticePartnerSkillLevel; // 스킬 레벨
  availableTimes: string[];              // 연습 가능 시간대
  preferredPartnerIds: string[];         // 선호 파트너 ID 목록
  currentMatchId?: string;              // 현재 활성 매칭 ID
  joinedAt: string;                      // 등록일 (ISO datetime)
};

export type PracticePartnerEntry = {
  id: string;
  groupId: string;
  members: PracticePartnerMember[];
  matches: PracticePartnerMatch[];
  createdAt: string;
  updatedAt: string;
};

// ============================================================
// 그룹 역할 분담표 (Role Assignment Board)
// ============================================================


export type RoleAssignmentStatus = "active" | "expired";

export type RoleAssignmentHistoryItem = {
  id: string;                        // 이력 고유 ID
  changedAt: string;                 // 변경 일시 (ISO datetime)
  changedBy: string;                 // 변경자 이름
  prevAssignee: string;              // 이전 담당자
  nextAssignee: string;              // 새 담당자
  note?: string;                     // 변경 사유 (선택)
};

export type RoleAssignmentItem = {
  id: string;                        // 항목 고유 ID
  roleName: string;                  // 역할 이름 (예: 리더, 총무)
  description?: string;              // 역할 설명
  assignee: string;                  // 현재 담당자 이름
  startDate: string;                 // 담당 시작일 (YYYY-MM-DD)
  endDate?: string;                  // 담당 종료일 (YYYY-MM-DD, 선택)
  status: RoleAssignmentStatus;      // 상태 (활성/만료)
  history: RoleAssignmentHistoryItem[]; // 변경 이력
  createdAt: string;                 // 생성일 (ISO datetime)
  updatedAt: string;                 // 수정일 (ISO datetime)
};

export type RoleAssignmentEntry = {
  id: string;
  groupId: string;
  items: RoleAssignmentItem[];       // 역할 분담 목록
  createdAt: string;                 // 생성일 (ISO datetime)
  updatedAt: string;                 // 수정일 (ISO datetime)
};



// ============================================================
// 공연 관객 안내 매뉴얼 (Audience Guide Manual)
// ============================================================


export type AudienceGuideSectionType =
  | "location"       // 공연장 위치/교통
  | "parking"        // 주차 안내
  | "seating"        // 좌석 안내
  | "caution"        // 주의사항 (촬영/녹음/음식 등)
  | "etiquette"      // 공연 에티켓
  | "emergency"      // 비상구/대피 안내
  | "faq"            // FAQ
  | "general";       // 일반 안내

export type AudienceGuideFAQ = {
  id: string;
  question: string;   // 질문
  answer: string;     // 답변
  order: number;      // 표시 순서
};

export type AudienceGuideSection = {
  id: string;
  type: AudienceGuideSectionType;   // 섹션 유형
  title: string;                    // 섹션 제목
  content: string;                  // 본문 내용
  faqs: AudienceGuideFAQ[];         // FAQ 목록 (type === "faq" 일 때 주로 사용)
  isVisible: boolean;               // 공개 여부
  order: number;                    // 표시 순서
  createdAt: string;                // 생성일 (ISO datetime)
  updatedAt: string;                // 수정일 (ISO datetime)
};

export type AudienceGuideEntry = {
  id: string;
  groupId: string;
  projectId: string;
  title: string;                      // 매뉴얼 제목
  description: string;                // 매뉴얼 설명
  sections: AudienceGuideSection[];   // 섹션 목록
  createdAt: string;                  // 생성일 (ISO datetime)
  updatedAt: string;                  // 수정일 (ISO datetime)
};



// ============================================================
// 공연 스태프 콜시트 (Staff Call Sheet)
// ============================================================


export type StaffCallRole =
  | "stage_manager"   // 무대감독
  | "sound"           // 음향
  | "lighting"        // 조명
  | "costume"         // 의상
  | "makeup"          // 메이크업
  | "stage_crew"      // 무대스태프
  | "front_of_house"  // 프론트
  | "other";          // 기타

export type StaffCallItem = {
  id: string;
  name: string;                  // 스태프 이름
  role: StaffCallRole;           // 역할
  callTime: string;              // 콜 시간 (HH:mm)
  location?: string;             // 집결 장소
  phone?: string;                // 연락처
  note?: string;                 // 특이사항
  confirmed: boolean;            // 확인 상태
  createdAt: string;             // 생성일 (ISO datetime)
  updatedAt: string;             // 수정일 (ISO datetime)
};

export type StaffCallSheet = {
  groupId: string;
  projectId: string;
  items: StaffCallItem[];
  updatedAt: string;
};


// ============================================================
// 공연 무대 동선 노트 (Stage Blocking Notes)
// ============================================================


export type StageBlockingPosition =
  | "upstage_left"    // 상수 좌
  | "upstage_center"  // 상수 중앙
  | "upstage_right"   // 상수 우
  | "center_left"     // 센터 좌
  | "center"          // 센터
  | "center_right"    // 센터 우
  | "downstage_left"  // 하수 좌
  | "downstage_center"// 하수 중앙
  | "downstage_right" // 하수 우
  | "wing_left"       // 윙 좌 (대기)
  | "wing_right"      // 윙 우 (대기)
  | "custom";         // 직접 입력

export type StageBlockingDirection =
  | "forward"   // 앞으로
  | "backward"  // 뒤로
  | "left"      // 왼쪽
  | "right"     // 오른쪽
  | "diagonal"  // 대각선
  | "circle"    // 원형
  | "stay"      // 정지
  | "exit"      // 퇴장
  | "enter";    // 등장

export type StageBlockingMemberMove = {
  memberName: string;                    // 멤버 이름
  fromPosition: StageBlockingPosition;   // 시작 위치
  toPosition: StageBlockingPosition;     // 종료 위치
  direction?: StageBlockingDirection;    // 이동 방향
  note?: string;                         // 멤버 동선 메모
};

export type StageBlockingNote = {
  id: string;
  songTitle: string;             // 곡 제목 / 장면 이름
  sceneNumber?: string;          // 장면/섹션 번호 (예: "A1", "2절")
  timeStart?: string;            // 시간 구간 시작 (mm:ss)
  timeEnd?: string;              // 시간 구간 종료 (mm:ss)
  countStart?: number;           // 카운트 시작
  countEnd?: number;             // 카운트 종료
  formation?: string;            // 포메이션 이름
  memberMoves: StageBlockingMemberMove[]; // 멤버별 동선
  caution?: string;              // 주의사항
  memo?: string;                 // 추가 메모
  order: number;                 // 표시 순서
  createdAt: string;             // 생성일 (ISO datetime)
  updatedAt: string;             // 수정일 (ISO datetime)
};

export type StageBlockingEntry = {
  groupId: string;
  projectId: string;
  notes: StageBlockingNote[];
  updatedAt: string;
};



// ============================================================
// 그룹 외부 강사 관리 (Guest Instructor Management)
// ============================================================


export type GuestInstructorLesson = {
  id: string;
  date: string;           // YYYY-MM-DD
  topic: string;          // 수업 주제
  rating: number;         // 평점 1~5
  note?: string;          // 메모
  createdAt: string;      // 생성일 (ISO datetime)
};

export type GuestInstructorEntry = {
  id: string;
  name: string;           // 강사 이름
  genre: string;          // 전문 장르 (예: 팝핀, 비보잉, 힙합, 재즈 등)
  career?: string;        // 경력 소개
  phone?: string;         // 연락처
  email?: string;         // 이메일
  hourlyRate?: number;    // 시간당 비용 (원)
  lessons: GuestInstructorLesson[];  // 수업 이력
  note?: string;          // 메모
  createdAt: string;      // 생성일 (ISO datetime)
  updatedAt: string;      // 수정일 (ISO datetime)
};

export type GuestInstructorData = {
  groupId: string;
  instructors: GuestInstructorEntry[];
  updatedAt: string;
};


// ============================================================
// 공연 관객 카운트 (Audience Count Tracker)
// ============================================================


export type AudienceCountType =
  | "paid"       // 유료
  | "invited"    // 초대
  | "free"       // 무료
  | "staff";     // 관계자

export type AudienceCountRecord = {
  id: string;
  sessionNumber: number;        // 회차 번호 (1, 2, 3...)
  sessionLabel?: string;        // 회차 라벨 (예: "오후 2시 공연")
  date: string;                 // 공연 날짜 (YYYY-MM-DD)
  totalSeats: number;           // 총 좌석 수
  actualCount: number;          // 실제 관객 수
  vipCount: number;             // VIP 수
  byType: {
    paid: number;               // 유료 관객
    invited: number;            // 초대 관객
    free: number;               // 무료 관객
    staff: number;              // 관계자
  };
  note?: string;                // 메모
  createdAt: string;            // 생성일 (ISO datetime)
  updatedAt: string;            // 수정일 (ISO datetime)
};

export type AudienceCountEntry = {
  sessionNumber: number;
  sessionLabel?: string;
  date: string;
  totalSeats: number;
  actualCount: number;
  vipCount: number;
  byType: {
    paid: number;
    invited: number;
    free: number;
    staff: number;
  };
  note?: string;
};

export type AudienceCountSheet = {
  groupId: string;
  projectId: string;
  records: AudienceCountRecord[];
  updatedAt: string;
};



// ============================================================
// 공연 미디어 보도 자료 (Media Press Kit)
// ============================================================


export type MediaPressKitStatus = "draft" | "review" | "published";

export type MediaPressKitOutletType =
  | "newspaper"
  | "magazine"
  | "online"
  | "broadcast"
  | "sns"
  | "other";

export type MediaPressKitOutlet = {
  id: string;
  name: string;
  type: MediaPressKitOutletType;
  contactName?: string;
  contactEmail?: string;
  published: boolean;
  publishedAt?: string;
  publishedUrl?: string;
  note?: string;
};

export type MediaPressKitEntry = {
  id: string;
  title: string;
  writtenAt: string;
  content: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  attachmentUrls: string[];
  outlets: MediaPressKitOutlet[];
  status: MediaPressKitStatus;
  createdAt: string;
  updatedAt: string;
};

export type MediaPressKitSheet = {
  groupId: string;
  projectId: string;
  entries: MediaPressKitEntry[];
  updatedAt: string;
};


// ============================================================
// 공연 입장 게이트 관리
// ============================================================


export type EntranceGateStatus = "open" | "closed" | "standby";

export type EntranceGateType = "general" | "vip" | "staff" | "disabled";

export type EntranceGateEntry = {
  /** 게이트 ID */
  id: string;
  /** 게이트 번호 (예: 1, 2, 3) */
  gateNumber: number;
  /** 게이트 이름 (예: 메인 게이트, VIP 전용) */
  gateName: string;
  /** 위치 설명 (예: 1층 정문, 2층 좌측) */
  location?: string;
  /** 담당 스태프 이름 */
  staffName?: string;
  /** 개방 시작 시간 (HH:mm) */
  openTime?: string;
  /** 개방 종료 시간 (HH:mm) */
  closeTime?: string;
  /** 허용 입장 유형 목록 */
  allowedTypes: EntranceGateType[];
  /** 현재 게이트 상태 */
  status: EntranceGateStatus;
  /** 현재 입장 카운트 */
  count: number;
  /** 메모 */
  note?: string;
  /** 생성 시각 */
  createdAt: string;
  /** 수정 시각 */
  updatedAt: string;
};

export type EntranceGateSheet = {
  groupId: string;
  projectId: string;
  gates: EntranceGateEntry[];
  updatedAt: string;
};


// ============================================================
// 그룹 연습 장비 체크리스트
// ============================================================


export type EquipmentChecklistPhase = "before" | "after";

export type EquipmentChecklistItem = {
  id: string;
  name: string;
  phase: EquipmentChecklistPhase;
  category: string;
  order: number;
};

export type EquipmentChecklistEntry = {
  itemId: string;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: string;
  note?: string;
};

export type EquipmentChecklistRecord = {
  id: string;
  date: string;
  phase: EquipmentChecklistPhase;
  assignee?: string;
  entries: EquipmentChecklistEntry[];
  completedAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type EquipmentChecklistSheet = {
  groupId: string;
  items: EquipmentChecklistItem[];
  records: EquipmentChecklistRecord[];
  updatedAt: string;
};



// ============================================
// 그룹 멤버 기술 매트릭스 (Member Skill Matrix)
// ============================================

// SkillMatrixLevel은 member.ts에도 정의됨 (중복 허용하여 참조 에러 방지)
type SkillMatrixLevelLocal = 0 | 1 | 2 | 3 | 4 | 5;

export type SkillMatrixSkill = {
  /** 기술 고유 ID */
  id: string;
  /** 기술 이름 (예: 턴, 점프, 플로어워크 등) */
  name: string;
  /** 카테고리 (예: 기초기술, 파워무브, 스타일 등) */
  category?: string;
  /** 기술 설명 */
  description?: string;
  /** 생성일시 */
  createdAt: string;
};

export type SkillMatrixMemberScore = {
  /** 현재 레벨 (0=미평가, 1~5) */
  currentLevel: SkillMatrixLevelLocal;
  /** 목표 레벨 (1~5, 없으면 undefined) */
  targetLevel?: SkillMatrixLevelLocal;
  /** 최종 평가일 (YYYY-MM-DD) */
  lastEvaluatedAt?: string;
  /** 메모 */
  note?: string;
};

export type SkillMatrixMemberEntry = {
  /** 멤버 이름 (또는 ID) */
  memberName: string;
  /** skillId → 점수 정보 */
  scores: Record<string, SkillMatrixMemberScore>;
};

export type SkillMatrixData = {
  groupId: string;
  /** 등록된 기술 목록 */
  skills: SkillMatrixSkill[];
  /** 멤버별 점수 목록 */
  members: SkillMatrixMemberEntry[];
  updatedAt: string;
};



// ============================================================
// 공연 후원 감사편지 (ThankYouLetter)
// ============================================================


export type ThankYouLetterSponsorType =
  | "money"      // 금전
  | "goods"      // 물품
  | "venue"      // 장소
  | "service";   // 서비스

export type ThankYouLetterStatus =
  | "draft"      // 작성중
  | "sent";      // 발송완료

export type ThankYouLetterEntry = {
  id: string;
  /** 후원사명 */
  sponsorName: string;
  /** 후원 유형 */
  sponsorType: ThankYouLetterSponsorType;
  /** 후원 내용 (금액, 물품명, 장소명 등) */
  sponsorDetail?: string;
  /** 감사편지 내용 */
  letterContent: string;
  /** 발송 상태 */
  status: ThankYouLetterStatus;
  /** 발송 날짜 */
  sentAt?: string;
  /** 담당자 */
  managerName: string;
  /** 후원사 연락처 */
  sponsorContact?: string;
  /** 후원사 이메일 */
  sponsorEmail?: string;
  /** 비고 */
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type ThankYouLetterSheet = {
  groupId: string;
  projectId: string;
  entries: ThankYouLetterEntry[];
  updatedAt: string;
};


// ============================================================
// 공연 출연료 정산 (Performance Fee Settlement)
// ============================================================


export type PerformanceFeeRole = "main" | "sub" | "extra" | "staff";

export type PerformanceFeeStatus = "pending" | "settled";

export type PerformanceFeeAdjustmentType =
  | "rehearsal"
  | "overtime"
  | "transport"
  | "meal"
  | "other";

export type PerformanceFeeAdjustment = {
  /** 고유 ID */
  id: string;
  /** 항목 유형 */
  type: PerformanceFeeAdjustmentType;
  /** 항목 설명 */
  label: string;
  /** 금액 (양수: 추가 수당, 음수: 공제) */
  amount: number;
};

export type PerformanceFeeEntry = {
  /** 고유 ID */
  id: string;
  /** 멤버 이름 */
  memberName: string;
  /** 출연 역할 */
  role: PerformanceFeeRole;
  /** 기본 출연료 */
  baseFee: number;
  /** 수당/공제 항목 목록 */
  adjustments: PerformanceFeeAdjustment[];
  /** 최종 정산 금액 (baseFee + adjustments 합계) */
  finalAmount: number;
  /** 정산 상태 */
  status: PerformanceFeeStatus;
  /** 정산 완료일 (YYYY-MM-DD) */
  settledAt?: string;
  /** 메모 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type PerformanceFeeData = {
  groupId: string;
  projectId: string;
  entries: PerformanceFeeEntry[];
  updatedAt: string;
};



// ============================================
// 그룹 멤버 가용 시간표 (Member Availability Schedule)
// ============================================


export type MemberAvailabilityLevel = "available" | "difficult" | "unavailable";

export type MemberAvailabilityDay =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

export type MemberAvailabilitySlot = {
  /** 시작 시각 (HH:MM 형식) */
  startTime: string;
  /** 종료 시각 (HH:MM 형식) */
  endTime: string;
  /** 가용 수준 */
  level: MemberAvailabilityLevel;
  /** 메모 */
  note?: string;
};

export type MemberAvailabilityEntry = {
  /** 고유 ID */
  id: string;
  /** 멤버 이름 */
  memberName: string;
  /** 요일별 슬롯 목록 */
  slots: Partial<Record<MemberAvailabilityDay, MemberAvailabilitySlot[]>>;
  /** 전반적인 메모 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type MemberAvailabilityOverlap = {
  /** 요일 */
  day: MemberAvailabilityDay;
  /** 시작 시각 */
  startTime: string;
  /** 종료 시각 */
  endTime: string;
  /** 해당 시간대에 가능한 멤버 이름 목록 */
  availableMembers: string[];
  /** 어려움 멤버 이름 목록 */
  difficultMembers: string[];
};

export type MemberAvailabilityData = {
  groupId: string;
  entries: MemberAvailabilityEntry[];
  updatedAt: string;
};


// ============================================================
// 공연 케이터링 관리 (Catering Management)
// ============================================================


export type CateringDietaryRestriction =
  | "none"
  | "vegetarian"
  | "vegan"
  | "halal"
  | "kosher"
  | "gluten_free"
  | "nut_allergy"
  | "dairy_free"
  | "seafood_allergy"
  | "other";

export type CateringStatus =
  | "pending"
  | "confirmed"
  | "delivering"
  | "delivered"
  | "cancelled";

export type CateringMealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "beverage";

export type CateringEntry = {
  /** 고유 ID */
  id: string;
  /** 식사 유형 */
  mealType: CateringMealType;
  /** 식사 시간 (HH:MM) */
  mealTime: string;
  /** 메뉴 설명 */
  menuDescription: string;
  /** 총 인원 수 */
  headcount: number;
  /** 식이 제한 목록 */
  dietaryRestrictions: CateringDietaryRestriction[];
  /** 식이 제한 상세 메모 */
  dietaryNotes?: string;
  /** 업체명 */
  vendorName?: string;
  /** 업체 연락처 */
  vendorContact?: string;
  /** 총 비용 (원) */
  totalCost?: number;
  /** 배달 예정 시간 (HH:MM) */
  deliveryTime?: string;
  /** 배치 장소 */
  deliveryLocation?: string;
  /** 상태 */
  status: CateringStatus;
  /** 추가 메모 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type CateringData = {
  groupId: string;
  projectId: string;
  entries: CateringEntry[];
  updatedAt: string;
};


// ============================================================
// 공연 무대 효과 큐시트 (Stage Effects Cue Sheet)
// ============================================================


export type StageEffectType =
  | "smoke"      // 연기
  | "flame"      // 불꽃
  | "laser"      // 레이저
  | "confetti"   // 컨페티
  | "bubble"     // 버블
  | "foam"       // 폼
  | "snow"       // 스노우
  | "strobe"     // 스트로브
  | "pyro"       // 파이로테크닉
  | "co2"        // CO2 제트
  | "uv"         // UV/블랙라이트
  | "other";     // 기타

export type StageEffectIntensity = "low" | "medium" | "high" | "custom";

export type StageEffectTrigger = "manual" | "timecode" | "dmx" | "midi";

export type StageEffectSafetyLevel = "safe" | "caution" | "danger";

export type StageEffectEntry = {
  /** 고유 ID */
  id: string;
  /** 큐 번호 (예: 1, 2, 2.5, 3A) */
  cueNumber: string;
  /** 효과 유형 */
  effectType: StageEffectType;
  /** 트리거 시점 (MM:SS 형식) */
  triggerTime: string;
  /** 지속 시간 (초 단위) */
  durationSec: number;
  /** 강도 */
  intensity: StageEffectIntensity;
  /** 강도 커스텀 값 (intensity가 custom일 때) */
  intensityCustom?: string;
  /** 트리거 방식 */
  trigger: StageEffectTrigger;
  /** 무대 위치 (예: 무대 좌측, 중앙, 전체) */
  position: string;
  /** 안전 등급 */
  safetyLevel: StageEffectSafetyLevel;
  /** 안전 주의사항 */
  safetyNotes?: string;
  /** 담당 운영자 */
  operator?: string;
  /** 메모 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type StageEffectData = {
  groupId: string;
  projectId: string;
  entries: StageEffectEntry[];
  updatedAt: string;
};



// ============================================================
// 공연 안전 체크리스트 (Safety Checklist)
// ============================================================


export type SafetyChecklistCategory =
  | "stage"      // 무대안전
  | "electric"   // 전기
  | "fire"       // 소방
  | "emergency"  // 응급
  | "audience"   // 관객안전
  | "etc";       // 기타

export type SafetyChecklistStatus =
  | "pending"   // 미확인
  | "checked"   // 확인완료
  | "issue";    // 문제발견

export type SafetyChecklistPriority =
  | "high"    // 높음
  | "medium"  // 보통
  | "low";    // 낮음

export type SafetyChecklistItem = {
  /** 고유 ID */
  id: string;
  /** 카테고리 */
  category: SafetyChecklistCategory;
  /** 항목 내용 */
  content: string;
  /** 담당자 */
  assignee?: string;
  /** 확인 상태 */
  status: SafetyChecklistStatus;
  /** 확인 시간 (ISO 8601) */
  checkedAt?: string;
  /** 우선순위 */
  priority: SafetyChecklistPriority;
  /** 비고 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type SafetyChecklistData = {
  groupId: string;
  projectId: string;
  items: SafetyChecklistItem[];
  updatedAt: string;
};


// ============================================================
// 공연 관객 설문조사 (AudienceSurvey)
// ============================================================


export type AudienceSurveyQuestion =
  | "overall"
  | "stage"
  | "choreography"
  | "music"
  | "costume"
  | "revisit";

export type AudienceSurveyScore = 1 | 2 | 3 | 4 | 5;

export type AudienceSurveyQuestionStat = {
  question: AudienceSurveyQuestion;
  avg: number;
  count: number;
};

export type AudienceSurveyEntry = {
  /** 고유 ID */
  id: string;
  /** 엔트리 제목 (예: "1회차 공연") */
  title: string;
  /** 수집 날짜 (YYYY-MM-DD) */
  date: string;
  /** 총 응답 수 */
  responseCount: number;
  /** 항목별 평균 점수 */
  questionStats: AudienceSurveyQuestionStat[];
  /** 자유 의견 목록 */
  freeComments: string[];
  /** 비고 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type AudienceSurveyData = {
  groupId: string;
  projectId: string;
  entries: AudienceSurveyEntry[];
  updatedAt: string;
};



// ============================================================
// 공연 실시간 피드 (Live Show Feed)
// ============================================================


export type LiveShowFeedType =
  | "stage"       // 무대상황
  | "backstage"   // 백스테이지
  | "audience"    // 관객반응
  | "technical"   // 기술이슈
  | "other";      // 기타

export type LiveShowFeedPriority =
  | "normal"    // 일반
  | "important" // 중요
  | "urgent";   // 긴급

export type LiveShowFeedEntry = {
  /** 고유 ID */
  id: string;
  /** 시각 (ISO 8601) */
  timestamp: string;
  /** 메시지 */
  message: string;
  /** 작성자 이름 */
  author: string;
  /** 피드 유형 */
  type: LiveShowFeedType;
  /** 중요도 */
  priority: LiveShowFeedPriority;
  /** 이미지 URL (선택) */
  imageUrl?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type LiveShowFeedData = {
  groupId: string;
  projectId: string;
  entries: LiveShowFeedEntry[];
  updatedAt: string;
};


// ============================================
// 멤버 감사 카드 (Member Appreciation Cards)
// ============================================


export type AppreciationCardCategory =
  | "leadership"   // 리더십
  | "effort"       // 노력
  | "growth"       // 성장
  | "help"         // 도움
  | "fun"          // 재미
  | "other";       // 기타

export type AppreciationCardEntry = {
  id: string;
  /** 발신자 멤버 이름 */
  fromMember: string;
  /** 수신자 멤버 이름 */
  toMember: string;
  /** 카테고리 */
  category: AppreciationCardCategory;
  /** 메시지 내용 */
  message: string;
  /** 이모지 (선택) */
  emoji?: string;
  /** 공개 여부 */
  isPublic: boolean;
  /** 좋아요 한 멤버 이름 목록 */
  likes: string[];
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type AppreciationCardData = {
  groupId: string;
  entries: AppreciationCardEntry[];
  updatedAt: string;
};


// ============================================================
// 공연 사후 분석 보고서 (Post-Show Analysis Report)
// ============================================================


export type PostShowReportSection =
  | "choreography"
  | "staging"
  | "sound"
  | "lighting"
  | "costume"
  | "audience_reaction";

export type PostShowReportSectionScore = {
  /** 섹션 키 */
  section: PostShowReportSection;
  /** 점수 (1~5) */
  score: number;
  /** 코멘트 */
  comment: string;
};

export type PostShowReportEntry = {
  /** 고유 ID */
  id: string;
  /** 보고서 제목 */
  title: string;
  /** 공연 날짜 */
  performanceDate: string;
  /** 총평 */
  overallReview: string;
  /** 섹션별 평가 */
  sectionScores: PostShowReportSectionScore[];
  /** 잘된 점 목록 */
  highlights: string[];
  /** 개선할 점 목록 */
  improvements: string[];
  /** 다음 공연 제안 목록 */
  nextSuggestions: string[];
  /** 관객 수 */
  audienceCount?: number;
  /** 매출 (원) */
  revenue?: number;
  /** 작성자 */
  author: string;
  /** 비고 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type PostShowReportData = {
  groupId: string;
  projectId: string;
  entries: PostShowReportEntry[];
  updatedAt: string;
};


// ============================================================
// 그룹 연습 타임캡슐 확장 (Practice Time Capsule Extension)
// ============================================================


export type TimeCapsuleMemberMessage = {
  /** 고유 ID */
  id: string;
  /** 작성자 이름 */
  authorName: string;
  /** 메시지 내용 */
  content: string;
  /** 작성 시각 (ISO 8601) */
  createdAt: string;
};

export type TimeCapsuleEntry = {
  /** 고유 ID */
  id: string;
  /** 캡슐 제목 */
  title: string;
  /** 작성 날짜 (YYYY-MM-DD) */
  writtenAt: string;
  /** 개봉 예정일 (YYYY-MM-DD) */
  openDate: string;
  /** 멤버별 메시지 목록 */
  messages: TimeCapsuleMemberMessage[];
  /** 현재 그룹 목표 */
  currentGoal?: string;
  /** 현재 레퍼토리 목록 */
  currentRepertoire: string[];
  /** 그룹 사진 URL */
  photoUrl?: string;
  /** 봉인 여부 (봉인 후 메시지 추가 불가) */
  isSealed: boolean;
  /** 개봉 여부 */
  isOpened: boolean;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type TimeCapsuleStore = {
  groupId: string;
  entries: TimeCapsuleEntry[];
  updatedAt: string;
};


// MemberAttendStatStore — member.ts에 정의됨

// ============================================================
// 소셜 미디어 포스트 플래너 (Social Media Post Planner)
// ============================================================


export type SocialPlatform =
  | "instagram"
  | "youtube"
  | "tiktok"
  | "twitter"
  | "facebook";

export type SocialPostType =
  | "performance_promo"
  | "practice_behind"
  | "member_intro"
  | "review"
  | "etc";

export type SocialPostEntry = {
  /** 고유 ID */
  id: string;
  /** 포스트 제목 */
  title: string;
  /** 본문 내용 */
  content: string;
  /** 해시태그 목록 */
  hashtags: string[];
  /** 플랫폼 */
  platform: SocialPlatform;
  /** 포스트 유형 */
  postType: SocialPostType;
  /** 게시 상태 */
  status: SocialPostStatus;
  /** 예정 날짜 (YYYY-MM-DD) */
  scheduledDate: string;
  /** 예정 시각 (HH:mm) */
  scheduledTime: string;
  /** 담당자 */
  assignee: string;
  /** 비고 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type SocialPostPlannerData = {
  groupId: string;
  projectId: string;
  entries: SocialPostEntry[];
  updatedAt: string;
};



// ============================================================
// 공연 엔딩 크레딧 (Show Ending Credits)
// ============================================================


export type CreditSectionType =
  | "cast"
  | "choreography"
  | "music"
  | "lighting"
  | "costume"
  | "stage"
  | "planning"
  | "special_thanks";

export type CreditPerson = {
  /** 고유 ID */
  id: string;
  /** 이름 */
  name: string;
  /** 역할/직함 */
  role: string;
};

export type CreditSection = {
  /** 고유 ID */
  id: string;
  /** 섹션 유형 */
  type: CreditSectionType;
  /** 섹션 제목 (커스텀 가능) */
  title: string;
  /** 섹션 내 인원 목록 */
  people: CreditPerson[];
  /** 섹션 순서 (0부터 시작) */
  order: number;
};

export type ShowCreditsData = {
  groupId: string;
  projectId: string;
  sections: CreditSection[];
  updatedAt: string;
};


// ============================================================
// 그룹 월간 하이라이트 (Monthly Highlights)
// ============================================================


export type HighlightCategory =
  | "best_practice"
  | "best_performance"
  | "mvp"
  | "growth"
  | "teamwork"
  | "fun_moment";

export type MonthlyHighlight = {
  /** 고유 ID */
  id: string;
  /** YYYY-MM 형식 */
  yearMonth: string;
  /** 하이라이트 제목 */
  title: string;
  /** 카테고리 */
  category: HighlightCategory;
  /** 설명 */
  description: string;
  /** 관련 멤버 이름 목록 */
  relatedMembers: string[];
  /** 사진 URL (선택) */
  photoUrl?: string;
  /** 좋아요한 멤버 이름 목록 */
  likes: string[];
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type MonthlyHighlightData = {
  groupId: string;
  highlights: MonthlyHighlight[];
  updatedAt: string;
};


// ============================================================
// 공연 무대 세팅 체크리스트 (Stage Setup Checklist)
// ============================================================


export type StageSetupCategory =
  | "sound"
  | "lighting"
  | "floor"
  | "props"
  | "costume"
  | "tech";

export type StageSetupChecklistItem = {
  /** 고유 ID */
  id: string;
  /** 카테고리 */
  category: StageSetupCategory;
  /** 항목 내용 */
  content: string;
  /** 완료 여부 */
  completed: boolean;
  /** 담당자 */
  assignee?: string;
  /** 완료 시각 (ISO 8601) */
  completedAt?: string;
  /** 비고 */
  notes?: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type StageSetupChecklistData = {
  groupId: string;
  projectId: string;
  items: StageSetupChecklistItem[];
  updatedAt: string;
};


// ============================================================
// 그룹 멘탈 코칭 노트 (Mental Coaching Notes)
// ============================================================


export type MentalCoachingTopic =
  | "자신감"
  | "무대 공포증"
  | "동기부여"
  | "팀워크"
  | "스트레스 관리"
  | "목표 설정";

export type MentalCoachingStatus = "진행중" | "개선됨" | "해결됨";

export type MentalCoachingActionItem = {
  id: string;
  text: string;
  done: boolean;
};

export type MentalCoachingNote = {
  id: string;
  /** 대상 멤버 이름 */
  memberName: string;
  /** 코치 이름 */
  coachName: string;
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 주제 카테고리 */
  topic: MentalCoachingTopic;
  /** 노트 내용 */
  content: string;
  /** 기분/에너지 레벨 (1-5) */
  energyLevel: number;
  /** 액션 아이템 목록 */
  actionItems: MentalCoachingActionItem[];
  /** 진행 상태 */
  status: MentalCoachingStatus;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type MentalCoachingData = {
  groupId: string;
  notes: MentalCoachingNote[];
  updatedAt: string;
};



// ============================================================
// 공연 드레스 리허설 노트 (Dress Rehearsal Notes)
// ============================================================


export type DressRehearsalCategory =
  | "안무"
  | "음악"
  | "조명"
  | "의상"
  | "동선"
  | "소품"
  | "기타";

export type DressRehearsalSeverity = "높음" | "보통" | "낮음";

export type DressRehearsalIssue = {
  /** 고유 ID */
  id: string;
  /** 장면/섹션 */
  section: string;
  /** 이슈 내용 */
  content: string;
  /** 카테고리 */
  category: DressRehearsalCategory;
  /** 심각도 */
  severity: DressRehearsalSeverity;
  /** 담당자 */
  assignee?: string;
  /** 해결 여부 */
  resolved: boolean;
  /** 해결 시각 (ISO 8601) */
  resolvedAt?: string;
};

export type DressRehearsalSession = {
  /** 고유 ID */
  id: string;
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 시간 (HH:mm) */
  time: string;
  /** 장소 */
  venue: string;
  /** 회차 이슈 목록 */
  issues: DressRehearsalIssue[];
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type DressRehearsalData = {
  projectId: string;
  sessions: DressRehearsalSession[];
  updatedAt: string;
};


// ============================================================
// 그룹 이벤트 캘린더 (Group Event Calendar)
// ============================================================


export type GroupEventCategory =
  | "공연"
  | "워크숍"
  | "모임"
  | "대회"
  | "축제"
  | "연습"
  | "기타";

export type GroupEventRsvpStatus = "참석" | "미참석" | "미정";

export type GroupEventRsvp = {
  /** 사용자 식별자 (브라우저 UUID) */
  userId: string;
  /** 참석 여부 */
  status: GroupEventRsvpStatus;
  /** 업데이트 시각 (ISO 8601) */
  updatedAt: string;
};

export type GroupCalendarEvent = {
  id: string;
  /** 제목 */
  title: string;
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 시작 시간 (HH:MM) */
  time: string;
  /** 종료 시간 (HH:MM) */
  endTime: string;
  /** 장소 */
  location: string;
  /** 카테고리 */
  category: GroupEventCategory;
  /** 설명 */
  description: string;
  /** RSVP 목록 */
  rsvps: GroupEventRsvp[];
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type GroupEventCalendarData = {
  groupId: string;
  events: GroupCalendarEvent[];
  updatedAt: string;
};



// ============================================================
// 공연 무대 전환 계획 (Stage Transition Plan)
// ============================================================


export type StageTransitionType =
  | "blackout"
  | "light_fade"
  | "curtain"
  | "set_change"
  | "costume_change"
  | "other";

export type StageTransitionTask = {
  /** 고유 ID */
  id: string;
  /** 할 일 내용 */
  text: string;
  /** 완료 여부 */
  done: boolean;
};

export type StageTransitionItem = {
  /** 고유 ID */
  id: string;
  /** 순서 (1-based) */
  order: number;
  /** 이전 장면 */
  fromScene: string;
  /** 다음 장면 */
  toScene: string;
  /** 전환 시간 (초) */
  durationSec: number;
  /** 전환 유형 */
  transitionType: StageTransitionType;
  /** 할 일 체크리스트 */
  tasks: StageTransitionTask[];
  /** 담당 스태프 */
  assignedStaff: string;
  /** 연습 완료 여부 */
  rehearsed: boolean;
  /** 메모 */
  notes: string;
  /** 생성 시각 (ISO 8601) */
  createdAt: string;
  /** 수정 시각 (ISO 8601) */
  updatedAt: string;
};

export type StageTransitionData = {
  projectId: string;
  items: StageTransitionItem[];
  updatedAt: string;
};



// ============================================================
// 백스테이지 커뮤니케이션 로그
// ============================================================


export type BackstageLogCategory =
  | "cue"
  | "warning"
  | "info"
  | "emergency"
  | "general";

export type BackstageLogEntry = {
  /** 항목 고유 ID */
  id: string;
  /** 발신자 이름 */
  senderName: string;
  /** 메시지 내용 */
  message: string;
  /** 카테고리 */
  category: BackstageLogCategory;
  /** 타임스탬프 (ISO 8601) */
  timestamp: string;
  /** 해결 여부 */
  isResolved: boolean;
  /** 해결 처리자 이름 (null이면 미해결) */
  resolvedBy: string | null;
};

export type BackstageLogSession = {
  /** 세션 고유 ID */
  id: string;
  /** 공연명 */
  showName: string;
  /** 공연 날짜 (YYYY-MM-DD) */
  showDate: string;
  /** 로그 항목 목록 */
  entries: BackstageLogEntry[];
  /** 세션 활성 여부 */
  isActive: boolean;
  /** 세션 생성 시각 (ISO 8601) */
  createdAt: string;
};

export type BackstageLogData = {
  /** 프로젝트 ID */
  projectId: string;
  /** 세션 목록 */
  sessions: BackstageLogSession[];
  /** 마지막 수정 시각 (ISO 8601) */
  updatedAt: string;
};


// ============================================================
// 공연 후원/스폰서 관리 (localStorage 기반)
// ============================================================


export type PerfSponsorTier =
  | "platinum"
  | "gold"
  | "silver"
  | "bronze"
  | "supporter";

export type PerfSponsorEntry = {
  /** 고유 ID (crypto.randomUUID) */
  id: string;
  /** 스폰서 이름 (기업/개인) */
  name: string;
  /** 담당자 이름 (null이면 미지정) */
  contactPerson: string | null;
  /** 담당자 이메일 (null이면 미지정) */
  contactEmail: string | null;
  /** 후원 등급 */
  tier: PerfSponsorTier;
  /** 후원 금액 (원) */
  amount: number;
  /** 현물 후원 설명 (null이면 현물 없음) */
  inKind: string | null;
  /** 로고 게재 위치 (null이면 해당 없음) */
  logoPlacement: string | null;
  /** 제공 혜택 목록 */
  benefits: string[];
  /** 후원 상태 */
  status: "confirmed" | "pending" | "declined";
  /** 메모 */
  notes: string;
  /** 생성 일시 (ISO 8601) */
  createdAt: string;
};

export type PerfSponsorshipData = {
  /** 프로젝트 ID */
  projectId: string;
  /** 스폰서 목록 */
  sponsors: PerfSponsorEntry[];
  /** 후원 목표 금액 (null이면 미설정) */
  totalGoal: number | null;
  /** 마지막 수정 시각 (ISO 8601) */
  updatedAt: string;
};



// ============================================================
// 공연 무대 안전 점검
// ============================================================


export type SafetyCheckItem = {
  /** 항목 ID */
  id: string;
  /** 카테고리 */
  category:
    | "electrical"
    | "structural"
    | "fire"
    | "emergency"
    | "equipment"
    | "other";
  /** 점검 내용 */
  description: string;
  /** 점검 상태 */
  status: "pass" | "fail" | "pending" | "na";
  /** 비고 */
  notes: string | null;
  /** 점검자 이름 */
  inspectorName: string | null;
};

export type SafetyInspection = {
  /** 점검 ID */
  id: string;
  /** 점검 제목 */
  title: string;
  /** 점검 일자 (ISO 8601) */
  date: string;
  /** 공연장 */
  venue: string | null;
  /** 점검 항목 목록 */
  items: SafetyCheckItem[];
  /** 전체 결과 */
  overallStatus: "approved" | "conditional" | "rejected";
  /** 서명자 */
  signedBy: string | null;
  /** 생성일 (ISO 8601) */
  createdAt: string;
};

export type StageSafetyData = {
  /** 연결된 프로젝트 ID */
  projectId: string;
  /** 점검 기록 목록 */
  inspections: SafetyInspection[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};



// ============================================
// 공연장 관리 (VenueManagement)
// ============================================


export type VenueMgmtBookingStatus = "미확정" | "확정" | "취소";

export type VenueMgmtFacility = {
  /** 시설 ID */
  id: string;
  /** 시설 이름 */
  name: string;
  /** 보유 여부 */
  available: boolean;
};

export type VenueMgmtContact = {
  /** 담당자 이름 */
  managerName: string;
  /** 전화번호 */
  phone: string;
  /** 이메일 */
  email: string;
};

export type VenueMgmtStageSize = {
  /** 가로 (m) */
  width: number | null;
  /** 세로 (m) */
  depth: number | null;
};

export type VenueMgmtRental = {
  /** 대관료 (원) */
  fee: number | null;
  /** 예약 상태 */
  bookingStatus: VenueMgmtBookingStatus;
  /** 입장 시간 (HH:mm) */
  entryTime: string;
  /** 퇴장 시간 (HH:mm) */
  exitTime: string;
};

export type VenueMgmtAccess = {
  /** 대중교통 안내 */
  transit: string;
  /** 주차 안내 */
  parking: string;
};

export type VenueMgmtVenue = {
  /** 고유 ID */
  id: string;
  /** 공연장 이름 */
  name: string;
  /** 주소 */
  address: string;
  /** 수용 인원 */
  capacity: number | null;
  /** 무대 크기 */
  stageSize: VenueMgmtStageSize;
  /** 시설 체크리스트 */
  facilities: VenueMgmtFacility[];
  /** 연락처 */
  contact: VenueMgmtContact;
  /** 대관 정보 */
  rental: VenueMgmtRental;
  /** 무대 도면 메모 */
  stageMemo: string;
  /** 접근 정보 */
  access: VenueMgmtAccess;
  /** 생성일 (ISO 8601) */
  createdAt: string;
  /** 수정일 (ISO 8601) */
  updatedAt: string;
};

export type VenueMgmtData = {
  /** 프로젝트 ID */
  projectId: string;
  /** 공연장 목록 */
  venues: VenueMgmtVenue[];
  /** 마지막 수정일 (ISO 8601) */
  updatedAt: string;
};


// GroupVoteCardOption은 group-management.ts에 정의됨
type GroupVoteCardOptionLocal = {
  id: string;
  label: string;
  voterIds: string[];
};

export type GroupVoteCardItem = {
  id: string;
  /** 투표 제목 */
  title: string;
  /** 투표 설명 (선택) */
  description?: string;
  /** 선택지 목록 (2~6개) */
  options: GroupVoteCardOptionLocal[];
  /** 마감일 (ISO 8601, 선택) */
  deadline?: string;
  /** 복수선택 허용 여부 */
  multipleChoice: boolean;
  /** 익명 투표 여부 */
  anonymous: boolean;
  /** 생성일 (ISO 8601) */
  createdAt: string;
  /** 생성자 ID */
  createdBy: string;
};

export type GroupVotingCardData = {
  groupId: string;
  votes: GroupVoteCardItem[];
  updatedAt: string;
};

// ============================================
// Q&A (원본 버전 - QnaStatus/QnaQuestion)
// ============================================

export type QnaStatus = "open" | "answered" | "resolved";

export type QnaAnswer = {
  id: string;
  content: string;
  authorName: string;
  isAccepted: boolean;
  createdAt: string;
};

export type QnaQuestion = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  category: string;
  status: QnaStatus;
  answers: QnaAnswer[];
  createdAt: string;
};
