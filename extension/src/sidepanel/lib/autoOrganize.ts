import { Tab } from '../../lib/types';
import { tabFromChromeTab } from '../../lib/tabs';

type Rule = {
  name: string;
  color: string;
  match: (host: string) => boolean;
};

// Order matters — first match wins. More-specific first.
const RULES: Rule[] = [
  {
    name: 'AI',
    color: '#8b5cf6',
    match: (h) =>
      /^(chatgpt|claude|perplexity|grok)\.[a-z]+$/.test(h) ||
      /^chat\.openai\.com$/.test(h) ||
      /^(gemini|bard)\.google\.com$/.test(h) ||
      /^(.+\.)?anthropic\.com$/.test(h) ||
      /^huggingface\.co$/.test(h),
  },
  {
    name: 'Code',
    color: '#10b981',
    match: (h) =>
      /^(.+\.)?(github|gitlab|bitbucket|codeberg)\.(com|io|org)$/.test(h) ||
      /^(stackoverflow|stackexchange|superuser|serverfault|askubuntu)\.com$/.test(h) ||
      /^npmjs\.com$/.test(h) ||
      /^(.+\.)?npmjs\.com$/.test(h) ||
      /^pypi\.org$/.test(h) ||
      /^(.+\.)?readthedocs\.io$/.test(h) ||
      /^(.+\.)?mdn\.dev$/.test(h) ||
      /^developer\.mozilla\.org$/.test(h),
  },
  {
    name: 'Communication',
    color: '#06b6d4',
    match: (h) =>
      /\.slack\.com$/.test(h) ||
      /^(.+\.)?(discord|zoom|webex)\.(com|us)$/.test(h) ||
      /^teams\.(microsoft|live)\.com$/.test(h),
  },
  {
    name: 'Productivity',
    color: '#6366f1',
    match: (h) =>
      /^(.+\.)?(notion|linear|asana|trello|todoist|height|clickup)\.(so|app|com)$/.test(
        h,
      ) ||
      /^(.+\.)?atlassian\.(com|net)$/.test(h) ||
      /^(.+\.)?monday\.com$/.test(h) ||
      /^evernote\.com$/.test(h),
  },
  {
    name: 'Design',
    color: '#ec4899',
    match: (h) =>
      /^(.+\.)?(figma|canva|framer|sketch|miro)\.com$/.test(h) ||
      /^(.+\.)?adobe\.com$/.test(h) ||
      /^(dribbble|behance)\.(com|net)$/.test(h),
  },
  {
    name: 'Video',
    color: '#ef4444',
    match: (h) =>
      /^(www\.)?(youtube|netflix|hulu|primevideo|disneyplus|hbomax|peacocktv|vimeo|dailymotion)\.com$/.test(
        h,
      ) ||
      /^(.+\.)?twitch\.tv$/.test(h) ||
      /^music\.youtube\.com$/.test(h),
  },
  {
    name: 'Music',
    color: '#f59e0b',
    match: (h) =>
      /^(.+\.)?(spotify|soundcloud|tidal|deezer|bandcamp)\.com$/.test(h) ||
      /^music\.apple\.com$/.test(h),
  },
  {
    name: 'Social',
    color: '#0ea5e9',
    match: (h) =>
      /^(www\.)?(twitter|x|facebook|instagram|linkedin|reddit|threads|tiktok|pinterest|tumblr|snapchat)\.(com|app|net)$/.test(
        h,
      ) ||
      /^(.+\.)?(bsky|bluesky)\.(app|social)$/.test(h) ||
      /\.mastodon\.(social|online)$/.test(h),
  },
  {
    name: 'Shopping',
    color: '#fb923c',
    match: (h) =>
      /^(www\.)?(amazon|ebay|etsy|walmart|target|aliexpress|alibaba|shopify|temu|costco|ikea|wayfair)\.(com|in|co\.uk|de)$/.test(
        h,
      ),
  },
  {
    name: 'News',
    color: '#94a3b8',
    match: (h) =>
      /^(www\.)?(nytimes|washingtonpost|wsj|ft|theverge|techcrunch|wired|engadget|cnn|bbc|reuters|bloomberg|economist|apnews|guardian|theguardian|axios|politico|vox)\.(com|co\.uk|org)$/.test(
        h,
      ) || /^news\.ycombinator\.com$/.test(h),
  },
  {
    name: 'Google',
    color: '#1a73e8',
    match: (h) =>
      /^(.+\.)?google\.(com|co\.[a-z]+)$/.test(h) ||
      /^(gmail|youtube)\.com$/.test(h),
  },
  {
    name: 'Microsoft',
    color: '#0078d4',
    match: (h) =>
      /^(.+\.)?(microsoft|office|outlook|live|msn|bing|onedrive|sharepoint)\.com$/.test(
        h,
      ) || /^(.+\.)?azure\.com$/.test(h),
  },
  {
    name: 'Apple',
    color: '#9ca3af',
    match: (h) => /^(.+\.)?(apple|icloud)\.com$/.test(h),
  },
];

