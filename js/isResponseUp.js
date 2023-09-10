async function isResponseUp(response) {
  if (
    (response === undefined)
    || (!response.ok)
    || (response.status !== 200)
  ) {
    return false;
  }
  return true;
}

export { isResponseUp };
