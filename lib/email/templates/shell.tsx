import type { ReactNode } from "react";

const cream = "#F1EADB";
const khaki = "#4B4A2F";
const ink = "#2B2A1F";
const gold = "#B8975A";

type EmailShellProps = {
  title: string;
  ownerPhone: string | null;
  children: ReactNode;
};

export function EmailShell({ title, ownerPhone, children }: EmailShellProps) {
  const phone = ownerPhone?.trim();

  return (
    <html lang="pl">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: cream,
          color: ink,
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "16px",
          lineHeight: 1.5,
        }}
      >
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ backgroundColor: cream, padding: "24px 12px" }}
        >
          <tr>
            <td align="center">
              <table
                role="presentation"
                width="100%"
                cellPadding={0}
                cellSpacing={0}
                style={{ maxWidth: "520px", backgroundColor: cream }}
              >
                <tr>
                  <td
                    style={{
                      backgroundColor: khaki,
                      color: cream,
                      padding: "18px 20px",
                      fontSize: "22px",
                      fontWeight: 700,
                    }}
                  >
                    {title}
                  </td>
                </tr>
                <tr>
                  <td style={{ height: "3px", backgroundColor: gold, fontSize: 0, lineHeight: 0 }}>
                    &nbsp;
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "24px 20px", color: ink }}>{children}</td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "16px 20px 8px",
                      color: khaki,
                      fontSize: "13px",
                      borderTop: `1px solid ${gold}`,
                    }}
                  >
                    Piekarnia-Cukiernia Adjano, ul. Katowicka 120, Mikołów
                    {phone ? ` · tel. ${phone}` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}
