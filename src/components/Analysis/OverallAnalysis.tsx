import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Calendar,
  Layers,
  Search,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { hasSufficientTopicEvidence } from '../../domain/metrics';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 bg-white border border-[#254533]/20 rounded-2xl shadow-md text-xs space-y-1">
        <p className="font-extrabold text-[#14281D]">{data.name}</p>
        {data.subject && (
          <p className="text-[10px] font-bold text-gray-500">{data.subject}</p>
        )}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14281D]" />
          <p className="font-black text-[#14281D]">
            Score: <span className="text-emerald-700">{payload[0].value}%</span>
          </p>
        </div>
        {data.date && (
          <p className="text-[10px] text-gray-400">Date: {data.date}</p>
        )}
      </div>
    );
  }
  return null;
};

export const OverallAnalysis: React.FC = () => {
  const {
    subjects,
    testHistory,
    overallMastery,
    recurringMistakes,
    setSelectedTopic,
    setSelectedSubject,
    openCoachWithPrompt,
    setCurrentTab,
    setIsAnalyzeModalOpen,
  } = useApp();

  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Progress is derived only from recorded assessments. Empty history stays empty.
  const orderedTests = [...testHistory]
    .filter((test) => typeof test.percentage === 'number' && Number.isFinite(test.percentage))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latestSubjectRecord = orderedTests[orderedTests.length - 1];
  const latestSubject = latestSubjectRecord?.subject;
  const comparableTests = latestSubjectRecord
    ? orderedTests.filter((test) => latestSubjectRecord.subjectId
      ? test.subjectId === latestSubjectRecord.subjectId
      : test.subject.trim().toLocaleLowerCase() === latestSubjectRecord.subject.trim().toLocaleLowerCase())
    : [];
  const subjectChange = comparableTests.length >= 2
    ? comparableTests[comparableTests.length - 1].percentage! - comparableTests[comparableTests.length - 2].percentage!
    : null;
  const chartData = comparableTests.slice(-6).map((t) => ({
    name: t.title,
    score: t.percentage,
    date: t.date,
    subject: t.subject,
  }));

  // Collect all topics across subjects
  const allTopics = subjects.flatMap((s) => s.topics);
  const hasMasteryEvidence = allTopics.some(hasSufficientTopicEvidence);

  const filteredTopics = allTopics.filter((t) => {
    const matchesSubject = selectedSubjectFilter === 'all' || t.subject === selectedSubjectFilter;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const strongTopics = allTopics.filter((t) => t.status === 'Strong');
  const attentionTopics = allTopics.filter(
    (t) => t.status === 'Needs Attention' || t.status === 'Needs Practice'
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Strong':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Strong
          </span>
        );
      case 'Improving':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-100">Improving</span>;
      case 'Developing':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
            Developing
          </span>
        );
      case 'Needs Practice':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Needs Practice
          </span>
        );
      case 'Needs Attention':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Needs Attention
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Not Enough Data
          </span>
        );
    }
  };

  if (testHistory.length === 0 && subjects.length === 0) {
    return (
      <div className="p-8 sm:p-12 bg-white rounded-3xl border border-[#254533]/20 text-center space-y-4 shadow-sm animate-fade-in my-6">
        <div className="w-16 h-16 rounded-3xl bg-[#14281D] text-[#B4F04C] flex items-center justify-center mx-auto shadow-md">
          <Sparkles className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-[#14281D]">
            No Assessment Data Given Yet
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto mt-1 leading-relaxed">
            REBOUND tracks performance strictly from your real uploaded tests and syllabus documents. Upload your syllabus PDF or analyze a test paper to start tracking progress.
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

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* 1. TOP STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-[#E2EAE4] shadow-xs">
          <span className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">
            Overall Progress
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-[#14281D]">{hasMasteryEvidence && overallMastery !== null ? `${overallMastery}%` : 'Not Enough Data'}</span>
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-0.5">
              {subjectChange !== null ? <><TrendingUp className="w-3 h-3" /> {subjectChange >= 0 ? '+' : ''}{subjectChange} percentage-point change in {latestSubject}</> : 'Not Enough Data'}
            </span>
          </div>
          <div className="w-full bg-[#E2EAE4] h-2 rounded-full overflow-hidden mt-3">
            <div
              className="bg-[#14281D] h-full rounded-full"
              style={{ width: `${hasMasteryEvidence ? overallMastery ?? 0 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E2EAE4] shadow-xs">
          <span className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">
            Strong Mastery Areas
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-700">{hasMasteryEvidence ? strongTopics.length : '—'}</span>
            <span className="text-xs text-[#557361] font-bold">topics with sufficient evidence</span>
          </div>
          <p className="text-xs text-[#557361] mt-2">
            {hasMasteryEvidence ? 'Topics at or above the evidence-backed Strong threshold.' : 'Not Enough Data to rate topic mastery.'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E2EAE4] shadow-xs">
          <span className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">
            Rebound Opportunities
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-rose-700">{hasMasteryEvidence ? attentionTopics.length : '—'}</span>
            <span className="text-xs text-[#557361] font-bold">topics needing attention</span>
          </div>
          <p className="text-xs text-[#557361] mt-2">
            {hasMasteryEvidence ? 'Topics currently rated Needs Practice or Needs Attention.' : 'Not Enough Data to identify rated opportunities.'}
          </p>
        </div>
      </div>

      {/* 2. PROGRESS OVER TIME & SUBJECT PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Progress Over Time Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-[#E2EAE4] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-[#14281D] tracking-tight">
                Progress Over Time
              </h3>
              <p className="text-xs text-[#557361]">
                {latestSubject ? `Recent assessments in ${latestSubject}` : 'No assessment history recorded'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-[#14281D] text-[#B4F04C]">
              {chartData.length >= 2 ? `Change ${chartData[chartData.length - 1].score! - chartData[0].score! >= 0 ? '+' : ''}${chartData[chartData.length - 1].score! - chartData[0].score!} percentage points` : 'Not Enough Data'}
            </span>
          </div>

          {/* Trend Line Chart using Recharts */}
          <div className="h-56 w-full mt-4">
            {chartData.length === 0 ? <div className="h-full rounded-2xl border border-dashed border-[#254533]/20 bg-[#F4F6F4] flex items-center justify-center text-center p-6 text-xs text-[#557361]">Assessment trend appears after you save a real assessment.</div> : <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 15, right: 10, left: -25, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14281D" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#14281D" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2EAE4" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#557361', fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#557361', fontSize: 10, fontWeight: 'bold' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#14281D"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#scoreGradient)"
                  activeDot={{
                    r: 6,
                    stroke: '#FAF6EE',
                    strokeWidth: 2,
                    fill: '#14281D',
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>}
          </div>
        </div>

        {/* Subject Performance Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-[#E2EAE4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[#14281D] tracking-tight">
                Subject Performance
              </h3>
              <span className="text-xs text-gray-400">Click to inspect</span>
            </div>

            <div className="space-y-3.5">
              {subjects.map((sub) => (
                <button
                  key={sub.name}
                  onClick={() => setSelectedSubject(sub)}
                  className="w-full p-3 rounded-2xl bg-gray-50/70 hover:bg-[#F4F6F4] border border-gray-100 transition-colors text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex justify-between text-xs font-bold text-gray-800 mb-1">
                      <span>{sub.name}</span>
                      <span className="text-[#14281D]">
                        {sub.mastery !== null ? `${sub.mastery}%` : 'Not Enough Data'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          (sub.mastery || 0) >= 75
                            ? 'bg-emerald-500'
                            : (sub.mastery || 0) >= 60
                            ? 'bg-[#14281D]/60'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${sub.mastery || 0}%` }}
                      />
                    </div>
                  </div>
                  {getStatusBadge(sub.status)}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 text-center">
            <span className="text-xs text-gray-400 font-medium">
              Evaluated strictly on recorded assessment data
            </span>
          </div>
        </div>
      </div>

      {/* 3. RECURRING MISTAKES RADAR (Section 10) */}
      <div className="bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-white rounded-3xl p-6 sm:p-7 border border-amber-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Recurring Mistakes Intelligence
              </h3>
              <p className="text-xs text-gray-500">
                Identifies pattern slips that repeat across different tests
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-full">
            {recurringMistakes.length} Detected Patterns
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recurringMistakes.map((rm) => (
            <div
              key={rm.id}
              className="p-4 rounded-2xl bg-white border border-amber-200/70 shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md">
                  {rm.topic} ({rm.subject})
                </span>
                <span className="text-[11px] font-bold text-gray-400">
                  Seen in {rm.occurrences.length} assessments
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-800">{rm.description}</p>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span>Last in {rm.occurrences[rm.occurrences.length - 1]?.testTitle}</span>
                </div>
                <button
                  onClick={() =>
                    openCoachWithPrompt(
                      `Coach me on this recurring mistake in ${rm.topic}: "${rm.description}". Give me a trick so I never slip on this again.`
                    )
                  }
                  className="text-xs font-black text-[#14281D] hover:underline cursor-pointer"
                >
                  Ask AI Coach →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. TOPIC PERFORMANCE MATRIX */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EAE4] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-[#14281D] tracking-tight">
              Topic Mastery Matrix
            </h3>
            <p className="text-xs text-gray-500">
              Click any topic to view concept, application, and recall breakdown
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#14281D]/20 focus:border-[#14281D] focus:outline-none w-36 sm:w-44"
              />
            </div>

            {/* Subject filter */}
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 focus:outline-none"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Topics Table/Grid */}
        <div className="space-y-3">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => setSelectedTopic(topic)}
              className="p-4 rounded-2xl bg-gray-50/60 hover:bg-[#F4F6F4] border border-gray-100 hover:border-[#14281D]/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-bold text-xs text-[#14281D] group-hover:bg-[#14281D] group-hover:text-[#B4F04C] transition-colors">
                  {topic.subject[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#14281D]">
                      {topic.name}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-semibold">
                      {topic.subject}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate max-w-sm sm:max-w-lg mt-0.5">
                    {topic.aiInsight}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-base font-black text-gray-900">
                    {topic.mastery !== null ? `${topic.mastery}%` : 'Not Enough Data'}
                  </span>
                  <span className="text-[10px] text-gray-400 block font-medium">Mastery</span>
                </div>
                {getStatusBadge(topic.status)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
