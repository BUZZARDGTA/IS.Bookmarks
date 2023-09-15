import { retrieveSettings } from "../js/retrieveSettings.js";
import { saveSettings } from "../js/saveSettings.js";
import { initializeCreationOfBookmarkTree } from "../js/initializeCreationOfBookmarkTree.js";

// Add an event listener for the 'onInstalled' event, which means it will run when the extension when it will be first installed
browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await saveSettings({
      updateBookmarksAtBrowserStartup: true,
      currentISDatabaseSHA: null
    });

    return initializeCreationOfBookmarkTree(details.reason);
  }
});

// Add an event listener for the 'onStartup' event, which means it will run when Firefox starts up or when a new browser window is opened
browser.runtime.onStartup.addListener(async () => {
  if ((await retrieveSettings("updateBookmarksAtBrowserStartup")).updateBookmarksAtBrowserStartup !== false) {
    return initializeCreationOfBookmarkTree("startup");
  }
});

// Listen for incoming messages from the extension's UI "Reload" button pressed
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "reloadButton") {
    return initializeCreationOfBookmarkTree(message.action, message.jsonISDatabaseAPI);
  }
});
