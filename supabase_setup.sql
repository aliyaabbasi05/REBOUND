-- ═══════════════════════════════════════════════════════════════════════════
-- REBOUND Cloud Persistence – Supabase Database Setup
-- 
-- Run this SQL in your Supabase project's SQL Editor:
-- https://app.supabase.com → your project → SQL Editor → New Query
-- 
-- This script is IDEMPOTENT (safe to run multiple times).
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 1. Enable Row Level Security extension ───────────────────────────────────
-- (Already enabled in Supabase by default; this is a safety check)


-- ─── 2. student_workspaces table ─────────────────────────────────────────────
-- One row per authenticated user. All student progress lives here.
-- JSONB columns are used for flexibility – the application validates structure.

CREATE TABLE IF NOT EXISTS public.student_workspaces (
  -- Identity: Supabase Auth user UUID. Never the user's email.
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core student data (JSONB for schema flexibility)
  profile               JSONB       NOT NULL DEFAULT '{}',
  subjects              JSONB       NOT NULL DEFAULT '[]',
  test_history          JSONB       NOT NULL DEFAULT '[]',
  curriculums           JSONB       NOT NULL DEFAULT '{}',
  active_recovery_plan  JSONB       NOT NULL DEFAULT '{"topic":"","subject":"","steps":[]}',
  practice_history      JSONB       NOT NULL DEFAULT '[]',
  daily_goal            JSONB,
  nudge_history         JSONB       NOT NULL DEFAULT '[]',
  coach_messages        JSONB       NOT NULL DEFAULT '[]',

  -- Settings
  notifications_enabled BOOLEAN     NOT NULL DEFAULT true,
  nudge_interval_minutes INTEGER    NOT NULL DEFAULT 30,

  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id)
);

-- Comment on table for documentation
COMMENT ON TABLE public.student_workspaces IS
  'Stores all REBOUND student progress, keyed by authenticated user ID. ' ||
  'Each student has exactly one workspace row. ' ||
  'Row Level Security ensures users can only access their own data.';

COMMENT ON COLUMN public.student_workspaces.user_id IS
  'Supabase Auth UUID – stable unique identifier, never the student email.';

COMMENT ON COLUMN public.student_workspaces.test_history IS
  'Array of TestRecord objects – full question-level evidence for each assessment.';

COMMENT ON COLUMN public.student_workspaces.curriculums IS
  'Object keyed by subject name, each value is a SubjectCurriculum.';


-- ─── 3. Trigger: auto-update updated_at on row change ────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.student_workspaces;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.student_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ─── 4. Row Level Security (RLS) ─────────────────────────────────────────────
-- CRITICAL: These policies ensure Student A CANNOT read or write Student B's data.
-- Security is enforced at the database level, not just the frontend.

ALTER TABLE public.student_workspaces ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running this script
DROP POLICY IF EXISTS "Users can select own workspace"  ON public.student_workspaces;
DROP POLICY IF EXISTS "Users can insert own workspace"  ON public.student_workspaces;
DROP POLICY IF EXISTS "Users can update own workspace"  ON public.student_workspaces;
DROP POLICY IF EXISTS "Users can delete own workspace"  ON public.student_workspaces;

-- SELECT: user can only read their own row
CREATE POLICY "Users can select own workspace"
  ON public.student_workspaces
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: user can only insert a row for themselves
CREATE POLICY "Users can insert own workspace"
  ON public.student_workspaces
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: user can only update their own row
CREATE POLICY "Users can update own workspace"
  ON public.student_workspaces
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: user can only delete their own row (used for account deletion)
CREATE POLICY "Users can delete own workspace"
  ON public.student_workspaces
  FOR DELETE
  USING (auth.uid() = user_id);


-- ─── 5. Performance indexes ───────────────────────────────────────────────────

-- Primary key index already exists (user_id).
-- GIN index for JSONB querying (optional, for future server-side queries)
CREATE INDEX IF NOT EXISTS idx_student_workspaces_subjects
  ON public.student_workspaces USING GIN (subjects);

CREATE INDEX IF NOT EXISTS idx_student_workspaces_test_history
  ON public.student_workspaces USING GIN (test_history);


-- ─── 6. Grant permissions to authenticated users ──────────────────────────────
-- Supabase's 'anon' role is for unauthenticated requests (blocked by RLS).
-- 'authenticated' role is for logged-in users.

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.student_workspaces
  TO authenticated;

-- anon users get NO access at all (they must sign in first)
REVOKE ALL ON public.student_workspaces FROM anon;


-- ─── 7. Verify setup ─────────────────────────────────────────────────────────
-- Run this SELECT to confirm the table and policies are in place:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'student_workspaces';
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'student_workspaces';


-- ═══════════════════════════════════════════════════════════════════════════
-- SETUP COMPLETE
-- 
-- Next steps:
-- 1. In Supabase Dashboard → Authentication → Providers → Google:
--    - Enable Google provider
--    - Add your Google OAuth Client ID and Secret
--    - Set authorized redirect URI to: https://your-project.supabase.co/auth/v1/callback
-- 
-- 2. In your Google Cloud Console:
--    - Create OAuth 2.0 credentials
--    - Add authorized redirect URIs including the Supabase callback URL
--    - Add your app's domain to authorized origins
-- 
-- 3. Set these environment variables in your .env file:
--    VITE_SUPABASE_URL=https://your-project.supabase.co
--    VITE_SUPABASE_ANON_KEY=your_anon_key
-- ═══════════════════════════════════════════════════════════════════════════
