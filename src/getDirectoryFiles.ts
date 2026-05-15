const DB_NAME = "app-directory";
const STORE_NAME = "handles";
const HANDLE_KEY = "directory";

export async function getDirectoryFiles(): Promise<File[]> {
  let dirHandle = await loadDirectoryHandle();

  if (!dirHandle || !(await hasReadPermission(dirHandle))) {
    dirHandle = await window.showDirectoryPicker();
    await saveDirectoryHandle(dirHandle);
  }

  const files: File[] = [];

  for await (const [, handle] of dirHandle.entries()) {
    if (handle.kind !== "file") continue;
    files.push(await handle.getFile());
  }

  return files;
}

async function hasReadPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  const permission = await handle.queryPermission({ mode: "read" });

  if (permission === "granted") {
    return true;
  }

  const requested = await handle.requestPermission({ mode: "read" });
  return requested === "granted";
}

async function saveDirectoryHandle(
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}

async function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDb();

  const handle = await new Promise<FileSystemDirectoryHandle | null>(
    (resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);

      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    }
  );

  db.close();
  return handle;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}