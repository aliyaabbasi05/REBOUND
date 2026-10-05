import React from 'react';
import {
  Home,
  Scan,
  BarChart2,
  BookOpen,
  GitBranch,
  Sparkles,
  History,
  User,
  MoreHorizontal,
  Flame,
  Globe,
  Bell,
  PlusCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';

export const Sidebar: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    profile,
    showLandingPage,
    setShowLandingPage,
    setIsAnalyzeModalOpen,
    setIsStudentProfileModalOpen,
    setIsNotificationCenterOpen,
    activeRecoveryPlan,
    setSelectedTestId,
  } = useApp();

  const pendingRecoveryCount = activeRecoveryPlan?.steps?.filter((s) => s.status !== 'completed').length || 0;
  const weekDays = (() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const key = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return { label: date.toLocaleDateString(undefined, { weekday: 'narrow' }), key: key(date) };
    });
  })();

  interface NavItem {
    id: TabType | 'notifications';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'analyze', label: 'Analyze test', icon: Scan },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'recovery', label: 'Recovery plan', icon: GitBranch },
    { id: 'coach', label: 'AI Coach', icon: Sparkles },
    { id: 'history', label: 'Test history', icon: History },
    { id: 'notifications', label: 'Notifications & Nudges', icon: Bell, badge: pendingRecoveryCount },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleNavClick = (id: TabType | 'notifications') => {
    if (id === 'notifications') {
      setIsNotificationCenterOpen(true);
      return;
    }
    setShowLandingPage(false);
    setSelectedTestId(null);
    setCurrentTab(id);
    if (id === 'analyze') {
      setIsAnalyzeModalOpen(false);
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#14281D] text-white h-screen sticky top-0 px-4 py-5 z-30 select-none justify-between border-r border-[#1B3526]">
      {/* 1. Header / Logo */}
      <div>
        <div className="flex items-center justify-between px-2 mb-6">
          <div className="flex items-center gap-3">
            {/* Lime Green Logo Icon */}
            <div className="w-9 h-9 rounded-xl bg-[#B4F04C] flex items-center justify-center text-[#14281D] shadow-sm">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-none stroke-[#14281D] stroke-[2.75] stroke-linecap-round stroke-linejoin-round"
              >
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white font-sans">
              REBOUND
            </span>
          </div>

          <button
            onClick={() => setIsNotificationCenterOpen(true)}
            className="relative p-2 rounded-xl bg-[#1C3527] hover:bg-[#254533] text-[#B4F04C] transition-colors cursor-pointer"
            title="Notifications & Nudges"
          >
            <Bell className="w-4 h-4" />
            {pendingRecoveryCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B4F04C] text-[#14281D] font-black text-[9px] flex items-center justify-center border border-[#14281D]">
                {pendingRecoveryCount}
              </span>
            )}
          </button>
        </div>

        {/* Analyze Test CTA Button */}
        <button
          onClick={() => setIsAnalyzeModalOpen(true)}
          className="w-full mb-4 py-2.5 px-3.5 rounded-2xl bg-[#B4F04C] hover:bg-[#c2f768] text-[#14281D] font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>+ Analyze New Test</span>
        </button>

        {/* 2. Main Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              !showLandingPage &&
              (currentTab === item.id ||
                (item.id === 'analytics' && currentTab === 'analysis'));

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#B4F04C] text-[#14281D] shadow-sm font-bold'
                    : 'text-[#9BB0A3] hover:text-white hover:bg-[#1C3527]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#14281D] stroke-[2.4]' : 'text-[#9BB0A3]'
                    }`}
                  />
                  <span className="tracking-tight">{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-[#14281D] text-[#B4F04C]' : 'bg-[#B4F04C] text-[#14281D]'}`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Bottom Widgets: Streak Card + Profile Pill */}
      <div className="space-y-3 pt-4 border-t border-[#1C3527]/70">
        {/* Streak Card */}
        <div className="p-3.5 rounded-2xl bg-[#1C3527] border border-[#254533] text-left">
          <div className="flex items-center gap-1.5 mb-1 text-white font-bold text-xs">
            <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{profile.streakDays} day streak</span>
          </div>
          <p className="text-[11px] text-[#9BB0A3] leading-snug mb-3 font-medium">
            {profile.streakDays > 0 ? 'Activity you record here builds this streak.' : 'Log study time or complete practice to begin tracking.'}
          </p>

          {/* M T W T F S S days circles */}
          <div className="flex items-center justify-between">
            {weekDays.map(({ label, key }) => {
              const isCompleted = profile.streakDaysCompleted.includes(key);
              return (
                <div
                  key={key}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isCompleted
                      ? 'bg-[#B4F04C] text-[#14281D]'
                      : 'bg-[#152B1F] text-[#557361] border border-[#254533]'
                  }`}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {/* User Profile Pill */}
        <div
          onClick={() => {
            setIsStudentProfileModalOpen(true);
          }}
          className="flex items-center justify-between p-2 rounded-2xl hover:bg-[#1C3527] transition-colors cursor-pointer group"
          title="Manage local student profile"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar circle */}
            <div className="w-8 h-8 rounded-full bg-[#1C3527] text-[#B4F04C] border border-[#B4F04C]/50 font-black text-xs flex items-center justify-center shrink-0">
              {profile.avatarInitials || 'S'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-[#B4F04C] transition-colors">
                  {profile.name || 'Student profile'}
                </p>
              </div>
              <p className="text-[10px] text-[#9BB0A3] truncate leading-tight mt-0.5">
                {profile.grade || 'Local browser profile'}
              </p>
            </div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-[#9BB0A3] group-hover:text-white shrink-0" />
        </div>

        {/* Quick Landing Page / Demo Mode toggle */}
        <button
          onClick={() => setShowLandingPage(!showLandingPage)}
          className={`w-full py-1.5 px-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            showLandingPage
              ? 'bg-[#B4F04C] text-[#14281D]'
              : 'text-[#7B9585] hover:text-white bg-[#152B1F]/60 hover:bg-[#1C3527]'
          }`}
        >
          <Globe className="w-3 h-3" />
          <span>{showLandingPage ? '← Back to Workspace' : 'Preview Landing Page'}</span>
        </button>
      </div>
    </aside>
  );
};
