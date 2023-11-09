export { saveSettings };

/**
 * Function that save setting(s) to local storage.
 * @param {object} settingsToSave - The settings object to save to local storage.
 * @returns A promise that resolves when the settings have been saved.
 */
function saveSettings(settingsToSave) {
  return browser.storage.local.set(settingsToSave);
}
