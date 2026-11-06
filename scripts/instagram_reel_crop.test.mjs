import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium } from 'playwright';
import { selectOriginalReelCrop } from './instagram_reel_crop.mjs';

for (const closesOnSelect of [false, true]) {
  test(`Next receives pointer events when crop selection ${closesOnSelect ? 'closes' : 'leaves open'} the picker`, async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent(`
        <div role="dialog">
          <div role="button" id="next" style="position:absolute;top:20px;left:300px">Next</div>
          <div role="button" id="crop" style="position:absolute;top:200px;left:20px;z-index:3">
            <svg aria-label="Select crop" width="20" height="20"></svg>
          </div>
          <div id="picker" hidden>
            <div id="backdrop" style="position:fixed;inset:0;z-index:1"></div>
            <div role="button" id="original" style="position:absolute;top:150px;left:20px;z-index:2">Original</div>
          </div>
        </div>
        <script>
          const picker = document.querySelector('#picker');
          document.querySelector('#crop').onclick = () => { picker.hidden = !picker.hidden; };
          document.querySelector('#original').onclick = () => {
            document.body.dataset.ratio = '9:16';
            if (${closesOnSelect}) picker.hidden = true;
          };
          document.querySelector('#next').onclick = () => { document.body.dataset.step = 'cover'; };
        </script>`);

      // Reproduce the old flow and its intercepted Next before testing the fix.
      if (!closesOnSelect) {
        await page.locator('#crop').click();
        await page.getByText('Original', { exact: true }).click();
        await assert.rejects(page.getByRole('button', { name: 'Next', exact: true }).click({ timeout: 600 }), /intercepts pointer events/);
        await page.locator('#crop').click();
      }

      await selectOriginalReelCrop(page);
      await page.getByRole('button', { name: 'Next', exact: true }).click({ timeout: 2000 });
      assert.equal(await page.locator('body').getAttribute('data-ratio'), '9:16');
      assert.equal(await page.locator('body').getAttribute('data-step'), 'cover');
      assert.equal(await page.locator('#picker').isVisible(), false);
    } finally { await browser.close(); }
  });
}
