import { initializeCreationOfBookmarkTree } from "../js/initializeCreationOfBookmarkTree.js";

// Add an event listener for the 'onInstalled' event, which means it will run when the extension when it will be first installed
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    return initializeCreationOfBookmarkTree(details.reason, null);
  }

  return null;
});

// Add an event listener for the 'onStartup' event, which means it will run when Firefox starts up or when a new browser window is opened
browser.runtime.onStartup.addListener((details) => {
  // Here I couldn't find a way to check (if details.reason === "startup") so, this lines will be changed or not in release v1.6
  console.log(details);
  if (details.reason === "startup") {
    return initializeCreationOfBookmarkTree(details.reason, null);
  }

  return null;
});

// Listen for incoming messages from the extension's UI "Reload" button pressed
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "reloadButton") {
    return initializeCreationOfBookmarkTree(message.action, message.jsonISDatabaseAPI);
  }

  return null;
});
