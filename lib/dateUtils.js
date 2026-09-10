/**
 * Calculates the active school week dynamically based on a custom start date and end date.
 * Weeks start on Monday. The week containing the start date is Week 1.
 * @param {string} startDateStr - ISO string or Date string for the session start
 * @param {string} endDateStr - ISO string or Date string for the session end (optional)
 */
export function calculateActiveWeek(startDateStr, endDateStr) {
  if (!startDateStr) return 1;

  const today = new Date();
  const startOfSession = new Date(startDateStr);
  
  // Clean time to avoid timezone offset issues
  startOfSession.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  let endOfSession = null;
  if (endDateStr) {
    endOfSession = new Date(endDateStr);
    endOfSession.setHours(0, 0, 0, 0);
  }

  // If before session, return 1
  if (today < startOfSession) {
    return 1;
  }

  // If after session, cap to the week of the end date
  let targetDate = today;
  if (endOfSession && today > endOfSession) {
    targetDate = endOfSession;
  }

  // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday.
  // We want Monday = 0, ..., Sunday = 6
  const getMondayOffset = (date) => (date.getDay() + 6) % 7;

  // Find the Monday of the start week
  const startMonday = new Date(startOfSession);
  startMonday.setDate(startOfSession.getDate() - getMondayOffset(startOfSession));
  startMonday.setHours(0, 0, 0, 0);

  // Find the Monday of the target week
  const targetMonday = new Date(targetDate);
  targetMonday.setDate(targetDate.getDate() - getMondayOffset(targetDate));
  targetMonday.setHours(0, 0, 0, 0);

  const msInWeek = 1000 * 60 * 60 * 24 * 7;
  // Calculate difference in weeks between the two Mondays.
  // Using Math.round to avoid daylight saving time float issues.
  const weekDiff = Math.round((targetMonday - startMonday) / msInWeek);

  return weekDiff + 1; // Week 1 is weekDiff = 0
}

export function formatMalaysianDate() {
  const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
  
  const d = new Date();
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
