import { retrieveSettings } from "/js/retrieveSettings.js";
import { saveSettings } from "/js/saveSettings.js";
import { defaultBookmarkSaveLocation } from "/js/constants.js";
import { isSaveBookmarkFolderIdIllegal } from "/js/isSaveBookmarkFolderIdIllegal.js";
import { initializeCreationOfBookmarkTree } from "/js/initializeCreationOfBookmarkTree.js";

// Add an event listener for the 'onInstalled' event, which means it will run when the extension when it will be first installed
browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await saveSettings({
      updateBookmarksAtBrowserStartup: true,
      settingISDatabaseSHA: null,
      settingISDbLastImportedDate: "null",
      settingBookmarkSaveLocation: defaultBookmarkSaveLocation,
    });

    return initializeCreationOfBookmarkTree({ updateType: details.reason });
  }
});

// Add an event listener for the 'onStartup' event, which means it will run when Firefox starts up or when a new browser window is opened
browser.runtime.onStartup.addListener(async function () {
  if ((await retrieveSettings("updateBookmarksAtBrowserStartup")).updateBookmarksAtBrowserStartup !== false) {
    return initializeCreationOfBookmarkTree({ updateType: "startup" });
  }
});

// Listen for incoming messages from the extension's UI 'import' or 'retry' buttons pressed
browser.runtime.onMessage.addListener((message) => {
  if (["importButton", "retryButton"].includes(message.action)) {
    return initializeCreationOfBookmarkTree({ updateType: message.action, jsonISDatabaseAPI: message.payload });
  }
});

// Creates a parent context menu item in the browser that appears when a bookmark folder is right-clicked.
// Create an array of child context menu items under the "Database Actions" parent
const childMenuItems = [
  {
    id: "set-database-folder",
    title: "Set Database Folder",
  },
  {
    id: "import-database",
    title: "Import Database",
  },
];

// Create the parent context menu item
browser.menus.create({
  id: "database-actions",
  title: "Database Actions",
  contexts: ["bookmark"],
  visible: false,
});

// Create child context menu items under the "Database Actions" parent
childMenuItems.forEach((menuItem) => {
  browser.menus.create({
    id: menuItem.id,
    title: menuItem.title,
    contexts: ["bookmark"],
    parentId: "database-actions",
  });
});

// Best regards, code below was partially taken from this amazing project: https://addons.mozilla.org/firefox/addon/open-bookmarks-slowly/
browser.menus.onShown.addListener(async function (info) {
  if (!info.contexts.includes("bookmark")) {
    return;
  }

  let bookmark;
  try {
    [bookmark] = await browser.bookmarks.get(info.bookmarkId);
  } catch (error) {
    console.error(error);
    return;
  }

  if (isSaveBookmarkFolderIdIllegal(info.bookmarkId)) {
    console.error(`The specified [bookmark_folder_id: ${info.bookmarkId}] is an illegal bookmark folder.`);
    return;
  }

  browser.menus.update("database-actions", {
    visible: true,
  });
  browser.menus.refresh();
});

browser.menus.onClicked.addListener(async function (info, tab) {
  let bookmark;
  try {
    [bookmark] = await browser.bookmarks.get(info.bookmarkId);
  } catch (error) {
    console.error(error);
    return;
  }

  switch (info.menuItemId) {
    case "set-database-folder":
      await saveSettings({
        settingBookmarkSaveLocation: info.bookmarkId,
      });
      return;
    case "import-database":
      initializeCreationOfBookmarkTree({ updateType: "menu-action-import-database", bookmarkSaveLocation: info.bookmarkId });
      return;
    default:
      return;
  }
});
