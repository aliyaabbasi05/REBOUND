import React, { useState } from 'react';
import {
  X,
  Target,
  Clock,
  Sparkles,
  CheckCircle2,
  Flame,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface EditDailyGoalModalProps {
  onClose: () => void;
}

export const EditDailyGoalModal: React.FC<EditDailyGoalModalProps> = ({ onClose }) => {
  const { dailyGoal, updateDailyGoalTarget, activeRecoveryPlan } = useApp();

  const [targetTasks, setTargetTasks] = useState(dailyGoal.targetTasks);
  const [targetMinutes, setTargetMinutes] = useState(dailyGoal.targetMinutes);
  const [customNote, setCustomNote] = useState(dailyGoal.customNote || '');

  const presets = [
    {
      name: 'Quick Rebound',
      tasks: 1,
      mins: 15,
      tag: 'Light',
      desc: '1 recovery task • 15 mins',
    },
    {
      name: 'Steady Recovery',
      tasks: 2,
      mins: 30,
      tag: 'Recommended',
      desc: '2 recovery tasks • 30 mins',
    },
    {
      name: 'Deep Mastery',
      tasks: 3,
      mins: 45,
      tag: 'High Impact',
      desc: '3 recovery tasks • 45 mins',
    },
    {
      name: 'Exam Prep Sprint',
      tasks: 4,
      mins: 60,
      tag: 'Intensive',
      desc: 'All 4 recovery tasks • 60 mins',
    },
  ];

  const handleApplyPreset = (tasks: number, mins: number) => {
    setTargetTasks(tasks);
    setTargetMinutes(mins);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateDailyGoalTarget(targetTasks, targetMinutes, customNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#254533]/20 relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#14281D] text-[#B4F04C] flex items-center justify-center shadow-md border border-[#254533]">
            <Target className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#14281D] tracking-tight">
              Set Daily Study Goal
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Tailor your daily recovery commitment to your study schedule
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
              Quick Goal Presets
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {presets.map((preset) => {
                const isSelected =
                  targetTasks === preset.tasks && targetMinutes === preset.mins;
                return (
                  <button
                    type="button"
                    key={preset.name}
                    onClick={() => handleApplyPreset(preset.tasks, preset.mins)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#14281D]/5 border-[#14281D] shadow-2xs'
                        : 'bg-gray-50/50 hover:bg-gray-100 border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-[#14281D]">
                        {preset.name}
                      </span>
                      {isSelected ? (
                        <span className="w-4 h-4 rounded-full bg-[#14281D] text-[#B4F04C] flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-gray-500 border border-gray-200">
                          {preset.tag}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium block">
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Tasks Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#14281D]" />
                Target Recovery Tasks Per Day
              </label>
              <span className="text-xs font-black text-[#14281D]">
                {targetTasks} {targetTasks === 1 ? 'Task' : 'Tasks'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setTargetTasks(num)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    targetTasks === num
                      ? 'bg-[#14281D] text-[#B4F04C] shadow-sm'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {num} {num === 1 ? 'Task' : 'Tasks'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Available in active recovery plan for {activeRecoveryPlan.topic}: {activeRecoveryPlan.steps.length} tasks
            </p>
          </div>

          {/* Target Focus Minutes Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                Daily Focus Study Time
              </label>
              <span className="text-xs font-black text-emerald-600">
                {targetMinutes} Minutes
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setTargetMinutes(mins)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    targetMinutes === mins
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Custom Focus Intention */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Focus Intention / Note (Optional)
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Master First Law sign conventions & P-V cycles"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#14281D] focus:ring-2 focus:ring-[#14281D]/20 text-xs text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              Save Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
