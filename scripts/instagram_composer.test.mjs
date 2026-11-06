import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium } from 'playwright';
import { dismissMetaAnnouncement, openInstagramPostComposer } from './instagram_composer.mjs';

test('dismisses the Meta announcement and opens the upload dialog without uploading', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`
      <a href="#" id="create"><div><svg aria-label="New post"></svg>Create</div></a>
      <div role="dialog" id="announcement" style="position:fixed;inset:0;background:white">
        <h2>Your Meta Account is here</h2>
        <div role="button" id="close"><svg aria-label="Close"></svg></div>
      </div>
      <script>
        document.querySelector('#close').onclick = () => document.querySelector('#announcement').remove();
        document.querySelector('#create').onclick = () => {
          const post = document.createElement('button'); post.textContent = 'Post';
          post.onclick = () => { const input = document.createElement('input'); input.type = 'file'; document.body.append(input); };
          document.body.append(post);
          const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          icon.innerHTML = '<title>Post</title>'; document.body.append(icon);
        };
      </script>`);
    const fileInput = await openInstagramPostComposer(page);
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.equal(await fileInput.inputValue(), '');
    assert.equal(await dismissMetaAnnouncement(page), false);
  } finally { await browser.close(); }
});

test('does not dismiss an unrelated security dialog', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<div role="dialog"><h2>Verify your account</h2><button aria-label="Close">Close</button></div>');
    assert.equal(await dismissMetaAnnouncement(page), false);
    assert.equal(await page.getByRole('dialog').count(), 1);
  } finally { await browser.close(); }
});
