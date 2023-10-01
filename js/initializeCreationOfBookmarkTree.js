import { makeWebRequest } from "./makeWebRequest.js";
import { isResponseUp } from "./isResponseUp.js";
import { retrieveSettings } from "./retrieveSettings.js";
import { extensionMessageSender } from "./extensionMessageSender.js"
import { saveSettings } from "./saveSettings.js";
import { formatDate } from "./formatDate.js";

export { initializeCreationOfBookmarkTree };

async function initializeCreationOfBookmarkTree(updateType, jsonISDatabaseAPI) {
  const urlISDatabaseAPI = "https://api.github.com/repos/Illegal-Services/IS.Bookmarks/commits?path=IS.bookmarks.json&sha=extra&per_page=1";
  const urlRawISDatabase = "https://raw.githubusercontent.com/Illegal-Services/IS.Bookmarks/extra/IS.bookmarks.json";

  if (jsonISDatabaseAPI === undefined) {
    const responseISDatabaseAPI = await makeWebRequest(urlISDatabaseAPI);
    if (!await isResponseUp(responseISDatabaseAPI)) {
      return false;
    }
    jsonISDatabaseAPI = await responseISDatabaseAPI.json();
  }

  const fetchedISDatabaseSHA = jsonISDatabaseAPI[0].sha;
  const settingISDatabaseSHA = (await retrieveSettings("settingISDatabaseSHA")).settingISDatabaseSHA;

  if (fetchedISDatabaseSHA === settingISDatabaseSHA) {
    if (updateType === "startup") {
      return;
    }
  }

  const responseRawISDatabase = await makeWebRequest(urlRawISDatabase);
  if (!await isResponseUp(responseRawISDatabase)) {
    return false;
  }

  let responseText = (await responseRawISDatabase.text()).trim();
  let _bookmarkDb;
  try {
    _bookmarkDb = JSON.parse(responseText);
  } catch (error) {
    console.error(error);
  }
  let bookmarkDb = _bookmarkDb;

  if (
    (bookmarkDb === undefined)
    || (!Array.isArray(bookmarkDb))
    || (JSON.stringify(bookmarkDb[0]) !== '["FOLDER",0,"Bookmarks Toolbar"]') // Checks if the first array from the 'bookmarkDb' correctly matches the official IS bookmarks database
  ) {
    return false;
  }

  bookmarkDb = bookmarkDb.slice(1); // Slice the very first array which contains the "Bookmarks Toolbar" folder

  // Remove previous "Illegal Services" bookmark folder(s), only those in the same depth as the previous one... before creating the new bookmark
  const settingBookmarkSaveLocation = (await retrieveSettings("settingBookmarkSaveLocation")).settingBookmarkSaveLocation;
  const bookmarksSearch = await browser.bookmarks.search({ title: "Illegal Services" });
  const filteredBookmarks = bookmarksSearch.filter(bookmark => bookmark.type === "folder");

  for (const folder of filteredBookmarks) {
    if (folder.parentId === settingBookmarkSaveLocation) {
      await browser.bookmarks.removeTree(folder.id)
    }
  }

  const formattedDate = await createBookmarkTree(bookmarkDb, settingBookmarkSaveLocation);

  await saveSettings({ "settingISDatabaseSHA": fetchedISDatabaseSHA });
  await saveSettings({ "settingISDbLastImportedDate": formattedDate });

  return true; // to indicate that the script has successfully finished importing.
}


// Function to create a bookmark tree
async function createBookmarkTree(bookmarkDb, settingBookmarkSaveLocation) {

  // This function decodes HTML entities from a given string.
  // This is required because when exporting bookmarks from Firefox, certain special characters (such as <, >, ", ' and &) in bookmark titles are encoded during the export process
  function decodeHtmlEntityEncoding(string) {
    return string.replace(/&amp;|&quot;|&#39;|&lt;|&gt;/g, function (match) {
      switch (match) {
        case "&lt;": return "<";
        case "&gt;": return ">";
        case "&quot;": return "\"";
        case "&#39;": return "'";
        case "&amp;": return "&";
        default: return match;
      }
    });
  }

  // Function to create a bookmark
  function createBookmark(index, parentId, type, title, url) {
    return browser.bookmarks.create({ index, parentId, title, type, url });
  }

  const formattedDate = formatDate();
  const parentStack = [settingBookmarkSaveLocation]; // Start with the 'settingBookmarkSaveLocation' as the initial parent
  const total = bookmarkDb.length - 1; // Removes -1 because 'index' starts from 0
  const enumeratedDb = bookmarkDb.map((value, index) => [index, value]);

  for (const [index, entry] of enumeratedDb) {
    // Sends a message to the popup script indicating that the background script is currently in the process of creating the bookmark
    extensionMessageSender("updateProgress", {
      updateISDbLastImportedDate: formattedDate,
      progress: index * 100 / total
    });

    const type = entry[0];
    const depth = entry[1];
    const depthToRemove = (parentStack.length - depth);

    if (depthToRemove > 0) {
      parentStack.splice(-depthToRemove);
    }

    const parentId = parentStack[parentStack.length - 1]; // Retrieves the last 'Id' item from the 'parentStack' list

    // DEBUG: console.log(parentStack, parentId, parentStack.length, depth, type, entry[2], entry[3]);

    if (type === "FOLDER") {
      const title = await decodeHtmlEntityEncoding(entry[2]);
      const newFolder = await createBookmark(undefined, parentId, "folder", title, undefined);
      parentStack.push(newFolder.id); // Use the ID of the newly created folder
    } else if (type === "LINK") {
      const url = entry[2];
      const title = await decodeHtmlEntityEncoding(entry[3]);
      await createBookmark(undefined, parentId, "bookmark", title, url);
    } else if (type === "HR") {
      await createBookmark(undefined, parentId, "separator", undefined, undefined);
    }
  }

  return formattedDate;
}
