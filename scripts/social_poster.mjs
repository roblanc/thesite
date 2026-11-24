// Social design "poster": Swiss-poster layout (bias-tinted duotone photo, camp colour blocks,
// big proportional bias columns) set in newspaper type: Libre Caslon Display for headlines and
// numbers, Libre Caslon Text for quoted headlines, IBM Plex Mono for labels.
// Same contracts as the other builders:
//   buildReelHtml(story)   -> HTML driven frame-by-frame by window.setReelProgress(t)
//   buildHtmlSlides(story) -> { slide1, slide2, slide3 }
// Data selection (photos, headlines, timeline, percentages) is shared with social_v2.mjs.

import {
  CAMP_NAME,
  biasPercents,
  buildTimeline,
  esc,
  pickHeadlines,
  pickImages,
  storyDate,
} from './social_v2.mjs';

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@500&display=swap';

const C = { left: '#2F5BFF', center: '#E4E0D7', right: '#FF3B2F', ink: '#0E0E0E' };
const ON = { left: '#fff', center: C.ink, right: '#fff' };
const NUM = { left: C.left, center: '#E4E0D7', right: C.right };
const CAMPS = [['left', 'Stânga'], ['center', 'Centru'], ['right', 'Dreapta']];

function css(width, height) {
  return `
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${width}px;height:${height}px;overflow:hidden;background:${C.ink};color:#fff;font-family:'Libre Caslon Text',serif;-webkit-font-smoothing:antialiased}
  .abs{position:absolute;inset:0}
  .cas{font-family:'Libre Caslon Display',serif;font-weight:400;letter-spacing:-.015em}
  .mono{font-family:'IBM Plex Mono',monospace;font-weight:500;text-transform:uppercase;letter-spacing:.08em}
  .duo{position:relative;overflow:hidden;background:#222}
  .duo img{width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.4)}
  .duo .tint{position:absolute;inset:0;mix-blend-mode:multiply}
  .clamp{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden}`;
}

function doc(width, height, body, script = '', extraStyles = '') {
  return `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONTS_HREF}" rel="stylesheet"><style>${css(width, height)}</style>${extraStyles ? `<style>${extraStyles}</style>` : ''}</head>
<body>${body}${script ? `<script>${script}</script>` : ''}</body></html>`;
}

/** Grayscale photo tinted left→right by the bias split; walks candidate photos on error. */
function duotone(urls, b, style) {
  const tint = `linear-gradient(90deg,${C.left} 0%,${C.left} ${b.left}%,#9C978D ${b.left}%,#9C978D ${b.left + b.center}%,${C.right} ${b.left + b.center}%)`;
  const onerror =
    "var n=JSON.parse(this.dataset.next||'[]');if(n.length){this.dataset.next=JSON.stringify(n.slice(1));this.src=n[0];}else{this.onerror=null;this.remove();}";
  const img = urls.length
    ? `<img src="${esc(urls[0])}" data-next="${esc(JSON.stringify(urls.slice(1)))}" onerror="${onerror}" alt="">`
    : '';
  return `<div class="duo" style="${style}">${img}<div class="tint" style="background:${tint}"></div></div>`;
}

/** Percentages in three equal columns (readable even at 2%) above a proportional bar. */
function biasBlock(b, { num = 120, bar = 44, label = 20, gap = 18 } = {}) {
  const align = ['left', 'center', 'right'];
  return `
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
    ${CAMPS.map(([k, n], i) => `<div style="text-align:${align[i]}">
      <div class="cas number" style="font-size:${num}px;line-height:.9;color:${NUM[k]}">${b[k]}%</div>
      <div class="mono" style="font-size:${label}px;margin-top:8px">${n}</div></div>`).join('')}
  </div>
  <div style="display:flex;height:${bar}px;margin-top:${gap}px;background:#2a2a2a">
    ${CAMPS.map(([k]) => (b[k] > 0 ? `<div style="width:${b[k]}%;background:${C[k]}"></div>` : '')).join('')}
  </div>`;
}

function titleSize(title, base) {
  const n = (title || '').length;
  if (n <= 60) return base;
  if (n <= 90) return Math.round(base * 0.86);
  if (n <= 120) return Math.round(base * 0.76);
  return Math.round(base * 0.66);
}

