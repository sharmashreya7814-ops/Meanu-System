import React, { createContext, useContext, useEffect, useState } from 'react';
import { Customer, Restaurant, Table } from '../types/index.js';
import { api } from '../services/api.js';

interface RestaurantContextType {
  restaurant: Restaurant | null;
  table: Table | null;
  customer: Customer | null;
  loading: boolean;
  error: string | null;
  loadTableSession: (slug: string, tableId: string) => Promise<void>;
  startCustomerSession: (name: string, mobileNumber: string) => Promise<Customer>;
  logoutCustomer: () => void;
  activeOrderNumber: string | null;
  setActiveOrderNumber: (orderNumber: string | null) => void;
}

const RestaurantContext = createContext<RestaurantContextType | null>(null);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeOrderNumber, setActiveOrderNumber] = useState<string | null>(() => {
    return localStorage.getItem('qr_active_order_number') || null;
  });

  useEffect(() => {
    if (activeOrderNumber) {
      localStorage.setItem('qr_active_order_number', activeOrderNumber);
    } else {
      localStorage.removeItem('qr_active_order_number');
    }
  }, [activeOrderNumber]);

  const loadTableSession = async (slug: string, tableId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTableInfo(slug, tableId);
      setRestaurant(data.restaurant);
      setTable(data.table);

      // Check if existing customer is stored for this table
      const storedCust = localStorage.getItem(`qr_cust_${slug}_${tableId}`);
      if (storedCust) {
        try {
          const parsed = JSON.parse(storedCust);
          setCustomer(parsed);
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load restaurant & table information');
    } finally {
      setLoading(false);
    }
  };

  const startCustomerSession = async (name: string, mobileNumber: string): Promise<Customer> => {
    if (!restaurant || !table) {
      throw new Error('Restaurant or Table is not loaded');
    }

    setLoading(true);
    setError(null);
    try {
      const session = await api.createCustomerSession(restaurant.slug, {
        name,
        mobileNumber,
        tableId: table.id,
      });

      setCustomer(session.customer);
      localStorage.setItem(
        `qr_cust_${restaurant.slug}_${table.id}`,
        JSON.stringify(session.customer),
      );
      return session.customer;
    } catch (err: any) {
      setError(err.message || 'Failed to start session');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logoutCustomer = () => {
    if (restaurant && table) {
      localStorage.removeItem(`qr_cust_${restaurant.slug}_${table.id}`);
    }
    setCustomer(null);
  };

  return (
    <RestaurantContext.Provider
      value={{
        restaurant,
        table,
        customer,
        loading,
        error,
        loadTableSession,
        startCustomerSession,
        logoutCustomer,
        activeOrderNumber,
        setActiveOrderNumber,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
