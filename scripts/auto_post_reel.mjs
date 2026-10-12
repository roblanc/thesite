import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Încarcă automat .env dacă variabilele nu sunt setate
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const LOG_DIR = path.join(__dirname, '..', 'social_export', 'logs');

async function snap(page, name) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    await page.screenshot({ path: path.join(LOG_DIR, name) });
    console.log(`📸 ${name}`);
  } catch { /* ignore */ }
}

async function isLoggedIn(page) {
  const url = page.url();
  if (url.includes('/accounts/login') || url.includes('/accounts/emailsignup')) {
    return false;
  }
  const loginInput = await page.locator('input[name="username"], input[name="email"], input[name="pass"], input[name="password"]').first().isVisible({ timeout: 3000 }).catch(() => false);
  if (loginInput) return false;

  const navPresent = await page.locator('svg[aria-label="Home"], svg[aria-label="Acasă"], svg[aria-label="Direct"], svg[aria-label="New post"], svg[aria-label="Postare nouă"], svg[aria-label="Explore"], svg[aria-label="Reels"]').first().isVisible({ timeout: 4000 }).catch(() => false);
  return navPresent;
}

async function autoPostReelToInstagram() {
  const profileDir = path.join(__dirname, '..', 'social_export', 'browser_profile');
  fs.mkdirSync(profileDir, { recursive: true });

  const latestDir = path.join(__dirname, '..', 'social_export', 'latest');
  const videoPath = path.join(latestDir, 'reel.mp4');
  const captionPath = path.join(latestDir, 'caption.txt');

  if (!fs.existsSync(videoPath)) {
    throw new Error('❌ Fișierul reel.mp4 nu există! Rulează mai întâi: npm run generate:reel');
  }

  const caption = fs.existsSync(captionPath)
    ? fs.readFileSync(captionPath, 'utf8')
    : 'Vezi știrea completă din toate perspectivele pe thesite.ro #stiri #reels #romania';

  console.log('🚀 Deschidem browserul Chromium pentru Instagram Reel...');

  const isHeadless = process.env.HEADLESS !== 'false';
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: isHeadless,
    viewport: { width: 1280, height: 900 },
  });

  const page = context.pages()[0] || await context.newPage();

  console.log('📌 Navigăm pe Instagram.com...');
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  await snap(page, 'reel_01_loaded.png');

  // Dismiss one-tap / modal prompt if visible
  for (const t of ['Save info', 'Salvați informațiile', 'Not Now', 'Nu acum', 'Not now', 'Cancel', 'Anulează']) {
    await page.locator(`button:has-text("${t}")`).first().click({ timeout: 1500 }).catch(() => {});
  }

  if (!(await isLoggedIn(page))) {
    console.log('⚠️ Nu ești autentificat pe Instagram.');
    await snap(page, 'reel_02_not_logged_in.png');
    await context.close();
    throw new Error('Nu ești autentificat pe Instagram. Rulează sesiunea de autentificare.');
  }

  console.log('✓ Autentificat pe Instagram!');
  await snap(page, 'reel_03_authenticated.png');

  // Deschidem meniul Create
  console.log('📌 Deschidem meniul Create...');
  const createSvg = page.locator('svg[aria-label="New post"], svg[aria-label="New posts"], svg[aria-label="Postare nouă"], svg[aria-label="Create"]');
  const createBySvg = createSvg.locator('xpath=ancestor::*[@role="button" or self::a or self::div][1]');
  if (await createBySvg.first().isVisible({ timeout: 4000 }).catch(() => false)) {
    await createBySvg.first().click();
  } else {
    const navCreate = page.locator('div[role="button"]:has-text("Create"), span:has-text("Create"), span:has-text("Creează")').first();
    if (await navCreate.isVisible({ timeout: 3000 }).catch(() => false)) {
      await navCreate.click();
    }
  }

  await page.waitForTimeout(1000);
  await snap(page, 'reel_04_create_menu.png');

  // Selectăm "Post" din meniu dacă există submeniu
  await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('span, a, div'));
    const postItem = els.find(el => el.textContent.trim() === 'Post' && el.offsetParent !== null);
    if (postItem) postItem.click();
  });

  await page.waitForTimeout(2000);
  await snap(page, 'reel_05_create_dialog.png');

  // Urcăm video reel.mp4
  console.log('📌 Urcăm videoclipul:', videoPath);
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.waitFor({ state: 'attached', timeout: 15000 });
  await fileInput.setInputFiles(videoPath);
  await page.waitForTimeout(5000);
  await snap(page, 'reel_06_video_uploaded.png');

  // Dacă apare dialogul "Video posts are now shared as reels" -> apăsăm OK
  const reelInfoOk = page.locator('button:has-text("OK"), div[role="button"]:has-text("OK"), button:has-text("De acord"), button:has-text("Continue")').first();
  if (await reelInfoOk.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('📌 Confirmăm dialogul informativ despre Reels...');
    await reelInfoOk.click().catch(() => {});
    await page.waitForTimeout(1500);
  }

  // Verificăm decuparea / aspect ratio (pentru 9:16 Reel) - non-blocant
  try {
    const cropBtn = page.locator('button svg[aria-label="Select crop"], button svg[aria-label="Selectează decuparea"], svg[aria-label="Select crop"]').first();
    if (await cropBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
      console.log('📌 Ajustăm aspect ratio la 9:16...');
      await cropBtn.click({ force: true }).catch(() => page.evaluate(() => {
        const el = document.querySelector('button svg[aria-label="Select crop"], svg[aria-label="Select crop"]');
        if (el) (el.closest('button') || el).click();
      }));
      await page.waitForTimeout(700);
      const reelRatio = page.locator('button:has-text("9:16"), span:has-text("9:16"), button:has-text("Original"), span:has-text("Original")').first();
      if (await reelRatio.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reelRatio.click({ force: true }).catch(async () => {
          await page.evaluate(() => {
            const els = Array.from(document.querySelectorAll('button, span, div[role="button"]'));
            const t = els.find(e => e.textContent.trim() === '9:16' || e.textContent.trim() === 'Original');
            if (t) t.click();
          });
        });
        await page.waitForTimeout(500);
      }
    }
  } catch (e) {
    console.log('⚠️ Crop 9:16 a eșuat (overlay), continui cu crop default:', e.message);
  }

  // Pasul 1: Next din ecranul de Crop
  console.log('📌 Apăsăm Next (Pasul 1 - Crop)...');
  const nextBtn1 = page.locator('div[role="button"]:has-text("Next"), button:has-text("Next"), button:has-text("Înainte"), div[role="button"]:has-text("Înainte")').first();
  await nextBtn1.waitFor({ state: 'visible', timeout: 10000 });
  await nextBtn1.click();
  await page.waitForTimeout(3000);
  await snap(page, 'reel_07_cover_step.png');

  // Pasul 2: Next din ecranul de Cover photo / Trim (dacă există)
  const nextBtn2 = page.locator('div[role="button"]:has-text("Next"), button:has-text("Next"), button:has-text("Înainte"), div[role="button"]:has-text("Înainte")').first();
  if (await nextBtn2.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('📌 Apăsăm Next (Pasul 2 - Cover/Trim)...');
    await nextBtn2.click();
    await page.waitForTimeout(3000);
  }
  await snap(page, 'reel_08_caption_step.png');

  // Pasul 3: Introducem descrierea / caption
  console.log('📌 Introducem descrierea...');
  const captionBox = page.locator('div[role="dialog"] div[aria-label*="caption" i], div[role="dialog"] div[aria-label*="descriere" i], div[role="dialog"] div[contenteditable="true"][role="textbox"], textarea').first();
  if (await captionBox.isVisible({ timeout: 5000 }).catch(() => false)) {
    await captionBox.focus();
    await captionBox.fill(caption);
    console.log('✓ Caption completat!');
  } else {
    console.log('⚠️ Nu am găsit câmpul de caption, continuăm fără.');
  }

  await page.waitForTimeout(1500);
  await snap(page, 'reel_09_caption_filled.png');

  // Pasul 4: Share / Distribuie
  console.log('🚀 Publicăm Reel-ul pe Instagram...');
  const shareBtn = page.locator('div[role="dialog"] div[role="button"]:has-text("Share"), div[role="dialog"] button:has-text("Share"), div[role="dialog"] div[role="button"]:has-text("Distribuie"), div[role="dialog"] button:has-text("Distribuie")').first();
  if (await shareBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await shareBtn.click({ force: true });
  } else {
    await page.evaluate(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      if (dialog) {
        const btns = Array.from(dialog.querySelectorAll('div[role="button"], button'));
        const s = btns.find(b => b.textContent.trim() === 'Share' || b.textContent.trim() === 'Distribuie');
        if (s) s.click();
      }
    });
  }

  console.log('⏳ Așteptăm procesarea și încărcarea Reel-ului (poate dura 30-60 secunde)...');

  let isDone = false;
  for (let i = 0; i < 35; i++) {
    await page.waitForTimeout(2000);
    const bodyText = (await page.locator('body').innerText().catch(() => '')).toLowerCase();
    const hasSuccess = [
      'reel shared', 'post shared', 'your reel has been shared',
      'your post has been shared', 'postare distribuită', 'reel distribuit'
    ].some(s => bodyText.includes(s));
    
    const checkmark = await page.locator('img[alt*="Animated checkmark"], img[alt*="bifat"], svg[aria-label*="bifat" i]').count();

    if (hasSuccess || checkmark > 0) {
      isDone = true;
      break;
    }
  }

  await page.waitForTimeout(3000);
  await snap(page, 'reel_10_result.png');

  if (isDone) {
    console.log('🎉 REEL PUBLICAT CU SUCCES pe Instagram via Playwright Browser!');
    try {
      const storyMetaPath = path.join(__dirname, '..', 'social_export', 'latest', 'story.json');
      const historyPath = path.join(__dirname, '..', 'social_export', 'posted_stories.json');
      let storyMeta = null;
      if (fs.existsSync(storyMetaPath)) storyMeta = JSON.parse(fs.readFileSync(storyMetaPath, 'utf8'));
      if (storyMeta && storyMeta.id) {
        let history = [];
        try { if (fs.existsSync(historyPath)) history = JSON.parse(fs.readFileSync(historyPath, 'utf8')); } catch {}
        if (!history.find(h => h.id === storyMeta.id)) {
          history.push({ id: storyMeta.id, title: storyMeta.title, postedAt: new Date().toISOString(), format: 'reel' });
          fs.mkdirSync(path.dirname(historyPath), { recursive: true });
          fs.writeFileSync(historyPath, JSON.stringify(history.slice(-300), null, 2), 'utf8');
          console.log(`📝 Istoric Reel actualizat: [${storyMeta.id}] ${storyMeta.title}`);
        }
      }
    } catch (e) {
      console.warn('⚠️ Eroare la scrierea istoricului Reel:', e.message);
    }

    // Curățăm video-ul și fișierele media din latest/ după publicare cu succes
    try {
      if (fs.existsSync(latestDir)) {
        const files = fs.readdirSync(latestDir);
        for (const file of files) {
          if (file.endsWith('.mp4') || file.endsWith('.png') || file.endsWith('.jpg') || file === 'caption.txt') {
            fs.unlinkSync(path.join(latestDir, file));
          }
        }
        console.log('🧹 Fișierele media din social_export/latest au fost șterse după publicare.');
      }
    } catch (cleanErr) {
      console.warn('⚠️ Avertisment la ștergerea fișierelor media postate:', cleanErr.message);
    }
  } else {
    console.log('ℹ️ Fluxul de postare s-a încheiat. Verifică captura social_export/logs/reel_10_result.png. NU marchez în istoric ca să permit retry.');
  }

  await context.close();
}

autoPostReelToInstagram().catch(err => {
  console.error('❌ Eroare la postare Reel:', err.message);
  process.exit(1);
});
