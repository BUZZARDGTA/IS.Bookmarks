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

  // Add a message event listener for the background 'updateProgress'
  browser.runtime.onMessage.addListener(messageListener);

  // Add a click event listener to the 'importButton' button
  importButton.addEventListener("click", importDb);

  // Add a click event listener to the settings button
  settingsButton.addEventListener("click", function () {
    browser.tabs.create({ url:"../settings/settings.html", active: true });
    window.close();
  });

  const urlISDatabaseAPI = "https://api.github.com/repos/Illegal-Services/IS.Bookmarks/commits?path=IS.bookmarks.json&sha=extra&per_page=1";
  let jsonISDatabaseAPI;

  const responseISDatabaseAPI = await makeWebRequest(urlISDatabaseAPI);
  if (await isResponseUp(responseISDatabaseAPI)) {
    jsonISDatabaseAPI = await responseISDatabaseAPI.json();
    const commitDate = jsonISDatabaseAPI[0].commit.committer.date;

    const formattedDate = formatDate(commitDate);
    ISDbLastUpdatedDate.innerText = formattedDate;
  }

  const settingISDbLastImportedDate = (await retrieveSettings("settingISDbLastImportedDate")).settingISDbLastImportedDate;
  if (settingISDbLastImportedDate) {
    ISDbLastImportedDate.innerText = settingISDbLastImportedDate;
  }


  async function importDb() {
    importButton.className = "btn btn-secondary w-50 disabled";

    // Send a message to the extension's background script to initiate the creation of the bookmark folder
    const backgroundScriptResponse = await extensionMessageSender("importButton", jsonISDatabaseAPI);
    if (backgroundScriptResponse !== true) {
      importButton.innerText = "FAIL";
      importButton.className = "btn btn-danger w-50 disabled";
    }
  }

  function messageListener(message) {
    if (message.action === "updateProgress") {
      if (ISDbLastImportedDate.innerText !== message.payload.updateISDbLastImportedDate) {
        ISDbLastImportedDate.innerText = message.payload.updateISDbLastImportedDate;
      }

      if (message.payload.progress === 100) {
        importButton.innerText = "DONE";
        importButton.className = "btn btn-success w-50";
      } else {
        if (importButton.className !== "btn btn-secondary w-50 disabled") {
          importButton.className = "btn btn-secondary w-50 disabled";
        }

        importButton.innerText = `${message.payload.progress.toFixed(1)}%`;
      }

    } else {
      return false;
    }
  }
});
