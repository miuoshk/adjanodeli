import type { ReactNode } from "react";

export function SiteHeaderShell({
  children,
  announcement,
}: {
  children: ReactNode;
  announcement?: ReactNode;
}) {
  return (
    <>
      {announcement}
      <header className="sticky top-0 z-50 border-b border-[rgba(43,42,31,0.18)] bg-[var(--adj-cream)]/95 text-[var(--adj-ink)] backdrop-blur">
        <div className="mx-auto flex h-[68px] w-full max-w-[1280px] items-center justify-between px-5 lg:h-[84px] lg:px-12">
          {children}
        </div>
      </header>
    </>
  );
}
