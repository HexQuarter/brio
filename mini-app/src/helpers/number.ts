export const formatBtcAmount = (amount: number) => {
  return new Intl.NumberFormat("en", {maximumFractionDigits: 8, useGrouping: false}).format(amount)
}

export const formatFiatAmount = (amount: number) => new Intl.NumberFormat("en", {
  maximumFractionDigits: 3,
  useGrouping: false
}).format(amount)


export const convertSatsToBtc = (amount: number) => amount * 0.00000001

export const convertBtcToSats = (amount: number) => Math.floor(amount / 0.00000001)

export const timeAgo = (timestamp: number | string | Date): string => {
  const now = Date.now();
  const past = typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime();
  const diffMs = now - past;

  if (diffMs < 0) return "in the future";

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);
  const weeks   = Math.floor(days / 7);
  const months  = Math.floor(days / 30);
  const years   = Math.floor(days / 365);

  if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours   < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days    < 7)  return `${days} day${days !== 1 ? "s" : ""} ago`;
  if (weeks   < 5)  return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  if (months  < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}