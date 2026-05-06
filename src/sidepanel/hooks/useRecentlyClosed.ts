import { useEffect, useState } from 'react';
import { RecentlyClosedTab } from '../../lib/types';
import { loadRecentlyClosed, subscribeRecentlyClosed } from '../../lib/storage';

export function useRecentlyClosed() {
  const [list, setList] = useState<RecentlyClosedTab[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadRecentlyClosed().then((l) => {
      if (!cancelled) setList(l);
    });
    const unsub = subscribeRecentlyClosed(setList);
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return list;
}
