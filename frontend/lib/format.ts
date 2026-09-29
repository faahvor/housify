const CURRENCY_SYMBOLS: Record<string, string> = { NGN: "₦", USD: "$", GBP: "£", EUR: "€" };

function symbolFor(currency: string) {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

export function formatMoney(amount: number, currency = "NGN"): string {
  return symbolFor(currency) + amount.toLocaleString("en-US");
}

/** ₦12.5M / ₦850K — for tight spaces like metric tiles. */
export function formatMoneyCompact(amount: number, currency = "NGN"): string {
  return symbolFor(currency) + new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(amount);
}

export function formatListingPrice(listing: { type: "rent" | "sale"; price: { amount: number; currency: string } }) {
  const base = formatMoney(listing.price.amount, listing.price.currency);
  return listing.type === "rent" ? `${base}/yr` : base;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
