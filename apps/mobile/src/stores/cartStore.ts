import { create } from 'zustand';
import type { Event, Tier } from '@piaoyuzhou/shared';

export interface CartItem {
  event: Event;
  tier: Tier;
  quantity: number;
  seatNumbers?: string[]; // 手动选座时的座位号
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (eventId: number, tierId: number) => void;
  updateQuantity: (eventId: number, tierId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  getItemByEventAndTier: (eventId: number, tierId: number) => CartItem | undefined;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) => {
    set((state) => {
      // 检查是否已存在相同的活动和票档
      const existingIndex = state.items.findIndex(
        (i) => i.event.id === item.event.id && i.tier.id === item.tier.id
      );

      if (existingIndex !== -1) {
        // 如果已存在，更新数量
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + item.quantity,
          seatNumbers: item.seatNumbers || newItems[existingIndex].seatNumbers,
        };
        return { items: newItems };
      } else {
        // 如果不存在，添加新项
        return { items: [...state.items, item] };
      }
    });
  },

  removeItem: (eventId, tierId) => {
    set((state) => ({
      items: state.items.filter(
        (item) => !(item.event.id === eventId && item.tier.id === tierId)
      ),
    }));
  },

  updateQuantity: (eventId, tierId, quantity) => {
    set((state) => {
      const newItems = state.items.map((item) =>
        item.event.id === eventId && item.tier.id === tierId
          ? { ...item, quantity }
          : item
      );
      return { items: newItems };
    });
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotalPrice: () => {
    return get().items.reduce(
      (total, item) => total + item.tier.price * item.quantity,
      0
    );
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getItemByEventAndTier: (eventId, tierId) => {
    return get().items.find(
      (item) => item.event.id === eventId && item.tier.id === tierId
    );
  },
}));
