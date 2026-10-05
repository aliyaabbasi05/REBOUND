export type TabType =
  | 'home'
  | 'analyze'
  | 'analytics'
  | 'analysis'
  | 'subjects'
  | 'recovery'
  | 'coach'
  | 'history'
  | 'profile'
  | 'topic'
  | 'landing';

export type TopicStatus =
  | 'Strong'
  | 'Improving'
  | 'Developing'
  | 'Needs Practice'
  | 'Needs Attention'
  | 'Not Enough Data';

export type EvidenceCoverage = 'full' | 'partial' | 'unclear';
export type CognitiveCategory = 'concept' | 'application' | 'recall' | 'not_enough_data';

export type MistakeType =
  | 'concept'
  | 'careless'
  | 'question_understanding'
  | 'correct'
  | 'not_enough_data';

export interface StudentProfile {
  name: string;
  email: string;
  school: string;
  grade: string;
  course: string;
  country: string;
  curriculum: string;
  avatarInitials: string;
  subjects: string[];
  onboarded: boolean;
  streakDays: number;
  streakDaysCompleted: string[];
  learningGoals?: string[];
  studyPreferences?: {
    preferredTime: string;
    sessionLength: string;
    weeklyRestDay: string;
  };
  notifications?: {
    dailyReminder: boolean;
    recoveryMilestones: boolean;
    weeklyProgress: boolean;
    productUpdates: boolean;
  };
  privacy?: {
    personalizedAi: boolean;
    useUploadedWork: boolean;
  };
}

export interface TopicRecord {
  id: string;
  subjectId?: string;
  unitId?: string;
  /** Canonical curriculum identifier when one is available. */
  canonicalId?: string;
  name: string;
  subject: string;
  mastery: number | null;
  status: TopicStatus;
  conceptUnderstanding: number | null;
  application: number | null;
  recall: number | null;
  history: { date: string; mastery: number; assessmentId?: string; earnedMarks?: number; possibleMarks?: number; questionCount?: number }[];
  cognitiveHistory?: { date: string; assessmentId: string; category: Exclude<CognitiveCategory, 'not_enough_data'>; earnedMarks: number; possibleMarks: number; questionCount: number }[];
  aiInsight: string;
  mistakePatterns: string[];
  /** Evidence is optional so records written by older versions remain valid. */
  evidenceCount?: number;
  assessmentCount?: number;
  practiceEvidence?: {
    attempts: number;
    totalQuestions: number;
    correctAnswers?: number;
    bestPercentage: number;
    lastPercentage: number;
    lastDate: string;
  };
}

export interface SubjectRecord {
  id?: string;
  name: string;
  iconName: string;
  mastery: number | null;
  status: TopicStatus;
  topics: TopicRecord[];
}

export interface QuestionDiagnosis {
  questionNumber: string;
  topic: string;
  topicId?: string;
  subjectId?: string;
  unitId?: string;
  relatedSubtopics?: string[];
  relatedSubtopicIds?: string[];
  cognitiveCategory?: CognitiveCategory;
  maxMarks: number;
  scoredMarks: number;
  mistakeType: MistakeType;
  diagnosis: string;
  howToFix: string;
}

export interface RecoveryStep {
  stepNumber: number;
  title: string;
  detail: string;
  status: 'not_started' | 'in_progress' | 'completed';
  subjectId?: string;
  topicId?: string;
  unitId?: string;
}

export interface NextTarget {
  topic: string;
  topicId?: string;
  subjectId?: string;
  unitId?: string;
  opportunityMarks: number;
  headline: string;
  recoveryPlan: RecoveryStep[];
}

export interface TestRecord {
  id: string;
  title: string;
  subject: string;
  subjectId?: string;
  date: string;
  score: number | null;
  totalMarks: number | null;
  percentage: number | null;
  coverage?: EvidenceCoverage;
  partialEvidence?: boolean;
  analyzedMarks?: { earned: number; possible: number; questionCount: number };
  coverageNotes?: string;
  encouragement: string;
  mistakeSummary: {
    conceptMistakes: number;
    carelessMistakes: number;
    questionUnderstandingMistakes: number;
    unidentified: number;
  };
  questions: QuestionDiagnosis[];
  topicBreakdown: {
    topic: string;
    topicId?: string;
    canonicalId?: string;
    unitId?: string;
    evidenceCount?: number;
    mastery: number | null;
    status: TopicStatus;
    lostMarks: number;
    notes: string;
  }[];
  recurringPattern?: {
    detected: boolean;
    message: string;
    topic: string;
  };
  nextTarget: NextTarget;
}

export interface RecurringMistakeItem {
  id: string;
  topic: string;
  subject: string;
  subjectId?: string;
  topicId?: string;
  unitId?: string;
  mistakeType: MistakeType;
  description: string;
  occurrences: {
    assessmentId?: string;
    testTitle: string;
    date: string;
    question: string;
  }[];
}

export interface CurriculumTopic {
  id: string;
  name: string;
  subtopics: string[];
  /** IDs correspond by index to subtopics; older curriculum files may omit them. */
  subtopicIds?: string[];
}

export interface CurriculumUnit {
  id: string;
  title: string;
  topics: CurriculumTopic[];
}

export interface SubjectCurriculum {
  subject: string;
  subjectId?: string;
  totalUnits: number;
  totalTopics: number;
  units: CurriculumUnit[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  contextTag?: string;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  conceptExplanation: string;
  commonTrap: string;
  subjectId?: string;
  topicId?: string;
  unitId?: string;
}

export interface PracticeQuestionResult {
  questionId: string;
  question: string;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  answeredAt: string;
}

export interface DailyStudyGoal {
  date: string; // YYYY-MM-DD
  targetTasks: number; // e.g. 2 or 3 tasks
  targetMinutes: number; // e.g. 30 minutes
  completedMinutes: number; // minutes tracked
  completedStepNumbers: number[]; // recovery step numbers completed today
  customNote?: string;
}

export interface PracticeRecord {
  id: string;
  topic: string;
  subject: string;
  subjectId?: string;
  topicId?: string;
  unitId?: string;
  score: number;
  totalQuestions: number;
  date: string;
  questionResults?: PracticeQuestionResult[];
}
