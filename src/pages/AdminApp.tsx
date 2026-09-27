import React, { useEffect, useState } from 'react';
import { AdminLayout, AdminTab } from '../components/admin/AdminLayout.js';
import { DashboardOverview } from '../components/admin/DashboardOverview.js';
import { OrdersKanban } from '../components/admin/OrdersKanban.js';
import { BillingView } from '../components/admin/BillingView.js';
import { TablesGrid } from '../components/admin/TablesGrid.js';
import { MenuEditor } from '../components/admin/MenuEditor.js';
import { CategoriesEditor } from '../components/admin/CategoriesEditor.js';
import { FinancialAnalyticsView } from '../components/admin/FinancialAnalyticsView.js';
import { ExpensesView } from '../components/admin/ExpensesView.js';
import { BusinessIntelligenceView } from '../components/admin/BusinessIntelligenceView.js';
import { ReportsView } from '../components/admin/ReportsView.js';
import { InventoryView } from '../components/admin/InventoryView.js';
import { StaffManagementView } from '../components/admin/StaffManagementView.js';
import { FutureModulePlaceholder } from '../components/admin/FutureModulePlaceholder.js';
import { Category, CurrentUserResponse, MenuItem, Order, OrderStatus, Restaurant, StaffUser, Table } from '../types/index.js';
import { api } from '../services/api.js';
import { hasAnyPermission } from '../utils/rbac.js';

interface AdminAppProps {
  onOpenCustomerView: (slug: string, tableId: string) => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({ onOpenCustomerView }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant | null>(null);

  const [currentStaff, setCurrentStaff] = useState<CurrentUserResponse | null>(null);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);

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

  // Initialize staff session when active restaurant changes
  useEffect(() => {
    if (!activeRestaurant) return;

    const initStaffSession = async () => {
      try {
        // Authenticate as owner of active restaurant by default
        const email = activeRestaurant.slug.includes('verde')
          ? 'owner@verde.com'
          : 'owner@ember.com';

        const authRes = await api.loginStaff(email, 'Password@123', activeRestaurant.id);
        const meRes = await api.getAdminMe();
        setCurrentStaff(meRes);

        const list = await api.getAdminStaff(activeRestaurant.id);
        setStaffList(list);
      } catch (err) {
        console.error('Error initializing staff session:', err);
      }
    };

    initStaffSession();
  }, [activeRestaurant?.id]);

  // Switch between staff members in UI to test RBAC roles live
  const handleSwitchStaff = async (staffId: string) => {
    if (!activeRestaurant) return;
    try {
      const targetStaff = staffList.find((s) => s.id === staffId);
      if (!targetStaff) return;

      // Log in as target staff
      const authRes = await api.loginStaff(targetStaff.email, 'Password@123', activeRestaurant.id);
      const meRes = await api.getAdminMe();
      setCurrentStaff(meRes);

      // Check if current tab is accessible by new role
      const role = meRes.role;
      const roleAccess: Record<AdminTab, boolean> = {
        dashboard: hasAnyPermission(role, ['ORDER_VIEW', 'FINANCIAL_VIEW', 'STAFF_VIEW', 'KDS_VIEW']),
        orders: hasAnyPermission(role, ['ORDER_VIEW', 'KDS_VIEW']),
        billing: hasAnyPermission(role, ['BILLING_VIEW', 'PAYMENT_VIEW']),
        tables: hasAnyPermission(role, ['TABLE_VIEW', 'TABLE_MANAGE']),
        inventory: hasAnyPermission(role, ['INVENTORY_VIEW', 'RECIPE_VIEW', 'INVENTORY_MANAGE']),
        bi: hasAnyPermission(role, ['FINANCIAL_VIEW']),
        analytics: hasAnyPermission(role, ['FINANCIAL_VIEW']),
        expenses: hasAnyPermission(role, ['EXPENSE_VIEW', 'EXPENSE_MANAGE']),
        reports: hasAnyPermission(role, ['REPORT_VIEW']),
        menu: hasAnyPermission(role, ['MENU_VIEW', 'MENU_MANAGE']),
        categories: hasAnyPermission(role, ['CATEGORY_MANAGE', 'MENU_MANAGE']),
        staff: hasAnyPermission(role, ['STAFF_VIEW', 'STAFF_MANAGE']),
        customers: role === 'OWNER',
        payments: role === 'OWNER',
        settings: role === 'OWNER',
      };

      if (!roleAccess[activeTab]) {
        // Fall back to first accessible tab
        if (role === 'KITCHEN') {
          setActiveTab('orders');
        } else if (role === 'WAITER') {
          setActiveTab('tables');
        } else if (role === 'CASHIER') {
          setActiveTab('billing');
        } else {
          setActiveTab('dashboard');
        }
      }

      refreshData();
    } catch (err: any) {
      alert(`Error switching staff: ${err.message}`);
    }
  };

  // Refresh active restaurant data
  const refreshData = async () => {
    if (!activeRestaurant) return;
    setLoading(true);
    try {
      const [overviewData, ordersData, tablesData, menuData, categoriesData] = await Promise.all([
        api.getAdminOverview(activeRestaurant.id).catch(() => ({ metrics: null, recentOrders: [] })),
        api.getAdminOrders(activeRestaurant.id).catch(() => []),
        api.getAdminTables(activeRestaurant.id).catch(() => []),
        api.getMenuItems(activeRestaurant.slug).catch(() => []),
        api.getCategories(activeRestaurant.slug).catch(() => []),
      ]);

      if (overviewData?.metrics) {
        setOverviewMetrics(overviewData.metrics);
      }
      setOrders(ordersData || []);
      setTables(tablesData || []);
      setMenuItems(menuData || []);
      setCategories(categoriesData || []);

      // Also refresh staff list if user has staff view
      if (currentStaff?.role === 'OWNER' || currentStaff?.role === 'MANAGER') {
        const staffData = await api.getAdminStaff(activeRestaurant.id).catch(() => []);
        setStaffList(staffData);
      }
    } catch (err) {
      console.error('Error refreshing admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [activeRestaurant?.id, currentStaff?.id]);

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
      currentStaff={currentStaff}
      staffList={staffList}
      onSwitchStaff={handleSwitchStaff}
      onLogout={async () => {
        await api.logoutStaff();
        // re-login as owner for demo
        handleSwitchStaff(staffList[0]?.id);
      }}
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

      {activeTab === 'billing' && (
        <BillingView
          restaurant={activeRestaurant}
          onOpenCustomerBill={(slug, billNumber) => {
            window.open(`/restaurant/${slug}/bill/${billNumber}`, '_blank');
          }}
        />
      )}

      {activeTab === 'inventory' && (
        <InventoryView restaurant={activeRestaurant} />
      )}

      {activeTab === 'bi' && (
        <BusinessIntelligenceView restaurant={activeRestaurant} />
      )}

      {activeTab === 'analytics' && (
        <FinancialAnalyticsView restaurant={activeRestaurant} />
      )}

      {activeTab === 'expenses' && (
        <ExpensesView restaurant={activeRestaurant} />
      )}

      {activeTab === 'reports' && (
        <ReportsView restaurant={activeRestaurant} />
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

      {activeTab === 'staff' && (
        <StaffManagementView
          restaurant={activeRestaurant}
          currentUser={currentStaff}
        />
      )}

      {[
        'customers',
        'payments',
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
