// 프로젝트, 공연 관련 키
export const projectKeys = {
  // 프로젝트
  myProjects: () => "/my-projects" as const,
  projects: (groupId: string) => `/groups/${groupId}/projects` as const,
  projectDetail: (projectId: string) => `/projects/${projectId}` as const,
  sharedGroups: (projectId: string) => `/projects/${projectId}/shared-groups` as const,
  publicProjects: () => "/public-projects" as const,

  // 프로젝트 상세
  projectTasks: (projectId: string) => `project-tasks-${projectId}` as const,
  projectProgress: (projectId: string) => `project-progress-${projectId}` as const,
  projectTimeline: (groupId: string) => `/groups/${groupId}/project-timeline` as const,
  projectMilestones: (groupId: string, projectId: string) =>
    `/groups/${groupId}/projects/${projectId}/milestones` as const,

  // 곡/안무
  projectSongs: (projectId: string) => `project-songs-${projectId}` as const,
  songNotes: (songId: string) => `song-notes-${songId}` as const,
  songParts: (songId: string) => `song-parts-${songId}` as const,

  // 공연 관련 localStorage 키
  artistRider: (projectId: string) => `artist-rider-${projectId}` as const,
  audienceCount: (groupId: string, projectId: string) =>
    `audience-count-${groupId}-${projectId}` as const,
  audienceFeedback: (projectId: string) => `audience-feedback-${projectId}` as const,
  audienceGuide: (groupId: string, projectId: string) =>
    `audience-guide-${groupId}-${projectId}` as const,
  audienceSurvey: (groupId: string, projectId: string) =>
    `audience-survey-${groupId}-${projectId}` as const,
  backstageComm: (groupId: string, projectId: string) =>
    `backstage-comm-${groupId}-${projectId}` as const,
  backstageLog: (projectId: string) => `backstage-log-${projectId}` as const,
  catering: (groupId: string, projectId: string) =>
    `catering-${groupId}-${projectId}` as const,
  consentForm: (projectId: string) => `consent-form-${projectId}` as const,
  costumeChange: (groupId: string, projectId: string) =>
    `costume-change-${groupId}-${projectId}` as const,
  costumeFitting: (projectId: string) => `costume-fitting-${projectId}` as const,
  costumeManagement: (groupId: string, projectId: string) =>
    `costume-management-${groupId}-${projectId}` as const,
  costumeRental: (groupId: string, projectId: string) =>
    `costume-rental-${groupId}-${projectId}` as const,
  curtainCall: (groupId: string, projectId: string) =>
    `curtain-call-${groupId}-${projectId}` as const,
  dressRehearsal: (projectId: string) => `dress-rehearsal-${projectId}` as const,
  encorePlan: (groupId: string, projectId: string) =>
    `encore-plan-${groupId}-${projectId}` as const,
  entranceGate: (groupId: string, projectId: string) =>
    `entrance-gate-${groupId}-${projectId}` as const,
  formationNote: (groupId: string, projectId: string) =>
    `formation-note-${groupId}-${projectId}` as const,
  lightingCue: (groupId: string, projectId: string) =>
    `lighting-cue-${groupId}-${projectId}` as const,
  liveShowFeed: (groupId: string, projectId: string) =>
    `live-show-feed-${groupId}-${projectId}` as const,
  makeupHair: (projectId: string) => `makeup-hair-${projectId}` as const,
  marketingCampaign: (projectId: string) => `marketing-campaign-${projectId}` as const,
  mediaPressKit: (groupId: string, projectId: string) =>
    `media-press-kit-${groupId}-${projectId}` as const,
  musicCuesheet: (groupId: string, projectId: string) =>
    `music-cuesheet-${groupId}-${projectId}` as const,
  performanceCheckin: (groupId: string, projectId: string) =>
    `performance-checkin-${groupId}-${projectId}` as const,
  performanceFee: (groupId: string, projectId: string) =>
    `performance-fee-${groupId}-${projectId}` as const,
  performanceHistory: (groupId: string) => `performance-history-${groupId}` as const,
  performanceRetro: (groupId: string, projectId: string) =>
    `performance-retro-${groupId}-${projectId}` as const,
  performanceSetlist: (projectId: string) => `performance-setlist-${projectId}` as const,
  performanceSponsor: (projectId: string) => `performance-sponsor-${projectId}` as const,
  performanceTicket: (projectId: string) => `performance-ticket-${projectId}` as const,
  photoCall: (groupId: string, projectId: string) =>
    `photo-call-${groupId}-${projectId}` as const,
  photoShootPlan: (projectId: string) => `photo-shoot-plan-${projectId}` as const,
  posterManagement: (groupId: string, projectId: string) =>
    `poster-management-${groupId}-${projectId}` as const,
  postShowReport: (groupId: string, projectId: string) =>
    `post-show-report-${groupId}-${projectId}` as const,
  practicePlaylist: (groupId: string) => `practice-playlist-${groupId}` as const,
  practiceQueue: (groupId: string, projectId: string) =>
    `practice-queue-${groupId}-${projectId}` as const,
  practiceVideos: (groupId: string) => `practice-videos-${groupId}` as const,
  programBook: (groupId: string, projectId: string) =>
    `program-book-${groupId}-${projectId}` as const,
  programBookEditor: (projectId: string) => `program-book-editor-${projectId}` as const,
  rehearsalSchedule: (projectId: string) => `rehearsal-schedule-${projectId}` as const,
  safetyChecklist: (groupId: string, projectId: string) =>
    `safety-checklist-${groupId}-${projectId}` as const,
  seatReservation: (groupId: string, projectId: string) =>
    `seat-reservation-${groupId}-${projectId}` as const,
  seatingChart: (groupId: string, projectId: string) =>
    `seating-chart-${groupId}-${projectId}` as const,
  setChangeLog: (projectId: string) => `set-change-log-${projectId}` as const,
  setlistManagement: (groupId: string, projectId: string) =>
    `setlist-management-${groupId}-${projectId}` as const,
  showCredits: (groupId: string, projectId: string) =>
    `show-credits-${groupId}-${projectId}` as const,
  showCueSheet: (projectId: string) => `show-cue-sheet-${projectId}` as const,
  showDayChecklist: (projectId: string) => `show-day-checklist-${projectId}` as const,
  showEmergencyContact: (projectId: string) =>
    `show-emergency-contact-${projectId}` as const,
  showGallery: (groupId: string, projectId: string) =>
    `show-gallery-${groupId}-${projectId}` as const,
  showIntercom: (projectId: string) => `show-intercom-${projectId}` as const,
  showInventory: (groupId: string, projectId: string) =>
    `show-inventory-${groupId}-${projectId}` as const,
  showProgram: (groupId: string, projectId: string) =>
    `show-program-${groupId}-${projectId}` as const,
  showReview: (groupId: string, projectId: string) =>
    `show-review-${groupId}-${projectId}` as const,
  showRundown: (projectId: string) => `show-rundown-${projectId}` as const,
  showTimeline: (groupId: string, projectId: string) =>
    `show-timeline-${groupId}-${projectId}` as const,
  socialPostPlanner: (groupId: string, projectId: string) =>
    `social-post-planner-${groupId}-${projectId}` as const,
  soundcheckSheet: (groupId: string, projectId: string) =>
    `soundcheck-sheet-${groupId}-${projectId}` as const,
  sponsoredGoods: (groupId: string, projectId: string) =>
    `sponsored-goods-${groupId}-${projectId}` as const,
  sponsorTracking: (groupId: string, projectId: string) =>
    `sponsor-tracking-${groupId}-${projectId}` as const,
  stageAccess: (projectId: string) => `stage-access-${projectId}` as const,
  stageBlocking: (groupId: string, projectId: string) =>
    `stage-blocking-${groupId}-${projectId}` as const,
  stageEffect: (groupId: string, projectId: string) =>
    `stage-effect-${groupId}-${projectId}` as const,
  stageFormation: (projectId: string) => `stage-formation-${projectId}` as const,
  stageLayout: (groupId: string, projectId: string) =>
    `stage-layout-${groupId}-${projectId}` as const,
  stagePropManagement: (projectId: string) =>
    `stage-prop-management-${projectId}` as const,
  stageRiskAssessment: (projectId: string) =>
    `stage-risk-assessment-${projectId}` as const,
  stageSafetyCheck: (projectId: string) => `stage-safety-check-${projectId}` as const,
  stageSetupChecklist: (groupId: string, projectId: string) =>
    `stage-setup-checklist-${groupId}-${projectId}` as const,
  stageTransitionPlan: (projectId: string) =>
    `stage-transition-plan-${projectId}` as const,
  stageWeather: (projectId: string) => `stage-weather-${projectId}` as const,
  staffCall: (groupId: string, projectId: string) =>
    `staff-call-${groupId}-${projectId}` as const,
  techRequirements: (groupId: string, projectId: string) =>
    `tech-requirements-${groupId}-${projectId}` as const,
  thankYouLetter: (groupId: string, projectId: string) =>
    `thank-you-letter-${groupId}-${projectId}` as const,
  ticketSales: (projectId: string) => `ticket-sales-${projectId}` as const,
  venueManagement: (projectId: string) => `venue-management-${projectId}` as const,
  videoFeedback: (groupId: string, projectId: string) =>
    `video-feedback-${groupId}-${projectId}` as const,
  vipGuest: (groupId: string, projectId: string) =>
    `vip-guest-${groupId}-${projectId}` as const,
  wardrobeTracker: (projectId: string) => `wardrobe-tracker-${projectId}` as const,
  practiceCheckin: (groupId: string) => `practice-checkin-${groupId}` as const,
  practiceEvaluation: (groupId: string) => `practice-evaluation-${groupId}` as const,
  practiceTimerLog: (groupId: string) => `practice-timer-log-${groupId}` as const,
  compatibilityMatching: (groupId: string) =>
    `compatibility-matching-${groupId}` as const,
  battleScoreboard: (groupId: string) => `battle-scoreboard-${groupId}` as const,
  battleTournament: (groupId: string) => `battle-tournament-${groupId}` as const,
  choreoSection: (groupId: string, projectId: string) =>
    `choreo-section-${groupId}-${projectId}` as const,
  genreExplorer: (groupId: string) => `genre-explorer-${groupId}` as const,
  returnOnboarding: (groupId: string) => `return-onboarding-${groupId}` as const,
  groupAnnouncement: (groupId: string) => `group-announcement-${groupId}` as const,
};
