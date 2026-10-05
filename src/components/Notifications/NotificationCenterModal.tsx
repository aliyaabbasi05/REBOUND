import React from 'react';
import {
  X,
  Bell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  Clock,
  Target,
  Send,
  Volume2,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    notificationPermission,
    requestBrowserNotifications,
    triggerRecoveryNudge,
    notificationsEnabled,
    setNotificationsEnabled,
    nudgeIntervalMinutes,
    setNudgeIntervalMinutes,
    activeRecoveryPlan,
    nudgeHistory,
    setIsRecoveryModalOpen,
  } = useApp();

  if (!isOpen) return null;

  const pendingSteps = activeRecoveryPlan.steps.filter((s) => s.status !== 'completed');

  const handleTestNudge = async () => {
    if (notificationPermission !== 'granted') {
      await requestBrowserNotifications();
    }
    triggerRecoveryNudge();
  };

  const handleNudgeStep = async (stepNum: number) => {
    if (notificationPermission !== 'granted') {
      await requestBrowserNotifications();
    }
    triggerRecoveryNudge(stepNum);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#254533]/20 overflow-hidden my-6">
        {/* Top Header */}
        <div className="p-6 border-b border-[#254533] bg-[#14281D] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C3527] text-[#B4F04C] flex items-center justify-center border border-[#254533] shadow-md">
              <Bell className="w-5 h-5 text-[#B4F04C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Recovery Nudges</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1C3527] text-[#B4F04C] border border-[#254533]">
                  Browser Notification API
                </span>
              </div>
              <p className="text-xs text-[#9BB0A3] mt-0.5">
                Gentle, motivational reminders for your pending recovery steps
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#9BB0A3] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* 1. Browser Notification API Permission Banner */}
          <div className="p-4 rounded-2xl border transition-all bg-[#F4F6F4] border-[#254533]/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-[#14281D]" />
                  <span className="text-xs font-bold text-gray-900">
                    System Browser Permission:
                  </span>
                  {notificationPermission === 'granted' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Enabled
                    </span>
                  ) : notificationPermission === 'denied' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Blocked in Browser
                    </span>
                  ) : notificationPermission === 'unsupported' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      In-App Mode Only
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#14281D] text-[#B4F04C]">
                      Not Requested Yet
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {notificationPermission === 'granted'
                    ? 'Browser notifications are allowed. Automatic reminders run while REBOUND remains open in a browser tab; this build does not use a background push service.'
                    : notificationPermission === 'denied'
                    ? 'Notifications are blocked in your browser settings. You can still enjoy rich in-app recovery toasts!'
                    : 'Allow browser notifications for system reminders while REBOUND is open. In-app reminders also appear inside the app.'}
                </p>
              </div>

              {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
                <button
                  onClick={requestBrowserNotifications}
                  className="px-4 py-2 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] font-bold text-xs shadow-xs shrink-0 active:scale-95 cursor-pointer"
                >
                  Enable Permissions
                </button>
              )}
            </div>
          </div>

          {/* 2. Motivational Test Trigger Button */}
          <div className="p-4 rounded-2xl bg-[#F4F6F4] border border-[#254533]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-black text-[#14281D] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#14281D]" />
                Try a Gentle Nudge Now
              </span>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Sends a one-time test reminder for &ldquo;{activeRecoveryPlan.topic}&rdquo;; it does not mark a recovery step complete.
              </p>
            </div>

            <button
              onClick={handleTestNudge}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] font-bold text-xs shadow-md active:scale-95 shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test Nudge</span>
            </button>
          </div>

          {/* 3. Automated Nudge Preferences */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
              Preferences & Schedule
            </span>

            <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">Automated Recovery Reminders</p>
                  <p className="text-[11px] text-gray-500">
                    Gently nudge when you have unfinished recovery tasks
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14281D]"></div>
                </label>
              </div>

              {notificationsEnabled && (
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Reminder Frequency:</span>
                  <div className="flex items-center gap-1.5">
                    {[15, 30, 60].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setNudgeIntervalMinutes(mins)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          nudgeIntervalMinutes === mins
                            ? 'bg-[#14281D] text-[#B4F04C] shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Pending Recovery Plan Items Ready for Nudges */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Pending Steps in {activeRecoveryPlan.topic} ({pendingSteps.length})
              </span>
              <button
                onClick={() => {
                  onClose();
                  setIsRecoveryModalOpen(true);
                }}
                className="text-xs font-bold text-[#14281D] hover:underline cursor-pointer"
              >
                Open Plan →
              </button>
            </div>

            {pendingSteps.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-emerald-900">All steps completed! 🎉</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Your recovery plan is 100% finished. Your score mastery has surged!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingSteps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#14281D] text-[#B4F04C] font-bold text-xs flex items-center justify-center shrink-0">
                        {step.stepNumber}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{step.title}</p>
                        <p className="text-[10px] text-gray-500 line-clamp-1">{step.detail}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleNudgeStep(step.stepNumber)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#254533]/20 text-[#14281D] hover:bg-[#F4F6F4] font-bold text-xs flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                    >
                      <Bell className="w-3 h-3 text-[#14281D]" />
                      <span>Nudge Me</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Nudge History */}
          {nudgeHistory.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                Recent Motivational Nudges
              </span>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {nudgeHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-white border border-gray-100 shadow-2xs text-xs"
                  >
                    <div className="flex items-center justify-between text-gray-400 text-[10px] font-semibold mb-1">
                      <span>{item.title}</span>
                      <span>{item.timestamp}</span>
                    </div>
                    <p className="text-gray-700">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <p className="text-xs text-gray-500 font-medium">
            Empathy-first notifications: never guilt, only encouragement.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] font-bold text-xs shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
