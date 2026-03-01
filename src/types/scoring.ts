// Scoring types voor Voltafy CCC

export type ScoringType =
  | 'volume'
  | 'waarde'
  | 'ratio'
  | 'ratio_lager_beter'
  | 'norm'
  | 'tijd_lager_beter'
  | 'mijlpaal';

export type TrafficLight = 'groen' | 'oranje' | 'rood' | 'geen_data';

export type ScoreEntityType = 'sub_goal' | 'goal' | 'pillar' | 'company';

export interface ScoreResult {
  entityType: ScoreEntityType;
  entityId: string;
  score: number | null;
  trafficLight: TrafficLight;
  periode: string;
  breakdown?: ScoreBreakdown[];
  warnings?: string[];
}

export interface ScoreBreakdown {
  childId: string;
  childName: string;
  score: number | null;
  weight: number;
  weightedContribution: number | null;
}

export interface YTDPacing {
  ytdActual: number;
  ytdExpected: number;
  pacingPercentage: number;
  isNonLinear: boolean;
}

export const SCORING_TYPE_LABELS: Record<ScoringType, string> = {
  volume: 'Volume',
  waarde: 'Waarde',
  ratio: 'Ratio',
  ratio_lager_beter: 'Ratio (lager = beter)',
  norm: 'Norm',
  tijd_lager_beter: 'Tijd (lager = beter)',
  mijlpaal: 'Mijlpaal',
};

export const TRAFFIC_LIGHT_LABELS: Record<TrafficLight, string> = {
  groen: 'Op schema',
  oranje: 'Aandacht',
  rood: 'Kritiek',
  geen_data: 'Geen data',
};

export const FREQUENCY_LABELS: Record<string, string> = {
  dagelijks: 'Dagelijks',
  wekelijks: 'Wekelijks',
  maandelijks: 'Maandelijks',
};
