import type { ReactNode } from "react";

const cream = "#F1EADB";
const card = "#FBF7EE";
const ink = "#2B2A1F";
const soft = "#57553E";
const gold = "#B8975A";
const red = "#A6231F";

const textFont = "Georgia, 'Times New Roman', serif";
const labelFont = "'Arial Narrow', Arial, sans-serif";

type EmailShellProps = {
  title: string;
  ownerPhone: string | null;
  children: ReactNode;
};

export function EmailShell({ title, ownerPhone, children }: EmailShellProps) {
  const phone = ownerPhone?.trim();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  return (
    <html lang="pl">
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: cream,
          color: ink,
          fontFamily: textFont,
          fontSize: "17px",
          lineHeight: 1.55,
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
                style={{
                  maxWidth: "560px",
                  backgroundColor: card,
                  border: `1px solid ${gold}`,
                }}
              >
                <tr>
                  <td style={{ padding: "24px 28px 0", backgroundColor: card }}>
                    {appUrl ? (
                      // Maile nie renderują next/image. Zwykły img jest tu zamierzony.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${appUrl}/brand/email/adjano-deli-karmin@2x.png`}
                        width="176"
                        height="78"
                        alt="Adjano Deli"
                        style={{ display: "block", border: 0 }}
                      />
                    ) : (
                      <p
                        style={{
                          margin: 0,
                          color: red,
                          fontStyle: "italic",
                          fontSize: "26px",
                          fontFamily: textFont,
                        }}
                      >
                        Adjano Deli
                      </p>
                    )}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "14px 28px 0", backgroundColor: card }}>
                    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                      <tr>
                        <td
                          height={1}
                          style={{
                            height: "1px",
                            backgroundColor: gold,
                            fontSize: "1px",
                            lineHeight: "1px",
                          }}
                        >
                          &nbsp;
                        </td>
                      </tr>
                      <tr>
                        <td height={3} style={{ height: "3px", fontSize: "1px", lineHeight: "3px" }}>
                          &nbsp;
                        </td>
                      </tr>
                      <tr>
                        <td
                          height={1}
                          style={{
                            height: "1px",
                            backgroundColor: gold,
                            fontSize: "1px",
                            lineHeight: "1px",
                          }}
                        >
                          &nbsp;
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "10px 28px 0",
                      backgroundColor: card,
                      color: soft,
                      fontFamily: labelFont,
                      fontSize: "11px",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                    }}
                  >
                    {title}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "28px 28px 24px",
                      backgroundColor: card,
                      color: ink,
                      fontFamily: textFont,
                      fontSize: "17px",
                      lineHeight: 1.55,
                    }}
                  >
                    {children}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "16px 28px 20px",
                      backgroundColor: card,
                      color: soft,
                      fontFamily: textFont,
                      fontSize: "13px",
                      lineHeight: 1.5,
                      borderTop: "1px solid rgba(43,42,31,0.18)",
                    }}
                  >
                    Piekarnia-Cukiernia Adjano · ul. Katowicka 120, Mikołów
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
