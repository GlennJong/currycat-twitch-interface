export type BackgroundMode = 'normal' | 'repeat' | 'cover' | 'contain';

export const BG_DB_NAME = 'currycat-media';
export const BG_STORE_NAME = 'assets';
export const BG_KEY = 'background-photo';

export type SavedBackgroundImage = {
  id: string;
  blob: Blob;
  sourceUrl: string;
  mode: BackgroundMode;
};

export const openBackgroundDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BG_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(BG_STORE_NAME)) {
        db.createObjectStore(BG_STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const readBackgroundFromDb = async (): Promise<SavedBackgroundImage | null> => {
  const db = await openBackgroundDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BG_STORE_NAME, 'readonly');
    const store = tx.objectStore(BG_STORE_NAME);
    const req = store.get(BG_KEY);

    req.onsuccess = () => resolve((req.result as SavedBackgroundImage | undefined) || null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  });
};

export const writeBackgroundToDb = async (data: SavedBackgroundImage): Promise<void> => {
  const db = await openBackgroundDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BG_STORE_NAME, 'readwrite');
    tx.objectStore(BG_STORE_NAME).put(data);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
};

export const deleteBackgroundFromDb = async (): Promise<void> => {
  const db = await openBackgroundDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BG_STORE_NAME, 'readwrite');
    tx.objectStore(BG_STORE_NAME).delete(BG_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
};
