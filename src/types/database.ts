// Database entity types voor Voltafy CCC
// Gegenereerd op basis van het schema in ccc-architecture.md

import type { ScoringType, TrafficLight, ScoreEntityType } from './scoring';

// =====================
// Row types (SELECT)
// =====================

export interface User {
  id: string;
  email: string;
  naam: string;
  rol: 'admin' | 'manager' | 'medewerker';
  afdeling_id: string | null;
  is_actief: boolean;
  created_at: string;
  updated_at: string;
  // Joined relations
  departments?: Department;
}

export interface Department {
  id: string;
  naam: string;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  manager?: User;
  users?: User[];
}

export interface Pillar {
  id: string;
  naam: string;
  code: string;
  gewicht_pct: number;
  eigenaar: string | null;
  volgorde: number;
  created_at: string;
  updated_at: string;
  // Joined relations
  goals?: Goal[];
}

export interface Goal {
  id: string;
  pillar_id: string;
  naam: string;
  type: ScoringType;
  jaardoel: number | null;
  jaardoel_tekst: string | null;
  gewicht_pct: number;
  kpi_code: string | null;
  afdeling_ids: string[] | null;
  volgorde: number;
  created_at: string;
  updated_at: string;
  // Joined relations
  pillars?: Pillar;
  sub_goals?: SubGoal[];
  monthly_targets?: MonthlyTarget[];
}

export interface SubGoal {
  id: string;
  goal_id: string;
  titel: string;
  type: ScoringType;
  gewicht_pct: number;
  target_value: number | null;
  target_tekst: string | null;
  frequency: 'dagelijks' | 'wekelijks' | 'maandelijks';
  afdeling_id: string;
  aangemaakt_door: string;
  is_actief: boolean;
  created_at: string;
  updated_at: string;
  // Joined relations
  goals?: Goal;
  sub_goal_assignments?: SubGoalAssignment[];
}

export interface SubGoalAssignment {
  id: string;
  sub_goal_id: string;
  user_id: string;
  created_at: string;
  // Joined relations
  users?: User;
  sub_goals?: SubGoal;
}

export interface MonthlyTarget {
  id: string;
  goal_id: string;
  maand: string;
  target_value: number;
  created_at: string;
  updated_at: string;
}

export interface KpiEntry {
  id: string;
  sub_goal_id: string;
  user_id: string;
  periode: string;
  waarde: number;
  notitie: string | null;
  ingevoerd_door: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyCheckin {
  id: string;
  user_id: string;
  week: string;
  maandag_plan: string[] | null;
  vrijdag_review: string | null;
  score_eigen: number | null;
  is_plan_ingevoerd: boolean;
  is_review_ingevoerd: boolean;
  created_at: string;
  updated_at: string;
}

export interface Period {
  id: string;
  type: 'dag' | 'week' | 'maand' | 'kwartaal' | 'jaar';
  start_date: string;
  end_date: string;
  label: string;
  jaar: number;
  created_at: string;
}

export interface ScoreCache {
  id: string;
  entity_type: ScoreEntityType;
  entity_id: string;
  periode: string;
  score: number;
  traffic_light: TrafficLight;
  berekend_op: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// =====================
// Insert types
// =====================

export type UserInsert = Omit<User, 'created_at' | 'updated_at' | 'departments'>;

export type DepartmentInsert = Omit<Department, 'id' | 'created_at' | 'updated_at' | 'manager' | 'users'> & {
  id?: string;
};

export type PillarInsert = Omit<Pillar, 'id' | 'created_at' | 'updated_at' | 'goals'> & {
  id?: string;
};

export type GoalInsert = Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'pillars' | 'sub_goals' | 'monthly_targets'> & {
  id?: string;
};

export type SubGoalInsert = Omit<SubGoal, 'id' | 'created_at' | 'updated_at' | 'goals' | 'sub_goal_assignments'> & {
  id?: string;
};

export type SubGoalAssignmentInsert = Omit<SubGoalAssignment, 'id' | 'created_at' | 'users' | 'sub_goals'> & {
  id?: string;
};

export type MonthlyTargetInsert = Omit<MonthlyTarget, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type KpiEntryInsert = Omit<KpiEntry, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type WeeklyCheckinInsert = Omit<WeeklyCheckin, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type ScoreCacheInsert = Omit<ScoreCache, 'id' | 'created_at'> & {
  id?: string;
};

// =====================
// Update types
// =====================

export type UserUpdate = Partial<Omit<User, 'id' | 'created_at' | 'updated_at' | 'departments'>>;
export type DepartmentUpdate = Partial<Omit<Department, 'id' | 'created_at' | 'updated_at' | 'manager' | 'users'>>;
export type PillarUpdate = Partial<Omit<Pillar, 'id' | 'created_at' | 'updated_at' | 'goals'>>;
export type GoalUpdate = Partial<Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'pillars' | 'sub_goals' | 'monthly_targets'>>;
export type SubGoalUpdate = Partial<Omit<SubGoal, 'id' | 'created_at' | 'updated_at' | 'goals' | 'sub_goal_assignments'>>;
export type MonthlyTargetUpdate = Partial<Omit<MonthlyTarget, 'id' | 'created_at' | 'updated_at'>>;
export type KpiEntryUpdate = Partial<Omit<KpiEntry, 'id' | 'created_at' | 'updated_at'>>;
export type WeeklyCheckinUpdate = Partial<Omit<WeeklyCheckin, 'id' | 'created_at' | 'updated_at'>>;

// =====================
// Utility types
// =====================

export type UserRole = User['rol'];
export type Frequency = SubGoal['frequency'];
export type PeriodType = Period['type'];
