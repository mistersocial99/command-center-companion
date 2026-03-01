-- ============================================================
-- MIGRATION 005: Seed Data
-- 5 pilaren + 24 KPIs + 6 afdelingen + periods 2026
-- Idempotent: ON CONFLICT DO NOTHING / DO UPDATE
-- ============================================================

-- ---------------------
-- PILAREN
-- ---------------------
INSERT INTO public.pillars (id, naam, code, gewicht_pct, eigenaar, volgorde) VALUES
  ('11111111-1111-1111-1111-111111111101', '5★ Klantbeleving', 'P1', 20, 'CS + Ops', 1),
  ('11111111-1111-1111-1111-111111111102', '€100M Groeimachine', 'P2', 20, 'Sales Lead', 2),
  ('11111111-1111-1111-1111-111111111103', 'Operationeel Meesterwerk', 'P3', 20, 'Daisy (Ops)', 3),
  ('11111111-1111-1111-1111-111111111104', 'Allround Verduurzamingspartner', 'P4', 20, 'Marketing + Sales', 4),
  ('11111111-1111-1111-1111-111111111105', 'High Performance Team', 'P5', 20, 'Roy + alle leidinggevenden', 5)
ON CONFLICT (code) DO UPDATE SET
  naam = EXCLUDED.naam,
  gewicht_pct = EXCLUDED.gewicht_pct,
  eigenaar = EXCLUDED.eigenaar,
  volgorde = EXCLUDED.volgorde;

-- ---------------------
-- AFDELINGEN
-- ---------------------
INSERT INTO public.departments (id, naam) VALUES
  ('22222222-2222-2222-2222-222222222201', 'Sales'),
  ('22222222-2222-2222-2222-222222222202', 'Product Delivery'),
  ('22222222-2222-2222-2222-222222222203', 'Recruitment / HR'),
  ('22222222-2222-2222-2222-222222222204', 'Finance'),
  ('22222222-2222-2222-2222-222222222205', 'Marketing & Growth'),
  ('22222222-2222-2222-2222-222222222206', 'IT & Automations')
ON CONFLICT (naam) DO NOTHING;

-- ---------------------
-- GOALS (24 KPIs)
-- ---------------------

-- P1 — 5★ Klantbeleving (5 KPIs x 20%)
INSERT INTO public.goals (id, pillar_id, naam, type, jaardoel, jaardoel_tekst, gewicht_pct, kpi_code, afdeling_ids, volgorde) VALUES
  ('33333333-3333-3333-3333-333333333301',
   '11111111-1111-1111-1111-111111111101',
   'Google Reviews volume', 'volume', 1000, '1000 reviews', 20, '1.1',
   ARRAY['22222222-2222-2222-2222-222222222205']::uuid[], 1),

  ('33333333-3333-3333-3333-333333333302',
   '11111111-1111-1111-1111-111111111101',
   'NPS Score', 'norm', 70, '>=70', 20, '1.2',
   ARRAY['22222222-2222-2222-2222-222222222205']::uuid[], 2),

  ('33333333-3333-3333-3333-333333333303',
   '11111111-1111-1111-1111-111111111101',
   'Reactietijd <24u', 'norm', 95, '>=95%', 20, '1.3',
   ARRAY['22222222-2222-2222-2222-222222222202']::uuid[], 3),

  ('33333333-3333-3333-3333-333333333304',
   '11111111-1111-1111-1111-111111111101',
   'Klachtenratio', 'ratio_lager_beter', 5, '<=5%', 20, '1.4',
   ARRAY['22222222-2222-2222-2222-222222222202']::uuid[], 4),

  ('33333333-3333-3333-3333-333333333305',
   '11111111-1111-1111-1111-111111111101',
   'Referral ratio', 'ratio', 15, '>=15%', 20, '1.5',
   ARRAY['22222222-2222-2222-2222-222222222201']::uuid[], 5)
ON CONFLICT (kpi_code) DO UPDATE SET
  naam = EXCLUDED.naam, type = EXCLUDED.type, jaardoel = EXCLUDED.jaardoel,
  jaardoel_tekst = EXCLUDED.jaardoel_tekst, gewicht_pct = EXCLUDED.gewicht_pct,
  afdeling_ids = EXCLUDED.afdeling_ids, volgorde = EXCLUDED.volgorde;

