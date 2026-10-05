import React, { lazy, Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useCloudSync } from './hooks/useCloudSync';
import type { CloudStudentData } from './services/cloudSync';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { MigrationBanner } from './components/Auth/MigrationBanner';
import { AuthGate } from './components/Auth/AuthGate';

const HomeDashboard = lazy(() => import('./components/Dashboard/HomeDashboard').then((module) => ({ default: module.HomeDashboard })));
const OverallAnalysis = lazy(() => import('./components/Analysis/OverallAnalysis').then((module) => ({ default: module.OverallAnalysis })));
const SubjectsView = lazy(() => import('./components/Analysis/SubjectsView').then((module) => ({ default: module.SubjectsView })));
const AICoachView = lazy(() => import('./components/AICoach/AICoachView').then((module) => ({ default: module.AICoachView })));
const TestHistoryView = lazy(() => import('./components/TestHistory/TestHistoryView').then((module) => ({ default: module.TestHistoryView })));
const ProfileView = lazy(() => import('./components/Profile/ProfileView').then((module) => ({ default: module.ProfileView })));
const RecoveryPlanView = lazy(() => import('./components/Recovery/RecoveryPlanView').then((module) => ({ default: module.RecoveryPlanView })));
const AnalyzeWorkspaceView = lazy(() => import('./components/TestAnalysis/AnalyzeWorkspaceView').then((module) => ({ default: module.AnalyzeWorkspaceView })));
const WelcomeLandingView = lazy(() => import('./components/Landing/WelcomeLandingView').then((module) => ({ default: module.WelcomeLandingView })));
const TestAnalysisView = lazy(() => import('./components/TestAnalysis/TestAnalysisView').then((module) => ({ default: module.TestAnalysisView })));
const AnalyzeNewTestModal = lazy(() => import('./components/TestAnalysis/AnalyzeNewTestModal').then((module) => ({ default: module.AnalyzeNewTestModal })));
const RecoveryPlanModal = lazy(() => import('./components/Recovery/RecoveryPlanModal').then((module) => ({ default: module.RecoveryPlanModal })));
const PracticeQuizModal = lazy(() => import('./components/Recovery/PracticeQuizModal').then((module) => ({ default: module.PracticeQuizModal })));
const TopicDetailModal = lazy(() => import('./components/Analysis/TopicDetailModal').then((module) => ({ default: module.TopicDetailModal })));
const SubjectDetailModal = lazy(() => import('./components/Analysis/SubjectDetailModal').then((module) => ({ default: module.SubjectDetailModal })));
const OnboardingModal = lazy(() => import('./components/OnboardingModal').then((module) => ({ default: module.OnboardingModal })));
const NotificationToast = lazy(() => import('./components/Notifications/NotificationToast').then((module) => ({ default: module.NotificationToast })));
const NotificationCenterModal = lazy(() => import('./components/Notifications/NotificationCenterModal').then((module) => ({ default: module.NotificationCenterModal })));
const StudentProfileModal = lazy(() => import('./components/Auth/StudentProfileModal').then((module) => ({ default: module.StudentProfileModal })));
const DemoMode = lazy(() => import('./components/DemoMode/DemoMode').then((module) => ({ default: module.DemoMode })));

// ─── CloudAwareApp ─────────────────────────────────────────────────────────────
// Sits inside AuthProvider, orchestrates cloud sync and renders AppProvider

const DEBOUNCE_MS = 2000;

