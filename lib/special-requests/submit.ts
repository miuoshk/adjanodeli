"use server";

import { sendSpecialRequestOwner } from "@/lib/email/send-special-request-owner";
import { createServerClient } from "@/lib/supabase/server";

export type SpecialRequestInput = {
  name: string;
  phone: string;
  email: string;
  wantedDate: string;
  description: string;
};

export async function submitSpecialRequest(input: SpecialRequestInput) {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();
  const description = input.description.trim();
  const wantedDate = /^\d{4}-\d{2}-\d{2}$/.test(input.wantedDate) ? input.wantedDate : null;

  if (phone.replace(/\D/g, "").length < 9) {
    return { ok: false as const, message: "Podaj telefon." };
  }
  if (description.length < 8) {
    return { ok: false as const, message: "Napisz, o co chodzi — co, ile, dla ilu osób." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, message: "Zły e-mail." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("special_requests").insert({
    name: name || null,
    phone,
    email: email || null,
    wanted_date: wantedDate,
    description,
    status: "new",
  });

  if (error) {
    return { ok: false as const, message: "Nie udało się wysłać. Zadzwoń albo spróbuj jeszcze raz." };
  }

  await sendSpecialRequestOwner({
    name: name || null,
    phone,
    email: email || null,
    wantedDate,
    description,
  });

  return { ok: true as const };
}