-- P2 — €100M Groeimachine (6 KPIs: 17+17+17+17+16+16=100)
INSERT INTO public.goals (id, pillar_id, naam, type, jaardoel, jaardoel_tekst, gewicht_pct, kpi_code, afdeling_ids, volgorde) VALUES
  ('33333333-3333-3333-3333-333333333306',
   '11111111-1111-1111-1111-111111111102',
   'Sales volume', 'volume', 8000, '8000 deals', 17, '2.1',
   ARRAY['22222222-2222-2222-2222-222222222201']::uuid[], 1),

  ('33333333-3333-3333-3333-333333333307',
   '11111111-1111-1111-1111-111111111102',
   'Omzet (EUR)', 'waarde', 100000000, 'EUR100M', 17, '2.2',
   ARRAY['22222222-2222-2222-2222-222222222201','22222222-2222-2222-2222-222222222204']::uuid[], 2),

  ('33333333-3333-3333-3333-333333333308',
   '11111111-1111-1111-1111-111111111102',
   'Conversieratio', 'ratio', 40, '40%', 17, '2.3',
   ARRAY['22222222-2222-2222-2222-222222222201']::uuid[], 3),

  ('33333333-3333-3333-3333-333333333309',
   '11111111-1111-1111-1111-111111111102',
   'Opkomstratio', 'ratio', 70, '70%', 17, '2.4',
   ARRAY['22222222-2222-2222-2222-222222222201']::uuid[], 4),

  ('33333333-3333-3333-3333-333333333310',
   '11111111-1111-1111-1111-111111111102',
   'Gemiddelde orderwaarde', 'ratio', 12500, 'EUR12.500', 16, '2.5',
   ARRAY['22222222-2222-2222-2222-222222222201']::uuid[], 5),

  ('33333333-3333-3333-3333-333333333311',
   '11111111-1111-1111-1111-111111111102',
   'Steady closers', 'volume', NULL, 'NTB per kwartaal', 16, '2.6',
   ARRAY['22222222-2222-2222-2222-222222222203']::uuid[], 6)
ON CONFLICT (kpi_code) DO UPDATE SET
  naam = EXCLUDED.naam, type = EXCLUDED.type, jaardoel = EXCLUDED.jaardoel,
  jaardoel_tekst = EXCLUDED.jaardoel_tekst, gewicht_pct = EXCLUDED.gewicht_pct,
  afdeling_ids = EXCLUDED.afdeling_ids, volgorde = EXCLUDED.volgorde;

-- P3 — Operationeel Meesterwerk (6 KPIs: 17+17+17+17+16+16=100)
INSERT INTO public.goals (id, pillar_id, naam, type, jaardoel, jaardoel_tekst, gewicht_pct, kpi_code, afdeling_ids, volgorde) VALUES
  ('33333333-3333-3333-3333-333333333312',
   '11111111-1111-1111-1111-111111111103',
   'Doorlooptijd klantreis', 'tijd_lager_beter', NULL, 'NTB dagen (B1)', 17, '3.1',
   ARRAY['22222222-2222-2222-2222-222222222202','22222222-2222-2222-2222-222222222204']::uuid[], 1),

  ('33333333-3333-3333-3333-333333333313',
   '11111111-1111-1111-1111-111111111103',
   'Annuleringsratio', 'ratio_lager_beter', 10, '<=10%', 17, '3.2',
   ARRAY['22222222-2222-2222-2222-222222222202']::uuid[], 2),

  ('33333333-3333-3333-3333-333333333314',
   '11111111-1111-1111-1111-111111111103',
   'Installatie 1x goed', 'norm', 95, '>=95%', 17, '3.3',
   ARRAY['22222222-2222-2222-2222-222222222202']::uuid[], 3),

  ('33333333-3333-3333-3333-333333333315',
   '11111111-1111-1111-1111-111111111103',
   'Incomplete dossiers %', 'ratio_lager_beter', NULL, 'NTB', 17, '3.4',
   ARRAY['22222222-2222-2222-2222-222222222202']::uuid[], 4),

  ('33333333-3333-3333-3333-333333333316',
   '11111111-1111-1111-1111-111111111103',
   'Buitendienst annulering %', 'ratio_lager_beter', 30, '<=30%', 16, '3.5',
   ARRAY['22222222-2222-2222-2222-222222222202']::uuid[], 5),

  ('33333333-3333-3333-3333-333333333317',
   '11111111-1111-1111-1111-111111111103',
   'CRM adoptie %', 'norm', 100, '100%', 16, '3.6',
   ARRAY['22222222-2222-2222-2222-222222222206']::uuid[], 6)
