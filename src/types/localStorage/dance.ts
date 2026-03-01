// ============================================
// Dance Diary (멤버 댄스 다이어리)
// ============================================

export type DanceDiaryMood =
  | "great"
  | "good"
  | "neutral"
  | "tired"
  | "frustrated";

export type DanceDiaryCondition =
  | "excellent"
  | "good"
  | "normal"
  | "sore"
  | "injured";

export type DanceDiaryEntry = {
  id: string;
  date: string;
  mood: DanceDiaryMood;
  condition: DanceDiaryCondition;
  practiceHours: number;
  achievements: string[];
  struggles: string[];
  notes: string;
  songsPracticed: string[];
  rating: number;
  createdAt: string;
};

// ============================================
// Mood Check-in (기분 체크인)
// ============================================

export type MoodType = "great" | "good" | "okay" | "bad" | "terrible";

export type MoodEntry = {
  date: string;
  mood: MoodType;
  note?: string;
  createdAt: string;
};

// ============================================
// Choreography Difficulty Rating (안무 난도 평가)
// ============================================

export type DifficultyCategory = "speed" | "complexity" | "stamina" | "expression" | "sync";

export type DifficultyRating = {
  category: DifficultyCategory;
  score: number;
};

export type ChoreographyDifficultyEntry = {
  id: string;
  projectId: string;
  songTitle: string;
  ratings: DifficultyRating[];
  averageScore: number;
  ratedBy: string;
  comment: string;
  createdAt: string;
};

// ============================================
// Learning Path (멤버 학습 경로)
// ============================================

export type LearningLevel = "beginner" | "intermediate" | "advanced";

/** @deprecated LearningPath로 교체됨 */
export type LearningStep_Legacy = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt: string | null;
};

/** @deprecated LearningPath로 교체됨 */
export type LearningPathItem = {
  id: string;
  title: string;
  level: LearningLevel;
  steps: LearningStep_Legacy[];
  createdAt: string;
};

export type LearningStepStatus = "locked" | "in_progress" | "completed";

export type LearningStep = {
  id: string;
  order: number;
  title: string;
  description: string;
  skills: string[];
  status: LearningStepStatus;
  completedAt?: string;
};

export type LearningPath = {
  id: string;
  userId: string;
  currentLevel: string;
  targetLevel: string;
  genre: string;
  steps: LearningStep[];
  createdAt: string;
  updatedAt: string;
};

// ============================================
// Style Vote Session (안무 스타일 투표)
// ============================================

export type StyleVoteStatus = "open" | "closed";

export type StyleVoteCandidate = {
  id: string;
  title: string;
  description: string;
  proposedBy: string;
  votes: string[];
};

export type StyleVoteSession = {
  id: string;
  topic: string;
  status: StyleVoteStatus;
  candidates: StyleVoteCandidate[];
  maxVotesPerPerson: number;
  createdAt: string;
  closedAt?: string;
};

// ============================================
// Skill Tree (스킬 트리)
// ============================================

export type SkillTreeNodeStatus = "locked" | "available" | "learned";

export type SkillTreeNode = {
  id: string;
  name: string;
  description: string;
  tier: number;
  prerequisiteIds: string[];
  status: SkillTreeNodeStatus;
  learnedAt?: string;
};

export type SkillTreeData = {
  userId: string;
  genre: string;
  nodes: SkillTreeNode[];
  totalLearned: number;
  updatedAt: string;
};

// ============================================
// Dance Glossary (댄스 용어 사전)
// ============================================

export type GlossaryCategory =
  | "basic"
  | "hiphop"
  | "popping"
  | "locking"
  | "breaking"
  | "waacking"
  | "contemporary"
  | "general";

export type GlossaryTerm = {
  id: string;
  term: string;
  definition: string;
  category: GlossaryCategory;
  difficulty: "beginner" | "intermediate" | "advanced";
  example: string;
  addedBy: string;
  createdAt: string;
};

// ============================================
// Dance Glossary New (댄스 용어 사전 - SWR+localStorage)
// ============================================

