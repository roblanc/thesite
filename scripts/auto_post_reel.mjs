import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { openInstagramPostComposer } from './instagram_composer.mjs';
import { selectOriginalReelCrop } from './instagram_reel_crop.mjs';

// Read-only verification: no upload, generation, Share, history or media cleanup.
const checkOnly = process.argv.includes('--check');

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

  if (!checkOnly && !fs.existsSync(videoPath)) {
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
  try {
    console.log('📌 Navigăm pe Instagram.com...');
    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    if (!checkOnly) await snap(page, 'reel_01_loaded.png');

    // Dismiss one-tap / modal prompt if visible
    for (const t of ['Save info', 'Salvați informațiile', 'Not Now', 'Nu acum', 'Not now', 'Cancel', 'Anulează']) {
      if (checkOnly && ['Save info', 'Salvați informațiile'].includes(t)) continue;
      const prompt = page.getByRole('button', { name: t, exact: true }).first();
      if (await prompt.isVisible()) await prompt.click({ timeout: 1500 });
    }

    if (!(await isLoggedIn(page))) {
      console.log('⚠️ Nu ești autentificat pe Instagram.');
      await snap(page, 'reel_02_not_logged_in.png');
      throw new Error('Nu ești autentificat pe Instagram. Rulează sesiunea de autentificare.');
    }

    console.log('✓ Autentificat pe Instagram!');
    if (!checkOnly) await snap(page, 'reel_03_authenticated.png');

    console.log('📌 Deschidem meniul Create...');
    const fileInput = await openInstagramPostComposer(page);
    if (checkOnly) {
      if (await fileInput.inputValue()) throw new Error('Check mode expected an empty upload input.');
      console.log('REEL CHECK PASSED: authenticated; empty upload composer ready; nothing uploaded or published.');
      return;
    }
    await snap(page, 'reel_05_create_dialog.png');
    console.log('📌 Urcăm videoclipul:', videoPath);
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

    console.log('📌 Păstrăm aspect ratio Original (9:16) și închidem meniul de crop...');
    await selectOriginalReelCrop(page);
    await snap(page, 'reel_06_crop_ready.png');

    // Pasul 1: Next din ecranul de Crop
    console.log('📌 Apăsăm Next (Pasul 1 - Crop)...');
    const nextBtn1 = page.getByRole('button', { name: /^(Next|Înainte)$/ }).filter({ visible: true }).first();
    await nextBtn1.waitFor({ state: 'visible', timeout: 10000 });
    await nextBtn1.click();
    await page.waitForTimeout(3000);
    await snap(page, 'reel_07_cover_step.png');

    // Pasul 2: Next din ecranul de Cover photo / Trim (dacă există)
    const nextBtn2 = page.getByRole('button', { name: /^(Next|Înainte)$/ }).filter({ visible: true }).first();
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
      throw new Error('Instagram did not confirm Reel publication. Check reel_10_result.png before retrying; media and history are preserved.');
    }

  } catch (error) {
    await snap(page, checkOnly ? 'reel_check_error.png' : 'reel_error.png');
    throw error;
  } finally {
    await context.close();
  }
}

autoPostReelToInstagram().catch(err => {
  console.error('❌ Eroare la postare Reel:', err.message);
  process.exit(1);
});
