export const EMAIL_KINDS = [
  "order_paid",
  "order_delivered",
  "standing_reminder",
  "special_request_owner",
  "manual_refund_owner",
  "paid_after_expiry_owner",
  "pickup_point_changed",
  "test",
] as const;

export type EmailKind = (typeof EMAIL_KINDS)[number];

export type EmailSendDecision = "send" | "skip";

/** A previous sent row blocks another send, unless the caller forces it. */
export function decideEmailSend(alreadySent: boolean, force = false): EmailSendDecision {
  if (alreadySent && !force) {
    return "skip";
  }
  return "send";
}
