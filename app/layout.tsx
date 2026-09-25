import type { Metadata } from "next";
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
  title: "AdjanoDeli — zamów dziś, odbierz jutro w pracy",
  description:
    "Zamów pieczywo i słodkości z Piekarni-Cukierni Adjano — odbiór w wybranym punkcie w Mikołowie.",
};

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
