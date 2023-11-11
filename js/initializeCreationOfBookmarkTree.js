import { urlISDatabaseAPI, urlRawISDatabase, successImportingISdatabase, failureImportingISdatabase, stopImportingISdatabase } from "./constants.js";
import { makeWebRequest } from "./makeWebRequest.js";
import { isResponseUp } from "./isResponseUp.js";
import { retrieveSettings } from "./retrieveSettings.js";
import { extensionMessageSender } from "./extensionMessageSender.js";
import { saveSettings } from "./saveSettings.js";
import { formatDate } from "./formatDate.js";

export { initializeCreationOfBookmarkTree };

let stopImport;

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "stopButton") {
    stopImport = true;
  }
});

/**
 * Function that initialize the creation of the {@link createBookmarkTree} from: {@link urlISDatabaseAPI `IS.bookmarks.json`}.
 * @param {string} updateType - The string which tells which method has been used to start the importation of the bookmarks.
 * @param {JSON | undefined} jsonISDatabaseAPI - The web request JSON; can be `undefined` if the request has not been done already.
 * @returns A promise that resolves when the bookmarks have been imported, indicating {@link successImportingISdatabase success} or {@link failureImportingISdatabase failure}; can also be `undefined` if no update was required.
 */
async function initializeCreationOfBookmarkTree(updateType, jsonISDatabaseAPI) {
  stopImport = false;

  if (jsonISDatabaseAPI === undefined) {
    const responseISDatabaseAPI = await makeWebRequest(urlISDatabaseAPI);
    if (!isResponseUp(responseISDatabaseAPI)) {
      extensionMessageSender(failureImportingISdatabase, {
        reason: 'Network Error: Fetching "IS.Bookmarks.json" GitHub repository API.',
      });
      return;
    }
    jsonISDatabaseAPI = await responseISDatabaseAPI.json();
  }

  const fetchedSHA = jsonISDatabaseAPI[0].sha;
  const { settingISDatabaseSHA } = await retrieveSettings("settingISDatabaseSHA");

  // prettier-ignore
  if (
    fetchedSHA === settingISDatabaseSHA
    && updateType === "startup"
  ) {
    return;
  }

  const responseRawISDatabase = await makeWebRequest(urlRawISDatabase);
  if (!isResponseUp(responseRawISDatabase)) {
    extensionMessageSender(failureImportingISdatabase, {
      reason: 'Network Error: Fetching "IS.Bookmarks.json" GitHub repository file.',
    });
    return;
  }
  const responseText = (await responseRawISDatabase.text()).trim();

  let bookmarkDb;
  try {
    bookmarkDb = JSON.parse(responseText);
  } catch (error) {
    console.error(error);
    extensionMessageSender(failureImportingISdatabase, {
      reason: 'Parsing Database: "IS.Bookmarks.json" GitHub repository file.',
    });
    return;
  }

  // prettier-ignore
  if (
    (!Array.isArray(bookmarkDb))
    || (JSON.stringify(bookmarkDb[0]) !== '["FOLDER",0,"Bookmarks Toolbar"]') // Checks if the first array from the 'bookmarkDb' correctly matches the official IS bookmarks database
  ) {
    extensionMessageSender(failureImportingISdatabase, {
      reason: 'Invalid Database: "IS.Bookmarks.json" GitHub repository file.',
    });
    return
  }

  bookmarkDb = bookmarkDb.slice(1); // Slice the very first array which contains the "Bookmarks Toolbar" folder

  const { settingBookmarkSaveLocation } = await retrieveSettings("settingBookmarkSaveLocation");

  // Removes previous "Illegal Services" bookmark folder(s), only those in the same depth as the previous one... before creating the new bookmark
  const bookmarksSearch = await browser.bookmarks.search({ title: "Illegal Services" });
  // prettier-ignore
  for (const folder of bookmarksSearch.filter(bookmark =>
    bookmark.type === "folder"
    && bookmark.parentId === settingBookmarkSaveLocation
  )) {
    await browser.bookmarks.removeTree(folder.id);
  }

  const formattedDate = formatDate();

  let createBookmarkTreeResponse;
  try {
    createBookmarkTreeResponse = await createBookmarkTree(bookmarkDb, settingBookmarkSaveLocation, formattedDate);
  } catch (error) {
    switch (error.message) {
      case "parentGuid must be valid":
        extensionMessageSender(failureImportingISdatabase, {
          reason: "Bookmark Error: An error occured while creating a bookmark.",
        });
        return;
      default:
        console.error(error);
        extensionMessageSender(failureImportingISdatabase, {
          reason: "Bookmark Error: An error occured while processing the creation of a bookmark.",
        });
        return;
    }
  }

  if (createBookmarkTreeResponse === successImportingISdatabase) {
    await saveSettings({
      settingISDatabaseSHA: fetchedSHA,
      settingISDbLastImportedDate: formattedDate,
    });
  }

  extensionMessageSender(createBookmarkTreeResponse);
}

