import { urlISDatabaseAPI, urlRawISDatabase, successImportingISdatabase, failureImportingISdatabase} from "./constants.js";
import { makeWebRequest } from "./makeWebRequest.js";
import { isResponseUp } from "./isResponseUp.js";
import { retrieveSettings } from "./retrieveSettings.js";
import { extensionMessageSender } from "./extensionMessageSender.js"
import { saveSettings } from "./saveSettings.js";
import { formatDate } from "./formatDate.js";


export { initializeCreationOfBookmarkTree };

/**
 * Function that initialize the creation of the {@link createBookmarkTree} from: {@link urlISDatabaseAPI `IS.bookmarks.json`}.
 * @async
 * @param {string} updateType - The string which tells which method has been used to start the importation of the bookmarks.
 * @param {JSON | undefined} jsonISDatabaseAPI - The web request JSON; can be `undefined` if the request has not been done already.
 * @returns {Promise<({successImportingISdatabase} | {failureImportingISdatabase} | undefined)>} A promise that resolves when the bookmarks have been imported, indicating {@link successImportingISdatabase success} or {@link failureImportingISdatabase failure}; can also be `undefined` if no update was required.
 */
async function initializeCreationOfBookmarkTree(updateType, jsonISDatabaseAPI) {
  if (jsonISDatabaseAPI === undefined) {
    const responseISDatabaseAPI = await makeWebRequest(urlISDatabaseAPI);
    if (!isResponseUp(responseISDatabaseAPI)) {
      return failureImportingISdatabase;
    }
    jsonISDatabaseAPI = await responseISDatabaseAPI.json();
  }

  const fetchedSHA = jsonISDatabaseAPI[0].sha;
  const { settingISDatabaseSHA } = await retrieveSettings("settingISDatabaseSHA");

  if (
    fetchedSHA === settingISDatabaseSHA
    && updateType === "startup"
  ) {
    return;
  }

  const responseRawISDatabase = await makeWebRequest(urlRawISDatabase);
  if (!isResponseUp(responseRawISDatabase)) {
    return failureImportingISdatabase;
  }
  const responseText = (await responseRawISDatabase.text()).trim();

  let bookmarkDb;
  try {
    bookmarkDb = JSON.parse(responseText);
  } catch (error) {
    console.error(error);
    return failureImportingISdatabase;
  }

  if (
    (!Array.isArray(bookmarkDb))
    || (JSON.stringify(bookmarkDb[0]) !== '["FOLDER",0,"Bookmarks Toolbar"]') // Checks if the first array from the 'bookmarkDb' correctly matches the official IS bookmarks database
  ) {
    return failureImportingISdatabase;
  }

  bookmarkDb = bookmarkDb.slice(1); // Slice the very first array which contains the "Bookmarks Toolbar" folder

  const { settingBookmarkSaveLocation } = await retrieveSettings("settingBookmarkSaveLocation");

  // Removes previous "Illegal Services" bookmark folder(s), only those in the same depth as the previous one... before creating the new bookmark
  const bookmarksSearch = await browser.bookmarks.search({ title: "Illegal Services" });
  for (const folder of bookmarksSearch.filter(bookmark =>
    bookmark.type === "folder"
    && bookmark.parentId === settingBookmarkSaveLocation
  )) {
    await browser.bookmarks.removeTree(folder.id);
  }

  const formattedDate = formatDate();
  await createBookmarkTree(bookmarkDb, settingBookmarkSaveLocation, formattedDate);

  await saveSettings({
    "settingISDatabaseSHA": fetchedSHA,
    "settingISDbLastImportedDate": formattedDate
  });

  return successImportingISdatabase;
}


/**
 * Function that creates the bookmark tree initiallized from the {@link initializeCreationOfBookmarkTree `initializeCreationOfBookmarkTree`} function.
 * @async
 * @param {Array} bookmarkDb - The database that contains all the bookmarks to be created.
 * @param {string} settingBookmarkSaveLocation - The {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/BookmarkTreeNode#id `bookmark folder id`}, where we start importing the bookmarks.
 * @param {string} formattedDate - The formatted date from when we started importing the bookmarks.
 * @returns {Promise<void>} A promise that resolves when the bookmark tree has been successfully created.
 */
async function createBookmarkTree(bookmarkDb, settingBookmarkSaveLocation, formattedDate) {

  /**
   * Function that decodes HTML entities from a given string.
   *
   * This is required because when exporting bookmarks from Firefox, certain special characters (such as [`<`, `>`, `"`, `'`, `&`]) in bookmark titles are encoded during the export process.
   * @param {string} string - The encoded string.
   * @returns {string} The decoded string.
   */
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

  /**
   * Function that creates a new bookmark.
   * @async
   * @param {number} index - see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/CreateDetails `bookmarks.CreateDetails`} on MDN
   * @param {string} parentId - see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/CreateDetails `bookmarks.CreateDetails`} on MDN
   * @param {string} title - see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/CreateDetails `bookmarks.CreateDetails`} on MDN
   * @param {string} type - see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/CreateDetails `bookmarks.CreateDetails`} and {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/BookmarkTreeNodeType  `bookmarks.BookmarkTreeNodeType`} on MDN
   * @param {string} url - see {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/CreateDetails `bookmarks.CreateDetails`} on MDN
   * @returns {Promise<Object>} A Promise that resolves to the created bookmark object.
   * @See {@link https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks/create `bookmarks.create`} on MDN
  */
  async function createBookmark(index, parentId, title, type, url) {
    return await browser.bookmarks.create({ index, parentId, title, type, url });
  }


  const parentStack = [settingBookmarkSaveLocation]; // Start with the 'settingBookmarkSaveLocation' as the initial parent
  const total = bookmarkDb.length - 1; // Removes -1 because 'index' starts from 0
  const enumeratedDb = bookmarkDb.map((value, index) => [index, value]);

  for (const [index, entry] of enumeratedDb) {
    // Sends a message to the popup script indicating that the background script is currently in the process of creating the bookmark
    extensionMessageSender("updateProgress", {
      updateISDbLastImportedDate: formattedDate,
      progress: index * 100 / total
    });

    const [type, depth] = entry;
    const depthToRemove = (parentStack.length - depth);

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
}
