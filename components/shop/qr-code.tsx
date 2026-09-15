"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type QrCodeProps = {
  value: string;
};

export function QrCode({ value }: QrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: 220, margin: 1, errorCorrectionLevel: "M" }).then(
      (url) => {
        if (!cancelled) {
          setDataUrl(url);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!dataUrl) {
    return <div className="size-[220px] rounded-lg bg-muted" aria-hidden />;
  }

  return (
    <img
      src={dataUrl}
      alt={`Kod odbioru ${value}`}
      width={220}
      height={220}
      className="mx-auto size-[220px] rounded-lg bg-white"
    />
  );
}
