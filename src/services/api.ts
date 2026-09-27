import {
  ApiResponse,
  Bill,
  BusinessReportResponse,
  Category,
  CreateExpenseDTO,
  CreateIngredientDTO,
  CreatePurchaseDTO,
  CreateRecipeDTO,
  CreateStaffDTO,
  CreateStockAdjustmentDTO,
  CreateStockCountDTO,
  CreateSupplierDTO,
  CreateWastageDTO,
  CurrentUserResponse,
  Customer,
  Expense,
  ExpenseCategory,
  FinancialAnalyticsResponse,
  Ingredient,
  IngredientCategory,
  IngredientUnit,
  InventoryDashboardResponse,
  MenuItem,
  Order,
  OrderStatus,
  Payment,
  PaymentOrderResponse,
  Purchase,
  Recipe,
  Restaurant,
  StaffAuthResponse,
  StaffRole,
  StaffUser,
  StockMovement,
  StockMovementType,
  StockStatus,
  Supplier,
  Table,
  ThemeConfig,
  ThemePreset,
  UpdateExpenseDTO,
  UpdateIngredientDTO,
  UpdateRecipeDTO,
  UpdateStaffDTO,
  UpdateStaffPasswordDTO,
  UpdateSupplierDTO,
  WastageReason,
  WastageRecord,
} from '../types/index.js';

const API_BASE = '/api';

let currentAuthToken: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem('qr_staff_token') : null;

export function setStaffToken(token: string | null) {
  currentAuthToken = token;
  if (typeof localStorage !== 'undefined') {
    if (token) {
      localStorage.setItem('qr_staff_token', token);
    } else {
      localStorage.removeItem('qr_staff_token');
    }
  }
}

export function getStaffToken(): string | null {
  return currentAuthToken;
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
    headers['x-staff-token'] = currentAuthToken;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || json.message || `Request failed with status ${res.status}`);
  }
  return json.data as T;
}

