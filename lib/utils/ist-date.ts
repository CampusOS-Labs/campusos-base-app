const IST_OFFSET = "+05:30";

/** Start and end of the current calendar day in Asia/Kolkata. */
export function getTodayRangeIST(): { start: Date; end: Date } {
  const istDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return {
    start: new Date(`${istDate}T00:00:00${IST_OFFSET}`),
    end: new Date(`${istDate}T23:59:59.999${IST_OFFSET}`),
  };
}
