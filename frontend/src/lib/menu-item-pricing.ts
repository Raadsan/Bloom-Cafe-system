import { MenuItem, parseMenuAddons, parseMenuVariations } from "@/lib/api/restaurant/menuItemApi";

export type MenuItemDiscountType = "percentage" | "fixed";

type PricedItem = Pick<MenuItem, "price" | "discountType" | "discountValue">;

export function getMenuItemDiscountAmount(item: PricedItem): number {
  const value = Number(item.discountValue) || 0;
  const price = Number(item.price) || 0;
  if (value <= 0 || !item.discountType) return 0;

  if (item.discountType === "percentage") {
    return Math.min(price, (price * value) / 100);
  }
  if (item.discountType === "fixed") {
    return Math.min(price, value);
  }
  return 0;
}

export function getMenuItemEffectivePrice(item: PricedItem): number {
  const price = Number(item.price) || 0;
  return Math.max(0, price - getMenuItemDiscountAmount(item));
}

/** Unit price for a size and optional add-ons. Sizes replace the base price; add-ons are added on top. */
export function selectionUnitPrice(
  item: PricedItem & { options?: unknown },
  selection?: { size?: string; addonNames?: string[] }
): number {
  const variations = parseMenuVariations(item);
  let base = Number(item.price) || 0;
  if (variations.length) {
    const match = selection?.size
      ? variations.find((row) => row.size === selection.size)
      : undefined;
    base = match ? match.price : Math.min(...variations.map((row) => row.price));
  }
  const extras = (selection?.addonNames || []).reduce((sum, name) => {
    const addon = parseMenuAddons(item).find((row) => row.name === name);
    return sum + (addon ? addon.price : 0);
  }, 0);
  return getMenuItemEffectivePrice({ ...item, price: base }) + extras;
}

export function menuItemHasDiscount(item: PricedItem): boolean {
  return getMenuItemDiscountAmount(item) > 0;
}

export function getMenuItemDiscountLabel(item: PricedItem): string {
  const value = Number(item.discountValue) || 0;
  if (!menuItemHasDiscount(item)) return "";
  if (item.discountType === "percentage") return `-${value}%`;
  return `-$${value.toFixed(2)}`;
}

export function getMenuItemDiscountPercent(item: PricedItem): number {
  const price = Number(item.price) || 0;
  if (!menuItemHasDiscount(item) || price <= 0) return 0;
  if (item.discountType === "percentage") return valueOrZero(item.discountValue);
  return Math.round((getMenuItemDiscountAmount(item) / price) * 100);
}

function valueOrZero(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}
