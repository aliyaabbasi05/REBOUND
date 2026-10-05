import React from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  CirclePlay,
  FileCheck2,
  LineChart,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface WelcomeLandingViewProps {
  onTryDemo?: () => void;
  onGetStarted?: () => void;
}

const journey = [
  { label: 'TEST', detail: 'Bring in a real marked assessment', icon: FileCheck2 },
  { label: 'ANALYZE', detail: 'See where marks moved', icon: BarChart3 },
  { label: 'UNDERSTAND', detail: 'Name the kind of gap', icon: BookOpen },
  { label: 'RECOVER', detail: 'Get a focused plan', icon: Target },
  { label: 'PRACTICE', detail: 'Train the exact weak spot', icon: Play },
  { label: 'RETEST', detail: 'Add fresh evidence', icon: ShieldCheck },
  { label: 'IMPROVE', detail: 'Make progress visible', icon: TrendingUp },
];

const previewCards = [
  {
    eyebrow: 'TEST ANALYSIS',
    title: 'Know where the marks went.',
    description: 'Question-level evidence keeps every insight connected to the work you submitted.',
    icon: FileCheck2,
    accent: 'lime',
  },
  {
    eyebrow: 'TOPIC PROGRESS',
    title: 'Track progress, not pressure.',
    description: 'Topic trends stay honest: enough evidence is progress, and Not Enough Data is useful too.',
    icon: LineChart,
    accent: 'cream',
  },
  {
    eyebrow: 'RECOVERY PLAN',
    title: 'Turn a gap into a next step.',
    description: 'A small, practical sequence helps you move from diagnosis to confident practice.',
    icon: Target,
    accent: 'dark',
  },
  {
    eyebrow: 'AI COACH',
    title: 'Ask better questions.',
    description: 'Context-aware guidance explains what happened and what to study next—without guessing.',
    icon: MessageCircle,
    accent: 'cream',
  },
];

