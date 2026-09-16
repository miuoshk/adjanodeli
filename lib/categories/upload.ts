import { createBrowserClient } from "@/lib/supabase/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 3 * 1024 * 1024;

function extensionFor(type: string): string {
  if (type === "image/png") {
    return "png";
  }
  if (type === "image/webp") {
    return "webp";
  }
  return "jpg";
}

export async function uploadCategoryImage(categoryId: string, file: File) {
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false as const, message: "Tylko jpg, png albo webp." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false as const, message: "Zdjęcie max 3 MB." };
  }

  const path = `${categoryId}/${Date.now()}.${extensionFor(file.type)}`;
  const supabase = createBrowserClient();
  const { error } = await supabase.storage.from("categories").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return { ok: false as const, message: "Nie udało się wgrać zdjęcia." };
  }
  return { ok: true as const, path };
}

export async function deleteCategoryImage(path: string) {
  const supabase = createBrowserClient();
  const { error } = await supabase.storage.from("categories").remove([path]);
  if (error) {
    return { ok: false as const, message: "Nie udało się usunąć zdjęcia." };
  }
  return { ok: true as const };
}
