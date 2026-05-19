import api from './axios';

export interface CartItem {
  id: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  menuItem?: { id: string; name: string; price: number; imageUrl?: string };
}

export interface Cart {
  id: string;
  tableId: string;
  items: CartItem[];
  totalAmount: number;
  createdAt?: string;
}

export interface AddToCartPayload {
  cartId: string;
  menuItemId: string;
  quantity: number;
}

export interface CheckoutPayload {
  cartId: string;
  notes?: string;
}

export const cartApi = {
  /** Get or create cart for a table (PUBLIC). */
  getOrCreateCart: async (tableId: string): Promise<Cart> => {
    const { data } = await api.post<Cart>('/cart/create', { tableId });
    return data;
  },

  /** Add a menu item to cart (PUBLIC). */
  addToCart: async (payload: AddToCartPayload): Promise<Cart> => {
    const { data } = await api.post<Cart>('/cart/add', payload);
    return data;
  },

  /** Fetch a cart by ID (PUBLIC). */
  getCart: async (id: string): Promise<Cart> => {
    const { data } = await api.get<Cart>(`/cart/${id}`);
    return data;
  },

  /** Remove one item from cart (PUBLIC). */
  removeCartItem: async (itemId: string): Promise<Cart> => {
    const { data } = await api.delete<Cart>(`/cart/item/${itemId}`);
    return data;
  },

  /** Clear all items in a cart (PUBLIC). */
  clearCart: async (cartId: string): Promise<Cart> => {
    const { data } = await api.delete<Cart>(`/cart/clear/${cartId}`);
    return data;
  },

  /** Checkout: converts cart into an order (PUBLIC). */
  checkoutCart: async (payload: CheckoutPayload): Promise<{ orderId: string }> => {
    const { data } = await api.post<{ orderId: string }>('/cart/checkout', payload);
    return data;
  },
};
