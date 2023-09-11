export { retrieveSettings };

// Retrieve settings from local storage
async function retrieveSettings(settingsToRetrieve) {
  const settings = await browser.storage.local.get(settingsToRetrieve);
  return settings;
}
