import { signOut } from "@/lib/auth-actions";

export function SignedInLine({ email }: { email: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[15px] text-[var(--adj-ink-soft)]">
      <p>Zalogowana jako {email}</p>
      <form action={signOut}>
        <button type="submit" className="adj-link">
          To nie Ty? Wyloguj
        </button>
      </form>
    </div>
  );
}
