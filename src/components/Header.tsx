import React from 'react';
import { PlusCircle, Flame, Sparkles, Bell, User, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { GoogleSignInButton } from './Auth/GoogleSignInButton';

export const Header: React.FC = () => {
  const {
    currentTab,
    setIsAnalyzeModalOpen,
    profile,
    setSelectedTestId,
    openCoachWithPrompt,
    setIsNotificationCenterOpen,
    activeRecoveryPlan,
    setIsStudentProfileModalOpen,
    syncStatus,
    cloudSyncEnabled,
    lastSyncedAt,
  } = useApp();

  const { isCloudEnabled } = useAuth();

  const pendingRecoveryCount = activeRecoveryPlan.steps.filter((s) => s.status !== 'completed').length;

  const getTitle = () => {
    switch (currentTab) {
      case 'home':
        return 'Academic Recovery Dashboard';
      case 'analytics':
      case 'analysis':
        return 'Performance & Mastery Analytics';
      case 'analyze':
        return 'Analyze Test Diagnostics';
      case 'subjects':
        return 'Subjects & Curriculum Breakdown';
      case 'recovery':
        return activeRecoveryPlan.topic ? `${activeRecoveryPlan.topic} Recovery Plan` : 'Recovery Plan';
      case 'coach':
        return 'REBOUND AI Coach';
      case 'history':
        return 'Test & Diagnostic History';
      case 'profile':
        return 'Student Profile & Curriculum';
      default:
        return 'REBOUND';
    }
  };

  const SyncIndicator = () => {
    if (!isCloudEnabled || !cloudSyncEnabled) return null;
    if (syncStatus === 'syncing' || syncStatus === 'migrating') {
      return <span title="Syncing to cloud…" className="text-[#14281D]/40"><Loader2 className="w-3.5 h-3.5 animate-spin" /></span>;
    }
    if (syncStatus === 'synced') {
      return <span title={`Synced to cloud${lastSyncedAt ? ' at ' + new Date(lastSyncedAt).toLocaleTimeString() : ''}`} className="text-emerald-500"><Cloud className="w-3.5 h-3.5" /></span>;
    }
    if (syncStatus === 'error') {
      return <span title="Cloud sync error – data saved locally" className="text-amber-500"><CloudOff className="w-3.5 h-3.5" /></span>;
    }
    return null;
  };

  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-[#E2EAE4] px-4 sm:px-8 py-3.5 shadow-2xs">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="lg:hidden w-8 h-8 rounded-xl bg-[#14281D] flex items-center justify-center text-[#B4F04C] text-xs font-black shadow-sm">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-[#B4F04C] stroke-[2.75] stroke-linecap-round stroke-linejoin-round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-[#14281D] leading-tight tracking-tight">{getTitle()}</h1>
            <p className="hidden sm:flex items-center gap-1.5 text-xs text-[#557361] font-medium">
              Turn every test into your next step.
              <SyncIndicator />
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isCloudEnabled ? (
            <GoogleSignInButton variant="compact" />
          ) : (
            <button
              onClick={() => setIsStudentProfileModalOpen(true)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#254533]/20 bg-[#F4F6F4] hover:bg-[#E8EFEA] text-[#14281D] text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Manage local student profile"
            >
              <User className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline truncate max-w-[140px]">
                {profile.name ? profile.name.split(' ')[0] : 'Set Profile'}
              </span>
            </button>
          )}

          <button
            onClick={() => openCoachWithPrompt('What is my biggest recovery target right now?')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B4F04C]" />
            <span>AI Coach</span>
          </button>

          {profile.streakDays > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F4F6F4] border border-[#E2EAE4] text-xs font-extrabold text-[#14281D]">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{profile.streakDays}d Streak</span>
            </div>
          )}

          <button
            onClick={() => setIsNotificationCenterOpen(true)}
            className="relative p-2 rounded-xl bg-white hover:bg-[#F4F6F4] border border-[#E2EAE4] text-[#14281D] transition-colors shadow-2xs group cursor-pointer"
            title="Recovery Nudges & Browser Notifications"
            aria-label="Recovery Nudges & Notifications"
          >
            <Bell className="w-4 h-4 transition-transform group-hover:rotate-12" />
            {pendingRecoveryCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#14281D] text-[#B4F04C] font-black text-[9px] flex items-center justify-center shadow-xs border border-[#B4F04C]">
                {pendingRecoveryCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setSelectedTestId(null);
              setIsAnalyzeModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#B4F04C] hover:bg-[#c2f768] text-[#14281D] text-xs sm:text-sm font-black shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.75]" />
            <span className="hidden sm:inline">+ Analyze New Test</span>
            <span className="sm:hidden">+ Analyze</span>
          </button>
        </div>
      </div>
    </header>
  );
};
