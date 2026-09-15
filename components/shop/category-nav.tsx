type CategoryNavItem = {
  name: string;
  slug: string;
};

type CategoryNavProps = {
  categories: CategoryNavItem[];
};

export function CategoryNav({ categories }: CategoryNavProps) {
  return (
    <nav
      aria-label="Kategorie"
      className="sticky top-[57px] z-40 -mx-4 border-b border-[var(--adj-cream-dark)] bg-background px-4"
    >
      <ul className="flex gap-1 overflow-x-auto py-2">
        {categories.map((category) => (
          <li key={category.slug} className="shrink-0">
            <a
              href={`#${category.slug}`}
              className="flex min-h-12 items-center rounded-full px-3 text-sm font-medium hover:bg-[var(--adj-cream-dark)]"
            >
              {category.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
