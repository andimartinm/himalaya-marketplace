'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  productoId: string;
  name: string;
  price: number;
  quantity: number;
  emprendedorId: string;
  emprendedorName: string;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  emprendedorId: string | null;
  addItem: (item: CartItem) => boolean;
  removeItem: (productoId: string) => void;
  updateQuantity: (productoId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      emprendedorId: null,

      addItem: (item) => {
        const state = get();
        
        // Check if cart has items from different emprendedor
        if (state.emprendedorId && state.emprendedorId !== item.emprendedorId && state.items.length > 0) {
          return false; // Can't add items from different emprendedor
        }

        const existingIndex = state.items.findIndex(i => i?.productoId === item.productoId);
        
        if (existingIndex >= 0) {
          const newItems = [...state.items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: (newItems[existingIndex]?.quantity ?? 0) + item.quantity,
          };
          set({ items: newItems });
        } else {
          set({
            items: [...state.items, item],
            emprendedorId: item.emprendedorId,
          });
        }
        return true;
      },

      removeItem: (productoId) => {
        set((state) => {
          const newItems = state.items.filter(i => i?.productoId !== productoId);
          return {
            items: newItems,
            emprendedorId: newItems.length > 0 ? state.emprendedorId : null,
          };
        });
      },

      updateQuantity: (productoId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productoId);
          return;
        }
        set((state) => ({
          items: state.items.map(i =>
            i?.productoId === productoId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [], emprendedorId: null }),

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + (item?.price ?? 0) * (item?.quantity ?? 0), 0);
      },
    }),
    {
      name: 'himalaya-cart',
    }
  )
);
