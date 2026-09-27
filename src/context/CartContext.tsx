import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CartItem, MenuItem } from '../types/index.js';

interface CartContextType {
  items: CartItem[];
  addItem: (menuItem: MenuItem, quantity?: number, specialInstructions?: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, delta: number) => void;
  setItemInstructions: (menuItemId: string, instructions: string) => void;
  orderInstructions: string;
  setOrderInstructions: (instructions: string) => void;
  clearCart: () => void;
  totalItemCount: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  selectedFoodDetail: MenuItem | null;
  setSelectedFoodDetail: (item: MenuItem | null) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{
  taxRate?: number;
  restaurantSlug?: string;
  children: React.ReactNode;
}> = ({ taxRate = 0.08, restaurantSlug = 'default', children }) => {
  const storageKey = `qr_cart_${restaurantSlug}`;

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orderInstructions, setOrderInstructions] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedFoodDetail, setSelectedFoodDetail] = useState<MenuItem | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items, storageKey]);

  const addItem = (menuItem: MenuItem, quantity = 1, specialInstructions = '') => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.menuItem.id === menuItem.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        if (specialInstructions) {
          updated[existingIndex].specialInstructions = specialInstructions;
        }
        return updated;
      }
      return [...prev, { menuItem, quantity, specialInstructions }];
    });
  };

  const removeItem = (menuItemId: string) => {
    setItems((prev) => prev.filter((i) => i.menuItem.id !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.menuItem.id === menuItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const setItemInstructions = (menuItemId: string, instructions: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.menuItem.id === menuItemId
          ? { ...item, specialInstructions: instructions }
          : item,
      ),
    );
  };

  const clearCart = () => {
    setItems([]);
    setOrderInstructions('');
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  const totalItemCount = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      Number(
        items
          .reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0)
          .toFixed(2),
      ),
    [items],
  );

  const taxAmount = useMemo(
    () => Number((subtotal * taxRate).toFixed(2)),
    [subtotal, taxRate],
  );

  const totalAmount = useMemo(
    () => Number((subtotal + taxAmount).toFixed(2)),
    [subtotal, taxAmount],
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      setItemInstructions,
      orderInstructions,
      setOrderInstructions,
      clearCart,
      totalItemCount,
      subtotal,
      taxAmount,
      totalAmount,
      isCartOpen,
      setIsCartOpen,
      selectedFoodDetail,
      setSelectedFoodDetail,
    }),
    [
      items,
      orderInstructions,
      isCartOpen,
      selectedFoodDetail,
      totalItemCount,
      subtotal,
      taxAmount,
      totalAmount,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
