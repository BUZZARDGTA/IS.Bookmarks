export { extensionMessageSender };

function extensionMessageSender(actionMessage, payload) {
  return browser.runtime.sendMessage({
    action: actionMessage,
    payload
  })
  .catch((error) => {
    if (error.message !== "Could not establish connection. Receiving end does not exist.") {
      console.error(error);
    }
  });
}