function band(h, camp, { pad, label, text, lines }) {
  if (!h) {
    return `<div style="flex:1;background:#1c1c1c;color:#bdb8ad;padding:${pad};display:flex;flex-direction:column;justify-content:center">
      <div class="mono" style="font-size:${label}px;color:${NUM[camp]}">${esc(CAMP_NAME[camp])}</div>
      <div style="font-style:italic;font-size:${text}px;line-height:1.3;margin-top:10px">Nicio publicație de ${esc(CAMP_NAME[camp])} n-a relatat această știre</div></div>`;
  }
  return `<div style="flex:1;background:${C[camp]};color:${ON[camp]};padding:${pad};display:flex;flex-direction:column;justify-content:center">
    <div class="mono" style="font-size:${label}px">${esc(h.label)} · ${esc(h.outlet)}</div>
    <div class="clamp" style="-webkit-line-clamp:${lines};font-size:${text}px;line-height:1.3;margin-top:10px">${esc(h.title)}</div></div>`;
}

// ---------------------------------------------------------------- Reel (1080x1920)

// Instagram safe area, same as the other reel designs: 130 top, 440 bottom, 80 left, 150 right.
const SAFE = { top: 130, bottom: 440, left: 80, right: 150 };

export function buildReelHtml(story) {
  const b = biasPercents(story);
  const total = story.sourcesCount || story.sources?.length || 0;
  const images = pickImages(story);
  const heads = pickHeadlines(story);
  const timeline = buildTimeline(story);
  const date = storyDate(story);
  const blind = story.blindspot === 'left' || story.blindspot === 'right' ? story.blindspot : null;
  const title = story.title || '';
  const side = `padding-left:${SAFE.left}px;padding-right:${SAFE.right}px`;

  const kicker = blind
    ? `<span style="color:${NUM[blind]}">Unghi mort · presa de ${CAMP_NAME[blind]}: ${b[blind]}%</span>`
    : `<span style="color:${C.right}">thesite.ro · ${total} surse · ${esc(date)}</span>`;

  // Instagram shows reels centre-cropped to 4:5 in the feed and profile grid, i.e. only
  // y=285..1635 of the 1920px frame. Keep the photo and all text inside that band, and the
  // text above the 440px caption overlay of the full-screen player (y <= 1480).
  const cover = `
    <div class="abs">
      <div class="mono" style="position:absolute;top:${SAFE.top}px;left:${SAFE.left}px;right:${SAFE.right}px;display:flex;justify-content:space-between;font-size:22px;opacity:.85"><span>thesite.ro</span><span>${esc(date)}</span></div>
      ${duotone(images, b, 'position:absolute;top:285px;left:0;right:0;height:600px')}
      <div style="position:absolute;top:915px;bottom:${SAFE.bottom}px;left:${SAFE.left}px;right:${SAFE.right}px;display:flex;flex-direction:column">
        <div class="mono" style="font-size:22px">${kicker}</div>
        <div class="cas clamp" style="-webkit-line-clamp:3;font-size:${titleSize(title, 66)}px;line-height:1.04;margin-top:12px">${esc(title)}</div>
        <div style="font-style:italic;font-size:28px;margin-top:8px;opacity:.85">cum a relatat fiecare tabără</div>
        <div style="margin-top:auto">${biasBlock(b, { num: 100, bar: 34, label: 18, gap: 14 })}</div>
      </div>
    </div>`;

  const headlines = `
    <div class="abs" style="display:flex;flex-direction:column;padding-top:${SAFE.top}px;padding-bottom:${SAFE.bottom}px">
      <div style="${side};display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:36px">
        <div class="cas" style="font-size:96px;line-height:.95">Trei tabere,<br><i>trei titluri</i></div>
        <span class="mono" style="font-size:22px;opacity:.8">thesite.ro</span>
      </div>
      <div style="flex:1;display:flex;flex-direction:column">
        ${CAMPS.map(([k]) => band(heads[k], k, { pad: `28px ${SAFE.right}px 28px ${SAFE.left}px`, label: 22, text: 36, lines: 4 })).join('')}
      </div>
    </div>`;

  const race = timeline.valid ? `
    <div class="abs" style="${side};padding-top:${SAFE.top}px;padding-bottom:${SAFE.bottom}px;display:flex;flex-direction:column">
      <div class="mono" style="font-size:22px;color:${C.right}">thesite.ro · cursa știrii</div>
      <div class="cas" style="font-size:118px;line-height:.95;margin-top:28px">Cine a scris<br><i>primul?</i></div>
      <div style="margin-top:auto">
        ${timeline.shown.map((e, i) => `
          <div style="display:grid;grid-template-columns:170px 1fr;align-items:baseline;padding:22px 0;border-top:1px solid rgba(255,255,255,.2)">
            <span class="mono" style="font-size:34px;color:${i === 0 ? C.right : '#fff'}">${e.time}</span>
            <span style="font-size:42px"><span style="display:inline-block;width:20px;height:20px;background:${C[e.camp]};margin-right:16px;vertical-align:3px"></span>${esc(e.outlet)}${i === 0 ? '<i style="opacity:.6"> · primul</i>' : ''}</span>
          </div>`).join('')}
        ${timeline.restCount ? `<div style="border-top:1px solid rgba(255,255,255,.2);padding-top:22px;display:flex;justify-content:space-between;align-items:baseline">
          <span class="cas" style="font-size:58px"><i>+${timeline.restCount} redacții</i></span><span class="mono" style="font-size:22px;opacity:.7">până la ${timeline.lastTime}</span></div>` : ''}
        <div class="mono" style="font-size:18px;opacity:.5;margin-top:18px">ore din fluxurile RSS ale publicațiilor</div>
      </div>
    </div>` : '';

  const bias = `
    <div class="abs" style="${side};padding-top:${SAFE.top}px;padding-bottom:${SAFE.bottom}px;display:flex;flex-direction:column">
      <div class="cas" style="font-size:104px;line-height:.95">${total} redacții.<br><i style="color:${C.right}">Cine a scris?</i></div>
      <div style="margin-top:auto">${biasBlock(b, { num: 150, bar: 360, label: 22, gap: 24 })}</div>
      <div style="margin-top:36px;background:#fff;color:${C.ink};padding:26px 30px;display:flex;justify-content:space-between;align-items:center">
        <span class="cas" style="font-size:44px">Toate titlurile pe thesite.ro</span>
        <span class="mono" style="font-size:20px">link în bio →</span>
      </div>
    </div>`;

  const scenes = [cover, headlines, race, bias].filter(Boolean);
  const body = scenes.map((s, i) => `<div class="abs scene" id="scene${i}" style="opacity:${i === 0 ? 1 : 0};background:${C.ink}">${s}</div>`).join('');

  // Every visual change is a pure function of t: the renderer screenshots frame by frame.
  const script = `
  var N=${scenes.length},FADE=0.035;
  function clamp(v){return v<0?0:v>1?1:v}
  window.setReelProgress=function(t){
    var len=1/N;
    for(var i=0;i<N;i++){
      var el=document.getElementById('scene'+i),start=i*len,end=start+len;
      var fin=i===0?1:clamp((t-start)/FADE+0.5),fout=i===N-1?1:clamp((end-t)/FADE+0.5);
      el.style.opacity=Math.min(fin,fout);
      el.style.transform='translateY('+((1-fin)*40)+'px)';
    }
  };
  window.setReelProgress(0);`;

  return doc(1080, 1920, body, script);
}

