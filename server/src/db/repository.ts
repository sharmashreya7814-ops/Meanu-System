import {
  Category,
  CreateCustomerSessionDTO,
  CreateOrderDTO,
  Customer,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  Restaurant,
  Table,
} from '../types/index.js';
import {
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_RESTAURANTS,
  INITIAL_TABLES,
} from './seedData.js';

class InMemoryRepository {
  private restaurants: Map<string, Restaurant> = new Map();
  private tables: Map<string, Table> = new Map();
  private customers: Map<string, Customer> = new Map();
  private categories: Map<string, Category> = new Map();
  private menuItems: Map<string, MenuItem> = new Map();
  private orders: Map<string, Order> = new Map();

  private orderCounter = 1048;

  constructor() {
    this.seed();
  }

  public seed() {
    INITIAL_RESTAURANTS.forEach((r) => this.restaurants.set(r.id, { ...r }));
    INITIAL_TABLES.forEach((t) => this.tables.set(t.id, { ...t }));
    INITIAL_CATEGORIES.forEach((c) => this.categories.set(c.id, { ...c }));
    INITIAL_MENU_ITEMS.forEach((m) => this.menuItems.set(m.id, { ...m }));

    // Create a sample historical order for demonstration in kitchen view
    const initialOrder: Order = {
      id: 'ord-seed-01',
      orderNumber: 'ORD-20260927-1000',
      restaurantId: 'rest-verde-01',
      tableId: 'tbl-verde-12',
      customerId: 'cust-seed-01',
      status: 'PREPARING',
      subtotal: 420.00,
      taxAmount: 21.00,
      discountAmount: 0.0,
      totalAmount: 441.00,
      specialInstructions: 'Please make the dal extra buttery with crisp naan',
      estimatedMinutes: 15,
      acceptedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      preparedAt: undefined,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      items: [
        {
          id: 'oi-seed-1',
          orderId: 'ord-seed-01',
          menuItemId: 'item-v3',
          name: 'Paneer Makhani Royale',
          price: 340.00,
          costPrice: 110.00,
          quantity: 1,
          specialInstructions: 'Medium spicy',
          itemTotal: 340.00,
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
          id: 'oi-seed-2',
          orderId: 'ord-seed-01',
          menuItemId: 'item-v5',
          name: 'Butter Naan (2 Pieces)',
          price: 80.00,
          costPrice: 18.00,
          quantity: 1,
          specialInstructions: 'Crispy and hot',
          itemTotal: 80.00,
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
      ],
    };

    const initialCustomer: Customer = {
      id: 'cust-seed-01',
      restaurantId: 'rest-verde-01',
      name: 'Aarav Sharma',
      mobileNumber: '+91 98765 43210',
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    };

    this.customers.set(initialCustomer.id, initialCustomer);
    this.orders.set(initialOrder.id, initialOrder);
  }

  // Restaurant operations
  public async getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
    for (const r of this.restaurants.values()) {
      if (r.slug === slug && r.isActive) return { ...r };
    }
    return null;
  }

  public async getRestaurantById(id: string): Promise<Restaurant | null> {
    const r = this.restaurants.get(id);
    return r ? { ...r } : null;
  }

