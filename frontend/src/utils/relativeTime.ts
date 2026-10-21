import type { TranslationMap } from '../i18n/translations';

type T = (key: keyof TranslationMap) => string;

const locale = (lang: string) => (lang === 'pl' ? 'pl-PL' : 'en-US');

// Backend sends naive UTC timestamps (no zone suffix)
export const parseApiDate = (s: string) => new Date(/[zZ]|[+-]\d\d:\d\d$/.test(s) ? s : `${s}Z`);

// e.g. "21 paź 2026, 22:15"
export const formatDateTime = (d: Date, lang: string) =>
  d.toLocaleString(locale(lang), { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// "przed chwilą" / "X min temu" / "X godz. temu" / "wczoraj" / full date
export function relativeTime(d: Date, now: Date, lang: string, t: T): string {
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return t('rel_just_now');
  if (mins < 60) return t('rel_minutes_ago').replace('{n}', String(mins));
  if (mins < 24 * 60) return t('rel_hours_ago').replace('{n}', String(Math.floor(mins / 60)));
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (d.getFullYear() === yesterday.getFullYear() && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate()) {
    return t('rel_yesterday');
  }
  return formatDateTime(d, lang);
}
