import {
  Bill,
  BillPaymentStatus,
  BusinessReportResponse,
  Category,
  CategoryPerformanceItem,
  CreateCustomerSessionDTO,
  CreateExpenseDTO,
  CreateIngredientDTO,
  CreateOrderDTO,
  CreatePurchaseDTO,
  CreateRecipeDTO,
  CreateStockAdjustmentDTO,
  CreateStockCountDTO,
  CreateSupplierDTO,
  CreateWastageDTO,
  Customer,
  CustomerAnalytics,
  Expense,
  ExpenseCategory,
  ExpenseCategoryBreakdown,
  FinancialAnalyticsResponse,
  Ingredient,
  IngredientCategory,
  IngredientUnit,
  InventoryDashboardResponse,
  MenuItem,
  MetricComparison,
  Order,
  OrderItem,
  OrderOperationalAnalytics,
  OrderStatus,
  Payment,
  PaymentMethodBreakdownItem,
  PaymentStatus,
  ProductPerformanceItem,
  Purchase,
  PurchaseItem,
  Recipe,
  RecipeIngredient,
  Restaurant,
  SalesGrowthTrendItem,
  SalesTrendItem,
  StockMovement,
  StockMovementType,
  StockStatus,
  Supplier,
  Table,
  UpdateExpenseDTO,
  UpdateIngredientDTO,
  UpdateRecipeDTO,
  UpdateSupplierDTO,
  WastageReason,
  WastageRecord,
  StaffRole,
  StaffUser,
  StaffUserEntity,
  CreateStaffDTO,
  UpdateStaffDTO,
} from '../types/index.js';
import {
  INITIAL_CATEGORIES,
  INITIAL_EXPENSES,
  INITIAL_INGREDIENTS,
  INITIAL_MENU_ITEMS,
  INITIAL_PURCHASES,
  INITIAL_RECIPES,
  INITIAL_RESTAURANTS,
  INITIAL_STAFF_USERS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_SUPPLIERS,
  INITIAL_TABLES,
  INITIAL_WASTAGE_RECORDS,
} from './seedData.js';
import { generateSalt, hashPassword } from '../utils/crypto.js';

class InMemoryRepository {
  private restaurants: Map<string, Restaurant> = new Map();
  private tables: Map<string, Table> = new Map();
  private customers: Map<string, Customer> = new Map();
  private categories: Map<string, Category> = new Map();
  private menuItems: Map<string, MenuItem> = new Map();
  private orders: Map<string, Order> = new Map();
  private bills: Map<string, Bill> = new Map();
  private payments: Map<string, Payment> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private ingredients: Map<string, Ingredient> = new Map();
  private recipes: Map<string, Recipe> = new Map();
  private suppliers: Map<string, Supplier> = new Map();
  private purchases: Map<string, Purchase> = new Map();
  private stockMovements: Map<string, StockMovement> = new Map();
  private wastageRecords: Map<string, WastageRecord> = new Map();
  private staffUsers: Map<string, StaffUserEntity> = new Map();

  private orderCounter = 1048;
  private billCounter = 1048;
  private purchaseCounter = 109;
  private staffCounter = 100;

  constructor() {
    this.seed();
  }

