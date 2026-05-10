import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, EMPTY_STATE } from '../../lib/types';
import { loadState, saveState, subscribe } from '../../lib/storage';

export type Updater = (prev: AppState) => AppState;

export function useStore() {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [loaded, setLoaded] = useState(false);
  const writingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadState().then((s) => {
      if (cancelled) return;
      setState(s);
      setLoaded(true);
    });
    const unsub = subscribe((next) => {
      // Ignore the echo from our own write — onChanged still fires for it.
      if (writingRef.current) {
        writingRef.current = false;
        return;
      }
      setState(next);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const update = useCallback((updater: Updater) => {
    setState((prev) => {
      const next = updater(prev);
      writingRef.current = true;
      saveState(next).catch((err) => console.error('saveState failed', err));
      return next;
    });
  }, []);

  return { state, loaded, update };
}
