export { formatDate };

/**
 * Function that formats a date into a localized string with specific options.
 * @param {Date|string|number|undefined} date - The date to format. If not provided, the current date and time will be used.
 * @returns {string} A formatted date string according to the specified options.
 */
function formatDate(date) {
  if (date === undefined) {
    date = new Date();
  } else {
    date = new Date(date);
  }

  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
    timeZone: "Europe/Paris",
  };

  return new Intl.DateTimeFormat("fr-FR", options).format(date);
}
