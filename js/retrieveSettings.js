export { retrieveSettings };

/**
 * Function that retrieve setting(s) from local storage.
 * @async
 * @param {null|string|Object|string[]} settingsToRetrieve - The identifier(s) for the setting(s) to retrieve.
 * @returns {Promise<Object>} An object with the retrieved settings.
 * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/get `storage.local.get`} on MDN
 */
async function retrieveSettings(settingsToRetrieve) {
  return await browser.storage.local.get(settingsToRetrieve);
}
