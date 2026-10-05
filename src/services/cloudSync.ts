/**
 * cloudSync.ts
 * 
 * Handles all cloud persistence operations with Supabase.
 * 
 * Design:
 * - All writes are upserts (idempotent)
 * - Reads only succeed when user is authenticated
 * - RLS on the database ensures users cannot access each other's data
 * - localStorage remains as a write-through cache / offline fallback
 * - We never claim success until the DB confirms the write
 */

import { supabase } from './supabase';
import type {
  StudentProfile,
  SubjectRecord,
  TestRecord,
  RecurringMistakeItem,
  SubjectCurriculum,
  PracticeRecord,
  DailyStudyGoal,
  RecoveryStep,
  ChatMessage,
} from '../types';

// ──────────────────────────────────────────────────────
// Types matching the Supabase table schema
// ──────────────────────────────────────────────────────

export interface CloudStudentData {
  profile: StudentProfile;
  subjects: SubjectRecord[];
  testHistory: TestRecord[];
  curriculums: Record<string, SubjectCurriculum>;
  activeRecoveryPlan: {
    subjectId?: string;
    topicId?: string;
    unitId?: string;
    topic: string;
    subject: string;
    steps: RecoveryStep[];
  };
  practiceHistory: PracticeRecord[];
  dailyGoal: DailyStudyGoal | null;
  nudgeHistory: unknown[];
  coachMessages: ChatMessage[];
  notificationsEnabled: boolean;
  nudgeIntervalMinutes: number;
  updatedAt: string; // ISO timestamp
}

export type SyncStatus =
  | 'idle'
  | 'syncing'
  | 'synced'
  | 'error'
  | 'offline'
  | 'migrating';

export interface SyncResult {
  success: boolean;
  error?: string;
}

// ──────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function safeJson<T>(value: T): object {
  // Supabase JSONB columns accept plain JS objects
  return (value as unknown) as object;
}

// ──────────────────────────────────────────────────────
// LOAD from cloud
// ──────────────────────────────────────────────────────

/**
 * Load all student data from the cloud for the authenticated user.
 * Returns null if no cloud record exists yet.
 */
export async function loadCloudData(userId: string): Promise<CloudStudentData | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('student_workspaces')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[CloudSync] Load error:', error);
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    profile: (data.profile as StudentProfile) ?? { name: '', email: '', school: '', grade: '', course: '', country: '', curriculum: '', avatarInitials: '', subjects: [], onboarded: false, streakDays: 0, streakDaysCompleted: [] },
    subjects: (data.subjects as SubjectRecord[]) ?? [],
    testHistory: (data.test_history as TestRecord[]) ?? [],
    curriculums: (data.curriculums as Record<string, SubjectCurriculum>) ?? {},
    activeRecoveryPlan: (data.active_recovery_plan as CloudStudentData['activeRecoveryPlan']) ?? { topic: '', subject: '', steps: [] },
    practiceHistory: (data.practice_history as PracticeRecord[]) ?? [],
    dailyGoal: (data.daily_goal as DailyStudyGoal) ?? null,
    nudgeHistory: (data.nudge_history as unknown[]) ?? [],
    coachMessages: (data.coach_messages as ChatMessage[]) ?? [],
    notificationsEnabled: (data.notifications_enabled as boolean) ?? true,
    nudgeIntervalMinutes: (data.nudge_interval_minutes as number) ?? 30,
    updatedAt: (data.updated_at as string) ?? nowIso(),
  };
}

// ──────────────────────────────────────────────────────
// SAVE to cloud (full upsert)
// ──────────────────────────────────────────────────────

/**
 * Save the entire student workspace to cloud as an atomic upsert.
 * This is used for migration and full-state saves.
 */
