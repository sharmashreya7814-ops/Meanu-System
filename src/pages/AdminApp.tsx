import React, { useEffect, useState } from 'react';
import { AdminLayout, AdminTab } from '../components/admin/AdminLayout.js';
import { DashboardOverview } from '../components/admin/DashboardOverview.js';
import { OrdersKanban } from '../components/admin/OrdersKanban.js';
import { TablesGrid } from '../components/admin/TablesGrid.js';
import { MenuEditor } from '../components/admin/MenuEditor.js';
import { CategoriesEditor } from '../components/admin/CategoriesEditor.js';
import { FutureModulePlaceholder } from '../components/admin/FutureModulePlaceholder.js';
import { Category, MenuItem, Order, OrderStatus, Restaurant, Table } from '../types/index.js';
import { api } from '../services/api.js';

interface AdminAppProps {
  onOpenCustomerView: (slug: string, tableId: string) => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({ onOpenCustomerView }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [overviewMetrics, setOverviewMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Load all restaurants
  useEffect(() => {
    api.getAllRestaurants().then((data) => {
      setRestaurants(data);
      if (data.length > 0 && !activeRestaurant) {
        setActiveRestaurant(data[0]);
      }
    });
  }, []);

  // Refresh active restaurant data
  const refreshData = async () => {
    if (!activeRestaurant) return;
    setLoading(true);
    try {
      const [overviewData, ordersData, tablesData, menuData, categoriesData] = await Promise.all([
        api.getAdminOverview(activeRestaurant.id),
        api.getAdminOrders(activeRestaurant.id),
        api.getAdminTables(activeRestaurant.id),
        api.getMenuItems(activeRestaurant.slug),
        api.getCategories(activeRestaurant.slug),
      ]);

      setOverviewMetrics(overviewData.metrics);
      setOrders(ordersData);
      setTables(tablesData);
      setMenuItems(menuData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error refreshing admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [activeRestaurant?.id]);

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, reason?: string) => {
    try {
      await api.updateOrderStatus(orderId, status, reason);
      refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleCreateTable = async (data: { tableNumber: string; tableName: string; capacity: number }) => {
    if (!activeRestaurant) return;
    await api.createAdminTable({
      restaurantId: activeRestaurant.id,
      ...data,
    });
    refreshData();
  };

  const handleCreateMenuItem = async (data: Partial<MenuItem> & { restaurantId: string; categoryId: string }) => {
    await api.createAdminMenuItem(data);
    refreshData();
  };

  const handleToggleAvailability = async (itemId: string, current: boolean) => {
    await api.updateAdminMenuItem(itemId, { isAvailable: !current });
    refreshData();
  };

  const handleUpdatePrice = async (itemId: string, newPrice: number) => {
    await api.updateAdminMenuItem(itemId, { price: newPrice });
    refreshData();
  };

  const handleCreateCategory = async (data: { name: string; description: string; icon: string }) => {
    if (!activeRestaurant) return;
    await api.createAdminCategory({
      restaurantId: activeRestaurant.id,
      ...data,
    });
    refreshData();
  };

  if (!activeRestaurant) {
    return <div className="p-8 text-white">Loading restaurant admin...</div>;
  }

  return (
    <AdminLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      restaurant={activeRestaurant}
      restaurants={restaurants}
      onSelectRestaurant={(r) => setActiveRestaurant(r)}
    >
      {activeTab === 'dashboard' && overviewMetrics && (
        <DashboardOverview
          restaurant={activeRestaurant}
          metrics={overviewMetrics}
          recentOrders={orders.slice(0, 5)}
          onNavigateToOrders={() => setActiveTab('orders')}
          onNavigateToTables={() => setActiveTab('tables')}
          onUpdateOrderStatus={handleUpdateOrderStatus}
        />
      )}

      {activeTab === 'orders' && (
        <OrdersKanban
          orders={orders}
          onUpdateStatus={handleUpdateOrderStatus}
          onRefresh={refreshData}
          loading={loading}
        />
      )}

      {activeTab === 'tables' && (
        <TablesGrid
          restaurant={activeRestaurant}
          tables={tables}
          onCreateTable={handleCreateTable}
          onOpenCustomerView={(tbl) => onOpenCustomerView(activeRestaurant.slug, tbl.id)}
        />
      )}

      {activeTab === 'menu' && (
        <MenuEditor
          restaurant={activeRestaurant}
          menuItems={menuItems}
          categories={categories}
          onCreateMenuItem={handleCreateMenuItem}
          onToggleAvailability={handleToggleAvailability}
          onUpdatePrice={handleUpdatePrice}
        />
      )}

      {activeTab === 'categories' && (
        <CategoriesEditor
          restaurant={activeRestaurant}
          categories={categories}
          onCreateCategory={handleCreateCategory}
        />
      )}

      {[
        'customers',
        'billing',
        'payments',
        'analytics',
        'reports',
        'settings',
      ].includes(activeTab) && (
        <FutureModulePlaceholder
          module={activeTab}
          restaurantName={activeRestaurant.name}
        />
      )}
    </AdminLayout>
  );
};
