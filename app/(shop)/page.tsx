import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Briefcase, Clock, CookingPot } from "lucide-react";

import { PatternBand } from "@/components/shop/bakery-pattern";
import { CategoryTile } from "@/components/shop/category-tile";
import { Button } from "@/components/ui/button";
import { formatCutoff } from "@/lib/dates";
import { buildCategoryTiles, type ShopCategoryTileData } from "@/lib/shop/category-tiles";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Adjano — piekarnia w Mikołowie od 1937",
  description:
    "Piekarnia-Cukiernia Adjano, ul. Katowicka 120. Zamów z telefonu, odbierz w pracy.",
  openGraph: {
    title: "Adjano — piekarnia w Mikołowie od 1937",
    description:
      "Piekarnia-Cukiernia Adjano, ul. Katowicka 120. Zamów z telefonu, odbierz w pracy.",
    images: [{ url: "/brand/kamienica.jpg" }],
  },
};

const steps = [
  "Wybierz dzień i punkt odbioru",
  "Złóż zamówienie i zapłać BLIK-iem",
  "Rano pieczemy i dowozimy",
  "Odbierasz paczkę na kod",
];

export default async function LandingPage() {
  let cutoff = "20:00";
  let phone: string | null = null;
  let tiles: ShopCategoryTileData[] = [];
  let selectedDay: string | null = null;

  if (getSupabasePublicEnv()) {
    try {
      const supabase = await createServerClient();
      const [settingsResult, categoriesResult, productsResult, datesResult] = await Promise.all([
        supabase.from("settings").select("cutoff_time, owner_phone").eq("id", 1).maybeSingle(),
        supabase
          .from("categories")
          .select("id, name, slug, description, image_path, sort_order")
          .eq("is_active", true)
          .order("sort_order"),
        supabase.from("products").select("id, category_id, weekdays").eq("is_active", true),
        supabase.rpc("available_pickup_dates"),
      ]);
      cutoff = formatCutoff(settingsResult.data?.cutoff_time ?? "20:00");
      phone = settingsResult.data?.owner_phone?.trim() || null;
      const pickupDates = (datesResult.data ?? [])
        .map((value) => (typeof value === "string" ? value.slice(0, 10) : ""))
        .filter(Boolean);
      selectedDay = pickupDates[0] ?? null;
      const { data: availability } = selectedDay
        ? await supabase.rpc("product_availability", { p_day: selectedDay })
        : { data: [] };
      tiles = buildCategoryTiles(
        categoriesResult.data ?? [],
        productsResult.data ?? [],
        availability ?? [],
        selectedDay,
      );
    } catch {
      // Wizytówka działa też bez bazy — bez kafelków kategorii.
    }
  }

  const facts = [
    {
      icon: Clock,
      title: `Zamawiasz do ${cutoff}`,
      text: "Do tej godziny przyjmujemy zamówienia na następny dzień.",
    },
    {
      icon: CookingPot,
      title: "Pieczemy rano",
      text: "Rano pieczemy to, co poszło w zamówieniach.",
    },
    {
      icon: Briefcase,
      title: "Odbierasz w pracy",
      text: "Paczka czeka w wybranym punkcie, w jego godzinach.",
    },
  ];

  return (
    <div>
      <section className="relative h-[70vh] min-h-[36rem] w-full">
        <Image
          src="/brand/kamienica.jpg"
          alt="Piekarnia Adjano przy ul. Katowickiej w Mikołowie"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[var(--adj-khaki)] via-[var(--adj-khaki)]/70 to-black/35"
          aria-hidden
        />
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-20">
          <p className="mb-3 text-xs font-medium tracking-[0.2em] text-[var(--adj-cream)]">
            PIEKARNIA · CUKIERNIA
          </p>
          <Image
            src="/brand/adjano-logo.png"
            alt="Adjano"
            width={280}
            height={90}
            className="mb-5 h-16 w-auto object-contain sm:h-20"
            priority
          />
          <h1 className="font-heading text-3xl font-semibold leading-tight text-[var(--adj-cream)] sm:text-4xl md:text-5xl">
            Tradycyjnie pieczone. Nowocześnie zamawiane.
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--adj-cream)]">
            Od 1937 roku ten sam zakwas, te same ręce. Od dziś także zamówienie z telefonu i odbiór
            w pracy.
          </p>
          <div className="mt-6 flex flex-col items-start gap-3">
            <Button asChild size="lg" className="min-h-12 px-6 text-base">
              <Link href="/sklep">Zapraszamy do sklepu →</Link>
            </Button>
            <a
              href="#jak-to-dziala"
              className="text-sm text-[var(--adj-cream)] underline-offset-4 hover:underline"
            >
              Jak to działa?
            </a>
          </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--adj-cream)]">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.title} className="flex gap-3">
              <fact.icon
                className="mt-0.5 size-7 shrink-0 text-[var(--adj-red)]"
                strokeWidth={1.75}
                aria-hidden
              />
              <div>
                <p className="font-medium">{fact.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{fact.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PatternBand soft />

      <section id="jak-to-dziala" className="scroll-mt-24 bg-[var(--adj-cream-dark)]/40">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="font-heading text-3xl font-semibold">Jak to działa</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3 sm:flex-col">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--adj-khaki)] font-heading text-lg font-semibold text-[var(--adj-cream)]">
                  {index + 1}
                </span>
                <p className="pt-1 leading-relaxed sm:pt-2">{step}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
            Odbiór w Twoim miejscu pracy? Zapytaj w sekretariacie o kod AdjanoDeli.
          </p>
        </div>
      </section>

      <section className="bg-[var(--adj-cream)]">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="font-heading text-3xl font-semibold">Co pieczemy</h2>
          {tiles.length > 0 ? (
            <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
              {tiles.map((tile) => (
                <li key={tile.id}>
                  <CategoryTile
                    name={tile.name}
                    slug={tile.slug}
                    imagePath={tile.imagePath}
                    productCount={tile.productCount}
                    runningLow={tile.runningLow}
                    hasPromo={tile.hasPromo}
                    day={selectedDay}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              <Link href="/sklep" className="underline underline-offset-4">
                Wejdź do sklepu
              </Link>{" "}
              — lista pieczywa jest tam.
            </p>
          )}
        </div>
      </section>

      <section className="bg-[var(--adj-cream)]">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-2 md:items-center">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[var(--adj-cream-dark)]">
            <Image
              src="/brand/packaging.jpg"
              alt="Opakowanie Adjano"
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="space-y-4 leading-relaxed">
            <h2 className="font-heading text-3xl font-semibold">O nas</h2>
            {/* TEKST OD JUSTYNY */}
            <p>
              Piekarnia Adjano piecze od 1937 roku. Zakwas ten sam, ręce też — chleb, bułki i ciasta
              wychodzą z Kamionki, nie z taśmy.
            </p>
            {/* TEKST OD JUSTYNY */}
            <p>
              Jesteśmy rodzinną piekarnią w Mikołowie-Kamionce, ul. Katowicka 120. Tuż przy drodze,
              z malunkiem piekarza na ścianie.
            </p>
            {/* TEKST OD JUSTYNY */}
            <p>
              Sklep stacjonarny: godziny do potwierdzenia.
              {phone ? ` Telefon: ${phone}.` : " Telefon podamy w sklepie."}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--adj-khaki)] py-12 text-center text-[var(--adj-cream)]">
        <div className="mx-auto max-w-5xl px-4">
          <Button asChild size="lg" className="min-h-12 px-6 text-base">
            <Link href="/sklep">Zapraszamy do sklepu →</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