const DOMAIN_FALLBACK_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#64748b',
];

type GroupKey = { name: string; color: string };

function classify(url: string): GroupKey | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const rule of RULES) {
    if (rule.match(host)) return { name: rule.name, color: rule.color };
  }
  return null;
}

function registrableLabel(url: string): string | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  // Strip leading "www."
  host = host.replace(/^www\./, '');
  // Take the second-to-last label (decent proxy without a public suffix list)
  const parts = host.split('.').filter(Boolean);
  if (parts.length === 0) return null;
  let label: string;
  if (parts.length >= 2) {
    // Handle common 2-segment TLDs: co.uk, com.au, etc.
    const last2 = parts.slice(-2).join('.');
    if (
      /^(co|com|org|net|gov|ac)\.[a-z]{2}$/.test(last2) &&
      parts.length >= 3
    ) {
      label = parts[parts.length - 3];
    } else {
      label = parts[parts.length - 2];
    }
  } else {
    label = parts[0];
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export type OrganizedGroup = {
  name: string;
  color: string;
  tabs: Tab[];
};

const MIN_GROUP_SIZE = 2;

export function organizeTabs(chromeTabs: chrome.tabs.Tab[]): {
  groups: OrganizedGroup[];
  ungrouped: number;
  totalConsidered: number;
} {
  const groups = new Map<string, OrganizedGroup>();
  let ungrouped = 0;
  let totalConsidered = 0;
  let fallbackColorIdx = 0;
  const fallbackColorByName = new Map<string, string>();

  for (const ct of chromeTabs) {
    if (!ct.url) continue;
    const tab = tabFromChromeTab(ct);
    if (!tab) continue; // non-savable (chrome://, etc.)
    totalConsidered++;

    let key: GroupKey | null = classify(ct.url);
    if (!key) {
      const label = registrableLabel(ct.url);
      if (!label) continue;
      let color = fallbackColorByName.get(label);
      if (!color) {
        color = DOMAIN_FALLBACK_COLORS[fallbackColorIdx % DOMAIN_FALLBACK_COLORS.length];
        fallbackColorByName.set(label, color);
        fallbackColorIdx++;
      }
      key = { name: label, color };
    }

    const existing = groups.get(key.name);
    if (existing) {
      existing.tabs.push(tab);
    } else {
      groups.set(key.name, { name: key.name, color: key.color, tabs: [tab] });
    }
  }

  // Drop singleton groups; they stay loose.
  const kept: OrganizedGroup[] = [];
  for (const g of groups.values()) {
    if (g.tabs.length >= MIN_GROUP_SIZE) kept.push(g);
    else ungrouped += g.tabs.length;
  }
  // Stable order: largest group first.
  kept.sort((a, b) => b.tabs.length - a.tabs.length || a.name.localeCompare(b.name));

  return { groups: kept, ungrouped, totalConsidered };
}
