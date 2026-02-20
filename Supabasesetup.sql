-- ============================================================
-- UMBRELLA RENTAL ITB - SUPABASE SQL SETUP
-- Run this in your Supabase SQL Editor (supabase.com/dashboard)
-- ============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  balance NUMERIC DEFAULT 10000 NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. RENTAL SPOTS TABLE
CREATE TABLE IF NOT EXISTS public.rental_spots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latitude FLOAT8 NOT NULL,
  longitude FLOAT8 NOT NULL,
  umbrellas INT DEFAULT 10
);

ALTER TABLE public.rental_spots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view spots" ON public.rental_spots FOR SELECT USING (true);

-- Seed rental spots
INSERT INTO public.rental_spots (id, name, latitude, longitude, umbrellas) VALUES
  ('spot-1', 'Gerbang SBM',    -6.8892, 107.6094, 10),
  ('spot-2', 'Gerbang Utara',  -6.8897, 107.6117,  8),
  ('spot-3', 'CRCS / CAS',     -6.8898, 107.6155,  6),
  ('spot-4', 'Labtek V',       -6.8927, 107.6103, 12),
  ('spot-5', 'Campus Center',  -6.8935, 107.6118, 15),
  ('spot-6', 'Labtek VIII',    -6.8927, 107.6118, 10),
  ('spot-7', 'SIPIL',          -6.8948, 107.6103,  8),
  ('spot-8', 'Gerbang Selatan',-6.8968, 107.6117, 12)
ON CONFLICT (id) DO NOTHING;

-- 3. RENTALS TABLE
CREATE TABLE IF NOT EXISTS public.rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  spot_id TEXT REFERENCES public.rental_spots(id),
  start_time TIMESTAMPTZ DEFAULT now() NOT NULL,
  end_time TIMESTAMPTZ,
  allowed_duration TEXT NOT NULL,
  extra_charge NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT true NOT NULL
);

ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own rentals"   ON public.rentals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rentals" ON public.rentals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rentals" ON public.rentals FOR UPDATE USING (auth.uid() = user_id);

-- 4. INDEX for fast active rental lookup
CREATE INDEX IF NOT EXISTS idx_rentals_user_active ON public.rentals(user_id, active);

-- ============================================================
-- DONE! Now configure auth:
-- 1. Go to Authentication > Settings
-- 2. Disable "Confirm email" for development (optional)
-- 3. Add your app URL to "Redirect URLs"
-- ============================================================