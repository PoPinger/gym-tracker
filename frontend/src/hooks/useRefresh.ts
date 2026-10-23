// The refresh button in the top bar reloads the data of the page that is open. Pages register what to
// reload and whether they hold unsaved input (then the app is never reloaded for a new version).
import { useEffect, useRef } from 'react';

export interface RefreshHandler {
  reload?: () => Promise<unknown>;  // re-fetch the page's data in place, keeping anything typed
  dirty?: () => boolean;            // typed values not saved yet
}

const handlers = new Set<{ current: RefreshHandler }>();

export function useRefresh(handler: RefreshHandler) {
  const ref = useRef(handler);
  useEffect(() => { ref.current = handler; });
  useEffect(() => {
    handlers.add(ref);
    return () => { handlers.delete(ref); };
  }, []);
}

export const hasUnsaved = () => [...handlers].some(h => h.current.dirty?.() ?? false);

export async function reloadPages() {
  await Promise.allSettled([...handlers].map(h => h.current.reload?.()));
}
