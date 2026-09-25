import { isoWeekday } from "@/lib/dates";

export type ShopCategoryTileData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imagePath: string | null;
  productCount: number;
  runningLow: boolean;
  hasPromo: boolean;
  minPriceGrosze: number | null;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
};

type ProductRow = {
  id: string;
  category_id: string | null;
  weekdays: number[];
  price_grosze?: number | null;
};

type AvailabilityRow = {
  product_id: string;
  remaining: number;
  is_available: boolean;
  is_promo?: boolean;
};

export function buildCategoryTiles(
  categories: CategoryRow[],
  products: ProductRow[],
  availability: AvailabilityRow[],
  day: string | null,
): ShopCategoryTileData[] {
  const weekday = day ? isoWeekday(day) : null;
  const availabilityByProduct = new Map(availability.map((row) => [row.product_id, row]));

  return categories
    .map((category) => {
      const inCategory = products.filter((product) => {
        if (product.category_id !== category.id) {
          return false;
        }
        if (weekday === null) {
          return true;
        }
        return product.weekdays.includes(weekday);
      });

      const runningLow = inCategory.some((product) => {
        const stock = availabilityByProduct.get(product.id);
        if (!stock?.is_available) {
          return false;
        }
        return stock.remaining <= 5;
      });
      const hasPromo = inCategory.some((product) => availabilityByProduct.get(product.id)?.is_promo);
      const prices = inCategory.flatMap((product) =>
        typeof product.price_grosze === "number" ? [product.price_grosze] : [],
      );

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imagePath: category.image_path,
        productCount: inCategory.length,
        runningLow,
        hasPromo,
        minPriceGrosze: prices.length > 0 ? Math.min(...prices) : null,
      };
    })
    .filter((category) => category.productCount > 0);
}
