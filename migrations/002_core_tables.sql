-- ============================================================
-- MIGRATION 002: Core tabellen
-- Voltafy Company Command Center
-- Datum: 2026-02-28
-- ============================================================

-- ---------------------
-- DEPARTMENTS
-- ---------------------
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  naam TEXT NOT NULL UNIQUE,
  manager_id UUID, -- FK wordt later toegevoegd (circular reference)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------
-- USERS (profile tabel)
-- ---------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  naam TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'medewerker'
    CHECK (rol IN ('admin', 'manager', 'medewerker')),
  afdeling_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  is_actief BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexen
CREATE INDEX IF NOT EXISTS idx_users_afdeling_id ON public.users(afdeling_id);
CREATE INDEX IF NOT EXISTS idx_users_rol ON public.users(rol);
CREATE INDEX IF NOT EXISTS idx_users_is_actief ON public.users(is_actief);

-- Nu FK van departments naar users toevoegen
ALTER TABLE public.departments
  ADD CONSTRAINT fk_departments_manager
  FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- ---------------------
-- PILLARS
-- ---------------------
CREATE TABLE IF NOT EXISTS public.pillars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  naam TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- 'P1', 'P2', etc.
  gewicht_pct INTEGER NOT NULL DEFAULT 20
    CHECK (gewicht_pct BETWEEN 1 AND 100),
  eigenaar TEXT,
  volgorde INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_pillars_updated_at
  BEFORE UPDATE ON public.pillars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ---------------------
-- GOALS (kern-KPIs)
-- ---------------------
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pillar_id UUID NOT NULL REFERENCES public.pillars(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  type TEXT NOT NULL
    CHECK (type IN ('volume', 'waarde', 'ratio', 'ratio_lager_beter', 'norm', 'tijd_lager_beter', 'mijlpaal')),
  jaardoel NUMERIC,
  jaardoel_tekst TEXT,
  gewicht_pct INTEGER NOT NULL DEFAULT 0
    CHECK (gewicht_pct BETWEEN 0 AND 100),
  kpi_code TEXT UNIQUE,
  afdeling_ids UUID[],
  volgorde INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexen
CREATE INDEX IF NOT EXISTS idx_goals_pillar_id ON public.goals(pillar_id);
CREATE INDEX IF NOT EXISTS idx_goals_kpi_code ON public.goals(kpi_code);
CREATE INDEX IF NOT EXISTS idx_goals_afdeling_ids ON public.goals USING GIN(afdeling_ids);

-- ---------------------
-- SUB_GOALS (sub-KPIs)
-- ---------------------
CREATE TABLE IF NOT EXISTS public.sub_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  titel TEXT NOT NULL
    CHECK (char_length(titel) <= 100),
  type TEXT NOT NULL
    CHECK (type IN ('volume', 'waarde', 'ratio', 'ratio_lager_beter', 'norm', 'tijd_lager_beter', 'mijlpaal')),
  gewicht_pct INTEGER NOT NULL
    CHECK (gewicht_pct BETWEEN 1 AND 100),
  target_value NUMERIC,
  target_tekst TEXT,
  frequency TEXT NOT NULL
    CHECK (frequency IN ('dagelijks', 'wekelijks', 'maandelijks')),
  afdeling_id UUID NOT NULL REFERENCES public.departments(id),
  aangemaakt_door UUID NOT NULL REFERENCES public.users(id),
  is_actief BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_sub_goals_updated_at
  BEFORE UPDATE ON public.sub_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexen
CREATE INDEX IF NOT EXISTS idx_sub_goals_goal_id ON public.sub_goals(goal_id);
CREATE INDEX IF NOT EXISTS idx_sub_goals_afdeling_id ON public.sub_goals(afdeling_id);
CREATE INDEX IF NOT EXISTS idx_sub_goals_is_actief ON public.sub_goals(is_actief);

-- ---------------------
-- SUB_GOAL_ASSIGNMENTS (koppeltabel)
-- ---------------------
CREATE TABLE IF NOT EXISTS public.sub_goal_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_goal_id UUID NOT NULL REFERENCES public.sub_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(sub_goal_id, user_id)
);

