// Is a newer deploy of the app available? Checks the service worker for an update and compares the
// main bundle of a fresh index.html with the one running (sw.js itself rarely changes between deploys).
// Throws when the network is not reachable.
export async function newVersionAvailable(): Promise<boolean> {
  let swUpdate = false;
  const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
  if (reg) {
    await reg.update().catch(() => {});
    swUpdate = !!(reg.installing || reg.waiting);
  }
  const running = document.querySelector('script[type="module"][src^="/assets/"]')?.getAttribute('src');
  if (!running) return swUpdate; // dev server: no bundles
  const res = await fetch('/', { cache: 'no-store' }); // bypasses the service worker cache (see sw.js)
  if (!res.ok) return swUpdate;
  const fresh = (await res.text()).match(/<script[^>]*\ssrc="(\/assets\/[^"]+\.js)"/)?.[1];
  return swUpdate || (!!fresh && fresh !== running);
}