export type GlossaryCategoryNew =
  | "basic"
  | "technique"
  | "formation"
  | "rhythm"
  | "style"
  | "stage"
  | "other";

export type DanceGlossaryEntry = {
  id: string;
  term: string;
  definition: string;
  category: GlossaryCategoryNew;
  relatedTerms: string[];
  example?: string;
  addedBy: string;
  createdAt: string;
};

// ============================================
// Personality Profile (멤버 성격/역할 프로필)
// ============================================

export type PersonalityDanceRole =
  | "dancer"
  | "choreographer"
  | "director"
  | "support"
  | "performer";

export type PersonalityTrait = {
  trait: "리더십" | "창의성" | "체력" | "표현력" | "협동심";
  score: number;
};

export type PersonalityProfile = {
  userId: string;
  preferredRoles: PersonalityDanceRole[];
  traits: PersonalityTrait[];
  bio: string;
  updatedAt: string;
};

// ============================================
// 멤버 댄스 스타일 프로필
// ============================================

export type DanceStyleLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type DanceStyleEntry = {
  style: string;
  level: DanceStyleLevel;
  yearsOfExperience: number;
  isFavorite: boolean;
};

export type MemberDanceStyleProfile = {
  id: string;
  memberId: string;
  styles: DanceStyleEntry[];
  strengths: string[];
  weaknesses: string[];
  goals: string[];
  influences: string[];
  bio?: string;
  updatedAt: string;
};

// ============================================
// Dance Genre Explorer (장르 탐색기)
// ============================================

export type DanceGenreType =
  | "hiphop"
  | "kpop"
  | "ballet"
  | "jazz"
  | "contemporary"
  | "latin"
  | "waacking"
  | "locking"
  | "popping"
  | "breaking"
  | "other";

export type GenreExplorerEntry = {
  id: string;
  genre: DanceGenreType;
  title: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  recommendedSongs: string[];
  tips: string[];
  addedBy: string;
  createdAt: string;
};

export type GenreMemberInterest = {
  id: string;
  memberName: string;
  genre: DanceGenreType;
  experienceLevel: 1 | 2 | 3 | 4 | 5;
  interest: boolean;
};

// ============================================
// Choreo Section Analysis (안무 구간 분석)
// ============================================

export type ChoreoSectionDifficulty = 1 | 2 | 3 | 4 | 5;

export type ChoreoSectionEntry = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  difficulty: ChoreoSectionDifficulty;
  completionRate: number;
  keyMoves: string[];
  assignedMembers: string[];
  notes?: string;
  order: number;
  createdAt: string;
};

// ============================================
// Dance Style Analysis (댄스 스타일 분석)
// ============================================

export type DanceStyleTrait =
  | "power"
  | "flexibility"
  | "rhythm"
  | "expression"
  | "technique"
  | "musicality";

export type DanceStyleTraitScores = Record<DanceStyleTrait, number>;

export type DanceStyleSnapshot = {
  id: string;
  date: string;
  primaryGenres: string[];
  secondaryGenres: string[];
  strengths: string[];
  weaknesses: string[];
  traitScores: DanceStyleTraitScores;
  notes: string;
  createdAt: string;
};

export type DanceStyleAnalysisData = {
  memberId: string;
  snapshots: DanceStyleSnapshot[];
  updatedAt: string;
};

// ============================================
// 댄스 스타일 프로필 v2 (DanceStyleProfileCard)
// ============================================

export type DanceProfileSkillStar = 1 | 2 | 3 | 4 | 5;

export type DanceProfileGenreEntry = {
  genre: string;
  stars: DanceProfileSkillStar;
};

export type DanceProfilePosition = "center" | "side" | "back";

export type DanceProfilePracticeTime = "morning" | "afternoon" | "evening" | "midnight";

export type DanceProfileInspirationEntry = {
  name: string;
  memo?: string;
};

export type DanceProfileBpmRange = {
  min: number;
  max: number;
};

