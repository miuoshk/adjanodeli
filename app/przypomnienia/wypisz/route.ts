import { createServerClient } from "@/lib/supabase/server";

const question = "Wyłączyć przypomnienia o 18:00?";
const done = "Wyłączone. Możesz je włączyć z powrotem na koncie.";

function page(body: string, token: string | null): Response {
  const form = token
    ? `<form method="post" action="/przypomnienia/wypisz?t=${encodeURIComponent(token)}" style="margin-top:24px">
        <button type="submit" style="min-height:48px;padding:0 22px;border:0;border-radius:6px;background:#A6231F;color:#F1EADB;font-size:17px">Wyłącz</button>
      </form>`
    : "";
  const html = `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${body}</title>
  </head>
  <body style="margin:0;background:#F1EADB;color:#2B2A1F;font-family:Georgia,serif">
    <main style="max-width:36rem;margin:0 auto;padding:48px 20px">
      <p style="font-size:28px;line-height:1.3;margin:0">${body}</p>
      ${form}
      <p style="margin-top:32px"><a href="/" style="color:#2B2A1F">Wróć do Adjano Deli</a></p>
    </main>
  </body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function tokenFrom(req: Request): string | null {
  const value = new URL(req.url).searchParams.get("t");
  if (!value || !/^[0-9a-f-]{36}$/i.test(value)) {
    return null;
  }
  return value;
}

export async function GET(req: Request) {
  return page(question, tokenFrom(req));
}

export async function POST(req: Request) {
  const token = tokenFrom(req);
  if (token) {
    const supabase = await createServerClient();
    const { error } = await supabase.rpc("disable_daily_reminder", { p_token: token });
    if (error) {
      console.error("disable_daily_reminder", error.message);
    }
  }
  return page(done, null);
}
