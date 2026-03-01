-- ============================================================
-- MIGRATION 004: Row Level Security Policies
-- Deny by default. Elke tabel heeft RLS enabled.
-- Inclusief RT-009 en RT-010 fixes (rol-escalatie preventie)
-- ============================================================

-- Helper function: haal rol op van huidige gebruiker
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT rol FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: haal afdeling_id op van huidige gebruiker
CREATE OR REPLACE FUNCTION public.get_user_department_id()
RETURNS UUID AS $$
  SELECT afdeling_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: is huidige gebruiker admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: is huidige gebruiker manager?
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND rol = 'manager'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================
-- USERS tabel
-- ============================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Admin: volledig
CREATE POLICY "admin_full_access_users"
  ON public.users FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Manager: lees eigen afdeling
CREATE POLICY "manager_read_department_users"
  ON public.users FOR SELECT
  USING (
    public.is_manager()
    AND afdeling_id = public.get_user_department_id()
  );

-- Manager: kan eigen profiel updaten (ALLEEN naam -- RT-010 fix: rol/afdeling niet wijzigbaar)
CREATE POLICY "manager_update_own_profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id AND rol = 'manager')
  WITH CHECK (
    auth.uid() = id
    AND rol = (SELECT rol FROM public.users WHERE id = auth.uid())
    AND afdeling_id IS NOT DISTINCT FROM (SELECT afdeling_id FROM public.users WHERE id = auth.uid())
  );

-- Medewerker: lees eigen profiel
CREATE POLICY "employee_read_own_profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Medewerker: update eigen profiel (ALLEEN naam -- RT-009 fix: rol/afdeling niet wijzigbaar)
CREATE POLICY "employee_update_own_profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id AND rol = 'medewerker')
  WITH CHECK (
    auth.uid() = id
    AND rol = 'medewerker'
    AND afdeling_id IS NOT DISTINCT FROM (SELECT afdeling_id FROM public.users WHERE id = auth.uid())
  );

-- ============================
-- DEPARTMENTS tabel
-- ============================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Alle ingelogde users: lees alle afdelingen (nodig voor navigatie)
CREATE POLICY "authenticated_read_departments"
  ON public.departments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admin: volledig beheer
CREATE POLICY "admin_manage_departments"
  ON public.departments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================
-- PILLARS tabel
-- ============================
ALTER TABLE public.pillars ENABLE ROW LEVEL SECURITY;

-- Alle ingelogde users: lees pilaren
CREATE POLICY "authenticated_read_pillars"
  ON public.pillars FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admin: volledig beheer
CREATE POLICY "admin_manage_pillars"
  ON public.pillars FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================
-- GOALS tabel
-- ============================
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Alle ingelogde users: lees alle goals (KPIs zijn bedrijfsbreed zichtbaar)
CREATE POLICY "authenticated_read_goals"
  ON public.goals FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admin: volledig beheer
CREATE POLICY "admin_manage_goals"
  ON public.goals FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================
-- SUB_GOALS tabel
-- ============================
ALTER TABLE public.sub_goals ENABLE ROW LEVEL SECURITY;

-- Admin: volledig
CREATE POLICY "admin_full_access_sub_goals"
  ON public.sub_goals FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Manager: lees en beheer sub-goals van eigen afdeling
CREATE POLICY "manager_read_department_sub_goals"
  ON public.sub_goals FOR SELECT
  USING (
    public.is_manager()
    AND afdeling_id = public.get_user_department_id()
  );

CREATE POLICY "manager_insert_department_sub_goals"
  ON public.sub_goals FOR INSERT
  WITH CHECK (
    public.is_manager()
    AND afdeling_id = public.get_user_department_id()
    AND aangemaakt_door = auth.uid()
  );

CREATE POLICY "manager_update_department_sub_goals"
  ON public.sub_goals FOR UPDATE
  USING (
    public.is_manager()
    AND afdeling_id = public.get_user_department_id()
  )
  WITH CHECK (
    public.is_manager()
    AND afdeling_id = public.get_user_department_id()
  );

CREATE POLICY "manager_delete_department_sub_goals"
  ON public.sub_goals FOR DELETE
  USING (
    public.is_manager()
    AND afdeling_id = public.get_user_department_id()
  );

-- Medewerker: lees alleen sub-goals waaraan gekoppeld
CREATE POLICY "employee_read_assigned_sub_goals"
  ON public.sub_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sub_goal_assignments
      WHERE sub_goal_id = sub_goals.id
        AND user_id = auth.uid()
    )
  );

-- ============================
-- SUB_GOAL_ASSIGNMENTS tabel
-- ============================
ALTER TABLE public.sub_goal_assignments ENABLE ROW LEVEL SECURITY;

-- Admin: volledig
CREATE POLICY "admin_full_access_sga"
  ON public.sub_goal_assignments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Manager: beheer assignments van eigen afdeling sub-goals
CREATE POLICY "manager_read_department_sga"
  ON public.sub_goal_assignments FOR SELECT
  USING (
    public.is_manager()
    AND EXISTS (
      SELECT 1 FROM public.sub_goals sg
      WHERE sg.id = sub_goal_assignments.sub_goal_id
        AND sg.afdeling_id = public.get_user_department_id()
    )
  );

