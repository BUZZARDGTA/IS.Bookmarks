import { makeWebRequest } from "../js/makeWebRequest.js";
import { isResponseUp } from "../js/isResponseUp.js";
import { retrieveSettings } from "../js/retrieveSettings.js";
import { saveSettings } from "../js/saveSettings.js";

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
  const currentISDatabaseSHA = (await retrieveSettings("currentISDatabaseSHA")).currentISDatabaseSHA;

  if (fetchedISDatabaseSHA === currentISDatabaseSHA) {
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

  // Remove previous "Illegal Services" bookmark folder(s) from depth 0, before creating the new bookmark
  const filteredBookmarks = await searchBookmarksWithTypeAndDepth(null, null, "Illegal Services", "folder", 0);
  for (const object of filteredBookmarks) {
    await browser.bookmarks.removeTree(object.id);
  }

  await createBookmarkTree(bookmarkDb);
  await saveSettings({ "currentISDatabaseSHA": fetchedISDatabaseSHA });
  return true;
}

async function searchBookmarksWithTypeAndDepth(query, url, title, type, depth) {

  // Function to calculate the depth of a bookmark using async recursion
  function calculateDepth(nodeId, currentDepth) {
    if (currentDepth > depth) {
      return -1; // Mark bookmarks beyond the specified depth
    }

    return browser.bookmarks.get(nodeId).then((node) => {
      if (!node.parentId) {
        return currentDepth; // We've reached the root node
      }
      return calculateDepth(node.parentId, currentDepth + 1);
    });
  }

  // Search for bookmarks with the specified title
  const bookmarks = await browser.bookmarks.search({ query, url, title });

  // Filter the bookmarks to include only those at the specified depth and match the target type
  const filteredBookmarks = await Promise.all(
    bookmarks.map(async (bookmark) => {
      const bookmarkDepth = await calculateDepth(bookmark.id, 0);
      if (bookmarkDepth === depth && bookmark.type === type) {
        return bookmark;
      }
      return null;
    })
  );

  // Remove null values (bookmarks that didn't match the criteria)
  const validBookmarks = filteredBookmarks.filter((bookmark) => bookmark !== null);

  return validBookmarks;
}

// Function to create a bookmark tree
async function createBookmarkTree(bookmarkDb) {

  // Function that sends a message to the popup script indicating that the background script is currently in the process of creating the bookmark
  function updateProgress(progress) {
    browser.runtime.sendMessage({
      action: "updateProgress",
      progress
    })
    .catch((error) => {
      if (error.message !== "Could not establish connection. Receiving end does not exist.") {
        console.error(error);
      }
    });
  }

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

  const parentStack = ["toolbar_____"]; // Start with the Bookmarks Toolbar as the initial parent

  const total = bookmarkDb.length - 1; // Removes -1 because 'index' starts from 0
  const enumeratedDb = bookmarkDb.map((value, index) => [index, value]);

  for (const [index, entry] of enumeratedDb) {
    updateProgress(index * 100 / total);

    const type = entry[0];
    const depth = entry[1];

    const depthToRemove = (parentStack.length - depth);

    if (depthToRemove > 0) {
      parentStack.splice(-depthToRemove);
    }

    const parentId = parentStack[parentStack.length - 1];

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
}
