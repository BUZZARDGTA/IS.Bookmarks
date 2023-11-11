import { urlISDatabaseAPI, successImportingISdatabase, stopImportingISdatabase, failureImportingISdatabase, failedImportButtonClass, successImportButtonClass, currentlyImportButtonClass } from "/js/constants.js";
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
  const retryButton = document.getElementById("retryButton");
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
  ISDbLastImportedDate.innerText = settingISDbLastImportedDate;

  browser.runtime.onMessage.addListener(messageListener);

  // Event listener that sends a message to the background script, which will remains active in the background, and initiate the creation of the bookmarks.
  importButton.addEventListener("click", async function () {
    setupStartImportingButtons();
    importButton.className = currentlyImportButtonClass;
    importButton.innerText = "0%";

    await extensionMessageSender("importButton", jsonISDatabaseAPI);
  });

  tutorialHtml.addEventListener("click", async function () {
    await openOrFocusHTMLPage("/html/tutorial.html");
    window.close();
  });

  stopButton.addEventListener("click", async function () {
    await extensionMessageSender("stopButton");
  });

  retryButton.addEventListener("click", async function () {
    await extensionMessageSender("retryButton");
  });

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
        setupStartImportingButtons();
        importButton.className = currentlyImportButtonClass;
      }

      importButton.innerText = `${message.payload.progress.toFixed(1)}%`;
    } else {
      if ([successImportingISdatabase, stopImportingISdatabase, failureImportingISdatabase].includes(message.action)) {
        setupStopImportingButtons();

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
          case failureImportingISdatabase:
            ISDbLastImportedDate.innerText = settingISDbLastImportedDate;
            importButton.className = failedImportButtonClass;
            if (message.payload.reason) {
              importButton.innerText = `FAIL\n(${message.payload.reason})`;
            } else {
              importButton.innerText = "FAIL";
            }
            break;
        }
      }
    }
  }

  function setupStartImportingButtons() {
    importButton.style.width = "40%";
    enableStopButton();
    disableRetryButton();
  }
  function setupStopImportingButtons() {
    importButton.style.width = "40%";
    disableStopButton();
    enableRetryButton();
  }

  function enableStopButton() {
    stopButton.style.display = "inherit";
  }
  function disableStopButton() {
    stopButton.style.display = "none";
  }

  function enableRetryButton() {
    retryButton.style.display = "inherit";
  }
  function disableRetryButton() {
    retryButton.style.display = "none";
  }
});
