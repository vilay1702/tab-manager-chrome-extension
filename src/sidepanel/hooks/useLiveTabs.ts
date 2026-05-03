import { useEffect, useRef, useState } from 'react';

export type LiveTab = chrome.tabs.Tab;

export function useLiveTabs() {
  const [tabs, setTabs] = useState<LiveTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | undefined>();
  const [windowId, setWindowId] = useState<number | undefined>();
  const cancelledRef = useRef(false);

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

    refresh();

    const onAny = () => refresh();

    chrome.tabs.onCreated.addListener(onAny);
    chrome.tabs.onRemoved.addListener(onAny);
    chrome.tabs.onUpdated.addListener(onAny);
    chrome.tabs.onActivated.addListener(onAny);
    chrome.tabs.onMoved.addListener(onAny);
    chrome.tabs.onAttached.addListener(onAny);
    chrome.tabs.onDetached.addListener(onAny);
    chrome.windows.onFocusChanged.addListener(onAny);

    return () => {
      cancelledRef.current = true;
      chrome.tabs.onCreated.removeListener(onAny);
      chrome.tabs.onRemoved.removeListener(onAny);
      chrome.tabs.onUpdated.removeListener(onAny);
      chrome.tabs.onActivated.removeListener(onAny);
      chrome.tabs.onMoved.removeListener(onAny);
      chrome.tabs.onAttached.removeListener(onAny);
      chrome.tabs.onDetached.removeListener(onAny);
      chrome.windows.onFocusChanged.removeListener(onAny);
    };
  }, []);

  return { tabs, activeTabId, windowId };
}
