import { useEffect, useRef, useState } from 'react';

export type LiveTab = chrome.tabs.Tab;

const REFRESH_DEBOUNCE_MS = 50;

export function useLiveTabs() {
  const [tabs, setTabs] = useState<LiveTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | undefined>();
  const [windowId, setWindowId] = useState<number | undefined>();
  const cancelledRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    cancelledRef.current = false;

    const refresh = async () => {
      try {
        const win = await chrome.windows.getLastFocused({ populate: false });
        if (cancelledRef.current) return;
        const list = await chrome.tabs.query({ windowId: win.id });
        if (cancelledRef.current) return;
        list.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
        setWindowId(win.id);
        setTabs(list);
        const active = list.find((t) => t.active);
        setActiveTabId(active?.id);
      } catch {
        /* no focused window yet */
      }
    };

    const scheduleRefresh = () => {
      if (timerRef.current !== undefined) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        timerRef.current = undefined;
        refresh();
      }, REFRESH_DEBOUNCE_MS);
    };

    refresh();

    chrome.tabs.onCreated.addListener(scheduleRefresh);
    chrome.tabs.onRemoved.addListener(scheduleRefresh);
    chrome.tabs.onUpdated.addListener(scheduleRefresh);
    chrome.tabs.onActivated.addListener(scheduleRefresh);
    chrome.tabs.onMoved.addListener(scheduleRefresh);
    chrome.tabs.onAttached.addListener(scheduleRefresh);
    chrome.tabs.onDetached.addListener(scheduleRefresh);
    chrome.windows.onFocusChanged.addListener(scheduleRefresh);

    return () => {
      cancelledRef.current = true;
      if (timerRef.current !== undefined) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
      chrome.tabs.onCreated.removeListener(scheduleRefresh);
      chrome.tabs.onRemoved.removeListener(scheduleRefresh);
      chrome.tabs.onUpdated.removeListener(scheduleRefresh);
      chrome.tabs.onActivated.removeListener(scheduleRefresh);
      chrome.tabs.onMoved.removeListener(scheduleRefresh);
      chrome.tabs.onAttached.removeListener(scheduleRefresh);
      chrome.tabs.onDetached.removeListener(scheduleRefresh);
      chrome.windows.onFocusChanged.removeListener(scheduleRefresh);
    };
  }, []);

  return { tabs, activeTabId, windowId };
}
