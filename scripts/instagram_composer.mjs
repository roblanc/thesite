// Only dismiss the known informational announcement; never bypass unknown dialogs.
export async function dismissMetaAnnouncement(page) {
  const title = page.getByText('Your Meta Account is here', { exact: true });
  if (!await title.isVisible()) return false;

  const panel = title.locator('xpath=ancestor::*[.//*[@aria-label="Close" or @aria-label="Închide"]][1]');
  const close = panel.locator('[aria-label="Close"], [aria-label="Închide"]').first();
  const button = close.locator('xpath=ancestor-or-self::*[self::button or @role="button"][1]');
  await button.click({ timeout: 5000 });
  await title.waitFor({ state: 'hidden', timeout: 5000 });
  console.log('✓ Meta Account announcement dismissed.');
  return true;
}

export async function openInstagramPostComposer(page) {
  await dismissMetaAnnouncement(page);
  const create = page.locator('svg[aria-label="New post"], svg[aria-label="New posts"], svg[aria-label="Postare nouă"], svg[aria-label="Create"]')
    .locator('xpath=ancestor::*[self::a or self::button or @role="button"][1]').first();
  try {
    await create.click({ timeout: 5000 });
  } catch (error) {
    // The announcement can arrive after the feed/navigation is already visible.
    if (!await dismissMetaAnnouncement(page)) throw error;
    await create.click({ timeout: 5000 });
  }

  const fileInput = page.locator('input[type="file"]').first();
  if (!await fileInput.count()) {
    await page.getByText(/^(Post|Postare)$/).filter({ visible: true }).last().click({ timeout: 5000 });
  }
  await fileInput.waitFor({ state: 'attached', timeout: 15000 });
  return fileInput;
}
