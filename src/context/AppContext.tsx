import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  StudentProfile,
  SubjectRecord,
  TopicRecord,
  TestRecord,
  RecurringMistakeItem,
  SubjectCurriculum,
  RecoveryStep,
  DailyStudyGoal,
  TabType,
  PracticeRecord,
  TopicStatus,
} from '../types';
import {
  boundedPracticeEvidence,
  deriveRecurringMistakes,
  topicEvidenceTotals,
  matchTopicIndex,
  normalizeSubject,
} from '../domain/metrics';
import {
  MotivationalNudge,
  NotificationPermissionStatus,
  getNotificationPermission,
  requestNotificationPermission,
  createMotivationalNudge,
  sendBrowserNotification,
} from '../services/notifications';
import type { CloudStudentData, SyncStatus } from '../services/cloudSync';

interface AppContextType {
  profile: StudentProfile;
  subjects: SubjectRecord[];
  testHistory: TestRecord[];
  recurringMistakes: RecurringMistakeItem[];
  curriculums: Record<string, SubjectCurriculum>;
  overallMastery: number | null;
  overallImprovement: number | null;
  encouragingMessage: string;
  currentFocus: {
    topic: string;
    subject: string;
    mastery: number | null;
    status: TopicStatus;
    reason: string;
  };
  latestTest: TestRecord | null;
  activeRecoveryPlan: {
    subjectId?: string;
    topicId?: string;
    unitId?: string;
    topic: string;
    subject: string;
    steps: RecoveryStep[];
  };
  // Navigation & Modals
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  showLandingPage: boolean;
  setShowLandingPage: (show: boolean) => void;
  selectedTestId: string | null;
  setSelectedTestId: (id: string | null) => void;
  selectedTopic: TopicRecord | null;
  setSelectedTopic: (topic: TopicRecord | null) => void;
  selectedSubject: SubjectRecord | null;
  setSelectedSubject: (subject: SubjectRecord | null) => void;
  isAnalyzeModalOpen: boolean;
  setIsAnalyzeModalOpen: (open: boolean) => void;
  isRecoveryModalOpen: boolean;
  setIsRecoveryModalOpen: (open: boolean) => void;
  isPracticeModalOpen: boolean;
  setIsPracticeModalOpen: (open: boolean) => void;
  practiceTopic: string;
  setPracticeTopic: (topic: string) => void;
  practiceTopicId: string;
  setPracticeTopicId: (topicId: string) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  coachInitialQuery: string;
  setCoachInitialQuery: (q: string) => void;

  // Local Notifications & Motivational Nudges
  notificationPermission: NotificationPermissionStatus;
  notificationsEnabled: boolean;
  nudgeIntervalMinutes: number;
  activeNudgeToast: MotivationalNudge | null;
  nudgeHistory: MotivationalNudge[];
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: (open: boolean) => void;
  requestBrowserNotifications: () => Promise<NotificationPermissionStatus>;
  triggerRecoveryNudge: (stepNumber?: number) => void;
  dismissNudgeToast: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNudgeIntervalMinutes: (mins: number) => void;

  // Daily Study Goal & Tracking
  dailyGoal: DailyStudyGoal;
  setDailyGoal: React.Dispatch<React.SetStateAction<DailyStudyGoal>>;
  updateDailyGoalTarget: (targetTasks: number, targetMinutes: number, customNote?: string) => void;
  logDailyStudyMinutes: (minutes: number) => void;
  toggleRecoveryStepCompletion: (stepNumber: number) => void;

  // Actions
  addTestResult: (newTest: TestRecord) => void;
  recordPracticeResult: (record: { topic: string; subject: string; subjectId: string; topicId: string; unitId?: string; score: number; totalQuestions: number; date: string; questionResults: NonNullable<PracticeRecord['questionResults']> }) => void;
  practiceHistory: PracticeRecord[];
  updateRecoveryStepStatus: (stepNumber: number, status: 'not_started' | 'in_progress' | 'completed') => void;
  updateProfile: (profile: Partial<StudentProfile>) => void;
  saveCurriculum: (curriculum: SubjectCurriculum) => void;
  openCoachWithPrompt: (promptText: string) => void;
  resetAllData: () => void;

  // Local-only student profile editing; this does not authenticate or sync accounts.
  isStudentProfileModalOpen: boolean;
  setIsStudentProfileModalOpen: (open: boolean) => void;

  // Cloud sync state
  syncStatus: SyncStatus;
  cloudSyncEnabled: boolean;
  lastSyncedAt: string | null;
}

const STORAGE_KEY = 'rebound_academic_state_v8_real_data_only';
const COACH_MESSAGES_KEY = 'rebound_academic_coach_messages_v1';

const createLocalId = (prefix: string): string => {
  const random = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
};

const storageRead = (key: string): string | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
};

const storageWrite = (key: string, value: string): void => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable or full; the in-memory state remains usable.
  }
};

const storageRemove = (key: string): void => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  } catch {
    // Ignore unavailable storage during reset.
  }
};

