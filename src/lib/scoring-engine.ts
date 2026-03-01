// Scoring Engine voor Voltafy CCC
// ADR-001: scoring engine in de applicatielaag
// RT-011 fix: division-by-zero guards

import type { ScoringType, TrafficLight, ScoreResult, ScoreBreakdown } from '@/types/scoring';
import type { MonthlyTarget } from '@/types/database';
import { TRAFFIC_LIGHT_THRESHOLDS, COMPANY_ENTITY_ID } from './constants';
import { getDaysInMonth, getDayOfYear, isLeapYear } from './utils';

/**
 * Bereken een type-specifieke score.
 * RT-011 fix: alle division-by-zero edge cases worden afgevangen.
 */
export function calculateTypeScore(
  type: ScoringType,
  actual: number,
  target: number
): number | null {
  // Guard: geen target = geen score
  if (target === 0 && actual === 0) return 100; // both zero = on target
  if (target === 0) return null; // target niet ingesteld

  switch (type) {
    case 'ratio_lager_beter':
      if (actual === 0) return 100; // 0% klachten = perfect
      return Math.min((target / actual) * 100, 100);

    case 'tijd_lager_beter':
      if (actual === 0) return 100; // instant = perfect
      return Math.min((target / actual) * 100, 100);

    case 'volume':
    case 'waarde':
      return Math.min((actual / target) * 100, 150);

    case 'ratio':
    case 'norm':
      return Math.min((actual / target) * 100, 100);

    case 'mijlpaal':
      return Math.min((actual / target) * 100, 100);
  }
}

/**
 * Bereken het YTD verwachte target op basis van maandtargets (niet-lineair).
 */
export function calculateYTDExpected(
  monthlyTargets: MonthlyTarget[],
  referenceDate: Date
): number {
  const currentMonth = `${referenceDate.getFullYear()}-${String(
    referenceDate.getMonth() + 1
  ).padStart(2, '0')}`;

  // Stap 1: Som van alle volledig afgeronde maanden
  const completedMonthsTotal = monthlyTargets
    .filter((mt) => mt.maand < currentMonth)
    .reduce((sum, mt) => sum + Number(mt.target_value), 0);

  // Stap 2: Pro-rata van lopende maand
  const currentMonthTarget =
    monthlyTargets.find((mt) => mt.maand === currentMonth)?.target_value ?? 0;
  const daysInMonth = getDaysInMonth(referenceDate);
  const dayOfMonth = referenceDate.getDate();
  const proRata = Number(currentMonthTarget) * (dayOfMonth / daysInMonth);

  return completedMonthsTotal + proRata;
}

/**
 * Fallback: lineaire YTD berekening als geen maandtargets beschikbaar.
 */
export function calculateLinearYTDExpected(
  jaardoel: number,
  referenceDate: Date
): number {
  const dayOfYear = getDayOfYear(referenceDate);
  const daysInYear = isLeapYear(referenceDate) ? 366 : 365;
  return jaardoel * (dayOfYear / daysInYear);
}

/**
 * Bepaal de traffic light kleur op basis van een score.
 */
export function getTrafficLight(score: number | null): TrafficLight {
  if (score === null || score === undefined) return 'geen_data';
  if (score >= TRAFFIC_LIGHT_THRESHOLDS.GROEN) return 'groen';
  if (score >= TRAFFIC_LIGHT_THRESHOLDS.ORANJE) return 'oranje';
  return 'rood';
}

/**
 * Bereken de score van een sub-goal op basis van ingevoerde waarden.
 */
export function calculateSubGoalScore(
  type: ScoringType,
  entries: number[],
  targetValue: number | null
): number | null {
  if (entries.length === 0) return null;
  if (targetValue === null || targetValue === undefined) return null;

  // Aggregeer entries op basis van type
  let actual: number;
  switch (type) {
    case 'volume':
    case 'waarde':
      // Cumulatief: som van alle entries
      actual = entries.reduce((sum, val) => sum + val, 0);
      break;
    case 'ratio':
    case 'ratio_lager_beter':
    case 'norm':
    case 'tijd_lager_beter':
      // Gemiddelde van entries
      actual = entries.reduce((sum, val) => sum + val, 0) / entries.length;
      break;
    case 'mijlpaal':
      // Laatste waarde (huidige status)
      actual = entries[entries.length - 1];
      break;
    default:
      return null;
  }

  return calculateTypeScore(type, actual, targetValue);
}

/**
 * Bereken de gewogen score van een goal op basis van sub-goal scores.
 * Retourneert null als gewichten niet optellen tot 100%.
 */
export function calculateGoalScore(
  subGoalScores: Array<{ score: number | null; weight: number; name: string; id: string }>
): ScoreResult & { breakdown: ScoreBreakdown[] } {
  const totalWeight = subGoalScores.reduce((sum, sg) => sum + sg.weight, 0);
  const warnings: string[] = [];

  if (totalWeight !== 100) {
    warnings.push(
      `Sub-KPI gewichten tellen op tot ${totalWeight}%, niet 100%.`
    );
  }

  const scoredItems = subGoalScores.filter((sg) => sg.score !== null);

  if (scoredItems.length === 0) {
    return {
      entityType: 'goal',
      entityId: '',
      score: null,
      trafficLight: 'geen_data',
      periode: '',
      breakdown: subGoalScores.map((sg) => ({
        childId: sg.id,
        childName: sg.name,
        score: sg.score,
        weight: sg.weight,
        weightedContribution: null,
      })),
      warnings,
    };
  }

  // Bereken gewogen score op basis van beschikbare scores
  const weightedScore = scoredItems.reduce((sum, sg) => {
    const contribution = (sg.score! * sg.weight) / totalWeight;
    return sum + contribution;
  }, 0);

  // Normaliseer als niet alle scores beschikbaar zijn
  const availableWeight = scoredItems.reduce((sum, sg) => sum + sg.weight, 0);
  const normalizedScore =
    availableWeight > 0 ? (weightedScore * totalWeight) / availableWeight : null;

  const score = normalizedScore !== null ? Math.round(normalizedScore * 100) / 100 : null;

  return {
    entityType: 'goal',
    entityId: '',
    score,
    trafficLight: getTrafficLight(score),
    periode: '',
    breakdown: subGoalScores.map((sg) => ({
      childId: sg.id,
      childName: sg.name,
      score: sg.score,
      weight: sg.weight,
      weightedContribution:
        sg.score !== null ? (sg.score * sg.weight) / totalWeight : null,
    })),
    warnings,
  };
}

/**
 * Bereken de gewogen score van een pilaar op basis van goal scores.
 */
export function calculatePillarScore(
  goalScores: Array<{ score: number | null; weight: number; name: string; id: string }>
): ScoreResult & { breakdown: ScoreBreakdown[] } {
  const result = calculateGoalScore(goalScores);
  return {
    ...result,
    entityType: 'pillar',
  };
}

/**
 * Bereken de company score op basis van pilaar scores.
 */
export function calculateCompanyScore(
  pillarScores: Array<{ score: number | null; weight: number; name: string; id: string }>
): ScoreResult & { breakdown: ScoreBreakdown[] } {
  const result = calculateGoalScore(pillarScores);
  return {
    ...result,
    entityType: 'company',
    entityId: COMPANY_ENTITY_ID,
  };
}
