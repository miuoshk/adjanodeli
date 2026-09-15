import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("Brak STRIPE_SECRET_KEY.");
}

export const stripe = new Stripe(secretKey, {
  apiVersion: "2026-08-26.dahlia",
  typescript: true,
});
