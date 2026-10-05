import React from 'react';
import {
  X,
  Sparkles,
  Bot,
  Play,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Target,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TopicRecord } from '../../types';

interface TopicDetailModalProps {
  topic: TopicRecord | null;
  onClose: () => void;
}

export const TopicDetailModal: React.FC<TopicDetailModalProps> = ({ topic, onClose }) => {
  const { openCoachWithPrompt, setIsPracticeModalOpen, setPracticeTopic, setPracticeTopicId, setIsRecoveryModalOpen } = useApp();

  if (!topic) return null;

  const handleAskCoach = () => {
    onClose();
    openCoachWithPrompt(`Help me understand the recorded evidence for "${topic.name}" in ${topic.subject}. Suggest practical next study actions, and say clearly if the evidence is insufficient for a conclusion.`);
  };

  const handleStartPractice = () => {
    setPracticeTopic(topic.name);
    setPracticeTopicId(topic.id);
    onClose();
    setIsPracticeModalOpen(true);
  };

  const dimension = (label: string, value: number | null, barClass: string, textClass: string) => (
    <div>
      <div className="flex justify-between font-bold text-gray-700 mb-1">
        <span>{label}</span>
        <span className={textClass}>{value === null ? 'Not Enough Data' : `${value}%`}</span>
      </div>
      {value !== null && <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div className={`${barClass} h-full rounded-full`} style={{ width: `${value}%` }} />
      </div>}
    </div>
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Strong':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Strong</span>;
      case 'Improving':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100">Improving</span>;
      case 'Developing':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">Developing</span>;
      case 'Needs Practice':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">Needs Practice</span>;
      case 'Needs Attention':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">Needs Attention</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">Not Enough Data</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#254533]/20 overflow-hidden my-6">
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-[#254533] bg-[#14281D] text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#B4F04C]">{topic.subject}</span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#9BB0A3] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-white">{topic.name}</h3>
            {getStatusBadge(topic.status)}
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-4xl font-black text-[#B4F04C]">
              {topic.mastery !== null ? `${topic.mastery}%` : 'Not Enough Data'}
            </span>
            <span className="text-xs font-semibold text-[#9BB0A3]">mastery level</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* 1. Cognitive Performance Bars: Concept, Application, Recall */}
          {topic.mastery !== null ? (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                Cognitive Performance Dimensions
              </span>
              <div className="space-y-2.5 text-xs">
                {dimension('Concept Understanding', topic.conceptUnderstanding, 'bg-[#14281D]', 'text-[#14281D]')}
                {dimension('Application (Problem Solving)', topic.application, 'bg-emerald-600', 'text-emerald-700')}
                {dimension('Recall & Formula Retention', topic.recall, 'bg-teal-600', 'text-teal-700')}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center">
              <HelpCircle className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-gray-700">Not Enough Data</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Take a test containing questions from this topic to unlock granular mastery metrics.
              </p>
            </div>
          )}

          {/* 2. AI Insight */}
          <div className="p-4 rounded-2xl bg-[#F4F6F4] border border-[#254533]/20 text-xs">
            <span className="font-black text-[#14281D] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#14281D]" /> REBOUND AI Insight
            </span>
            <p className="text-gray-700 font-medium leading-relaxed">
              &ldquo;{topic.aiInsight}&rdquo;
            </p>
          </div>

          {/* 3. RECOMMENDED NEXT STEPS (Section 9) */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
              RECOMMENDED NEXT STEPS
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#14281D] text-[#B4F04C] font-bold flex items-center justify-center text-[10px]">
                  1
                </span>
                <span className="font-semibold text-gray-700">Review weak concepts</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#14281D] text-[#B4F04C] font-bold flex items-center justify-center text-[10px]">
                  2
                </span>
                <span className="font-semibold text-gray-700">Practice questions</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#14281D] text-[#B4F04C] font-bold flex items-center justify-center text-[10px]">
                  3
                </span>
                <span className="font-semibold text-gray-700">Reattempt mistakes</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#14281D] text-[#B4F04C] font-bold flex items-center justify-center text-[10px]">
                  4
                </span>
                <span className="font-semibold text-gray-700">Take a mini quiz</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <button
            onClick={handleAskCoach}
            className="inline-flex items-center gap-1.5 text-xs font-black text-[#14281D] hover:underline cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>Ask AI About This Topic</span>
          </button>

          <button
            onClick={handleStartPractice}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current text-[#B4F04C]" />
            <span>Practice Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