// ------------------------------------------------------------ Carousel (1080x1350)

export function buildHtmlSlides(story, { tiktok = false } = {}) {
  const b = biasPercents(story);
  const total = story.sourcesCount || story.sources?.length || 0;
  const images = pickImages(story);
  const heads = pickHeadlines(story);
  const date = storyDate(story);
  const title = story.title || '';

  if (tiktok) return buildTikTokSlides({ b, total, images, heads, date, title });

  const slide1 = doc(1080, 1350, `
    <div class="abs" style="display:flex;flex-direction:column">
      ${duotone(images, b, 'height:600px;flex:none')}
      <div style="padding:34px 64px 60px;flex:1;display:flex;flex-direction:column">
        <div class="mono" style="font-size:22px;color:${C.right}">thesite.ro · 1/3 · ${total} redacții · ${esc(date)}</div>
        <div class="cas clamp" style="-webkit-line-clamp:3;font-size:${titleSize(title, 70)}px;line-height:1.03;margin-top:14px">${esc(title)}</div>
        <div style="margin-top:auto">${biasBlock(b, { num: 120, bar: 44, label: 20 })}</div>
      </div>
    </div>`);

  const slide2 = doc(1080, 1350, `
    <div class="abs" style="display:flex;flex-direction:column">
      <div style="padding:56px 64px 34px;display:flex;justify-content:space-between;align-items:flex-start">
        <div class="cas" style="font-size:92px;line-height:.95">Trei tabere,<br><i>trei titluri</i></div>
        <span class="mono" style="font-size:22px">2/3</span>
      </div>
      <div style="flex:1;display:flex;flex-direction:column">
        ${CAMPS.map(([k]) => band(heads[k], k, { pad: '30px 64px', label: 20, text: 34, lines: 3 })).join('')}
      </div>
    </div>`);

  const slide3 = doc(1080, 1350, `
    <div class="abs" style="padding:56px 64px;display:flex;flex-direction:column">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="cas" style="font-size:96px;line-height:.95">${total} redacții.<br><i style="color:${C.right}">Cine a scris?</i></div>
        <span class="mono" style="font-size:22px">3/3</span>
      </div>
      <div style="margin-top:auto">${biasBlock(b, { num: 168, bar: 380, label: 22, gap: 24 })}</div>
      <div style="margin-top:34px;display:flex;justify-content:space-between;align-items:center">
        <span class="cas" style="font-size:44px">thesite.ro</span>
        <span class="mono" style="font-size:22px;background:#fff;color:${C.ink};padding:14px 22px">link în bio →</span>
      </div>
    </div>`);

  return { slide1, slide2, slide3 };
}

