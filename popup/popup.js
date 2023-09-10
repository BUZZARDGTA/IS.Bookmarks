document.addEventListener("DOMContentLoaded", async function () {
  const htmlISDbDate = document.getElementById("ISDbDate");
  const htmlReloadButton = document.getElementById("reloadButton");

  browser.runtime.onMessage.addListener(messageListener);

  // Add a click event listener to the 'htmlReloadButton' button
  htmlReloadButton.addEventListener("click", reload);

  const urlISDbDate = "https://api.github.com/repos/Illegal-Services/IS.Bookmarks/commits?path=IS.bookmarks.json&sha=extra&per_page=1";
  const urlRawISDatabase = "https://raw.githubusercontent.com/Illegal-Services/IS.Bookmarks/extra/IS.bookmarks.json";

  fetch(urlISDbDate)
  .then(response => response.json())
  .then(data => {
    const commitDate = data[0].commit.committer.date;

    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    const formattedDate = new Intl.DateTimeFormat("en-US", options).format(new Date(commitDate));
    htmlISDbDate.innerText = formattedDate;
  })
  .catch(error => console.error("Error:", error));

  async function searchBookmarksWithTypeAndDepth(query, url, title, type, depth) {
    // Search for bookmarks with the specified title
    const bookmarks = await browser.bookmarks.search({ query, url, title });

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

  async function reload() {

    htmlReloadButton.className = "btn btn-secondary w-50 disabled";

    let _response;
    try {
      _response = await fetch(urlRawISDatabase);
    } catch (error) {
      console.error(error);
    }
    const response = _response;

    if (
      (response === undefined)
      || (!response.ok)
      || (response.status !== 200)
    ) {
      htmlReloadButton.innerText = "FAIL";
      htmlReloadButton.className = "btn btn-danger w-50 disabled";
      return;
    }

    let responseText = await response.text();
    responseText = responseText.trim();

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
      htmlReloadButton.innerText = "FAIL";
      htmlReloadButton.className = "btn btn-danger w-50 disabled";
      return;
    }

    bookmarkDb = bookmarkDb.slice(1); // Slice the very first array which contains the "Bookmarks Toolbar" folder

    // Remove previous "Illegal Services" bookmark folder(s) from depth 0, before creating the new bookmark
    const filteredBookmarks = await searchBookmarksWithTypeAndDepth(null, null, "Illegal Services", "folder", 0);
    for (const object of filteredBookmarks) {
      await browser.bookmarks.removeTree(object.id);
    }

    // Send a message to the extension's background script to initiate the closing of tabs
    await browser.runtime.sendMessage({
      action: "createBookmarksTree",
      bookmarkDb
    });
  }

  function messageListener(message) {
    if (message.action !== "updateProgress") {
      return false;
    }

    if (message.progress === 100) {
      htmlReloadButton.innerText = "DONE";
      htmlReloadButton.className = "btn btn-success w-50";
    } else {
      if (htmlReloadButton.className !== "btn btn-secondary w-50 disabled") {
        htmlReloadButton.className = "btn btn-secondary w-50 disabled";
      }

      htmlReloadButton.innerText = `${message.progress.toFixed(1)}%`;
    }
  }
});