CREATE POLICY "manager_insert_department_sga"
  ON public.sub_goal_assignments FOR INSERT
  WITH CHECK (
    public.is_manager()
    AND EXISTS (
      SELECT 1 FROM public.sub_goals sg
      WHERE sg.id = sub_goal_assignments.sub_goal_id
        AND sg.afdeling_id = public.get_user_department_id()
    )
  );

CREATE POLICY "manager_delete_department_sga"
  ON public.sub_goal_assignments FOR DELETE
  USING (
    public.is_manager()
    AND EXISTS (
      SELECT 1 FROM public.sub_goals sg
      WHERE sg.id = sub_goal_assignments.sub_goal_id
        AND sg.afdeling_id = public.get_user_department_id()
    )
  );

-- Medewerker: lees eigen assignments
CREATE POLICY "employee_read_own_sga"
  ON public.sub_goal_assignments FOR SELECT
  USING (user_id = auth.uid());

-- ============================
-- MONTHLY_TARGETS tabel
-- ============================
ALTER TABLE public.monthly_targets ENABLE ROW LEVEL SECURITY;

-- Alle ingelogde users: lees (nodig voor scoring berekening)
CREATE POLICY "authenticated_read_monthly_targets"
  ON public.monthly_targets FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admin: volledig beheer
CREATE POLICY "admin_manage_monthly_targets"
  ON public.monthly_targets FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================
-- KPI_ENTRIES tabel
-- ============================
ALTER TABLE public.kpi_entries ENABLE ROW LEVEL SECURITY;

-- Admin: volledig
CREATE POLICY "admin_full_access_kpi_entries"
  ON public.kpi_entries FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Manager: lees entries van teamleden in eigen afdeling
CREATE POLICY "manager_read_department_entries"
  ON public.kpi_entries FOR SELECT
  USING (
    public.is_manager()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = kpi_entries.user_id
        AND u.afdeling_id = public.get_user_department_id()
    )
  );

-- Manager: schrijf entries namens teamleden
CREATE POLICY "manager_insert_department_entries"
  ON public.kpi_entries FOR INSERT
  WITH CHECK (
    public.is_manager()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = kpi_entries.user_id
        AND u.afdeling_id = public.get_user_department_id()
    )
    AND ingevoerd_door = auth.uid()
  );

-- Medewerker: lees eigen entries
CREATE POLICY "employee_read_own_entries"
  ON public.kpi_entries FOR SELECT
  USING (user_id = auth.uid());

-- Medewerker: schrijf eigen entries
CREATE POLICY "employee_insert_own_entries"
  ON public.kpi_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Medewerker: update eigen entries (correcties, max 30 dagen - enforced in app)
CREATE POLICY "employee_update_own_entries"
  ON public.kpi_entries FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================
-- WEEKLY_CHECKINS tabel
-- ============================
ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;

-- Admin: volledig
CREATE POLICY "admin_full_access_checkins"
  ON public.weekly_checkins FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Manager: lees check-ins van teamleden (read-only)
CREATE POLICY "manager_read_department_checkins"
  ON public.weekly_checkins FOR SELECT
  USING (
    public.is_manager()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = weekly_checkins.user_id
        AND u.afdeling_id = public.get_user_department_id()
    )
  );

-- Medewerker: lees eigen check-ins
CREATE POLICY "employee_read_own_checkins"
  ON public.weekly_checkins FOR SELECT
  USING (user_id = auth.uid());

-- Medewerker: schrijf eigen check-ins
CREATE POLICY "employee_insert_own_checkins"
  ON public.weekly_checkins FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Medewerker: update eigen check-ins
CREATE POLICY "employee_update_own_checkins"
  ON public.weekly_checkins FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================
-- PERIODS tabel
-- ============================
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;

-- Alle ingelogde users: lees
CREATE POLICY "authenticated_read_periods"
  ON public.periods FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admin: volledig beheer
CREATE POLICY "admin_manage_periods"
  ON public.periods FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================
-- SCORE_CACHE tabel
-- ============================
ALTER TABLE public.score_cache ENABLE ROW LEVEL SECURITY;

-- Admin/Manager: lees alle scores
CREATE POLICY "admin_manager_read_score_cache"
  ON public.score_cache FOR SELECT
  USING (public.is_admin() OR public.is_manager());

-- Medewerker: lees alleen geaggregeerde scores (goal/pillar/company)
-- en sub_goal scores waaraan ze zijn toegewezen (RT-029 privacy fix)
CREATE POLICY "employee_read_score_cache"
  ON public.score_cache FOR SELECT
  USING (
    entity_type IN ('goal', 'pillar', 'company')
    OR (
      entity_type = 'sub_goal'
      AND EXISTS (
        SELECT 1 FROM public.sub_goal_assignments
        WHERE sub_goal_id = score_cache.entity_id
          AND user_id = auth.uid()
      )
    )
  );

-- Admin: volledig beheer (voor herberekening)
CREATE POLICY "admin_manage_score_cache"
  ON public.score_cache FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
