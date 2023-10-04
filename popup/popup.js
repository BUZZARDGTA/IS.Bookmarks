import { urlISDatabaseAPI, successImportingISdatabase, successButtonClass, secondaryDisabledButtonClass, dangerDisabledButtonClass} from "../js/constants.js";
import { makeWebRequest } from "../js/makeWebRequest.js";
import { isResponseUp } from "../js/isResponseUp.js";
import { retrieveSettings } from "../js/retrieveSettings.js";
import { formatDate } from "../js/formatDate.js";
import { extensionMessageSender } from "../js/extensionMessageSender.js";

document.addEventListener("DOMContentLoaded", async function () {
  const ISDbLastUpdatedDate = document.getElementById("ISDbLastUpdatedDate");
  const ISDbLastImportedDate = document.getElementById("ISDbLastImportedDate");
  const importButton = document.getElementById("importButton");
  const settingsButton = document.getElementById("settingsButton");

  let jsonISDatabaseAPI;

  const responseISDatabaseAPI = await makeWebRequest(urlISDatabaseAPI);
  if (isResponseUp(responseISDatabaseAPI)) {
    jsonISDatabaseAPI = await responseISDatabaseAPI.json();
    const commitDate = jsonISDatabaseAPI[0].commit.committer.date;

    const formattedDate = formatDate(commitDate);
    ISDbLastUpdatedDate.innerText = formattedDate;
  }

  const { settingISDbLastImportedDate } = await retrieveSettings("settingISDbLastImportedDate");
  if (settingISDbLastImportedDate) {
    ISDbLastImportedDate.innerText = settingISDbLastImportedDate;
  }

  browser.runtime.onMessage.addListener(messageListener);

  importButton.addEventListener("click", handleImportButton);
  settingsButton.addEventListener("click", handleSettingsButton);


  /**
   * Function that sends a message to the background script, which will remains active in the background, and initiate the creation of the bookmarks.
   * @async
   * @returns {Promise<void>} A promise that resolves when the bookmark tree has been successfully created.
   */
  async function handleImportButton() {
    importButton.className = secondaryDisabledButtonClass;

    const backgroundScriptResponse = await extensionMessageSender("importButton", jsonISDatabaseAPI);
    if (backgroundScriptResponse !== successImportingISdatabase) {
      importButton.innerText = "FAIL";
      importButton.className = dangerDisabledButtonClass;
    }
  }

  /**
   * Function that opens the extension's HTML settings page, and closes the current HTML popup window.
   * @returns {Promise<void>} A promise that resolves when the HTML popup window closed.
   * @see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create `tabs.create`} on MDN
   */
  function handleSettingsButton() {
    browser.tabs.create({ url:"../settings/settings.html", active: true });
    window.close();
  }

  /**
   * Function that listens for a message received from the `runtime.onMessage` event listener.
   *
   * If the {@link message} equal `updateProgress`, it will update some elements in the HTML popup window.
   * @param {Object} message - The message received.
   * @returns {void}
   */
  function messageListener(message) {
    if (message.action === "updateProgress") {
      if (ISDbLastImportedDate.innerText !== message.payload.updateISDbLastImportedDate) {
        ISDbLastImportedDate.innerText = message.payload.updateISDbLastImportedDate;
      }

      if (message.payload.progress === 100) {
        importButton.innerText = "DONE";
        importButton.className = successButtonClass;
      } else {
        if (importButton.className !== secondaryDisabledButtonClass) {
          importButton.className = secondaryDisabledButtonClass;
        }

        importButton.innerText = `${message.payload.progress.toFixed(1)}%`;
      }
    }
  }
});
