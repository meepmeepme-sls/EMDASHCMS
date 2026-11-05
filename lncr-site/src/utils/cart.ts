export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  option?: string;
  isDigitalDownload?: boolean;
  quantity: number;
}

const STORAGE_KEY = 'lncr_cart_v1';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('lncr-cart-updated', { detail: { items } }));
  } catch (err) {
    console.error('Error saving cart:', err);
  }
}

export function addToCart(item: Omit<CartItem, 'quantity'> & { quantity?: number }): CartItem[] {
  const current = getCart();
  const qtyToAdd = item.quantity && item.quantity > 0 ? item.quantity : 1;
  const existingIdx = current.findIndex(
    (i) => i.productId === item.productId && (i.option || '') === (item.option || '')
  );

  let updated: CartItem[];
  if (existingIdx >= 0) {
    updated = current.map((ci, idx) =>
      idx === existingIdx ? { ...ci, quantity: ci.quantity + qtyToAdd } : ci
    );
  } else {
    updated = [...current, { ...item, quantity: qtyToAdd }];
  }

  saveCart(updated);
  return updated;
}

export function updateCartQuantity(productId: string, option: string | undefined, quantity: number): CartItem[] {
  const current = getCart();
  let updated: CartItem[];
  if (quantity <= 0) {
    updated = current.filter(
      (i) => !(i.productId === productId && (i.option || '') === (option || ''))
    );
  } else {
    updated = current.map((i) =>
      i.productId === productId && (i.option || '') === (option || '')
        ? { ...i, quantity }
        : i
    );
  }
  saveCart(updated);
  return updated;
}

export function removeFromCart(productId: string, option?: string): CartItem[] {
  const current = getCart();
  const updated = current.filter(
    (i) => !(i.productId === productId && (i.option || '') === (option || ''))
  );
  saveCart(updated);
  return updated;
}

export function clearCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('lncr-cart-updated', { detail: { items: [] } }));
}

export function getCartCount(): number {
  const items = getCart();
  return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
}

export function getCartSubtotal(): number {
  const items = getCart();
  return items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
}
