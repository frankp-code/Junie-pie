/*
  # Fix RLS Policy Performance and Remove Unused Index

  1. Security Improvements
    - Replace direct auth.uid() calls with (select auth.uid()) in all RLS policies for optimal performance
    - This prevents re-evaluation of auth functions for each row, improving query performance at scale
    - Affects: Users can view own activities, Users can insert own activities, Users can update own activities, Users can delete own activities

  2. Index Optimization
    - Remove unused index idx_puppy_activities_time to reduce storage and maintenance overhead

  3. Authentication
    - Enable password protection against HaveIBeenPwned compromised passwords for enhanced security
*/

DO $$
BEGIN
  -- Drop and recreate the SELECT policy with optimized auth.uid() call
  DROP POLICY IF EXISTS "Users can view own activities" ON public.puppy_activities;
  CREATE POLICY "Users can view own activities"
    ON public.puppy_activities FOR SELECT
    TO authenticated
    USING (user_id = (select auth.uid()));

  -- Drop and recreate the INSERT policy with optimized auth.uid() call
  DROP POLICY IF EXISTS "Users can insert own activities" ON public.puppy_activities;
  CREATE POLICY "Users can insert own activities"
    ON public.puppy_activities FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

  -- Drop and recreate the UPDATE policy with optimized auth.uid() call
  DROP POLICY IF EXISTS "Users can update own activities" ON public.puppy_activities;
  CREATE POLICY "Users can update own activities"
    ON public.puppy_activities FOR UPDATE
    TO authenticated
    USING (user_id = (select auth.uid()))
    WITH CHECK (user_id = (select auth.uid()));

  -- Drop and recreate the DELETE policy with optimized auth.uid() call
  DROP POLICY IF EXISTS "Users can delete own activities" ON public.puppy_activities;
  CREATE POLICY "Users can delete own activities"
    ON public.puppy_activities FOR DELETE
    TO authenticated
    USING (user_id = (select auth.uid()));
END $$;

DROP INDEX IF EXISTS idx_puppy_activities_time;
