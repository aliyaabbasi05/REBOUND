import React from 'react';
import {
  Target,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  Sparkles,
  BookOpen,
  RotateCcw,
  Zap,
  Bell,
  Bot,
  Flame,
  Check,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RecoveryStep } from '../../types';

export const RecoveryPlanView: React.FC = () => {
  const {
    activeRecoveryPlan,
    updateRecoveryStepStatus,
    setIsPracticeModalOpen,
    setPracticeTopic,
    openCoachWithPrompt,
    triggerRecoveryNudge,
    notificationPermission,
    requestBrowserNotifications,
    currentFocus,
    setCurrentTab,
    setIsAnalyzeModalOpen,
  } = useApp();

  const { topic = '', subject = '', steps = [] } = activeRecoveryPlan || {};
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
  const hasMasteryEvidence = currentFocus.topic === topic && currentFocus.status !== 'Not Enough Data';

  if (!steps || steps.length === 0) {
    return (
      <div className="p-8 sm:p-12 bg-white rounded-3xl border border-[#254533]/20 text-center space-y-4 shadow-sm animate-fade-in my-6">
        <div className="w-16 h-16 rounded-3xl bg-[#14281D] text-[#B4F04C] flex items-center justify-center mx-auto shadow-md">
          <Target className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-[#14281D]">
            No Recovery Plan Saved Yet
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto mt-1 leading-relaxed">
            Recovery plans are created from a real assessment analysis. Add an assessment and confirmed course map to generate a topic-linked plan.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setCurrentTab('profile')}
            className="px-5 py-2.5 rounded-2xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] text-xs sm:text-sm font-extrabold shadow-md transition-all cursor-pointer"
          >
            + Set Up a Curriculum
          </button>
          <button
            onClick={() => setIsAnalyzeModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-[#B4F04C] hover:bg-[#c2f768] text-[#14281D] text-xs sm:text-sm font-black shadow-md transition-all cursor-pointer"
          >
            + Analyze New Test Paper
          </button>
        </div>
      </div>
    );
  }

  const handleLaunchPractice = () => {
    setPracticeTopic(topic);
    setIsPracticeModalOpen(true);
  };

  const handleAskCoachStep = (stepTitle: string) => {
    openCoachWithPrompt(
      `Guide me through recovery step: "${stepTitle}" for ${topic} in ${subject}. Explain the core intuition first.`
    );
  };

  const handleSendNudge = async (stepNum?: number) => {
    if (notificationPermission !== 'granted') {
      await requestBrowserNotifications();
    }
    triggerRecoveryNudge(stepNum);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* 1. HERO SPRINT BANNER */}
      <div className="bg-[#14281D] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden border border-[#254533] shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#B4F04C]/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B4F04C] animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-[#B4F04C]">
                Active Recovery Sprint
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1C3527] text-[#9BB0A3] border border-[#254533]">
                {subject} Comeback
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-[#1C3527] border border-[#254533] text-xs font-bold text-[#B4F04C] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-[#B4F04C] text-[#B4F04C]" />
                {steps.length ? `Step ${Math.min(completedCount + 1, steps.length)} of ${steps.length}` : 'Not Enough Data'}
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {subject} Comeback Sprint
              </h2>
              <p className="text-sm text-[#9BB0A3] font-medium mt-1">
                Target topic: <span className="text-white font-bold">{topic}</span> • Current topic mastery:{' '}
                <span className="text-amber-300 font-bold">{hasMasteryEvidence ? `${currentFocus.mastery}%` : 'Not Enough Data'}</span>
              </p>
            </div>

            {/* Mastery gap badge */}
            <div className="flex items-center gap-3 bg-[#1C3527]/90 px-4 py-3 rounded-2xl border border-[#254533] shrink-0">
              <div className="text-left">
                <span className="text-[10px] text-[#9BB0A3] font-bold uppercase block">Current topic mastery</span>
                <span className="text-xl font-black text-amber-300">{hasMasteryEvidence ? `${currentFocus.mastery}%` : 'Not Enough Data'}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9BB0A3]" />
              <div className="text-left">
                <span className="text-[10px] text-[#9BB0A3] font-bold uppercase block">Next evidence</span>
                <span className="text-sm font-black text-[#B4F04C]">New assessment</span>
              </div>
            </div>
          </div>

          {/* Progress Bar & Sprint Steps count */}
          <div className="space-y-2 bg-[#1C3527]/70 p-4 rounded-2xl border border-[#254533]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#9BB0A3] font-semibold">
                Sprint Progress:{' '}
                <span className="text-white font-bold">
                  {completedCount} of {steps.length} Steps Finished
                </span>
              </span>
              <span className="font-extrabold text-[#B4F04C]">{progressPercent}% Completed</span>
            </div>
            <div className="w-full bg-[#152B1F] h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-[#B4F04C] rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={handleLaunchPractice}
              className="px-5 py-2.5 rounded-xl bg-[#B4F04C] hover:bg-[#c2f768] text-[#14281D] font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-transform active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch 5-Question Drill</span>
            </button>

            <button
              onClick={() => openCoachWithPrompt('Help me decide how to begin my current recovery plan. Explain the first step in plain language.')}
              className="px-4 py-2.5 rounded-xl bg-[#1C3527] hover:bg-[#254533] text-white font-bold text-xs sm:text-sm border border-[#254533] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Bot className="w-4 h-4 text-[#B4F04C]" />
              <span>Consult AI Recovery Coach</span>
            </button>

            <button
              onClick={() => handleSendNudge()}
              className="px-4 py-2.5 rounded-xl bg-[#1C3527] hover:bg-[#254533] text-[#9BB0A3] hover:text-white font-semibold text-xs border border-[#254533] flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Remind Me Later</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SPRINT TIMELINE STEPS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EAE4] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xl font-black text-[#14281D] tracking-tight">
              Sprint Action Items
            </h3>
            <p className="text-xs text-gray-500">
              Check off tasks as you complete them. Your daily study goal tracks your progress automatically.
            </p>
          </div>
          <span className="text-xs font-bold text-[#14281D] bg-[#F4F6F4] px-3 py-1 rounded-xl border border-[#254533]/20 self-start sm:self-auto">
              {steps.length}-step recovery plan
          </span>
        </div>

        <div className="space-y-4">
          {steps.map((stepItem) => {
            const isCompleted = stepItem.status === 'completed';
            const isInProgress = stepItem.status === 'in_progress';

            return (
              <div
                key={stepItem.stepNumber}
                className={`p-5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200/80 shadow-2xs'
                    : isInProgress
                    ? 'bg-[#F4F6F4] border-[#254533]/20 shadow-xs'
                    : 'bg-white border-gray-200/80 hover:border-[#14281D]/30 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Step Interactive Checkbox */}
                  <button
                    onClick={() => {
                      const nextStatus = isCompleted
                        ? 'not_started'
                        : isInProgress
                        ? 'completed'
                        : 'in_progress';
                      updateRecoveryStepStatus(stepItem.stepNumber, nextStatus);
                    }}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : isInProgress
                        ? 'bg-[#14281D] text-[#B4F04C] ring-2 ring-[#B4F04C]/50'
                        : 'border-2 border-gray-300 hover:border-[#14281D] bg-white'
                    }`}
                    title="Click to toggle status"
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isInProgress ? (
                      <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <span className="text-[11px] font-bold text-gray-400">
                        {stepItem.stepNumber}
                      </span>
                    )}
                  </button>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#14281D] bg-[#E8EFEA] px-2.5 py-0.5 rounded-lg border border-[#254533]/20">
                          Step {stepItem.stepNumber}
                        </span>
                        <h4
                          className={`text-base font-extrabold ${
                            isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}
                        >
                          {stepItem.title}
                        </h4>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        )}
                        {isInProgress && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#14281D] text-[#B4F04C] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#B4F04C]" /> In Progress
                          </span>
                        )}
                        {!isCompleted && !isInProgress && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                            Upcoming
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
                      {stepItem.detail}
                    </p>

                    {/* Step Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleAskCoachStep(stepItem.title)}
                        className="px-3 py-1.5 rounded-xl bg-[#F4F6F4] hover:bg-[#E8EFEA] text-[#14281D] border border-[#254533]/20 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Bot className="w-3.5 h-3.5 text-[#14281D]" />
                        <span>Ask AI Coach</span>
                      </button>

                      <button
                        onClick={handleLaunchPractice}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current text-emerald-700" />
                        <span>Interactive Practice</span>
                      </button>

                      <button
                        onClick={() => handleSendNudge(stepItem.stepNumber)}
                        className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer ml-auto"
                        title="Set gentle notification nudge"
                      >
                        <Bell className="w-3 h-3 text-amber-500" />
                        <span>Remind</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Practice check */}
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Focused Practice Check</span>
          </div>
          <h4 className="text-xl font-black text-gray-900">
            Ready to practice {topic}?
          </h4>
          <p className="text-xs text-gray-600 max-w-xl">
            These five practice questions are a learning activity, not a retest. Practice results are tracked separately and do not automatically change mastery; use a new assessment or repeated practice to build evidence.
          </p>
        </div>

        <button
          onClick={handleLaunchPractice}
          className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start 5-question practice</span>
        </button>
      </div>
    </div>
  );
};
