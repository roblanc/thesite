import { describe, expect, it } from 'vitest';
import type { AggregatedStory } from './aggregation';
import type { RSSNewsItem } from './shared';
import { NEWS_SOURCES } from './shared';
import { mergeWithExisting, storiesToArchive } from './storyMerge';

// Tests go through the public mergeWithExisting only, so internal threshold tweaks
// are free as long as these behaviours hold.

const BASE = Date.parse('2026-09-30T08:00:00Z');
const HOUR = 60 * 60 * 1000;

// Each distinct link gets its own outlet: merges keep one article per outlet.
const outletByLink = new Map<string, number>();
function outletFor(link: string) {
    if (!outletByLink.has(link)) outletByLink.set(link, outletByLink.size % NEWS_SOURCES.length);
    return NEWS_SOURCES[outletByLink.get(link)!];
}

function item(link: string, hoursFromBase = 0): RSSNewsItem {
    return {
        id: link,
        title: `Articol ${link}`,
        description: '',
        link: `https://example.ro/${link}`,
        pubDate: new Date(BASE + hoursFromBase * HOUR).toISOString(),
        source: outletFor(link),
    };
}

function story(id: string, links: string[], hoursFromBase = 0): AggregatedStory {
    const sources = links.map(l => item(l, hoursFromBase));
    return {
        id,
        title: `Story ${id}`,
        description: '',
        sources,
        sourcesCount: sources.length,
        bias: { left: 33, center: 34, right: 33 },
        blindspot: 'none',
        mainCategory: 'Actualitate',
        publishedAt: sources[0]?.pubDate ?? new Date(BASE).toISOString(),
        timeAgo: '',
    };
}

const links = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

describe('mergeWithExisting', () => {
    it('keeps the old id when a fresh story substantially overlaps a cached one', () => {
        const old = story('story-old', ['a', 'b', 'c', 'd']);
        const fresh = story('story-new', ['a', 'b', 'c', 'e']);
        const { merged, unmatched } = mergeWithExisting([fresh], [old]);
        expect(merged).toHaveLength(1);
        expect(merged[0].id).toBe('story-old');
        // Old source 'd' is re-attached, shared ones are not duplicated.
        expect(merged[0].sources.map(s => s.id).sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
        expect(merged[0].sourcesCount).toBe(5);
        expect(unmatched).toEqual([]);
    });

    it('does not match on a single shared link when both stories are larger than 2 sources', () => {
        const old = story('story-old', ['a', 'b', 'c']);
        const fresh = story('story-new', ['a', 'x', 'y']);
        const { merged } = mergeWithExisting([fresh], [old]);
        expect(merged[0].id).toBe('story-new');
        expect(merged[0].sources.map(s => s.id)).toEqual(['a', 'x', 'y']);
    });

    it('allows a single shared link to match a tiny (2-source) story', () => {
        const old = story('story-old', ['a', 'b']);
        const fresh = story('story-new', ['a', 'c']);
        expect(mergeWithExisting([fresh], [old]).merged[0].id).toBe('story-old');
    });

    it('does not let a small fresh cluster latch onto a bloated old one', () => {
        // 3 shared links: all of the fresh story, but only 10% of the old one.
        const old = story('story-bloated', [...links('a', 3), ...links('z', 27)]);
        const fresh = story('story-new', links('a', 3));
        const { merged } = mergeWithExisting([fresh], [old]);
        expect(merged[0].id).toBe('story-new');
        expect(merged[0].sourcesCount).toBe(3);
    });

    it('matches one-to-one: two fresh stories cannot inherit the same old story', () => {
        const old = story('story-old', ['a', 'b', 'c', 'd']);
        const strong = story('fresh-strong', ['a', 'b', 'c', 'd', 'e']);
        const weaker = story('fresh-weak', ['a', 'b', 'f']);
        const { merged } = mergeWithExisting([weaker, strong], [old]);
        const ids = merged.map(s => s.id);
        expect(ids).toContain('story-old');
        expect(ids.filter(id => id === 'story-old')).toHaveLength(1);
        // The strongest overlap wins the old id.
        expect(merged.find(s => s.sources.some(src => src.id === 'e'))?.id).toBe('story-old');
    });

    it('only re-attaches old sources published near the fresh cluster', () => {
        const old = story('story-old', ['a', 'b', 'c']);
        old.sources.push(item('ancient', -72)); // 3 days earlier
        old.sources.push(item('recent', -2));
        old.sourcesCount = old.sources.length;
        const fresh = story('story-new', ['a', 'b', 'c', 'd']);
        const { merged } = mergeWithExisting([fresh], [old]);
        const ids = merged[0].sources.map(s => s.id);
        expect(merged[0].id).toBe('story-old');
        expect(ids).toContain('recent');
        expect(ids).not.toContain('ancient');
    });

    it('returns unmatched old stories for carry-forward, but not ones sharing links with the fresh run', () => {
        const untouched = story('story-untouched', ['q', 'r', 's']);
        const touched = story('story-touched', ['a', 'x', 'y']); // shares 1 link: no match, but not carried either
        const fresh = story('story-new', ['a', 'b', 'c']);
        const { merged, unmatched } = mergeWithExisting([fresh], [untouched, touched]);
        expect(merged.map(s => s.id)).toEqual(['story-new']);
        expect(unmatched.map(s => s.id)).toEqual(['story-untouched']);
    });

    it('never emits duplicate ids', () => {
        const old = story('story-1', ['a', 'b', 'c', 'd']);
        const freshA = story('story-1', ['x', 'y', 'z']); // fresh id collides with the inherited one
        const freshB = story('story-new', ['a', 'b', 'c', 'e']);
        const { merged, unmatched } = mergeWithExisting([freshA, freshB], [old]);
        const ids = merged.map(s => s.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(unmatched).toEqual([]);
    });

    it('handles empty inputs', () => {
        expect(mergeWithExisting([], [])).toEqual({ merged: [], unmatched: [] });
        const old = story('story-old', ['a']);
        expect(mergeWithExisting([], [old]).unmatched.map(s => s.id)).toEqual(['story-old']);
    });
});

describe('storiesToArchive', () => {
    it('rewrites new and changed stories, skips ones that only got a new timeAgo', () => {
        const unchanged = story('a', ['a1', 'a2']);
        const grown = story('b', ['b1', 'b2']);
        const previous = [unchanged, grown];
        const current = [
            { ...unchanged, timeAgo: 'acum 3 ore' },
            { ...story('b', ['b1', 'b2', 'b3']) },
            story('c', ['c1', 'c2']),
        ];

        expect(storiesToArchive(current, previous).map(s => s.id)).toEqual(['b', 'c']);
    });

    it('rewrites everything when there is no previous feed', () => {
        expect(storiesToArchive([story('a', ['a1', 'a2'])], []).map(s => s.id)).toEqual(['a']);
    });
});