export type DanceStyleProfileV2 = {
  memberId: string;
  genres: DanceProfileGenreEntry[];
  position: DanceProfilePosition | null;
  bio: string;
  inspirations: DanceProfileInspirationEntry[];
  practiceTimes: DanceProfilePracticeTime[];
  bpmRange: DanceProfileBpmRange;
  updatedAt: string;
};

// ============================================
// Dance Challenge (댄스 챌린지)
// ============================================

export type ChallengeCategory = "technique" | "freestyle" | "cover" | "flexibility" | "endurance" | "creativity";

export type ChallengeParticipant = {
  id: string;
  name: string;
  progress: number;
  completedAt?: string;
  note: string;
};

export type DanceChallenge = {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  startDate: string;
  endDate: string;
  targetCount: number;
  participants: ChallengeParticipant[];
  reward: string;
  status: "upcoming" | "active" | "ended";
  createdAt: string;
};

// ============================================
// Dance Battle Scoreboard (댄스 배틀)
// ============================================

export type BattleType = "solo" | "team";
export type BattleResult = "win" | "lose" | "draw";

export type BattleMatch = {
  id: string;
  date: string;
  type: BattleType;
  participant1: string;
  participant2: string;
  winner: string | null;
  score1?: number;
  score2?: number;
  style: string;
  note: string;
  createdAt: string;
};

export type BattleStats = {
  name: string;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
};

// ============================================
// Battle Tournament (댄스 배틀 토너먼트)
// ============================================

export type TournamentFormat =
  | "single_elimination"
  | "double_elimination"
  | "round_robin";

export type TournamentStatus = "upcoming" | "in_progress" | "completed";

export type TournamentMatch = {
  id: string;
  round: number;
  player1: string;
  player2: string;
  winner?: string;
  score1?: number;
  score2?: number;
  notes?: string;
};

export type BattleTournamentEntry = {
  id: string;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  participants: string[];
  matches: TournamentMatch[];
  champion?: string;
  createdBy: string;
  createdAt: string;
};

// ============================================
// Fitness Test (멤버 체력 테스트)
// ============================================

export type FitnessTestCategory =
  | "flexibility"
  | "endurance"
  | "strength"
  | "balance"
  | "agility"
  | "rhythm";

export type FitnessTestItem = {
  name: string;
  category: FitnessTestCategory;
  unit: string;
  higherIsBetter: boolean;
};

export type FitnessTestResult = {
  id: string;
  memberName: string;
  date: string;
  testItems: {
    itemName: string;
    value: number;
    category: FitnessTestCategory;
  }[];
  overallScore?: number;
  notes?: string;
  createdAt: string;
};

// ============================================
// Growth Journal (멤버 성장 일지)
// ============================================

export type GrowthJournalMood =
  | "motivated"
  | "confident"
  | "neutral"
  | "struggling"
  | "discouraged";

export type GrowthArea =
  | "테크닉"
  | "표현력"
  | "체력"
  | "리더십"
  | "협동심"
  | "자신감";

export type GrowthJournalEntry = {
  id: string;
  memberName: string;
  date: string;
  title: string;
  content: string;
  mood: GrowthJournalMood;
  skillsPracticed: string[];
  achievementsToday: string[];
  challengesFaced: string[];
  nextGoals: string[];
  selfRating: number;
  area?: GrowthArea;
  level?: number;
  createdAt: string;
  updatedAt?: string;
};

export type GrowthJournalData = {
  groupId: string;
  entries: GrowthJournalEntry[];
  updatedAt: string;
};

// ============================================
// Dance Milestone (댄스 목표 마일스톤)
// ============================================

export type DanceMilestoneStep = {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: string;
  order: number;
};

export type DanceMilestoneCategory =
  | "genre"
  | "technique"
  | "flexibility"
  | "stamina"
  | "performance"
  | "freestyle"
  | "choreography"
  | "other";

export type DanceMilestoneGoal = {
  id: string;
  memberId: string;
  title: string;
  description?: string;
  category: DanceMilestoneCategory;
  steps: DanceMilestoneStep[];
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type DanceMilestoneData = {
  goals: DanceMilestoneGoal[];
};

// ============================================
// Dance Music (멤버 댄스 뮤직 플레이리스트)
// ============================================

export type DanceMusicTrack = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number | null;
  duration: string | null;
  url: string | null;
  tags: string[];
  notes: string;
  isFavorite: boolean;
  createdAt: string;
};

