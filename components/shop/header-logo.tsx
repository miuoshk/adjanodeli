import Image from "next/image";
import Link from "next/link";

export function HeaderLogo() {
  return (
    <Link href="/" aria-label="Adjano Deli — strona główna" className="shrink-0">
      <Image
        src="/brand/logo/adjano-deli-poziomy-karmin.svg"
        alt="Adjano Deli"
        width={726}
        height={225}
        className="h-10 w-auto lg:h-[46px]"
        priority
        unoptimized
      />
    </Link>
  );
}
