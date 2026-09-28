import Link from "next/link";

import { PrintButton } from "@/components/admin/print-button";
import { createServerClient } from "@/lib/supabase/server";

export default async function RouteSheetPage() {
  const supabase = await createServerClient();
  const { data } = await supabase.from("settings").select("owner_phone").eq("id", 1).maybeSingle();
  const phone = data?.owner_phone?.trim() || "";

  return (
    <article className="route-sheet max-w-3xl space-y-6 text-xl leading-snug sm:text-2xl">
      <header className="space-y-3">
        <p className="no-print text-base">
          <Link href="/admin/pomoc" className="underline-offset-4 hover:underline">
            Wróć do instrukcji
          </Link>
        </p>
        <h1 className="font-heading text-3xl font-semibold leading-tight sm:text-4xl">Ściąga na trasę</h1>
        <div className="no-print">
          <PrintButton label="Drukuj ściągę" />
        </div>
      </header>
      <ol className="list-decimal space-y-4 pl-7">
        <li>Przed wyjazdem: paczki są oznaczone etykietami, masz telefon z zalogowanym panelem.</li>
        <li>
          W punkcie: <strong>Paczki</strong> → Twój punkt → „Jestem na miejscu — powiadom klientów”.
        </li>
        <li>
          Klient podaje kod → <strong>Wydawanie</strong> → wpisz kod → „Wydano”.
        </li>
        <li>Nie ma kodu → „Szukaj” po nazwisku albo numerze.</li>
        <li>
          Coś nie gra → telefon do Justyny:{" "}
          {phone ? (
            <a href={`tel:${phone}`} className="font-semibold">
              {phone}
            </a>
          ) : (
            "brak numeru w ustawieniach"
          )}
          .
        </li>
      </ol>
    </article>
  );
}
