export { extensionMessageSender };

/**
 * Function that sends a message to any script.
 * @param {string} actionMessage - The action to be performed by the script.
 * @param {array} payload - Additional data or payload to send with the message.
 * @returns A promise that resolves with the result of the message sent to the script.
 */
async function extensionMessageSender(actionMessage, payload) {
  try {
    return await browser.runtime.sendMessage({
      action: actionMessage,
      payload,
    });
  } catch (error) {
    if (error.message !== "Could not establish connection. Receiving end does not exist.") {
      console.error(error);
    }
  }
}