export const api = {
  // === AUTHENTICATION & STAFF CONTEXT (MODULE 9A) ===
  setAuthToken(token: string | null) {
    setStaffToken(token);
  },

  getAuthToken(): string | null {
    return getStaffToken();
  },

  async loginStaff(identifier: string, password: string, restaurantId?: string): Promise<StaffAuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, restaurantId }),
    });
    const data = await handleResponse<StaffAuthResponse>(res);
    if (data.token) {
      setStaffToken(data.token);
    }
    return data;
  },

  async getAdminMe(): Promise<CurrentUserResponse> {
    const res = await fetch(`${API_BASE}/admin/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<CurrentUserResponse>(res);
  },

  async logoutStaff(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      });
    } finally {
      setStaffToken(null);
    }
  },

  // === STAFF MANAGEMENT (MODULE 9A) ===
  async getAdminStaff(
    restaurantId: string,
    options?: { role?: StaffRole; search?: string; isActive?: boolean },
  ): Promise<StaffUser[]> {
    const params = new URLSearchParams({ restaurantId });
    if (options?.role) params.append('role', options.role);
    if (options?.search) params.append('search', options.search);
    if (options?.isActive !== undefined) params.append('isActive', String(options.isActive));

    const res = await fetch(`${API_BASE}/admin/staff?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<StaffUser[]>(res);
  },

  async getAdminStaffById(id: string, restaurantId?: string): Promise<StaffUser> {
    const params = restaurantId ? `?restaurantId=${encodeURIComponent(restaurantId)}` : '';
    const res = await fetch(`${API_BASE}/admin/staff/${encodeURIComponent(id)}${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<StaffUser>(res);
  },

  async createAdminStaff(data: CreateStaffDTO): Promise<StaffUser> {
    const res = await fetch(`${API_BASE}/admin/staff`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse<StaffUser>(res);
  },

  async updateAdminStaff(id: string, data: UpdateStaffDTO, restaurantId?: string): Promise<StaffUser> {
    const res = await fetch(`${API_BASE}/admin/staff/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ ...data, restaurantId }),
    });
    return handleResponse<StaffUser>(res);
  },

  async updateAdminStaffPassword(id: string, data: UpdateStaffPasswordDTO): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/admin/staff/${encodeURIComponent(id)}/password`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse<{ success: boolean }>(res);
  },

  async deactivateAdminStaff(id: string, restaurantId: string): Promise<StaffUser> {
    const res = await fetch(`${API_BASE}/admin/staff/${encodeURIComponent(id)}/deactivate`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ restaurantId }),
    });
    return handleResponse<StaffUser>(res);
  },
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

  async getRestaurantTables(slug: string): Promise<Table[]> {
    const res = await fetch(`${API_BASE}/restaurants/${encodeURIComponent(slug)}/tables`);
    return handleResponse<Table[]>(res);
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

  // === DIGITAL BILLING ===
  async generateBill(slug: string, orderNumber: string): Promise<Bill> {
    const res = await fetch(
      `${API_BASE}/restaurants/${encodeURIComponent(slug)}/orders/${encodeURIComponent(orderNumber)}/bill`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return handleResponse<Bill>(res);
  },

  async getBill(slug: string, billNumber: string): Promise<Bill> {
    const res = await fetch(
      `${API_BASE}/restaurants/${encodeURIComponent(slug)}/bills/${encodeURIComponent(billNumber)}`,
    );
    return handleResponse<Bill>(res);
  },

  // === ONLINE PAYMENTS ===
  async createPaymentOrder(slug: string, billNumber: string): Promise<PaymentOrderResponse> {
    const res = await fetch(
      `${API_BASE}/restaurants/${encodeURIComponent(slug)}/bills/${encodeURIComponent(billNumber)}/payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
    );
    return handleResponse<PaymentOrderResponse>(res);
  },

  async verifyPayment(
    slug: string,
    billNumber: string,
    data: { paymentOrderId: string; paymentId: string; signature: string },
  ): Promise<{ success: boolean; bill: Bill; payment: Payment }> {
    const res = await fetch(
      `${API_BASE}/restaurants/${encodeURIComponent(slug)}/bills/${encodeURIComponent(billNumber)}/payment/verify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
    );
    return handleResponse<{ success: boolean; bill: Bill; payment: Payment }>(res);
  },

  async recordUpiPayment(
    slug: string,
    billNumber: string,
    data: { utrNumber?: string; customerNotes?: string },
  ): Promise<{ success: boolean; data: { payment: Payment; bill: Bill }; message: string }> {
    const res = await fetch(
      `${API_BASE}/restaurants/${encodeURIComponent(slug)}/bills/${encodeURIComponent(billNumber)}/upi-payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
    );
    return handleResponse(res);
  },

  async settleBillAdmin(
    billNumber: string,
    data: {
      restaurantId: string;
      method?: 'UPI_QR' | 'CASH' | 'CARD' | 'ONLINE';
      referenceId?: string;
      notes?: string;
    },
  ): Promise<{ success: boolean; data: { bill: Bill; payment: Payment }; message: string }> {
    const res = await fetch(
      `${API_BASE}/admin/bills/${encodeURIComponent(billNumber)}/settle`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
    );
    return handleResponse(res);
  },

  async verifyPaymentAdmin(
    paymentId: string,
    referenceId?: string,
  ): Promise<{ success: boolean; data: { bill: Bill; payment: Payment }; message: string }> {
    const res = await fetch(
      `${API_BASE}/admin/payments/${encodeURIComponent(paymentId)}/verify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceId }),
      },
    );
    return handleResponse(res);
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

  async getAdminBills(restaurantId: string, status?: string): Promise<Bill[]> {
    const params = new URLSearchParams({ restaurantId });
    if (status && status !== 'ALL') params.append('status', status);
    const res = await fetch(`${API_BASE}/admin/bills?${params.toString()}`);
    return handleResponse<Bill[]>(res);
  },

  async getAdminPayments(restaurantId: string, status?: string): Promise<Payment[]> {
    const params = new URLSearchParams({ restaurantId });
    if (status && status !== 'ALL') params.append('status', status);
    const res = await fetch(`${API_BASE}/admin/payments?${params.toString()}`);
    return handleResponse<Payment[]>(res);
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

  // === FINANCIAL ANALYTICS & P&L ===
  async getFinancialAnalytics(
    restaurantId: string,
    startDate?: string,
    endDate?: string,
    timezone: string = 'Asia/Kolkata',
  ): Promise<FinancialAnalyticsResponse> {
    const params = new URLSearchParams({ restaurantId, timezone });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await fetch(`${API_BASE}/admin/analytics/financial?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<FinancialAnalyticsResponse>(res);
  },

  // === OPERATING EXPENSES ===
  async getAdminExpenses(
    restaurantId: string,
    startDate?: string,
    endDate?: string,
    category?: ExpenseCategory,
  ): Promise<Expense[]> {
    const params = new URLSearchParams({ restaurantId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (category) params.append('category', category);

    const res = await fetch(`${API_BASE}/admin/expenses?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Expense[]>(res);
  },

  async createAdminExpense(data: CreateExpenseDTO): Promise<Expense> {
    const res = await fetch(`${API_BASE}/admin/expenses`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse<Expense>(res);
  },

  async updateAdminExpense(id: string, restaurantId: string, data: UpdateExpenseDTO): Promise<Expense> {
    const res = await fetch(`${API_BASE}/admin/expenses/${encodeURIComponent(id)}?restaurantId=${encodeURIComponent(restaurantId)}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse<Expense>(res);
  },

  async deleteAdminExpense(id: string, restaurantId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/expenses/${encodeURIComponent(id)}?restaurantId=${encodeURIComponent(restaurantId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(res);
  },

  // === BUSINESS INTELLIGENCE & OWNER REPORTS ===
  async getBusinessReport(
    restaurantId: string,
    startDate?: string,
    endDate?: string,
    timezone: string = 'Asia/Kolkata',
    preset: string = 'thisMonth',
  ): Promise<BusinessReportResponse> {
    const params = new URLSearchParams({ restaurantId, timezone, preset });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await fetch(`${API_BASE}/admin/reports/business?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<BusinessReportResponse>(res);
  },

  // === INVENTORY & STOCK MANAGEMENT (MODULE 8) ===
  async getInventoryDashboard(restaurantId: string): Promise<InventoryDashboardResponse> {
    const res = await fetch(`${API_BASE}/admin/inventory/dashboard?restaurantId=${encodeURIComponent(restaurantId)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<InventoryDashboardResponse>(res);
  },

  async getAdminIngredients(
    restaurantId: string,
    category?: string,
    status?: string,
    search?: string,
  ): Promise<Ingredient[]> {
    const params = new URLSearchParams({ restaurantId });
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/admin/inventory/ingredients?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Ingredient[]>(res);
  },

  async createAdminIngredient(data: CreateIngredientDTO): Promise<Ingredient> {
    const res = await fetch(`${API_BASE}/admin/inventory/ingredients`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse<Ingredient>(res);
  },

  async updateAdminIngredient(id: string, restaurantId: string, data: UpdateIngredientDTO): Promise<Ingredient> {
    const res = await fetch(`${API_BASE}/admin/inventory/ingredients/${encodeURIComponent(id)}?restaurantId=${encodeURIComponent(restaurantId)}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ ...data, restaurantId }),
    });
    return handleResponse<Ingredient>(res);
  },

  async deleteAdminIngredient(id: string, restaurantId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/inventory/ingredients/${encodeURIComponent(id)}?restaurantId=${encodeURIComponent(restaurantId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(res);
  },

  async getAdminRecipes(restaurantId: string, menuItemId?: string): Promise<Recipe[]> {
    const params = new URLSearchParams({ restaurantId });
    if (menuItemId) params.append('menuItemId', menuItemId);

    const res = await fetch(`${API_BASE}/admin/inventory/recipes?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Recipe[]>(res);
  },

  async getAdminRecipeById(id: string, restaurantId: string): Promise<Recipe> {
    const res = await fetch(`${API_BASE}/admin/inventory/recipes/${encodeURIComponent(id)}?restaurantId=${encodeURIComponent(restaurantId)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Recipe>(res);
  },

  async createAdminRecipe(data: CreateRecipeDTO): Promise<Recipe> {
    const res = await fetch(`${API_BASE}/admin/inventory/recipes`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse<Recipe>(res);
  },

  async updateAdminRecipe(id: string, restaurantId: string, data: UpdateRecipeDTO): Promise<Recipe> {
    const res = await fetch(`${API_BASE}/admin/inventory/recipes/${encodeURIComponent(id)}?restaurantId=${encodeURIComponent(restaurantId)}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ ...data, restaurantId }),
    });
    return handleResponse<Recipe>(res);
  },

  async deleteAdminRecipe(id: string, restaurantId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/inventory/recipes/${encodeURIComponent(id)}?restaurantId=${encodeURIComponent(restaurantId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(res);
  },

  async syncAdminRecipeCost(id: string, restaurantId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/inventory/recipes/${encodeURIComponent(id)}/sync-cost`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ restaurantId }),
    });
    return handleResponse<any>(res);
  },

  async getAdminSuppliers(restaurantId: string): Promise<Supplier[]> {
    const res = await fetch(`${API_BASE}/admin/inventory/suppliers?restaurantId=${encodeURIComponent(restaurantId)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Supplier[]>(res);
  },

  async createAdminSupplier(data: CreateSupplierDTO): Promise<Supplier> {
    const res = await fetch(`${API_BASE}/admin/inventory/suppliers`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse<Supplier>(res);
  },

  async updateAdminSupplier(id: string, restaurantId: string, data: UpdateSupplierDTO): Promise<Supplier> {
    const res = await fetch(`${API_BASE}/admin/inventory/suppliers/${encodeURIComponent(id)}?restaurantId=${encodeURIComponent(restaurantId)}`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ ...data, restaurantId }),
    });
    return handleResponse<Supplier>(res);
  },

  async deleteAdminSupplier(id: string, restaurantId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/inventory/suppliers/${encodeURIComponent(id)}?restaurantId=${encodeURIComponent(restaurantId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(res);
  },

  async getAdminPurchases(
    restaurantId: string,
    startDate?: string,
    endDate?: string,
    supplierId?: string,
  ): Promise<Purchase[]> {
    const params = new URLSearchParams({ restaurantId });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (supplierId) params.append('supplierId', supplierId);

    const res = await fetch(`${API_BASE}/admin/inventory/purchases?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Purchase[]>(res);
  },

  async createAdminPurchase(data: CreatePurchaseDTO): Promise<Purchase> {
    const res = await fetch(`${API_BASE}/admin/inventory/purchases`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse<Purchase>(res);
  },

  async getAdminStockMovements(
    restaurantId: string,
    ingredientId?: string,
    type?: StockMovementType | 'ALL',
    startDate?: string,
    endDate?: string,
  ): Promise<StockMovement[]> {
    const params = new URLSearchParams({ restaurantId });
    if (ingredientId) params.append('ingredientId', ingredientId);
    if (type && type !== 'ALL') params.append('type', type);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await fetch(`${API_BASE}/admin/inventory/movements?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<StockMovement[]>(res);
  },

  async createAdminStockAdjustment(data: CreateStockAdjustmentDTO): Promise<StockMovement> {
    const res = await fetch(`${API_BASE}/admin/inventory/adjustments`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse<StockMovement>(res);
  },

  async reconcileAdminStockCount(data: CreateStockCountDTO): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/inventory/reconcile`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async getAdminWastage(
    restaurantId: string,
    reason?: WastageReason | 'ALL',
    startDate?: string,
    endDate?: string,
  ): Promise<WastageRecord[]> {
    const params = new URLSearchParams({ restaurantId });
    if (reason && reason !== 'ALL') params.append('reason', reason);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await fetch(`${API_BASE}/admin/inventory/wastage?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<WastageRecord[]>(res);
  },

  async createAdminWastage(data: CreateWastageDTO): Promise<WastageRecord> {
    const res = await fetch(`${API_BASE}/admin/inventory/wastage`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleResponse<WastageRecord>(res);
  },
};

