-- ============================================================
-- MIGRATION 003: Gewichtsvalidatie triggers
-- Defense in depth: database blokkeert ongeldige gewichten
-- ============================================================

-- Trigger: valideer dat sub_goal gewichten per goal optellen tot max 100%
-- De applicatielaag blokkeert bij ongelijk aan 100%, de database laat
-- tussenliggende waarden toe (bij het aanmaken van de eerste sub-goals)
-- maar blokkeert als het totaal boven 100% komt.
CREATE OR REPLACE FUNCTION public.validate_sub_goal_weights()
RETURNS TRIGGER AS $$
DECLARE
  total_weight INTEGER;
  max_count INTEGER := 10;
  current_count INTEGER;
BEGIN
  -- Check maximum 10 sub-goals per goal
  SELECT COUNT(*) INTO current_count
  FROM public.sub_goals
  WHERE goal_id = COALESCE(NEW.goal_id, OLD.goal_id)
    AND is_actief = TRUE
    AND id != COALESCE(NEW.id, OLD.id);

  IF TG_OP = 'INSERT' AND current_count >= max_count THEN
    RAISE EXCEPTION 'Maximum % sub-KPIs per KPI bereikt', max_count;
  END IF;

  -- Bereken totaal gewicht na wijziging
  IF TG_OP = 'DELETE' THEN
    -- Bij verwijdering: controleer niet (gewicht wordt minder)
    RETURN OLD;
  END IF;

  SELECT COALESCE(SUM(gewicht_pct), 0) INTO total_weight
  FROM public.sub_goals
  WHERE goal_id = NEW.goal_id
    AND is_actief = TRUE
    AND id != NEW.id;

  total_weight := total_weight + NEW.gewicht_pct;

  IF total_weight > 100 THEN
    RAISE EXCEPTION 'Totaal gewicht overschrijdt 100%% — huidige som zou %% worden. Pas gewichten aan.', total_weight;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_sub_goal_weights ON public.sub_goals;
CREATE TRIGGER check_sub_goal_weights
  BEFORE INSERT OR UPDATE ON public.sub_goals
  FOR EACH ROW EXECUTE FUNCTION public.validate_sub_goal_weights();

-- Trigger: valideer dat KPI gewichten per pilaar niet boven 100% komen
CREATE OR REPLACE FUNCTION public.validate_goal_weights()
RETURNS TRIGGER AS $$
DECLARE
  total_weight INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  SELECT COALESCE(SUM(gewicht_pct), 0) INTO total_weight
  FROM public.goals
  WHERE pillar_id = NEW.pillar_id
    AND id != NEW.id;

  total_weight := total_weight + NEW.gewicht_pct;

  IF total_weight > 100 THEN
    RAISE EXCEPTION 'KPI gewichten voor deze pilaar overschrijden 100%% — huidige som zou %% worden.', total_weight;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_goal_weights ON public.goals;
CREATE TRIGGER check_goal_weights
  BEFORE INSERT OR UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.validate_goal_weights();

-- Trigger: valideer dat pilaar gewichten niet boven 100% komen
CREATE OR REPLACE FUNCTION public.validate_pillar_weights()
RETURNS TRIGGER AS $$
DECLARE
  total_weight INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  SELECT COALESCE(SUM(gewicht_pct), 0) INTO total_weight
  FROM public.pillars
  WHERE id != NEW.id;

  total_weight := total_weight + NEW.gewicht_pct;

  IF total_weight > 100 THEN
    RAISE EXCEPTION 'Pilaar gewichten overschrijden 100%% — huidige som zou %% worden.', total_weight;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_pillar_weights ON public.pillars;
CREATE TRIGGER check_pillar_weights
  BEFORE INSERT OR UPDATE ON public.pillars
  FOR EACH ROW EXECUTE FUNCTION public.validate_pillar_weights();

-- Trigger: valideer maandag_plan maximaal 5 items
CREATE OR REPLACE FUNCTION public.validate_maandag_plan_length()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.maandag_plan IS NOT NULL AND array_length(NEW.maandag_plan, 1) > 5 THEN
    RAISE EXCEPTION 'Maandag plan mag maximaal 5 punten bevatten.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_maandag_plan_length ON public.weekly_checkins;
CREATE TRIGGER check_maandag_plan_length
  BEFORE INSERT OR UPDATE ON public.weekly_checkins
  FOR EACH ROW EXECUTE FUNCTION public.validate_maandag_plan_length();
