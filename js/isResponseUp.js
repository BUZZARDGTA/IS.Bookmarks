export { isResponseUp };

/**
 * Function that checks if an HTTP response indicates that a resource is UP.
 * @param {Response | undefined} response - The HTTP response to be checked. Can be undefined if the web request failed.
 * @returns {boolean} Returns `true` if the response indicates that the resource is UP; otherwise, returns `false`.
 */
function isResponseUp(response) {
  if (response === undefined) {
    return false;
  }

  if (response.ok) {
    return true;
  }

  return false;
}