  public seed() {
    INITIAL_RESTAURANTS.forEach((r) => this.restaurants.set(r.id, { ...r }));
    INITIAL_TABLES.forEach((t) => this.tables.set(t.id, { ...t }));
    INITIAL_CATEGORIES.forEach((c) => this.categories.set(c.id, { ...c }));
    INITIAL_MENU_ITEMS.forEach((m) => this.menuItems.set(m.id, { ...m }));
    INITIAL_EXPENSES.forEach((e) => this.expenses.set(e.id, { ...e }));
    INITIAL_INGREDIENTS.forEach((i) => this.ingredients.set(i.id, { ...i }));
    INITIAL_RECIPES.forEach((rec) =>
      this.recipes.set(rec.id, {
        ...rec,
        ingredients: rec.ingredients.map((ing) => ({ ...ing })),
      }),
    );
    INITIAL_SUPPLIERS.forEach((s) => this.suppliers.set(s.id, { ...s }));
    INITIAL_PURCHASES.forEach((p) =>
      this.purchases.set(p.id, {
        ...p,
        items: p.items.map((it) => ({ ...it })),
      }),
    );
    INITIAL_STOCK_MOVEMENTS.forEach((sm) => this.stockMovements.set(sm.id, { ...sm }));
    INITIAL_WASTAGE_RECORDS.forEach((w) => this.wastageRecords.set(w.id, { ...w }));
    INITIAL_STAFF_USERS.forEach((s) => this.staffUsers.set(s.id, { ...s }));

    // Create realistic historical customers
    const seedCustomers: Customer[] = [
      {
        id: 'cust-seed-01',
        restaurantId: 'rest-verde-01',
        name: 'Aarav Sharma',
        mobileNumber: '+91 98765 43210',
        lastActiveAt: new Date().toISOString(),
        createdAt: '2026-09-01T12:00:00.000Z',
        updatedAt: '2026-09-27T10:00:00.000Z',
      },
      {
        id: 'cust-seed-02',
        restaurantId: 'rest-verde-01',
        name: 'Pooja Hegde',
        mobileNumber: '+91 98234 56789',
        lastActiveAt: new Date().toISOString(),
        createdAt: '2026-09-02T13:00:00.000Z',
        updatedAt: '2026-09-26T14:00:00.000Z',
      },
      {
        id: 'cust-seed-03',
        restaurantId: 'rest-verde-01',
        name: 'Rohan Deshmukh',
        mobileNumber: '+91 99123 45678',
        lastActiveAt: new Date().toISOString(),
        createdAt: '2026-09-05T19:00:00.000Z',
        updatedAt: '2026-09-27T12:30:00.000Z',
      },
      {
        id: 'cust-seed-04',
        restaurantId: 'rest-ember-02',
        name: 'Vikramaditya Roy',
        mobileNumber: '+91 98111 22334',
        lastActiveAt: new Date().toISOString(),
        createdAt: '2026-09-03T20:00:00.000Z',
        updatedAt: '2026-09-27T13:00:00.000Z',
      },
    ];
    seedCustomers.forEach((c) => this.customers.set(c.id, c));

    // Active in-progress order for kitchen KDS view demo
    const activeOrder: Order = {
      id: 'ord-active-01',
      orderNumber: 'ORD-20260927-1000',
      restaurantId: 'rest-verde-01',
      tableId: 'tbl-verde-12',
      customerId: 'cust-seed-01',
      status: 'PREPARING',
      subtotal: 420.0,
      taxAmount: 21.0,
      discountAmount: 0.0,
      totalAmount: 441.0,
      specialInstructions: 'Please make the dal extra buttery with crisp naan',
      estimatedMinutes: 15,
      acceptedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      items: [
        {
          id: 'oi-act-1',
          orderId: 'ord-active-01',
          menuItemId: 'item-v3',
          name: 'Paneer Makhani Royale',
          price: 340.0,
          costPrice: 110.0,
          quantity: 1,
          specialInstructions: 'Medium spicy',
          itemTotal: 340.0,
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        {
          id: 'oi-act-2',
          orderId: 'ord-active-01',
          menuItemId: 'item-v5',
          name: 'Butter Naan (2 Pieces)',
          price: 80.0,
          costPrice: 18.0,
          quantity: 1,
          specialInstructions: 'Crispy and hot',
          itemTotal: 80.0,
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
      ],
    };
    this.orders.set(activeOrder.id, activeOrder);

    // Seed historical completed orders for Verde Botanica and Ember Smokehouse across September 2026
    this.seedHistoricalOrdersAndBills();
  }

  private seedHistoricalOrdersAndBills() {
    // Generate deterministic completed sales across dates from Sept 1 to Sept 27, 2026
    const verdeMenuItems = Array.from(this.menuItems.values()).filter(
      (m) => m.restaurantId === 'rest-verde-01',
    );
    const emberMenuItems = Array.from(this.menuItems.values()).filter(
      (m) => m.restaurantId === 'rest-ember-02',
    );

    // Day-by-day sales data generator for realistic distribution
    const daysInSeptember = [
      { day: 1, ordersV: 12, ordersE: 14 },
      { day: 2, ordersV: 14, ordersE: 16 },
      { day: 3, ordersV: 15, ordersE: 18 },
      { day: 4, ordersV: 20, ordersE: 24 }, // Fri
      { day: 5, ordersV: 28, ordersE: 32 }, // Sat
      { day: 6, ordersV: 26, ordersE: 30 }, // Sun
      { day: 7, ordersV: 11, ordersE: 13 },
      { day: 8, ordersV: 13, ordersE: 15 },
      { day: 9, ordersV: 16, ordersE: 17 },
      { day: 10, ordersV: 17, ordersE: 19 },
      { day: 11, ordersV: 22, ordersE: 26 }, // Fri
      { day: 12, ordersV: 30, ordersE: 35 }, // Sat
      { day: 13, ordersV: 28, ordersE: 31 }, // Sun
      { day: 14, ordersV: 12, ordersE: 14 },
      { day: 15, ordersV: 15, ordersE: 16 },
      { day: 16, ordersV: 18, ordersE: 20 },
      { day: 17, ordersV: 19, ordersE: 21 },
      { day: 18, ordersV: 24, ordersE: 28 }, // Fri
      { day: 19, ordersV: 32, ordersE: 36 }, // Sat
      { day: 20, ordersV: 29, ordersE: 33 }, // Sun
      { day: 21, ordersV: 14, ordersE: 15 },
      { day: 22, ordersV: 16, ordersE: 17 },
      { day: 23, ordersV: 18, ordersE: 22 },
      { day: 24, ordersV: 21, ordersE: 24 },
      { day: 25, ordersV: 27, ordersE: 30 }, // Fri
      { day: 26, ordersV: 34, ordersE: 38 }, // Sat (Yesterday)
      { day: 27, ordersV: 19, ordersE: 22 }, // Sun (Today)
    ];

    let orderNumSeq = 2000;
    const paymentMethodsList: Array<'ONLINE' | 'UPI_QR' | 'CASH' | 'CARD'> = [
      'ONLINE',
      'UPI_QR',
      'UPI_QR',
      'ONLINE',
      'CASH',
      'CARD',
    ];

    const customerIds = ['cust-seed-01', 'cust-seed-02', 'cust-seed-03'];
    const tableIdsV = ['tbl-verde-12', 'tbl-verde-01', 'tbl-verde-02', 'tbl-verde-03'];
    const tableIdsE = ['tbl-ember-01', 'tbl-ember-02', 'tbl-ember-12'];

    // Hours distribution: lunch peak (12:00-15:00) and dinner peak (19:00-22:00)
    const lunchHours = [12, 13, 13, 14];
    const dinnerHours = [19, 19, 20, 20, 21, 22];

    for (const schedule of daysInSeptember) {
      const dateStr = `2026-09-${String(schedule.day).padStart(2, '0')}`;

      // 1. Seed Verde Botanica orders for this day
      for (let i = 0; i < schedule.ordersV; i++) {
        orderNumSeq++;
        const isDinner = i % 3 !== 0;
        const hour = isDinner
          ? dinnerHours[i % dinnerHours.length]
          : lunchHours[i % lunchHours.length];
        const minute = (i * 7) % 60;
        // In UTC, India (UTC+5:30) at hour H is (H - 5:30)
        const dateObj = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000+05:30`);
        const isoTime = dateObj.toISOString();

        // Pick 2 to 4 items from Verde menu
        const item1 = verdeMenuItems[i % verdeMenuItems.length];
        const item2 = verdeMenuItems[(i + 2) % verdeMenuItems.length];
        const item3 = i % 2 === 0 ? verdeMenuItems[(i + 4) % verdeMenuItems.length] : null;

        const orderItems: OrderItem[] = [
          {
            id: `oi-v-${orderNumSeq}-1`,
            orderId: `ord-v-${orderNumSeq}`,
            menuItemId: item1.id,
            name: item1.name,
            price: item1.price,
            costPrice: item1.costPrice,
            quantity: (i % 2) + 1,
            itemTotal: item1.price * ((i % 2) + 1),
            createdAt: isoTime,
          },
          {
            id: `oi-v-${orderNumSeq}-2`,
            orderId: `ord-v-${orderNumSeq}`,
            menuItemId: item2.id,
            name: item2.name,
            price: item2.price,
            costPrice: item2.costPrice,
            quantity: 1,
            itemTotal: item2.price * 1,
            createdAt: isoTime,
          },
        ];

        if (item3) {
          orderItems.push({
            id: `oi-v-${orderNumSeq}-3`,
            orderId: `ord-v-${orderNumSeq}`,
            menuItemId: item3.id,
            name: item3.name,
            price: item3.price,
            costPrice: item3.costPrice,
            quantity: 2,
            itemTotal: item3.price * 2,
            createdAt: isoTime,
          });
        }

        const subtotal = orderItems.reduce((s, it) => s + it.itemTotal, 0);
        const discountAmount = i % 6 === 0 ? 50.0 : 0.0;
        const taxAmount = Number(((subtotal - discountAmount) * 0.05).toFixed(2));
        const totalAmount = Number((subtotal - discountAmount + taxAmount).toFixed(2));

        const orderId = `ord-v-${orderNumSeq}`;
        const orderNumber = `ORD-${dateStr.replace(/-/g, '')}-${orderNumSeq}`;

        const isCancelled = i === schedule.ordersV - 1 && schedule.day % 4 === 0;
        const isPaid = !isCancelled && !(schedule.day === 27 && i >= schedule.ordersV - 2); // 2 unpaid orders today for realistic pending balance

        const order: Order = {
          id: orderId,
          orderNumber,
          restaurantId: 'rest-verde-01',
          tableId: tableIdsV[i % tableIdsV.length],
          customerId: customerIds[i % customerIds.length],
          status: isCancelled ? 'CANCELLED' : 'COMPLETED',
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          estimatedMinutes: 20,
          acceptedAt: isoTime,
          preparedAt: isoTime,
          servedAt: isoTime,
          completedAt: isCancelled ? undefined : isoTime,
          cancelledAt: isCancelled ? isoTime : undefined,
          cancellationReason: isCancelled ? 'Customer had emergency departure' : undefined,
          createdAt: isoTime,
          updatedAt: isoTime,
          items: orderItems,
        };
        this.orders.set(order.id, order);

        // Create Bill for completed order
        if (!isCancelled) {
          const billId = `bill-v-${orderNumSeq}`;
          const billNumber = `BILL-${dateStr.replace(/-/g, '')}-${orderNumSeq}`;
          const bill: Bill = {
            id: billId,
            billNumber,
            restaurantId: 'rest-verde-01',
            orderId: order.id,
            tableId: order.tableId,
            customerId: order.customerId,
            subtotal: order.subtotal,
            taxAmount: order.taxAmount,
            serviceCharge: 0.0,
            discountAmount: order.discountAmount,
            totalAmount: order.totalAmount,
            currency: 'INR',
            paymentStatus: isPaid ? 'PAID' : 'UNPAID',
            generatedAt: isoTime,
            paidAt: isPaid ? isoTime : undefined,
            createdAt: isoTime,
            updatedAt: isoTime,
          };
          this.bills.set(bill.id, bill);

          if (isPaid) {
            const method = paymentMethodsList[i % paymentMethodsList.length];
            const paymentId = `pay-v-${orderNumSeq}`;
            const payment: Payment = {
              id: paymentId,
              restaurantId: 'rest-verde-01',
              billId: bill.id,
              orderId: order.id,
              provider: method,
              providerPaymentId: `TXN-${method}-${orderNumSeq}`,
              providerOrderId: method === 'ONLINE' ? `order_rzp_${orderNumSeq}` : undefined,
              amount: bill.totalAmount,
              currency: 'INR',
              status: 'PAID',
              paidAt: isoTime,
              createdAt: isoTime,
              updatedAt: isoTime,
            };
            this.payments.set(payment.id, payment);
          }
        }
      }

      // 2. Seed Ember Smokehouse orders for this day
      for (let i = 0; i < schedule.ordersE; i++) {
        orderNumSeq++;
        const isDinner = i % 4 !== 0;
        const hour = isDinner
          ? dinnerHours[i % dinnerHours.length]
          : lunchHours[i % lunchHours.length];
        const minute = (i * 9) % 60;
        const dateObj = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000+05:30`);
        const isoTime = dateObj.toISOString();

        const item1 = emberMenuItems[i % emberMenuItems.length];
        const item2 = emberMenuItems[(i + 1) % emberMenuItems.length];

        const orderItems: OrderItem[] = [
          {
            id: `oi-e-${orderNumSeq}-1`,
            orderId: `ord-e-${orderNumSeq}`,
            menuItemId: item1.id,
            name: item1.name,
            price: item1.price,
            costPrice: item1.costPrice,
            quantity: 1,
            itemTotal: item1.price,
            createdAt: isoTime,
          },
          {
            id: `oi-e-${orderNumSeq}-2`,
            orderId: `ord-e-${orderNumSeq}`,
            menuItemId: item2.id,
            name: item2.name,
            price: item2.price,
            costPrice: item2.costPrice,
            quantity: 2,
            itemTotal: item2.price * 2,
            createdAt: isoTime,
          },
        ];

        const subtotal = orderItems.reduce((s, it) => s + it.itemTotal, 0);
        const discountAmount = 0.0;
        const taxAmount = Number((subtotal * 0.05).toFixed(2));
        const totalAmount = Number((subtotal + taxAmount).toFixed(2));

        const orderId = `ord-e-${orderNumSeq}`;
        const orderNumber = `ORD-${dateStr.replace(/-/g, '')}-${orderNumSeq}`;
        const isPaid = !(schedule.day === 27 && i >= schedule.ordersE - 3);

        const order: Order = {
          id: orderId,
          orderNumber,
          restaurantId: 'rest-ember-02',
          tableId: tableIdsE[i % tableIdsE.length],
          customerId: 'cust-seed-04',
          status: 'COMPLETED',
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          estimatedMinutes: 20,
          acceptedAt: isoTime,
          preparedAt: isoTime,
          servedAt: isoTime,
          completedAt: isoTime,
          createdAt: isoTime,
          updatedAt: isoTime,
          items: orderItems,
        };
        this.orders.set(order.id, order);

        const billId = `bill-e-${orderNumSeq}`;
        const billNumber = `BILL-${dateStr.replace(/-/g, '')}-${orderNumSeq}`;
        const bill: Bill = {
          id: billId,
          billNumber,
          restaurantId: 'rest-ember-02',
          orderId: order.id,
          tableId: order.tableId,
          customerId: order.customerId,
          subtotal: order.subtotal,
          taxAmount: order.taxAmount,
          serviceCharge: 0.0,
          discountAmount: 0.0,
          totalAmount: order.totalAmount,
          currency: 'INR',
          paymentStatus: isPaid ? 'PAID' : 'UNPAID',
          generatedAt: isoTime,
          paidAt: isPaid ? isoTime : undefined,
          createdAt: isoTime,
          updatedAt: isoTime,
        };
        this.bills.set(bill.id, bill);

        if (isPaid) {
          const method = paymentMethodsList[i % paymentMethodsList.length];
          const paymentId = `pay-e-${orderNumSeq}`;
          const payment: Payment = {
            id: paymentId,
            restaurantId: 'rest-ember-02',
            billId: bill.id,
            orderId: order.id,
            provider: method,
            providerPaymentId: `TXN-${method}-${orderNumSeq}`,
            amount: bill.totalAmount,
            currency: 'INR',
            status: 'PAID',
            paidAt: isoTime,
            createdAt: isoTime,
            updatedAt: isoTime,
          };
          this.payments.set(payment.id, payment);
        }
      }
    }
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

  public async updateRestaurant(
    id: string,
    updates: Partial<Restaurant>,
  ): Promise<Restaurant | null> {
    const r = this.restaurants.get(id);
    if (!r) return null;
    const updated = { ...r, ...updates, updatedAt: new Date().toISOString() };
    this.restaurants.set(id, updated);
    return { ...updated };
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

  // Process atomic & idempotent inventory consumption on COMPLETED
  private async processOrderInventoryConsumption(
    order: Order,
    restaurant: Restaurant,
  ): Promise<void> {
    // 1. Idempotency Check: Protect against duplicate status transitions & duplicate API calls
    const alreadyConsumed = Array.from(this.stockMovements.values()).some(
      (sm) =>
        sm.referenceType === 'ORDER' &&
        sm.referenceId === order.id &&
        sm.movementType === 'ORDER_CONSUMPTION',
    );
    if (alreadyConsumed) {
      return;
    }

    if (!order.items || order.items.length === 0) {
      return;
    }

    // 2. Pre-calculate consumption plans
    interface ConsumptionPlan {
      ingredient: Ingredient;
      consumedQty: number;
      unitCost: number;
      totalCost: number;
      orderItemName: string;
      orderItemQty: number;
    }

    const plans: ConsumptionPlan[] = [];

    for (const orderItem of order.items) {
      const recipe = Array.from(this.recipes.values()).find(
        (r) =>
          r.restaurantId === order.restaurantId &&
          r.menuItemId === orderItem.menuItemId &&
          r.isActive,
      );

      if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
        const portions = orderItem.quantity / (recipe.yieldQuantity || 1);
        for (const ri of recipe.ingredients) {
          const ingredient = this.ingredients.get(ri.ingredientId);
          if (ingredient && ingredient.restaurantId === order.restaurantId) {
            const consumed = Number((ri.quantity * portions).toFixed(3));
            plans.push({
              ingredient,
              consumedQty: consumed,
              unitCost: ingredient.costPerUnit,
              totalCost: Number((consumed * ingredient.costPerUnit).toFixed(2)),
              orderItemName: orderItem.name,
              orderItemQty: orderItem.quantity,
            });
          }
        }
      }
    }

    if (plans.length === 0) {
      return;
    }

    // 3. Stock Enforcement Check
    if (restaurant.stockEnforcementEnabled) {
      for (const plan of plans) {
        if (plan.ingredient.currentStock < plan.consumedQty) {
          throw new Error(
            `Stock enforcement failure: Insufficient stock for "${plan.ingredient.name}". Required: ${plan.consumedQty} ${plan.ingredient.unit}, Available: ${plan.ingredient.currentStock} ${plan.ingredient.unit}.`,
          );
        }
      }
    }

    // 4. Transaction Safety (Atomic Execution with Rollback Support)
    const rollbackSnapshots = new Map<
      string,
      { currentStock: number; stockStatus: StockStatus; stockValue: number }
    >();
    const newlyCreatedMovements: StockMovement[] = [];

    try {
      const now = new Date().toISOString();
      for (const plan of plans) {
        const ing = plan.ingredient;
        if (!rollbackSnapshots.has(ing.id)) {
          rollbackSnapshots.set(ing.id, {
            currentStock: ing.currentStock,
            stockStatus: ing.stockStatus,
            stockValue: ing.stockValue,
          });
        }

        // Deduct stock (if enforcement is OFF, advisory tracking clamps at 0)
        ing.currentStock = Math.max(0, Number((ing.currentStock - plan.consumedQty).toFixed(3)));
        this.recalculateIngredientStatus(ing);
        this.ingredients.set(ing.id, ing);

        const smId = `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const movement: StockMovement = {
          id: smId,
          restaurantId: order.restaurantId,
          ingredientId: ing.id,
          ingredientName: ing.name,
          movementType: 'ORDER_CONSUMPTION',
          quantity: -plan.consumedQty,
          unit: ing.unit,
          unitCost: plan.unitCost,
          totalCost: plan.totalCost,
          referenceType: 'ORDER',
          referenceId: order.id,
          notes: `Order #${order.orderNumber} - ${plan.orderItemQty}x ${plan.orderItemName}`,
          movementDate: now,
          createdAt: now,
        };
        newlyCreatedMovements.push(movement);
      }

      // Commit all movements atomically
      for (const sm of newlyCreatedMovements) {
        this.stockMovements.set(sm.id, sm);
      }
    } catch (err) {
      // Rollback on any failure
      for (const [ingId, snap] of rollbackSnapshots.entries()) {
        const ing = this.ingredients.get(ingId);
        if (ing) {
          ing.currentStock = snap.currentStock;
          ing.stockStatus = snap.stockStatus;
          ing.stockValue = snap.stockValue;
          this.ingredients.set(ingId, ing);
        }
      }
      for (const sm of newlyCreatedMovements) {
        this.stockMovements.delete(sm.id);
      }
      throw err;
    }
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
      if (!updated.completedAt) updated.completedAt = now;
      await this.updateTableStatus(order.tableId, 'AVAILABLE');

      // Process atomic & idempotent inventory consumption strictly on COMPLETED
      const restaurant = await this.getRestaurantById(order.restaurantId);
      if (restaurant) {
        await this.processOrderInventoryConsumption(updated, restaurant);
      }
    }
    if (newStatus === 'CANCELLED') {
      updated.cancelledAt = now;
      updated.cancellationReason = reason || 'Cancelled by staff';
    }

    this.orders.set(orderId, updated);
    return this.getOrderById(orderId);
  }

  // Bill operations (Digital Bill Engine)
  private async enrichBill(bill: Bill): Promise<Bill> {
    const order = await this.getOrderById(bill.orderId);
    const restaurant = await this.getRestaurantById(bill.restaurantId);
    const table = await this.getTableById(bill.tableId);
    const customer = await this.getCustomerById(bill.customerId);

    return {
      ...bill,
      order: order || undefined,
      restaurant: restaurant || undefined,
      table: table || undefined,
      customer: customer || undefined,
      items: order?.items || [],
    };
  }

