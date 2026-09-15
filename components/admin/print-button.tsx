"use client";

type PrintButtonProps = {
  label: string;
};

export function PrintButton({ label }: PrintButtonProps) {
  return (
    <button type="button" className="no-print print-action" onClick={() => window.print()}>
      {label}
    </button>
  );
}
