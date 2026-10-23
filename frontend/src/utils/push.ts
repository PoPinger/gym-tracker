// Web Push for the rest timer: the backend sends "Zacznij serię!" when the rest ends, also with the app
// in the background or the screen locked. Turned on per device in the sidebar; without it (or without
// permission) only the in-app timer runs. Every call is best-effort: a failure never affects the timer.
import axios from 'axios';
import { pushApi } from '../services/api';

const PREF_KEY = 'gt-push';

export type PushSupport = 'ok' | 'unsupported' | 'ios-home-screen';

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches
  || (navigator as { standalone?: boolean }).standalone === true;

// iPhone supports Web Push only in the app added to the home screen (iOS 16.4+)
export function pushSupport(): PushSupport {
  const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (isIos() && !isStandalone()) return 'ios-home-screen';
  return ok ? 'ok' : 'unsupported';
}

const pref = () => { try { return localStorage.getItem(PREF_KEY) === '1'; } catch { return false; } };
const setPref = (on: boolean) => {
  try { if (on) localStorage.setItem(PREF_KEY, '1'); else localStorage.removeItem(PREF_KEY); } catch { /* storage unavailable */ }
};

async function subscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== 'ok') return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

// On only while the user wants it, the permission is granted and the browser still has the subscription
export async function pushEnabled(): Promise<boolean> {
  if (!pref() || pushSupport() !== 'ok' || Notification.permission !== 'granted') return false;
  try { return (await subscription()) != null; } catch { return false; }
}

const keyBytes = (b64: string) => {
  const raw = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
};

export type EnableResult = 'on' | 'denied' | 'error';

// Asks for permission (must run from the tap on the toggle) and subscribes this device
export async function enablePush(): Promise<EnableResult> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'error';
    const { data } = await pushApi.key();
    if (!data.enabled || !data.key) return 'error';
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription()
      ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(data.key) });
    await pushApi.subscribe(sub.toJSON());
    setPref(true);
    return 'on';
  } catch { return 'error'; }
}

export async function disablePush(): Promise<void> {
  setPref(false);
  try {
    const sub = await subscription();
    if (!sub) return;
    await pushApi.unsubscribe(sub.endpoint).catch(() => {});
    await sub.unsubscribe();
  } catch { /* already gone */ }
}

// Schedule / cancel requests are sent one after another, so a quick "start, skip" never ends scheduled
let chain: Promise<void> = Promise.resolve();
const queue = (fn: (sub: PushSubscription) => Promise<unknown>) => {
  chain = chain.then(async () => {
    if (!pref()) return;
    try {
      const sub = await subscription();
      if (sub) await fn(sub);
    } catch { /* offline or push off: the in-app timer still works */ }
  });
};

// endAt: when the rest ends (epoch ms); the server gets the time left, so the phone's clock doesn't matter
export function scheduleRestPush(endAt: number, title: string, body: string) {
  queue(async sub => {
    const seconds = (endAt - Date.now()) / 1000;
    if (seconds <= 0) return;
    try {
      await pushApi.scheduleRest(sub.endpoint, seconds, title, body);
    } catch (e) {
      // The server dropped this device's subscription (e.g. after a failed delivery): register it again
      if (!axios.isAxiosError(e) || e.response?.status !== 404) throw e;
      await pushApi.subscribe(sub.toJSON());
      await pushApi.scheduleRest(sub.endpoint, seconds, title, body);
    }
  });
}

export function cancelRestPush() {
  queue(sub => pushApi.cancelRest(sub.endpoint));
}
