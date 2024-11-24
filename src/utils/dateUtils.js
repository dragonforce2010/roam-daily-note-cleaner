export function calculateNextRunTime(hours, minutes) {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + (now.getHours() * 60 + now.getMinutes() >= hours * 60 + minutes ? 1 : 0),
    hours,
    minutes,
    0
  );
}

export function validateTimeFormat(timeString) {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
} 