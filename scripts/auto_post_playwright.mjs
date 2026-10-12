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

/**
 * Script de Auto-Postare pe Instagram via Playwright Browser Automation
 * Folosește un profil persistent de browser (salvează sesiunea de login).
 */

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

async function autoPostToInstagram() {
  const profileDir = path.join(__dirname, '..', 'social_export', 'browser_profile');
  fs.mkdirSync(profileDir, { recursive: true });

  const latestDir = path.join(__dirname, '..', 'social_export', 'latest');
  const coverPath = path.join(latestDir, '1_cover.png');
  const captionPath = path.join(latestDir, 'caption.txt');

  if (!fs.existsSync(coverPath)) {
    throw new Error('❌ Imaginea 1_cover.png nu există! Rulează mai întâi: npm run generate:social');
  }

  // Căutăm toate slide-urile pentru carusel (1_cover.png, 2_headlines.png, 3_cta.png)
  const candidateImages = ['1_cover.png', '2_headlines.png', '3_cta.png']
    .map(name => path.join(latestDir, name))
    .filter(p => fs.existsSync(p));

  const caption = fs.existsSync(captionPath)
    ? fs.readFileSync(captionPath, 'utf8')
    : 'Nou pe thesite.ro #stiri';

  console.log('🚀 Deschidem browserul Chromium pentru Instagram...');

  const isHeadless = process.env.HEADLESS !== 'false';
  const context = await chromium.launchPersistentContext(profileDir, {
    headless: isHeadless,
    viewport: { width: 1280, height: 900 },
  });

  const page = context.pages()[0] || await context.newPage();

  console.log('📌 Navigăm pe Instagram.com...');
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  await snap(page, 'ig_01_loaded.png');

  // 1. Verificăm dacă suntem pe ecranul OneTap (Save your login info)
  const onetapSave = page.locator('button:has-text("Save info"), button:has-text("Salvați informațiile")').first();
  if (await onetapSave.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('📌 Ecranul Save info detectat. Salvăm datele...');
    await onetapSave.click();
    await page.waitForTimeout(4000);
  }

  // 2. Dacă profilul este salvat pe ecranul inițial cu butonul Continue
  const continueSavedProfile = page.locator('div[role="button"]:has-text("Continue"), button:has-text("Continue"), div[role="button"]:has-text("Continuă"), button:has-text("Continuă")').first();
  if (await continueSavedProfile.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('📌 Profil salvat detectat pe pagina de pornire. Apăsăm Continue...');
    await continueSavedProfile.click();
    await page.waitForTimeout(3000);

    // Dacă cere parola în modalul de profil salvat
    const modalPass = page.locator('input[type="password"], input[name="password"], input[name="pass"]').first();
    if (await modalPass.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('🔑 Introducem parola pentru contul salvat...');
      await modalPass.fill(process.env.INSTAGRAM_PASSWORD || '');
      await modalPass.press('Enter');
      await page.waitForTimeout(7000);
      await snap(page, 'ig_01_after_modal_login.png');

      const onetapBtn = page.locator('button:has-text("Save info"), button:has-text("Salvați informațiile"), button:has-text("Not now"), button:has-text("Nu acum")').first();
      if (await onetapBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await onetapBtn.click();
        await page.waitForTimeout(3000);
      }
    }
  }

  // 3. Verificăm dacă suntem autentificați complet
  if (!(await isLoggedIn(page))) {
    const user = process.env.INSTAGRAM_USERNAME;
    const pass = process.env.INSTAGRAM_PASSWORD;

    if (!user || !pass) {
      console.log('⚠️ Nu ești autentificat! Setează INSTAGRAM_USERNAME și INSTAGRAM_PASSWORD în .env');
      await context.close();
      return;
    }

    console.log('🔑 Autentificare cu user și parolă...');
    const userField = page.locator('input[name="username"], input[name="email"]').first();
    const passField = page.locator('input[name="password"], input[name="pass"]').first();

    if (!(await userField.isVisible({ timeout: 5000 }).catch(() => false))) {
      await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);
    }

    if (await userField.isVisible({ timeout: 4000 }).catch(() => false)) {
      await userField.fill(user);
      await passField.fill(pass);
      await snap(page, 'ig_02_filled.png');

      await passField.press('Enter');
      await page.waitForTimeout(8000);
      await snap(page, 'ig_03_after_login.png');
    }

    // Verificăm erorile de autentificare
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const errorAlert = await page.locator('#slfErrorAlert, div[role="alert"]').innerText().catch(() => '');
    const combinedText = `${bodyText} ${errorAlert}`.toLowerCase();

    const invalidCredsHints = [
      'incorrect', 'parolă incorect', 'parola incorect',
      'the login information you entered is incorrect',
      'find your account', 'there was a problem logging you into instagram'
    ];
    const credError = invalidCredsHints.find(h => combinedText.includes(h));
    if (credError) {
      await snap(page, 'ig_04_LOGIN_FAILED.png');
      throw new Error(`🛑 Credențiale Instagram invalide! Instagram a afișat: "The login information you entered is incorrect". Verifică INSTAGRAM_USERNAME și INSTAGRAM_PASSWORD în .env.`);
    }

    const challengeHints = ['help us verify', 'verify your account', 'security code', 'cod de securitate', 'suspicious'];
    const hit = challengeHints.find(h => combinedText.includes(h));
    if (hit || page.url().includes('/challenge') || page.url().includes('codeentry')) {
      await snap(page, 'ig_04_CHALLENGE.png');
      throw new Error(`🛑 Instagram cere cod suplimentar de securitate.`);
    }

    if (!(await isLoggedIn(page))) {
      await snap(page, 'ig_04_LOGIN_FAILED.png');
      throw new Error('🛑 Autentificarea a eșuat. Verifică screenshot-ul din social_export/logs/ig_03_after_login.png.');
    }
  }

  console.log('✓ Autentificat pe Instagram!');
  await snap(page, 'ig_05_feed.png');

  // Închidem popup-uri de "Save Info" / "Notifications"
  for (const t of ['Save info', 'Salvați informațiile', 'Not Now', 'Nu acum', 'Not now', 'Cancel', 'Anulează']) {
    await page.locator(`button:has-text("${t}")`).first().click({ timeout: 1500 }).catch(() => {});
  }

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
  await snap(page, 'ig_06_create_menu.png');

  // Selectăm "Post" din meniul Create
  const postClicked = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('span, a, div'));
    const postItem = els.find(el => el.textContent.trim() === 'Post' && el.offsetParent !== null);
    if (postItem) {
      postItem.click();
      return true;
    }
    return false;
  });

  if (postClicked) {
    console.log('📌 Selectat opțiunea "Post" din meniu.');
    await page.waitForTimeout(2500);
  }

  await snap(page, 'ig_06_create_dialog.png');

  // Urcăm imaginile
  console.log('📌 Urcăm fișierele:', candidateImages.join(', '));
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.waitFor({ state: 'attached', timeout: 15000 });
  await fileInput.setInputFiles(candidateImages);
  await page.waitForTimeout(4000);
  await snap(page, 'ig_07_uploaded.png');

  // Ajustare aspect ratio la 4:5 (Portrait)
  console.log('📌 Ajustăm decuparea la 4:5 (Portrait)...');
  try {
    const cropBtn = page.locator('button:has(svg[aria-label*="crop" i]), button:has(svg[aria-label*="decup" i]), svg[aria-label*="Select crop"], svg[aria-label*="Selectează decuparea"]').first();
    if (await cropBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await cropBtn.click();
      await page.waitForTimeout(600);
      
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, div[role="button"], span'));
        const p45 = buttons.find(b => b.textContent.includes('4:5') || b.textContent.trim() === 'Portrait' || b.textContent.trim() === 'Portret' || b.textContent.trim() === 'Original');
        if (p45) {
          p45.click();
          return true;
        }
        return false;
      });
      console.log('✓ Aspect ratio 4:5 selectat:', clicked);
      await page.waitForTimeout(600);
    }
  } catch (e) {
    console.warn('⚠️ Crop selector warning:', e.message);
  }

  // Next (x2: crop -> filters -> caption)
  console.log('📌 Apăsăm Next...');
  for (let i = 0; i < 2; i++) {
    const nextBtn = page.locator('div[role="button"]:has-text("Next"), button:has-text("Next"), button:has-text("Înainte"), div[role="button"]:has-text("Înainte")').first();
    await nextBtn.waitFor({ state: 'visible', timeout: 8000 });
    await nextBtn.click();
    await page.waitForTimeout(2000);
  }
  await snap(page, 'ig_08_caption_step.png');

  // Introducem caption-ul (textarea sau contenteditable)
  console.log('📌 Introducem caption-ul...');
  const captionBox = page.locator('div[role="dialog"] div[aria-label*="caption" i], div[role="dialog"] div[aria-label*="descriere" i], div[role="dialog"] div[contenteditable="true"][role="textbox"], textarea').first();
  if (await captionBox.isVisible({ timeout: 5000 }).catch(() => false)) {
    await captionBox.focus();
    await captionBox.fill(caption);
  } else {
    console.log('⚠️ Nu am găsit căsuța de caption, postează fără descriere.');
  }
  await page.waitForTimeout(1000);
  await snap(page, 'ig_09_caption_filled.png');

  // Share
  console.log('🚀 Publicăm postarea pe Instagram...');
  const dialogShare = page.locator('div[role="dialog"] div[role="button"]:has-text("Share"), div[role="dialog"] button:has-text("Share"), div[role="dialog"] div[role="button"]:has-text("Distribuie")').first();
  
  if (await dialogShare.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dialogShare.click({ force: true });
  } else {
    await page.evaluate(() => {
      const dialog = document.querySelector('div[role="dialog"]');
      if (dialog) {
        const btns = Array.from(dialog.querySelectorAll('div[role="button"], button'));
        const share = btns.find(b => b.textContent.trim() === 'Share' || b.textContent.trim() === 'Distribuie');
        if (share) share.click();
      }
    });
  }

  console.log('⏳ Așteptăm confirmarea publicării (poate dura până la 30s)...');
  
  // Așteptăm mesajul de confirmare sau apariția imaginii de bifat
  let isDone = false;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(2000);
    const bodyText = (await page.locator('body').innerText().catch(() => '')).toLowerCase();
    const hasSuccess = ['post shared', 'postare distribuită', 'your post has been shared', 'postarea ta a fost'].some(s => bodyText.includes(s));
    const checkmark = await page.locator('img[alt*="Animated checkmark"], img[alt*="bifat"], svg[aria-label*="bifat" i]').count();
    
    if (hasSuccess || checkmark > 0) {
      isDone = true;
      break;
    }
  }

  await page.waitForTimeout(3000);
  await snap(page, 'ig_10_post_result.png');

  if (isDone) {
    console.log('🎉 Postare publicată cu succes pe Instagram via Playwright Browser!');
    // Curățăm fișierele media din latest/ după publicare cu succes
    try {
      if (fs.existsSync(latestDir)) {
        const files = fs.readdirSync(latestDir);
        for (const file of files) {
          if (file.endsWith('.png') || file.endsWith('.jpg') || file === 'caption.txt') {
            fs.unlinkSync(path.join(latestDir, file));
          }
        }
        console.log('🧹 Fișierele media din social_export/latest au fost șterse după publicare.');
      }
    } catch (e) {
      console.warn('⚠️ Avertisment la ștergerea fișierelor media postate:', e.message);
    }
  } else {
    console.log('ℹ️ Fluxul s-a încheiat. Verifică captura ig_10_post_result.png.');
  }

  await context.close();
}

autoPostToInstagram().catch(err => {
  console.error('❌ Eroare la auto-postare browser:', err.message);
  process.exit(1);
});
