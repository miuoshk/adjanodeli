import { SectionHeading } from "@/components/brand/section-heading";
import { SpecialRequestForm } from "@/components/shop/special-request-form";

export default function SpecialRequestPage() {
  return (
    <div>
      <SectionHeading
        as="h1"
        eyebrow="Zamówienia specjalne"
        title="Większe zamówienie albo coś spoza menu"
        description={
          <>
            Konferencja, szkolenie albo zamówienie do biura? Napisz, czego potrzebujesz i&nbsp;na
            kiedy. Oddzwonimy.
          </>
        }
      />
      <div className="mt-8">
        <SpecialRequestForm />
      </div>
    </div>
  );
}
