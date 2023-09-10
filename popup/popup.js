document.addEventListener("DOMContentLoaded", async function () {
  const htmlISDbDate = document.getElementById("ISDbDate");
  const htmlReloadButton = document.getElementById("reloadButton");

  browser.runtime.onMessage.addListener(messageListener);

  // Add a click event listener to the 'htmlReloadButton' button
  htmlReloadButton.addEventListener("click", reload);

  const urlISDbDate = "https://api.github.com/repos/Illegal-Services/IS.Bookmarks/commits?path=IS.bookmarks.json&sha=extra&per_page=1";

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


  async function reload() {
    htmlReloadButton.className = "btn btn-secondary w-50 disabled";

    // Send a message to the extension's background script to initiate the creation of the bookmark folder
    const backgroundScriptResponse = await browser.runtime.sendMessage({
      action: "createBookmarksTree"
    });

    if (backgroundScriptResponse === false) {
      htmlReloadButton.innerText = "FAIL";
      htmlReloadButton.className = "btn btn-danger w-50 disabled";
    }
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
