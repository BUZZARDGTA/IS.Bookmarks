// Listen for incoming messages from the extension's UI "Reload" button pressed
browser.runtime.onMessage.addListener((message) => {
  if (message.action !== "createBookmarksTree") {
    return false;
  }

  return createBookmarkTree(message.bookmarkDb);
});


// Function to create a bookmark
async function createBookmark(index, parentId, type, title, url) {
  return browser.bookmarks.create({ index, parentId, title, type, url });
}

// Function to create a bookmark tree
async function createBookmarkTree(bookmarkDb) {
  const parentStack = ["toolbar_____"]; // Start with the Bookmarks Toolbar as the initial parent

  const total = bookmarkDb.length - 1; // Removes -1 because 'index' starts from 0
  const enumeratedDb = bookmarkDb.map((value, index) => [index, value]);
  for (const [index, entry] of enumeratedDb) {
    updateProgress(index * 100 / total);

    const type = entry[0];
    const depth = parseInt(entry[1]);

    const depthToRemove = (parentStack.length - depth);

    if (depthToRemove > 0) {
      parentStack.splice(-depthToRemove);
    }

    const parentId = parentStack[parentStack.length - 1];

    // DEBUG: console.log(parentStack, parentId, parentStack.length, depth, type, entry[2], entry[3]);

    if (type === "FOLDER") {
      const title = decodeHtmlEntityEncoding(entry[2]);
      const newFolder = await createBookmark(undefined, parentId, "folder", title, undefined);
      parentStack.push(newFolder.id); // Use the ID of the newly created folder
    } else if (type === "LINK") {
      const url = entry[2];
      const title = entry[3];
      await createBookmark(undefined, parentId, "bookmark", title, url);
    } else if (type === "HR") {
      await createBookmark(undefined, parentId, "separator", undefined, undefined);
    }
  }
}

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

function decodeHtmlEntityEncoding(string) {
  return string.replace(/&amp;|&quot;|&#39;|&lt;|&gt;/g, function (match) {
    switch (match) {
      case '&amp;': return '&';
      case '&quot;': return '"';
      case '&#39;': return '\'';
      case '&lt;': return '<';
      case '&gt;': return '>';
      default: return match;
    }
  });
}
