import type { WeightCycle } from '../types';

export type WeightGoal = 'bulk' | 'cut';
export type TrendTone = 'good' | 'bad' | 'neutral';

// Colour of a weight change depends on the goal: bulk wants up, cut wants down.
// No change, no data or no goal set (older cycles) stays neutral.
export const trendTone = (diff: number | null | undefined, goal: string | null | undefined): TrendTone => {
  if (diff == null || diff === 0 || (goal !== 'bulk' && goal !== 'cut')) return 'neutral';
  return (goal === 'bulk') === (diff > 0) ? 'good' : 'bad';
};

const loggedWeights = (cycle: WeightCycle): number[] =>
  [...cycle.weeks].sort((a, b) => a.week_number - b.week_number)
    .flatMap(w => [...w.day_logs].sort((a, b) => a.day_of_week - b.day_of_week))
    .filter(d => d.weight_kg != null).map(d => d.weight_kg!);

export const lastLoggedWeight = (cycle: WeightCycle): number | null => loggedWeights(cycle).at(-1) ?? null;
