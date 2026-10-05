import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileText,
  Flame,
  GitBranch,
  LayoutDashboard,
  Lightbulb,
  MessageCircle,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';

interface DemoModeProps {
  onExitDemo: () => void;
  onGetStarted: () => void;
}

type DemoTab = 'dashboard' | 'analysis' | 'progress' | 'recovery' | 'coach';

const tabs: Array<{ id: DemoTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analysis', label: 'Test Analysis', icon: FileText },
  { id: 'progress', label: 'Topic Progress', icon: BarChart3 },
  { id: 'recovery', label: 'Recovery Plan', icon: GitBranch },
  { id: 'coach', label: 'AI Coach', icon: MessageCircle },
];

const topics = [
  { name: 'Energy transfers', status: 'Strong', score: 86, color: 'bg-[#B4F04C]' },
  { name: 'Particle models', status: 'Improving', score: 68, color: 'bg-[#A7D66A]' },
  { name: 'Thermal calculations', status: 'Needs practice', score: 42, color: 'bg-[#F4B860]' },
];

const planSteps = [
  { title: 'Review the worked example', detail: 'Compare each unit conversion against the model answer.', done: true },
  { title: 'Explain the equation aloud', detail: 'Use your own words before looking back at the formula sheet.', done: true },
  { title: 'Try three targeted questions', detail: 'Build fluency with thermal calculations under low pressure.', done: false },
  { title: 'Check your understanding', detail: 'Add a new piece of evidence when you are ready to retest.', done: false },
];

const DemoBadge = () => (
  <div className="inline-flex items-center gap-2 rounded-full border border-[#D7E7B8] bg-[#F0F8DE] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#52721D]">
    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
    DEMO — sample data, not a student record
  </div>
);

const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color = 'bg-[#B4F04C]' }) => (
  <div className="h-2 overflow-hidden rounded-full bg-[#E7EEE4]" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={`${value}% sample progress`}>
    <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
  </div>
);

