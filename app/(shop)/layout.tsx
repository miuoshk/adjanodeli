import { SiteFooter } from "@/components/shop/site-footer";
import { ShopMain } from "@/components/shop/shop-main";
import { SiteHeader } from "@/components/shop/site-header";

export const dynamic = "force-dynamic";

// Baner cookies: NIE dodajemy. Tylko niezbędne cookies (sesja) i koszyk w localStorage.

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <ShopMain>{children}</ShopMain>
      <SiteFooter />
    </div>
  );
}
