import { create } from 'zustand';

export interface CartProduct {
  id: string;
  name: string;
  price: string | number;
  imageUrl?: string;
  isVeg: boolean;
  categoryId: string;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];

  // Actions
  addItem: (product: CartProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Calculated Selectors
  getItemCount: () => number;
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getTaxesAndCharges: () => number;
  getTotal: () => number;
}

const BASE_KM_DELIVERY_FEE = 50; // ₹20 per km from shop location (2.5 km avg local delivery)
const TAX_RATE = 0.05; // 5% GST for restaurant orders

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product) => {
    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.product.id === product.id);

      if (existingIndex > -1) {
        const updatedItems = [...state.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex]!,
          quantity: updatedItems[existingIndex]!.quantity + 1,
        };
        return { items: updatedItems };
      }

      return { items: [...state.items, { product, quantity: 1 }] };
    });
  },

  removeItem: (productId) => {
    set((state) => {
      const existing = state.items.find((item) => item.product.id === productId);
      if (!existing) return state;

      if (existing.quantity > 1) {
        return {
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
          ),
        };
      }

      return {
        items: state.items.filter((item) => item.product.id !== productId),
      };
    });
  },

  updateQuantity: (productId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return {
          items: state.items.filter((item) => item.product.id !== productId),
        };
      }

      return {
        items: state.items.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        ),
      };
    });
  },

  clearCart: () => set({ items: [] }),

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      const pPrice = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
      return sum + pPrice * item.quantity;
    }, 0);
  },

  getDeliveryFee: () => {
    const subtotal = get().getSubtotal();
    return subtotal > 0 ? BASE_KM_DELIVERY_FEE : 0;
  },

  getTaxesAndCharges: () => {
    const subtotal = get().getSubtotal();
    return Math.round(subtotal * TAX_RATE);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    if (subtotal === 0) return 0;
    return subtotal + get().getDeliveryFee() + get().getTaxesAndCharges();
  },
}));