  public async generateBill(restaurantId: string, orderNumberOrId: string): Promise<Bill> {
    const restaurant = await this.getRestaurantById(restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const order = await this.getOrderByNumber(restaurantId, orderNumberOrId);
    if (!order) {
      throw new Error(`Order "${orderNumberOrId}" not found for this restaurant`);
    }

    // Bill eligibility: for MVP, allow bill generation only when order is COMPLETED
    if (order.status !== 'COMPLETED') {
      throw new Error('This order is not ready for billing yet. Order status must be COMPLETED.');
    }

    // Duplicate bill protection: Check if bill already exists for this order
    for (const b of this.bills.values()) {
      if (b.orderId === order.id && b.restaurantId === restaurantId) {
        return this.enrichBill(b);
      }
    }

    const billId = `bill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const billNumber = `BILL-${todayStr}-${this.billCounter++}`;

    // Authoritative calculations from the immutable Order & OrderItems
    const subtotal = order.subtotal;
    const taxAmount = order.taxAmount;
    const serviceCharge = 0.0;
    const discountAmount = order.discountAmount || 0.0;
    const totalAmount = Number((subtotal + taxAmount + serviceCharge - discountAmount).toFixed(2));

    const now = new Date().toISOString();
    const newBill: Bill = {
      id: billId,
      billNumber,
      restaurantId,
      orderId: order.id,
      tableId: order.tableId,
      customerId: order.customerId,
      subtotal,
      taxAmount,
      serviceCharge,
      discountAmount,
      totalAmount,
      currency: restaurant.currency || 'USD',
      paymentStatus: 'UNPAID',
      generatedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.bills.set(billId, newBill);
    return this.enrichBill(newBill);
  }

  public async getBillByNumber(restaurantId: string, billNumber: string): Promise<Bill | null> {
    for (const b of this.bills.values()) {
      if (b.restaurantId === restaurantId && (b.billNumber === billNumber || b.id === billNumber)) {
        return this.enrichBill(b);
      }
    }
    return null;
  }

  public async getBillByOrderId(orderId: string): Promise<Bill | null> {
    for (const b of this.bills.values()) {
      if (b.orderId === orderId) {
        return this.enrichBill(b);
      }
    }
    return null;
  }

  public async getBillsByRestaurant(
    restaurantId: string,
    filter?: { paymentStatus?: BillPaymentStatus },
  ): Promise<Bill[]> {
    const results: Bill[] = [];
    for (const b of this.bills.values()) {
      if (b.restaurantId === restaurantId) {
        if (filter?.paymentStatus && b.paymentStatus !== filter.paymentStatus) {
          continue;
        }
        results.push(await this.enrichBill(b));
      }
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async updateBillPaymentStatus(
    billId: string,
    paymentStatus: BillPaymentStatus,
    paidAt?: string,
  ): Promise<Bill | null> {
    const bill = this.bills.get(billId);
    if (!bill) return null;
    const updated: Bill = {
      ...bill,
      paymentStatus,
      paidAt: paidAt || (paymentStatus === 'PAID' ? new Date().toISOString() : bill.paidAt),
      updatedAt: new Date().toISOString(),
    };
    this.bills.set(billId, updated);
    return this.enrichBill(updated);
  }

  // Payment operations
  public async createPayment(data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
    const id = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const payment: Payment = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.payments.set(id, payment);
    return payment;
  }

  public async getPaymentById(id: string): Promise<Payment | null> {
    const p = this.payments.get(id);
    return p ? { ...p } : null;
  }

  public async getPaymentByProviderOrderId(providerOrderId: string): Promise<Payment | null> {
    for (const p of this.payments.values()) {
      if (p.providerOrderId === providerOrderId) {
        return { ...p };
      }
    }
    return null;
  }

  public async getPaymentsByBillId(billId: string): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter((p) => p.billId === billId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getPaymentsByRestaurant(
    restaurantId: string,
    status?: PaymentStatus,
  ): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter((p) => p.restaurantId === restaurantId && (!status || p.status === status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    extra?: { providerPaymentId?: string; failureReason?: string; paidAt?: string },
  ): Promise<Payment | null> {
    const p = this.payments.get(id);
    if (!p) return null;

    const now = new Date().toISOString();
    const updated: Payment = {
      ...p,
      status,
      providerPaymentId: extra?.providerPaymentId || p.providerPaymentId,
      failureReason: extra?.failureReason !== undefined ? extra.failureReason : p.failureReason,
      paidAt: extra?.paidAt || (status === 'PAID' ? now : p.paidAt),
      updatedAt: now,
    };

    this.payments.set(id, updated);
    return { ...updated };
  }

  // Atomic settlement transaction for Payment and Bill
  public async settleBillWithPayment(
    billId: string,
    paymentId: string,
    providerPaymentId: string,
  ): Promise<{ bill: Bill; payment: Payment }> {
    const bill = this.bills.get(billId);
    if (!bill) {
      throw new Error(`Bill ${billId} not found during settlement`);
    }

    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error(`Payment attempt ${paymentId} not found during settlement`);
    }

    const now = new Date().toISOString();

    // 1. Mark payment as PAID
    const updatedPayment: Payment = {
      ...payment,
      status: 'PAID',
      providerPaymentId,
      paidAt: now,
      updatedAt: now,
    };
    this.payments.set(paymentId, updatedPayment);

    // 2. Mark bill as PAID
    const updatedBill: Bill = {
      ...bill,
      paymentStatus: 'PAID',
      paidAt: now,
      updatedAt: now,
    };
    this.bills.set(billId, updatedBill);

    // 3. Mark order as COMPLETED if not already
    const order = this.orders.get(bill.orderId);
    if (order && order.status !== 'COMPLETED') {
      this.orders.set(bill.orderId, {
        ...order,
        status: 'COMPLETED',
        completedAt: now,
        updatedAt: now,
      });
    }

    const enrichedBill = await this.enrichBill(updatedBill);
    return {
      bill: enrichedBill,
      payment: updatedPayment,
    };
  }

  // Dual Payment & UPI Direct Engine
  public async createUpiPaymentAttempt(
    restaurantSlug: string,
    billNumber: string,
    utrNumber?: string,
    notes?: string,
  ): Promise<{ payment: Payment; bill: Bill }> {
    const restaurant = await this.getRestaurantBySlug(restaurantSlug);
    if (!restaurant) throw new Error('Restaurant not found');

    const bill = await this.getBillByNumber(restaurant.id, billNumber);
    if (!bill) throw new Error('Bill not found');

    if (bill.paymentStatus === 'PAID') {
      throw new Error('This bill is already settled.');
    }

    // Check if there is an existing PENDING payment for this bill
    const existingPayments = await this.getPaymentsByBillId(bill.id);
    const existingPending = existingPayments.find((p) => p.status === 'PENDING' && p.provider === 'UPI_QR');

    let payment: Payment;
    if (existingPending) {
      payment = (await this.updatePaymentStatus(existingPending.id, 'PENDING', {
        providerPaymentId: utrNumber || existingPending.providerPaymentId,
      })) || existingPending;
      if (payment) {
        payment.metadata = {
          ...payment.metadata,
          utr: utrNumber,
          notes,
          lastUpdated: new Date().toISOString(),
        };
        this.payments.set(payment.id, payment);
      }
    } else {
      payment = await this.createPayment({
        restaurantId: restaurant.id,
        billId: bill.id,
        orderId: bill.orderId,
        provider: 'UPI_QR',
        providerPaymentId: utrNumber || undefined,
        amount: bill.totalAmount,
        currency: bill.currency || restaurant.currency || 'INR',
        status: 'PENDING',
        metadata: {
          utr: utrNumber,
          notes,
          submittedAt: new Date().toISOString(),
        },
      });
    }

    return {
      payment,
      bill,
    };
  }

  public async settleBillManually(
    restaurantId: string,
    billNumber: string,
    method: 'UPI_QR' | 'CASH' | 'CARD' | 'ONLINE',
    referenceId?: string,
    notes?: string,
  ): Promise<{ bill: Bill; payment: Payment }> {
    const bill = await this.getBillByNumber(restaurantId, billNumber);
    if (!bill) throw new Error('Bill not found');

    if (bill.paymentStatus === 'PAID') {
      const payments = await this.getPaymentsByBillId(bill.id);
      const paidPayment = payments.find((p) => p.status === 'PAID') || payments[0];
      return { bill, payment: paidPayment };
    }

    // Find existing pending payment or create new one
    const existingPayments = await this.getPaymentsByBillId(bill.id);
    let targetPayment = existingPayments.find((p) => p.status === 'PENDING' || p.status === 'CREATED');

    if (!targetPayment) {
      targetPayment = await this.createPayment({
        restaurantId,
        billId: bill.id,
        orderId: bill.orderId,
        provider: method,
        amount: bill.totalAmount,
        currency: bill.currency,
        status: 'PENDING',
        metadata: {
          notes,
          settledManually: true,
        },
      });
    } else {
      targetPayment.provider = method;
      this.payments.set(targetPayment.id, targetPayment);
    }

    const ref = referenceId || `MANUAL-${method}-${Date.now().toString().slice(-6)}`;
    return this.settleBillWithPayment(bill.id, targetPayment.id, ref);
  }

  // ==========================================
  // EXPENSE MANAGEMENT (Tenant-Isolated)
  // ==========================================
  public async createExpense(dto: CreateExpenseDTO): Promise<Expense> {
    const restaurant = await this.getRestaurantById(dto.restaurantId);
    if (!restaurant) throw new Error('Restaurant not found');

    if (!dto.amount || dto.amount <= 0 || isNaN(dto.amount)) {
      throw new Error('Expense amount must be a positive number greater than 0');
    }

    if (!dto.description || !dto.description.trim()) {
      throw new Error('Expense description is required');
    }

    if (!dto.category) {
      throw new Error('Valid expense category is required');
    }

    const id = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const expenseDate = dto.expenseDate ? new Date(dto.expenseDate).toISOString() : now;

    const expense: Expense = {
      id,
      restaurantId: dto.restaurantId,
      category: dto.category,
      description: dto.description.trim(),
      amount: Number(dto.amount.toFixed(2)),
      expenseDate,
      paymentMethod: dto.paymentMethod || 'CASH',
      notes: dto.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.expenses.set(id, expense);
    return { ...expense };
  }

  public async getExpenses(
    restaurantId: string,
    filter?: { startDate?: string; endDate?: string; category?: ExpenseCategory },
  ): Promise<Expense[]> {
    let result: Expense[] = [];
    const startTs = filter?.startDate ? new Date(filter.startDate).getTime() : 0;
    const endTs = filter?.endDate
      ? new Date(filter.endDate).setHours(23, 59, 59, 999)
      : Number.MAX_SAFE_INTEGER;

    for (const exp of this.expenses.values()) {
      if (exp.restaurantId === restaurantId) {
        const expTime = new Date(exp.expenseDate).getTime();
        if (expTime < startTs || expTime > endTs) continue;
        if (filter?.category && exp.category !== filter.category) continue;
        result.push({ ...exp });
      }
    }

    return result.sort(
      (a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime(),
    );
  }

  public async getExpenseById(restaurantId: string, id: string): Promise<Expense | null> {
    const exp = this.expenses.get(id);
    if (!exp || exp.restaurantId !== restaurantId) return null;
    return { ...exp };
  }

  public async updateExpense(
    restaurantId: string,
    id: string,
    dto: UpdateExpenseDTO,
  ): Promise<Expense | null> {
    const exp = this.expenses.get(id);
    if (!exp || exp.restaurantId !== restaurantId) return null;

    if (dto.amount !== undefined && (dto.amount <= 0 || isNaN(dto.amount))) {
      throw new Error('Expense amount must be a positive number greater than 0');
    }

    const updated: Expense = {
      ...exp,
      category: dto.category || exp.category,
      description: dto.description !== undefined ? dto.description.trim() : exp.description,
      amount: dto.amount !== undefined ? Number(dto.amount.toFixed(2)) : exp.amount,
      expenseDate: dto.expenseDate ? new Date(dto.expenseDate).toISOString() : exp.expenseDate,
      paymentMethod: dto.paymentMethod || exp.paymentMethod,
      notes: dto.notes !== undefined ? dto.notes.trim() : exp.notes,
      updatedAt: new Date().toISOString(),
    };

    this.expenses.set(id, updated);
    return { ...updated };
  }

  public async deleteExpense(restaurantId: string, id: string): Promise<boolean> {
    const exp = this.expenses.get(id);
    if (!exp || exp.restaurantId !== restaurantId) return false;
    return this.expenses.delete(id);
  }

  // =======================================================
  // DETERMINISTIC FINANCIAL & PROFIT/LOSS ANALYTICS ENGINE
  // =======================================================
  public async getFinancialAnalytics(
    restaurantId: string,
    startDateStr?: string,
    endDateStr?: string,
    timezone: string = 'Asia/Kolkata',
  ): Promise<FinancialAnalyticsResponse> {
    const restaurant = await this.getRestaurantById(restaurantId);
    if (!restaurant) {
      throw new Error(`Restaurant with ID "${restaurantId}" was not found.`);
    }

    // Determine date boundaries with Asia/Kolkata default semantics
    const now = new Date();
    // Default to This Month (e.g. 2026-09-01 to 2026-09-30)
    let startTs: number;
    let endTs: number;
    let periodStartIso: string;
    let periodEndIso: string;

    if (startDateStr && endDateStr) {
      const s = new Date(startDateStr);
      s.setHours(0, 0, 0, 0);
      startTs = s.getTime();
      periodStartIso = s.toISOString();

      const e = new Date(endDateStr);
      e.setHours(23, 59, 59, 999);
      endTs = e.getTime();
      periodEndIso = e.toISOString();
    } else if (startDateStr) {
      const s = new Date(startDateStr);
      s.setHours(0, 0, 0, 0);
      startTs = s.getTime();
      periodStartIso = s.toISOString();

      const e = new Date();
      e.setHours(23, 59, 59, 999);
      endTs = e.getTime();
      periodEndIso = e.toISOString();
    } else {
      // Current month default
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1, 0, 0, 0, 0);
      const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);
      startTs = firstDay.getTime();
      endTs = lastDay.getTime();
      periodStartIso = firstDay.toISOString();
      periodEndIso = lastDay.toISOString();
    }

    if (endTs < startTs) {
      throw new Error('Invalid date range: End date cannot be earlier than start date');
    }

    // 1. Fetch relevant orders
    const allRestaurantOrders = Array.from(this.orders.values()).filter(
      (o) => o.restaurantId === restaurantId,
    );

    let completedOrders: Order[] = [];
    let cancelledCount = 0;
    let activeCount = 0;

    for (const ord of allRestaurantOrders) {
      const orderTs = new Date(ord.createdAt).getTime();
      if (orderTs >= startTs && orderTs <= endTs) {
        if (ord.status === 'COMPLETED') {
          completedOrders.push(ord);
        } else if (ord.status === 'CANCELLED') {
          cancelledCount++;
        } else {
          activeCount++;
        }
      }
    }

    // Sort chronologically
    completedOrders.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    // 2. Sales & COGS metrics (authoritative from completed orders & snapshots)
    let grossSales = 0;
    let discountAmount = 0;
    let taxAmount = 0;
    let foodCost = 0;

    // Item-level aggregations
    const itemMap = new Map<
      string,
      {
        menuItemId: string;
        name: string;
        categoryId: string;
        isVeg: boolean;
        quantitySold: number;
        sales: number;
        foodCost: number;
      }
    >();

    // Category aggregations
    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        name: string;
        quantitySold: number;
        sales: number;
        foodCost: number;
      }
    >();

    // Veg vs Non-Veg
    let vegQty = 0;
    let vegSales = 0;
    let vegCost = 0;
    let nonVegQty = 0;
    let nonVegSales = 0;
    let nonVegCost = 0;

    // Sales Trend by local day
    const trendMap = new Map<
      string,
      { date: string; label: string; sales: number; grossProfit: number; foodCost: number; orders: number }
    >();

    // Peak Hours (0 - 23 in Asia/Kolkata)
    const hourMap = new Map<number, { orders: number; sales: number }>();
    for (let h = 0; h < 24; h++) {
      hourMap.set(h, { orders: 0, sales: 0 });
    }

    // Peak Days of week (0 Sun to 6 Sat)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayMap = new Map<number, { orders: number; sales: number }>();
    for (let d = 0; d < 7; d++) {
      dayMap.set(d, { orders: 0, sales: 0 });
    }

    const categoriesList = await this.getCategoriesByRestaurant(restaurantId);
    const catNameById = new Map<string, string>();
    categoriesList.forEach((c) => catNameById.set(c.id, c.name));

    for (const order of completedOrders) {
      grossSales += order.subtotal;
      discountAmount += order.discountAmount || 0;
      taxAmount += order.taxAmount || 0;

      let orderFoodCost = 0;
      for (const item of order.items) {
        const itemCostSnap = item.costPrice !== undefined && item.costPrice !== null ? item.costPrice : 0;
        const itemTotalCost = itemCostSnap * item.quantity;
        orderFoodCost += itemTotalCost;

        // Lookup menu item metadata
        const menuItem = this.menuItems.get(item.menuItemId);
        const isVeg = menuItem ? menuItem.isVeg : true;
        const categoryId = menuItem ? menuItem.categoryId : 'uncategorized';
        const categoryName = catNameById.get(categoryId) || 'General';

        // Update item aggregations
        const existingItem = itemMap.get(item.menuItemId) || {
          menuItemId: item.menuItemId,
          name: item.name,
          categoryId,
          isVeg,
          quantitySold: 0,
          sales: 0,
          foodCost: 0,
        };
        existingItem.quantitySold += item.quantity;
        existingItem.sales += item.itemTotal;
        existingItem.foodCost += itemTotalCost;
        itemMap.set(item.menuItemId, existingItem);

        // Update category aggregations
        const existingCat = categoryMap.get(categoryId) || {
          categoryId,
          name: categoryName,
          quantitySold: 0,
          sales: 0,
          foodCost: 0,
        };
        existingCat.quantitySold += item.quantity;
        existingCat.sales += item.itemTotal;
        existingCat.foodCost += itemTotalCost;
        categoryMap.set(categoryId, existingCat);

        // Update Veg / Non-Veg
        if (isVeg) {
          vegQty += item.quantity;
          vegSales += item.itemTotal;
          vegCost += itemTotalCost;
        } else {
          nonVegQty += item.quantity;
          nonVegSales += item.itemTotal;
          nonVegCost += itemTotalCost;
        }
      }

      foodCost += orderFoodCost;

      // Local Date/Time calculations for Asia/Kolkata (UTC + 5:30)
      const orderDate = new Date(order.createdAt);
      // Offset by 5.5 hours for IST local values
      const istDate = new Date(orderDate.getTime() + 5.5 * 60 * 60 * 1000);
      const dateKey = istDate.toISOString().slice(0, 10);
      const localHour = istDate.getUTCHours();
      const localDay = istDate.getUTCDay();

      // Trend accumulation
      const existingTrend = trendMap.get(dateKey) || {
        date: dateKey,
        label: new Date(dateKey + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
        sales: 0,
        grossProfit: 0,
        foodCost: 0,
        orders: 0,
      };
      existingTrend.sales += order.subtotal - (order.discountAmount || 0);
      existingTrend.foodCost += orderFoodCost;
      existingTrend.grossProfit = existingTrend.sales - existingTrend.foodCost;
      existingTrend.orders += 1;
      trendMap.set(dateKey, existingTrend);

      // Hour accumulation
      const hData = hourMap.get(localHour) || { orders: 0, sales: 0 };
      hData.orders += 1;
      hData.sales += order.subtotal;
      hourMap.set(localHour, hData);

      // Day accumulation
      const dData = dayMap.get(localDay) || { orders: 0, sales: 0 };
      dData.orders += 1;
      dData.sales += order.subtotal;
      dayMap.set(localDay, dData);
    }

    grossSales = Number(grossSales.toFixed(2));
    discountAmount = Number(discountAmount.toFixed(2));
    const netSales = Number((grossSales - discountAmount).toFixed(2));
    taxAmount = Number(taxAmount.toFixed(2));
    foodCost = Number(foodCost.toFixed(2));
    const grossProfit = Number((netSales - foodCost).toFixed(2));

    // 3. Operating Expenses for period
    const periodExpenses = await this.getExpenses(restaurantId, {
      startDate: periodStartIso,
      endDate: periodEndIso,
    });
    const operatingExpenses = Number(
      periodExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2),
    );
    const estimatedNetProfit = Number((grossProfit - operatingExpenses).toFixed(2));

    // Margins (safe division with 0 fallback)
    const foodCostPercentage = netSales > 0 ? Number(((foodCost / netSales) * 100).toFixed(1)) : 0;
    const grossMarginPercentage = netSales > 0 ? Number(((grossProfit / netSales) * 100).toFixed(1)) : 0;
    const netMarginPercentage = netSales > 0 ? Number(((estimatedNetProfit / netSales) * 100).toFixed(1)) : 0;
    const orderCount = completedOrders.length;
    const averageOrderValue = orderCount > 0 ? Number((grossSales / orderCount).toFixed(2)) : 0;

    // 4. Payments breakdown (Paid vs Unpaid collections)
    let paidAmount = 0;
    let unpaidAmount = 0;
    let onlinePay = 0;
    let upiQrPay = 0;
    let cashPay = 0;
    let cardPay = 0;
    let otherPay = 0;

    for (const order of completedOrders) {
      const bill = await this.getBillByOrderId(order.id);
      if (bill && bill.paymentStatus === 'PAID') {
        paidAmount += bill.totalAmount;
        // Check payment record method
        const payments = await this.getPaymentsByBillId(bill.id);
        const settledPay = payments.find((p) => p.status === 'PAID');
        const provider = settledPay ? settledPay.provider : 'ONLINE';

        if (provider === 'ONLINE' || provider === 'RAZORPAY') onlinePay += bill.totalAmount;
        else if (provider === 'UPI_QR' || provider === 'UPI') upiQrPay += bill.totalAmount;
        else if (provider === 'CASH') cashPay += bill.totalAmount;
        else if (provider === 'CARD') cardPay += bill.totalAmount;
        else otherPay += bill.totalAmount;
      } else {
        unpaidAmount += order.totalAmount;
      }
    }

    paidAmount = Number(paidAmount.toFixed(2));
    unpaidAmount = Number(unpaidAmount.toFixed(2));

    // 5. Product Performance (Best Sellers & Low Performers)
    const allMenuProducts = Array.from(this.menuItems.values()).filter(
      (m) => m.restaurantId === restaurantId,
    );

    const productPerformances: ProductPerformanceItem[] = allMenuProducts.map((menuItem) => {
      const aggregated = itemMap.get(menuItem.id);
      const quantitySold = aggregated ? aggregated.quantitySold : 0;
      const sales = aggregated ? Number(aggregated.sales.toFixed(2)) : 0;
      const itemFoodCost = aggregated ? Number(aggregated.foodCost.toFixed(2)) : 0;
      const grossContribution = Number((sales - itemFoodCost).toFixed(2));
      const marginPercentage = sales > 0 ? Number(((grossContribution / sales) * 100).toFixed(1)) : 0;

      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        categoryName: catNameById.get(menuItem.categoryId) || 'General',
        isVeg: menuItem.isVeg,
        quantitySold,
        sales,
        foodCost: itemFoodCost,
        grossContribution,
        marginPercentage,
      };
    });

    const bestSellers = [...productPerformances]
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .filter((p) => p.quantitySold > 0)
      .slice(0, 5);

    const lowPerformers = [...productPerformances]
      .sort((a, b) => a.quantitySold - b.quantitySold)
      .slice(0, 5);

    // 6. Category Performance
    const categoryPerformance = Array.from(categoryMap.values())
      .map((cat) => {
        const sales = Number(cat.sales.toFixed(2));
        const catFoodCost = Number(cat.foodCost.toFixed(2));
        const grossContribution = Number((sales - catFoodCost).toFixed(2));
        const marginPercentage = sales > 0 ? Number(((grossContribution / sales) * 100).toFixed(1)) : 0;
        return {
          categoryId: cat.categoryId,
          name: cat.name,
          quantitySold: cat.quantitySold,
          sales,
          foodCost: catFoodCost,
          grossContribution,
          marginPercentage,
        };
      })
      .sort((a, b) => b.sales - a.sales);

    // 7. Sales Trend sorted by date
    const salesTrend: SalesTrendItem[] = Array.from(trendMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => ({
        ...t,
        sales: Number(t.sales.toFixed(2)),
        grossProfit: Number(t.grossProfit.toFixed(2)),
        foodCost: Number(t.foodCost.toFixed(2)),
      }));

    // 8. Peak Hours (formatted 12-hour labels)
    const peakHours = Array.from(hourMap.entries()).map(([h, data]) => {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return {
        hour: h,
        label: `${displayH}:00 ${period}`,
        orders: data.orders,
        sales: Number(data.sales.toFixed(2)),
      };
    });

    // 9. Peak Days
    const peakDays = Array.from(dayMap.entries()).map(([d, data]) => ({
      dayOfWeek: d,
      dayName: dayNames[d],
      shortName: shortDayNames[d],
      orders: data.orders,
      sales: Number(data.sales.toFixed(2)),
    }));

    // 10. Expense Category Breakdown
    const expCatMap = new Map<ExpenseCategory, { amount: number; count: number }>();
    for (const exp of periodExpenses) {
      const existing = expCatMap.get(exp.category) || { amount: 0, count: 0 };
      existing.amount += exp.amount;
      existing.count += 1;
      expCatMap.set(exp.category, existing);
    }

    const expenseBreakdown: ExpenseCategoryBreakdown[] = Array.from(expCatMap.entries())
      .map(([cat, data]) => ({
        category: cat,
        categoryLabel: cat.replace(/_/g, ' '),
        amount: Number(data.amount.toFixed(2)),
        percentage: operatingExpenses > 0 ? Number(((data.amount / operatingExpenses) * 100).toFixed(1)) : 0,
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      period: {
        startDate: periodStartIso,
        endDate: periodEndIso,
        timezone,
      },
      currency: restaurant.currency || 'INR',
      currencySymbol: restaurant.currencySymbol || '₹',
      sales: {
        orderCount,
        grossSales,
        discountAmount,
        taxAmount,
        netSales,
        averageOrderValue,
      },
      costs: {
        foodCost,
        foodCostPercentage,
        operatingExpenses,
      },
      profit: {
        grossProfit,
        grossMarginPercentage,
        estimatedNetProfit,
        netMarginPercentage,
      },
      payments: {
        paidAmount,
        unpaidAmount,
        online: Number(onlinePay.toFixed(2)),
        upiQr: Number(upiQrPay.toFixed(2)),
        cash: Number(cashPay.toFixed(2)),
        card: Number(cardPay.toFixed(2)),
        other: Number(otherPay.toFixed(2)),
        totalCollected: paidAmount,
      },
      orders: {
        total: orderCount + cancelledCount + activeCount,
        completed: orderCount,
        cancelled: cancelledCount,
        active: activeCount,
      },
      productPerformance: {
        bestSellers,
        lowPerformers,
        allItems: productPerformances,
      },
      categoryPerformance,
      salesTrend,
      peakHours,
      peakDays,
      vegNonVeg: {
        veg: {
          quantity: vegQty,
          sales: Number(vegSales.toFixed(2)),
          foodCost: Number(vegCost.toFixed(2)),
          grossProfit: Number((vegSales - vegCost).toFixed(2)),
        },
        nonVeg: {
          quantity: nonVegQty,
          sales: Number(nonVegSales.toFixed(2)),
          foodCost: Number(nonVegCost.toFixed(2)),
          grossProfit: Number((nonVegSales - nonVegCost).toFixed(2)),
        },
      },
      expenseBreakdown,
    };
  }

  // =======================================================
  // ADVANCED BUSINESS INTELLIGENCE & OWNER REPORTING ENGINE
  // =======================================================
  public async getBusinessReport(
    restaurantId: string,
    startDateStr?: string,
    endDateStr?: string,
    timezone: string = 'Asia/Kolkata',
    preset: string = 'thisMonth',
  ): Promise<BusinessReportResponse> {
    const restaurant = await this.getRestaurantById(restaurantId);
    if (!restaurant) {
      throw new Error(`Restaurant with ID "${restaurantId}" was not found.`);
    }

    // 1. Resolve current and previous date boundaries
    let currentStartIso: string;
    let currentEndIso: string;
    let previousStartIso: string;
    let previousEndIso: string;

    if (preset === 'today') {
      const today = '2026-09-27';
      const yesterday = '2026-09-26';
      currentStartIso = `${today}T00:00:00.000Z`;
      currentEndIso = `${today}T23:59:59.999Z`;
      previousStartIso = `${yesterday}T00:00:00.000Z`;
      previousEndIso = `${yesterday}T23:59:59.999Z`;
    } else if (preset === 'yesterday') {
      const yest = '2026-09-26';
      const dayBefore = '2026-09-25';
      currentStartIso = `${yest}T00:00:00.000Z`;
      currentEndIso = `${yest}T23:59:59.999Z`;
      previousStartIso = `${dayBefore}T00:00:00.000Z`;
      previousEndIso = `${dayBefore}T23:59:59.999Z`;
    } else if (preset === 'last7') {
      currentStartIso = '2026-09-21T00:00:00.000Z';
      currentEndIso = '2026-09-27T23:59:59.999Z';
      previousStartIso = '2026-09-14T00:00:00.000Z';
      previousEndIso = '2026-09-20T23:59:59.999Z';
    } else if (preset === 'last30') {
      currentStartIso = '2026-08-29T00:00:00.000Z';
      currentEndIso = '2026-09-27T23:59:59.999Z';
      previousStartIso = '2026-07-30T00:00:00.000Z';
      previousEndIso = '2026-08-28T23:59:59.999Z';
    } else if (preset === 'thisMonth') {
      currentStartIso = '2026-09-01T00:00:00.000Z';
      currentEndIso = '2026-09-30T23:59:59.999Z';
      previousStartIso = '2026-08-01T00:00:00.000Z';
      previousEndIso = '2026-08-31T23:59:59.999Z';
    } else if (preset === 'lastMonth') {
      currentStartIso = '2026-08-01T00:00:00.000Z';
      currentEndIso = '2026-08-31T23:59:59.999Z';
      previousStartIso = '2026-07-01T00:00:00.000Z';
      previousEndIso = '2026-07-31T23:59:59.999Z';
    } else if (preset === 'thisQuarter') {
      currentStartIso = '2026-07-01T00:00:00.000Z';
      currentEndIso = '2026-09-30T23:59:59.999Z';
      previousStartIso = '2026-04-01T00:00:00.000Z';
      previousEndIso = '2026-06-30T23:59:59.999Z';
    } else if (preset === 'thisYear') {
      currentStartIso = '2026-01-01T00:00:00.000Z';
      currentEndIso = '2026-12-31T23:59:59.999Z';
      previousStartIso = '2025-01-01T00:00:00.000Z';
      previousEndIso = '2025-12-31T23:59:59.999Z';
    } else {
      // Custom date range
      const s = startDateStr ? new Date(startDateStr) : new Date('2026-09-01');
      s.setHours(0, 0, 0, 0);
      const e = endDateStr ? new Date(endDateStr) : new Date('2026-09-30');
      e.setHours(23, 59, 59, 999);

      if (e.getTime() < s.getTime()) {
        throw new Error('Invalid custom date range: End date cannot be before start date.');
      }

      currentStartIso = s.toISOString();
      currentEndIso = e.toISOString();

      const durationMs = e.getTime() - s.getTime();
      const prevEnd = new Date(s.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - durationMs);
      previousStartIso = prevStart.toISOString();
      previousEndIso = prevEnd.toISOString();
    }

    // 2. Fetch authoritative financial datasets using Module 6 engine
    const financialCurrent = await this.getFinancialAnalytics(
      restaurantId,
      currentStartIso,
      currentEndIso,
      timezone,
    );

    const financialPrevious = await this.getFinancialAnalytics(
      restaurantId,
      previousStartIso,
      previousEndIso,
      timezone,
    );

    // 3. Helper to build strict metric comparison
    const buildComparison = (curr: number, prev: number): MetricComparison => {
      const c = Number((curr || 0).toFixed(2));
      const p = Number((prev || 0).toFixed(2));
      const absChange = Number((c - p).toFixed(2));
      let pctChange: number | null = null;
      if (p > 0) {
        pctChange = Number(((absChange / p) * 100).toFixed(2));
      } else if (p === 0 && c > 0) {
        pctChange = null; // New / No previous baseline
      } else if (p === 0 && c === 0) {
        pctChange = 0;
      }
      return {
        current: c,
        previous: p,
        absoluteChange: absChange,
        percentageChange: pctChange,
        isPositive: absChange >= 0,
        formattedChange: absChange >= 0 ? `+${absChange}` : `${absChange}`,
      };
    };

    // 4. Executive KPIs comparison
    const executiveKPIs = {
      grossSales: buildComparison(financialCurrent.sales.grossSales, financialPrevious.sales.grossSales),
      discountAmount: buildComparison(financialCurrent.sales.discountAmount, financialPrevious.sales.discountAmount),
      netSales: buildComparison(financialCurrent.sales.netSales, financialPrevious.sales.netSales),
      foodCost: buildComparison(financialCurrent.costs.foodCost, financialPrevious.costs.foodCost),
      grossProfit: buildComparison(financialCurrent.profit.grossProfit, financialPrevious.profit.grossProfit),
      operatingExpenses: buildComparison(financialCurrent.costs.operatingExpenses, financialPrevious.costs.operatingExpenses),
      estimatedNetProfit: buildComparison(financialCurrent.profit.estimatedNetProfit, financialPrevious.profit.estimatedNetProfit),
      ordersCount: buildComparison(financialCurrent.sales.orderCount, financialPrevious.sales.orderCount),
      averageOrderValue: buildComparison(financialCurrent.sales.averageOrderValue, financialPrevious.sales.averageOrderValue),
      foodCostPercentage: buildComparison(financialCurrent.costs.foodCostPercentage, financialPrevious.costs.foodCostPercentage),
      grossMarginPercentage: buildComparison(financialCurrent.profit.grossMarginPercentage, financialPrevious.profit.grossMarginPercentage),
      netMarginPercentage: buildComparison(financialCurrent.profit.netMarginPercentage, financialPrevious.profit.netMarginPercentage),
      taxCollected: buildComparison(financialCurrent.sales.taxAmount, financialPrevious.sales.taxAmount),
      paidCollections: buildComparison(financialCurrent.payments.paidAmount, financialPrevious.payments.paidAmount),
      unpaidAmount: buildComparison(financialCurrent.payments.unpaidAmount, financialPrevious.payments.unpaidAmount),
    };

    // 5. Aligned Sales Growth Trend
    const currentTrend = financialCurrent.salesTrend;
    const prevTrend = financialPrevious.salesTrend;
    const maxTrendLen = Math.max(currentTrend.length, prevTrend.length);

    const trendComparison: SalesGrowthTrendItem[] = [];
    for (let i = 0; i < maxTrendLen; i++) {
      const cur = currentTrend[i];
      const prv = prevTrend[i];
      trendComparison.push({
        index: i + 1,
        dateCurrent: cur ? cur.date : '',
        labelCurrent: cur ? cur.label : `Day ${i + 1}`,
        salesCurrent: cur ? cur.sales : 0,
        ordersCurrent: cur ? cur.orders : 0,
        datePrevious: prv ? prv.date : undefined,
        labelPrevious: prv ? prv.label : undefined,
        salesPrevious: prv ? prv.sales : 0,
        ordersPrevious: prv ? prv.orders : 0,
      });
    }

    const curTotalSales = financialCurrent.sales.netSales;
    const prvTotalSales = financialPrevious.sales.netSales;
    const salesDiff = Number((curTotalSales - prvTotalSales).toFixed(2));
    const salesGrowthPct = prvTotalSales > 0 ? Number(((salesDiff / prvTotalSales) * 100).toFixed(2)) : null;

    const curOrders = financialCurrent.sales.orderCount;
    const prvOrders = financialPrevious.sales.orderCount;
    const ordersDiff = curOrders - prvOrders;
    const ordersGrowthPct = prvOrders > 0 ? Number(((ordersDiff / prvOrders) * 100).toFixed(2)) : null;

    const curAov = financialCurrent.sales.averageOrderValue;
    const prvAov = financialPrevious.sales.averageOrderValue;
    const aovDiff = Number((curAov - prvAov).toFixed(2));
    const aovGrowthPct = prvAov > 0 ? Number(((aovDiff / prvAov) * 100).toFixed(2)) : null;

    const salesGrowth = {
      trendComparison,
      currentTotalSales: curTotalSales,
      previousTotalSales: prvTotalSales,
      salesDiff,
      salesGrowthPct,
      ordersDiff,
      ordersGrowthPct,
      aovDiff,
      aovGrowthPct,
    };

    // 6. Product Profitability rankings
    const allProducts = financialCurrent.productPerformance.allItems;
    const topSellingByQuantity = [...allProducts]
      .filter((p) => p.quantitySold > 0)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    const topByGrossContribution = [...allProducts]
      .filter((p) => p.grossContribution > 0)
      .sort((a, b) => b.grossContribution - a.grossContribution)
      .slice(0, 10);

    const lowestSellingByQuantity = [...allProducts]
      .sort((a, b) => a.quantitySold - b.quantitySold)
      .slice(0, 10);

    const lowestByGrossContribution = [...allProducts]
      .sort((a, b) => a.grossContribution - b.grossContribution)
      .slice(0, 10);

    const productProfitability = {
      topSellingByQuantity,
      topByGrossContribution,
      lowestSellingByQuantity,
      lowestByGrossContribution,
      allProducts,
    };

    // 7. Veg vs Non-Veg Contribution details
    const totalFoodContribution = financialCurrent.profit.grossProfit;
    const vegContrib = financialCurrent.vegNonVeg.veg.grossProfit;
    const nonVegContrib = financialCurrent.vegNonVeg.nonVeg.grossProfit;

    const vegNonVeg = {
      veg: {
        ...financialCurrent.vegNonVeg.veg,
        grossContribution: vegContrib,
        contributionPercentage:
          totalFoodContribution > 0 ? Number(((vegContrib / totalFoodContribution) * 100).toFixed(1)) : 0,
      },
      nonVeg: {
        ...financialCurrent.vegNonVeg.nonVeg,
        grossContribution: nonVegContrib,
        contributionPercentage:
          totalFoodContribution > 0 ? Number(((nonVegContrib / totalFoodContribution) * 100).toFixed(1)) : 0,
      },
    };

    // 8. Peak Hours with AOV
    const peakHours = financialCurrent.peakHours.map((h) => ({
      hour: h.hour,
      label: h.label,
      orders: h.orders,
      sales: h.sales,
      aov: h.orders > 0 ? Number((h.sales / h.orders).toFixed(2)) : 0,
    }));

    // 9. Peak Days with AOV & Gross Contribution
    const peakDays = financialCurrent.peakDays.map((d) => {
      // Estimated day food cost ratio from overall period
      const foodCostRatio = financialCurrent.sales.netSales > 0
        ? financialCurrent.costs.foodCost / financialCurrent.sales.netSales
        : 0.3;
      const estimatedDayFoodCost = d.sales * foodCostRatio;
      const grossContribution = Number((d.sales - estimatedDayFoodCost).toFixed(2));
      return {
        dayOfWeek: d.dayOfWeek,
        dayName: d.dayName,
        shortName: d.shortName,
        orders: d.orders,
        sales: d.sales,
        aov: d.orders > 0 ? Number((d.sales / d.orders).toFixed(2)) : 0,
        grossContribution,
      };
    });

    // 10. Customer Analytics (Aggregated & Privacy-Preserving)
    const curStartTs = new Date(currentStartIso).getTime();
    const curEndTs = new Date(currentEndIso).getTime();

    const completedOrdersInPeriod = Array.from(this.orders.values()).filter(
      (o) =>
        o.restaurantId === restaurantId &&
        o.status === 'COMPLETED' &&
        new Date(o.createdAt).getTime() >= curStartTs &&
        new Date(o.createdAt).getTime() <= curEndTs,
    );

    const customerOrderCounts = new Map<string, { count: number; spend: number }>();
    for (const ord of completedOrdersInPeriod) {
      const cid = ord.customerId || 'walk-in-guest';
      const existing = customerOrderCounts.get(cid) || { count: 0, spend: 0 };
      existing.count += 1;
      existing.spend += ord.totalAmount;
      customerOrderCounts.set(cid, existing);
    }

    const totalUniqueCustomers = customerOrderCounts.size || (completedOrdersInPeriod.length > 0 ? 1 : 0);
    let newCustomers = 0;
    let returningCustomers = 0;

    for (const cid of customerOrderCounts.keys()) {
      const cust = this.customers.get(cid);
      if (cust && new Date(cust.createdAt).getTime() >= curStartTs) {
        newCustomers++;
      } else {
        returningCustomers++;
      }
    }

    if (newCustomers === 0 && returningCustomers === 0 && totalUniqueCustomers > 0) {
      newCustomers = totalUniqueCustomers;
    }

    const repeatCustomerPercentage =
      totalUniqueCustomers > 0
        ? Number(((returningCustomers / totalUniqueCustomers) * 100).toFixed(1))
        : 0;

    const ordersPerCustomer =
      totalUniqueCustomers > 0
        ? Number((completedOrdersInPeriod.length / totalUniqueCustomers).toFixed(2))
        : 0;

    const averageCustomerSpend =
      totalUniqueCustomers > 0
        ? Number((financialCurrent.sales.grossSales / totalUniqueCustomers).toFixed(2))
        : 0;

    const customers: CustomerAnalytics = {
      totalUniqueCustomers,
      newCustomers,
      returningCustomers,
      repeatCustomerPercentage,
      ordersPerCustomer,
      averageCustomerSpend,
    };

    // 11. Order Operational Analytics
    const allOrdersInPeriod = Array.from(this.orders.values()).filter(
      (o) =>
        o.restaurantId === restaurantId &&
        new Date(o.createdAt).getTime() >= curStartTs &&
        new Date(o.createdAt).getTime() <= curEndTs,
    );

    const statusCounts = new Map<OrderStatus, number>();
    allOrdersInPeriod.forEach((o) => {
      statusCounts.set(o.status, (statusCounts.get(o.status) || 0) + 1);
    });

    const totalOrders = allOrdersInPeriod.length;
    const completedOrders = statusCounts.get('COMPLETED') || 0;
    const cancelledOrders = statusCounts.get('CANCELLED') || 0;
    const activeOrders = totalOrders - completedOrders - cancelledOrders;
    const cancellationRate =
      totalOrders > 0 ? Number(((cancelledOrders / totalOrders) * 100).toFixed(1)) : 0;

    let totalItemsCount = 0;
    completedOrdersInPeriod.forEach((o) => {
      o.items.forEach((it) => {
        totalItemsCount += it.quantity;
      });
    });

    const averageItemsPerOrder =
      completedOrders > 0 ? Number((totalItemsCount / completedOrders).toFixed(1)) : 0;

    const possibleStatuses: OrderStatus[] = [
      'NEW',
      'ACCEPTED',
      'PREPARING',
      'READY',
      'SERVED',
      'COMPLETED',
      'CANCELLED',
    ];

    const statusDistribution = possibleStatuses.map((st) => {
      const cnt = statusCounts.get(st) || 0;
      return {
        status: st,
        count: cnt,
        percentage: totalOrders > 0 ? Number(((cnt / totalOrders) * 100).toFixed(1)) : 0,
      };
    });

    const ordersOperational: OrderOperationalAnalytics = {
      totalOrders,
      completedOrders,
      cancelledOrders,
      activeOrders,
      cancellationRate,
      averageItemsPerOrder,
      averageOrderValue: financialCurrent.sales.averageOrderValue,
      statusDistribution,
    };

    // 12. Payment Methods Detailed Breakdown
    const totalSettled = financialCurrent.payments.paidAmount;
    const paymentMethods: PaymentMethodBreakdownItem[] = [
      {
        method: 'ONLINE',
        label: 'Online Gateway (Razorpay/Cards)',
        amount: financialCurrent.payments.online,
        count: Math.round(financialCurrent.payments.online / (financialCurrent.sales.averageOrderValue || 500)),
        percentageOfSettled:
          totalSettled > 0
            ? Number(((financialCurrent.payments.online / totalSettled) * 100).toFixed(1))
            : 0,
      },
      {
        method: 'UPI_QR',
        label: 'Restaurant UPI QR (GPay/PhonePe)',
        amount: financialCurrent.payments.upiQr,
        count: Math.round(financialCurrent.payments.upiQr / (financialCurrent.sales.averageOrderValue || 500)),
        percentageOfSettled:
          totalSettled > 0
            ? Number(((financialCurrent.payments.upiQr / totalSettled) * 100).toFixed(1))
            : 0,
      },
      {
        method: 'CASH',
        label: 'Counter Cash Collection',
        amount: financialCurrent.payments.cash,
        count: Math.round(financialCurrent.payments.cash / (financialCurrent.sales.averageOrderValue || 500)),
        percentageOfSettled:
          totalSettled > 0
            ? Number(((financialCurrent.payments.cash / totalSettled) * 100).toFixed(1))
            : 0,
      },
      {
        method: 'CARD',
        label: 'Physical POS Terminal Card',
        amount: financialCurrent.payments.card,
        count: Math.round(financialCurrent.payments.card / (financialCurrent.sales.averageOrderValue || 500)),
        percentageOfSettled:
          totalSettled > 0
            ? Number(((financialCurrent.payments.card / totalSettled) * 100).toFixed(1))
            : 0,
      },
    ].filter((m) => m.amount > 0 || totalSettled === 0);

    const paymentsBreakdown = {
      totalSettled,
      unpaidAmount: financialCurrent.payments.unpaidAmount,
      methods: paymentMethods,
    };

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        currency: restaurant.currency || 'INR',
        currencySymbol: restaurant.currencySymbol || '₹',
        timezone,
      },
      period: {
        preset,
        startDate: currentStartIso,
        endDate: currentEndIso,
        previousStartDate: previousStartIso,
        previousEndDate: previousEndIso,
        generatedAt: new Date().toISOString(),
      },
      executiveKPIs,
      financialCurrent,
      financialPrevious,
      salesGrowth,
      productProfitability,
      categoryPerformance: financialCurrent.categoryPerformance,
      vegNonVeg,
      peakHours,
      peakDays,
      customers,
      ordersOperational,
      paymentsBreakdown,
      expensesBreakdown: financialCurrent.expenseBreakdown,
    };
  }

  // =======================================================
  // INVENTORY, INGREDIENTS, RECIPES & STOCK ENGINE (MODULE 8)
  // =======================================================

  public recalculateIngredientStatus(ingredient: Ingredient) {
    if (ingredient.currentStock <= 0) {
      ingredient.stockStatus = 'OUT_OF_STOCK';
    } else if (
      ingredient.currentStock <= (ingredient.reorderLevel || ingredient.minimumStock || 0)
    ) {
      ingredient.stockStatus = 'LOW_STOCK';
    } else {
      ingredient.stockStatus = 'IN_STOCK';
    }
    ingredient.stockValue = Number(
      (ingredient.currentStock * ingredient.costPerUnit).toFixed(2),
    );
    ingredient.updatedAt = new Date().toISOString();
  }

  // === INGREDIENTS CRUD ===
  public async getIngredients(
    restaurantId: string,
    filter?: { category?: string; status?: string; search?: string },
  ): Promise<Ingredient[]> {
    let items = Array.from(this.ingredients.values()).filter(
      (i) => i.restaurantId === restaurantId && i.isActive,
    );

    if (filter?.category && filter.category !== 'ALL') {
      items = items.filter((i) => i.category === filter.category);
    }
    if (filter?.status && filter.status !== 'ALL') {
      items = items.filter((i) => i.stockStatus === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.sku && i.sku.toLowerCase().includes(q)),
      );
    }

    return items
      .map((i) => {
        this.recalculateIngredientStatus(i);
        return { ...i };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public async getIngredientById(
    id: string,
    restaurantId: string,
  ): Promise<Ingredient | null> {
    const item = this.ingredients.get(id);
    if (!item || item.restaurantId !== restaurantId || !item.isActive) return null;
    this.recalculateIngredientStatus(item);
    return { ...item };
  }

  public async createIngredient(
    restaurantId: string,
    dto: CreateIngredientDTO,
  ): Promise<Ingredient> {
    const restaurant = await this.getRestaurantById(restaurantId);
    if (!restaurant) throw new Error('Restaurant not found');

    const id = `ing-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const currentStock = Number(dto.currentStock || 0);
    const costPerUnit = Number(dto.costPerUnit || 0);
    const minimumStock = Number(dto.minimumStock || 0);
    const reorderLevel = Number(dto.reorderLevel || minimumStock || 5.0);

    const ingredient: Ingredient = {
      id,
      restaurantId,
      name: dto.name.trim(),
      sku:
        dto.sku?.trim() ||
        `ING-${dto.category.substring(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
      unit: dto.unit,
      category: dto.category,
      currentStock,
      minimumStock,
      reorderLevel,
      costPerUnit,
      stockStatus:
        currentStock <= 0
          ? 'OUT_OF_STOCK'
          : currentStock <= reorderLevel
          ? 'LOW_STOCK'
          : 'IN_STOCK',
      stockValue: Number((currentStock * costPerUnit).toFixed(2)),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.ingredients.set(id, ingredient);

    // If initial stock is provided, record INITIAL_STOCK movement
    if (currentStock > 0) {
      const smId = `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const movement: StockMovement = {
        id: smId,
        restaurantId,
        ingredientId: id,
        ingredientName: ingredient.name,
        movementType: 'INITIAL_STOCK',
        quantity: currentStock,
        unit: ingredient.unit,
        unitCost: costPerUnit,
        totalCost: Number((currentStock * costPerUnit).toFixed(2)),
        notes: 'Initial inventory baseline',
        movementDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      this.stockMovements.set(smId, movement);
    }

    return { ...ingredient };
  }

  public async updateIngredient(
    id: string,
    restaurantId: string,
    dto: UpdateIngredientDTO,
  ): Promise<Ingredient | null> {
    const item = this.ingredients.get(id);
    if (!item || item.restaurantId !== restaurantId) return null;

    if (dto.name !== undefined) item.name = dto.name.trim();
    if (dto.sku !== undefined) item.sku = dto.sku.trim();
    if (dto.unit !== undefined) item.unit = dto.unit;
    if (dto.category !== undefined) item.category = dto.category;
    if (dto.costPerUnit !== undefined) item.costPerUnit = Number(dto.costPerUnit);
    if (dto.minimumStock !== undefined) item.minimumStock = Number(dto.minimumStock);
    if (dto.reorderLevel !== undefined) item.reorderLevel = Number(dto.reorderLevel);
    if (dto.currentStock !== undefined) item.currentStock = Number(dto.currentStock);
    if (dto.isActive !== undefined) item.isActive = dto.isActive;

    this.recalculateIngredientStatus(item);
    this.ingredients.set(id, item);
    return { ...item };
  }

  public async deleteIngredient(
    id: string,
    restaurantId: string,
  ): Promise<boolean> {
    const item = this.ingredients.get(id);
    if (!item || item.restaurantId !== restaurantId) return false;
    item.isActive = false;
    item.updatedAt = new Date().toISOString();
    this.ingredients.set(id, item);
    return true;
  }

  // === RECIPES CRUD ===
  private enrichRecipe(recipe: Recipe): Recipe {
    let totalCost = 0;
    let complete = true;

    const enrichedIngredients: RecipeIngredient[] = recipe.ingredients.map((ri) => {
      const ing = this.ingredients.get(ri.ingredientId);
      const unitCost = ing ? ing.costPerUnit : ri.costPerUnit || 0;
      const cost = Number((ri.quantity * unitCost).toFixed(2));
      totalCost += cost;
      if (unitCost <= 0) complete = false;

      return {
        ...ri,
        ingredientName: ing ? ing.name : ri.ingredientName || 'Unknown Ingredient',
        costPerUnit: unitCost,
        totalCost: cost,
      };
    });

    const menuItem = this.menuItems.get(recipe.menuItemId);
    const yieldQty = recipe.yieldQuantity || 1;
    const estimatedCost = Number((totalCost / yieldQty).toFixed(2));

    return {
      ...recipe,
      menuItemName: menuItem?.name || recipe.menuItemName || 'Menu Item',
      ingredients: enrichedIngredients,
      estimatedCost,
      isCostComplete: complete && enrichedIngredients.length > 0,
    };
  }

  public async getRecipes(
    restaurantId: string,
    menuItemId?: string,
  ): Promise<Recipe[]> {
    let items = Array.from(this.recipes.values()).filter(
      (r) => r.restaurantId === restaurantId && r.isActive,
    );

    if (menuItemId) {
      items = items.filter((r) => r.menuItemId === menuItemId);
    }

    return items
      .map((r) => this.enrichRecipe(r))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public async getRecipeById(
    id: string,
    restaurantId: string,
  ): Promise<Recipe | null> {
    const recipe = this.recipes.get(id);
    if (!recipe || recipe.restaurantId !== restaurantId || !recipe.isActive) return null;
    return this.enrichRecipe(recipe);
  }

  public async createRecipe(
    restaurantId: string,
    dto: CreateRecipeDTO,
  ): Promise<Recipe> {
    const restaurant = await this.getRestaurantById(restaurantId);
    if (!restaurant) throw new Error('Restaurant not found');

    const menuItem = await this.getMenuItemById(dto.menuItemId);
    if (!menuItem || menuItem.restaurantId !== restaurantId) {
      throw new Error('Invalid menu item for this restaurant');
    }

    const id = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const ingredients: RecipeIngredient[] = dto.ingredients.map((ri, idx) => {
      const ing = this.ingredients.get(ri.ingredientId);
      const unitCost = ing?.costPerUnit || 0;
      return {
        id: `ri-${id}-${idx + 1}`,
        recipeId: id,
        ingredientId: ri.ingredientId,
        ingredientName: ing?.name,
        quantity: Number(ri.quantity),
        unit: ri.unit,
        costPerUnit: unitCost,
        totalCost: Number((Number(ri.quantity) * unitCost).toFixed(2)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    const yieldQuantity = Number(dto.yieldQuantity || 1);
    const yieldUnit = dto.yieldUnit?.trim() || 'PORTION';
    const totalIngredientsCost = ingredients.reduce((s, i) => s + (i.totalCost || 0), 0);
    const estimatedCost = Number((totalIngredientsCost / yieldQuantity).toFixed(2));

    const recipe: Recipe = {
      id,
      restaurantId,
      menuItemId: dto.menuItemId,
      menuItemName: menuItem.name,
      name: dto.name.trim() || `Recipe: ${menuItem.name}`,
      yieldQuantity,
      yieldUnit,
      instructions: dto.instructions?.trim() || '',
      ingredients,
      estimatedCost,
      isCostComplete: ingredients.every((i) => (i.costPerUnit || 0) > 0),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.recipes.set(id, recipe);
    return this.enrichRecipe(recipe);
  }

  public async updateRecipe(
    id: string,
    restaurantId: string,
    dto: UpdateRecipeDTO,
  ): Promise<Recipe | null> {
    const recipe = this.recipes.get(id);
    if (!recipe || recipe.restaurantId !== restaurantId) return null;

    if (dto.name !== undefined) recipe.name = dto.name.trim();
    if (dto.yieldQuantity !== undefined) recipe.yieldQuantity = Number(dto.yieldQuantity);
    if (dto.yieldUnit !== undefined) recipe.yieldUnit = dto.yieldUnit.trim();
    if (dto.instructions !== undefined) recipe.instructions = dto.instructions.trim();
    if (dto.isActive !== undefined) recipe.isActive = dto.isActive;

    if (dto.ingredients) {
      recipe.ingredients = dto.ingredients.map((ri, idx) => {
        const ing = this.ingredients.get(ri.ingredientId);
        const unitCost = ing?.costPerUnit || 0;
        return {
          id: `ri-${id}-${idx + 1}`,
          recipeId: id,
          ingredientId: ri.ingredientId,
          ingredientName: ing?.name,
          quantity: Number(ri.quantity),
          unit: ri.unit,
          costPerUnit: unitCost,
          totalCost: Number((Number(ri.quantity) * unitCost).toFixed(2)),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
    }

    recipe.updatedAt = new Date().toISOString();
    this.recipes.set(id, recipe);
    return this.enrichRecipe(recipe);
  }

  public async deleteRecipe(
    id: string,
    restaurantId: string,
  ): Promise<boolean> {
    const recipe = this.recipes.get(id);
    if (!recipe || recipe.restaurantId !== restaurantId) return false;
    recipe.isActive = false;
    recipe.updatedAt = new Date().toISOString();
    this.recipes.set(id, recipe);
    return true;
  }

  public async syncRecipeCostToMenuItem(
    recipeId: string,
    restaurantId: string,
  ): Promise<{ menuItem: MenuItem; recipe: Recipe }> {
    const recipe = await this.getRecipeById(recipeId, restaurantId);
    if (!recipe) throw new Error('Recipe not found');

    const menuItem = this.menuItems.get(recipe.menuItemId);
    if (!menuItem || menuItem.restaurantId !== restaurantId) {
      throw new Error('Menu item not found');
    }

    // Update menuItem costPrice for FUTURE orders
    menuItem.costPrice = recipe.estimatedCost;
    menuItem.updatedAt = new Date().toISOString();
    this.menuItems.set(menuItem.id, menuItem);

    return { menuItem: { ...menuItem }, recipe };
  }

  // === SUPPLIERS CRUD ===
  public async getSuppliers(restaurantId: string): Promise<Supplier[]> {
    return Array.from(this.suppliers.values())
      .filter((s) => s.restaurantId === restaurantId && s.isActive)
      .map((s) => ({ ...s }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  public async getSupplierById(
    id: string,
    restaurantId: string,
  ): Promise<Supplier | null> {
    const sup = this.suppliers.get(id);
    if (!sup || sup.restaurantId !== restaurantId || !sup.isActive) return null;
    return { ...sup };
  }

  public async createSupplier(
    restaurantId: string,
    dto: CreateSupplierDTO,
  ): Promise<Supplier> {
    const restaurant = await this.getRestaurantById(restaurantId);
    if (!restaurant) throw new Error('Restaurant not found');

    const id = `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const supplier: Supplier = {
      id,
      restaurantId,
      name: dto.name.trim(),
      phone: dto.phone?.trim() || '',
      email: dto.email?.trim() || '',
      address: dto.address?.trim() || '',
      gstNumber: dto.gstNumber?.trim() || '',
      notes: dto.notes?.trim() || '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.suppliers.set(id, supplier);
    return { ...supplier };
  }

  public async updateSupplier(
    id: string,
    restaurantId: string,
    dto: UpdateSupplierDTO,
  ): Promise<Supplier | null> {
    const supplier = this.suppliers.get(id);
    if (!supplier || supplier.restaurantId !== restaurantId) return null;

    if (dto.name !== undefined) supplier.name = dto.name.trim();
    if (dto.phone !== undefined) supplier.phone = dto.phone.trim();
    if (dto.email !== undefined) supplier.email = dto.email.trim();
    if (dto.address !== undefined) supplier.address = dto.address.trim();
    if (dto.gstNumber !== undefined) supplier.gstNumber = dto.gstNumber.trim();
    if (dto.notes !== undefined) supplier.notes = dto.notes.trim();
    if (dto.isActive !== undefined) supplier.isActive = dto.isActive;

    supplier.updatedAt = new Date().toISOString();
    this.suppliers.set(id, supplier);
    return { ...supplier };
  }

  public async deleteSupplier(
    id: string,
    restaurantId: string,
  ): Promise<boolean> {
    const supplier = this.suppliers.get(id);
    if (!supplier || supplier.restaurantId !== restaurantId) return false;
    supplier.isActive = false;
    supplier.updatedAt = new Date().toISOString();
    this.suppliers.set(id, supplier);
    return true;
  }

  // === PURCHASES / STOCK-IN ===
  public async getPurchases(
    restaurantId: string,
    filter?: { startDate?: string; endDate?: string; supplierId?: string },
  ): Promise<Purchase[]> {
    let list = Array.from(this.purchases.values()).filter(
      (p) => p.restaurantId === restaurantId,
    );

    if (filter?.supplierId && filter.supplierId !== 'ALL') {
      list = list.filter((p) => p.supplierId === filter.supplierId);
    }
    if (filter?.startDate) {
      const s = new Date(filter.startDate).getTime();
      list = list.filter((p) => new Date(p.purchaseDate).getTime() >= s);
    }
    if (filter?.endDate) {
      const e = new Date(filter.endDate).getTime();
      list = list.filter((p) => new Date(p.purchaseDate).getTime() <= e);
    }

    return list
      .map((p) => {
        const sup = p.supplierId ? this.suppliers.get(p.supplierId) : undefined;
        return {
          ...p,
          supplierName: sup?.name || p.supplierName,
          items: p.items.map((it) => {
            const ing = this.ingredients.get(it.ingredientId);
            return {
              ...it,
              ingredientName: ing?.name || it.ingredientName || 'Ingredient',
            };
          }),
        };
      })
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }

  public async getPurchaseById(
    id: string,
    restaurantId: string,
  ): Promise<Purchase | null> {
    const p = this.purchases.get(id);
    if (!p || p.restaurantId !== restaurantId) return null;
    const sup = p.supplierId ? this.suppliers.get(p.supplierId) : undefined;
    return {
      ...p,
      supplierName: sup?.name || p.supplierName,
      items: p.items.map((it) => {
        const ing = this.ingredients.get(it.ingredientId);
        return {
          ...it,
          ingredientName: ing?.name || it.ingredientName || 'Ingredient',
        };
      }),
    };
  }

  public async createPurchase(
    restaurantId: string,
    dto: CreatePurchaseDTO,
  ): Promise<Purchase> {
    const restaurant = await this.getRestaurantById(restaurantId);
    if (!restaurant) throw new Error('Restaurant not found');

    if (!dto.items || dto.items.length === 0) {
      throw new Error('Purchase must contain at least one item');
    }

    const supplier = dto.supplierId ? this.suppliers.get(dto.supplierId) : undefined;
    const purchaseId = `pur-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const purchaseDate = dto.purchaseDate || new Date().toISOString();
    const invoiceNumber =
      dto.invoiceNumber?.trim() ||
      `INV-PUR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${this.purchaseCounter++}`;

    let totalAmount = 0;
    const purchaseItems: PurchaseItem[] = [];

    for (const itemDto of dto.items) {
      const ingredient = this.ingredients.get(itemDto.ingredientId);
      if (!ingredient || ingredient.restaurantId !== restaurantId) {
        throw new Error(`Ingredient with ID ${itemDto.ingredientId} not found.`);
      }

      const qty = Number(itemDto.quantity);
      const unitCost = Number(itemDto.unitCost);
      const itemCost = Number((qty * unitCost).toFixed(2));
      totalAmount += itemCost;

      const pItem: PurchaseItem = {
        id: `pi-${purchaseId}-${purchaseItems.length + 1}`,
        purchaseId,
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        quantity: qty,
        unit: itemDto.unit || ingredient.unit,
        unitCost,
        totalCost: itemCost,
      };
      purchaseItems.push(pItem);

      // 1. Increment ingredient stock
      const oldStock = ingredient.currentStock;
      const newStock = oldStock + qty;

      // 2. Weighted average cost recalculation
      if (newStock > 0 && unitCost > 0) {
        const currentVal = oldStock > 0 ? oldStock * ingredient.costPerUnit : 0;
        const addedVal = qty * unitCost;
        ingredient.costPerUnit = Number(((currentVal + addedVal) / newStock).toFixed(2));
      }
      ingredient.currentStock = Number(newStock.toFixed(3));
      this.recalculateIngredientStatus(ingredient);
      this.ingredients.set(ingredient.id, ingredient);

      // 3. Record PURCHASE stock movement
      const smId = `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const movement: StockMovement = {
        id: smId,
        restaurantId,
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        movementType: 'PURCHASE',
        quantity: qty,
        unit: ingredient.unit,
        unitCost,
        totalCost: itemCost,
        referenceType: 'PURCHASE',
        referenceId: purchaseId,
        notes: `Purchase Invoice #${invoiceNumber}${supplier ? ` from ${supplier.name}` : ''}`,
        movementDate: purchaseDate,
        createdAt: new Date().toISOString(),
      };
      this.stockMovements.set(smId, movement);
    }

    const purchase: Purchase = {
      id: purchaseId,
      restaurantId,
      supplierId: dto.supplierId,
      supplierName: supplier?.name,
      invoiceNumber,
      purchaseDate,
      totalAmount: Number(totalAmount.toFixed(2)),
      notes: dto.notes?.trim() || '',
      items: purchaseItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.purchases.set(purchaseId, purchase);
    return purchase;
  }

  // === STOCK MOVEMENTS & ADJUSTMENTS ===
  public async getStockMovements(
    restaurantId: string,
    filter?: {
      ingredientId?: string;
      type?: StockMovementType | 'ALL';
      startDate?: string;
      endDate?: string;
    },
  ): Promise<StockMovement[]> {
    let list = Array.from(this.stockMovements.values()).filter(
      (sm) => sm.restaurantId === restaurantId,
    );

    if (filter?.ingredientId && filter.ingredientId !== 'ALL') {
      list = list.filter((sm) => sm.ingredientId === filter.ingredientId);
    }
    if (filter?.type && filter.type !== 'ALL') {
      list = list.filter((sm) => sm.movementType === filter.type);
    }
    if (filter?.startDate) {
      const s = new Date(filter.startDate).getTime();
      list = list.filter((sm) => new Date(sm.movementDate).getTime() >= s);
    }
    if (filter?.endDate) {
      const e = new Date(filter.endDate).getTime();
      list = list.filter((sm) => new Date(sm.movementDate).getTime() <= e);
    }

    return list
      .map((sm) => {
        const ing = this.ingredients.get(sm.ingredientId);
        return {
          ...sm,
          ingredientName: ing?.name || sm.ingredientName || 'Ingredient',
        };
      })
      .sort((a, b) => new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime());
  }

  public async createStockAdjustment(
    restaurantId: string,
    dto: CreateStockAdjustmentDTO,
  ): Promise<StockMovement> {
    const ingredient = this.ingredients.get(dto.ingredientId);
    if (!ingredient || ingredient.restaurantId !== restaurantId) {
      throw new Error('Ingredient not found');
    }

    const qty = Number(dto.quantity);
    if (qty <= 0) throw new Error('Quantity must be greater than zero');

    const isAdd = dto.adjustmentType === 'ADJUSTMENT_IN';
    const netQty = isAdd ? qty : -qty;

    if (!isAdd && ingredient.currentStock < qty) {
      // Allow deduction down to zero
      ingredient.currentStock = 0;
    } else {
      ingredient.currentStock = Number((ingredient.currentStock + netQty).toFixed(3));
    }

    this.recalculateIngredientStatus(ingredient);
    this.ingredients.set(ingredient.id, ingredient);

    const smId = `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const movement: StockMovement = {
      id: smId,
      restaurantId,
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      movementType: dto.adjustmentType,
      quantity: netQty,
      unit: ingredient.unit,
      unitCost: ingredient.costPerUnit,
      totalCost: Number((qty * ingredient.costPerUnit).toFixed(2)),
      referenceType: 'MANUAL_ADJUSTMENT',
      referenceId: smId,
      notes: dto.notes?.trim() || dto.reason?.trim() || 'Manual stock adjustment',
      movementDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.stockMovements.set(smId, movement);
    return movement;
  }

  public async reconcileStockCount(
    restaurantId: string,
    dto: CreateStockCountDTO,
  ): Promise<{ ingredient: Ingredient; movement: StockMovement }> {
    const ingredient = this.ingredients.get(dto.ingredientId);
    if (!ingredient || ingredient.restaurantId !== restaurantId) {
      throw new Error('Ingredient not found');
    }

    const physicalStock = Math.max(0, Number(dto.physicalStock));
    const delta = Number((physicalStock - ingredient.currentStock).toFixed(3));

    if (delta === 0) {
      return {
        ingredient: { ...ingredient },
        movement: {
          id: `sm-none`,
          restaurantId,
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          movementType: 'ADJUSTMENT_IN',
          quantity: 0,
          unit: ingredient.unit,
          unitCost: ingredient.costPerUnit,
          totalCost: 0,
          notes: 'Stock count verified (no variance)',
          movementDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      };
    }

    ingredient.currentStock = physicalStock;
    this.recalculateIngredientStatus(ingredient);
    this.ingredients.set(ingredient.id, ingredient);

    const movementType: StockMovementType = delta > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT';
    const smId = `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const movement: StockMovement = {
      id: smId,
      restaurantId,
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      movementType,
      quantity: delta,
      unit: ingredient.unit,
      unitCost: ingredient.costPerUnit,
      totalCost: Number((Math.abs(delta) * ingredient.costPerUnit).toFixed(2)),
      referenceType: 'PHYSICAL_STOCK_COUNT',
      referenceId: smId,
      notes: `Physical Stock Audit: Adjusted from variance (${delta > 0 ? '+' : ''}${delta} ${ingredient.unit}). ${dto.notes || ''}`.trim(),
      movementDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.stockMovements.set(smId, movement);
    return { ingredient: { ...ingredient }, movement };
  }

  // === WASTAGE TRACKING ===
  public async getWastageRecords(
    restaurantId: string,
    filter?: { startDate?: string; endDate?: string; reason?: WastageReason | 'ALL' },
  ): Promise<WastageRecord[]> {
    let list = Array.from(this.wastageRecords.values()).filter(
      (w) => w.restaurantId === restaurantId,
    );

    if (filter?.reason && filter.reason !== 'ALL') {
      list = list.filter((w) => w.reason === filter.reason);
    }
    if (filter?.startDate) {
      const s = new Date(filter.startDate).getTime();
      list = list.filter((w) => new Date(w.wastageDate).getTime() >= s);
    }
    if (filter?.endDate) {
      const e = new Date(filter.endDate).getTime();
      list = list.filter((w) => new Date(w.wastageDate).getTime() <= e);
    }

    return list
      .map((w) => {
        const ing = this.ingredients.get(w.ingredientId);
        return {
          ...w,
          ingredientName: ing?.name || w.ingredientName || 'Ingredient',
        };
      })
      .sort((a, b) => new Date(b.wastageDate).getTime() - new Date(a.wastageDate).getTime());
  }

  public async createWastage(
    restaurantId: string,
    dto: CreateWastageDTO,
  ): Promise<WastageRecord> {
    const ingredient = this.ingredients.get(dto.ingredientId);
    if (!ingredient || ingredient.restaurantId !== restaurantId) {
      throw new Error('Ingredient not found');
    }

    const qty = Number(dto.quantity);
    if (qty <= 0) throw new Error('Wastage quantity must be positive');

    const costPerUnit = ingredient.costPerUnit;
    const totalCost = Number((qty * costPerUnit).toFixed(2));
    const wastageDate = dto.wastageDate || new Date().toISOString();

    const wastageId = `wst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const wastageRecord: WastageRecord = {
      id: wastageId,
      restaurantId,
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      quantity: qty,
      unit: ingredient.unit,
      costPerUnit,
      totalCost,
      reason: dto.reason,
      notes: dto.notes?.trim() || '',
      wastageDate,
      createdAt: new Date().toISOString(),
    };

    this.wastageRecords.set(wastageId, wastageRecord);

    // Deduct current stock
    ingredient.currentStock = Math.max(0, Number((ingredient.currentStock - qty).toFixed(3)));
    this.recalculateIngredientStatus(ingredient);
    this.ingredients.set(ingredient.id, ingredient);

    // Record Stock Movement
    const smId = `sm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const movement: StockMovement = {
      id: smId,
      restaurantId,
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      movementType: 'WASTAGE',
      quantity: -qty,
      unit: ingredient.unit,
      unitCost: costPerUnit,
      totalCost,
      referenceType: 'WASTAGE',
      referenceId: wastageId,
      notes: `Recorded Wastage (${dto.reason}): ${dto.notes || ''}`.trim(),
      movementDate: wastageDate,
      createdAt: new Date().toISOString(),
    };
    this.stockMovements.set(smId, movement);

    return wastageRecord;
  }

  // === INVENTORY DASHBOARD SUMMARY ===
  public async getInventoryDashboard(
    restaurantId: string,
  ): Promise<InventoryDashboardResponse> {
    const allIngredients = Array.from(this.ingredients.values()).filter(
      (i) => i.restaurantId === restaurantId && i.isActive,
    );

    allIngredients.forEach((i) => this.recalculateIngredientStatus(i));

    const totalIngredients = allIngredients.length;
    const lowStockAlerts = allIngredients.filter(
      (i) => i.stockStatus === 'LOW_STOCK' || i.stockStatus === 'OUT_OF_STOCK',
    );
    const lowStockCount = allIngredients.filter((i) => i.stockStatus === 'LOW_STOCK').length;
    const outOfStockCount = allIngredients.filter((i) => i.stockStatus === 'OUT_OF_STOCK').length;

    const totalInventoryValue = Number(
      allIngredients.reduce((s, i) => s + i.stockValue, 0).toFixed(2),
    );

    // Purchases this month
    const purchases = Array.from(this.purchases.values()).filter(
      (p) => p.restaurantId === restaurantId,
    );
    const purchasesThisPeriod = Number(
      purchases.reduce((s, p) => s + p.totalAmount, 0).toFixed(2),
    );

    // Wastage this month
    const wastages = Array.from(this.wastageRecords.values()).filter(
      (w) => w.restaurantId === restaurantId,
    );
    const wastageThisPeriod = Number(
      wastages.reduce((s, w) => s + w.totalCost, 0).toFixed(2),
    );

    // Top purchased ingredients
    const purchasedMap = new Map<string, { name: string; quantity: number; unit: string; totalCost: number }>();
    for (const p of purchases) {
      for (const it of p.items) {
        const cur = purchasedMap.get(it.ingredientId) || {
          name: it.ingredientName || 'Ingredient',
          quantity: 0,
          unit: it.unit,
          totalCost: 0,
        };
        cur.quantity += it.quantity;
        cur.totalCost += it.totalCost;
        purchasedMap.set(it.ingredientId, cur);
      }
    }
    const topPurchased = Array.from(purchasedMap.entries())
      .map(([ingredientId, val]) => ({
        ingredientId,
        name: val.name,
        quantity: Number(val.quantity.toFixed(2)),
        unit: val.unit,
        totalCost: Number(val.totalCost.toFixed(2)),
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5);

    // Top wasted ingredients
    const wastedMap = new Map<string, { name: string; quantity: number; unit: string; totalCost: number }>();
    for (const w of wastages) {
      const cur = wastedMap.get(w.ingredientId) || {
        name: w.ingredientName || 'Ingredient',
        quantity: 0,
        unit: w.unit,
        totalCost: 0,
      };
      cur.quantity += w.quantity;
      cur.totalCost += w.totalCost;
      wastedMap.set(w.ingredientId, cur);
    }
    const topWasted = Array.from(wastedMap.entries())
      .map(([ingredientId, val]) => ({
        ingredientId,
        name: val.name,
        quantity: Number(val.quantity.toFixed(2)),
        unit: val.unit,
        totalCost: Number(val.totalCost.toFixed(2)),
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5);

    // Recent 10 stock movements
    const recentMovements = await this.getStockMovements(restaurantId);

    return {
      totalIngredients,
      lowStockCount,
      outOfStockCount,
      totalInventoryValue,
      purchasesThisPeriod,
      wastageThisPeriod,
      lowStockAlerts: lowStockAlerts.map((i) => ({ ...i })),
      topPurchased,
      topWasted,
      recentMovements: recentMovements.slice(0, 10),
      settings: {
        inventoryTrackingEnabled: true,
        stockEnforcementEnabled: false,
      },
    };
  }

  // ==========================================
  // STAFF MANAGEMENT & RBAC (MODULE 9A)
  // ==========================================

  private sanitizeStaff(entity: StaffUserEntity): StaffUser {
    const { passwordHash, passwordSalt, ...sanitized } = entity;
    return { ...sanitized };
  }

  public countActiveOwners(restaurantId: string): number {
    let count = 0;
    for (const staff of this.staffUsers.values()) {
      if (staff.restaurantId === restaurantId && staff.role === 'OWNER' && staff.isActive) {
        count++;
      }
    }
    return count;
  }

  public async getStaffById(id: string, restaurantId?: string): Promise<StaffUser | null> {
    const staff = this.staffUsers.get(id);
    if (!staff) return null;
    if (restaurantId && staff.restaurantId !== restaurantId) return null;
    return this.sanitizeStaff(staff);
  }

  public async getStaffEntityById(id: string): Promise<StaffUserEntity | null> {
    const staff = this.staffUsers.get(id);
    if (!staff) return null;
    return { ...staff };
  }

  public async getStaffEntityByIdentifier(
    identifier: string,
    restaurantId?: string,
  ): Promise<StaffUserEntity | null> {
    const norm = identifier.trim().toLowerCase();
    const cleanMobile = identifier.replace(/[^\d+]/g, '');

    for (const staff of this.staffUsers.values()) {
      if (restaurantId && staff.restaurantId !== restaurantId) {
        continue;
      }
      if (
        staff.email.toLowerCase() === norm ||
        staff.mobileNumber.replace(/[^\d+]/g, '') === cleanMobile
      ) {
        return { ...staff };
      }
    }
    return null;
  }

  public async getStaffByRestaurant(
    restaurantId: string,
    options?: { role?: StaffRole; search?: string; isActive?: boolean },
  ): Promise<StaffUser[]> {
    let list: StaffUserEntity[] = [];
    for (const staff of this.staffUsers.values()) {
      if (staff.restaurantId === restaurantId) {
        list.push({ ...staff });
      }
    }

    if (options?.role) {
      list = list.filter((s) => s.role === options.role);
    }

    if (options?.isActive !== undefined) {
      list = list.filter((s) => s.isActive === options.isActive);
    }

    if (options?.search) {
      const q = options.search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.mobileNumber.includes(q) ||
          s.role.toLowerCase().includes(q),
      );
    }

    // Sort owners first, then managers, then cashiers, etc., then by name
    const roleRank: Record<StaffRole, number> = {
      OWNER: 1,
      MANAGER: 2,
      CASHIER: 3,
      KITCHEN: 4,
      WAITER: 5,
    };

    list.sort((a, b) => {
      const diff = (roleRank[a.role] || 99) - (roleRank[b.role] || 99);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });

    return list.map((s) => this.sanitizeStaff(s));
  }

  public async getStaffEntitiesByRestaurant(restaurantId: string): Promise<StaffUserEntity[]> {
    const list: StaffUserEntity[] = [];
    for (const staff of this.staffUsers.values()) {
      if (staff.restaurantId === restaurantId) {
        list.push({ ...staff });
      }
    }
    return list;
  }

  public async createStaff(dto: CreateStaffDTO): Promise<StaffUser> {
    const restaurant = await this.getRestaurantById(dto.restaurantId);
    if (!restaurant) {
      throw new Error(`Restaurant with id "${dto.restaurantId}" not found`);
    }

    const normEmail = dto.email.trim().toLowerCase();
    const cleanMobile = dto.mobileNumber.trim();

    // Check for duplicate email in this restaurant
    for (const s of this.staffUsers.values()) {
      if (s.restaurantId === dto.restaurantId && s.email.toLowerCase() === normEmail) {
        throw new Error(`A staff member with email "${normEmail}" already exists in this restaurant.`);
      }
    }

    const salt = generateSalt();
    const hash = hashPassword(dto.password, salt);
    const id = `stf-${Date.now().toString(36)}-${++this.staffCounter}`;
    const now = new Date().toISOString();

    const newStaff: StaffUserEntity = {
      id,
      restaurantId: dto.restaurantId,
      name: dto.name.trim(),
      email: normEmail,
      mobileNumber: cleanMobile,
      role: dto.role,
      passwordSalt: salt,
      passwordHash: hash,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.staffUsers.set(id, newStaff);
    return this.sanitizeStaff(newStaff);
  }

  public async updateStaff(
    id: string,
    restaurantId: string,
    updates: UpdateStaffDTO,
    actorStaffId?: string,
    _actorRole?: StaffRole,
  ): Promise<StaffUser> {
    const current = this.staffUsers.get(id);
    if (!current) {
      throw new Error(`Staff member with ID "${id}" not found.`);
    }
    if (current.restaurantId !== restaurantId) {
      throw new Error(`Forbidden: Staff member does not belong to restaurant "${restaurantId}".`);
    }

    // Privilege escalation check: Staff cannot change their own role
    if (actorStaffId && actorStaffId === id && updates.role && updates.role !== current.role) {
      throw new Error('Privilege violation: You cannot change your own role.');
    }

    // Last OWNER protection rule: Cannot deactivate or demote the last active owner
    const isOwnerCurrently = current.role === 'OWNER' && current.isActive;
    const isDemotingOrDeactivating =
      (updates.role && updates.role !== 'OWNER') || updates.isActive === false;

    if (isOwnerCurrently && isDemotingOrDeactivating) {
      const activeOwnersCount = this.countActiveOwners(restaurantId);
      if (activeOwnersCount <= 1) {
        throw new Error(
          'Safety protection: Cannot deactivate or demote the last active Owner of this restaurant.',
        );
      }
    }

    // Check email uniqueness if email updated
    if (updates.email) {
      const normEmail = updates.email.trim().toLowerCase();
      for (const s of this.staffUsers.values()) {
        if (
          s.id !== id &&
          s.restaurantId === restaurantId &&
          s.email.toLowerCase() === normEmail
        ) {
          throw new Error(`Email "${normEmail}" is already used by another staff member.`);
        }
      }
      current.email = normEmail;
    }

    if (updates.name !== undefined) current.name = updates.name.trim();
    if (updates.mobileNumber !== undefined) current.mobileNumber = updates.mobileNumber.trim();
    if (updates.role !== undefined) current.role = updates.role;
    if (updates.isActive !== undefined) current.isActive = updates.isActive;
    current.updatedAt = new Date().toISOString();

    this.staffUsers.set(id, current);
    return this.sanitizeStaff(current);
  }

  public async updateStaffPassword(id: string, newPasswordPlain: string): Promise<boolean> {
    const staff = this.staffUsers.get(id);
    if (!staff) return false;

    const salt = generateSalt();
    const hash = hashPassword(newPasswordPlain, salt);
    staff.passwordSalt = salt;
    staff.passwordHash = hash;
    staff.updatedAt = new Date().toISOString();
    this.staffUsers.set(id, staff);
    return true;
  }

  public async updateStaffLastLogin(id: string): Promise<void> {
    const staff = this.staffUsers.get(id);
    if (staff) {
      staff.lastLoginAt = new Date().toISOString();
      this.staffUsers.set(id, staff);
    }
  }

  public async deactivateStaff(id: string, restaurantId: string, actorStaffId?: string): Promise<StaffUser> {
    return this.updateStaff(id, restaurantId, { isActive: false }, actorStaffId);
  }
}

export const repository = new InMemoryRepository();