export const WelcomeLandingView: React.FC<WelcomeLandingViewProps> = ({ onTryDemo, onGetStarted }) => {
  const { curriculums, setShowLandingPage, setCurrentTab, setIsOnboardingOpen } = useApp();

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
      return;
    }
    setShowLandingPage(false);
    setCurrentTab('home');
    if (Object.keys(curriculums).length === 0) setIsOnboardingOpen(true);
  };

  const handleTryDemo = () => {
    if (onTryDemo) {
      onTryDemo();
      return;
    }
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `${window.location.pathname}${window.location.search}#demo`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#FAF6EE] text-[#14281D]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3" aria-label="REBOUND home">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#14281D] text-[#B4F04C] shadow-lg shadow-[#14281D]/10">
            <TrendingUp className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
          </div>
          <div>
            <span className="block text-lg font-black tracking-[-0.04em]">REBOUND</span>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-[#6E8376] sm:block">Progress, not pressure</span>
          </div>
        </div>
        <div className="hidden items-center gap-6 text-xs font-bold text-[#6E8376] md:flex">
          <span>Evidence-first</span>
          <span>Student-owned</span>
          <span>Built to improve</span>
        </div>
        <button
          type="button"
          onClick={handleTryDemo}
          aria-label="Open the REBOUND sample data demo"
          className="rounded-full border border-[#C9D7CB] bg-white/70 px-4 py-2 text-xs font-black text-[#14281D] shadow-sm transition hover:-translate-y-0.5 hover:border-[#14281D] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4F04C]/60"
        >
          View demo
        </button>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-7 sm:px-8 sm:pt-12 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:px-10 lg:pb-24">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C9D7CB] bg-white/70 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#486052] shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#769B2D]" aria-hidden="true" />
              An academic recovery coach for real progress
            </div>
            <h1 className="max-w-3xl text-[clamp(3rem,7vw,6.35rem)] font-black leading-[0.94] tracking-[-0.07em] text-[#14281D]">
              Your score is a snapshot.
              <span className="mt-3 block text-[#6C9429]">Your progress is the story.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base font-medium leading-7 text-[#52685A] sm:text-lg sm:leading-8">
              REBOUND turns disappointing test results into a personalized path toward improvement. Understand where marks went, recover the right topics, and make your next attempt stronger—with evidence at every step.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleGetStarted}
                aria-label="Get started with your personal REBOUND workspace"
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#B4F04C] px-6 text-sm font-black text-[#14281D] shadow-xl shadow-[#7E9E43]/20 transition hover:-translate-y-1 hover:bg-[#C6F76B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4F04C]/70"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleTryDemo}
                aria-label="Try the REBOUND sample data demo"
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl border border-[#B8CBBB] bg-white/75 px-6 text-sm font-black text-[#14281D] transition hover:-translate-y-1 hover:border-[#14281D] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4F04C]/60"
              >
                <CirclePlay className="h-4 w-4 text-[#6C9429]" aria-hidden="true" />
                Try Demo
                <span className="text-[#799080]">5 min</span>
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-[#718477]">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#6C9429]" aria-hidden="true" /> No fake scores</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#6C9429]" aria-hidden="true" /> Saved only in this browser</span>
            </div>
            <p className="mt-3 max-w-xl text-[11px] leading-5 text-[#718477]">
              Hackathon prototype: no secure account or cloud sync. Avoid entering sensitive student records.
            </p>
          </div>

          <div className="relative min-h-[390px] lg:min-h-[520px]">
            <div className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[#B4F04C]/25 blur-3xl" aria-hidden="true" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#DCE8D1]/70 blur-3xl" aria-hidden="true" />
            <div className="absolute inset-x-2 top-5 rounded-[2rem] border border-[#D6E1D4] bg-[#F4F8F1]/90 p-4 shadow-[0_24px_70px_rgba(20,40,29,0.12)] backdrop-blur sm:inset-x-7 sm:p-5 lg:top-10">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#769080]">Illustrative sample · not student data</p>
                  <p className="mt-1 text-lg font-black tracking-tight">Your recovery dashboard</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14281D] text-[#B4F04C]"><TrendingUp className="h-4 w-4" aria-hidden="true" /></div>
              </div>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <div className="rounded-2xl bg-[#14281D] p-3 text-white sm:p-4">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#9BB0A3]">Evidence</p>
                  <p className="mt-2 text-xl font-black sm:text-2xl">12</p>
                  <p className="mt-1 text-[10px] text-[#B4F04C]">questions mapped</p>
                </div>
                <div className="rounded-2xl border border-[#D8E3D7] bg-white p-3 sm:p-4">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#769080]">Focus</p>
                  <p className="mt-2 text-xl font-black sm:text-2xl">3</p>
                  <p className="mt-1 text-[10px] text-[#6C9429]">topics to revisit</p>
                </div>
                <div className="rounded-2xl border border-[#D8E3D7] bg-white p-3 sm:p-4">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#769080]">Next</p>
                  <p className="mt-2 text-xl font-black sm:text-2xl">1</p>
                  <p className="mt-1 text-[10px] text-[#6C9429]">recovery step</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-[#E1E9DF] bg-white p-4">
                <div className="flex items-center justify-between text-xs font-black"><span>Topic evidence</span><span className="text-[#6C9429]">This week</span></div>
                <div className="mt-4 flex h-28 items-end gap-2 sm:h-36 sm:gap-3">
                  {[35, 52, 44, 68, 58, 79, 88].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className={`w-full rounded-t-lg ${index === 6 ? 'bg-[#B4F04C]' : 'bg-[#DCE8D1]'}`} style={{ height: `${height}%` }} /><span className="text-[9px] font-bold text-[#9BAA9D]">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span></div>)}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-1 -left-1 rounded-2xl border border-[#D6E1D4] bg-white p-4 shadow-xl shadow-[#14281D]/10 sm:bottom-4 sm:left-0">
              <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF5D7] text-[#6C9429]"><Target className="h-4 w-4" aria-hidden="true" /></div><div><p className="text-[10px] font-black uppercase tracking-wider text-[#829487]">Next best action</p><p className="mt-1 text-xs font-black">Review one worked example</p></div></div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#DFE8DE] bg-[#F4F8F1] px-5 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 text-center sm:gap-3 lg:justify-between">
            {journey.map((step, index) => { const Icon = step.icon; return <React.Fragment key={step.label}><div className="group flex min-w-[90px] flex-col items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#C9D9C8] bg-white text-[#6C9429] transition group-hover:-translate-y-1 group-hover:border-[#6C9429]"><Icon className="h-4 w-4" aria-hidden="true" /></div><span className="text-[10px] font-black tracking-[0.12em] text-[#3D5646]">{step.label}</span><span className="hidden max-w-[90px] text-[10px] font-medium leading-4 text-[#839488] lg:block">{step.detail}</span></div>{index < journey.length - 1 && <ChevronRight className="hidden h-4 w-4 text-[#B3C5B3] lg:block" aria-hidden="true" />}</React.Fragment>; })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6C9429]">A calmer way forward</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">Everything you need to turn feedback into momentum.</h2>
            <p className="mt-4 text-base leading-7 text-[#64786A]">Beautiful analytics are only useful when they lead to a better next move. REBOUND keeps the journey clear, grounded, and yours.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {previewCards.map((card) => { const Icon = card.icon; const dark = card.accent === 'dark'; return <article key={card.eyebrow} className={`group relative overflow-hidden rounded-3xl border p-6 transition hover:-translate-y-1 hover:shadow-xl ${dark ? 'border-[#254533] bg-[#14281D] text-white' : card.accent === 'lime' ? 'border-[#D7E7B8] bg-[#F0F8DE]' : 'border-[#E1E8DE] bg-white'}`}><div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${dark ? 'bg-[#B4F04C] text-[#14281D]' : 'bg-[#E7F2D5] text-[#6C9429]'}`}><Icon className="h-5 w-5" aria-hidden="true" /></div><p className={`mt-7 text-[10px] font-black uppercase tracking-[0.16em] ${dark ? 'text-[#B4F04C]' : 'text-[#7B9080]'}`}>{card.eyebrow}</p><h3 className="mt-2 text-xl font-black leading-tight tracking-[-0.03em]">{card.title}</h3><p className={`mt-3 text-sm leading-6 ${dark ? 'text-[#B4C7B8]' : 'text-[#687B6D]'}`}>{card.description}</p><div className={`mt-6 flex items-center gap-1 text-xs font-black ${dark ? 'text-[#B4F04C]' : 'text-[#6C9429]'}`}>See how it works <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" /></div></article>; })}
          </div>
        </section>

        <section className="mx-5 mb-10 overflow-hidden rounded-[2rem] bg-[#14281D] px-6 py-10 text-white sm:mx-8 sm:px-10 lg:mx-auto lg:max-w-7xl lg:px-14 lg:py-14">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B4F04C]">Start with one result</p><h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">The next chapter starts with a clearer next step.</h2><p className="mt-4 text-sm leading-6 text-[#B4C7B8]">Use your own evidence in the workspace, or explore a labelled sample journey first.</p></div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row"><button type="button" onClick={handleGetStarted} aria-label="Get started with REBOUND" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-[#B4F04C] px-6 text-sm font-black text-[#14281D] transition hover:bg-[#C6F76B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4F04C]/60">Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" /></button><button type="button" onClick={handleTryDemo} aria-label="Try the REBOUND demo" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-[#45664F] px-6 text-sm font-black text-white transition hover:border-[#B4F04C] hover:text-[#B4F04C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4F04C]/50">Try Demo <CirclePlay className="h-4 w-4" aria-hidden="true" /></button></div>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-5 pb-8 text-xs font-medium text-[#8A998E] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><span>REBOUND · Hackathon prototype · Local browser storage; no secure accounts or cloud sync.</span><button type="button" onClick={handleGetStarted} className="text-left font-bold text-[#6C9429] hover:text-[#14281D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4F04C] cursor-pointer">Build your curriculum when you’re ready <ArrowRight className="ml-1 inline h-3 w-3" aria-hidden="true" /></button></footer>
    </div>
  );
};
