import { maskCustomerName } from "@/lib/labels/mask-customer-name";
import { maskEmail } from "@/lib/labels/mask-email";

export const LABEL_CUSTOMER_INFO = ["masked", "masked_email", "full"] as const;

export type LabelCustomerInfo = (typeof LABEL_CUSTOMER_INFO)[number];

export function isLabelCustomerInfo(value: string): value is LabelCustomerInfo {
  return (LABEL_CUSTOMER_INFO as readonly string[]).includes(value);
}

export function labelCustomerLines(
  mode: LabelCustomerInfo,
  name: string,
  email: string,
): { name: string; email: string | null } {
  const trimmedEmail = email.trim();
  if (mode === "full") {
    return { name: name.trim(), email: trimmedEmail.length > 0 ? trimmedEmail : null };
  }
  const maskedName = maskCustomerName(name);
  if (mode === "masked") {
    return { name: maskedName, email: null };
  }
  return {
    name: maskedName,
    email: trimmedEmail.length > 0 ? maskEmail(trimmedEmail) : null,
  };
}
