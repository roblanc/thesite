import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const mediaFiles = {
  carousel: ['1_cover.png', '2_headlines.png', '3_cta.png'],
  reel: ['reel.mp4'],
};
const retentionMs = 48 * 60 * 60 * 1000;

export function queueTikTokPost(latestDir, kind) {
  const outbox = path.join(path.dirname(latestDir), 'tiktok-outbox');
  if (!fs.existsSync(outbox)) return;

  let staging;
  try {
    const caption = fs.readFileSync(path.join(latestDir, 'caption.txt'), 'utf8').trim();
    if (!caption) throw new Error('Missing post caption');

    const title = caption.split('\n')[0].replace(/^thesite\.ro\s+/, '').split('. Vezi ')[0];
    const id = createHash('sha256').update(kind).update('\0').update(caption).digest('hex').slice(0, 24);
    const destination = path.join(outbox, id);
    if (fs.existsSync(destination)) return;

    staging = fs.mkdtempSync(path.join(outbox, '.pending-'));
    const tiktokDir = path.join(latestDir, 'tiktok');
    const mediaDir = kind === 'carousel' && fs.existsSync(tiktokDir) ? tiktokDir : latestDir;
    for (const file of mediaFiles[kind]) {
      fs.copyFileSync(path.join(mediaDir, file), path.join(staging, file));
    }

    const publishedAt = new Date().toISOString();
    fs.writeFileSync(
      path.join(staging, 'manifest.json'),
      JSON.stringify({ id, kind, title, caption, publishedAt, files: mediaFiles[kind] }, null, 2),
    );
    fs.renameSync(staging, destination);
    staging = undefined;
    console.log(`TikTok outbox: queued ${kind} ${id}`);

    for (const entry of fs.readdirSync(outbox, { withFileTypes: true })) {
      if (!entry.isDirectory() || !/^[a-f0-9]{24}$/.test(entry.name)) continue;
      const packageDir = path.join(outbox, entry.name);
      if (Date.now() - fs.statSync(packageDir).mtimeMs > retentionMs) {
        fs.rmSync(packageDir, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.error(`TikTok outbox: ${error.message}`);
  } finally {
    if (staging) fs.rmSync(staging, { recursive: true, force: true });
  }
}
