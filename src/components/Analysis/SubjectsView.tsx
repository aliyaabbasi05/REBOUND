import React, { useState } from 'react';
import {
  BookOpen,
  Atom,
  FlaskConical,
  Dna,
  Sigma,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Bot,
  Play,
  Layers,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SubjectRecord, TopicRecord } from '../../types';

export const SubjectsView: React.FC = () => {
  const {
    subjects,
    setSelectedTopic,
    setSelectedSubject,
    openCoachWithPrompt,
    setPracticeTopic,
    setIsPracticeModalOpen,
    setCurrentTab,
  } = useApp();

  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleStartPractice = (topicName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPracticeTopic(topicName);
    setIsPracticeModalOpen(true);
  };

  const handleAskCoach = (topicName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    openCoachWithPrompt(`Explain why I struggle with ${topicName} and show me a clear visual example.`);
  };

  const filteredSubjects = subjects.filter((s) => {
    if (activeSubjectFilter !== 'all' && s.name !== activeSubjectFilter) return false;
    return true;
  });

  if (subjects.length === 0) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#14281D]">
            Subjects & Curriculum
          </h2>
          <p className="text-xs text-[#557361] mt-1">
            Topic breakdown and mastery scores generated from your real syllabus.
          </p>
        </div>

        <div className="p-8 sm:p-12 bg-white rounded-3xl border border-[#254533]/20 text-center space-y-4 shadow-sm my-6">
          <div className="w-16 h-16 rounded-3xl bg-[#14281D] text-[#B4F04C] flex items-center justify-center mx-auto shadow-md">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#14281D]">
              No Syllabus or Subjects Uploaded Yet
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto mt-1 leading-relaxed">
              Upload your official syllabus PDF or textbook in the Profile section to extract your course topics and track mastery.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setCurrentTab('profile')}
              className="px-5 py-2.5 rounded-2xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] text-xs sm:text-sm font-extrabold shadow-md transition-all cursor-pointer"
            >
              + Upload Syllabus or Book PDF in Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            Your Subjects & Curriculum Matrix
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Drill down into individual chapter masteries, diagnostic ratings, and targeted practice.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#14281D]/20 focus:border-[#14281D] shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveSubjectFilter('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeSubjectFilter === 'all'
              ? 'bg-[#14281D] text-[#B4F04C] shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          All Subjects ({subjects.length})
        </button>
        {subjects.map((sub) => (
          <button
            key={sub.name}
            onClick={() => setActiveSubjectFilter(sub.name)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
              activeSubjectFilter === sub.name
                ? 'bg-[#14281D] text-[#B4F04C] shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span>{sub.name}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeSubjectFilter === sub.name
                  ? 'bg-[#1C3527] text-[#B4F04C]'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {sub.mastery !== null ? `${sub.mastery}%` : '—'}
            </span>
          </button>
        ))}
      </div>

      {/* Subjects Grid */}
      <div className="space-y-8">
        {filteredSubjects.map((sub) => {
          const matchingTopics = sub.topics.filter((t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

          return (
            <div
              key={sub.name}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EAE4] shadow-xs"
            >
              {/* Subject Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-gray-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#F4F6F4] flex items-center justify-center border border-[#254533]/20 shadow-2xs">
                    {getSubjectIcon(sub.iconName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold text-gray-900">{sub.name}</h3>
                      {sub.mastery !== null && getStatusBadge(sub.status)}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {matchingTopics.length} mapped topics • Student curriculum
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100 self-start sm:self-auto">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">
                      Aggregate Mastery
                    </span>
                    <span className="text-2xl font-black text-gray-900">
                      {sub.mastery !== null ? `${sub.mastery}%` : '—'}
                    </span>
                  </div>
                  <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#14281D] h-full rounded-full"
                      style={{ width: `${sub.mastery || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Topics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchingTopics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic)}
                    className="p-5 rounded-2xl bg-gray-50/70 hover:bg-white border border-gray-200/80 hover:border-[#14281D]/30 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-900 group-hover:text-[#14281D] transition-colors">
                          {topic.name}
                        </span>
                        {getStatusBadge(topic.status)}
                      </div>

                      <div className="flex items-baseline justify-between my-2">
                        <span className="text-2xl font-black text-gray-900">
                          {topic.mastery !== null ? `${topic.mastery}%` : '—'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {topic.history.length > 0
                            ? `Tested ${topic.history[topic.history.length - 1].date}`
                            : 'No recent test'}
                        </span>
                      </div>

                      {/* Mastery Bar */}
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-3">
                        <div
                          className={`h-full rounded-full ${
                            (topic.mastery || 0) >= 75
                              ? 'bg-emerald-500'
                              : (topic.mastery || 0) >= 55
                              ? 'bg-[#14281D]/60'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${topic.mastery || 0}%` }}
                        />
                      </div>

                      {/* Concept / Application / Recall Mini Bars */}
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] bg-white p-2 rounded-xl border border-gray-100 mb-3">
                        <div>
                          <span className="text-gray-400 block font-medium">Concept</span>
                          <span className="font-bold text-gray-800">{topic.mastery !== null ? `${topic.conceptUnderstanding}%` : 'Not Enough Data'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-medium">App</span>
                          <span className="font-bold text-gray-800">{topic.mastery !== null ? `${topic.application}%` : 'Not Enough Data'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-medium">Recall</span>
                          <span className="font-bold text-gray-800">{topic.mastery !== null ? `${topic.recall}%` : 'Not Enough Data'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                      <button
                        onClick={(e) => handleStartPractice(topic.name, e)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Practice</span>
                      </button>

                      <button
                        onClick={(e) => handleAskCoach(topic.name, e)}
                        className="text-[11px] font-black text-[#14281D] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Bot className="w-3 h-3 text-[#14281D]" />
                        <span>Coach Help</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
