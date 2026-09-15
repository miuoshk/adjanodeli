import { LoginForm } from "@/components/shop/login-form";
import { safeNextPath } from "@/lib/safe-next";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-semibold">Logowanie</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Podaj e-mail, wyślemy kod. Bez hasła.
      </p>
      <LoginForm next={next} />
    </div>
  );
}
