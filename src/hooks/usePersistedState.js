import { useState, useCallback } from 'react';
import { loadPersistedState, savePersistedState } from '../utils/engine';

export function usePersistedState() {
  const [persisted, setPersisted] = useState(() => loadPersistedState());

  const updatePersisted = useCallback((next) => {
    setPersisted((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      savePersistedState(resolved);
      return resolved;
    });
  }, []);

  return [persisted, updatePersisted];
}
