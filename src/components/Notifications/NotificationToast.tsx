import React, { useEffect } from 'react';
import { Sparkles, X, ArrowRight, Bell, Target, Play, Bot } from 'lucide-react';
import { MotivationalNudge } from '../../services/notifications';
import { useApp } from '../../context/AppContext';

interface NotificationToastProps {
  nudge: MotivationalNudge | null;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ nudge, onDismiss }) => {
  const {
    setIsRecoveryModalOpen,
    setIsPracticeModalOpen,
    setPracticeTopic,
    openCoachWithPrompt,
  } = useApp();

  useEffect(() => {
    if (!nudge) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 9000);
    return () => clearTimeout(timer);
  }, [nudge, onDismiss]);

  if (!nudge) return null;

  const handleAction = () => {
    onDismiss();
    if (nudge.actionType === 'open_practice') {
      setPracticeTopic(nudge.topic);
      setIsPracticeModalOpen(true);
    } else if (nudge.actionType === 'open_coach') {
      openCoachWithPrompt(
        `Let's work on step ${nudge.stepNumber} of my recovery plan for ${nudge.topic}.`
      );
    } else {
      setIsRecoveryModalOpen(true);
    }
  };

  return (
    <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm w-full animate-bounce-subtle pointer-events-auto">
      <div className="p-4 sm:p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-[#254533]/20 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#B4F04C]" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#14281D] text-[#B4F04C] flex items-center justify-center shrink-0 shadow-xs border border-[#254533]">
              <Bell className="w-4 h-4 text-[#B4F04C] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-black text-[#14281D]">{nudge.title}</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed font-medium">{nudge.body}</p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10px] text-gray-400 font-semibold">{nudge.timestamp}</span>

          <button
            onClick={handleAction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] font-black text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            {nudge.actionType === 'open_practice' ? (
              <Play className="w-3 h-3 fill-current text-[#B4F04C]" />
            ) : nudge.actionType === 'open_coach' ? (
              <Bot className="w-3 h-3" />
            ) : (
              <Target className="w-3 h-3" />
            )}
            <span>{nudge.actionText || 'Take Action'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
