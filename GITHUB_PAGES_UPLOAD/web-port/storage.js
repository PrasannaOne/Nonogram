/* Defensive browser-storage adapter. Access to window.localStorage can itself throw. */
export function createSafeStorage(host = globalThis) {
  let storage;
  try {
    storage = host.localStorage;
  } catch (error) {
    return {
      getItem() { throw error; },
      setItem() { throw error; },
      removeItem() { throw error; }
    };
  }
  if (!storage) {
    const error = new Error('Browser storage is unavailable.');
    return {
      getItem() { throw error; },
      setItem() { throw error; },
      removeItem() { throw error; }
    };
  }
  return {
    getItem: (...args) => storage.getItem(...args),
    setItem: (...args) => storage.setItem(...args),
    removeItem: (...args) => storage.removeItem(...args)
  };
}
