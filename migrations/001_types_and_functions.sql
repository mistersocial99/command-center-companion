-- ============================================================
-- MIGRATION 001: Types, Enums en Utility Functions
-- Voltafy Company Command Center
-- Datum: 2026-02-28
-- Idempotent: ja (IF NOT EXISTS / OR REPLACE)
-- ============================================================

-- Custom types (als TEXT CHECK constraints, niet als ENUM — flexibeler bij wijzigingen)
-- Rollen: 'admin', 'manager', 'medewerker'
-- Scoring types: 'volume', 'waarde', 'ratio', 'ratio_lager_beter', 'norm', 'tijd_lager_beter', 'mijlpaal'
-- Frequenties: 'dagelijks', 'wekelijks', 'maandelijks'
-- Traffic lights: 'groen', 'oranje', 'rood', 'geen_data'
-- Periode types: 'dag', 'week', 'maand', 'kwartaal', 'jaar'
-- Score entity types: 'sub_goal', 'goal', 'pillar', 'company'

-- Utility function: updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Utility function: handle new auth user → create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, naam, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'naam', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'medewerker')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
