export { retrieveSettings };

/**
 * Function that retrieve setting(s) from local storage.
 * @param {null|string|object|string[]} settingsToRetrieve - The identifier(s) for the setting(s) to retrieve.
 * @returns {Promise<object>} A promise that resolves with an object containing the retrieved settings.
 */
function retrieveSettings(settingsToRetrieve) {
  return browser.storage.local.get(settingsToRetrieve);
}
