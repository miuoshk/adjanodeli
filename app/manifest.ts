import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Adjano Deli — Piekarnia-Cukiernia Adjano",
    short_name: "Adjano Deli",
    description:
      "Pieczywo, kanapki, sałatki i ciasta z piekarni Adjano. Zamawiasz dzień wcześniej, odbierasz rano.",
    start_url: "/",
    display: "standalone",
    background_color: "#F1EADB",
    theme_color: "#4B4A2F",
    lang: "pl",
    icons: [
      { src: "/brand/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/brand/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
