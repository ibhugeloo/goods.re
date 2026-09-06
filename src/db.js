import { demoItems } from "./data";

const DB_NAME = "goods-re-local";
const STORE_NAME = "items";
const DB_VERSION = 1;
const demoOrder = new Map([
  "demo-shower-head",
  "demo-leica-q3",
  "demo-knob1",
  "demo-pepper-mill",
  "demo-card-holder",
  "demo-beoplay",
].map((id, index) => [id, index]));

function sortItems(items) {
  return [...items].sort((first, second) => {
    const firstDemo = demoOrder.has(first.id);
    const secondDemo = demoOrder.has(second.id);

    if (firstDemo && secondDemo) return demoOrder.get(first.id) - demoOrder.get(second.id);
    if (firstDemo !== secondDemo) return firstDemo ? 1 : -1;
    return String(second.addedDate || second.purchaseDate || "").localeCompare(
      String(first.addedDate || first.purchaseDate || ""),
    );
  });
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionToPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function loadItems() {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const items = await requestToPromise(transaction.objectStore(STORE_NAME).getAll());
  database.close();

  if (items.length > 0) return sortItems(items);

  await replaceItems(demoItems);
  return sortItems(demoItems);
}

export async function saveItem(item) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).put(item);
  await transactionToPromise(transaction);
  database.close();
  return item;
}

export async function removeItem(id) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).delete(id);
  await transactionToPromise(transaction);
  database.close();
}

export async function replaceItems(items) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  store.clear();
  for (const item of items) {
    store.put(item);
  }

  await transactionToPromise(transaction);
  database.close();
}
