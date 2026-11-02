import { createServerClient } from "@/lib/supabase/server";

export type CustomerRow = {
  id: string;
  fullName: string | null;
  phone: string | null;
  email: string;
  isBanned: boolean;
  orderCount: number;
  spentGrosze: number;
  lastOrderAt: string | null;
};

export type CustomerList = {
  rows: CustomerRow[];
  error: string | null;
};

export async function listCustomers(): Promise<CustomerList> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("customer_order_stats");

  if (error) {
    console.error("[klienci]", error.message);
    return { rows: [], error: "Nie udało się wczytać klientów." };
  }

  const rows = (data ?? []).map((row) => ({
    id: row.user_id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    isBanned: row.is_banned,
    orderCount: Number(row.order_count),
    spentGrosze: Number(row.spent_grosze),
    lastOrderAt: row.last_order_at,
  }));

  return { rows, error: null };
}