const CloudAwareApp: React.FC<{
  onTryDemo: () => void;
  shouldEnterWorkspace: boolean;
  onWorkspaceIntentHandled: () => void;
}> = ({ onTryDemo, shouldEnterWorkspace, onWorkspaceIntentHandled }) => {
  const { user, status: authStatus, isCloudEnabled } = useAuth();
  const isAuthenticated = authStatus === 'authenticated';

  const [
    cloudInitialData,
    { syncStatus, migrationState, lastSyncedAt, syncError },
    { triggerMigration, skipMigration, dismissMigrationBanner, forceSave, getMigrationDataSummary },
  ] = useCloudSync(user?.id ?? null, isAuthenticated);

  // Debounced save: collect state change notifications and batch saves
  const pendingSaveRef = useRef<CloudStudentData | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStateChanged = useCallback(
    (snapshot: CloudStudentData) => {
      if (!isAuthenticated || !user?.id) return;
      pendingSaveRef.current = snapshot;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (pendingSaveRef.current) {
          forceSave(pendingSaveRef.current);
          pendingSaveRef.current = null;
        }
      }, DEBOUNCE_MS);
    },
    [isAuthenticated, user?.id, forceSave]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const migrationSummary = getMigrationDataSummary();

  // ── Auth gate: show sign-in screen when Supabase is configured but user is
  // unauthenticated (including while session is being initialised).
  // When Supabase is NOT configured the app falls back to local-only mode and
  // the existing landing page / workspace flow continues unchanged.
  if (isCloudEnabled && authStatus !== 'authenticated') {
    if (authStatus === 'initializing') {
      // Show a minimal loading screen while checking the stored session.
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAF6EE]">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#14281D] text-[#B4F04C] animate-pulse">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M2.5 12C2.5 6.75 6.75 2.5 12 2.5a9.5 9.5 0 0 1 9.5 9.5c0 5.25-4.25 9.5-9.5 9.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-xs font-bold text-[#557361]">Loading REBOUND…</p>
          </div>
        </div>
      );
    }
    // Unauthenticated – show the full-screen sign-in gate (no demo / bypass allowed)
    return <AuthGate />;
  }

  return (
    <AppProvider
      cloudInitialData={cloudInitialData}
      onStateChanged={handleStateChanged}
      syncStatus={syncStatus}
      cloudSyncEnabled={isCloudEnabled && isAuthenticated}
      lastSyncedAt={lastSyncedAt}
    >
      <AppContent
        onTryDemo={onTryDemo}
        shouldEnterWorkspace={shouldEnterWorkspace}
        onWorkspaceIntentHandled={onWorkspaceIntentHandled}
        cloudInitialData={cloudInitialData}
        isCloudEnabled={isCloudEnabled}
        isAuthenticated={isAuthenticated}
      />

      {/* Migration banner – shown after login when local data is detected */}
      <MigrationBanner
        state={migrationState}
        onMigrate={triggerMigration}
        onSkip={skipMigration}
        onDismiss={dismissMigrationBanner}
        errorMessage={syncError ?? undefined}
        dataSummary={migrationSummary ?? undefined}
      />
    </AppProvider>
  );
};

// ─── AppContent ────────────────────────────────────────────────────────────────
// Actual page renderer – uses useApp() to access AppContext

import { useApp } from './context/AppContext';

interface AppContentProps {
  onTryDemo: () => void;
  shouldEnterWorkspace: boolean;
  onWorkspaceIntentHandled: () => void;
  /** Cloud data loaded after sign-in – used to determine if returning user */
  cloudInitialData?: CloudStudentData | null;
  isCloudEnabled?: boolean;
  isAuthenticated?: boolean;
}

