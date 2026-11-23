import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const studio = 'https://www.tiktok.com/tiktokstudio/upload';
const profile = 'https://www.tiktok.com/@thesite.ro';
const browserConfig = process.env.THESITE_BROWSEROS_CONFIG ??
  path.join(os.homedir(), '.local/state/thesite-tiktok/profile/.browseros/config.json');
const outbox = fileURLToPath(new URL('../social_export/tiktok-outbox/', import.meta.url));
const carouselFiles = ['1_cover.png', '2_headlines.png', '3_cta.png'];
const maxAge = 45 * 60 * 1000;
const checkOnly = process.argv.includes('--check-account');
const previewOnly = process.argv.includes('--preview-only');

let endpoint;
let rpcId = 0;
let sessionId;

async function rpc(method, params, notification = false) {
  const id = notification ? undefined : ++rpcId;
  const headers = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
  };
  if (sessionId) headers['mcp-session-id'] = sessionId;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    signal: AbortSignal.timeout(60_000),
  });
  sessionId ??= response.headers.get('mcp-session-id');
  if (!response.ok) throw new Error(`${method}: HTTP ${response.status}`);
  if (notification) {
    await response.body?.cancel();
    return;
  }
  if (response.headers.get('content-type')?.includes('application/json')) {
    const message = await response.json();
    if (message.error) throw new Error(message.error.message);
    return message.result;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffered = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffered += decoder.decode(value, { stream: true });
      let end;
      while ((end = buffered.indexOf('\n')) !== -1) {
        const line = buffered.slice(0, end).trim();
        buffered = buffered.slice(end + 1);
        if (!line.startsWith('data: {')) continue;
        const message = JSON.parse(line.slice(6));
        if (message.id !== id) continue;
        if (message.error) throw new Error(message.error.message);
        return message.result;
      }
    }
  } finally {
    await reader.cancel();
  }
  throw new Error(`BrowserOS did not return ${method}`);
}

async function tool(name, args = {}) {
  const result = await rpc('tools/call', { name, arguments: args });
  const output = result.content.filter(item => item.type === 'text').map(item => item.text).join('\n');
  if (result.isError) throw new Error(`BrowserOS ${name}: ${output.split('\n')[0]}`);
  return output;
}

async function open(url) {
  const output = await tool('tabs', { action: 'new', url });
  const page = Number(output.match(/opened page (\d+)/i)?.[1]);
  if (!page) throw new Error('BrowserOS did not return a page ID');
  return page;
}

function snapshot(page) {
  return tool('snapshot', { page });
}

function target(tree, pattern) {
  const line = tree.split('\n').find(line => pattern.test(line));
  return line?.match(/\[ref=(e\d+)\]/)?.[1];
}

async function click(page, tree, pattern) {
  const ref = target(tree, pattern);
  if (!ref) throw new Error(`Expected TikTok control missing: ${pattern}`);
  await tool('act', { page, ref, kind: 'click', diff: 'none' });
}

async function waitFor(page, predicate, timeoutMs = 12_000) {
  const deadline = Date.now() + timeoutMs;
  do {
    const tree = await snapshot(page);
    if (predicate(tree)) return tree;
    await sleep(800);
  } while (Date.now() < deadline);
  throw new Error('TikTok did not reach the expected screen');
}

async function verifyAccount(page) {
  const tree = await waitFor(page, value => /region "Notifications"|Log in (?:to TikTok|with QR code)|origin=https:\/\/www\.tiktok\.com\/login/.test(value));
  if (/Log in to TikTok|origin=https:\/\/www\.tiktok\.com\/login/.test(tree)) {
    throw new Error('The Hetzner BrowserOS profile needs TikTok sign-in');
  }
  const accountSection = tree.split('region "Notifications"')[1]?.split('region "Toasts"')[0] ?? '';
  await click(page, accountSection, /button .*\[collapsed\]/);
  const menu = await waitFor(page, value => /link "Profile"/.test(value));
  if (!menu.includes(`link "Profile"`) || !menu.includes(`[url="${profile}"]`)) {
    throw new Error('Signed-in TikTok profile is not @thesite.ro');
  }
  await click(page, menu.split('region "Notifications"')[1]?.split('region "Toasts"')[0] ?? menu, /button .*\[expanded\]/);
}

