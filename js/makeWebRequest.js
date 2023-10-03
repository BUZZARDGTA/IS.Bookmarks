export { makeWebRequest };

/**
 * Function that performs a web request using the Fetch API.
 * @async
 * @param {string} url - The URL to which the request should be made.
 * @param {Object} options - Optional request configuration options.
 * @returns {Promise<Response | undefined>} A promise that resolves with the HTTP response from the web request.
 */
async function makeWebRequest(url, options) {
  try {
    return await fetch(url, options);
  } catch (error) {
    console.error("Web request error:", error);
  }
}
