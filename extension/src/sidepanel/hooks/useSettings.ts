import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, Settings } from '../../lib/types';
import {
  loadSettings,
  saveSettings,
  subscribeSettings,
} from '../../lib/storage';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadSettings().then((s) => {
      if (cancelled) return;
      setSettings(s);
      setLoaded(true);
    });
    const unsub = subscribeSettings(setSettings);
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const updateSettings = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next).catch((err) =>
        console.error('saveSettings failed', err),
      );
      return next;
    });
  };

  return { settings, loaded, updateSettings };
}