function nextPackage() {
  const candidates = [];
  for (const id of fs.readdirSync(outbox)) {
    if (!/^[a-f0-9]{24}$/.test(id)) continue;
    const dir = path.join(outbox, id);
    if (fs.existsSync(path.join(dir, 'tiktok-attempt')) || fs.existsSync(path.join(dir, 'tiktok-published.txt'))) continue;
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
    const files = manifest.kind === 'carousel' ? carouselFiles : ['reel.mp4'];
    const age = Date.now() - Date.parse(manifest.publishedAt);
    if (
      manifest.id === id && ['carousel', 'reel'].includes(manifest.kind) &&
      JSON.stringify(manifest.files) === JSON.stringify(files) && String(manifest.title ?? '').trim() &&
      age >= 0 && age <= maxAge && files.every(file => fs.statSync(path.join(dir, file)).size > 0)
    ) {
      candidates.push({ dir, files, manifest });
    }
  }
  return candidates.sort((a, b) => b.manifest.publishedAt.localeCompare(a.manifest.publishedAt))[0];
}

function prepareCarousel(dir, files) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'thesite-tiktok-'));
  try {
    const paths = files.map((file, i) => {
      const output = path.join(temp, `${i + 1}.jpg`);
      execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-i', path.join(dir, file), '-vf', 'scale=1080:-2', '-frames:v', '1', '-q:v', '2', output], { timeout: 15_000 });
      return output;
    });
    return { temp, paths };
  } catch (error) {
    fs.rmSync(temp, { recursive: true, force: true });
    throw error;
  }
}

