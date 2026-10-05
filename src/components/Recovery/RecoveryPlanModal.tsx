import React from 'react';
import {
  X,
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
  BellRing,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RecoveryPlanModal: React.FC = () => {
  const {
    isRecoveryModalOpen,
    setIsRecoveryModalOpen,
    activeRecoveryPlan,
    updateRecoveryStepStatus,
    setIsPracticeModalOpen,
    setPracticeTopic,
    openCoachWithPrompt,
    triggerRecoveryNudge,
    notificationPermission,
    requestBrowserNotifications,
    setIsNotificationCenterOpen,
    currentFocus,
  } = useApp();

  if (!isRecoveryModalOpen) return null;

  const { topic, subject, steps } = activeRecoveryPlan;
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
  const hasMasteryEvidence = currentFocus.topic === topic && currentFocus.status !== 'Not Enough Data';

  const handleLaunchPractice = () => {
    setPracticeTopic(topic);
    setIsRecoveryModalOpen(false);
    setIsPracticeModalOpen(true);
  };

  const handleAskCoachStep = (stepTitle: string) => {
    setIsRecoveryModalOpen(false);
    openCoachWithPrompt(
      `Guide me through step: "${stepTitle}" for my recovery plan in ${topic}.`
    );
  };

  const handleSendNudge = async (stepNum?: number) => {
    if (notificationPermission !== 'granted') {
      await requestBrowserNotifications();
    }
    triggerRecoveryNudge(stepNum);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#254533]/20 overflow-hidden my-6">
        {/* Top Header */}
        <div className="p-6 sm:p-7 border-b border-[#254533] bg-[#14281D] text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-[#B4F04C] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#B4F04C]" /> Personalized Recovery Plan
            </span>
            <button
              onClick={() => setIsRecoveryModalOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#9BB0A3] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
            <div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{topic}</h3>
              <p className="text-xs text-[#9BB0A3] mt-0.5">{subject} Rebound Pathway</p>
            </div>
            <div className="flex items-baseline gap-2 bg-[#1C3527] px-3.5 py-1.5 rounded-xl border border-[#254533]">
              <span className="text-xs text-[#9BB0A3]">Topic mastery:</span>
              <span className="text-lg font-black text-[#B4F04C]">{hasMasteryEvidence ? `${currentFocus.mastery}%` : 'Not Enough Data'}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#9BB0A3]">
              <span>{completedCount} of {steps.length} Steps Completed</span>
              <span className="font-bold text-[#B4F04C]">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[#1C3527] h-2.5 rounded-full overflow-hidden border border-[#254533]">
              <div
                className="h-full bg-[#B4F04C] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Motivational Browser Nudge Action Bar */}
          <div className="mt-4 pt-3 border-t border-[#1C3527] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[#9BB0A3]">
              <BellRing className="w-3.5 h-3.5 text-[#B4F04C]" />
              <span>Motivational Nudges:</span>
              <span className="font-bold text-white">
                {notificationPermission === 'granted' ? 'Active' : 'Ready'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSendNudge()}
                className="px-3 py-1 rounded-lg bg-[#1C3527] hover:bg-[#254533] text-[#B4F04C] font-bold text-[11px] border border-[#254533] flex items-center gap-1 transition-colors cursor-pointer"
                title="Send a gentle browser notification nudge for your next pending step"
              >
                <Bell className="w-3 h-3 text-[#B4F04C]" />
                <span>Nudge Next Step</span>
              </button>
              <button
                onClick={() => setIsNotificationCenterOpen(true)}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#9BB0A3] hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                title="Configure reminder schedule"
              >
                Schedule ⚙️
              </button>
            </div>
          </div>
        </div>

        {/* 4 Interactive Steps */}
        <div className="p-6 sm:p-7 space-y-4 max-h-[60vh] overflow-y-auto">
          {steps.map((step) => {
            const isCompleted = step.status === 'completed';
            const isInProgress = step.status === 'in_progress';

            return (
              <div
                key={step.stepNumber}
                className={`p-5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : isInProgress
                    ? 'bg-[#F4F6F4] border-[#14281D]/30 shadow-xs'
                    : 'bg-gray-50/50 border-gray-200/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? 'bg-[#14281D] text-[#B4F04C]'
                          : isInProgress
                          ? 'bg-[#14281D] text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4 text-[#B4F04C]" /> : step.stepNumber}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-gray-900">{step.title}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isInProgress
                              ? 'bg-[#14281D] text-[#B4F04C]'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {(step.status || 'not_started').replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>

                  {/* Actions per step */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {step.stepNumber === 2 ? (
                      <button
                        onClick={handleLaunchPractice}
                        className="px-3 py-1.5 rounded-lg bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" /> Practice Now
                      </button>
                    ) : step.stepNumber === 4 ? (
                      <button
                        onClick={handleLaunchPractice}
                        className="px-3 py-1.5 rounded-lg bg-[#B4F04C] hover:bg-[#c2f768] text-[#14281D] text-xs font-black flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Zap className="w-3 h-3" /> Mini Quiz
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAskCoachStep(step.title)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-[#14281D]" /> Explain
                      </button>
                    )}

                    {/* Step-level gentle nudge button */}
                    {!isCompleted && (
                      <button
                        onClick={() => handleSendNudge(step.stepNumber)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#F4F6F4] text-gray-500 hover:text-[#14281D] transition-colors cursor-pointer"
                        title="Send a browser notification reminder for this step"
                        aria-label="Send reminder for this step"
                      >
                        <Bell className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Status switcher */}
                    <select
                      value={step.status}
                      onChange={(e) =>
                        updateRecoveryStepStatus(
                          step.stepNumber,
                          e.target.value as 'not_started' | 'in_progress' | 'completed'
                        )
                      }
                      className="text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#14281D]"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <p className="text-xs text-gray-500 font-medium">
            Completing recovery activities dynamically advances your mastery score.
          </p>
          <button
            onClick={() => setIsRecoveryModalOpen(false)}
            className="px-5 py-2.5 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] font-bold text-xs shadow-md cursor-pointer"
          >
            Save Progress
          </button>
        </div>
      </div>
    </div>
  );
};