ON CONFLICT (kpi_code) DO UPDATE SET
  naam = EXCLUDED.naam, type = EXCLUDED.type, jaardoel = EXCLUDED.jaardoel,
  jaardoel_tekst = EXCLUDED.jaardoel_tekst, gewicht_pct = EXCLUDED.gewicht_pct,
  afdeling_ids = EXCLUDED.afdeling_ids, volgorde = EXCLUDED.volgorde;

-- P4 — Allround Verduurzamingspartner (5 KPIs x 20%)
INSERT INTO public.goals (id, pillar_id, naam, type, jaardoel, jaardoel_tekst, gewicht_pct, kpi_code, afdeling_ids, volgorde) VALUES
  ('33333333-3333-3333-3333-333333333318',
   '11111111-1111-1111-1111-111111111104',
   'Cross-sell ratio', 'ratio', 75, '>=75%', 20, '4.1',
   ARRAY['22222222-2222-2222-2222-222222222201']::uuid[], 1),

  ('33333333-3333-3333-3333-333333333319',
   '11111111-1111-1111-1111-111111111104',
   'Productmix — 4 actieve lijnen', 'mijlpaal', 4, '4 lijnen winstgevend', 20, '4.2',
   ARRAY['22222222-2222-2222-2222-222222222205']::uuid[], 2),

  ('33333333-3333-3333-3333-333333333320',
   '11111111-1111-1111-1111-111111111104',
   'Google organische positie', 'mijlpaal', 1, 'Pagina 1 thuisbatterij', 20, '4.3',
   ARRAY['22222222-2222-2222-2222-222222222205']::uuid[], 3),

  ('33333333-3333-3333-3333-333333333321',
   '11111111-1111-1111-1111-111111111104',
   'Organisch websiteverkeer', 'volume', NULL, 'NTB', 20, '4.4',
   ARRAY['22222222-2222-2222-2222-222222222205']::uuid[], 4),

  ('33333333-3333-3333-3333-333333333322',
   '11111111-1111-1111-1111-111111111104',
   'Installatie capaciteit', 'volume', NULL, 'NTB per kwartaal', 20, '4.5',
   ARRAY['22222222-2222-2222-2222-222222222202']::uuid[], 5)
ON CONFLICT (kpi_code) DO UPDATE SET
  naam = EXCLUDED.naam, type = EXCLUDED.type, jaardoel = EXCLUDED.jaardoel,
  jaardoel_tekst = EXCLUDED.jaardoel_tekst, gewicht_pct = EXCLUDED.gewicht_pct,
  afdeling_ids = EXCLUDED.afdeling_ids, volgorde = EXCLUDED.volgorde;

-- P5 — High Performance Team (5 KPIs x 20%)
INSERT INTO public.goals (id, pillar_id, naam, type, jaardoel, jaardoel_tekst, gewicht_pct, kpi_code, afdeling_ids, volgorde) VALUES
  ('33333333-3333-3333-3333-333333333323',
   '11111111-1111-1111-1111-111111111105',
   'Afdelingen met kwartaalplanning', 'norm', 100, '100%', 20, '5.1',
   NULL, 1),

  ('33333333-3333-3333-3333-333333333324',
   '11111111-1111-1111-1111-111111111105',
   'Weekcommitments voltooid', 'ratio', 80, '>=80%', 20, '5.2',
   NULL, 2),

  ('33333333-3333-3333-3333-333333333325',
   '11111111-1111-1111-1111-111111111105',
   'Boardmeetings gehouden', 'volume', 48, '4/mnd = 48/jaar', 20, '5.3',
   NULL, 3),

  ('33333333-3333-3333-3333-333333333326',
   '11111111-1111-1111-1111-111111111105',
   'Performance gesprekken', 'norm', 100, '100% per Q', 20, '5.4',
   ARRAY['22222222-2222-2222-2222-222222222203']::uuid[], 4),

  ('33333333-3333-3333-3333-333333333327',
   '11111111-1111-1111-1111-111111111105',
   'Week check-in adoptie', 'norm', 100, '100%', 20, '5.5',
   ARRAY['22222222-2222-2222-2222-222222222206']::uuid[], 5)