  public async getAllRestaurants(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values()).map((r) => ({ ...r }));
  }

  public async updateRestaurantTheme(id: string, themeConfig: any, themePreset: any): Promise<Restaurant | null> {
    const r = this.restaurants.get(id);
    if (!r) return null;
    const updated = {
      ...r,
      themeConfig: { ...r.themeConfig, ...themeConfig },
      themePreset: themePreset || r.themePreset,
      updatedAt: new Date().toISOString(),
    };
    this.restaurants.set(id, updated);
    return updated;
  }

  // Table operations
  public async getTableById(tableId: string): Promise<Table | null> {
    const t = this.tables.get(tableId);
    return t ? { ...t } : null;
  }

  public async getTableByIdOrNumber(restaurantId: string, tableIdOrNumber: string): Promise<Table | null> {
    // 1. Direct ID match
    const direct = this.tables.get(tableIdOrNumber);
    if (direct && direct.restaurantId === restaurantId && direct.isActive) {
      return { ...direct };
    }

    // 2. Table number match (e.g. '12', '1', 'T-01', 'T-12')
    const cleanSearch = tableIdOrNumber.toLowerCase().replace(/^(tbl-|table-|t-)/, '').trim();

    for (const t of this.tables.values()) {
      if (t.restaurantId === restaurantId && t.isActive) {
        if (t.id.toLowerCase() === tableIdOrNumber.toLowerCase()) return { ...t };
        if (t.tableNumber.toLowerCase() === tableIdOrNumber.toLowerCase()) return { ...t };
        const cleanTableNum = t.tableNumber.toLowerCase().replace(/^(tbl-|table-|t-)/, '').trim();
        if (cleanTableNum === cleanSearch) return { ...t };
      }
    }

    // 3. If a valid numeric or alphanumeric table number is scanned, dynamically register table
    const restaurant = await this.getRestaurantById(restaurantId);
    if (restaurant && cleanSearch.length > 0 && cleanSearch.length <= 10) {
      const generatedTable: Table = {
        id: `tbl-${restaurant.slug}-${cleanSearch}`,
        restaurantId,
        tableNumber: cleanSearch.toUpperCase(),
        tableName: `Table ${cleanSearch.toUpperCase()}`,
        capacity: 4,
        qrCodeUrl: `/restaurant/${restaurant.slug}/table/${cleanSearch}`,
        status: 'AVAILABLE',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.tables.set(generatedTable.id, generatedTable);
      return generatedTable;
    }

    return null;
  }

  public async getTablesByRestaurant(restaurantId: string): Promise<Table[]> {
    return Array.from(this.tables.values())
      .filter((t) => t.restaurantId === restaurantId && t.isActive)
      .map((t) => ({ ...t }));
  }

  public async createTable(data: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>): Promise<Table> {
    const id = `tbl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const table: Table = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tables.set(id, table);
    return table;
  }

  public async updateTableStatus(tableId: string, status: Table['status']): Promise<Table | null> {
    const table = this.tables.get(tableId);
    if (!table) return null;
    const updated = { ...table, status, updatedAt: new Date().toISOString() };
    this.tables.set(tableId, updated);
    return updated;
  }

  // Customer / Session operations
  public async createOrUpdateCustomer(data: CreateCustomerSessionDTO & { restaurantId: string }): Promise<Customer> {
    const cleanMobile = data.mobileNumber.trim();
    const cleanName = data.name.trim();

    // Check if customer already exists for this restaurant
    for (const c of this.customers.values()) {
      if (c.restaurantId === data.restaurantId && c.mobileNumber.replace(/\D/g, '') === cleanMobile.replace(/\D/g, '')) {
        const updated = {
          ...c,
          name: cleanName || c.name,
          lastActiveAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.customers.set(c.id, updated);
        return updated;
      }
    }

    const id = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const customer: Customer = {
      id,
      restaurantId: data.restaurantId,
      name: cleanName,
      mobileNumber: cleanMobile,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.customers.set(id, customer);
    return customer;
  }

  public async getCustomerById(id: string): Promise<Customer | null> {
    const c = this.customers.get(id);
    return c ? { ...c } : null;
  }

  // Category operations
  public async getCategoriesByRestaurant(restaurantId: string): Promise<Category[]> {
    return Array.from(this.categories.values())
      .filter((c) => c.restaurantId === restaurantId && c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({ ...c }));
  }

  public async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    const id = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const category: Category = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.categories.set(id, category);
    return category;
  }

  public async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const c = this.categories.get(id);
    if (!c) return null;
    const updated = { ...c, ...updates, updatedAt: new Date().toISOString() };
    this.categories.set(id, updated);
    return updated;
  }

  // Menu operations
  public async getMenuItemsByRestaurant(restaurantId: string): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values())
      .filter((m) => m.restaurantId === restaurantId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => ({ ...m }));
  }

  public async getMenuItemById(id: string): Promise<MenuItem | null> {
    const m = this.menuItems.get(id);
    return m ? { ...m } : null;
  }

  public async createMenuItem(data: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MenuItem> {
    const id = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const item: MenuItem = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.menuItems.set(id, item);
    return item;
  }

  public async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
    const m = this.menuItems.get(id);
    if (!m) return null;
    const updated = { ...m, ...updates, updatedAt: new Date().toISOString() };
    this.menuItems.set(id, updated);
    return updated;
  }

  // Order operations (Security: strictly calculates official prices on backend)
  public async createOrder(
    restaurantId: string,
    dto: CreateOrderDTO,
  ): Promise<Order> {
    const restaurant = await this.getRestaurantById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const table = await this.getTableById(dto.tableId);
    if (!table || table.restaurantId !== restaurantId) {
      throw new Error('Invalid table for this restaurant');
    }

    const customer = await this.getCustomerById(dto.customerId);
    if (!customer || customer.restaurantId !== restaurantId) {
      throw new Error('Invalid customer session. Please enter your name and phone number to start.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderNumber = `ORD-${todayStr}-${this.orderCounter++}`;

    let subtotal = 0;
    const orderItems: OrderItem[] = [];
    let maxPrepTime = 15;

    for (const itemRequest of dto.items) {
      const menuItem = await this.getMenuItemById(itemRequest.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item with ID ${itemRequest.menuItemId} was not found.`);
      }
      if (!menuItem.isAvailable) {
        throw new Error(`Sorry, "${menuItem.name}" is currently unavailable. Please remove it from your cart.`);
      }
      if (menuItem.restaurantId !== restaurantId) {
        throw new Error(`Menu item "${menuItem.name}" does not belong to this restaurant.`);
      }
      if (itemRequest.quantity < 1) {
        throw new Error(`Invalid quantity for item "${menuItem.name}".`);
      }

      // CRITICAL SECURITY REQUIREMENT: Never trust client-submitted prices.
      // We retrieve the authentic unit price and cost price directly from database.
      const unitPrice = menuItem.price;
      const costPrice = menuItem.costPrice;
      const itemTotal = Number((unitPrice * itemRequest.quantity).toFixed(2));
      subtotal += itemTotal;

      if (menuItem.preparationTimeMin > maxPrepTime) {
        maxPrepTime = menuItem.preparationTimeMin;
      }

      const orderItem: OrderItem = {
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderId,
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: unitPrice,
        costPrice,
        quantity: itemRequest.quantity,
        specialInstructions: itemRequest.specialInstructions?.trim() || '',
        itemTotal,
        createdAt: new Date().toISOString(),
      };
      orderItems.push(orderItem);
    }

    subtotal = Number(subtotal.toFixed(2));
    const taxAmount = Number((subtotal * restaurant.taxRate).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

    const order: Order = {
      id: orderId,
      orderNumber,
      restaurantId,
      tableId: dto.tableId,
      customerId: dto.customerId,
      status: 'NEW',
      subtotal,
      taxAmount,
      discountAmount: 0.0,
      totalAmount,
      specialInstructions: dto.specialInstructions?.trim() || '',
      estimatedMinutes: maxPrepTime + 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: orderItems,
      customer,
      table,
    };

    this.orders.set(orderId, order);

    // Update table status to occupied
    await this.updateTableStatus(table.id, 'OCCUPIED');

    return order;
  }

  public async getOrderByNumber(restaurantId: string, orderNumber: string): Promise<Order | null> {
    for (const order of this.orders.values()) {
      if (order.restaurantId === restaurantId && (order.orderNumber === orderNumber || order.id === orderNumber)) {
        const enriched = { ...order };
        enriched.customer = await this.getCustomerById(order.customerId) || undefined;
        enriched.table = await this.getTableById(order.tableId) || undefined;
        return enriched;
      }
    }
    return null;
  }

  public async getOrderById(orderId: string): Promise<Order | null> {
    const order = this.orders.get(orderId);
    if (!order) return null;
    const enriched = { ...order };
    enriched.customer = await this.getCustomerById(order.customerId) || undefined;
    enriched.table = await this.getTableById(order.tableId) || undefined;
    return enriched;
  }

  public async getOrdersByRestaurant(
    restaurantId: string,
    filter?: { status?: OrderStatus; tableId?: string },
  ): Promise<Order[]> {
    let result: Order[] = [];
    for (const order of this.orders.values()) {
      if (order.restaurantId === restaurantId) {
        if (filter?.status && order.status !== filter.status) continue;
        if (filter?.tableId && order.tableId !== filter.tableId) continue;
        const enriched = { ...order };
        enriched.customer = (await this.getCustomerById(order.customerId)) || undefined;
        enriched.table = (await this.getTableById(order.tableId)) || undefined;
        result.push(enriched);
      }
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    reason?: string,
  ): Promise<Order | null> {
    const order = this.orders.get(orderId);
    if (!order) return null;

    const now = new Date().toISOString();
    const updated: Order = {
      ...order,
      status: newStatus,
      updatedAt: now,
    };

    if (newStatus === 'ACCEPTED') updated.acceptedAt = now;
    if (newStatus === 'PREPARING' && !updated.acceptedAt) updated.acceptedAt = now;
    if (newStatus === 'READY') updated.preparedAt = now;
    if (newStatus === 'SERVED') updated.servedAt = now;
    if (newStatus === 'COMPLETED') {
      updated.completedAt = now;
      await this.updateTableStatus(order.tableId, 'AVAILABLE');
    }
    if (newStatus === 'CANCELLED') {
      updated.cancelledAt = now;
      updated.cancellationReason = reason || 'Cancelled by staff';
    }

    this.orders.set(orderId, updated);
    return this.getOrderById(orderId);
  }
}

export const repository = new InMemoryRepository();