export type DanceMusicPlaylist = {
  id: string;
  name: string;
  description: string;
  tracks: DanceMusicTrack[];
  createdAt: string;
  updatedAt: string;
};

export type DanceMusicData = {
  memberId: string;
  playlists: DanceMusicPlaylist[];
  updatedAt: string;
};

// ============================================
// Dance Goal Tracker (멤버 댄스 목표 트래커)
// ============================================

export type DanceGoalMilestone = {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt: string | null;
};

export type DanceGoalCategory =
  | "technique"
  | "flexibility"
  | "strength"
  | "performance"
  | "choreography"
  | "other";

export type DanceGoalPriority = "high" | "medium" | "low";

export type DanceGoalStatus = "active" | "completed" | "paused";

export type DanceGoal = {
  id: string;
  title: string;
  description: string;
  category: DanceGoalCategory;
  priority: DanceGoalPriority;
  milestones: DanceGoalMilestone[];
  targetDate: string | null;
  progress: number;
  status: DanceGoalStatus;
  createdAt: string;
  updatedAt: string;
};

export type DanceGoalTrackerData = {
  memberId: string;
  goals: DanceGoal[];
  updatedAt: string;
};

// ============================================
// 댄스 루틴 빌더 (Dance Routine Builder)
// ============================================

export type RoutineStepCategory =
  | "warmup"
  | "stretching"
  | "technique"
  | "choreography"
  | "cooldown";

export type RoutineStep = {
  id: string;
  name: string;
  category: RoutineStepCategory;
  sets: number;
  reps: number;
  repUnit: "reps" | "seconds";
  memo?: string;
  order: number;
};

export type DanceRoutine = {
  id: string;
  title: string;
  purpose?: string;
  estimatedMinutes: number;
  favorited: boolean;
  steps: RoutineStep[];
  createdAt: string;
  updatedAt: string;
};

export type DanceRoutineData = {
  memberId: string;
  routines: DanceRoutine[];
  updatedAt: string;
};

// ============================================
// 댄스 챌린지 참여 기록 (Dance Challenge Participation)
// ============================================

export type DanceChallengePlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "offline"
  | "other";

export type DanceChallengeResult =
  | "completed"
  | "in_progress"
  | "abandoned";

