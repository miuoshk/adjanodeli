import { createClient } from "@/lib/supabase/admin";

function adminEnv() {
  const username = process.env.ADMIN_USERNAME?.trim() ?? "";
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!username || !email || !password) {
    return null;
  }
  return { username, email, password };
}

export function getAdminLoginEnv() {
  return adminEnv();
}

async function findAuthUserIdByEmail(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<string | null> {
  const { data: profile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (profile?.id) {
    return profile.id;
  }

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      return null;
    }
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) {
      return found.id;
    }
    if (data.users.length < 200) {
      break;
    }
  }

  return null;
}

export async function ensureAdminOwnerUser(): Promise<{ ok: true } | { ok: false }> {
  const env = adminEnv();
  if (!env) {
    return { ok: false };
  }

  let admin: ReturnType<typeof createClient>;
  try {
    admin = createClient();
  } catch {
    return { ok: false };
  }

  let userId = await findAuthUserIdByEmail(admin, env.email);

  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: env.password,
      email_confirm: true,
      user_metadata: { full_name: "Justyna" },
    });
    if (error) {
      return { ok: false };
    }
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: env.email,
      password: env.password,
      email_confirm: true,
      user_metadata: { full_name: "Justyna" },
    });
    if (error || !data.user) {
      return { ok: false };
    }
    userId = data.user.id;
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    email: env.email,
    role: "owner",
    full_name: "Justyna",
  });

  if (profileError) {
    return { ok: false };
  }

  return { ok: true };
}
