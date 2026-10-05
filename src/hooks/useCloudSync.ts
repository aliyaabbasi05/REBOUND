/**
 * useCloudSync.ts
 *
 * React hook that manages the full cloud persistence lifecycle:
 *  1. On login: load cloud data, detect local data, trigger migration if needed
 *  2. On state changes: debounced writes to Supabase
 *  3. On failure: preserve local state, show retry UI
 *  4. On logout: stop syncing
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadCloudData,
  saveCloudData,
  patchCloudData,
  readLocalData,
  hasLocalReboundData,
  isMigrationDone,
  markMigrationDone,
  resolveConflict,
  type CloudStudentData,
  type SyncStatus,
} from '../services/cloudSync';
import type { MigrationState } from '../components/Auth/MigrationBanner';
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

export interface CloudSyncState {
  syncStatus: SyncStatus;
  migrationState: MigrationState;
  lastSyncedAt: string | null;
  syncError: string | null;
}

export interface CloudSyncActions {
  triggerMigration: () => Promise<void>;
  skipMigration: () => void;
  dismissMigrationBanner: () => void;
  forceSave: (data: CloudStudentData) => Promise<void>;
  getMigrationDataSummary: () => {
    tests: number;
    subjects: number;
    practiceRecords: number;
    hasProfile: boolean;
  } | null;
}

const DEBOUNCE_MS = 2000; // 2 second debounce for saves

export function useCloudSync(
  userId: string | null,
  isAuthenticated: boolean
): [
  CloudStudentData | null,   // initial cloud data (null = not loaded yet)
  CloudSyncState,
  CloudSyncActions,
] {
  const [cloudData, setCloudData] = useState<CloudStudentData | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [migrationState, setMigrationState] = useState<MigrationState>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const pendingSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);
  const hasRowRef = useRef(false); // track whether a DB row exists yet

  // ────────────────────────────────────────────────────
  // On login: load cloud data + check for migration need
  // ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      // Reset when logged out
      setCloudData(null);
      setSyncStatus('idle');
      setMigrationState('idle');
      isInitializedRef.current = false;
      hasRowRef.current = false;
      return;
    }

    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    async function initialize() {
      setSyncStatus('syncing');

      try {
        const cloud = await loadCloudData(userId!);

        if (cloud) {
          hasRowRef.current = true;
          // Cloud data exists – check if local data is newer and needs merging
          if (hasLocalReboundData() && !isMigrationDone(userId!)) {
            const local = readLocalData();
            const { data: merged } = resolveConflict(local, cloud);
            // Upload merged result
            await saveCloudData(userId!, merged);
            markMigrationDone(userId!);
            setCloudData(merged);
          } else {
            setCloudData(cloud);
          }
        } else {
          // No cloud record yet
          hasRowRef.current = false;
          setCloudData(null);

          if (hasLocalReboundData() && !isMigrationDone(userId!)) {
            // Prompt user to migrate
            setMigrationState('detected');
          }
        }

        setSyncStatus('synced');
        setLastSyncedAt(new Date().toISOString());
      } catch (err: unknown) {
        console.error('[useCloudSync] initialization error:', err);
        setSyncStatus('error');
        setSyncError(err instanceof Error ? err.message : 'Failed to load cloud data.');
      }
    }

    initialize();
  }, [isAuthenticated, userId]);

  // ────────────────────────────────────────────────────
  // Migration actions
  // ────────────────────────────────────────────────────
  const triggerMigration = useCallback(async () => {
    if (!userId) return;
    setMigrationState('migrating');
    setSyncStatus('migrating');

    try {
      const local = readLocalData();

      if (hasRowRef.current) {
        // Existing cloud row – merge
        const cloud = await loadCloudData(userId);
        const { data: merged } = cloud
          ? resolveConflict(local, cloud)
          : { data: local };
        const result = await saveCloudData(userId, merged);
        if (!result.success) throw new Error(result.error);
        setCloudData(merged);
      } else {
        // New user – simple upload
        const result = await saveCloudData(userId, local);
        if (!result.success) throw new Error(result.error);
        hasRowRef.current = true;
        setCloudData(local);
      }

      markMigrationDone(userId);
      setMigrationState('success');
      setSyncStatus('synced');
      setLastSyncedAt(new Date().toISOString());
    } catch (err: unknown) {
      console.error('[useCloudSync] migration error:', err);
      setMigrationState('error');
      setSyncStatus('error');
      setSyncError(err instanceof Error ? err.message : 'Migration failed.');
    }
  }, [userId]);

  const skipMigration = useCallback(() => {
    if (userId) markMigrationDone(userId);
    setMigrationState('skipped');
  }, [userId]);

  const dismissMigrationBanner = useCallback(() => {
    setMigrationState('idle');
  }, []);

  // ────────────────────────────────────────────────────
  // Force save (used by AppContext on important state changes)
  // ────────────────────────────────────────────────────
  const forceSave = useCallback(
    async (data: CloudStudentData) => {
      if (!userId) return;

      if (pendingSaveRef.current) {
        clearTimeout(pendingSaveRef.current);
        pendingSaveRef.current = null;
      }

      setSyncStatus('syncing');

      try {
        let result;
        if (hasRowRef.current) {
          result = await saveCloudData(userId, data);
        } else {
          result = await saveCloudData(userId, data);
          if (result.success) hasRowRef.current = true;
        }

        if (!result.success) throw new Error(result.error);
        setLastSyncedAt(new Date().toISOString());
        setSyncStatus('synced');
        setSyncError(null);
      } catch (err: unknown) {
        console.error('[useCloudSync] save error:', err);
        setSyncStatus('error');
        setSyncError(err instanceof Error ? err.message : 'Sync failed. Data preserved locally.');
      }
    },
    [userId]
  );

  const getMigrationDataSummary = useCallback(() => {
    if (!hasLocalReboundData()) return null;
    const local = readLocalData();
    return {
      tests: local.testHistory?.length ?? 0,
      subjects: local.subjects?.length ?? 0,
      practiceRecords: local.practiceHistory?.length ?? 0,
      hasProfile: Boolean(local.profile?.name || local.profile?.onboarded),
    };
  }, []);

  return [
    cloudData,
    { syncStatus, migrationState, lastSyncedAt, syncError },
    { triggerMigration, skipMigration, dismissMigrationBanner, forceSave, getMigrationDataSummary },
  ];
}

/**
 * Build a CloudStudentData snapshot from the current AppContext state.
 * Used to save the full workspace.
 */
export function buildCloudSnapshot(state: {
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
  dailyGoal: DailyStudyGoal;
  nudgeHistory: unknown[];
  notificationsEnabled: boolean;
  nudgeIntervalMinutes: number;
}): CloudStudentData {
  // Read coach messages from localStorage (managed separately in AICoachView)
  let coachMessages: ChatMessage[] = [];
  try {
    const raw = localStorage.getItem('rebound_academic_coach_messages_v1');
    if (raw) coachMessages = JSON.parse(raw) as ChatMessage[];
  } catch { /* ignore */ }

  return {
    profile: state.profile,
    subjects: state.subjects,
    testHistory: state.testHistory,
    curriculums: state.curriculums,
    activeRecoveryPlan: state.activeRecoveryPlan,
    practiceHistory: state.practiceHistory,
    dailyGoal: state.dailyGoal,
    nudgeHistory: state.nudgeHistory,
    coachMessages,
    notificationsEnabled: state.notificationsEnabled,
    nudgeIntervalMinutes: state.nudgeIntervalMinutes,
    updatedAt: new Date().toISOString(),
  };
}
