import type { Metadata, Viewport } from "next";
import { Archivo, Brygada_1918, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const brygada = Brygada_1918({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-label",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Adjano Deli · Piekarnia-Cukiernia Adjano",
    template: "%s · Adjano Deli",
  },
  description:
    "Pieczywo, kanapki, sałatki i ciasta z Piekarni-Cukierni Adjano w Mikołowie. Zamawiasz dzień wcześniej, odbierasz rano w punkcie przy pracy albo w sklepie.",
  applicationName: "Adjano Deli",
  openGraph: { siteName: "Adjano Deli", locale: "pl_PL", type: "website" },
};

export const viewport: Viewport = { themeColor: "#4B4A2F" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={`${brygada.variable} ${archivo.variable} ${inter.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