const readStoredJson = <T,>(key: string, fallback: T, isValid?: (value: unknown) => value is T): T => {
  const raw = storageRead(key);
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    return !isValid || isValid(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
};

const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

const INITIAL_PROFILE: StudentProfile = {
  name: '',
  email: '',
  school: '',
  grade: '',
  course: '',
  country: '',
  curriculum: '',
  avatarInitials: '',
  subjects: [],
  onboarded: false,
  streakDays: 0,
  streakDaysCompleted: [],
  learningGoals: [],
  privacy: { personalizedAi: true, useUploadedWork: true },
};

const INITIAL_TOPICS: TopicRecord[] = [];
const INITIAL_SUBJECTS: SubjectRecord[] = [];
const INITIAL_TESTS: TestRecord[] = [];
const INITIAL_RECURRING_MISTAKES: RecurringMistakeItem[] = [];

const AppContext = createContext<AppContextType | null>(null);

export interface AppProviderProps {
  children: React.ReactNode;
  /** Cloud data loaded after successful authentication. When provided,
   *  it overrides the localStorage initial values for persistent data. */
  cloudInitialData?: CloudStudentData | null;
  /** Called whenever important state changes so the parent can trigger
   *  a debounced cloud save. */
  onStateChanged?: (snapshot: CloudStudentData) => void;
  syncStatus?: SyncStatus;
  cloudSyncEnabled?: boolean;
  lastSyncedAt?: string | null;
}

export const AppProvider: React.FC<AppProviderProps> = ({
  children,
  cloudInitialData,
  onStateChanged,
  syncStatus: externalSyncStatus = 'idle',
  cloudSyncEnabled = false,
  lastSyncedAt = null,
}) => {
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const stored = readStoredJson(STORAGE_KEY + '_profile', INITIAL_PROFILE, (value): value is StudentProfile => !!value && typeof value === 'object');
    const cleanSeed = (value: string | undefined, seed: string) => value === seed ? '' : value || '';
    const cleanName = cleanSeed(stored.name, 'Student');
    return {
      ...INITIAL_PROFILE,
      ...stored,
      name: cleanName,
      email: cleanSeed(stored.email, 'student@example.com'),
      school: cleanSeed(stored.school, 'My School'),
      grade: cleanSeed(stored.grade, 'General Grade'),
      course: cleanSeed(stored.course, 'General Course'),
      country: cleanSeed(stored.country, 'General'),
      curriculum: cleanSeed(stored.curriculum, 'Custom Curriculum'),
      avatarInitials: cleanName ? stored.avatarInitials || '' : '',
      streakDays: 0,
      streakDaysCompleted: Array.isArray(stored.streakDaysCompleted) ? stored.streakDaysCompleted.filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)) : [],
      privacy: {
        personalizedAi: stored.privacy?.personalizedAi ?? true,
        useUploadedWork: stored.privacy?.useUploadedWork ?? true,
      },
    };
  });

  const [subjects, setSubjects] = useState<SubjectRecord[]>(() => {
    const stored = readStoredJson(STORAGE_KEY + '_subjects', INITIAL_SUBJECTS, isArray) as SubjectRecord[];
    return stored.map((subject) => normalizeSubject(subject));
  });

  const [testHistory, setTestHistory] = useState<TestRecord[]>(() => {
    return readStoredJson(STORAGE_KEY + '_tests', INITIAL_TESTS, isArray) as TestRecord[];
  });

  const [recurringMistakes, setRecurringMistakes] = useState<RecurringMistakeItem[]>(() => {
    const storedTests = readStoredJson<TestRecord[]>(
      STORAGE_KEY + '_tests',
      INITIAL_TESTS,
      (value): value is TestRecord[] => Array.isArray(value)
    );
    return deriveRecurringMistakes(storedTests);
  });

  const [curriculums, setCurriculums] = useState<Record<string, SubjectCurriculum>>(() => {
    return readStoredJson(STORAGE_KEY + '_curriculums', {}, (value): value is Record<string, SubjectCurriculum> => !!value && typeof value === 'object' && !Array.isArray(value));
  });

  // Active Navigation & View state
  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    const saved = storageRead(STORAGE_KEY + '_current_tab');
    return saved && ['home', 'analyze', 'analytics', 'analysis', 'subjects', 'recovery', 'coach', 'history', 'profile', 'topic', 'landing'].includes(saved) ? saved as TabType : 'home';
  });
  const [showLandingPage, setShowLandingPage] = useState<boolean>(() => storageRead(STORAGE_KEY + '_entered_workspace') !== 'true');
  const [selectedTestId, setSelectedTestId] = useState<string | null>(() => storageRead(STORAGE_KEY + '_selected_test'));
  const [selectedTopic, setSelectedTopic] = useState<TopicRecord | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectRecord | null>(null);

  // Modals
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [practiceTopic, setPracticeTopic] = useState('');
  const [practiceTopicId, setPracticeTopicId] = useState('');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [coachInitialQuery, setCoachInitialQuery] = useState('');

  // Notifications & Motivational Nudges
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionStatus>(() =>
    getNotificationPermission()
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return readStoredJson(STORAGE_KEY + '_notifications_enabled', true, (value): value is boolean => typeof value === 'boolean');
  });
  const [nudgeIntervalMinutes, setNudgeIntervalMinutes] = useState<number>(() => {
    const saved = storageRead(STORAGE_KEY + '_nudge_interval');
    const parsed = saved === null ? 30 : Number(saved);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 30;
  });
  const [activeNudgeToast, setActiveNudgeToast] = useState<MotivationalNudge | null>(null);
  const [nudgeHistory, setNudgeHistory] = useState<MotivationalNudge[]>(() => {
    return readStoredJson(STORAGE_KEY + '_nudge_history', [], isArray) as MotivationalNudge[];
  });
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // Active Recovery Plan (defaults to empty until test is analyzed)
  const emptyRecoveryPlan = { topic: '', subject: '', steps: [] as RecoveryStep[] };
  const [activeRecoveryPlan, setActiveRecoveryPlan] = useState<{
    subjectId?: string;
    topicId?: string;
    unitId?: string;
    topic: string;
    subject: string;
    steps: RecoveryStep[];
  }>(() => readStoredJson(
    STORAGE_KEY + '_active_recovery_plan',
    emptyRecoveryPlan,
    (value): value is { subjectId?: string; topicId?: string; unitId?: string; topic: string; subject: string; steps: RecoveryStep[] } =>
      !!value && typeof value === 'object' && typeof (value as { topic?: unknown }).topic === 'string' &&
      typeof (value as { subject?: unknown }).subject === 'string' &&
      Array.isArray((value as { steps?: unknown }).steps)
  ));

  const dateKeyForLocalDay = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const getTodayDateString = () => dateKeyForLocalDay(new Date());
  const recordStudyActivity = () => {
    const today = getTodayDateString();
    setProfile((prev) => {
      const activeDays = new Set((prev.streakDaysCompleted ?? []).filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)));
      activeDays.add(today);
      let streakDays = 0;
      const cursor = new Date(`${today}T12:00:00`);
      while (activeDays.has(dateKeyForLocalDay(cursor))) {
        streakDays += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      return {
        ...prev,
        streakDays,
        streakDaysCompleted: [...activeDays].sort().slice(-35),
      };
    });
  };

  // Daily Study Goal & Recovery Tracking state
  const [dailyGoal, setDailyGoal] = useState<DailyStudyGoal>(() => {
    const today = getTodayDateString();
    const parsed = readStoredJson<DailyStudyGoal | null>(STORAGE_KEY + '_daily_goal', null);
    if (parsed) {
        if (parsed.date === today) {
          return parsed;
        } else {
          return {
            date: today,
            targetTasks: Math.max(0, parsed.targetTasks || 0),
            targetMinutes: Math.max(0, parsed.targetMinutes || 0),
            completedMinutes: 0,
            completedStepNumbers: [],
            customNote: parsed.customNote,
          };
        }
    }
    return {
      date: today,
      targetTasks: 0,
      targetMinutes: 0,
      completedMinutes: 0,
      completedStepNumbers: [],
    };
  });

  const [isStudentProfileModalOpen, setIsStudentProfileModalOpen] = useState(false);

  const [practiceHistory, setPracticeHistory] = useState<PracticeRecord[]>(() => {
    return readStoredJson(STORAGE_KEY + '_practice', [], isArray) as PracticeRecord[];
  });

  // ─── Cloud data hydration ──────────────────────────────────────────────────
  // When cloudInitialData arrives (user just logged in), override in-memory state
  // with the authoritative cloud values. localStorage remains as write-through cache.
  const cloudDataAppliedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!cloudInitialData) return;
    // Use updatedAt as a fingerprint to avoid re-applying the same data
    const fingerprint = cloudInitialData.updatedAt;
    if (cloudDataAppliedRef.current === fingerprint) return;
    cloudDataAppliedRef.current = fingerprint;

    if (cloudInitialData.profile) {
      const cp = cloudInitialData.profile;
      setProfile((prev) => ({
        ...prev,
        ...cp,
        streakDays: 0,
        streakDaysCompleted: Array.isArray(cp.streakDaysCompleted)
          ? cp.streakDaysCompleted.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
          : prev.streakDaysCompleted,
        privacy: {
          personalizedAi: cp.privacy?.personalizedAi ?? prev.privacy?.personalizedAi ?? true,
          useUploadedWork: cp.privacy?.useUploadedWork ?? prev.privacy?.useUploadedWork ?? true,
        },
      }));
    }
    if (Array.isArray(cloudInitialData.subjects)) {
      setSubjects(cloudInitialData.subjects.map((s) => normalizeSubject(s)));
    }
    if (Array.isArray(cloudInitialData.testHistory)) {
      setTestHistory(cloudInitialData.testHistory);
      setRecurringMistakes(deriveRecurringMistakes(cloudInitialData.testHistory));
    }
    if (cloudInitialData.curriculums && typeof cloudInitialData.curriculums === 'object') {
      setCurriculums(cloudInitialData.curriculums);
    }
    if (cloudInitialData.activeRecoveryPlan) {
      setActiveRecoveryPlan(cloudInitialData.activeRecoveryPlan);
    }
    if (Array.isArray(cloudInitialData.practiceHistory)) {
      setPracticeHistory(cloudInitialData.practiceHistory);
    }
    if (cloudInitialData.dailyGoal) {
      const today = getTodayDateString();
      setDailyGoal((prev) => {
        if (!cloudInitialData.dailyGoal) return prev;
        if (cloudInitialData.dailyGoal.date === today) return cloudInitialData.dailyGoal;
        return {
          ...prev,
          targetTasks: Math.max(0, cloudInitialData.dailyGoal.targetTasks || 0),
          targetMinutes: Math.max(0, cloudInitialData.dailyGoal.targetMinutes || 0),
          completedMinutes: 0,
          completedStepNumbers: [],
          customNote: cloudInitialData.dailyGoal.customNote,
          date: today,
        };
      });
    }
    if (typeof cloudInitialData.notificationsEnabled === 'boolean') {
      setNotificationsEnabled(cloudInitialData.notificationsEnabled);
    }
    if (typeof cloudInitialData.nudgeIntervalMinutes === 'number') {
      setNudgeIntervalMinutes(cloudInitialData.nudgeIntervalMinutes);
    }
    if (Array.isArray(cloudInitialData.nudgeHistory)) {
      setNudgeHistory(cloudInitialData.nudgeHistory as MotivationalNudge[]);
    }
    // Restore coach messages to localStorage for AICoachView to pick up
    if (Array.isArray(cloudInitialData.coachMessages) && cloudInitialData.coachMessages.length > 0) {
      storageWrite(COACH_MESSAGES_KEY, JSON.stringify(cloudInitialData.coachMessages));
    }
  }, [cloudInitialData]);

  // Sync to localStorage
  useEffect(() => {
    storageWrite(STORAGE_KEY + '_profile', JSON.stringify(profile));
    storageWrite(STORAGE_KEY + '_subjects', JSON.stringify(subjects));
    storageWrite(STORAGE_KEY + '_tests', JSON.stringify(testHistory));
    storageWrite(STORAGE_KEY + '_recurring', JSON.stringify(recurringMistakes));
    storageWrite(STORAGE_KEY + '_curriculums', JSON.stringify(curriculums));
    storageWrite(STORAGE_KEY + '_active_recovery_plan', JSON.stringify(activeRecoveryPlan));
    storageWrite(STORAGE_KEY + '_notifications_enabled', JSON.stringify(notificationsEnabled));
    storageWrite(STORAGE_KEY + '_nudge_interval', String(nudgeIntervalMinutes));
    storageWrite(STORAGE_KEY + '_nudge_history', JSON.stringify(nudgeHistory));
    storageWrite(STORAGE_KEY + '_daily_goal', JSON.stringify(dailyGoal));
    storageWrite(STORAGE_KEY + '_practice', JSON.stringify(practiceHistory));
    storageWrite(STORAGE_KEY + '_current_tab', currentTab);
    if (showLandingPage) storageRemove(STORAGE_KEY + '_entered_workspace');
    else storageWrite(STORAGE_KEY + '_entered_workspace', 'true');
    if (selectedTestId) storageWrite(STORAGE_KEY + '_selected_test', selectedTestId);
    else storageRemove(STORAGE_KEY + '_selected_test');
  }, [
    profile,
    subjects,
    testHistory,
    recurringMistakes,
    curriculums,
    activeRecoveryPlan,
    notificationsEnabled,
    nudgeIntervalMinutes,
    nudgeHistory,
    dailyGoal,
    practiceHistory,
    currentTab,
    showLandingPage,
    selectedTestId,
  ]);

  // ─── Cloud save trigger ────────────────────────────────────────────────────
  // Notify parent about important state changes (debounced in parent / useCloudSync)
  // Only fire for student-data changes, not UI state.
  useEffect(() => {
    if (!onStateChanged || !cloudSyncEnabled) return;
    // Read coach messages from localStorage (managed by AICoachView)
    let coachMessages: unknown[] = [];
    try {
      const raw = localStorage.getItem(COACH_MESSAGES_KEY);
      if (raw) coachMessages = JSON.parse(raw);
    } catch { /* ignore */ }

    const snapshot: CloudStudentData = {
      profile,
      subjects,
      testHistory,
      curriculums,
      activeRecoveryPlan,
      practiceHistory,
      dailyGoal,
      nudgeHistory: nudgeHistory as unknown[],
      coachMessages: coachMessages as import('../types').ChatMessage[],
      notificationsEnabled,
      nudgeIntervalMinutes,
      updatedAt: new Date().toISOString(),
    };
    onStateChanged(snapshot);
  }, [
    profile,
    subjects,
    testHistory,
    curriculums,
    activeRecoveryPlan,
    practiceHistory,
    dailyGoal,
    notificationsEnabled,
    nudgeIntervalMinutes,
    // Intentionally NOT depending on nudgeHistory / UI state to reduce noise
    onStateChanged,
    cloudSyncEnabled,
  ]);

  // Request browser notifications using Notification API
  const requestBrowserNotifications = async (): Promise<NotificationPermissionStatus> => {
    const status = await requestNotificationPermission();
    setNotificationPermission(status);
    if (status === 'granted') {
      // Trigger a gentle confirmation nudge
      triggerRecoveryNudge();
    }
    return status;
  };

  // Trigger gentle motivational nudge for recovery plan
  const triggerRecoveryNudge = (stepNumber?: number) => {
    const steps = activeRecoveryPlan.steps;
    if (!activeRecoveryPlan.topic || steps.length === 0) return;
    let targetStep = stepNumber
      ? steps.find((s) => s.stepNumber === stepNumber)
      : steps.find((s) => s.status !== 'completed');

    if (!targetStep && steps.length > 0) {
      targetStep = steps[0];
    }

    const nudge = createMotivationalNudge(
      activeRecoveryPlan.topic,
      targetStep,
      profile.name.split(' ')[0]
    );

    // 1. Send via Browser's Notification API
    sendBrowserNotification(nudge, () => {
      // When student clicks system notification
      if (targetStep?.stepNumber === 2 || targetStep?.stepNumber === 4) {
        setPracticeTopic(activeRecoveryPlan.topic);
        setIsPracticeModalOpen(true);
      } else {
        setIsRecoveryModalOpen(true);
      }
    });

    // 2. Set active in-app toast for instant feedback
    setActiveNudgeToast(nudge);

    // 3. Record in nudge history
    setNudgeHistory((prev) => [nudge, ...prev.slice(0, 14)]);
  };

  const dismissNudgeToast = () => {
    setActiveNudgeToast(null);
  };

  // Automated periodic nudges for pending items in recovery plan
  const lastNudgeTimeRef = useRef<number>(Date.now());
  useEffect(() => {
    if (!notificationsEnabled) return;

    const intervalMs = Math.max(1, nudgeIntervalMinutes) * 60 * 1000;
    const timer = setInterval(() => {
      const now = Date.now();
      const hasPending = activeRecoveryPlan.steps.some((s) => s.status !== 'completed');
      if (hasPending && now - lastNudgeTimeRef.current >= intervalMs) {
        lastNudgeTimeRef.current = now;
        triggerRecoveryNudge();
      }
    }, 60000); // Check once per minute

    return () => clearInterval(timer);
  }, [notificationsEnabled, nudgeIntervalMinutes, activeRecoveryPlan]);

  // Mark-weight all sufficiently evidenced topics across subjects; a small
  // course cannot distort the result as much as a heavily evidenced one.
  const allTopicEvidence = subjects.flatMap((subject) => subject.topics.map(topicEvidenceTotals));
  const overallPossibleMarks = allTopicEvidence.reduce((sum, evidence) => sum + evidence.possible, 0);
  const overallMastery = overallPossibleMarks > 0
    ? Math.round((allTopicEvidence.reduce((sum, evidence) => sum + evidence.earned, 0) / overallPossibleMarks) * 100)
    : null;

  const orderedTests = [...testHistory].sort((a, b) => {
    const left = new Date(a.date).getTime();
    const right = new Date(b.date).getTime();
    return (Number.isNaN(left) ? 0 : left) - (Number.isNaN(right) ? 0 : right);
  });
  const latestTest = orderedTests[orderedTests.length - 1] ?? null;
  const bySubject = new Map<string, TestRecord[]>();
  for (const record of orderedTests) {
    if (record.percentage === null || record.percentage === undefined) continue;
    const key = record.subjectId || record.subject.trim().toLocaleLowerCase();
    bySubject.set(key, [...(bySubject.get(key) ?? []), record]);
  }
  let changeNumerator = 0;
  let changeWeight = 0;
  for (const records of bySubject.values()) {
    if (records.length < 2) continue;
    const previous = records[records.length - 2];
    const current = records[records.length - 1];
    const weight = Math.max(1, (previous.totalMarks ?? 0) + (current.totalMarks ?? 0));
    changeNumerator += (current.percentage! - previous.percentage!) * weight;
    changeWeight += weight;
  }
  const overallImprovement = changeWeight > 0 ? Math.round(changeNumerator / changeWeight) : null;

  const encouragingMessage = testHistory.length > 0
    ? 'Your scores come from saved assessment records. Keep building your evidence over time.'
    : subjects.length > 0
      ? 'Your course map is saved. Add a real assessment to begin building performance evidence.'
      : 'No course map or assessment is saved yet. Add a curriculum or analyze a real assessment to begin.';

  const currentFocus = latestTest?.nextTarget
    ? (() => {
        const matchingSubject = latestTest.subjectId
          ? subjects.find((subject) => subject.id === latestTest.subjectId)
          : subjects.find((subject) => subject.name.trim().toLocaleLowerCase() === latestTest.subject.trim().toLocaleLowerCase());
        const topicIndex = matchingSubject ? matchTopicIndex(matchingSubject.topics, latestTest.nextTarget) : -1;
        const evidencedTopic = topicIndex >= 0 ? matchingSubject?.topics[topicIndex] : undefined;
        return {
          topic: latestTest.nextTarget.topic,
          subject: latestTest.subject,
          mastery: evidencedTopic?.mastery ?? null,
          status: evidencedTopic?.status ?? 'Not Enough Data',
          reason: latestTest.nextTarget.headline,
        };
      })()
    : {
        topic: '',
        subject: '',
        mastery: null,
        status: 'Not Enough Data' as const,
        reason: 'No assessment evidence has been recorded yet.',
      };

  // Actions
  const addTestResult = (newTest: TestRecord) => {
    const questions = Array.isArray(newTest.questions) ? newTest.questions : [];
    if (!questions.length || questions.some((question) => !Number.isFinite(question.maxMarks) || !Number.isFinite(question.scoredMarks) || question.maxMarks < 0 || question.scoredMarks < 0 || question.scoredMarks > question.maxMarks)) return;
    const analyzedMarks = {
      earned: questions.reduce((sum, question) => sum + question.scoredMarks, 0),
      possible: questions.reduce((sum, question) => sum + question.maxMarks, 0),
      questionCount: questions.length,
    };
    const hasOverallMarks = newTest.score !== null && newTest.totalMarks !== null && Number.isFinite(newTest.score) && Number.isFinite(newTest.totalMarks) && newTest.score >= 0 && newTest.totalMarks > 0 && newTest.score <= newTest.totalMarks;
    const rowsReconcile = hasOverallMarks && Math.abs(analyzedMarks.earned - newTest.score!) <= 0.01 && Math.abs(analyzedMarks.possible - newTest.totalMarks!) <= 0.01;
    const coverage = newTest.coverage ?? (rowsReconcile ? 'full' : 'partial');
    if (coverage === 'full' && (!rowsReconcile || !hasOverallMarks)) return;
    if (hasOverallMarks && newTest.percentage !== null && newTest.percentage !== undefined && Math.abs(newTest.percentage - Math.round((newTest.score! / newTest.totalMarks!) * 100)) > 1) return;
    const matchedSubject = newTest.subjectId ? subjects.find((subject) => subject.id === newTest.subjectId) : subjects.find((subject) => subject.name.trim().toLocaleLowerCase() === newTest.subject.trim().toLocaleLowerCase());
    const subjectId = newTest.subjectId || matchedSubject?.id || createLocalId('subject');
    recordStudyActivity();
    const normalizedTest: TestRecord = {
      ...newTest,
      subjectId,
      coverage,
      partialEvidence: coverage !== 'full',
      analyzedMarks,
      questions: questions.map((question) => ({ ...question, subjectId: question.subjectId || subjectId })),
    };
    setTestHistory((prev) => [normalizedTest, ...prev]);

    // Calculate every topic percentage from the actual earned/possible marks.
    setSubjects((prevSubjects) => {
      const sameNameSubjects = prevSubjects.filter((subject) => subject.name.trim().toLocaleLowerCase() === normalizedTest.subject.trim().toLocaleLowerCase());
      const previousSubject = prevSubjects.find((subject) => subject.id === subjectId) || (sameNameSubjects.length === 1 ? sameNameSubjects[0] : undefined);
      const baseSubject: SubjectRecord = previousSubject ?? {
        id: subjectId, name: normalizedTest.subject, iconName: 'BookOpen', mastery: null,
        status: 'Not Enough Data', topics: [],
      };
      const updatedTopics = baseSubject.topics.map((topic, topicIndex) => {
        const relevant = normalizedTest.questions.filter((question) => matchTopicIndex(baseSubject.topics, { topic: question.topic, topicId: question.topicId }) === topicIndex && question.maxMarks > 0);
        if (!relevant.length) return topic;
        const earnedMarks = relevant.reduce((sum, question) => sum + question.scoredMarks, 0);
        const possibleMarks = relevant.reduce((sum, question) => sum + question.maxMarks, 0);
        if (possibleMarks <= 0) return topic;
        const grouped = ['concept', 'application', 'recall'] as const;
        const cognitiveHistory = [...(topic.cognitiveHistory ?? [])];
        for (const category of grouped) {
          const rows = relevant.filter((question) => question.cognitiveCategory === category);
          const possible = rows.reduce((sum, question) => sum + question.maxMarks, 0);
          if (possible > 0) cognitiveHistory.push({
            date: normalizedTest.date, assessmentId: normalizedTest.id, category,
            earnedMarks: rows.reduce((sum, question) => sum + question.scoredMarks, 0),
            possibleMarks: possible, questionCount: rows.length,
          });
        }
        const assessment = {
          date: normalizedTest.date, assessmentId: normalizedTest.id,
          mastery: Math.round((earnedMarks / possibleMarks) * 100),
          earnedMarks, possibleMarks, questionCount: relevant.length,
        };
        const note = normalizedTest.topicBreakdown.find((candidate) => candidate.topicId === topic.id || (!candidate.topicId && matchTopicIndex(baseSubject.topics, { topic: candidate.topic }) === topicIndex))?.notes;
        const newPatterns = relevant.filter((question) => question.mistakeType !== 'correct' && question.mistakeType !== 'not_enough_data').map((question) => question.diagnosis).filter(Boolean);
        return {
          ...topic, subjectId, history: [...(topic.history ?? []), assessment], cognitiveHistory,
          evidenceCount: (topic.evidenceCount ?? 0) + relevant.length,
          assessmentCount: (topic.assessmentCount ?? 0) + 1,
          aiInsight: note || topic.aiInsight || '',
          mistakePatterns: [...new Set([...(topic.mistakePatterns ?? []), ...newPatterns])].slice(-8),
        };
      });
      const updatedSubject = normalizeSubject({ ...baseSubject, id: subjectId, topics: updatedTopics });
      if (prevSubjects.some((subject) => subject.id === subjectId || subject === previousSubject)) return prevSubjects.map((subject) => subject === previousSubject ? updatedSubject : subject);
      return [...prevSubjects, updatedSubject];
    });
    setProfile((prev) => prev.subjects.includes(normalizedTest.subject) ? prev : { ...prev, subjects: [...prev.subjects, normalizedTest.subject] });

    // Set recovery plan from new test target
    if (normalizedTest.nextTarget) {
      setActiveRecoveryPlan({
        subjectId,
        topicId: normalizedTest.nextTarget.topicId,
        unitId: normalizedTest.nextTarget.unitId,
        topic: normalizedTest.nextTarget.topic,
        subject: normalizedTest.subject,
        steps: normalizedTest.nextTarget.recoveryPlan.map((step) => ({ ...step, subjectId, topicId: normalizedTest.nextTarget.topicId, unitId: normalizedTest.nextTarget.unitId })),
      });
      setDailyGoal((prev) => ({ ...prev, completedStepNumbers: [] }));
    }

    // Recurrence is always rebuilt from actual stored question rows and distinct assessments.
    setRecurringMistakes(deriveRecurringMistakes([normalizedTest, ...testHistory]));

    // Open the new test immediately in the analysis view!
    setSelectedTestId(normalizedTest.id);
  };

  const recordPracticeResult = (record: {
    topic: string;
    subject: string;
    subjectId: string;
    topicId: string;
    unitId?: string;
    score: number;
    totalQuestions: number;
    date: string;
    questionResults: NonNullable<PracticeRecord['questionResults']>;
  }) => {
    const totalQuestions = Math.max(0, Math.round(Number.isFinite(record.totalQuestions) ? record.totalQuestions : 0));
    const score = Math.max(0, Math.min(totalQuestions, Math.round(Number.isFinite(record.score) ? record.score : 0)));
    const answerRows = Array.isArray(record.questionResults) ? record.questionResults : [];
    if (totalQuestions !== 5 || answerRows.length !== 5 || !record.subjectId || !record.topicId ||
      answerRows.some((answer) => !Number.isInteger(answer.selectedIndex) || !Number.isInteger(answer.correctIndex) || answer.selectedIndex < 0 || answer.correctIndex < 0 || answer.isCorrect !== (answer.selectedIndex === answer.correctIndex)) ||
      answerRows.filter((answer) => answer.isCorrect).length !== score) return;
    recordStudyActivity();
    const newRecord: PracticeRecord = {
      id: createLocalId('practice'),
      topic: record.topic,
      subject: record.subject,
      subjectId: record.subjectId,
      topicId: record.topicId,
      unitId: record.unitId,
      score,
      totalQuestions,
      date: record.date,
      questionResults: answerRows.map((answer) => ({ ...answer })),
    };

    setPracticeHistory((prev) => [newRecord, ...prev]);

    setSubjects((prevSubjects) => {
      return prevSubjects.map((sub) => {
        if (sub.id !== record.subjectId) return sub;

        const updatedTopics = sub.topics.map((top) => {
          if (matchTopicIndex([top], { topic: record.topic, topicId: record.topicId }) === 0) {
            return {
              ...top,
              // Practice is bounded, recorded evidence; it is not assessment mastery.
              practiceEvidence: boundedPracticeEvidence(
                top.practiceEvidence,
                score,
                totalQuestions,
                record.date
              ),
            };
          }
          return top;
        });
        return normalizeSubject({ ...sub, topics: updatedTopics });
      });
    });
  };

  const updateRecoveryStepStatus = (
    stepNumber: number,
    status: 'not_started' | 'in_progress' | 'completed'
  ) => {
    if (status === 'completed') recordStudyActivity();
    setActiveRecoveryPlan((prev) => {
      const updatedSteps = prev.steps.map((s) => (s.stepNumber === stepNumber ? { ...s, status } : s));

      return {
        ...prev,
        steps: updatedSteps,
      };
    });

    // Sync with Daily Study Goal task tracking
    setDailyGoal((prev) => {
      const isAlreadyCompleted = prev.completedStepNumbers.includes(stepNumber);
      if (status === 'completed' && !isAlreadyCompleted) {
        return {
          ...prev,
          completedStepNumbers: [...prev.completedStepNumbers, stepNumber],
        };
      } else if (status !== 'completed' && isAlreadyCompleted) {
        return {
          ...prev,
          completedStepNumbers: prev.completedStepNumbers.filter((n) => n !== stepNumber),
        };
      }
      return prev;
    });
  };

  const toggleRecoveryStepCompletion = (stepNumber: number) => {
    const currentStep = activeRecoveryPlan.steps.find((s) => s.stepNumber === stepNumber);
    if (!currentStep) return;
    const newStatus = currentStep.status === 'completed' ? 'in_progress' : 'completed';
    updateRecoveryStepStatus(stepNumber, newStatus);
  };

  const updateDailyGoalTarget = (targetTasks: number, targetMinutes: number, customNote?: string) => {
    setDailyGoal((prev) => ({
      ...prev,
      targetTasks: Math.max(1, targetTasks),
      targetMinutes: Math.max(5, targetMinutes),
      customNote: customNote !== undefined ? customNote : prev.customNote,
    }));
  };

  const logDailyStudyMinutes = (minutes: number) => {
    if (minutes > 0) recordStudyActivity();
    setDailyGoal((prev) => ({
      ...prev,
      completedMinutes: Math.max(0, prev.completedMinutes + minutes),
    }));
  };

  const updateProfile = (data: Partial<StudentProfile>) => {
    setProfile((prev) => ({
      ...prev,
      ...data,
      privacy: data.privacy ? { ...prev.privacy, ...data.privacy } : prev.privacy ?? INITIAL_PROFILE.privacy,
    }));
  };

  const saveCurriculum = (curriculum: SubjectCurriculum) => {
    const oldCurriculum = curriculums[curriculum.subject];
    const sameNameSubjects = subjects.filter((subject) => subject.name.trim().toLocaleLowerCase() === curriculum.subject.trim().toLocaleLowerCase());
    const existingSubject = curriculum.subjectId
      ? subjects.find((subject) => subject.id === curriculum.subjectId)
      : sameNameSubjects.length === 1 ? sameNameSubjects[0] : undefined;
    const subjectId = curriculum.subjectId || existingSubject?.id || oldCurriculum?.subjectId || createLocalId('subject');
    const unitIds = new Set<string>();
    const topicIds = new Set<string>();
    const subtopicIds = new Set<string>();
    const normalizedCurriculum: SubjectCurriculum = {
      ...curriculum,
      subjectId,
      units: (Array.isArray(curriculum.units) ? curriculum.units : []).map((unit, unitIndex) => {
        const rawUnitId = unit.id || createLocalId(`unit-${unitIndex + 1}`);
        const unitId = rawUnitId.startsWith(`${subjectId}:`) ? rawUnitId : `${subjectId}:${rawUnitId}`;
        const uniqueUnitId = unitIds.has(unitId) ? `${unitId}:${unitIndex + 1}` : unitId;
        unitIds.add(uniqueUnitId);
        const topics = (Array.isArray(unit.topics) ? unit.topics : []).map((topic, topicIndex) => {
          const proposedId = topic.id ? (topic.id.startsWith(`${subjectId}:`) ? topic.id : `${subjectId}:${topic.id}`) : undefined;
          const nameMatches = existingSubject?.topics.filter((candidate) => candidate.name.trim().toLocaleLowerCase() === topic.name.trim().toLocaleLowerCase()) ?? [];
          const existingTopicCandidate = existingSubject?.topics.find((candidate) => candidate.id === proposedId || candidate.canonicalId === proposedId) ??
            (!topic.id && nameMatches.length === 1 ? nameMatches[0] : undefined);
          const rawCandidate = proposedId || existingTopicCandidate?.id || createLocalId(`topic-${unitIndex + 1}-${topicIndex + 1}`);
          const namespacedCandidate = rawCandidate.startsWith(`${subjectId}:`) ? rawCandidate : `${subjectId}:${rawCandidate}`;
          const duplicateTopicId = topicIds.has(namespacedCandidate);
          const existingTopic = duplicateTopicId ? undefined : existingTopicCandidate;
          const id = duplicateTopicId ? `${namespacedCandidate}:${unitIndex + 1}-${topicIndex + 1}` : namespacedCandidate;
          topicIds.add(id);
          const previousCurriculumTopics = oldCurriculum?.units.flatMap((item) => item.topics) ?? [];
          const previousNameMatches = previousCurriculumTopics.filter((item) => item.name.trim().toLocaleLowerCase() === topic.name.trim().toLocaleLowerCase());
          const priorCurriculumTopic = previousCurriculumTopics.find((item) => item.id === proposedId || item.id === topic.id) ??
            (!topic.id && previousNameMatches.length === 1 ? previousNameMatches[0] : undefined);
          const cleanSubtopics = (Array.isArray(topic.subtopics) ? topic.subtopics : []).filter((item) => typeof item === 'string' && item.trim());
          const stableSubtopicIds = cleanSubtopics.map((_subtopic, index) => {
            const candidate = topic.subtopicIds?.[index] || priorCurriculumTopic?.subtopicIds?.[index];
            const raw = candidate || createLocalId('subtopic');
            const namespaced = raw.startsWith(`${subjectId}:`) ? raw : `${subjectId}:${raw}`;
            const stable = !subtopicIds.has(namespaced) ? namespaced : `${namespaced}:${index + 1}`;
            subtopicIds.add(stable);
            return stable;
          });
          return { ...topic, id, name: topic.name.trim(), subtopics: cleanSubtopics, subtopicIds: stableSubtopicIds };
        });
        return { ...unit, id: uniqueUnitId, topics };
      }),
    };
    normalizedCurriculum.totalUnits = normalizedCurriculum.units.length;
    normalizedCurriculum.totalTopics = normalizedCurriculum.units.reduce((sum, unit) => sum + unit.topics.length, 0);
    setCurriculums((previous) => ({ ...previous, [normalizedCurriculum.subject]: normalizedCurriculum }));

    const extractedTopics: TopicRecord[] = normalizedCurriculum.units.flatMap((unit) => unit.topics.map((topic) => {
      const existingIndex = existingSubject ? matchTopicIndex(existingSubject.topics, { topic: topic.name, topicId: topic.id }) : -1;
      const existingTopic = existingIndex >= 0 ? existingSubject?.topics[existingIndex] : undefined;
      const oldGeneratedInsight = existingTopic?.aiInsight?.startsWith('Extracted from uploaded ') ? '' : existingTopic?.aiInsight ?? '';
      return {
        id: topic.id, canonicalId: topic.id, subjectId, unitId: unit.id,
        name: topic.name, subject: normalizedCurriculum.subject,
        mastery: null, status: 'Not Enough Data',
        conceptUnderstanding: null, application: null, recall: null,
        history: existingTopic?.history ?? [], cognitiveHistory: existingTopic?.cognitiveHistory ?? [],
        aiInsight: oldGeneratedInsight, mistakePatterns: existingTopic?.mistakePatterns ?? [],
        evidenceCount: existingTopic?.evidenceCount, assessmentCount: existingTopic?.assessmentCount,
        practiceEvidence: existingTopic?.practiceEvidence,
      };
    }));
    const newSubjectRecord = normalizeSubject({
      id: subjectId, name: normalizedCurriculum.subject,
      iconName: existingSubject?.iconName ?? 'BookOpen', mastery: null,
      status: 'Not Enough Data', topics: extractedTopics,
    });
    setSubjects((previous) => {
      const idx = previous.findIndex((subject) => subject.id === subjectId);
      if (idx >= 0) return previous.map((subject, index) => index === idx ? newSubjectRecord : subject);
      const legacyIndex = sameNameSubjects.length === 1 ? previous.findIndex((subject) => subject === sameNameSubjects[0]) : -1;
      if (legacyIndex >= 0) return previous.map((subject, index) => index === legacyIndex ? newSubjectRecord : subject);
      return [...previous, newSubjectRecord];
    });

    setProfile((prev) => {
      if (!prev.subjects.includes(curriculum.subject)) {
        return { ...prev, subjects: [...prev.subjects, curriculum.subject] };
      }
      return prev;
    });
  };

  const openCoachWithPrompt = (promptText: string) => {
    setCoachInitialQuery(profile.privacy?.personalizedAi === false
      ? 'Give general study guidance without using any saved profile, course, assessment, practice, or recovery details. Ask me for information if a specific answer requires it.'
      : promptText);
    setCurrentTab('coach');
  };

  const setPracticeTopicSelection = (topicName: string) => {
    setPracticeTopic(topicName);
    if (!topicName.trim()) {
      setPracticeTopicId('');
      return;
    }
    if (activeRecoveryPlan.topicId && activeRecoveryPlan.topic.trim().toLocaleLowerCase() === topicName.trim().toLocaleLowerCase()) {
      setPracticeTopicId(activeRecoveryPlan.topicId);
      return;
    }
    const matches = subjects.flatMap((subject) => subject.topics
      .filter((topic) => topic.name.trim().toLocaleLowerCase() === topicName.trim().toLocaleLowerCase())
      .map((topic) => topic.id));
    setPracticeTopicId(matches.length === 1 ? matches[0] : '');
  };

  const resetAllData = () => {
    storageRemove(STORAGE_KEY);
    [
      '_profile',
      '_subjects',
      '_tests',
      '_recurring',
      '_curriculums',
      '_active_recovery_plan',
      '_notifications_enabled',
      '_nudge_interval',
      '_nudge_history',
      '_daily_goal',
      '_practice',
      '_current_tab',
      '_selected_test',
      '_entered_workspace',
    ].forEach((suffix) => storageRemove(STORAGE_KEY + suffix));
    storageRemove(COACH_MESSAGES_KEY);
    setProfile(INITIAL_PROFILE);
    setSubjects([]);
    setTestHistory([]);
    setRecurringMistakes([]);
    setCurriculums({});
    setActiveRecoveryPlan({
      topic: '',
      subject: '',
      steps: [],
    });
    setDailyGoal({
      date: getTodayDateString(),
      targetTasks: 0,
      targetMinutes: 0,
      completedMinutes: 0,
      completedStepNumbers: [],
    });
    setPracticeHistory([]);
    setNotificationsEnabled(true);
    setNudgeIntervalMinutes(30);
    setNudgeHistory([]);
    setActiveNudgeToast(null);
    setSelectedTestId(null);
    setSelectedTopic(null);
    setSelectedSubject(null);
    setPracticeTopic('');
    setPracticeTopicId('');
    setCurrentTab('home');
    setShowLandingPage(true);
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        subjects,
        testHistory,
        recurringMistakes,
        curriculums,
        overallMastery,
        overallImprovement,
        encouragingMessage,
        currentFocus,
        latestTest,
        activeRecoveryPlan,
        currentTab,
        setCurrentTab,
        showLandingPage,
        setShowLandingPage,
        selectedTestId,
        setSelectedTestId,
        selectedTopic,
        setSelectedTopic,
        selectedSubject,
        setSelectedSubject,
        isAnalyzeModalOpen,
        setIsAnalyzeModalOpen,
        isRecoveryModalOpen,
        setIsRecoveryModalOpen,
        isPracticeModalOpen,
        setIsPracticeModalOpen,
        practiceTopic,
        setPracticeTopic: setPracticeTopicSelection,
        practiceTopicId,
        setPracticeTopicId,
        isOnboardingOpen,
        setIsOnboardingOpen,
        coachInitialQuery,
        setCoachInitialQuery,
        notificationPermission,
        notificationsEnabled,
        nudgeIntervalMinutes,
        activeNudgeToast,
        nudgeHistory,
        isNotificationCenterOpen,
        setIsNotificationCenterOpen,
        requestBrowserNotifications,
        triggerRecoveryNudge,
        dismissNudgeToast,
        setNotificationsEnabled,
        setNudgeIntervalMinutes,
        dailyGoal,
        setDailyGoal,
        updateDailyGoalTarget,
        logDailyStudyMinutes,
        toggleRecoveryStepCompletion,
        addTestResult,
        recordPracticeResult,
        practiceHistory,
        updateRecoveryStepStatus,
        updateProfile,
        saveCurriculum,
        openCoachWithPrompt,
        resetAllData,
        isStudentProfileModalOpen,
        setIsStudentProfileModalOpen,
        syncStatus: externalSyncStatus,
        cloudSyncEnabled,
        lastSyncedAt,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
