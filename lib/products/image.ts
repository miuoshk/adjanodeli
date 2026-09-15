export function productPublicUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) {
    return null;
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) {
    return null;
  }
  return `${base}/storage/v1/object/public/products/${imagePath}`;
}
