import { retrieveSettings } from "../js/retrieveSettings.js";
import { saveSettings } from "../js/saveSettings.js";

document.addEventListener("DOMContentLoaded", async function () {

  const checkboxUpdateBookmarksAtBrowserStartup = document.getElementById("checkboxUpdateBookmarksAtBrowserStartup");

  /*
  This initialize HTML checkboxes to match internal storage values.
  Subsequently, the HTML interface enables users to toggle checkboxes, and event listeners respond to these.
  */
  const currentSettings = await retrieveSettings();
  checkboxUpdateBookmarksAtBrowserStartup.checked = typeof currentSettings.updateBookmarksAtBrowserStartup === 'boolean' ? currentSettings.updateBookmarksAtBrowserStartup : false;

  // Add event listeners for checkbox changes on the HTML settings page
  addCheckboxChangeListener(checkboxUpdateBookmarksAtBrowserStartup, "updateBookmarksAtBrowserStartup");


  function addCheckboxChangeListener(checkboxHtmlId, localStorageKey) {
    checkboxHtmlId.addEventListener("change", async () => {
      const settingsObj = { [localStorageKey]: checkboxHtmlId.checked }; // Create a settings object with a dynamic key based on localStorageKey and set its value to the checked state of the checkbox element
      await saveSettings(settingsObj); // Saving the settings based on checkbox changes
    });
  }

});
