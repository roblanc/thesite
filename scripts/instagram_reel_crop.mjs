// Ratio selection can leave Instagram's crop popover/backdrop open. Close it
// explicitly so Next receives a real pointer click, rather than forcing through.
export async function selectOriginalReelCrop(page) {
  const crop = page.locator('svg[aria-label="Select crop"], svg[aria-label="Selectează decuparea"]')
    .locator('xpath=ancestor::*[self::button or @role="button"][1]').first();
  await crop.waitFor({ state: 'visible', timeout: 10000 });
  await crop.click({ timeout: 5000 });

  // reel.mp4 is already 1080x1920: Original preserves its full 9:16 frame.
  const original = page.getByText('Original', { exact: true }).filter({ visible: true }).last();
  await original.waitFor({ state: 'visible', timeout: 5000 });
  await original.click({ timeout: 5000 });

  // Some Instagram versions close on selection; others keep the picker open.
  if (await original.isVisible()) {
    await crop.click({ timeout: 5000 });
    await original.waitFor({ state: 'hidden', timeout: 5000 });
  }
}