/**
 * Function that creates the bookmark tree initiallized from the {@link initializeCreationOfBookmarkTree `initializeCreationOfBookmarkTree`} function.
 * @param {Array} bookmarkDb - The database that contains all the bookmarks to be created.
 * @param {string} settingBookmarkSaveLocation - The {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/BookmarkTreeNode#id `bookmark folder id`}, where we start importing the bookmarks.
 * @param {string} formattedDate - The formatted date from when we started importing the bookmarks.
 * @returns A promise that resolves when the bookmark tree has been successfully created.
 */
async function createBookmarkTree(bookmarkDb, settingBookmarkSaveLocation, formattedDate) {
  /**
   * Function that decodes HTML entities from a given string.
   *
   * This is required because when exporting bookmarks from Firefox, certain special characters (such as [`<`, `>`, `"`, `'`, `&`]) in bookmark titles are encoded during the export process.
   * @param {string} string - The encoded string.
   * @returns The decoded string.
   */
  function decodeHtmlEntityEncoding(string) {
    return string.replace(/&amp;|&quot;|&#39;|&lt;|&gt;/g, function (match) {
      switch (match) {
        case "&lt;":
          return "<";
        case "&gt;":
          return ">";
        case "&quot;":
          return '"';
        case "&#39;":
          return "'";
        case "&amp;":
          return "&";
        default:
          return match;
      }
    });
  }

  /**
   * Function that creates a new bookmark.
   * @param {number} index
   * @param {string} parentId
   * @param {string} title
   * @param {string} type
   * @param {string} url
   * @returns {Promise<object>} A Promise that resolves to the created bookmark object.
   */
  function createBookmark(index, parentId, title, type, url) {
    return browser.bookmarks.create({ index, parentId, title, type, url });
  }

  const parentStack = [settingBookmarkSaveLocation]; // Start with the 'settingBookmarkSaveLocation' as the initial parent
  const total = bookmarkDb.length - 1; // Removes -1 because 'index' starts from 0
  const enumeratedDb = bookmarkDb.map((value, index) => [index, value]);

  for (const [index, entry] of enumeratedDb) {
    if (stopImport) {
      return stopImportingISdatabase;
    }

    // Sends a message to the popup script indicating that the background script is currently in the process of creating the bookmark
    extensionMessageSender("updateProgress", {
      updateISDbLastImportedDate: formattedDate,
      progress: (index * 100) / total,
    });

    const [type, depth] = entry;
    const depthToRemove = parentStack.length - depth;

    if (depthToRemove > 0) {
      parentStack.splice(-depthToRemove);
    }

    const parentId = parentStack[parentStack.length - 1]; // Retrieves the last 'Id' item from the 'parentStack' list

    // DEBUG: console.log(parentStack, parentId, parentStack.length, depth, type, entry[2], entry[3]);

    if (type === "FOLDER") {
      const title = decodeHtmlEntityEncoding(entry[2]);
      const newFolder = await createBookmark(undefined, parentId, title, "folder", undefined);
      parentStack.push(newFolder.id); // Use the ID of the newly created folder
    } else if (type === "LINK") {
      const url = entry[2];
      const title = decodeHtmlEntityEncoding(entry[3]);
      await createBookmark(undefined, parentId, title, "bookmark", url);
    } else if (type === "HR") {
      await createBookmark(undefined, parentId, undefined, "separator", undefined);
    }
  }

  return successImportingISdatabase;
}
