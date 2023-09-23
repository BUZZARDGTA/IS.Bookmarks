export { extensionMessageSender };

function extensionMessageSender(actionMessage, optionalMessage) {
  browser.runtime.sendMessage({
    action: actionMessage,
    optionalMessage
  })
  .catch((error) => {
    if (error.message !== "Could not establish connection. Receiving end does not exist.") {
      console.error(error);
    }
  });
}