const AppContent: React.FC<AppContentProps> = ({
  onTryDemo,
  shouldEnterWorkspace,
  onWorkspaceIntentHandled,
  cloudInitialData,
  isCloudEnabled = false,
  isAuthenticated = false,
}) => {
  const {
    currentTab,
    selectedTestId,
    setSelectedTestId,
    selectedTopic,
    setSelectedTopic,
    selectedSubject,
    setSelectedSubject,
    showLandingPage,
    setShowLandingPage,
    setCurrentTab,
    curriculums,
    setIsOnboardingOpen,
    activeNudgeToast,
    dismissNudgeToast,
    isNotificationCenterOpen,
    setIsNotificationCenterOpen,
    isStudentProfileModalOpen,
    isAnalyzeModalOpen,
    isRecoveryModalOpen,
    isPracticeModalOpen,
    isOnboardingOpen,
    syncStatus,
    cloudSyncEnabled,
    lastSyncedAt,
    profile,
  } = useApp();

  const { user } = useAuth();

  // ── Post-login routing ───────────────────────────────────────────────────
  // Tracks whether we've already handled the initial post-login navigation so
  // we don't re-trigger it on subsequent renders.
  const postLoginHandledRef = useRef(false);

  useEffect(() => {
    // Only run once per authenticated session, after cloud data has been resolved.
    if (!isAuthenticated || !isCloudEnabled) return;
    if (postLoginHandledRef.current) return;

    // Wait until the cloud sync hook has had a chance to set cloudInitialData
    // (it starts as null while loading). We use a small heuristic: if the hook
    // returns null it may still be loading; give it until syncStatus is no longer
    // 'syncing'. However, since syncStatus lives in the parent and we do not have
    // it here, we key off cloudInitialData being explicitly set (non-undefined).
    // undefined = still loading; null = no cloud record found; object = loaded.
    if (cloudInitialData === undefined) return;

    postLoginHandledRef.current = true;

    const hasCompletedProfile =
      cloudInitialData?.profile?.onboarded === true ||
      profile.onboarded === true;

    if (hasCompletedProfile) {
      // ── Returning user: restore workspace, go straight to dashboard ──
      setShowLandingPage(false);
      setCurrentTab('home');
    } else {
      // ── New user: skip landing page, open the Setup Profile onboarding ──
      setShowLandingPage(false);
      setCurrentTab('home');
      setIsOnboardingOpen(true);
    }
  }, [isAuthenticated, isCloudEnabled, cloudInitialData, profile.onboarded, setShowLandingPage, setCurrentTab, setIsOnboardingOpen]);

  // Reset the post-login handler when the user logs out so the next sign-in
  // is handled correctly.
  useEffect(() => {
    if (!isAuthenticated) {
      postLoginHandledRef.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!shouldEnterWorkspace) return;
    if (showLandingPage) {
      setShowLandingPage(false);
      setCurrentTab('home');
      if (Object.keys(curriculums).length === 0) setIsOnboardingOpen(true);
    }
    onWorkspaceIntentHandled();
  }, [curriculums, onWorkspaceIntentHandled, setCurrentTab, setIsOnboardingOpen, setShowLandingPage, shouldEnterWorkspace, showLandingPage]);

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FAF6EE] text-sm font-semibold text-[#14281D]">Loading REBOUND…</div>}>
      {showLandingPage ? (
        <WelcomeLandingView onTryDemo={onTryDemo} />
      ) : (
        <div className="min-h-screen bg-[#FAF6EE] flex font-sans">
        {/* Desktop Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 pt-6 pb-24 lg:pb-8 sm:py-8">
            {/* Cloud sync / auth status banner */}
            {!isCloudEnabled && (
              <aside role="note" className="mb-5 rounded-2xl border border-[#D9C88B] bg-[#FFF8E2] px-4 py-3 text-xs leading-5 text-[#604F22]">
                <strong className="font-black">Local-only mode.</strong>{' '}
                Workspace records stay in this browser only. Sign in with Google to enable cloud sync across devices.
              </aside>
            )}

            {isCloudEnabled && user && syncStatus === 'error' && (
              <aside className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700 flex items-center justify-between gap-2">
                <span>⚠ Cloud sync failed. Your local data is safe. Will retry automatically.</span>
              </aside>
            )}
            {selectedTestId && currentTab !== 'coach' ? (
              <TestAnalysisView
                testId={selectedTestId}
                onBack={() => setSelectedTestId(null)}
              />
            ) : (
              <>
                {currentTab === 'home' && <HomeDashboard />}
                {(currentTab === 'analysis' || currentTab === 'analytics') && <OverallAnalysis />}
                {currentTab === 'analyze' && <AnalyzeWorkspaceView />}
                {currentTab === 'subjects' && <SubjectsView />}
                {currentTab === 'recovery' && <RecoveryPlanView />}
                {currentTab === 'coach' && <AICoachView />}
                {currentTab === 'history' && <TestHistoryView />}
                {currentTab === 'profile' && <ProfileView />}
              </>
            )}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav />

        {/* Global Modals */}
        {isStudentProfileModalOpen && <StudentProfileModal />}
        {isAnalyzeModalOpen && <AnalyzeNewTestModal />}
        {isRecoveryModalOpen && <RecoveryPlanModal />}
        {isPracticeModalOpen && <PracticeQuizModal />}
        {isOnboardingOpen && <OnboardingModal />}
        <NotificationCenterModal
          isOpen={isNotificationCenterOpen}
          onClose={() => setIsNotificationCenterOpen(false)}
        />

        {/* Floating Recovery Nudge Toast */}
        {activeNudgeToast && <NotificationToast nudge={activeNudgeToast} onDismiss={dismissNudgeToast} />}

        {selectedTopic && <TopicDetailModal
          topic={selectedTopic}
          onClose={() => setSelectedTopic(null)}
        />}

        {selectedSubject && <SubjectDetailModal
          subject={selectedSubject}
          onClose={() => setSelectedSubject(null)}
          onSelectTopic={(topic) => setSelectedTopic(topic)}
        />}
        </div>
      )}
    </Suspense>
  );
};

// ─── Routing ───────────────────────────────────────────────────────────────────

const isDemoRoute = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.hash === '#demo' || window.location.hash === '#/demo';
};

const RoutedApp: React.FC = () => {
  const [demoRoute, setDemoRoute] = useState(isDemoRoute);
  const [shouldEnterWorkspace, setShouldEnterWorkspace] = useState(false);

  useEffect(() => {
    const syncRoute = () => setDemoRoute(isDemoRoute());
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  const routeToDemo = () => {
    window.history.pushState({}, '', `${window.location.pathname}${window.location.search}#demo`);
    setShouldEnterWorkspace(false);
    setDemoRoute(true);
  };

  const leaveDemo = (enterWorkspace = false) => {
    window.history.pushState({}, '', `${window.location.pathname}${window.location.search}`);
    setDemoRoute(false);
    setShouldEnterWorkspace(enterWorkspace);
  };

  if (demoRoute) {
    return (
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FAF6EE] text-sm font-semibold text-[#14281D]">Loading demo…</div>}>
        <DemoMode onExitDemo={() => leaveDemo(false)} onGetStarted={() => leaveDemo(true)} />
      </React.Suspense>
    );
  }

  return (
    <AuthProvider>
      <CloudAwareApp
        onTryDemo={routeToDemo}
        shouldEnterWorkspace={shouldEnterWorkspace}
        onWorkspaceIntentHandled={() => setShouldEnterWorkspace(false)}
      />
    </AuthProvider>
  );
};

export default function App() {
  return <RoutedApp />;
}