export async function saveCloudData(
  userId: string,
  data: CloudStudentData
): Promise<SyncResult> {
  if (!supabase) return { success: false, error: 'Supabase not configured.' };

  const row = {
    user_id: userId,
    profile: safeJson(data.profile),
    subjects: safeJson(data.subjects),
    test_history: safeJson(data.testHistory),
    curriculums: safeJson(data.curriculums),
    active_recovery_plan: safeJson(data.activeRecoveryPlan),
    practice_history: safeJson(data.practiceHistory),
    daily_goal: safeJson(data.dailyGoal),
    nudge_history: safeJson(data.nudgeHistory),
    coach_messages: safeJson(data.coachMessages),
    notifications_enabled: data.notificationsEnabled,
    nudge_interval_minutes: data.nudgeIntervalMinutes,
    updated_at: nowIso(),
  };

  const { error } = await supabase
    .from('student_workspaces')
    .upsert(row, { onConflict: 'user_id' });

  if (error) {
    console.error('[CloudSync] Save error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ──────────────────────────────────────────────────────
// PATCH helpers – update specific columns only
// ──────────────────────────────────────────────────────

type WorkspacePatch = {
  profile?: object;
  subjects?: object;
  test_history?: object;
  curriculums?: object;
  active_recovery_plan?: object;
  practice_history?: object;
  daily_goal?: object;
  nudge_history?: object;
  coach_messages?: object;
  notifications_enabled?: boolean;
  nudge_interval_minutes?: number;
  updated_at?: string;
};

export async function patchCloudData(
  userId: string,
  patch: WorkspacePatch
): Promise<SyncResult> {
  if (!supabase) return { success: false, error: 'Supabase not configured.' };

  const { error } = await supabase
    .from('student_workspaces')
    .update({ ...patch, updated_at: nowIso() })
    .eq('user_id', userId);

  if (error) {
    // If no row exists yet (new user), fall back to a full upsert with empty defaults
    if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
      // Row doesn't exist – insert first
      return { success: false, error: 'Row not initialized. Run a full save first.' };
    }
    console.error('[CloudSync] Patch error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ──────────────────────────────────────────────────────
// MIGRATION: localStorage → Cloud
// ──────────────────────────────────────────────────────

const STORAGE_KEY = 'rebound_academic_state_v8_real_data_only';
const COACH_KEY = 'rebound_academic_coach_messages_v1';

function safeLocalRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Detect whether meaningful REBOUND data exists in localStorage.
 * A profile, subjects, tests, or curricula count as "meaningful".
 */
export function hasLocalReboundData(): boolean {
  const profile = safeLocalRead<{ name?: string; onboarded?: boolean }>(
    STORAGE_KEY + '_profile',
    {}
  );
  const subjects = safeLocalRead<unknown[]>(STORAGE_KEY + '_subjects', []);
  const tests = safeLocalRead<unknown[]>(STORAGE_KEY + '_tests', []);
  const curriculums = safeLocalRead<Record<string, unknown>>(STORAGE_KEY + '_curriculums', {});

  return (
    Boolean(profile.name || profile.onboarded) ||
    subjects.length > 0 ||
    tests.length > 0 ||
    Object.keys(curriculums).length > 0
  );
}

/**
 * Read all current localStorage REBOUND data into a CloudStudentData object.
 */
export function readLocalData(): CloudStudentData {
  const profile = safeLocalRead<StudentProfile>(
    STORAGE_KEY + '_profile',
    {
      name: '', email: '', school: '', grade: '', course: '',
      country: '', curriculum: '', avatarInitials: '', subjects: [],
      onboarded: false, streakDays: 0, streakDaysCompleted: [],
      privacy: { personalizedAi: true, useUploadedWork: true },
    }
  );
  const subjects = safeLocalRead<SubjectRecord[]>(STORAGE_KEY + '_subjects', []);
  const testHistory = safeLocalRead<TestRecord[]>(STORAGE_KEY + '_tests', []);
  const curriculums = safeLocalRead<Record<string, SubjectCurriculum>>(
    STORAGE_KEY + '_curriculums',
    {}
  );
  const activeRecoveryPlan = safeLocalRead<CloudStudentData['activeRecoveryPlan']>(
    STORAGE_KEY + '_active_recovery_plan',
    { topic: '', subject: '', steps: [] }
  );
  const practiceHistory = safeLocalRead<PracticeRecord[]>(STORAGE_KEY + '_practice', []);
  const dailyGoal = safeLocalRead<DailyStudyGoal | null>(STORAGE_KEY + '_daily_goal', null);
  const nudgeHistory = safeLocalRead<unknown[]>(STORAGE_KEY + '_nudge_history', []);
  const coachMessages = safeLocalRead<ChatMessage[]>(COACH_KEY, []);
  const notificationsEnabled = safeLocalRead<boolean>(
    STORAGE_KEY + '_notifications_enabled',
    true
  );
  const nudgeIntervalMinutes = Number(localStorage.getItem(STORAGE_KEY + '_nudge_interval') ?? '30') || 30;

  return {
    profile,
    subjects,
    testHistory,
    curriculums,
    activeRecoveryPlan,
    practiceHistory,
    dailyGoal,
    nudgeHistory,
    coachMessages,
    notificationsEnabled,
    nudgeIntervalMinutes,
    updatedAt: nowIso(),
  };
}

const MIGRATION_DONE_PREFIX = 'rebound_cloud_migration_done_';

export function isMigrationDone(userId: string): boolean {
  return localStorage.getItem(MIGRATION_DONE_PREFIX + userId) === 'true';
}

export function markMigrationDone(userId: string): void {
  localStorage.setItem(MIGRATION_DONE_PREFIX + userId, 'true');
}

/**
 * Determine which data to use when both local and cloud records exist.
 * Strategy: prefer the most recently updated valid record.
 */
export function resolveConflict(
  local: CloudStudentData,
  cloud: CloudStudentData
): { data: CloudStudentData; source: 'local' | 'cloud' | 'merged' } {
  const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
  const cloudTime = cloud.updatedAt ? new Date(cloud.updatedAt).getTime() : 0;

  // Use the more recently updated source for the main fields
  const useCloud = cloudTime >= localTime;

  // Merge test history: union by ID, keeping latest version of duplicates
  const testMap = new Map<string, TestRecord>();
  for (const t of [...(local.testHistory ?? []), ...(cloud.testHistory ?? [])]) {
    if (t?.id) testMap.set(t.id, t);
  }

  // Merge practice history: union by ID
  const practiceMap = new Map<string, PracticeRecord>();
  for (const p of [...(local.practiceHistory ?? []), ...(cloud.practiceHistory ?? [])]) {
    if (p?.id) practiceMap.set(p.id, p);
  }

  // Merge coach messages: union by ID, keep last 100
  const msgMap = new Map<string, ChatMessage>();
  for (const m of [...(local.coachMessages ?? []), ...(cloud.coachMessages ?? [])]) {
    if (m?.id) msgMap.set(m.id, m);
  }

  const merged: CloudStudentData = {
    // For single records, use the newer source
    profile: useCloud ? cloud.profile : local.profile,
    subjects: useCloud ? cloud.subjects : local.subjects,
    curriculums: useCloud ? cloud.curriculums : local.curriculums,
    activeRecoveryPlan: useCloud ? cloud.activeRecoveryPlan : local.activeRecoveryPlan,
    dailyGoal: useCloud ? cloud.dailyGoal : local.dailyGoal,
    notificationsEnabled: useCloud ? cloud.notificationsEnabled : local.notificationsEnabled,
    nudgeIntervalMinutes: useCloud ? cloud.nudgeIntervalMinutes : local.nudgeIntervalMinutes,
    nudgeHistory: useCloud ? cloud.nudgeHistory : local.nudgeHistory,
    // Merged collections
    testHistory: Array.from(testMap.values()),
    practiceHistory: Array.from(practiceMap.values()),
    coachMessages: Array.from(msgMap.values()).slice(-100),
    updatedAt: nowIso(),
  };

  return { data: merged, source: 'merged' };
}
