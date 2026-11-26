import { describe, expect, it } from 'vitest';
import { applyCoverage, calculateBiasDistribution, storyRankScore, type AggregatedStory } from './aggregation';
import { NEWS_SOURCES, type RSSNewsItem } from './shared';

const byId = (id: string) => NEWS_SOURCES.find((s) => s.id === id)!;
const LEAD = 'Guvernul a aprobat miercuri un memorandum privind finanțarea spitalelor regionale din Iași, Cluj și Craiova, cu o valoare totală de 2,3 miliarde de euro, potrivit comunicatului transmis după ședință.';

function item(sourceId: string, description: string, minute: number): RSSNewsItem {
    return {
        id: `${sourceId}-${minute}`,
        title: `Titlu propriu ${sourceId} ${minute} despre spitalele regionale și finanțare`,
        description,
        link: `https://example.ro/${sourceId}/${minute}`,
        pubDate: new Date(Date.UTC(2026, 8, 30, 8, minute)).toISOString(),
        source: byId(sourceId),
    };
}

function story(sources: RSSNewsItem[]): AggregatedStory {
    return {
        id: 's',
        title: 't',
        description: '',
        sources,
        sourcesCount: sources.length,
        bias: { left: 33, center: 34, right: 33 },
        mainCategory: 'Actualitate',
        publishedAt: sources[0].pubDate,
        timeAgo: '',
    };
}

describe('applyCoverage', () => {
    it('flags copies, counts independent reports and recomputes the bar', () => {
        const s = applyCoverage(story([
            item('newsro', LEAD, 1),
            item('realitatea', LEAD, 2),
            item('hotnews', 'Reportaj propriu de la Iași, cu declarații ale medicilor și ale managerului spitalului județean.', 3),
        ]));
        expect(s.sourcesCount).toBe(3);
        expect(s.independentCount).toBe(2);
        expect(s.sources.map((i) => !!i.syndicated)).toEqual([false, true, false]);
        expect(s.bias.right).toBe(0);
        expect(s.bias.left + s.bias.center + s.bias.right).toBe(100);
        expect(s.blindspot).toBe('none');
    });

    it('keeps an all-centre story at 0% left and right', () => {
        expect(calculateBiasDistribution([item('agerpres', 'a', 1), item('rfi', 'b', 2)])).toEqual({ left: 0, center: 100, right: 0 });
    });
});

describe('storyRankScore', () => {
    it('ranks by independent reports, not by copies', () => {
        const now = Date.parse('2026-09-30T10:00:00Z');
        const publishedAt = '2026-09-30T09:00:00Z';
        const copies = storyRankScore({ sourcesCount: 8, independentCount: 2, publishedAt }, now);
        const broad = storyRankScore({ sourcesCount: 4, independentCount: 4, publishedAt }, now);
        expect(broad).toBeGreaterThan(copies);
        // Stories cached before independentCount existed fall back to sourcesCount.
        expect(storyRankScore({ sourcesCount: 4, publishedAt }, now)).toBeCloseTo(broad);
    });
});
