export { saveSettings };

// Save setting
async function saveSettings(settingsToSave) {
  await browser.storage.local.set(settingsToSave);
}
