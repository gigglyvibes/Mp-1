/**
 * Automatically calculates a human-readable job duration between
 * a start and end Date.
 */
const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();

  if (diffMs === 0) return "Same day";
  if (diffMs < 0) return "0 hours";

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes && !days) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);

  return parts.join(" ") || "0 hours";
};

module.exports = calculateDuration;
