import { retrieveSettings } from "../js/retrieveSettings.js";
import { saveSettings } from "../js/saveSettings.js";
import { defaultBookmarkSaveLocation } from "../js/defaultBookmarkSaveLocation.js";
import { isSaveBookmarkFolderIdIllegal } from "../js/isSaveBookmarkFolderIdIllegal.js";

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
  checkboxUpdateBookmarksAtBrowserStartup.checked = typeof settings.updateBookmarksAtBrowserStartup === 'boolean' ? settings.updateBookmarksAtBrowserStartup : false;
  bookmarkFolderIdInput.placeholder = settings.settingBookmarkSaveLocation;

  // Add event listeners for checkbox changes on the HTML settings page
  addCheckboxChangeListener(checkboxUpdateBookmarksAtBrowserStartup, "updateBookmarksAtBrowserStartup");

  bookmarkFolderIdInput.addEventListener("input", function() {
    if (bookmarkFolderIdInput.value !== "" && bookmarkFolderIdInput.value.length !== 12) {
      bookmarkFolderIdInput.style.borderColor = "red";
    } else {
      bookmarkFolderIdInput.style.borderColor = "";
    }
  });

  saveBookmarkFolderIdButton.addEventListener("click", async function() {
    await handleSaveBookmarkFolderIdButtonAction();
  });

  bookmarkFolderIdInput.addEventListener("keydown", async function(event) {
    if (event.key === "Enter") {
      await handleSaveBookmarkFolderIdButtonAction();
    }
  });

  // Add a click event listener to the 'resetBookmarkFolderIdButton' button
  resetBookmarkFolderIdButton.addEventListener("click", async function() {
    await saveSettings({
      settingBookmarkSaveLocation: defaultBookmarkSaveLocation
    });
    bookmarkFolderIdInput.placeholder = defaultBookmarkSaveLocation;
    bookmarkFolderIdInput.value = "";
  });

  // Add an event listener for storage changes
  browser.storage.onChanged.addListener(handleSettingChange);

  // Function to handle changes to the setting
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

  function addCheckboxChangeListener(checkboxHtmlId, localStorageKey) {
    checkboxHtmlId.addEventListener("change", async () => {
      const settingsObj = { [localStorageKey]: checkboxHtmlId.checked }; // Create a settings object with a dynamic key based on localStorageKey and set its value to the checked state of the checkbox element
      await saveSettings(settingsObj); // Saving the settings based on checkbox changes
    });
  }


  async function handleSaveBookmarkFolderIdButtonAction() {
    if (bookmarkFolderIdInput.value.length !== 12) {
      const textError = `The specified [bookmark_folder_id: ${bookmarkFolderIdInput.value}] doesn't match a length of 12 characters.`;
      console.error(textError);
      alert(textError);
      return;
    }

    let bookmarks;
    let bookmark;
    try {
      bookmarks = await browser.bookmarks.get(bookmarkFolderIdInput.value);
      bookmark = bookmarks[0];
    } catch (error) {
      const textError = `The specified [bookmark_folder_id: ${bookmarkFolderIdInput.value}] does not exist in your bookmarks tree.`;
      console.error(error);
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

    if (!bookmark || bookmark.type !== "folder") {
      const textError = `The specified [bookmark_folder_id: ${bookmarkFolderIdInput.value}] is not a valid bookmark folder.`;
      console.error(textError);
      alert(textError);
      return;
    }

    await saveSettings({
      settingBookmarkSaveLocation: bookmarkFolderIdInput.value
    });
    bookmarkFolderIdInput.placeholder = bookmarkFolderIdInput.value;
    bookmarkFolderIdInput.value = "";
  };

});
