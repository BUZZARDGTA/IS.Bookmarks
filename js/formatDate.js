export { formatDate };


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
