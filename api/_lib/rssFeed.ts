import type { AggregatedStory } from './aggregation.js';
import type { StoryCard } from '../../shared/storyCard.js';
import { biasPercentages, SITE_URL } from '../../shared/ogImage.js';

/** RSS 2.0 document for /rss.xml (and /feed.xml), built from the latest aggregated stories. */

const MAX_ITEMS = 50;

/** The feed only reads card fields, so it is built from the slim card copy in Redis. */
type RssStory = AggregatedStory | StoryCard;

// XML 1.0 forbids most C0 control characters; some outlet feeds leak them into titles.
// eslint-disable-next-line no-control-regex
const INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

export const escapeXml = (str: string = '') =>
    String(str)
        .replace(INVALID_XML_CHARS, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

function rfc822(value: string | undefined, fallback: string): string {
    if (!value) return fallback;
    const date = new Date(value);
    return isNaN(date.getTime()) ? fallback : date.toUTCString();
}

function sourceNames(story: RssStory): string[] {
    const names = (story.sources || [])
        .map(s => {
            const src = s?.source as unknown;
            if (typeof src === 'string') return src;
            if (src && typeof src === 'object' && 'name' in src) return String((src as { name: unknown }).name || '');
            return '';
        })
        .filter(Boolean);
    return Array.from(new Set(names));
}

function itemXml(story: RssStory, buildDate: string): string {
    const storyUrl = `${SITE_URL}/stire/${encodeURIComponent(story.id)}`;
    const names = sourceNames(story);
    const count = story.sourcesCount || names.length;
    const b = biasPercentages(story.bias);
    const hasBias = b.left + b.center + b.right > 0;

    const summary = [
        story.description?.trim() || '',
        `Acoperit de ${count} ${count === 1 ? 'sursă' : 'surse'}${names.length ? `: ${names.join(', ')}` : ''}.`,
        hasBias ? `Stânga ${b.left}% · Centru ${b.center}% · Dreapta ${b.right}%.` : '',
    ].filter(Boolean).join(' ');

    const image = story.image && /^https?:\/\//i.test(story.image) ? story.image : '';

    return [
        '    <item>',
        `      <title>${escapeXml(story.title)}</title>`,
        `      <link>${escapeXml(storyUrl)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(storyUrl)}</guid>`,
        `      <description>${escapeXml(summary)}</description>`,
        `      <pubDate>${rfc822(story.publishedAt, buildDate)}</pubDate>`,
        `      <category>${escapeXml(story.mainCategory || 'Actualitate')}</category>`,
        // Media RSS instead of <enclosure>: enclosure requires a byte length we don't know.
        image ? `      <media:content url="${escapeXml(image)}" medium="image" />` : '',
        '    </item>',
    ].filter(Boolean).join('\n');
}

export function buildRssXml(stories: RssStory[], now: Date = new Date()): string {
    const buildDate = now.toUTCString();
    const items = stories.slice(0, MAX_ITEMS).map(s => itemXml(s, buildDate)).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>thesite.ro | Știri din toate perspectivele</title>
    <link>${SITE_URL}</link>
    <description>Agregator de știri din surse multiple din România. Analiză de bias și perspective comparative.</description>
    <language>ro-RO</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <ttl>10</ttl>
    <image>
      <url>${SITE_URL}/logo.png</url>
      <title>thesite.ro | Știri din toate perspectivele</title>
      <link>${SITE_URL}</link>
    </image>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}
