import React from 'react';
import { X, ChevronRight, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { SubjectRecord, TopicRecord } from '../../types';

interface SubjectDetailModalProps {
  subject: SubjectRecord | null;
  onClose: () => void;
  onSelectTopic: (topic: TopicRecord) => void;
}

export const SubjectDetailModal: React.FC<SubjectDetailModalProps> = ({
  subject,
  onClose,
  onSelectTopic,
}) => {
  if (!subject) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Strong':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Strong
          </span>
        );
      case 'Improving':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100">Improving</span>;
      case 'Developing':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
            Developing
          </span>
        );
      case 'Needs Practice':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Needs Practice
          </span>
        );
      case 'Needs Attention':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Needs Attention
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Not Enough Data
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#254533]/20 overflow-hidden my-6">
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-[#254533] bg-[#14281D] text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#B4F04C]">
              Subject Deep Dive
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#9BB0A3] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-black text-white uppercase tracking-tight">
              {subject.name}
            </h3>
            <span className="text-3xl font-black text-[#B4F04C]">
              {subject.mastery !== null ? `${subject.mastery}%` : '—'}
            </span>
          </div>
          <p className="text-xs text-[#9BB0A3] mt-1">
            Select any topic below to open its diagnostic mastery metrics and recovery steps.
          </p>
        </div>

        {/* Topics List as in Section 8 */}
        <div className="p-6 sm:p-7 space-y-3 max-h-[60vh] overflow-y-auto">
          {subject.topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => {
                onClose();
                onSelectTopic(topic);
              }}
              className="w-full p-4 rounded-2xl bg-gray-50/70 hover:bg-[#F4F6F4] border border-gray-100 hover:border-[#14281D]/30 transition-all text-left flex items-center justify-between group shadow-2xs cursor-pointer"
            >
              <div>
                <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#14281D]">
                  {topic.name}
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{topic.aiInsight}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-black text-gray-900">
                  {topic.mastery !== null ? `${topic.mastery}%` : 'Not Enough Data'}
                </span>
                {getStatusBadge(topic.status)}
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#14281D] transition-colors" />
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <span className="text-xs text-gray-500">
            {subject.topics.length} topics curriculum-mapped
          </span>
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
