import React from 'react';
import {
  TrendingUp,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Atom,
  FlaskConical,
  Dna,
  Sigma,
  Zap,
  Target,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TopicRecord, SubjectRecord } from '../../types';
import { DailyStudyGoalCard } from './DailyStudyGoalCard';

export const HomeDashboard: React.FC = () => {
  const {
    profile,
    overallMastery,
    overallImprovement,
    encouragingMessage,
    currentFocus,
    subjects,
    testHistory,
    latestTest,
    setSelectedTestId,
    setCurrentTab,
    setIsRecoveryModalOpen,
    setIsPracticeModalOpen,
    setPracticeTopic,
    setSelectedTopic,
    setSelectedSubject,
    openCoachWithPrompt,
    setIsAnalyzeModalOpen,
  } = useApp();

  const getSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Atom':
        return <Atom className="w-5 h-5 text-[#14281D]" />;
      case 'FlaskConical':
        return <FlaskConical className="w-5 h-5 text-emerald-700" />;
      case 'Dna':
        return <Dna className="w-5 h-5 text-teal-700" />;
      case 'Sigma':
        return <Sigma className="w-5 h-5 text-[#14281D]" />;
      default:
        return <BookOpen className="w-5 h-5 text-[#14281D]" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Strong':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Strong
          </span>
        );
      case 'Developing':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
            Developing
          </span>
        );
      case 'Needs Practice':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Needs Practice
          </span>
        );
      case 'Needs Attention':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Needs Attention
          </span>
        );
      case 'Improving':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-100">Improving</span>;
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Not Enough Data
          </span>
        );
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const hasSufficientMastery = subjects.some((subject) =>
    subject.topics.some((topic) => topic.mastery !== null && topic.status !== 'Not Enough Data')
  );
  const comparableAssessmentCount = latestTest
    ? testHistory.filter((test) => test.subject.trim().toLowerCase() === latestTest.subject.trim().toLowerCase()).length
    : 0;
  const weekDays = (() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return { label: date.toLocaleDateString(undefined, { weekday: 'narrow' }), key };
    });
  })();
  const completedActivityDays = new Set(profile.streakDaysCompleted.filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)));

  const StreakTracker = () => (
    <div className="flex items-center gap-3 p-3 bg-white border border-[#E2EAE4] rounded-2xl shadow-xs self-start">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF6EE] border border-[#E2EAE4] text-amber-600">
          <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
          <span className="font-black text-[#14281D]">{profile.streakDays} Day Streak</span>
        </div>
        <div className="flex items-center gap-1.5">
          {weekDays.map(({ label, key }) => {
            const isCompleted = completedActivityDays.has(key);
            return (
              <div key={key} aria-label={`${label}: ${isCompleted ? 'activity recorded' : 'no activity recorded'}`} className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${isCompleted ? 'bg-[#14281D] text-[#B4F04C]' : 'bg-gray-100 text-gray-400'}`}>
                {label}
              </div>
            );
          })}
        </div>
    </div>
  );

  const handleStartRecovery = () => {
    setIsRecoveryModalOpen(true);
  };

  const handleStartPractice = () => {
    setPracticeTopic(currentFocus.topic);
    setIsPracticeModalOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* 1. Header Greeting & Encouraging Message */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#14281D]">
            {getGreeting()}, {profile.name || 'there'}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#B4F04C] border border-[#14281D] animate-ping" />
            <p className="text-sm font-bold text-[#14281D]">
              {encouragingMessage}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StreakTracker />
          {(profile.school || profile.grade) && <span className="px-3 py-1.5 rounded-xl bg-white border border-[#E2EAE4] text-xs font-bold text-[#14281D] shadow-2xs">
            {[profile.school, profile.grade].filter(Boolean).join(' • ')}
          </span>}
        </div>
      </div>

      {/* 2. Top Metric Cards Grid: Overall Progress + Current Focus */}
      {subjects.length === 0 && !latestTest ? (
        <div className="p-8 sm:p-10 bg-white rounded-3xl border border-[#254533]/20 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-[#14281D] text-[#B4F04C] flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#14281D]">
              No Syllabus or Assessment Data Given Yet
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto mt-1 leading-relaxed">
              REBOUND generates analysis strictly from your uploaded syllabus PDF or test papers. Upload your syllabus or analyze a test to see your performance metrics!
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setCurrentTab('profile')}
              className="px-5 py-2.5 rounded-2xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] text-xs sm:text-sm font-extrabold shadow-md transition-all cursor-pointer"
            >
              + Upload Syllabus or Book PDF
            </button>
            <button
              onClick={() => setIsAnalyzeModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-[#B4F04C] hover:bg-[#c2f768] text-[#14281D] text-xs sm:text-sm font-black shadow-md transition-all cursor-pointer"
            >
              + Analyze New Test Paper
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* OVERALL PROGRESS CARD (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-[#E2EAE4] shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#B4F04C]/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                Overall Progress
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#14281D] text-[#B4F04C] text-xs font-extrabold">
                <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                {comparableAssessmentCount >= 2 && overallImprovement !== null ? `${overallImprovement >= 0 ? '↑ +' : '↓ '}${overallImprovement}% same-subject change` : 'Not Enough Data'}
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-5xl font-black text-[#14281D] tracking-tight">
                {hasSufficientMastery && overallMastery !== null ? `${overallMastery}%` : 'Not Enough Data'}
              </span>
              <span className="text-sm font-bold text-gray-400">mastery aggregate</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#E2EAE4] h-3 rounded-full overflow-hidden mb-4 p-0.5">
              <div
                className="bg-gradient-to-r from-[#14281D] via-[#1C3527] to-[#B4F04C] h-full rounded-full transition-all duration-1000"
                style={{ width: `${hasSufficientMastery ? overallMastery ?? 0 : 0}%` }}
              />
            </div>

            <p className="text-xs text-[#557361] leading-relaxed font-medium">
              Calculated only from recorded assessment evidence. Untested areas remain Not Enough Data.
            </p>
          </div>

          <div className="pt-5 mt-5 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentTab('analytics')}
              className="text-xs font-extrabold text-[#14281D] hover:text-[#254533] flex items-center gap-1 group cursor-pointer"
            >
              <span>Explore Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
            <span className="text-[11px] text-gray-400">{latestTest ? `Updated ${new Date(latestTest.date).toLocaleDateString()}` : 'Awaiting assessment evidence'}</span>
          </div>
        </div>

        {/* CURRENT FOCUS CARD (7 cols) - Styled with Sidebar's dark forest green palette */}
        <div className="lg:col-span-7 bg-[#14281D] rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-[#254533] relative overflow-hidden flex flex-col justify-between">
          {/* Background decorative glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#B4F04C]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B4F04C] animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-[#B4F04C]">
                  Current Focus
                </span>
              </div>
              {getStatusBadge(currentFocus.status)}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-2">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentFocus.topic || 'Not Enough Data'}
              </h3>
              <div className="flex items-center gap-2">
                {currentFocus.status !== 'Not Enough Data' && <span className="text-xl font-bold text-amber-300">{currentFocus.mastery}% mastery</span>}
                {currentFocus.subject && <span className="text-xs text-[#9BB0A3]">• {currentFocus.subject}</span>}
              </div>
            </div>

            <p className="text-sm text-[#9BB0A3] font-medium mb-6">
              &ldquo;{currentFocus.reason}&rdquo;
            </p>

            {/* Quick Diagnostic Insights Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6 text-xs">
              <div className="p-3 rounded-2xl bg-[#1C3527] border border-[#254533]">
                <span className="text-amber-300 font-bold block mb-0.5">Top Pitfall:</span>
                <p className="text-white/80 text-[11px] leading-snug">
                  {latestTest?.questions?.find((q) => q.mistakeType !== 'correct')?.diagnosis || 'Not Enough Data'}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[#1C3527] border border-[#254533]">
                <span className="text-[#B4F04C] font-bold block mb-0.5">Rebound Potential:</span>
                <p className="text-white/80 text-[11px] leading-snug">
                  {latestTest?.nextTarget?.opportunityMarks ? `${latestTest.nextTarget.opportunityMarks} marks identified in the assessment.` : 'Not Enough Data'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#254533] flex flex-wrap items-center gap-3">
            <button
              onClick={handleStartRecovery}
              className="px-4 py-2.5 rounded-xl bg-[#B4F04C] hover:bg-[#c2f768] text-[#14281D] font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Target className="w-4 h-4 stroke-[2.5]" />
              <span>Start Recovery Plan</span>
            </button>
            <button
              onClick={handleStartPractice}
              className="px-4 py-2.5 rounded-xl bg-[#1C3527] hover:bg-[#254533] text-white font-bold text-xs sm:text-sm border border-[#254533] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[#B4F04C]" />
              <span>Practice 5 Questions</span>
            </button>
            <button
              onClick={() => openCoachWithPrompt(`Explain why I lost marks in ${currentFocus.topic}`)}
              className="text-xs text-[#B4F04C] hover:underline font-bold ml-auto cursor-pointer"
            >
              Ask AI Coach →
            </button>
          </div>
        </div>
      </div>
      )}

      {/* 2.5 DAILY STUDY GOAL & RECOVERY TASK TRACKER */}
      <DailyStudyGoalCard />

      {/* 3. YOUR SUBJECTS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Your Subjects</h3>
            <p className="text-xs text-gray-500">
              Click any subject to view chapter & topic mastery breakdowns
            </p>
          </div>
          <button
            onClick={() => setCurrentTab('subjects')}
            className="text-xs font-black text-[#14281D] hover:underline cursor-pointer"
          >
            View Matrix →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjects.map((sub) => {
            return (
              <div
                key={sub.name}
                onClick={() => setSelectedSubject(sub)}
                className="bg-white rounded-3xl p-5 border border-[#E2EAE4] hover:border-[#14281D] shadow-2xs hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F4F6F4] flex items-center justify-center group-hover:scale-105 transition-transform text-[#14281D]">
                    {getSubjectIcon(sub.iconName)}
                  </div>
                  {sub.mastery !== null ? (
                    getStatusBadge(sub.status)
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">
                      Not Enough Data
                    </span>
                  )}
                </div>

                <h4 className="text-base font-black text-[#14281D] mb-1">{sub.name}</h4>

                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-black text-[#14281D]">
                    {sub.mastery !== null ? `${sub.mastery}%` : '—'}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {sub.topics.length} topics mapped
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#E2EAE4] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      (sub.mastery || 0) >= 75
                        ? 'bg-[#B4F04C]'
                        : (sub.mastery || 0) >= 60
                        ? 'bg-[#14281D]'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${sub.mastery || 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. DUAL COLUMN: LATEST TEST & YOUR WINS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LATEST TEST (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#E2EAE4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                Latest Test
              </span>
              <span className="text-xs text-gray-400 font-medium">
                {latestTest?.date ? new Date(latestTest.date).toLocaleDateString() : 'Not Enough Data'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#F4F6F4] text-[#14281D] border border-[#E2EAE4] mb-1 inline-block">
                  {latestTest?.subject || 'No assessment'}
                </span>
                <h4 className="text-xl font-black text-[#14281D]">
                  {latestTest?.title || 'Your progress story starts here.'}
                </h4>
              </div>

              <div className="flex items-baseline gap-2 bg-[#14281D] px-4 py-2.5 rounded-2xl border border-[#254533] text-white">
                <span className="text-3xl font-black text-[#B4F04C]">
                  {latestTest ? latestTest.score : '—'}
                </span>
                <span className="text-sm font-bold text-[#9BB0A3]">
                  / {latestTest ? latestTest.totalMarks : '—'}
                </span>
                <span className="ml-2 px-2 py-0.5 rounded-md bg-[#B4F04C] text-[#14281D] font-black text-xs">
                  {latestTest ? `${latestTest.percentage}%` : 'Not Enough Data'}
                </span>
              </div>
            </div>

            {/* Quick mistake summary pills */}
            <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100">
                <span className="text-base font-black text-rose-700">
                  {latestTest ? latestTest.mistakeSummary.conceptMistakes : '—'}
                </span>
                <p className="text-[11px] font-bold text-rose-800 leading-none mt-1">
                  Concept
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100">
                <span className="text-base font-black text-amber-700">
                  {latestTest ? latestTest.mistakeSummary.carelessMistakes : '—'}
                </span>
                <p className="text-[11px] font-bold text-amber-800 leading-none mt-1">
                  Careless
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[#F4F6F4] border border-[#E2EAE4]">
                <span className="text-base font-black text-[#14281D]">
                  {latestTest ? latestTest.mistakeSummary.questionUnderstandingMistakes : '—'}
                </span>
                <p className="text-[11px] font-bold text-[#14281D] leading-none mt-1">
                  Question
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-[#557361] font-medium">
              {latestTest ? (latestTest.nextTarget.recoveryPlan.length ? 'Diagnosis complete with a recorded recovery plan' : 'Diagnosis recorded; recovery plan not available') : 'Not Enough Data'}
            </span>
            <button
              onClick={() => {
                if (latestTest) {
                  setSelectedTestId(latestTest.id);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] font-extrabold text-xs shadow-xs transition-all cursor-pointer"
            >
              <span>View Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* YOUR WINS (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#14281D] via-[#162F22] to-[#14281D] rounded-3xl p-6 sm:p-7 border border-[#254533] shadow-lg text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-[#B4F04C] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B4F04C]" /> Evidence Recorded
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1C3527] text-[#B4F04C] border border-[#254533]">
                Assessment history
              </span>
            </div>

            {latestTest && latestTest.percentage !== undefined ? (
              <div className="p-4 rounded-2xl bg-[#1C3527] border border-[#254533] shadow-xs mb-4">
                <div className="flex items-center justify-between mb-2"><h4 className="text-base font-black text-white">Latest recorded assessment</h4><span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#B4F04C] text-[#14281D]">{latestTest.percentage}%</span></div>
                <p className="text-xs text-[#9BB0A3] leading-snug">{latestTest.title} · {latestTest.subject}. Progress comparisons appear after at least two recorded assessments.</p>
              </div>
            ) : <div className="p-4 rounded-2xl bg-[#1C3527] border border-[#254533] mb-4 text-xs text-[#9BB0A3]">Not Enough Data yet. Add an assessment or complete targeted practice to begin building evidence.</div>}
            {latestTest && latestTest.nextTarget.recoveryPlan.length > 0 && <div className="p-3 rounded-2xl bg-[#1C3527] border border-[#254533] flex items-center justify-between"><div><p className="text-xs font-bold text-white">Recovery plan recorded</p><p className="text-[11px] text-[#9BB0A3]">Completion is tracked separately from mastery.</p></div><span className="text-xs font-extrabold text-[#B4F04C]">{latestTest.nextTarget.recoveryPlan.length} steps</span></div>}
          </div>

          <div className="pt-4 mt-4 border-t border-[#254533]">
            <p className="text-xs text-[#9BB0A3] font-semibold italic text-center">
              &ldquo;Your score is a snapshot. Your progress is the story.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
