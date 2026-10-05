import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export type AuthStatus =
  | 'initializing'   // Checking stored session
  | 'unauthenticated' // No user
  | 'authenticated'; // Verified user

export interface AuthUser {
  id: string;           // Supabase UUID – stable, unique, never email
  email: string | null; // From Google profile
  displayName: string | null;
  avatarUrl: string | null;
  provider: 'google' | 'anonymous' | 'unknown';
}

interface AuthContextType {
  status: AuthStatus;
  user: AuthUser | null;
  session: Session | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  isCloudEnabled: boolean; // true when Supabase is configured
}

const AuthContext = createContext<AuthContextType | null>(null);

function toAuthUser(user: User): AuthUser {
  const provider =
    user.app_metadata?.provider === 'google'
      ? 'google'
      : user.app_metadata?.provider === 'anonymous'
      ? 'anonymous'
      : 'unknown';

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    null;

  const avatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;

  return {
    id: user.id,
    email: user.email ?? null,
    displayName,
    avatarUrl,
    provider,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const initialized = useRef(false);

  const isCloudEnabled = isSupabaseConfigured();

  // Restore existing session on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (!supabase) {
      // No Supabase config – operate in local-only mode
      setStatus('unauthenticated');
      return;
    }

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (existingSession?.user) {
        setSession(existingSession);
        setUser(toAuthUser(existingSession.user));
        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
      }
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (newSession?.user) {
          setSession(newSession);
          setUser(toAuthUser(newSession.user));
          setStatus('authenticated');
          setAuthError(null);
        } else {
          setSession(null);
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      setAuthError('Cloud authentication is not configured for this deployment.');
      return;
    }
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) {
      const authErr = error as AuthError;
      setAuthError(authErr.message || 'Google sign-in failed. Please try again.');
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        session,
        signInWithGoogle,
        signOut,
        authError,
        isCloudEnabled,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
