export { saveSettings };

// Save setting in local storage
function saveSettings(settingsToSave) {
  return browser.storage.local.set(settingsToSave);
}
