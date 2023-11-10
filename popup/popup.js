import { urlISDatabaseAPI, successImportingISdatabase, stopImportingISdatabase, failedImportButtonClass, successImportButtonClass, currentlyImportButtonClass } from "/js/constants.js";
import { makeWebRequest } from "/js/makeWebRequest.js";
import { isResponseUp } from "/js/isResponseUp.js";
import { retrieveSettings } from "/js/retrieveSettings.js";
import { formatDate } from "/js/formatDate.js";
import { extensionMessageSender } from "/js/extensionMessageSender.js";
import { openOrFocusHTMLPage } from "/js/openOrFocusHTMLPage.js";

document.addEventListener("DOMContentLoaded", async function () {
  const ISDbLastUpdatedDate = document.getElementById("ISDbLastUpdatedDate");
  const ISDbLastImportedDate = document.getElementById("ISDbLastImportedDate");
  const tutorialHtml = document.getElementById("tutorialHtml");
  const importButton = document.getElementById("importButton");
  const stopButton = document.getElementById("stopButton");
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

  // Event listener that sends a message to the background script, which will remains active in the background, and initiate the creation of the bookmarks.
  importButton.addEventListener("click", async function () {
    enableStopButton();
    importButton.className = currentlyImportButtonClass;
    importButton.innerText = "0%";

    await extensionMessageSender("importButton", jsonISDatabaseAPI);
  });

  // Event listener that opens the extension's tutorial page, and then closes the popup window.
  tutorialHtml.addEventListener("click", async function () {
    await openOrFocusHTMLPage("/html/tutorial.html");
    window.close();
  });

  // Event listener that opens the extension's settings page, and then closes the popup window.
  stopButton.addEventListener("click", async function () {
    await extensionMessageSender("stopButton");
  });

  // Event listener that opens the extension's settings page, and then closes the popup window.
  settingsButton.addEventListener("click", async function () {
    await openOrFocusHTMLPage("/settings/settings.html");
    window.close();
  });

  /**
   * Function that listens for a message received from the `runtime.onMessage` event listener.
   *
   * If the {@link message} equal `updateProgress`, it will update some elements in the HTML popup window.
   * @param {object} message - The message received.
   */
  function messageListener(message) {
    if (message.action === "updateProgress") {
      if (ISDbLastImportedDate.innerText !== message.payload.updateISDbLastImportedDate) {
        ISDbLastImportedDate.innerText = message.payload.updateISDbLastImportedDate;
      }

      if (importButton.className !== currentlyImportButtonClass) {
        enableStopButton();
        importButton.className = currentlyImportButtonClass;
      }

      importButton.innerText = `${message.payload.progress.toFixed(1)}%`;
    } else {
      if ([successImportingISdatabase, stopImportingISdatabase, failedImportButtonClass].includes(message.action)) {
        disableStopButton();

        switch (message.action) {
          case successImportingISdatabase:
            importButton.className = successImportButtonClass;
            importButton.innerText = "DONE";
            break;
          case stopImportingISdatabase:
            ISDbLastImportedDate.innerText = settingISDbLastImportedDate;
            importButton.className = failedImportButtonClass;
            importButton.innerText = "STOP";
            break;
          case failedImportButtonClass:
            ISDbLastImportedDate.innerText = settingISDbLastImportedDate;
            importButton.className = failedImportButtonClass;
            importButton.innerText = "FAIL";
            break;
        }
      }
    }
  }

  function enableStopButton() {
    importButton.style.width = "40%";
    stopButton.style.display = "inherit";
  }
  function disableStopButton() {
    importButton.style.width = "";
    stopButton.style.display = "none";
  }
});
