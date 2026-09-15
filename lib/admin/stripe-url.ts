export function stripePaymentUrl(paymentIntentId: string): string {
  const live = Boolean(process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_"));
  const base = live
    ? "https://dashboard.stripe.com/payments"
    : "https://dashboard.stripe.com/test/payments";
  return `${base}/${paymentIntentId}`;
}
