import React, { useState } from 'react';
import { LogIn, LogOut, User, Cloud, CloudOff, Loader2, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface GoogleSignInButtonProps {
  variant?: 'full' | 'compact' | 'icon';
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  variant = 'full',
  className = '',
}) => {
  const { status, user, signInWithGoogle, signOut, authError, isCloudEnabled } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!isCloudEnabled) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs ${className}`}
        title="Cloud persistence not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable."
      >
        <CloudOff className="w-4 h-4 shrink-0" />
        {variant !== 'icon' && <span className="font-medium">Local only</span>}
      </div>
    );
  }

  if (status === 'initializing') {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 text-gray-400 text-xs ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        {variant !== 'icon' && <span>Loading…</span>}
      </div>
    );
  }

  if (status === 'authenticated' && user) {
    const initials = user.displayName
      ? Array.from(user.displayName.split(' ').filter(Boolean).slice(0, 2), (p) => p[0]).join('').toUpperCase()
      : (user.email?.[0] ?? '?').toUpperCase();

    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#14281D] text-white hover:bg-[#1e3a2a] transition-colors text-xs font-medium"
          aria-label="Account menu"
          aria-expanded={isDropdownOpen}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName ?? 'User avatar'}
              className="w-6 h-6 rounded-full object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#B4F04C] text-[#14281D] flex items-center justify-center text-[10px] font-bold shrink-0">
              {initials}
            </div>
          )}
          {variant !== 'icon' && (
            <>
              <span className="max-w-[120px] truncate">
                {user.displayName ?? user.email ?? 'Signed in'}
              </span>
              <ChevronDown className="w-3 h-3 shrink-0 opacity-70" />
            </>
          )}
          <Cloud className="w-3.5 h-3.5 text-[#B4F04C] shrink-0" />
        </button>

        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
              aria-hidden="true"
            />
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-4 bg-[#14281D] text-white">
                <div className="flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#B4F04C] text-[#14281D] flex items-center justify-center text-sm font-bold">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">
                      {user.displayName ?? 'Student'}
                    </p>
                    <p className="text-xs text-[#9BB0A3] truncate">{user.email}</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Progress syncing to cloud</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setIsDropdownOpen(false);
                    await signOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Unauthenticated
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <button
        type="button"
        onClick={signInWithGoogle}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm text-gray-700 text-xs font-semibold transition-all"
        title="Sign in with Google to sync your progress"
      >
        {/* Google logo SVG */}
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
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
        {variant !== 'icon' && (
          <>
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign in with Google</span>
          </>
        )}
        {variant === 'icon' && <User className="w-3.5 h-3.5" />}
      </button>
      {authError && (
        <div className="flex items-start gap-1.5 text-xs text-red-600 px-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}
    </div>
  );
};
