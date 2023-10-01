export { retrieveSettings };

// Retrieve settings from local storage
function retrieveSettings(settingsToRetrieve) {
  return browser.storage.local.get(settingsToRetrieve);
}