export type DanceChallengeEntry = {
  id: string;
  challengeName: string;
  platform: DanceChallengePlatform;
  date: string;
  songTitle?: string;
  videoUrl?: string;
  viewCount?: number;
  likeCount?: number;
  result: DanceChallengeResult;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type DanceChallengeData = {
  memberId: string;
  entries: DanceChallengeEntry[];
  updatedAt: string;
};

// ============================================
// 댄스 그룹 챌린지 카드
// ============================================

export type DanceGroupChallengeCategory =
  | "choreography"
  | "freestyle"
  | "cover"
  | "fitness";

export type DanceGroupChallengeParticipantStatus =
  | "not_started"
  | "in_progress"
  | "completed";

export type DanceGroupChallengeParticipant = {
  id: string;
  name: string;
  status: DanceGroupChallengeParticipantStatus;
  completedRank: number | null;
  joinedAt: string;
};

export type DanceGroupChallengeEntry = {
  id: string;
  title: string;
  description: string;
  category: DanceGroupChallengeCategory;
  startDate: string;
  endDate: string;
  participants: DanceGroupChallengeParticipant[];
  createdAt: string;
  updatedAt: string;
};

export type DanceGroupChallengeStore = {
  entries: DanceGroupChallengeEntry[];
  updatedAt: string;
};

// ============================================
// Dance Workshop History (댄스 워크숍 이력)
// ============================================

export type DanceWorkshopLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "all_levels";

export type DanceWorkshopEntry = {
  id: string;
  memberId: string;
  workshopName: string;
  instructor: string;
  venue: string;
  date: string;
  genre: string;
  level: DanceWorkshopLevel;
  cost: number;
  rating: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type DanceWorkshopData = {
  entries: DanceWorkshopEntry[];
};

// ============================================
// Dance Audition Records (댄스 오디션 기록)
// ============================================

export type DanceAuditionResult =
  | "pass"
  | "fail"
  | "pending"
  | "cancelled";

export type DanceAuditionRecord = {
  id: string;
  auditionName: string;
  organizer: string;
  date: string;
  genre: string;
  result: DanceAuditionResult;
  prepSong: string;
  judgesFeedback: string;
  personalNote: string;
  createdAt: string;
  updatedAt: string;
};

export type DanceAuditionEntry = {
  memberId: string;
  records: DanceAuditionRecord[];
  updatedAt: string;
};

// ============================================
// Dance Class Log (댄스 수업 수강 기록)
// ============================================

export type DanceClassLogSource = "internal" | "external";

export type DanceClassLogLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "all_levels";

export type DanceClassLogEntry = {
  id: string;
  memberId: string;
  className: string;
  instructor: string;
  date: string;
  startTime?: string;
  durationMin?: number;
  source: DanceClassLogSource;
  genre: string;
  level: DanceClassLogLevel;
  summary?: string;
  skills: string[];
  selfRating: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type DanceClassLogData = {
  memberId: string;
  entries: DanceClassLogEntry[];
  updatedAt: string;
};

// ============================================
// Dance Class Review (댄스 수업 평가 노트)
// ============================================

export type DanceClassDifficulty = "beginner" | "intermediate" | "advanced";

export type DanceClassReview = {
  id: string;
  className: string;
  instructorName: string | null;
  date: string;
  rating: number;
  difficulty: DanceClassDifficulty;
  genre: string | null;
  takeaways: string;
  wouldRepeat: boolean;
  cost: number | null;
  createdAt: string;
};

export type DanceClassReviewData = {
  memberId: string;
  reviews: DanceClassReview[];
  updatedAt: string;
};

// ============================================
// Dance Certification (댄스 인증서/자격증 관리)
// ============================================

export type DanceCertificationCategory =
  | "genre"
  | "instructor"
  | "judge"
  | "safety"
  | "other";

export type DanceCertificationStatus =
  | "valid"
  | "expired"
  | "renewal";

export type DanceCertificationEntry = {
  id: string;
  name: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
  grade?: string;
  category: DanceCertificationCategory;
  status: DanceCertificationStatus;
  fileUrl?: string;
  note?: string;
  createdAt: string;
};

export type DanceCertificationData = {
  memberId: string;
  entries: DanceCertificationEntry[];
  updatedAt: string;
};

// ============================================
// Dance Cert (DanceCertification 타입)
// ============================================

export type DanceCertKind =
  | "certificate" // 자격증
  | "completion"  // 수료증
  | "workshop"    // 워크숍
  | "award";      // 대회 수상

export type DanceCertItem = {
  id: string;
  name: string;
  issuer: string;
  acquiredAt: string;
  expiresAt?: string;
  kind: DanceCertKind;
  grade?: string;
  memo?: string;
  createdAt: string;
  updatedAt?: string;
};

// ============================================
// Dance Networking Contacts (댄스 네트워킹 연락처)
// ============================================

export type DanceNetworkingRole =
  | "dancer"
  | "choreographer"
  | "dj"
  | "videographer"
  | "photographer"
  | "instructor"
  | "event_organizer"
  | "other";

export type DanceNetworkingSns = {
  platform: "instagram" | "youtube" | "tiktok" | "twitter" | "facebook" | "other";
  handle: string;
};

export type DanceNetworkingEntry = {
  id: string;
  name: string;
  affiliation?: string;
  genres: string[];
  phone?: string;
  email?: string;
  snsAccounts: DanceNetworkingSns[];
  metAt?: string;
  metDate?: string;
  role: DanceNetworkingRole;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DanceNetworkingData = {
  memberId: string;
  entries: DanceNetworkingEntry[];
  updatedAt: string;
};

// ============================================
// 멤버 댄스 영상 포트폴리오 (Video Portfolio)
// ============================================

export type VideoPortfolioCategory =
  | "solo"
  | "group"
  | "freestyle"
  | "battle"
  | "performance"
  | "practice";

export type VideoPortfolioPlatform =
  | "youtube"
  | "instagram"
  | "tiktok"
  | "vimeo"
  | "other";

export type VideoPortfolioEntry = {
  id: string;
  title: string;
  url: string;
  platform: VideoPortfolioPlatform;
  category: VideoPortfolioCategory;
  date?: string;
  tags: string[];
  description?: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export type VideoPortfolioData = {
  memberId: string;
  entries: VideoPortfolioEntry[];
  updatedAt: string;
};

// ============================================
// Dance Video Portfolio
// ============================================

export type DanceVideoItem = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  genre: string | null;
  tags: string[];
  description: string;
  duration: string | null;
  recordedAt: string | null;
  isFeatured: boolean;
  createdAt: string;
};

export type DanceVideoPortfolioData = {
  memberId: string;
  videos: DanceVideoItem[];
  updatedAt: string;
};

// ============================================
// Dance Competition Record (댄스 대회 참가 기록)
// ============================================

export type DanceCompetitionRecord = {
  id: string;
  competitionName: string;
  date: string;
  location: string | null;
  category: string | null;
  placement: string | null;
  teamOrSolo: "solo" | "team" | "duo";
  teamName: string | null;
  genre: string | null;
  notes: string;
  certificateUrl: string | null;
  createdAt: string;
};

export type DanceCompetitionData = {
  memberId: string;
  records: DanceCompetitionRecord[];
  updatedAt: string;
};

// ============================================
// 댄스 포트폴리오 (Dance Portfolio)
// ============================================

export type PortfolioEntryType =
  | "performance"
  | "competition"
  | "workshop"
  | "collaboration"
  | "solo";

export type PortfolioAward = {
  title: string;
  rank?: string;
  date: string;
};

export type DancePortfolioEntry = {
  id: string;
  type: PortfolioEntryType;
  title: string;
  date: string;
  venue?: string;
  role?: string;
  genre?: string;
  description?: string;
  awards: PortfolioAward[];
  highlights: string[];
  createdAt: string;
};

// ============================================
// Diary Card (댄스 다이어리 카드)
// ============================================

export type DiaryCardEmotion = "happy" | "neutral" | "sad" | "passionate" | "frustrated";

export type DiaryCardEmotionMeta = {
  value: DiaryCardEmotion;
  label: string;
  emoji: string;
  color: string;
};

export type DiaryCardEntry = {
  id: string;
  memberId: string;
  date: string;
  title: string;
  content: string;
  emotion: DiaryCardEmotion;
  condition: number;
  discovery: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type DiaryCardData = {
  memberId: string;
  entries: DiaryCardEntry[];
  updatedAt: string;
};

// ============================================
// My Playlist (개인 댄스 플레이리스트)
// ============================================

export type MyPlaylistSongPurpose =
  | "warmup"
  | "main"
  | "cooldown"
  | "performance";

export type MyPlaylistSong = {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  genre: string;
  purpose: MyPlaylistSongPurpose;
  order: number;
  createdAt: string;
};

export type MyPlaylist = {
  id: string;
  name: string;
  description: string;
  songs: MyPlaylistSong[];
  createdAt: string;
};

export type MyPlaylistData = {
  memberId: string;
  playlists: MyPlaylist[];
  updatedAt: string;
};

// ============================================
// Dance Mood Board
// ============================================

export type MoodBoardCategory =
  | "안무영감"
  | "의상"
  | "무대연출"
  | "음악"
  | "감정표현"
  | "기타";

export type MoodBoardItem = {
  id: string;
  title: string;
  memo: string;
  category: MoodBoardCategory;
  color: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type MoodBoardData = {
  memberId: string;
  items: MoodBoardItem[];
  updatedAt: string;
};

// ============================================
// Dance Condition Log (댄스 컨디션 일지)
// ============================================

export type DanceConditionPainArea =
  | "neck"
  | "shoulder"
  | "back"
  | "waist"
  | "hip"
  | "knee"
  | "ankle"
  | "wrist"
  | "elbow"
  | "calf"
  | "thigh"
  | "foot"
  | "none";

export type DanceConditionIntensity =
  | "rest"
  | "light"
  | "moderate"
  | "hard"
  | "extreme";

export type DanceConditionLog = {
  id: string;
  date: string;
  overallScore: number;
  energyLevel: number;
  focusLevel: number;
  muscleCondition: number;
  painAreas: DanceConditionPainArea[];
  practiceIntensity: DanceConditionIntensity;
  hydrationMl: number;
  memo: string;
  createdAt: string;
};

export type DanceConditionEntry = {
  memberId: string;
  logs: DanceConditionLog[];
  updatedAt: string;
};

// ============================================
// Dance Condition Journal v2
// ============================================

export type DanceConditionMood =
  | "great"
  | "good"
  | "neutral"
  | "tired"
  | "bad";

export type DanceConditionJournalEntry = {
  id: string;
  date: string;
  energyLevel: number;
  mood: DanceConditionMood;
  bodyParts: string[];
  sleepHours: number | null;
  practiceMinutes: number | null;
  notes: string;
  createdAt: string;
};

export type DanceConditionJournalData = {
  memberId: string;
  entries: DanceConditionJournalEntry[];
  updatedAt: string;
};

// ============================================
// Dance Injury Log (댄스 부상 기록)
// ============================================

export type DanceInjuryBodyPart =
  | "shoulder"
  | "knee"
  | "ankle"
  | "waist"
  | "wrist"
  | "neck"
  | "hip"
  | "elbow"
  | "foot"
  | "other";

export type DanceInjuryType =
  | "muscle_pain"
  | "ligament"
  | "fracture"
  | "dislocation"
  | "bruise"
  | "sprain"
  | "tendinitis"
  | "other";

export type DanceInjurySeverity = "mild" | "moderate" | "severe";

export type DanceInjuryRehabStatus = "in_progress" | "recovered" | "chronic";

export type DanceInjuryEntry = {
  id: string;
  memberId: string;
  bodyPart: DanceInjuryBodyPart;
  injuryType: DanceInjuryType;
  severity: DanceInjurySeverity;
  injuredAt: string;
  expectedRecoveryAt?: string;
  rehabStatus: DanceInjuryRehabStatus;
  treatmentNote: string;
  createdAt: string;
  updatedAt: string;
};

export type DanceInjuryLogStore = {
  memberId: string;
  entries: DanceInjuryEntry[];
  updatedAt: string;
};

// ============================================
// Flex Track (유연성 트래커)
// ============================================

export type FlexTrackPart =
  | "forward_bend"
  | "side_split"
  | "y_balance"
  | "shoulder"
  | "hip_mobility";

export type FlexTrackUnit = "cm" | "deg";

export type FlexTrackRecord = {
  id: string;
  date: string;
  value: number;
  note: string;
};

export type FlexTrackPartConfig = {
  part: FlexTrackPart;
  goal: number;
  records: FlexTrackRecord[];
};

export type FlexTrackData = {
  memberId: string;
  parts: FlexTrackPartConfig[];
  updatedAt: string;
};

// ============================================
// Dance Nutrition (댄스 영양 관리)
// ============================================

export type DanceNutritionMealTime = "breakfast" | "lunch" | "dinner" | "snack";

export type DanceNutritionEntry = {
  id: string;
  date: string;
  mealTime: DanceNutritionMealTime;
  menuName: string;
  calories: number;
  protein: number;
  carbs: number;
  water: number;
  memo: string;
  createdAt: string;
};

export type DanceNutritionGoal = {
  targetCalories: number;
  targetWater: number;
};

export type DanceNutritionData = {
  memberId: string;
  entries: DanceNutritionEntry[];
  goal: DanceNutritionGoal;
  updatedAt: string;
};
