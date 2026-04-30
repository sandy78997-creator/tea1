import { create } from 'zustand';
import { User } from 'firebase/auth';

interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface AppState {
  user: User | null;
  isAdmin: boolean;
  setUser: (user: User | null, isAdmin: boolean) => void;
  
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isAdmin: false,
  setUser: (user, isAdmin) => set({ user, isAdmin }),
  
  cart: [],
  addToCart: (item) => set((state) => {
    const existing = state.cart.find(i => i.itemId === item.itemId);
    if (existing) {
      return {
        cart: state.cart.map(i => i.itemId === item.itemId ? { ...i, quantity: i.quantity + item.quantity } : i)
      };
    }
    return { cart: [...state.cart, item] };
  }),
  removeFromCart: (itemId) => set((state) => ({
    cart: state.cart.filter(i => i.itemId !== itemId)
  })),
  updateQuantity: (itemId, delta) => set((state) => ({
    cart: state.cart.map(i => {
      if (i.itemId === itemId) {
        const newQuantity = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQuantity };
      }
      return i;
    })
  })),
  clearCart: () => set({ cart: [] }),
  cartTotal: () => get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
}));
