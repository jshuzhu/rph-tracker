/**
 * Calculates the active school week dynamically based on start date, end date, and holiday weeks.
 * 
 * @param {string} startDateStr - ISO/Date string for session start date (typically a Monday)
 * @param {string} endDateStr - ISO/Date string for session end date
 * @param {number} holidayWeeks - Number of holiday weeks to subtract
 * @returns {number} The calculated school week number (1-52)
 */
export function calculateActiveWeek(startDateStr, endDateStr, holidayWeeks = 0) {
  if (!startDateStr) return 1;

  const start = new Date(startDateStr);
  const end = endDateStr ? new Date(endDateStr) : null;
  const today = new Date();

  // Reset hours to ensure clean date math
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  if (end) end.setHours(23, 59, 59, 999);

  // If today is before the school session starts
  if (today < start) return 1;

  const msInWeek = 1000 * 60 * 60 * 24 * 7;

  // If today is after the school session ends, cap it at the last week
  if (end && today > end) {
    const totalDiff = end - start;
    const maxWeeks = Math.floor(totalDiff / msInWeek) + 1;
    return Math.max(1, maxWeeks - holidayWeeks);
  }

  const diff = today - start;
  const currentWeek = Math.floor(diff / msInWeek) + 1;
  return Math.max(1, currentWeek - holidayWeeks);
}