-- Indexen
CREATE INDEX IF NOT EXISTS idx_sga_sub_goal_id ON public.sub_goal_assignments(sub_goal_id);
CREATE INDEX IF NOT EXISTS idx_sga_user_id ON public.sub_goal_assignments(user_id);

-- ---------------------
-- MONTHLY_TARGETS
-- ---------------------
CREATE TABLE IF NOT EXISTS public.monthly_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  maand TEXT NOT NULL, -- 'YYYY-MM'
  target_value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(goal_id, maand)
);

CREATE TRIGGER set_monthly_targets_updated_at
  BEFORE UPDATE ON public.monthly_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_monthly_targets_goal_id ON public.monthly_targets(goal_id);

-- ---------------------
-- KPI_ENTRIES (data invoer)
-- ---------------------
CREATE TABLE IF NOT EXISTS public.kpi_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_goal_id UUID NOT NULL REFERENCES public.sub_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  periode TEXT NOT NULL, -- 'YYYY-MM-DD', 'YYYY-WNN', 'YYYY-MM'
  waarde NUMERIC NOT NULL,
  notitie TEXT,
  ingevoerd_door UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(sub_goal_id, user_id, periode)
);

CREATE TRIGGER set_kpi_entries_updated_at
  BEFORE UPDATE ON public.kpi_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexen
CREATE INDEX IF NOT EXISTS idx_kpi_entries_sub_goal_id ON public.kpi_entries(sub_goal_id);
CREATE INDEX IF NOT EXISTS idx_kpi_entries_user_id ON public.kpi_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_kpi_entries_periode ON public.kpi_entries(periode);
CREATE INDEX IF NOT EXISTS idx_kpi_entries_sub_goal_periode ON public.kpi_entries(sub_goal_id, periode);

-- ---------------------
-- WEEKLY_CHECKINS
-- ---------------------
CREATE TABLE IF NOT EXISTS public.weekly_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week TEXT NOT NULL, -- 'YYYY-WNN'
  maandag_plan TEXT[], -- max 5 items
  vrijdag_review TEXT,
  score_eigen NUMERIC CHECK (score_eigen IS NULL OR (score_eigen >= 0 AND score_eigen <= 100)),
  is_plan_ingevoerd BOOLEAN DEFAULT FALSE NOT NULL,
  is_review_ingevoerd BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, week)
);

CREATE TRIGGER set_weekly_checkins_updated_at
  BEFORE UPDATE ON public.weekly_checkins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexen
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_user_id ON public.weekly_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_week ON public.weekly_checkins(week);

-- ---------------------
-- PERIODS (lookup tabel)
-- ---------------------
CREATE TABLE IF NOT EXISTS public.periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL
    CHECK (type IN ('dag', 'week', 'maand', 'kwartaal', 'jaar')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  label TEXT NOT NULL,
  jaar INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(type, start_date) -- RT-015 fix: voorkomt dubbele periods bij herhaald seeden
);

-- Indexen
CREATE INDEX IF NOT EXISTS idx_periods_type ON public.periods(type);
CREATE INDEX IF NOT EXISTS idx_periods_jaar ON public.periods(jaar);
CREATE INDEX IF NOT EXISTS idx_periods_type_jaar ON public.periods(type, jaar);

-- ---------------------
-- SCORE_CACHE
-- ---------------------
CREATE TABLE IF NOT EXISTS public.score_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL
    CHECK (entity_type IN ('sub_goal', 'goal', 'pillar', 'company')),
  entity_id UUID NOT NULL,
  periode TEXT NOT NULL,
  score NUMERIC NOT NULL,
  traffic_light TEXT NOT NULL DEFAULT 'geen_data'
    CHECK (traffic_light IN ('groen', 'oranje', 'rood', 'geen_data')),
  berekend_op TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(entity_type, entity_id, periode)
);

-- Indexen
CREATE INDEX IF NOT EXISTS idx_score_cache_entity ON public.score_cache(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_score_cache_periode ON public.score_cache(periode);
CREATE INDEX IF NOT EXISTS idx_score_cache_traffic_light ON public.score_cache(traffic_light);
