import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Brak STRIPE_SECRET_KEY.");
  }
  if (!client) {
    client = new Stripe(secretKey, {
      apiVersion: "2026-08-26.dahlia",
      typescript: true,
    });
  }
  return client;
}
