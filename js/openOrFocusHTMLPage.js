export { openOrFocusHTMLPage };

/**
 * Opens an HTML page in a new tab, if already opened focuses it.
 * @param {string} html_page - The HTML page to open.
 */
async function openOrFocusHTMLPage(html_page) {
  const url = await browser.runtime.getURL(html_page);
  const tabs = await browser.tabs.query({ url });

  if (tabs.length > 0) {
    await browser.tabs.update(tabs[0].id, { active: true });
  } else {
    await browser.tabs.create({ url, active: true });
  }
}
