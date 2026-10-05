import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Target,
  Bot,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface TestAnalysisViewProps {
  testId: string;
  onBack: () => void;
}

export const TestAnalysisView: React.FC<TestAnalysisViewProps> = ({ testId, onBack }) => {
  const {
    testHistory,
    setIsRecoveryModalOpen,
    openCoachWithPrompt,
    profile,
  } = useApp();

  const test = testHistory.find((t) => t.id === testId);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const formatDate = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!test) return <div className="p-8 bg-white rounded-3xl border border-gray-200 text-center space-y-3"><h2 className="text-lg font-black text-[#14281D]">Assessment not found</h2><p className="text-xs text-gray-500">This assessment is no longer available in this browser.</p><button onClick={onBack} className="px-4 py-2 rounded-xl bg-[#14281D] text-[#B4F04C] text-xs font-bold">Back to test history</button></div>;

  const handleStartRecoveryPlan = () => {
    setIsRecoveryModalOpen(true);
  };

  const handleChatAboutTest = () => {
    openCoachWithPrompt(
      profile.privacy?.personalizedAi === false
        ? 'Explain general strategies for reviewing a marked assessment. I have disabled sharing of my saved academic history; do not refer to it.'
        : `Help me understand the evidence in my assessment "${test.title}" (${test.score}/${test.totalMarks}, ${test.percentage}%). Explain the diagnoses recorded here and how I can approach the next target, ${test.nextTarget.topic || 'Not Enough Data'}.`
    );
  };

  const observedTopicsFor = (mistakeType: 'concept' | 'careless' | 'question_understanding') => {
    const names = [...new Set(test.questions.filter((question) => question.mistakeType === mistakeType).map((question) => question.topic).filter((topic) => topic && topic !== 'Not Enough Data'))];
    return names.length ? names.join(', ') : 'No supported topic diagnosis';
  };

  const getMistakeTypeBadge = (type: string) => {
    switch (type) {
      case 'concept':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">Concept Mistake</span>;
      case 'careless':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">Careless Slip</span>;
      case 'question_understanding':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#14281D]/10 text-[#14281D]">Question Misread</span>;
      case 'correct':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">Full Marks</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">Not Enough Data</span>;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Back button & Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors shadow-2xs"
            title="Return to tests"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#14281D]/5 text-[#14281D]">
                {test.subject}
              </span>
              <span className="text-xs text-gray-400">• {formatDate(test.date)}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-0.5">
              {test.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleChatAboutTest}
            className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-[#14281D] text-xs font-bold border border-[#254533]/20 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Chat About This Test</span>
          </button>
          <button
            onClick={handleStartRecoveryPlan}
            className="px-4 py-2 rounded-xl bg-[#14281D] hover:bg-[#1C3527] text-[#B4F04C] text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Build Recovery Plan</span>
          </button>
        </div>
      </div>

      {/* 1. TEST SCORE PROMINENT CARD */}
      <div className="bg-[#14281D] text-white rounded-3xl p-6 sm:p-8 border border-[#254533]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#9BB0A3] block mb-1">
              Assessment Result
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                {test.score ?? 'Not Enough Data'} <span className="text-2xl font-medium text-white/40">/</span> {test.totalMarks ?? '—'}
              </span>
              <span className="px-3.5 py-1.5 rounded-2xl bg-[#B4F04C] text-[#14281D] text-xl font-black border border-[#B4F04C]">
                {test.percentage !== null ? `${test.percentage}%` : 'Partial evidence'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#9BB0A3] font-medium mt-3 max-w-xl">
              {test.coverage === 'partial' || test.partialEvidence
                ? `Partial evidence: ${test.coverageNotes || 'only the confidently interpreted questions contribute to topic analysis; no whole-test score is claimed.'}`
                : test.encouragement}
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 min-w-[220px]">
              <span className="text-xs font-bold text-[#9BB0A3] block mb-2">Score summary</span>
            <div className="space-y-1.5 text-xs text-white">
              <div className="flex justify-between">
                <span className="text-[#9BB0A3]">Marks Scored:</span>
                <span className="font-bold">{test.score ?? 'Not Enough Data'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9BB0A3]">Lost Marks:</span>
                <span className="font-bold text-rose-300">{test.score !== null && test.totalMarks !== null ? `${test.totalMarks - test.score} marks` : 'Not Enough Data'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9BB0A3]">Top Opportunity:</span>
                <span className="font-bold text-[#B4F04C]">{test.nextTarget.topic}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. WHAT HAPPENED? MISTAKE DIAGNOSIS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
              WHAT HAPPENED?
            </h3>
            <p className="text-xs text-gray-500">
              Breakdown of how marks were lost across diagnostic cognitive categories
            </p>
          </div>
          <span className="text-xs font-semibold text-[#14281D] bg-[#14281D]/5 px-2.5 py-1 rounded-full">
            {test.questions.filter((question) => question.mistakeType !== 'correct').length} diagnosed or unidentified questions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Concept Mistakes */}
          <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Concept mistakes
                </span>
                <span className="text-2xl font-black text-rose-700">
                  {test.mistakeSummary.conceptMistakes}
                </span>
              </div>
              <p className="text-xs text-rose-900 font-medium leading-relaxed">
                Concept-level errors identified from the submitted work; this count does not imply a broader topic mastery verdict.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-rose-200/60">
              <span className="text-[11px] font-bold text-rose-700">
                Observed topics: {observedTopicsFor('concept')}
              </span>
            </div>
          </div>

          {/* Careless Mistakes */}
          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Careless mistakes
                </span>
                <span className="text-2xl font-black text-amber-700">
                  {test.mistakeSummary.carelessMistakes}
                </span>
              </div>
              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                Calculation, notation, unit, or transcription slips only where visible in the submitted response.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/60">
              <span className="text-[11px] font-bold text-amber-700">
                Observed topics: {observedTopicsFor('careless')}
              </span>
            </div>
          </div>

          {/* Question Understanding */}
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Question understanding
                </span>
                <span className="text-2xl font-black text-emerald-800">
                  {test.mistakeSummary.questionUnderstandingMistakes}
                </span>
              </div>
              <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                Prompt or requirement misunderstandings supported by the submitted response.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-200/60">
              <span className="text-[11px] font-bold text-emerald-800">
                Observed topics: {observedTopicsFor('question_understanding')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RECURRING PATTERN CARD (Section 10) */}
      {test.recurringPattern && test.recurringPattern.detected && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-50 via-amber-50/60 to-white border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Recurring Pattern Detected
                </span>
                <span className="px-2 py-0.2 rounded-md bg-amber-200/60 text-amber-900 font-bold text-[10px]">Prior assessments</span>
              </div>
              <p className="text-sm font-bold text-gray-900">
                &ldquo;{test.recurringPattern.message}&rdquo;
              </p>
              <p className="text-xs text-gray-600 mt-1">
                This diagnosis matches the same topic and mistake category found in at least two earlier assessment records.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              openCoachWithPrompt(
                `Help me understand this recurring pattern from my assessment history: ${test.recurringPattern?.message || test.recurringPattern?.topic || 'Not Enough Data'}.`
              )
            }
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs shrink-0"
          >
            Fix Recurring Slip
          </button>
        </div>
      )}

      {/* 4. TOPIC BREAKDOWN */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs">
        <h3 className="text-lg font-extrabold text-gray-900 tracking-tight mb-1">
          TOPIC BREAKDOWN
        </h3>
        <p className="text-xs text-gray-500 mb-5">
          Per-assessment topic signals. Longitudinal mastery is shown separately after sufficient evidence.
        </p>

        <div className="space-y-3">
          {test.topicBreakdown.length === 0 ? <p className="p-4 rounded-2xl bg-gray-50 text-xs text-gray-500">Not Enough Data to map this assessment to a confirmed curriculum topic.</p> : test.topicBreakdown.map((tb) => (
            <div
              key={tb.topicId || tb.topic}
              className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 hover:border-[#14281D]/25 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-gray-900">{tb.topic}</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">This assessment</span>
                </div>
                <p className="text-xs text-gray-600">{tb.notes}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-lg font-black text-gray-900">
                    {tb.mastery !== null ? `${tb.mastery}% assessment signal` : 'Not Enough Data'}
                  </span>
                  <span className="text-[11px] text-rose-600 block font-semibold">
                    -{tb.lostMarks} marks
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. YOUR NEXT TARGET (Section 6) */}
      <div className="bg-[#14281D] rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9BB0A3] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Your Next Target
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#B4F04C]/20 text-[#B4F04C] border border-[#B4F04C]/30">
            {test.nextTarget.opportunityMarks > 0 ? `Up to ${test.nextTarget.opportunityMarks} marks identified` : 'Opportunity not estimated'}
          </span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          {test.nextTarget.topic}
        </h3>
        <p className="text-sm text-[#9BB0A3] font-medium mb-6">
          &ldquo;{test.nextTarget.headline}&rdquo;
        </p>

        {/* 4 Steps Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          {test.nextTarget.recoveryPlan.map((step) => (
            <div
              key={step.stepNumber}
              className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-left"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-300">
                  Step {step.stepNumber}
                </span>
                <span className="text-[10px] uppercase font-bold text-[#B4F04C]">
                  {(step.status || 'not_started').replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs font-bold text-white mb-0.5">{step.title}</p>
              <p className="text-[11px] text-white/70 line-clamp-2">{step.detail}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
          <button
            onClick={handleStartRecoveryPlan}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            <span>Build Recovery Plan</span>
          </button>
          <button
            onClick={handleChatAboutTest}
            className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-md border border-white/20 flex items-center gap-2 transition-colors"
          >
            <Bot className="w-4 h-4" />
            <span>Chat About This Test</span>
          </button>
        </div>
      </div>

      {/* 6. QUESTION-BY-QUESTION DIAGNOSTIC DRILLDOWN */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs">
        <h3 className="text-lg font-extrabold text-gray-900 tracking-tight mb-1">
          Detailed Question Diagnosis
        </h3>
        <p className="text-xs text-gray-500 mb-5">
          Inspect each question&apos;s cognitive diagnosis and clear correction steps
        </p>

        <div className="space-y-3">
          {test.questions.map((q) => {
            const isExpanded = expandedQuestion === q.questionNumber;
            return (
              <div
                key={q.questionNumber}
                className="border border-gray-200/80 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedQuestion(isExpanded ? null : q.questionNumber)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-[#14281D]/5 text-[#14281D] font-black text-xs flex items-center justify-center">
                      {q.questionNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{q.topic}</span>
                        {getMistakeTypeBadge(q.mistakeType)}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate max-w-sm sm:max-w-md">
                        {q.diagnosis}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-extrabold text-gray-900">
                      {q.scoredMarks} / {q.maxMarks} marks
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-[#F4F6F4]/50 border-t border-gray-150 text-xs space-y-3">
                    <div>
                      <span className="font-bold text-gray-700 block mb-0.5">What happened:</span>
                      <p className="text-gray-600 leading-relaxed">{q.diagnosis}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-[#254533]/15">
                      <span className="font-bold text-[#14281D] flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        How to rebound on similar problems:
                      </span>
                      <p className="text-gray-700 leading-relaxed font-medium">{q.howToFix}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
