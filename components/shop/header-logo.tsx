import Image from "next/image";
import Link from "next/link";

export function HeaderLogo() {
  return (
    <Link href="/" aria-label="Adjano — strona główna" className="shrink-0">
      <Image
        src="/brand/adjano-logo-red.svg"
        alt="Adjano"
        width={585}
        height={332}
        className="h-auto w-[100px] lg:w-[128px]"
        priority
        unoptimized
      />
    </Link>
  );
}
