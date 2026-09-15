import { SpecialRequestForm } from "@/components/shop/special-request-form";

export default function SpecialRequestPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-semibold leading-tight">
        Zamówienie specjalne
      </h1>
      <p className="text-base leading-relaxed">
        Konferencja, szkolenie, większe zamówienie do biura? Napisz, oddzwonimy.
      </p>
      <SpecialRequestForm />
    </div>
  );
}