ON CONFLICT (kpi_code) DO UPDATE SET
  naam = EXCLUDED.naam, type = EXCLUDED.type, jaardoel = EXCLUDED.jaardoel,
  jaardoel_tekst = EXCLUDED.jaardoel_tekst, gewicht_pct = EXCLUDED.gewicht_pct,
  afdeling_ids = EXCLUDED.afdeling_ids, volgorde = EXCLUDED.volgorde;

-- ---------------------
-- MONTHLY TARGETS voor KPI 2.1 (Sales volume)
-- ---------------------
INSERT INTO public.monthly_targets (goal_id, maand, target_value) VALUES
  ('33333333-3333-3333-3333-333333333306', '2026-01', 180),
  ('33333333-3333-3333-3333-333333333306', '2026-02', 210),
  ('33333333-3333-3333-3333-333333333306', '2026-03', 210),
  ('33333333-3333-3333-3333-333333333306', '2026-04', 450),
  ('33333333-3333-3333-3333-333333333306', '2026-05', 600),
  ('33333333-3333-3333-3333-333333333306', '2026-06', 750)
ON CONFLICT (goal_id, maand) DO UPDATE SET target_value = EXCLUDED.target_value;

-- ---------------------
-- PERIODS 2026 (maanden + kwartalen + jaar + weken RT-014 fix)
-- ---------------------
INSERT INTO public.periods (type, start_date, end_date, label, jaar) VALUES
  -- Maanden
  ('maand', '2026-01-01', '2026-01-31', 'Januari 2026', 2026),
  ('maand', '2026-02-01', '2026-02-28', 'Februari 2026', 2026),
  ('maand', '2026-03-01', '2026-03-31', 'Maart 2026', 2026),
  ('maand', '2026-04-01', '2026-04-30', 'April 2026', 2026),
  ('maand', '2026-05-01', '2026-05-31', 'Mei 2026', 2026),
  ('maand', '2026-06-01', '2026-06-30', 'Juni 2026', 2026),
  ('maand', '2026-07-01', '2026-07-31', 'Juli 2026', 2026),
  ('maand', '2026-08-01', '2026-08-31', 'Augustus 2026', 2026),
  ('maand', '2026-09-01', '2026-09-30', 'September 2026', 2026),
  ('maand', '2026-10-01', '2026-10-31', 'Oktober 2026', 2026),
  ('maand', '2026-11-01', '2026-11-30', 'November 2026', 2026),
  ('maand', '2026-12-01', '2026-12-31', 'December 2026', 2026),
  -- Kwartalen
  ('kwartaal', '2026-01-01', '2026-03-31', 'Q1 2026', 2026),
  ('kwartaal', '2026-04-01', '2026-06-30', 'Q2 2026', 2026),
  ('kwartaal', '2026-07-01', '2026-09-30', 'Q3 2026', 2026),
  ('kwartaal', '2026-10-01', '2026-12-31', 'Q4 2026', 2026),
  -- Jaar
  ('jaar', '2026-01-01', '2026-12-31', 'Jaar 2026', 2026),
  -- Weken (RT-014 fix: ISO 8601 weken voor 2026)
  -- 2026 begint op donderdag 1 januari, ISO week 1 start op maandag 29 dec 2025
  ('week', '2025-12-29', '2026-01-04', 'Week 1 2026', 2026),
  ('week', '2026-01-05', '2026-01-11', 'Week 2 2026', 2026),
  ('week', '2026-01-12', '2026-01-18', 'Week 3 2026', 2026),
  ('week', '2026-01-19', '2026-01-25', 'Week 4 2026', 2026),
  ('week', '2026-01-26', '2026-02-01', 'Week 5 2026', 2026),
  ('week', '2026-02-02', '2026-02-08', 'Week 6 2026', 2026),
  ('week', '2026-02-09', '2026-02-15', 'Week 7 2026', 2026),
  ('week', '2026-02-16', '2026-02-22', 'Week 8 2026', 2026),
  ('week', '2026-02-23', '2026-03-01', 'Week 9 2026', 2026),
  ('week', '2026-03-02', '2026-03-08', 'Week 10 2026', 2026),
  ('week', '2026-03-09', '2026-03-15', 'Week 11 2026', 2026),
  ('week', '2026-03-16', '2026-03-22', 'Week 12 2026', 2026),
  ('week', '2026-03-23', '2026-03-29', 'Week 13 2026', 2026),
  ('week', '2026-03-30', '2026-04-05', 'Week 14 2026', 2026),
  ('week', '2026-04-06', '2026-04-12', 'Week 15 2026', 2026),
  ('week', '2026-04-13', '2026-04-19', 'Week 16 2026', 2026),
  ('week', '2026-04-20', '2026-04-26', 'Week 17 2026', 2026),
  ('week', '2026-04-27', '2026-05-03', 'Week 18 2026', 2026),
  ('week', '2026-05-04', '2026-05-10', 'Week 19 2026', 2026),
  ('week', '2026-05-11', '2026-05-17', 'Week 20 2026', 2026),
  ('week', '2026-05-18', '2026-05-24', 'Week 21 2026', 2026),
  ('week', '2026-05-25', '2026-05-31', 'Week 22 2026', 2026),
  ('week', '2026-06-01', '2026-06-07', 'Week 23 2026', 2026),
  ('week', '2026-06-08', '2026-06-14', 'Week 24 2026', 2026),
  ('week', '2026-06-15', '2026-06-21', 'Week 25 2026', 2026),
  ('week', '2026-06-22', '2026-06-28', 'Week 26 2026', 2026),
  ('week', '2026-06-29', '2026-07-05', 'Week 27 2026', 2026),
  ('week', '2026-07-06', '2026-07-12', 'Week 28 2026', 2026),
  ('week', '2026-07-13', '2026-07-19', 'Week 29 2026', 2026),
  ('week', '2026-07-20', '2026-07-26', 'Week 30 2026', 2026),
  ('week', '2026-07-27', '2026-08-02', 'Week 31 2026', 2026),
  ('week', '2026-08-03', '2026-08-09', 'Week 32 2026', 2026),
  ('week', '2026-08-10', '2026-08-16', 'Week 33 2026', 2026),
  ('week', '2026-08-17', '2026-08-23', 'Week 34 2026', 2026),
  ('week', '2026-08-24', '2026-08-30', 'Week 35 2026', 2026),
  ('week', '2026-08-31', '2026-09-06', 'Week 36 2026', 2026),
  ('week', '2026-09-07', '2026-09-13', 'Week 37 2026', 2026),
  ('week', '2026-09-14', '2026-09-20', 'Week 38 2026', 2026),
  ('week', '2026-09-21', '2026-09-27', 'Week 39 2026', 2026),
  ('week', '2026-09-28', '2026-10-04', 'Week 40 2026', 2026),
  ('week', '2026-10-05', '2026-10-11', 'Week 41 2026', 2026),
  ('week', '2026-10-12', '2026-10-18', 'Week 42 2026', 2026),
  ('week', '2026-10-19', '2026-10-25', 'Week 43 2026', 2026),
  ('week', '2026-10-26', '2026-11-01', 'Week 44 2026', 2026),
  ('week', '2026-11-02', '2026-11-08', 'Week 45 2026', 2026),
  ('week', '2026-11-09', '2026-11-15', 'Week 46 2026', 2026),
  ('week', '2026-11-16', '2026-11-22', 'Week 47 2026', 2026),
  ('week', '2026-11-23', '2026-11-29', 'Week 48 2026', 2026),
  ('week', '2026-11-30', '2026-12-06', 'Week 49 2026', 2026),
  ('week', '2026-12-07', '2026-12-13', 'Week 50 2026', 2026),
  ('week', '2026-12-14', '2026-12-20', 'Week 51 2026', 2026),
  ('week', '2026-12-21', '2026-12-27', 'Week 52 2026', 2026),
  ('week', '2026-12-28', '2027-01-03', 'Week 53 2026', 2026)
ON CONFLICT DO NOTHING;
