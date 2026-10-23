// Minimal IndexedDB wrapper (no dependency): cached GET responses, the outbox of writes and small meta values.
// Every record is scoped to the logged-in user so a shared device never mixes accounts.

const DB_NAME = 'gymtracker-offline';
const DB_VERSION = 1;

export type StoreName = 'cache' | 'ops' | 'meta';

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('ops')) db.createObjectStore('ops', { keyPath: 'seq', autoIncrement: true });
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => { dbPromise = null; reject(req.error); };
    });
  }
  return dbPromise;
}

const done = <T>(req: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

async function store(name: StoreName, mode: IDBTransactionMode) {
  return (await open()).transaction(name, mode).objectStore(name);
}

export const idbGet = async <T>(name: StoreName, key: IDBValidKey) => done<T | undefined>((await store(name, 'readonly')).get(key));
export const idbAll = async <T>(name: StoreName) => done<T[]>((await store(name, 'readonly')).getAll());
export const idbPut = async (name: StoreName, value: unknown) => done((await store(name, 'readwrite')).put(value));
export const idbDelete = async (name: StoreName, key: IDBValidKey) => done((await store(name, 'readwrite')).delete(key));

// The logged-in user (null when logged out); data is never read or written without one
export function currentUserId(): number | null {
  try {
    const u = JSON.parse(localStorage.getItem('user') ?? 'null');
    return typeof u?.id === 'number' ? u.id : null;
  } catch { return null; }
}
