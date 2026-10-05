import React, { useState } from 'react';
import {
  Target,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  SlidersHorizontal,
  Plus,
  Play,
  ArrowRight,
  BookOpen,
  Bell,
  HelpCircle,
  Trophy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EditDailyGoalModal } from './EditDailyGoalModal';

export const DailyStudyGoalCard: React.FC = () => {
  const {
    dailyGoal,
    logDailyStudyMinutes,
    toggleRecoveryStepCompletion,
    activeRecoveryPlan,
    setIsRecoveryModalOpen,
    setIsAnalyzeModalOpen,
    setIsPracticeModalOpen,
    setPracticeTopic,
    openCoachWithPrompt,
    triggerRecoveryNudge,
    profile,
  } = useApp();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [justLoggedMins, setJustLoggedMins] = useState<number | null>(null);

  const totalSteps = activeRecoveryPlan.steps.length;
  const completedTasksCount = activeRecoveryPlan.steps.filter((s) => s.status === 'completed').length;
  const completedTodayCount = dailyGoal.completedStepNumbers.filter((stepNumber) => activeRecoveryPlan.steps.some((step) => step.stepNumber === stepNumber && step.status === 'completed')).length;
  const taskGoalPercent = dailyGoal.targetTasks > 0 ? Math.min(100, Math.round((completedTodayCount / dailyGoal.targetTasks) * 100)) : 0;
  const timeGoalPercent = dailyGoal.targetMinutes > 0 ? Math.min(100, Math.round((dailyGoal.completedMinutes / dailyGoal.targetMinutes) * 100)) : 0;

  const isGoalAchieved = dailyGoal.targetTasks > 0 && completedTodayCount >= dailyGoal.targetTasks;

  const handleQuickLogTime = (mins: number) => {
    logDailyStudyMinutes(mins);
    setJustLoggedMins(mins);
    setTimeout(() => setJustLoggedMins(null), 2000);
  };

  const handleStartPracticeStep = (stepNumber: number) => {
    setPracticeTopic(activeRecoveryPlan.topic);
    setIsPracticeModalOpen(true);
  };

  const handleAskCoachForStep = (stepTitle: string) => {
    openCoachWithPrompt(
      `Help me work through recovery task: "${stepTitle}" for my weak areas in ${activeRecoveryPlan.topic}.`
    );
  };

  return (
    <>
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E2EAE4] shadow-xs relative overflow-hidden transition-all">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#B4F04C]/5 rounded-full blur-3xl pointer-events-none -mt-20" />

        {/* 1. Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#14281D] text-[#B4F04C] flex items-center justify-center shadow-xs">
              <Target className="w-5 h-5 stroke-[2.75]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-[#14281D] tracking-tight">
                  Daily Study Goal
                </h3>
                  {isGoalAchieved ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#14281D] text-[#B4F04C] flex items-center gap-1 shadow-2xs">
                    <Trophy className="w-3 h-3 text-[#B4F04C]" /> Goal Met!
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F4F6F4] text-[#14281D] border border-[#E2EAE4]">
                    {activeRecoveryPlan.steps.length > 0 ? 'Active Recovery' : 'No recovery plan'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#557361] font-medium">
                {activeRecoveryPlan.topic ? <>Targeting <span className="font-bold text-[#14281D]">{activeRecoveryPlan.topic}</span> ({activeRecoveryPlan.subject})</> : 'Analyze an assessment to create a topic-linked recovery plan.'}
              </p>
            </div>
          </div>

            <div className="flex items-center gap-2 sm:self-center">
            {/* Streak indicator */}
            {profile.streakDays > 0 && <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F6F4] border border-[#E2EAE4] text-[#14281D] text-xs font-extrabold shadow-2xs">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{profile.streakDays}-Day Streak</span>
            </div>}

            {/* Edit Goal Button */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F6F4] hover:bg-[#E8EFEA] border border-[#E2EAE4] text-[#14281D] text-xs font-bold transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Edit Goal</span>
            </button>
          </div>
        </div>

        {/* 2. Goal Intention Note (if set) */}
        {dailyGoal.customNote && (
          <div className="mb-5 px-4 py-2.5 rounded-2xl bg-[#F4F6F4] border border-[#E2EAE4] flex items-center gap-2 text-xs text-[#14281D] font-medium">
            <Sparkles className="w-4 h-4 text-[#B4F04C] shrink-0 fill-[#14281D]" />
            <span className="text-[#14281D] font-black shrink-0">Today's Focus:</span>
            <span className="italic truncate">{dailyGoal.customNote}</span>
          </div>
        )}

        {/* 3. Progress Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative z-10">
          {/* A. Task Completion Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F4F6F4] border border-[#E2EAE4] shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-[#557361] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#14281D]" />
                Recovery Tasks
              </span>
              <span className="text-xs font-extrabold text-[#14281D]">
                {dailyGoal.targetTasks > 0 ? `${taskGoalPercent}%` : 'No target set'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black text-[#14281D] tracking-tight">
                {completedTodayCount}
              </span>
              <span className="text-sm font-bold text-gray-400">
                {dailyGoal.targetTasks > 0 ? `/ ${dailyGoal.targetTasks} tasks completed today` : 'tasks completed today'}
              </span>
            </div>

            {/* Task Progress Bar */}
            <div className="w-full bg-[#E2EAE4] h-2.5 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#14281D] to-[#B4F04C]"
                style={{ width: `${taskGoalPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-[#557361] font-medium">
              {isGoalAchieved
                ? 'Target reached. Task completion is tracked separately from academic mastery.'
                : dailyGoal.targetTasks > 0 ? `${Math.max(0, dailyGoal.targetTasks - completedTodayCount)} more recovery task${dailyGoal.targetTasks - completedTodayCount === 1 ? '' : 's'} to hit today\'s target.` : 'Set a daily task target to track this goal.'}
            </p>
          </div>

          {/* B. Focus Time Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F4F6F4] border border-[#E2EAE4] shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-[#557361] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#14281D]" />
                  Focus Study Time
                </span>
                <span className="text-xs font-extrabold text-[#14281D]">
                  {dailyGoal.targetMinutes > 0 ? `${timeGoalPercent}%` : 'No target set'}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-black text-[#14281D] tracking-tight">
                  {dailyGoal.completedMinutes}
                </span>
                <span className="text-sm font-bold text-gray-400">
                  {dailyGoal.targetMinutes > 0 ? `/ ${dailyGoal.targetMinutes} mins` : 'minutes logged · set a target to track'}
                </span>
                {justLoggedMins && (
                  <span className="ml-1 text-xs font-black text-[#14281D] animate-bounce">
                    +{justLoggedMins}m!
                  </span>
                )}
              </div>

              {/* Time Progress Bar */}
              <div className="w-full bg-[#E2EAE4] h-2.5 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-[#B4F04C]"
                  style={{ width: `${timeGoalPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Log Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-extrabold text-[#557361]">Quick Log:</span>
              <button
                onClick={() => handleQuickLogTime(10)}
                className="px-2.5 py-1 rounded-lg bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] text-[11px] font-black border border-[#254533] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> 10m
              </button>
              <button
                onClick={() => handleQuickLogTime(15)}
                className="px-2.5 py-1 rounded-lg bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] text-[11px] font-black border border-[#254533] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> 15m
              </button>
              <button
                onClick={() => handleQuickLogTime(25)}
                className="px-2.5 py-1 rounded-lg bg-[#B4F04C] hover:bg-[#c2f768] text-[#14281D] text-[11px] font-black shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 stroke-[2.75]" /> 25m Focus
              </button>
            </div>
          </div>
        </div>

        {/* 4. Celebratory Goal Met Banner */}
        {isGoalAchieved && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <p className="font-extrabold text-sm sm:text-base">
                  Daily Recovery Goal Achieved! 🎉
                </p>
                <p className="text-emerald-100 text-xs">
                  Your activity goal is recorded. Recovery completion does not itself increase academic mastery.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsRecoveryModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition-colors shadow-2xs whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              View Full Plan →
            </button>
          </div>
        )}

        {/* 5. Interactive Recovery Tasks Checklist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                Recovery Plan Tasks
              </h4>
              <span className="text-xs text-gray-400 font-medium">
                ({completedTasksCount} of {totalSteps} done)
              </span>
            </div>
            <button
              onClick={() => setIsRecoveryModalOpen(true)}
              className="text-xs font-bold text-[#14281D] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open Plan Details</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {activeRecoveryPlan.steps.length === 0 ? (
            <div className="p-5 rounded-2xl bg-[#F4F6F4] border border-dashed border-[#254533]/30 text-center">
              <p className="text-sm font-bold text-[#14281D]">No recovery plan yet</p>
              <p className="text-xs text-gray-500 mt-1">Analyze a real assessment to create a topic-linked plan.</p>
              <button onClick={() => setIsAnalyzeModalOpen(true)} className="mt-3 px-4 py-2 rounded-xl bg-[#14281D] text-[#B4F04C] text-xs font-bold">Analyze an assessment</button>
            </div>
          ) : <div className="space-y-2.5">
            {activeRecoveryPlan.steps.map((step) => {
              const isCompleted = step.status === 'completed';
              const isInProgress = step.status === 'in_progress';

              return (
                <div
                  key={step.stepNumber}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-emerald-50/40 border-emerald-200/80 shadow-2xs'
                      : isInProgress
                      ? 'bg-[#F4F6F4] border-[#254533]/20 shadow-xs'
                      : 'bg-white hover:bg-gray-50/80 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {/* Left: Checkbox + Step info */}
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleRecoveryStepCompletion(step.stepNumber)}
                      className={`w-6 h-6 rounded-lg mt-0.5 flex items-center justify-center transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'border-2 border-gray-300 hover:border-[#14281D] bg-white'
                      }`}
                      title={isCompleted ? 'Mark incomplete' : 'Mark task completed'}
                    >
                      {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isInProgress
                              ? 'bg-[#14281D] text-[#B4F04C]'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Step {step.stepNumber}
                        </span>

                        <span
                          className={`text-sm font-bold ${
                            isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}
                        >
                          {step.title}
                        </span>

                        {isCompleted && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            Completed ✓
                          </span>
                        )}
                        {isInProgress && (
                          <span className="text-[11px] font-bold text-[#14281D] bg-[#E8EFEA] px-2 py-0.5 rounded-full border border-[#254533]/20">
                            In Progress
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 leading-relaxed font-medium">
                        {step.detail}
                      </p>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {step.stepNumber === 2 || step.stepNumber === 4 ? (
                      <button
                        onClick={() => handleStartPracticeStep(step.stepNumber)}
                        className="px-3 py-1.5 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] text-xs font-black flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current text-[#B4F04C]" />
                        <span>Practice</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAskCoachForStep(step.title)}
                        className="px-3 py-1.5 rounded-xl bg-[#F4F6F4] hover:bg-[#E8EFEA] text-[#14281D] text-xs font-bold flex items-center gap-1.5 border border-[#E2EAE4] transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-[#14281D]" />
                        <span>Ask Coach</span>
                      </button>
                    )}

                    {/* Quick Nudge button */}
                    <button
                      onClick={() => triggerRecoveryNudge(step.stepNumber)}
                      className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-[#14281D] transition-colors cursor-pointer"
                      title="Send me a motivational nudge for this task"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>}
        </div>

        {/* 6. Footer encouragement */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#557361]">
          <span className="font-medium">
            Recovery completion tracks consistency; academic mastery changes only after practice or assessment evidence.
          </span>
          <button
            onClick={() => setIsRecoveryModalOpen(true)}
            className="text-xs font-bold text-[#14281D] hover:underline underline-offset-4 self-start sm:self-auto cursor-pointer"
          >
            Review {activeRecoveryPlan.topic} Recovery Plan →
          </button>
        </div>
      </div>

      {/* Edit Daily Goal Modal */}
      {isEditModalOpen && (
        <EditDailyGoalModal onClose={() => setIsEditModalOpen(false)} />
      )}
    </>
  );
};
