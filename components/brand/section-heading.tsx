import type { ReactNode } from "react";

const h1 =
  "mt-[18px] font-heading text-[2.5rem] leading-[1.02] font-medium tracking-[-0.02em] text-balance lg:text-[3.75rem] lg:leading-[0.98]";

const h2 =
  "mt-[18px] font-heading text-[2.375rem] leading-[1.06] font-medium tracking-[-0.015em] text-balance lg:text-[3.625rem] lg:leading-[1.02]";

export function SectionHeading({
  eyebrow,
  title,
  as = "h2",
  description,
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  as?: "h1" | "h2";
  description?: ReactNode;
  action?: ReactNode;
}) {
  const Title = as;

  return (
    <div className="lg:flex lg:items-end lg:justify-between lg:gap-8">
      <div>
        {eyebrow ? <p className="adj-label text-[var(--adj-red)]">{eyebrow}</p> : null}
        <Title className={as === "h1" ? h1 : h2}>{title}</Title>
        {description ? (
          <p className="mt-4 max-w-[36em] text-lg text-[var(--adj-ink-soft)]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-5 shrink-0 lg:mt-0">{action}</div> : null}
    </div>
  );
}
