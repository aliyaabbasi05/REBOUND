import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  Filter,
  PlusCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TestHistoryView: React.FC = () => {
  const { testHistory, setSelectedTestId, setIsAnalyzeModalOpen, subjects } = useApp();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const filteredTests = testHistory.filter((t) => {
    if (selectedSubject === 'all') return true;
    return t.subject.toLowerCase() === selectedSubject.toLowerCase();
  });
  const formatDate = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#14281D]">
            Assessment & Diagnostic History
          </h2>
          <p className="text-xs text-[#557361] mt-1">
            Assessments are recorded with question-level mistake categories, per-test topic signals, and recovery plans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E2EAE4] text-xs font-bold text-[#14281D] focus:outline-none shadow-2xs"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsAnalyzeModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#B4F04C] hover:bg-[#c2f768] text-[#14281D] text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 stroke-[2.75]" />
            <span>+ Analyze New Test</span>
          </button>
        </div>
      </div>

      {/* Tests Grid / Cards */}
      {filteredTests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E2EAE4] shadow-xs max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#14281D] text-[#B4F04C] flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-black text-[#14281D]">Your progress story starts here</h4>
          <p className="text-xs text-[#557361] mt-1 max-w-sm mx-auto">
            Add an assessment to start. Topic mastery and trends appear only after enough evidence is collected.
          </p>
          <button
            onClick={() => setIsAnalyzeModalOpen(true)}
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#B4F04C] hover:bg-[#c2f768] text-[#14281D] font-black text-xs shadow-xs cursor-pointer"
          >
            Analyze Your First Test
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              onClick={() => setSelectedTestId(test.id)}
              className="bg-white rounded-3xl p-6 border border-[#E2EAE4] hover:border-[#14281D] shadow-2xs hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F4F6F4] text-[#14281D] border border-[#E2EAE4]">
                      {test.subject}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(test.date)}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-[#14281D] group-hover:text-[#1C3527] transition-colors">
                    {test.title}
                  </h3>

                  {/* Main topics list */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-gray-400 mr-1">Topics:</span>
                    {test.topicBreakdown.map((tb) => (
                      <span
                        key={tb.topicId || tb.topic}
                        className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium"
                      >
                        {tb.topic} ({tb.mastery !== null ? `${tb.mastery}% assessment signal` : 'Not Enough Data'})
                      </span>
                    ))}
                  </div>

                  {/* Important Mistakes summary */}
                  <div className="flex items-center gap-3 text-xs text-gray-600 pt-1">
                    <span className="font-semibold text-rose-700">
                      {test.mistakeSummary.conceptMistakes} concept slips
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-amber-700">
                      {test.mistakeSummary.carelessMistakes} careless
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-[#14281D]">
                      {test.mistakeSummary.questionUnderstandingMistakes} question misread
                    </span>
                  </div>
                </div>

                {/* Score & View button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 gap-2 shrink-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-gray-900">{test.score ?? 'Not Enough Data'}</span>
                    <span className="text-sm font-bold text-gray-400">/ {test.totalMarks ?? '—'}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-[#14281D] text-[#B4F04C] text-xs font-black">
                      {test.percentage !== null ? `${test.percentage}%` : 'Partial evidence'}
                    </span>
                  </div>

                  <button className="text-xs font-black text-[#14281D] group-hover:text-[#1C3527] flex items-center gap-1">
                    <span>View Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
