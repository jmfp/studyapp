import {
  CRAWL_DELAY_MS,
  MAX_CRAWL_CHARS,
  MAX_CRAWL_PAGES,
  MAX_SOURCE_CHARS,
} from '../constants/ai';

const USER_AGENT = 'StuhDee/1.0 (+https://stuhdee.app)';

export function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = '';
  let path = parsed.pathname;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  parsed.pathname = path;
  return parsed.href;
}

function shouldCrawlUrl(url: string, origin: string): boolean {
  try {
    const u = new URL(url);
    if (u.origin !== origin) return false;
    const path = u.pathname.toLowerCase();
    if (/\.(pdf|zip|png|jpe?g|gif|svg|webp|css|js|mjs|woff2?|ttf|mp4|mp3|xml|json)$/i.test(path)) {
      return false;
    }
    if (/\/(login|signin|signup|register|cart|checkout|account)(\/|$)/i.test(path)) return false;
    return true;
  } catch {
    return false;
  }
}

export function extractSameOriginLinks(html: string, pageUrl: string, origin: string): string[] {
  const links = new Set<string>();
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const href = match[1].trim();
    if (!href || href.startsWith('mailto:') || href.startsWith('javascript:')) continue;
    try {
      const absolute = normalizeUrl(new URL(href, pageUrl).href);
      if (shouldCrawlUrl(absolute, origin)) links.add(absolute);
    } catch {
      // skip invalid URLs
    }
  }
  return [...links];
}

async function fetchPage(url: string): Promise<{ html: string; text: string }> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(20000),
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Could not fetch URL (${response.status})`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    throw new Error('URL is not an HTML page');
  }

  const html = await response.text();
  const text = htmlToText(html);
  if (text.length < 40) {
    throw new Error('Page did not contain enough readable text');
  }

  return { html, text };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchUrlText(url: string, maxChars = MAX_SOURCE_CHARS): Promise<string> {
  const { text } = await fetchPage(url);
  return text.slice(0, maxChars);
}

export async function crawlWebsite(
  baseUrl: string,
): Promise<{ text: string; pagesCrawled: number; urls: string[] }> {
  const start = normalizeUrl(baseUrl);
  const origin = new URL(start).origin;

  const visited = new Set<string>();
  const queue = [start];
  const sections: string[] = [];
  let totalChars = 0;

  while (queue.length > 0 && visited.size < MAX_CRAWL_PAGES && totalChars < MAX_CRAWL_CHARS) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const { html, text } = await fetchPage(url);
      const chunk = `--- Page: ${url} ---\n${text}`;
      sections.push(chunk);
      totalChars += chunk.length;

      const links = extractSameOriginLinks(html, url, origin);
      for (const link of links) {
        if (!visited.has(link) && !queue.includes(link)) {
          queue.push(link);
        }
      }

      if (queue.length > 0) await delay(CRAWL_DELAY_MS);
    } catch {
      // skip pages that fail to load
    }
  }

  if (sections.length === 0) {
    throw new Error('Could not crawl any pages from this site. Check the URL and try a single page instead.');
  }

  return {
    text: sections.join('\n\n').slice(0, MAX_CRAWL_CHARS),
    pagesCrawled: visited.size,
    urls: [...visited],
  };
}
