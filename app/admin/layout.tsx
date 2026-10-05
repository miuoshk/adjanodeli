import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  manifest: "/admin.webmanifest",
  appleWebApp: { title: "Panel" },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
