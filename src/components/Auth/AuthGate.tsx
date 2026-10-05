import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  FileCheck2,
  Target,
  MessageCircle,
  LineChart,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
  BarChart3,
  BookOpen,
  Play,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─── Google logo SVG ───────────────────────────────────────────────────────────
const GoogleLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// ─── Feature tiles shown below the sign-in card ───────────────────────────────
const features = [
  { label: 'Test Analysis', icon: FileCheck2 },
  { label: 'Recovery Plans', icon: Target },
  { label: 'AI Coach', icon: MessageCircle },
  { label: 'Topic Trends', icon: LineChart },
  { label: 'Performance Analytics', icon: BarChart3 },
  { label: 'Curriculum Mapping', icon: BookOpen },
  { label: 'Practice Quizzes', icon: Play },
  { label: 'Progress Tracking', icon: TrendingUp },
];

// ─── AuthGate ─────────────────────────────────────────────────────────────────
// Full-screen gate rendered when authentication is required (e.g. after clicking
// "Get Started" from the Landing Page while unauthenticated).
// Calls the existing signInWithGoogle from AuthContext.

interface AuthGateProps {
  onBack?: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onBack }) => {
  const { signInWithGoogle, authError, status } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      // signInWithGoogle triggers an OAuth redirect; state updates on return.
      // We intentionally leave isSigningIn=true so the spinner stays during redirect.
      await signInWithGoogle();
    } catch {
      setIsSigningIn(false);
    }
  };

  const isLoading = status === 'initializing' || isSigningIn;

  return (
    <div className="min-h-screen bg-[#FAF6EE] flex flex-col" role="main" aria-label="REBOUND sign-in">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-10 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#14281D] text-[#B4F04C] shadow-lg shadow-[#14281D]/10">
            <TrendingUp className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
          </div>
          <div>
            <span className="block text-lg font-black tracking-[-0.04em] text-[#14281D]">REBOUND</span>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-[#6E8376] sm:block">
              Progress, not pressure
            </span>
          </div>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Welcome Page"
            className="flex items-center gap-1.5 rounded-full border border-[#C9D7CB] bg-white/70 px-4 py-2 text-xs font-black text-[#14281D] shadow-sm transition hover:-translate-y-0.5 hover:border-[#14281D] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4F04C]/60 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        )}
      </header>

      {/* ── Main sign-in card ── */}
      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* Hero card */}
          <div className="relative overflow-hidden rounded-[2rem] bg-[#14281D] px-8 py-10 text-white shadow-2xl shadow-[#14281D]/20 mb-6">
            {/* Decorative glows */}
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#B4F04C]/15 blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[#B4F04C]/10 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              {/* Eyebrow badge */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#2C4A35] bg-[#1E3828] px-3.5 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#B4F04C]" aria-hidden="true" />
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#B4F04C]">
                  Academic Recovery Coach
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl font-black leading-[1.05] tracking-[-0.05em] mb-3">
                Your score is a snapshot.{' '}
                <span className="text-[#B4F04C]">Your progress is the story.</span>
              </h1>
              <p className="text-sm leading-6 text-[#9BB0A3] mb-8">
                Sign in with Google to save your progress to the cloud and access it from any
                device. Your workspace stays private and yours.
              </p>

              {/* Sign-in CTA */}
              <button
                id="auth-gate-google-sign-in"
                type="button"
                onClick={handleSignIn}
                disabled={isLoading}
                aria-busy={isLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white text-[#14281D] font-extrabold text-sm shadow-lg hover:bg-gray-50 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4F04C]/60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                    <span>Connecting…</span>
                  </>
                ) : (
                  <>
                    <GoogleLogo />
                    <span>Continue with Google</span>
                    <ArrowRight className="w-4 h-4 ml-auto shrink-0" aria-hidden="true" />
                  </>
                )}
              </button>

              {/* Auth error */}
              {authError && !isLoading && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-900/30 px-3 py-2.5 text-xs text-red-300"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Privacy reassurance */}
              <p className="mt-5 text-[11px] text-[#6E8376] text-center leading-5">
                <ShieldCheck className="inline w-3.5 h-3.5 mr-1 text-[#B4F04C]" />
                Your data is stored only in your private Supabase workspace.
                No analytics or telemetry collected.
              </p>
            </div>
          </div>

          {/* Feature tiles */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {features.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-[#E2EAE4] bg-white px-3 py-3 text-center shadow-xs hover:-translate-y-0.5 transition-transform"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F0F8DE] text-[#6C9429]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <span className="text-[10px] font-bold text-[#14281D] leading-4">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="px-5 pb-8 text-center text-xs text-[#8A998E] sm:px-8">
        REBOUND · Your progress stays private · Powered by Supabase
      </footer>
    </div>
  );
};