export const DemoMode: React.FC<DemoModeProps> = ({ onExitDemo, onGetStarted }) => {
  const [activeTab, setActiveTab] = useState<DemoTab>('dashboard');

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-[#14281D] p-5 text-white shadow-lg shadow-[#14281D]/10"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#AFC2B4]">Latest evidence</span><FileText className="h-4 w-4 text-[#B4F04C]" aria-hidden="true" /></div><p className="mt-5 text-3xl font-black">68%</p><p className="mt-1 text-xs font-medium text-[#B4F04C]">Physics · Unit 3 checkpoint</p></div>
        <div className="rounded-3xl border border-[#DCE6D9] bg-white p-5"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#789080]">Topic focus</span><Target className="h-4 w-4 text-[#6C9429]" aria-hidden="true" /></div><p className="mt-5 text-3xl font-black">3</p><p className="mt-1 text-xs font-medium text-[#64786A]">topics with evidence</p></div>
        <div className="rounded-3xl border border-[#DCE6D9] bg-white p-5"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#789080]">Study streak</span><Flame className="h-4 w-4 text-[#EC9B3B]" aria-hidden="true" /></div><p className="mt-5 text-3xl font-black">4 days</p><p className="mt-1 text-xs font-medium text-[#64786A]">momentum, not mastery</p></div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-[#DCE6D9] bg-white p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#789080]">Progress snapshot</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">The story is moving forward.</h2></div><span className="rounded-full bg-[#F0F8DE] px-3 py-1.5 text-xs font-black text-[#52721D]">+12 pts with evidence</span></div><div className="mt-8 flex h-44 items-end gap-2 sm:gap-4">{[34, 43, 39, 56, 51, 69, 78, 86].map((height, index) => <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className={`w-full rounded-t-xl transition-all ${index === 7 ? 'bg-[#B4F04C]' : 'bg-[#DCE8D1]'}`} style={{ height: `${height}%` }} /><span className="text-[9px] font-bold text-[#91A096]">{['Sep 2', '', 'Sep 9', '', 'Sep 16', '', 'Sep 23', 'Now'][index]}</span></div>)}</div><div className="mt-5 flex items-center gap-2 text-xs font-bold text-[#6B7F70]"><TrendingUp className="h-4 w-4 text-[#6C9429]" aria-hidden="true" /> Improvement is based on dated assessment evidence.</div></section>
        <section className="rounded-3xl bg-[#EAF5D7] p-5 sm:p-7"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#6C9429]"><Lightbulb className="h-5 w-5" aria-hidden="true" /></div><p className="mt-7 text-[10px] font-black uppercase tracking-[0.17em] text-[#6C9429]">Next best action</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Practice thermal calculations.</h2><p className="mt-3 text-sm leading-6 text-[#52685A]">Your recent evidence points to one focused opportunity. A small practice set is more useful than trying to revise everything.</p><button type="button" onClick={() => setActiveTab('recovery')} className="mt-7 inline-flex items-center gap-2 text-sm font-black text-[#14281D] hover:text-[#6C9429] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14281D]">Open recovery plan <ArrowRight className="h-4 w-4" aria-hidden="true" /></button></section>
      </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-[#DCE6D9] bg-white p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#789080]">Physics · checkpoint 03</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Where the marks went</h2></div><span className="rounded-full bg-[#F0F8DE] px-3 py-1.5 text-xs font-black text-[#52721D]">68 / 100</span></div><div className="mt-7 space-y-3">{[{ q: 'Q01', label: 'Energy transfer', marks: '14 / 15', status: 'Strong', tone: 'text-[#52721D] bg-[#F0F8DE]' }, { q: 'Q02', label: 'Particle models', marks: '18 / 25', status: 'Improving', tone: 'text-[#52721D] bg-[#F0F8DE]' }, { q: 'Q03', label: 'Thermal calculations', marks: '10 / 25', status: 'Needs practice', tone: 'text-[#A45D19] bg-[#FFF1DE]' }, { q: 'Q04', label: 'Energy transfers', marks: '26 / 35', status: 'Improving', tone: 'text-[#52721D] bg-[#F0F8DE]' }].map((item) => <div key={item.q} className="flex items-center gap-3 rounded-2xl border border-[#E7EEE4] p-3.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F8F1] text-xs font-black text-[#6B7F70]">{item.q}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{item.label}</p><p className="mt-1 text-xs text-[#87968B]">Evidence-linked diagnosis</p></div><div className="text-right"><p className="text-sm font-black">{item.marks}</p><span className={`mt-1 inline-block rounded-full px-2 py-1 text-[10px] font-black ${item.tone}`}>{item.status}</span></div></div>)}</div></section>
      <section className="rounded-3xl bg-[#14281D] p-5 text-white sm:p-7"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#B4F04C] text-[#14281D]"><CircleHelp className="h-5 w-5" aria-hidden="true" /></div><p className="mt-7 text-[10px] font-black uppercase tracking-[0.17em] text-[#B4F04C]">Diagnosis, not judgement</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">One pattern is emerging.</h2><p className="mt-4 text-sm leading-6 text-[#B4C7B8]">The sample learner can identify the right relationship, but loses marks when translating it into a multi-step calculation.</p><div className="mt-7 rounded-2xl border border-[#35513E] bg-[#1C3527] p-4"><p className="text-xs font-black text-white">What to try next</p><p className="mt-2 text-sm leading-6 text-[#B4C7B8]">Write the known values and units before choosing an equation.</p></div></section>
    </div>
  );

  const renderProgress = () => (
    <section className="rounded-3xl border border-[#DCE6D9] bg-white p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#789080]">Physics · topic evidence</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Progress with context</h2></div><span className="text-xs font-bold text-[#87968B]">Updated from 2 assessments</span></div><div className="mt-8 grid gap-4 md:grid-cols-3">{topics.map((topic) => <article key={topic.name} className="rounded-2xl border border-[#E7EEE4] bg-[#FCFDFB] p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-black">{topic.name}</h3><p className="mt-1 text-xs text-[#87968B]">{topic.status}</p></div><span className="text-xl font-black">{topic.score}%</span></div><div className="mt-5"><ProgressBar value={topic.score} color={topic.color} /></div><p className="mt-4 text-xs leading-5 text-[#6B7F70]">{topic.score > 75 ? 'Consistent evidence across recent work.' : topic.score > 50 ? 'A clear opportunity to build confidence.' : 'Targeted practice recommended before retest.'}</p></article>)}</div><div className="mt-5 rounded-2xl border border-dashed border-[#CBD9C9] bg-[#F7FAF5] p-4 text-xs text-[#6B7F70]"><strong className="font-black text-[#14281D]">Not Enough Data</strong> is shown when a topic has not been tested—it is never treated as a zero.</div></section>
  );

  const renderRecovery = () => (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-3xl bg-[#14281D] p-5 text-white sm:p-7"><div className="flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#B4F04C] text-[#14281D]"><Target className="h-5 w-5" aria-hidden="true" /></div><span className="rounded-full bg-[#294633] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#B4F04C]">2 / 4 complete</span></div><p className="mt-7 text-[10px] font-black uppercase tracking-[0.17em] text-[#B4F04C]">Recovery plan</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Thermal calculations</h2><p className="mt-4 text-sm leading-6 text-[#B4C7B8]">A short route from “I missed marks” to “I know what to do next time.”</p><div className="mt-8"><ProgressBar value={50} color="bg-[#B4F04C]" /><p className="mt-2 text-xs font-bold text-[#AFC2B4]">Plan progress, separate from academic mastery.</p></div></section>
      <section className="rounded-3xl border border-[#DCE6D9] bg-white p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#789080]">Your next steps</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Small actions, clear momentum</h2></div><BookOpen className="h-5 w-5 text-[#6C9429]" aria-hidden="true" /></div><div className="mt-7 space-y-3">{planSteps.map((step, index) => <div key={step.title} className="flex gap-3 rounded-2xl border border-[#E7EEE4] p-4"><div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${step.done ? 'bg-[#B4F04C] text-[#14281D]' : 'bg-[#F1F5EF] text-[#7C9182]'}`}>{step.done ? <Check className="h-4 w-4" aria-hidden="true" /> : <span className="text-xs font-black">{index + 1}</span>}</div><div><p className="text-sm font-black">{step.title}</p><p className="mt-1 text-xs leading-5 text-[#718477]">{step.detail}</p></div></div>)}</div></section>
    </div>
  );

  const renderCoach = () => (
    <div className="mx-auto max-w-3xl rounded-3xl border border-[#DCE6D9] bg-white p-5 sm:p-8"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#14281D] text-[#B4F04C]"><MessageCircle className="h-5 w-5" aria-hidden="true" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#6C9429]">AI Coach · sample context</p><h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Ask what your evidence can answer.</h2><p className="mt-2 text-sm leading-6 text-[#718477]">This preview is simulated. In your workspace, responses use your confirmed curriculum and submitted evidence.</p></div></div><div className="mt-8 space-y-3"><div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-[#EAF5D7] p-4 text-sm font-bold text-[#304635]">Why did I lose marks on thermal calculations?</div><div className="max-w-[90%] rounded-2xl rounded-tl-md bg-[#F4F8F1] p-4 text-sm leading-6 text-[#52685A]">The sample evidence points to a translation gap: the relationship is familiar, but multi-step units are easy to skip. Try writing known values and units first, then check one worked example.</div></div><div className="mt-7 flex flex-wrap gap-2">{['What should I study next?', 'Explain question 3', 'Have I improved?'].map((prompt) => <button type="button" key={prompt} onClick={() => undefined} className="rounded-full border border-[#D5E1D3] px-3.5 py-2 text-xs font-bold text-[#587060] transition hover:border-[#6C9429] hover:text-[#14281D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4F04C]">{prompt}</button>)}</div><div className="mt-5 flex items-center gap-2 rounded-2xl border border-dashed border-[#CFDDCE] bg-[#FAFCF9] p-4 text-xs text-[#809186]"><Sparkles className="h-4 w-4 text-[#6C9429]" aria-hidden="true" /> Demo replies are illustrative only—no AI request was made.</div></div>
  );

  const content = activeTab === 'dashboard' ? renderDashboard() : activeTab === 'analysis' ? renderAnalysis() : activeTab === 'progress' ? renderProgress() : activeTab === 'recovery' ? renderRecovery() : renderCoach();
  const activeLabel = tabs.find((tab) => tab.id === activeTab)?.label;

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#14281D]">
      <header className="border-b border-[#DCE6D9] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#14281D] text-[#B4F04C]"><TrendingUp className="h-5 w-5 stroke-[2.5]" aria-hidden="true" /></div><div><span className="block text-lg font-black tracking-[-0.04em]">REBOUND</span><span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#789080]">Interactive demo</span></div></div>
          <div className="flex items-center gap-2"><button type="button" onClick={onGetStarted} aria-label="Leave demo and get started with a real workspace" className="hidden rounded-xl bg-[#B4F04C] px-4 py-2.5 text-xs font-black text-[#14281D] transition hover:bg-[#C6F76B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4F04C]/60 sm:inline-flex">Get Started <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden="true" /></button><button type="button" onClick={onExitDemo} aria-label="Exit demo and return to the REBOUND landing page" className="inline-flex items-center gap-2 rounded-xl border border-[#D2DFD0] px-3.5 py-2.5 text-xs font-black text-[#52685A] transition hover:border-[#14281D] hover:text-[#14281D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4F04C]/60"><X className="h-4 w-4" aria-hidden="true" /> Exit Demo</button></div>
        </div>
        <div className="mx-auto max-w-[1500px] px-5 pb-4 sm:px-8 lg:px-10"><DemoBadge /></div>
      </header>
      <div className="mx-auto flex max-w-[1500px] flex-col lg:flex-row">
        <nav aria-label="Demo sections" className="border-b border-[#DCE6D9] bg-[#F4F8F1] px-5 py-3 sm:px-8 lg:w-64 lg:border-b-0 lg:border-r lg:px-4 lg:py-7"><div className="flex gap-2 overflow-x-auto lg:flex-col">{tabs.map((tab) => { const Icon = tab.icon; const active = tab.id === activeTab; return <button key={tab.id} type="button" role="tab" aria-selected={active} onClick={() => setActiveTab(tab.id)} className={`flex shrink-0 items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4F04C]/60 lg:w-full ${active ? 'bg-[#14281D] text-white shadow-lg shadow-[#14281D]/10' : 'text-[#6B7F70] hover:bg-white hover:text-[#14281D]'}`}><Icon className={`h-4 w-4 ${active ? 'text-[#B4F04C]' : 'text-[#789080]'}`} aria-hidden="true" />{tab.label}</button>; })}</div><div className="mt-10 hidden rounded-2xl border border-[#D7E3D5] bg-white p-4 lg:block"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#789080]">Sample journey</p><p className="mt-2 text-xs font-black leading-5">TEST → ANALYZE → RECOVER → PRACTICE</p><p className="mt-2 text-[11px] leading-5 text-[#718477]">Explore each section to see how the pieces connect.</p></div></nav>
        <main className="min-w-0 flex-1 px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6C9429]">{activeLabel}</p><h1 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">A clearer next step.</h1></div><p className="max-w-xs text-right text-xs leading-5 text-[#87968B]">Everything here is fictional sample data for judging the product flow.</p></div>{content}</main>
      </div>
      <footer className="mx-auto flex max-w-[1500px] flex-col gap-3 border-t border-[#DCE6D9] px-5 py-5 text-xs text-[#87968B] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><span className="inline-flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-[#6C9429]" aria-hidden="true" /> Demo mode never calls AI or saves records.</span><button type="button" onClick={onExitDemo} className="inline-flex items-center gap-1 font-black text-[#52685A] hover:text-[#14281D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4F04C]">Back to landing <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /></button></footer>
    </div>
  );
};