// TikTok Photo Mode on iOS clips 9:16 slides into a ~3:4 viewport (~y=229..1691) and
// overlays the top search bar up to y≈332, the right action rail from x≈939, pagination
// dots around y≈1575, and full-screen captions below y≈1500. Keep all content inside this band.
const TIKTOK_SAFE = { top: 356, right: 216, bottom: 430, left: 76 };
const TIKTOK_PHOTO_HEIGHT = 490;
const TIKTOK_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@700&family=Inter:wght@400;600;700&display=swap');
  body,.cas{font-family:Inter,Arial,sans-serif}
  .cas{font-weight:700;letter-spacing:-.035em}
  .number{font-family:'Barlow Semi Condensed',Arial,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:-.045em}
  .duo img{object-position:center 22%}
`;

function buildTikTokSlides({ b, total, images, heads, date, title }) {
  const { top, right, bottom, left } = TIKTOK_SAFE;
  const safe = `top:${top}px;right:${right}px;bottom:${bottom}px;left:${left}px`;
  const renderSlide = body => doc(1080, 1920, body, '', TIKTOK_STYLES);
  const slide1 = renderSlide(`
    <div class="abs">
      ${duotone(images, b, `position:absolute;top:${top}px;left:0;right:0;height:${TIKTOK_PHOTO_HEIGHT}px`)}
      <div style="position:absolute;top:${top}px;left:0;right:0;height:${TIKTOK_PHOTO_HEIGHT}px;background:linear-gradient(0deg,#0e0e0e,transparent 26%)"></div>
      <div style="position:absolute;top:${top + TIKTOK_PHOTO_HEIGHT + 20}px;bottom:${bottom}px;left:${left}px;right:${right}px;display:flex;flex-direction:column">
        <div class="mono" style="color:${C.right};font-size:21px">thesite.ro · 1/3 · ${total} redacții · ${esc(date)}</div>
        <div class="cas clamp" style="-webkit-line-clamp:4;font-size:${titleSize(title, 68)}px;line-height:1.1;margin-top:18px">${esc(title)}</div>
        <div style="margin-top:auto">${biasBlock(b, { num: 108, bar: 36, label: 24, gap: 24 })}</div>
      </div>
    </div>`);
  const slide2 = renderSlide(`
    <div style="position:absolute;${safe};display:flex;flex-direction:column;gap:24px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="cas" style="font-size:68px;line-height:1.02">Trei tabere,<br>trei titluri</div>
        <span class="mono" style="font-size:22px">2/3</span>
      </div>
      <div style="min-height:0;flex:1;display:flex;flex-direction:column">
        ${CAMPS.map(([k]) => band(heads[k], k, { pad: '20px 28px', label: 20, text: 34, lines: 4 })).join('')}
      </div>
    </div>`);
  const slide3 = renderSlide(`
    <div style="position:absolute;${safe};display:flex;flex-direction:column">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="cas" style="font-size:74px;line-height:1.02">${total} redacții.<br><span style="color:${C.right}">Cine a scris?</span></div>
        <span class="mono" style="font-size:22px">3/3</span>
      </div>
      <div style="margin-top:auto">${biasBlock(b, { num: 116, bar: 260, label: 24, gap: 22 })}</div>
      <div style="margin-top:32px;display:flex;justify-content:space-between;align-items:center">
        <span class="cas" style="font-size:42px">thesite.ro</span>
        <span class="mono" style="font-size:22px;background:#fff;color:${C.ink};padding:14px 20px">link în bio →</span>
      </div>
    </div>`);
  return { slide1, slide2, slide3 };
}
