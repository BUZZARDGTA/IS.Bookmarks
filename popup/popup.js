import { makeWebRequest } from "../js/makeWebRequest.js";
import { isResponseUp } from "../js/isResponseUp.js";
import { retrieveSettings } from "../js/retrieveSettings.js";
import { formatDate } from "../js/formatDate.js";

document.addEventListener("DOMContentLoaded", async function () {
  const ISDbLastUpdatedDate = document.getElementById("ISDbLastUpdatedDate");
  const ISDbLastImportedDate = document.getElementById("ISDbLastImportedDate");
  const reloadButton = document.getElementById("reloadButton");
  const settingsButton = document.getElementById("settingsButton");

  // Add a message event listener for the background 'updateProgress'
  browser.runtime.onMessage.addListener(messageListener);

  // Add a click event listener to the 'reloadButton' button
  reloadButton.addEventListener("click", reload);

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

  const databaseLastImportedDate = (await retrieveSettings("databaseLastImportedDate")).databaseLastImportedDate;
  if (databaseLastImportedDate) {
    ISDbLastImportedDate.innerText = databaseLastImportedDate;
  }


  async function reload() {
    reloadButton.className = "btn btn-secondary w-50 disabled";

    // Send a message to the extension's background script to initiate the creation of the bookmark folder
    const backgroundScriptResponse = await browser.runtime.sendMessage({
      action: "reloadButton",
      jsonISDatabaseAPI
    });

    if (backgroundScriptResponse === false) {
      reloadButton.innerText = "FAIL";
      reloadButton.className = "btn btn-danger w-50 disabled";
    }
  }

  function messageListener(message) {
    if (message.action === "updateProgress") {
      if (message.optionalMessage.progress === 100) {
        reloadButton.innerText = "DONE";
        reloadButton.className = "btn btn-success w-50";
      } else {
        if (reloadButton.className !== "btn btn-secondary w-50 disabled") {
          reloadButton.className = "btn btn-secondary w-50 disabled";
        }

        reloadButton.innerText = `${message.optionalMessage.progress.toFixed(1)}%`;
      }
    } else if (message.action === "updateISDbLastImportedDate") {
      ISDbLastImportedDate.innerText = message.optionalMessage.formattedDate;
    } else {
      return false;
    }
  }
});