function description(manifest) {
  const caption = manifest.caption.replace(/(?:#[^\s#]+\s*)+$/u, '').trimEnd();
  return `${caption}\n\n#stiri #romania #presaromana`.slice(0, 2100);
}

async function fillComposer(page, tree, manifest, photo) {
  const fields = [];
  if (photo) {
    const ref = target(tree, /textbox "Add a catchy title"/);
    if (!ref) throw new Error('TikTok photo title field missing');
    fields.push({ ref, value: manifest.title.slice(0, 90) });
  }
  const ref = target(tree, /textbox "Description"/) ??
    target(tree, /^(?!.*(?:Everyone|Only you)).*combobox(?: "Description")? \[collapsed\]/);
  if (!ref) throw new Error('TikTok caption field missing');
  fields.push({ ref, value: description(manifest) });
  await tool('act', { page, kind: 'fill', fields, diff: 'none' });

  const updated = await snapshot(page);
  if (!/\bEveryone\b/.test(updated) || !updated.includes(manifest.title.slice(0, 30))) {
    throw new Error('Could not verify TikTok caption and public visibility');
  }
  return updated;
}

function matchingPost(tree, title) {
  const prefix = title.trim().slice(0, 42).replace(/\s+/g, ' ').toLocaleLowerCase('ro');
  for (const line of tree.split('\n')) {
    const link = line.match(/https:\/\/www\.tiktok\.com\/@thesite\.ro\/(?:photo|video)\/\d+/)?.[0];
    if (link && line.replace(/\s+/g, ' ').toLocaleLowerCase('ro').includes(prefix)) return link;
  }
}

async function publish(page, entry) {
  const { dir, files, manifest } = entry;
  const photo = manifest.kind === 'carousel';
  let view;
  let temp;
  try {
    view = await open(profile);
    const existing = await waitFor(view, tree => /heading "thesite\.ro"|thesite\.ro created by/i.test(tree));
    const existingUrl = matchingPost(existing, manifest.title);
    if (existingUrl) return existingUrl;

    let tree = await snapshot(page);
    if (photo) {
      await click(page, tree, /^\s*- tab "Photos"/);
      tree = await waitFor(page, value => Boolean(target(value, /button "Select photos"/)));
    }
    const ref = target(tree, photo ? /button "Select photos"/ : /button "Select video"/);
    if (!ref) throw new Error('TikTok upload picker missing');
    let paths;
    if (photo) {
      const prepared = prepareCarousel(dir, files);
      temp = prepared.temp;
      paths = prepared.paths;
    } else {
      paths = files.map(file => path.join(dir, file));
    }
    // This BrowserOS version uploads using a ref to the site's real file input.
    await tool('evaluate', { page, code: `
      const mode = "${photo ? 'image' : 'video'}";
      const inputs = [...document.querySelectorAll('input[type="file"]')];
      const field = inputs.find(input => input.accept.includes(mode)) ?? (inputs.length === 1 && inputs[0]);
      if (!field) throw new Error('TikTok file input missing');
      field.style.setProperty('display', 'block', 'important');
      field.setAttribute('aria-label', 'TheSite media upload');
    ` });
    const uploadTree = await snapshot(page);
    const inputRef = target(uploadTree, /button "TheSite media upload" \[/);
    if (!inputRef) throw new Error('BrowserOS did not expose the TikTok file input');
    await tool('upload', { page, ref: inputRef, files: paths });
    const hasPost = value => Boolean(target(value, /button "Post"/));
    const hasContentPrompt = value => /checkbox "Content check lite"/i.test(value);
    const composerVisible = value => hasPost(value) || hasContentPrompt(value);
    tree = await waitFor(page, composerVisible, 55_000);
    for (let i = 0; i < 4; i++) {
      if (hasContentPrompt(tree)) {
        await click(page, tree, /button "Cancel"/);
      } else if (tree.includes('New editing features added') && target(tree, /button "Got it"/)) {
        await click(page, tree, /button "Got it"/);
      } else if (target(tree, /button "Decline optional cookies" \[ref=/)) {
        await click(page, tree, /button "Decline optional cookies" \[ref=/);
      } else {
        break;
      }
      tree = await waitFor(page, composerVisible);
    }
    tree = await fillComposer(page, tree, manifest, photo);
    const postRef = target(tree, /button "Post"/);
    if (!postRef) throw new Error('TikTok Post button missing after upload');

    if (previewOnly) {
      console.log(`Verified TikTok ${manifest.kind} composer and public visibility without submitting.`);
      return;
    }

    // The reservation also protects against overlapping invocations during a cutover.
    fs.mkdirSync(path.join(dir, 'tiktok-attempt'));
    await tool('act', { page, kind: 'click', ref: postRef, diff: 'none' });
    for (let i = 0; i < 6; i++) {
      await tool('tabs', { action: 'close', page: view });
      view = await open(profile);
      const published = await waitFor(view, value => /heading "thesite\.ro"/.test(value));
      const url = matchingPost(published, manifest.title);
      if (url) return url;
      await sleep(5000);
    }
    throw new Error('TikTok submission is unconfirmed. Reservation kept for manual verification.');
  } finally {
    if (view) await tool('tabs', { action: 'close', page: view }).catch(() => {});
    if (temp) fs.rmSync(temp, { recursive: true, force: true });
  }
}

async function main() {
  const entry = checkOnly ? undefined : nextPackage();
  if (!checkOnly && !entry) return;
  const port = JSON.parse(fs.readFileSync(browserConfig, 'utf8')).ports?.server;
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('BrowserOS MCP port missing');
  endpoint = `http://127.0.0.1:${port}/mcp`;
  await rpc('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'thesite-tiktok', version: '1.0' },
  });
  await rpc('notifications/initialized', {}, true);
  await tool('name_session', { name: 'TikTok publishing', category: 'social-media' });
  await tool('tabs', { action: 'list' });

  const page = await open(studio);
  try {
    await verifyAccount(page);
    if (checkOnly) {
      console.log('Hetzner BrowserOS verified @thesite.ro');
      return;
    }
    const url = await publish(page, entry);
    if (url) {
      fs.writeFileSync(path.join(entry.dir, 'tiktok-published.txt'), `${url}\n`);
      console.log(`TikTok published ${entry.manifest.kind}: ${url}`);
    }
  } finally {
    await tool('tabs', { action: 'close', page }).catch(() => {});
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
