export { makeWebRequest };

/**
 * Function that performs a web request using the Fetch API.
 * @param {string} url - The URL to which the request should be made.
 * @param {object} options - Optional request configuration options.
 * @returns A promise that resolves with the HTTP response from the web request.
 */
async function makeWebRequest(url, options) {
  try {
    return await fetch(url, options);
  } catch (error) {
    console.error("Web request error:", error);
  }
}
