import { Customer, TrustScoreMetrics } from '../types/index.ts';

/**
 * Calculates a Customer's Credit Trust Score.
 * 
 * Logic:
 * - If customer has never taken credit (totalBorrowed === 0):
 *   Level: 'new', score: 0
 * - If customer has borrowed:
 *   Repayment Rate = (totalRepaid / totalBorrowed) * 100
 *   Rate >= 80%: 'reliable' (Kuaminika Sana)
 *   Rate between 50% and 79%: 'fair' (Wastani)
 *   Rate < 50%: 'risky' (Hatari)
 */
export function calculateTrustScore(customer: Customer): TrustScoreMetrics {
  const { totalBorrowed, totalRepaid } = customer;

  if (!totalBorrowed || totalBorrowed <= 0) {
    return {
      score: 100,
      level: 'new',
      repaymentRate: 0,
      creditCount: 0,
      label: 'New Customer',
      labelSwahili: 'Mteja Mpya',
      colorClass: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
      description: 'No prior credit history on record. Start with small credit limit.',
    };
  }

  // Calculate percentage repaid (capped at 100% for ratio)
  const repaymentRatio = Math.min(100, Math.round((totalRepaid / totalBorrowed) * 100));

  if (repaymentRatio >= 80) {
    return {
      score: repaymentRatio,
      level: 'reliable',
      repaymentRate: repaymentRatio,
      creditCount: Math.max(1, Math.round(totalBorrowed / 200)),
      label: 'Reliable (80%+)',
      labelSwahili: 'Mwaminifu (80%+)',
      colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
      description: 'Consistently repays credit debts on time. Low risk of default.',
    };
  }

  if (repaymentRatio >= 50) {
    return {
      score: repaymentRatio,
      level: 'fair',
      repaymentRate: repaymentRatio,
      creditCount: Math.max(1, Math.round(totalBorrowed / 200)),
      label: 'Fair (50-79%)',
      labelSwahili: 'Wastani (50-79%)',
      colorClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
      description: 'Moderate repayment history. Prompt with payment reminders.',
    };
  }

  return {
    score: repaymentRatio,
    level: 'risky',
    repaymentRate: repaymentRatio,
    creditCount: Math.max(1, Math.round(totalBorrowed / 200)),
    label: 'Risky (<50%)',
    labelSwahili: 'Hatari (<50%)',
    colorClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
    description: 'High overdue debt balance. Caution advised before extending further credit.',
  };
}
