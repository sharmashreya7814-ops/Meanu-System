import {
  ApiResponse,
  Category,
  Customer,
  MenuItem,
  Order,
  OrderStatus,
  Restaurant,
  Table,
  ThemeConfig,
  ThemePreset,
} from '../types/index.js';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || `Request failed with status ${res.status}`);
  }
  return json.data as T;
}

export const api = {
  // === PUBLIC / CUSTOMER ===
  async getAllRestaurants(): Promise<Restaurant[]> {
    const res = await fetch(`${API_BASE}/restaurants`);
    return handleResponse<Restaurant[]>(res);
  },

  async getRestaurantBySlug(slug: string): Promise<Restaurant> {
    const res = await fetch(`${API_BASE}/restaurants/${encodeURIComponent(slug)}`);
    return handleResponse<Restaurant>(res);
  },

  async getTableInfo(slug: string, tableId: string): Promise<{ restaurant: Restaurant; table: Table }> {
    const res = await fetch(`${API_BASE}/restaurants/${encodeURIComponent(slug)}/tables/${encodeURIComponent(tableId)}`);
    return handleResponse<{ restaurant: Restaurant; table: Table }>(res);
  },

  async createCustomerSession(
    slug: string,
    data: { name: string; mobileNumber: string; tableId: string },
  ): Promise<{ customer: Customer; table: Table; restaurant: Restaurant }> {
    const res = await fetch(`${API_BASE}/restaurants/${encodeURIComponent(slug)}/customers/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{ customer: Customer; table: Table; restaurant: Restaurant }>(res);
  },

  async getCategories(slug: string): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/restaurants/${encodeURIComponent(slug)}/categories`);
    return handleResponse<Category[]>(res);
  },

  async getMenuItems(slug: string): Promise<MenuItem[]> {
    const res = await fetch(`${API_BASE}/restaurants/${encodeURIComponent(slug)}/menu`);
    return handleResponse<MenuItem[]>(res);
  },

  async getMenuItemDetails(slug: string, itemId: string): Promise<MenuItem> {
    const res = await fetch(`${API_BASE}/restaurants/${encodeURIComponent(slug)}/menu/${encodeURIComponent(itemId)}`);
    return handleResponse<MenuItem>(res);
  },

  async createOrder(
    slug: string,
    data: {
      tableId: string;
      customerId: string;
      specialInstructions?: string;
      items: Array<{
        menuItemId: string;
        quantity: number;
        specialInstructions?: string;
      }>;
    },
  ): Promise<Order> {
    const res = await fetch(`${API_BASE}/restaurants/${encodeURIComponent(slug)}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Order>(res);
  },

  async getOrderByNumber(slug: string, orderNumber: string): Promise<Order> {
    const res = await fetch(
      `${API_BASE}/restaurants/${encodeURIComponent(slug)}/orders/${encodeURIComponent(orderNumber)}`,
    );
    return handleResponse<Order>(res);
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, reason?: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason }),
    });
    return handleResponse<Order>(res);
  },

  // === ADMIN & KITCHEN ===
  async getAdminOverview(restaurantId: string): Promise<{
    restaurant: Restaurant;
    metrics: {
      totalOrders: number;
      activeOrdersCount: number;
      pendingKitchenCount: number;
      totalTables: number;
      occupiedTablesCount: number;
      totalRevenue: number;
      totalMenuItems: number;
      totalCategories: number;
    };
    recentOrders: Order[];
  }> {
    const res = await fetch(`${API_BASE}/admin/overview?restaurantId=${encodeURIComponent(restaurantId)}`);
    return handleResponse(res);
  },

  async getAdminOrders(restaurantId: string, status?: OrderStatus): Promise<Order[]> {
    const params = new URLSearchParams({ restaurantId });
    if (status) params.append('status', status);
    const res = await fetch(`${API_BASE}/admin/orders?${params.toString()}`);
    return handleResponse<Order[]>(res);
  },

  async getAdminTables(restaurantId: string): Promise<Table[]> {
    const res = await fetch(`${API_BASE}/admin/tables?restaurantId=${encodeURIComponent(restaurantId)}`);
    return handleResponse<Table[]>(res);
  },

  async createAdminTable(data: {
    restaurantId: string;
    tableNumber: string;
    tableName?: string;
    capacity: number;
  }): Promise<Table> {
    const res = await fetch(`${API_BASE}/admin/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Table>(res);
  },

  async createAdminMenuItem(data: Partial<MenuItem> & { restaurantId: string; categoryId: string }): Promise<MenuItem> {
    const res = await fetch(`${API_BASE}/admin/menu-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<MenuItem>(res);
  },

  async updateAdminMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    const res = await fetch(`${API_BASE}/admin/menu-items/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse<MenuItem>(res);
  },

  async createAdminCategory(data: {
    restaurantId: string;
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
  }): Promise<Category> {
    const res = await fetch(`${API_BASE}/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Category>(res);
  },

  async updateAdminTheme(data: {
    restaurantId: string;
    themePreset: ThemePreset;
    themeConfig?: Partial<ThemeConfig>;
  }): Promise<Restaurant> {
    const res = await fetch(`${API_BASE}/admin/theme`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Restaurant>(res);
  },
};
