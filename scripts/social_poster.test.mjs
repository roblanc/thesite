import { describe, expect, it } from 'vitest';
import { buildHtmlSlides, buildReelHtml } from './social_poster.mjs';

const story = {
  id: 'story-20260930-abc',
  title: 'Guvernul adoptă bugetul <b>2027</b> & taxele "noi"',
  publishedAt: '2026-09-30T08:00:00Z',
  image: 'https://blocked.example/cover.jpg',
  sourcesCount: 3,
  bias: { left: 20.4, center: 49.6, right: 30 },
  sources: [
    {
      title: 'Guvernul adoptă bugetul 2027',
      pubDate: '2026-09-30T08:00:00Z',
      imageUrl: 'https://ok.example/second.jpg',
      source: { id: 'g4media', name: 'G4Media', bias: 'left' },
    },
    {
      title: 'Bugetul pe 2027 a fost adoptat de Guvern',
      pubDate: '2026-09-30T09:00:00Z',
      imageUrl: 'https://ok.example/third.jpg',
      source: { id: 'digi24', name: 'Digi24', bias: 'center' },
    },
  ],
};

describe('social_poster carousel', () => {
  const { slide1, slide2, slide3 } = buildHtmlSlides(story);

  it('cover walks through the other source photos when the first one is blocked', () => {
    expect(slide1).toContain('src="https://blocked.example/cover.jpg"');
    expect(slide1).toContain(
      'data-next="[&quot;https://ok.example/second.jpg&quot;,&quot;https://ok.example/third.jpg&quot;]"',
    );
    expect(slide1).toMatch(/onerror="[^"]*this\.src=n\[0\]/);
  });

  it('escapes the story title', () => {
    expect(slide1).toContain('Guvernul adoptă bugetul &lt;b&gt;2027&lt;/b&gt; &amp; taxele &quot;noi&quot;');
    expect(slide1).not.toContain('<b>2027</b>');
  });

  it('shows the rounded bias split that the caption also uses', () => {
    for (const pct of ['20%', '50%', '30%']) {
      expect(slide1).toContain(`>${pct}<`);
      expect(slide3).toContain(`>${pct}<`);
    }
  });

  it('uses real headlines per camp and says so when a camp did not cover the story', () => {
    expect(slide2).toContain('Guvernul adoptă bugetul 2027');
    expect(slide2).toContain('Stânga · G4Media');
    expect(slide2).toContain('Bugetul pe 2027 a fost adoptat de Guvern');
    expect(slide2).toContain('Nicio publicație de dreapta n-a relatat această știre');
    expect(slide2).not.toContain('Nicio publicație de stânga');
  });

  it('renders without a photo when no usable image exists', () => {
    const { slide1: bare } = buildHtmlSlides({ ...story, image: undefined, sources: [] });
    expect(bare).not.toContain('<img');
  });
});

describe('social_poster tiktok carousel', () => {
  const { slide1, slide2, slide3 } = buildHtmlSlides(story, { tiktok: true });

  it('frames cover photo and copy below TikTok Photo Mode top crop and search bar', () => {
    expect(slide1).toContain('width:1080px;height:1920px');
    expect(slide1).toContain('top:356px;left:0;right:0;height:490px');
    expect(slide1).toContain('top:866px;bottom:430px;left:76px;right:216px');
  });

  it('keeps headlines and CTA slides inside TikTok Photo Mode vertical safe bounds', () => {
    for (const slide of [slide2, slide3]) {
      expect(slide).toContain('top:356px;right:216px;bottom:430px;left:76px');
    }
  });
});

describe('social_poster reel', () => {
  it('builds a frame-driven page with the cover fallback chain', () => {
    const html = buildReelHtml(story);
    expect(html).toContain('setReelProgress');
    expect(html).toContain('data-next=');
    expect(html).toContain('https://ok.example/second.jpg');
  });
});
