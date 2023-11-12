import { retrieveSettings } from "/js/retrieveSettings.js";
import { saveSettings } from "/js/saveSettings.js";
import { defaultBookmarkSaveLocation } from "/js/constants.js";
import { isSaveBookmarkFolderIdIllegal } from "/js/isSaveBookmarkFolderIdIllegal.js";

document.addEventListener("DOMContentLoaded", async function () {
  const checkboxUpdateBookmarksAtBrowserStartup = document.getElementById("checkboxUpdateBookmarksAtBrowserStartup");
  const bookmarkFolderIdInput = document.getElementById("bookmarkFolderIdInput");
  const saveBookmarkFolderIdButton = document.getElementById("saveBookmarkFolderIdButton");
  const resetBookmarkFolderIdButton = document.getElementById("resetBookmarkFolderIdButton");

  /*
  This initialize HTML checkboxes to match internal storage values.
  Subsequently, the HTML interface enables users to toggle checkboxes, and event listeners respond to these.
  */
  const settings = await retrieveSettings();
  checkboxUpdateBookmarksAtBrowserStartup.checked = typeof settings.updateBookmarksAtBrowserStartup === "boolean" ? settings.updateBookmarksAtBrowserStartup : false;
  bookmarkFolderIdInput.placeholder = settings.settingBookmarkSaveLocation;

  // Add event listeners for checkbox changes on the HTML settings page
  addCheckboxChangeListener(checkboxUpdateBookmarksAtBrowserStartup, "updateBookmarksAtBrowserStartup");

  bookmarkFolderIdInput.addEventListener("input", function () {
    if (bookmarkFolderIdInput.value !== "" && bookmarkFolderIdInput.value.length !== 12) {
      bookmarkFolderIdInput.style.borderColor = "red";
    } else {
      bookmarkFolderIdInput.style.borderColor = "";
    }
  });

  saveBookmarkFolderIdButton.addEventListener("click", async function () {
    await handleSaveBookmarkFolderIdButtonAction();
  });

  bookmarkFolderIdInput.addEventListener("keydown", async function (event) {
    if (event.key === "Enter") {
      await handleSaveBookmarkFolderIdButtonAction();
    }
  });

  resetBookmarkFolderIdButton.addEventListener("click", async function () {
    await saveSettings({
      settingBookmarkSaveLocation: defaultBookmarkSaveLocation,
    });
    bookmarkFolderIdInput.placeholder = defaultBookmarkSaveLocation;
    bookmarkFolderIdInput.value = "";
  });

  browser.storage.onChanged.addListener(handleSettingChange);

  /**
   * Function that adds an event listener to the `browser.storage` changes. Then handles setting changes in local storage.
   * @param {object} changes - An object representing the changes in storage.
   * @param {string} areaName - The name of the storage area where the changes occurred.
   */
  function handleSettingChange(changes, areaName) {
    if (areaName !== "local") {
      return;
    }
    if (changes.hasOwnProperty("settingBookmarkSaveLocation")) {
      const newValue = changes.settingBookmarkSaveLocation.newValue;
      bookmarkFolderIdInput.placeholder = newValue;
      bookmarkFolderIdInput.value = "";
    }
  }

  /**
   * Function that adds an event listener to a checkbox element.
   *
   * This function listens for changes in the specified checkbox element and updates a corresponding setting in local storage based on its checked state.
   * @param {HTMLElement} checkboxHtmlId - The HTML checkbox element to attach the change listener to.
   * @param {string} localStorageKey - The key used to store the setting in local storage.
   */
  function addCheckboxChangeListener(checkboxHtmlId, localStorageKey) {
    checkboxHtmlId.addEventListener("change", async function () {
      const settingsObj = { [localStorageKey]: checkboxHtmlId.checked }; // Create a settings object with a dynamic key based on localStorageKey and set its value to the checked state of the checkbox element
      await saveSettings(settingsObj); // Saving the settings based on checkbox changes
    });
  }

  /**
   * Function that checks if the {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/BookmarkTreeNode#id `bookmark folder id`} is valid, then saves it in the {@link saveSettings settings}.
   * @returns A promise that resolves when the setting has been saved or when the folder is invalid.
   */
  async function handleSaveBookmarkFolderIdButtonAction() {
    if (bookmarkFolderIdInput.value.length !== 12) {
      const textError = `The specified [bookmark_folder_id: ${bookmarkFolderIdInput.value}] doesn't match a length of 12 characters.`;
      console.error(textError);
      alert(textError);
      return;
    }

    let bookmark;
    try {
      [bookmark] = await browser.bookmarks.get(bookmarkFolderIdInput.value);
    } catch (error) {
      const textError = `The specified [bookmark_folder_id: ${bookmarkFolderIdInput.value}] does not exist in your bookmarks tree.`;
      console.error(error);
      console.error(textError);
      alert(textError);
      return;
    }

    if (!bookmark || bookmark.type !== "folder") {
      const textError = `The specified [bookmark_folder_id: ${bookmarkFolderIdInput.value}] is not a valid bookmark folder.`;
      console.error(textError);
      alert(textError);
      return;
    }

    if (isSaveBookmarkFolderIdIllegal(bookmarkFolderIdInput.value)) {
      const textError = `The specified [bookmark_folder_id: ${bookmarkFolderIdInput.value}] is an illegal bookmark folder.`;
      console.error(textError);
      alert(textError);
      return;
    }

    await saveSettings({
      settingBookmarkSaveLocation: bookmarkFolderIdInput.value,
    });
    bookmarkFolderIdInput.placeholder = bookmarkFolderIdInput.value;
    bookmarkFolderIdInput.value = "";
  }
});
