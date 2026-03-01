// Constanten voor Voltafy CCC

// RT-016 fix: vaste UUID voor company entity in score_cache
export const COMPANY_ENTITY_ID = '00000000-0000-0000-0000-000000000001';

// Traffic light drempels
export const TRAFFIC_LIGHT_THRESHOLDS = {
  GROEN: 90,
  ORANJE: 70,
} as const;

// Scoring caps
export const SCORE_CAPS = {
  VOLUME_WAARDE: 150,
  RATIO: 100,
  NORM: 100,
  MIJLPAAL: 100,
  RATIO_LAGER_BETER: 100,
  TIJD_LAGER_BETER: 100,
} as const;

// Gewichtsvalidatie
export const WEIGHT_LIMITS = {
  MIN: 1,
  MAX: 100,
  TOTAL: 100,
} as const;

// Sub-goal limieten
export const SUB_GOAL_LIMITS = {
  MAX_PER_GOAL: 10,
} as const;

// Weekplan limieten
export const WEEK_PLAN_LIMITS = {
  MAX_ITEMS: 5,
  MIN_ITEM_LENGTH: 5,
  MAX_ITEM_LENGTH: 200,
} as const;

// Review limieten
export const REVIEW_LIMITS = {
  MIN_LENGTH: 10,
  MAX_LENGTH: 500,
} as const;

// KPI entry limieten
export const KPI_ENTRY_LIMITS = {
  MAX_DAYS_BACK: 30,
  MAX_NOTE_LENGTH: 500,
} as const;

// Stale time voor TanStack Query (30 seconden, ADR-004)
export const QUERY_STALE_TIME = 30 * 1000;

// Pilaar seed IDs
export const PILLAR_IDS = {
  P1: '11111111-1111-1111-1111-111111111101',
  P2: '11111111-1111-1111-1111-111111111102',
  P3: '11111111-1111-1111-1111-111111111103',
  P4: '11111111-1111-1111-1111-111111111104',
  P5: '11111111-1111-1111-1111-111111111105',
} as const;

// Afdeling seed IDs
export const DEPARTMENT_IDS = {
  SALES: '22222222-2222-2222-2222-222222222201',
  PRODUCT_DELIVERY: '22222222-2222-2222-2222-222222222202',
  RECRUITMENT_HR: '22222222-2222-2222-2222-222222222203',
  FINANCE: '22222222-2222-2222-2222-222222222204',
  MARKETING_GROWTH: '22222222-2222-2222-2222-222222222205',
  IT_AUTOMATIONS: '22222222-2222-2222-2222-222222222206',
} as const;

// Route paden
export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  ADMIN_USERS: '/admin/users',
  ADMIN_DEPARTMENTS: '/admin/departments',
  ADMIN_KPIS: '/admin/kpis',
  DEPARTMENT: '/department',
  DEPARTMENT_SUB_KPIS: '/department/sub-kpis',
  DEPARTMENT_SUB_KPI_DETAIL: '/department/sub-kpis/:id',
  DEPARTMENT_CHECKINS: '/department/checkins',
  DASHBOARD: '/dashboard',
  DASHBOARD_INPUT: '/dashboard/input',
  DASHBOARD_PLAN: '/dashboard/plan',
  DASHBOARD_REVIEW: '/dashboard/review',
} as const;

// Default route per rol
export function getDefaultRoute(rol: string): string {
  switch (rol) {
    case 'admin':
      return ROUTES.ADMIN_USERS;
    case 'manager':
      return ROUTES.DEPARTMENT;
    case 'medewerker':
      return ROUTES.DASHBOARD;
    default:
      return ROUTES.LOGIN;
  }
}
