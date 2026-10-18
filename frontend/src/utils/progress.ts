type SetData = { reps: number | null; weight_kg: number | null };

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

// Average estimated 1RM (Epley) across sets; null unless every set has weight and reps.
export const exerciseScore = (sets?: SetData[] | null): number | null => {
  if (!sets || sets.length === 0) return null;
  if (!sets.every(s => isNum(s.weight_kg) && isNum(s.reps))) return null;
  const total = sets.reduce((sum, s) => sum + s.weight_kg! * (1 + s.reps! / 30), 0);
  return total / sets.length;
};

export const progressPct = (current: number | null, reference: number | null): number | null => {
  if (current == null || reference == null || reference <= 0) return null;
  return Math.round(((current - reference) / reference) * 1000) / 10;
};

const locale = (lang: string) => (lang === 'pl' ? 'pl-PL' : 'en-US');

export const formatPct = (pct: number, lang: string): string => {
  const abs = Math.abs(pct).toLocaleString(locale(lang), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${pct > 0 ? '+' : pct < 0 ? '−' : ''}${abs}%`;
};

export const formatKg = (kg: number, lang: string): string =>
  `${kg.toLocaleString(locale(lang), { maximumFractionDigits: 2 })} kg`;

export const firstWeight = (sets?: SetData[] | null): number | null =>
  sets?.find(s => isNum(s.weight_kg))?.weight_kg ?? null;
