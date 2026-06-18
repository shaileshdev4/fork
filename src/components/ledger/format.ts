export function fmtSigned(n: number, currency: string) {
  const abs = Math.abs(n);
  const s = abs.toLocaleString(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  if (n > 0) return `+${s}`;
  if (n < 0) return `−${s}`;
  return s;
}

export function fmtBalance(n: number, currency: string) {
  return Math.abs(n).toLocaleString(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

export function fmtDelta(n: number, currency: string) {
  const s = Math.abs(n).toLocaleString(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  if (n > 0) return `▲ ${s}`;
  if (n < 0) return `▼ ${s}`;
  return s;
}

export function yearLabel(month: number) {
  const y = month / 12;
  return month % 12 === 0 ? `Year ${y}` : `Year ${y.toFixed(1)}`;
}
