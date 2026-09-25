"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderLogo() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
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

  return (
    <Link
      href="/"
      aria-label="Adjano — strona główna"
      className="relative block h-9 w-[120px] shrink-0"
    >
      <Image
        src="/brand/adjano-logo.png"
        alt="Adjano"
        fill
        className="object-contain object-left"
        priority
      />
    </Link>
  );
}
