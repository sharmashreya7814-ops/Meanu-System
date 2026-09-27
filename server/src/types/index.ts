export type OrderStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'CANCELLED';

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';

export type ThemePreset = 'VEG_THEME' | 'NON_VEG_THEME' | 'CUSTOM';

export interface ThemeConfig {
  preset: ThemePreset;
  restaurantName: string;
  restaurantLogo: string;
  tagline?: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    bgPrimary: string;
    bgSecondary: string;
    bgCard: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    surfaceElevated: string;
  };
  typography: {
    headingFont: string; // e.g. "Fraunces, serif" or "Syne, sans-serif"
    bodyFont: string;
    style: 'classic' | 'modern' | 'minimal' | 'rustic';
  };
  cardStyle: 'glassmorphism' | 'elevated' | 'bordered' | 'minimal';
  buttonStyle: 'rounded-pill' | 'rounded-lg' | 'sharp' | 'glow';
  animationStyle: 'smooth' | 'energetic' | 'subtle';
  foodPresentationStyle: 'grid-modern' | 'editorial-list' | 'showcase-cards';
  heroBannerUrl?: string;
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string;
  coverImageUrl: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  serviceFeeRate: number;
  upiId?: string;
  upiMerchantName?: string;
  allowUpiQr?: boolean;
  allowOnlineGateway?: boolean;
  inventoryTrackingEnabled?: boolean;
  stockEnforcementEnabled?: boolean;
  themePreset: ThemePreset;
  themeConfig: ThemeConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Table {
  id: string;
  restaurantId: string;
  tableNumber: string;
  tableName: string;
  capacity: number;
  qrCodeUrl: string;
  status: TableStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  restaurantId: string;
  name: string;
  mobileNumber: string;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  image: string;
  price: number;
  costPrice?: number;
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured?: boolean;
  spicyLevel: number;
  preparationTimeMin: number;
  calories?: number;
  allergens: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  price: number;
  costPrice?: number;
  quantity: number;
  specialInstructions?: string;
  itemTotal: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  tableId: string;
  customerId: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  specialInstructions?: string;
  estimatedMinutes: number;
  acceptedAt?: string;
  preparedAt?: string;
  servedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  customer?: Customer;
  table?: Table;
}

export interface CreateCustomerSessionDTO {
  name: string;
  mobileNumber: string;
  tableId: string;
}

export interface CreateOrderDTO {
  tableId: string;
  customerId: string;
  specialInstructions?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
  }>;
}

export type BillPaymentStatus =
  | 'UNPAID'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

export interface Bill {
  id: string;
  billNumber: string;
  restaurantId: string;
  orderId: string;
  tableId: string;
  customerId: string;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentStatus: BillPaymentStatus;
  generatedAt: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  // Enriched relations
  order?: Order;
  restaurant?: Restaurant;
  table?: Table;
  customer?: Customer;
  items?: OrderItem[];
  payments?: Payment[];
}

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Payment {
  id: string;
  restaurantId: string;
  billId: string;
  orderId: string;
  provider: string; // e.g. "RAZORPAY", "MOCK_DEV"
  providerOrderId?: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  metadata?: any;
  // Enriched
  bill?: Bill;
  order?: Order;
  restaurant?: Restaurant;
}

export interface CreatePaymentOrderDTO {
  billNumber: string;
}

export interface VerifyPaymentDTO {
  paymentOrderId: string;
  paymentId: string;
  signature: string;
}

export type ExpenseCategory =
  | 'RENT'
  | 'SALARY'
  | 'ELECTRICITY'
  | 'GAS'
  | 'WATER'
  | 'INTERNET'
  | 'PACKAGING'
  | 'DELIVERY'
  | 'MARKETING'
  | 'MAINTENANCE'
  | 'SUPPLIES'
  | 'OTHER';

export type ExpensePaymentMethod =
  | 'CASH'
  | 'UPI'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'OTHER';

export interface Expense {
  id: string;
  restaurantId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseDTO {
  restaurantId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod;
  notes?: string;
}

export interface UpdateExpenseDTO {
  category?: ExpenseCategory;
  description?: string;
  amount?: number;
  expenseDate?: string;
  paymentMethod?: ExpensePaymentMethod;
  notes?: string;
}

export interface ProductPerformanceItem {
  menuItemId: string;
  name: string;
  categoryName: string;
  isVeg: boolean;
  quantitySold: number;
  sales: number;
  foodCost: number;
  grossContribution: number;
  marginPercentage: number;
}

export interface CategoryPerformanceItem {
  categoryId: string;
  name: string;
  quantitySold: number;
  sales: number;
  foodCost: number;
  grossContribution: number;
  marginPercentage: number;
}

export interface SalesTrendItem {
  date: string;
  label: string;
  sales: number;
  grossProfit: number;
  foodCost: number;
  orders: number;
}

export interface PeakHourItem {
  hour: number;
  label: string;
  orders: number;
  sales: number;
}

export interface PeakDayItem {
  dayOfWeek: number;
  dayName: string;
  shortName: string;
  orders: number;
  sales: number;
}

export interface ExpenseCategoryBreakdown {
  category: ExpenseCategory;
  categoryLabel: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface FinancialAnalyticsResponse {
  period: {
    preset?: string;
    startDate: string;
    endDate: string;
    timezone: string;
  };
  currency: string;
  currencySymbol: string;
  sales: {
    orderCount: number;
    grossSales: number;
    discountAmount: number;
    taxAmount: number;
    netSales: number;
    averageOrderValue: number;
  };
  costs: {
    foodCost: number;
    foodCostPercentage: number;
    operatingExpenses: number;
  };
  profit: {
    grossProfit: number;
    grossMarginPercentage: number;
    estimatedNetProfit: number;
    netMarginPercentage: number;
  };
  payments: {
    paidAmount: number;
    unpaidAmount: number;
    online: number;
    upiQr: number;
    cash: number;
    card: number;
    other: number;
    totalCollected: number;
  };
  orders: {
    total: number;
    completed: number;
    cancelled: number;
    active: number;
  };
  productPerformance: {
    bestSellers: ProductPerformanceItem[];
    lowPerformers: ProductPerformanceItem[];
    allItems: ProductPerformanceItem[];
  };
  categoryPerformance: CategoryPerformanceItem[];
  salesTrend: SalesTrendItem[];
  peakHours: PeakHourItem[];
  peakDays: PeakDayItem[];
  vegNonVeg: {
    veg: {
      quantity: number;
      sales: number;
      foodCost: number;
      grossProfit: number;
    };
    nonVeg: {
      quantity: number;
      sales: number;
      foodCost: number;
      grossProfit: number;
    };
  };
  expenseBreakdown: ExpenseCategoryBreakdown[];
}

export interface MetricComparison {
  current: number;
  previous: number;
  absoluteChange: number;
  percentageChange: number | null; // null if previous was 0
  isPositive: boolean;
  formattedChange: string;
}

export interface CustomerAnalytics {
  totalUniqueCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  repeatCustomerPercentage: number;
  ordersPerCustomer: number;
  averageCustomerSpend: number;
}

export interface OrderOperationalAnalytics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  activeOrders: number;
  cancellationRate: number;
  averageItemsPerOrder: number;
  averageOrderValue: number;
  statusDistribution: Array<{
    status: OrderStatus;
    count: number;
    percentage: number;
  }>;
}

export interface PaymentMethodBreakdownItem {
  method: string;
  label: string;
  amount: number;
  count: number;
  percentageOfSettled: number;
}

export interface SalesGrowthTrendItem {
  index: number;
  dateCurrent: string;
  labelCurrent: string;
  salesCurrent: number;
  ordersCurrent: number;
  datePrevious?: string;
  labelPrevious?: string;
  salesPrevious: number;
  ordersPrevious: number;
}

export interface BusinessReportResponse {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    currencySymbol: string;
    timezone: string;
  };
  period: {
    preset?: string;
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
    generatedAt: string;
  };
  executiveKPIs: {
    grossSales: MetricComparison;
    discountAmount: MetricComparison;
    netSales: MetricComparison;
    foodCost: MetricComparison;
    grossProfit: MetricComparison;
    operatingExpenses: MetricComparison;
    estimatedNetProfit: MetricComparison;
    ordersCount: MetricComparison;
    averageOrderValue: MetricComparison;
    foodCostPercentage: MetricComparison;
    grossMarginPercentage: MetricComparison;
    netMarginPercentage: MetricComparison;
    taxCollected: MetricComparison;
    paidCollections: MetricComparison;
    unpaidAmount: MetricComparison;
  };
  financialCurrent: FinancialAnalyticsResponse;
  financialPrevious: FinancialAnalyticsResponse;
  salesGrowth: {
    trendComparison: SalesGrowthTrendItem[];
    currentTotalSales: number;
    previousTotalSales: number;
    salesDiff: number;
    salesGrowthPct: number | null;
    ordersDiff: number;
    ordersGrowthPct: number | null;
    aovDiff: number;
    aovGrowthPct: number | null;
  };
  productProfitability: {
    topSellingByQuantity: ProductPerformanceItem[];
    topByGrossContribution: ProductPerformanceItem[];
    lowestSellingByQuantity: ProductPerformanceItem[];
    lowestByGrossContribution: ProductPerformanceItem[];
    allProducts: ProductPerformanceItem[];
  };
  categoryPerformance: CategoryPerformanceItem[];
  vegNonVeg: {
    veg: {
      quantity: number;
      sales: number;
      foodCost: number;
      grossContribution: number;
      contributionPercentage: number;
    };
    nonVeg: {
      quantity: number;
      sales: number;
      foodCost: number;
      grossContribution: number;
      contributionPercentage: number;
    };
  };
  peakHours: Array<{
    hour: number;
    label: string;
    orders: number;
    sales: number;
    aov: number;
  }>;
  peakDays: Array<{
    dayOfWeek: number;
    dayName: string;
    shortName: string;
    orders: number;
    sales: number;
    aov: number;
    grossContribution: number;
  }>;
  customers: CustomerAnalytics;
  ordersOperational: OrderOperationalAnalytics;
  paymentsBreakdown: {
    totalSettled: number;
    unpaidAmount: number;
    methods: PaymentMethodBreakdownItem[];
  };
  expensesBreakdown: ExpenseCategoryBreakdown[];
}

// === INVENTORY & RECIPES TYPES ===
export type IngredientUnit =
  | 'GRAM'
  | 'KILOGRAM'
  | 'MILLILITER'
  | 'LITER'
  | 'PIECE'
  | 'PACK'
  | 'BOTTLE'
  | 'BOX'
  | 'OTHER';

export type IngredientCategory =
  | 'VEGETABLE'
  | 'FRUIT'
  | 'GRAIN'
  | 'DAIRY'
  | 'MEAT'
  | 'SEAFOOD'
  | 'SPICE'
  | 'OIL'
  | 'BEVERAGE'
  | 'PACKAGING'
  | 'OTHER';

export type StockMovementType =
  | 'PURCHASE'
  | 'ORDER_CONSUMPTION'
  | 'WASTAGE'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'RETURN'
  | 'INITIAL_STOCK';

export type WastageReason =
  | 'SPOILAGE'
  | 'KITCHEN_ERROR'
  | 'DAMAGED'
  | 'EXPIRED'
  | 'OVERPRODUCTION'
  | 'OTHER';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface Ingredient {
  id: string;
  restaurantId: string;
  name: string;
  sku?: string;
  unit: IngredientUnit;
  category: IngredientCategory;
  currentStock: number;
  minimumStock: number;
  reorderLevel: number;
  costPerUnit: number;
  stockStatus: StockStatus;
  stockValue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIngredientDTO {
  restaurantId: string;
  name: string;
  sku?: string;
  unit: IngredientUnit;
  category: IngredientCategory;
  currentStock?: number;
  minimumStock?: number;
  reorderLevel?: number;
  costPerUnit?: number;
}

export interface UpdateIngredientDTO {
  name?: string;
  sku?: string;
  unit?: IngredientUnit;
  category?: IngredientCategory;
  currentStock?: number;
  minimumStock?: number;
  reorderLevel?: number;
  costPerUnit?: number;
  isActive?: boolean;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId: string;
  ingredientName?: string;
  quantity: number;
  unit: IngredientUnit;
  costPerUnit?: number;
  totalCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Recipe {
  id: string;
  restaurantId: string;
  menuItemId: string;
  menuItemName?: string;
  name: string;
  yieldQuantity: number;
  yieldUnit: string;
  instructions?: string;
  ingredients: RecipeIngredient[];
  estimatedCost: number;
  isCostComplete: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecipeIngredientDTO {
  ingredientId: string;
  quantity: number;
  unit: IngredientUnit;
}

export interface CreateRecipeDTO {
  restaurantId: string;
  menuItemId: string;
  name: string;
  yieldQuantity?: number;
  yieldUnit?: string;
  instructions?: string;
  ingredients: CreateRecipeIngredientDTO[];
}

export interface UpdateRecipeDTO {
  name?: string;
  yieldQuantity?: number;
  yieldUnit?: string;
  instructions?: string;
  ingredients?: CreateRecipeIngredientDTO[];
  isActive?: boolean;
}

export interface Supplier {
  id: string;
  restaurantId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDTO {
  restaurantId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
}

export interface UpdateSupplierDTO {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
  isActive?: boolean;
}

export interface PurchaseItemDTO {
  ingredientId: string;
  quantity: number;
  unit: IngredientUnit;
  unitCost: number;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  ingredientId: string;
  ingredientName?: string;
  quantity: number;
  unit: IngredientUnit;
  unitCost: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  restaurantId: string;
  supplierId?: string;
  supplierName?: string;
  invoiceNumber?: string;
  purchaseDate: string;
  totalAmount: number;
  items: PurchaseItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseDTO {
  restaurantId: string;
  supplierId?: string;
  invoiceNumber?: string;
  purchaseDate?: string;
  notes?: string;
  items: PurchaseItemDTO[];
}

export interface StockMovement {
  id: string;
  restaurantId: string;
  ingredientId: string;
  ingredientName?: string;
  movementType: StockMovementType;
  quantity: number;
  unit: IngredientUnit;
  unitCost: number;
  totalCost: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  movementDate: string;
  createdAt: string;
}

export interface CreateStockAdjustmentDTO {
  restaurantId: string;
  ingredientId: string;
  adjustmentType: 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';
  quantity: number;
  reason?: string;
  notes?: string;
}

export interface CreateStockCountDTO {
  restaurantId: string;
  ingredientId: string;
  physicalStock: number;
  notes?: string;
}

export interface WastageRecord {
  id: string;
  restaurantId: string;
  ingredientId: string;
  ingredientName?: string;
  quantity: number;
  unit: IngredientUnit;
  costPerUnit: number;
  totalCost: number;
  reason: WastageReason;
  notes?: string;
  wastageDate: string;
  createdAt: string;
}

export interface CreateWastageDTO {
  restaurantId: string;
  ingredientId: string;
  quantity: number;
  reason: WastageReason;
  notes?: string;
  wastageDate?: string;
}

export interface InventoryDashboardResponse {
  totalIngredients: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  purchasesThisPeriod: number;
  wastageThisPeriod: number;
  lowStockAlerts: Ingredient[];
  topPurchased: Array<{ ingredientId: string; name: string; quantity: number; unit: string; totalCost: number }>;
  topWasted: Array<{ ingredientId: string; name: string; quantity: number; unit: string; totalCost: number }>;
  recentMovements: StockMovement[];
  settings: {
    inventoryTrackingEnabled: boolean;
    stockEnforcementEnabled: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

// === STAFF MANAGEMENT & RBAC (MODULE 9A) ===
export type StaffRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'KITCHEN' | 'WAITER';

export type StaffPermission =
  | 'STAFF_VIEW'
  | 'STAFF_MANAGE'
  | 'ROLE_MANAGE'
  | 'RESTAURANT_MANAGE'
  | 'MENU_VIEW'
  | 'MENU_MANAGE'
  | 'CATEGORY_MANAGE'
  | 'TABLE_VIEW'
  | 'TABLE_MANAGE'
  | 'ORDER_VIEW'
  | 'ORDER_MANAGE'
  | 'BILLING_VIEW'
  | 'BILLING_MANAGE'
  | 'PAYMENT_VIEW'
  | 'PAYMENT_VERIFY'
  | 'EXPENSE_VIEW'
  | 'EXPENSE_MANAGE'
  | 'FINANCIAL_VIEW'
  | 'REPORT_VIEW'
  | 'INVENTORY_VIEW'
  | 'INVENTORY_MANAGE'
  | 'RECIPE_VIEW'
  | 'RECIPE_MANAGE'
  | 'KDS_VIEW'
  | 'KDS_UPDATE';

export interface StaffUser {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  mobileNumber: string;
  role: StaffRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffUserEntity extends StaffUser {
  passwordHash: string;
  passwordSalt: string;
}

export interface CurrentUserResponse {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  role: StaffRole;
  restaurantId: string;
  permissions: StaffPermission[];
  isActive: boolean;
  lastLoginAt?: string;
  restaurant?: Restaurant;
}

export interface StaffAuthResponse {
  user: StaffUser;
  token: string;
  permissions: StaffPermission[];
  restaurant: Restaurant;
}

export interface CreateStaffDTO {
  restaurantId: string;
  name: string;
  email: string;
  mobileNumber: string;
  password: string;
  role: StaffRole;
}

export interface UpdateStaffDTO {
  name?: string;
  email?: string;
  mobileNumber?: string;
  role?: StaffRole;
  isActive?: boolean;
}

export interface UpdateStaffPasswordDTO {
  currentPassword?: string;
  newPassword: string;
}

export interface StaffLoginDTO {
  identifier: string; // email or mobileNumber
  password: string;
  restaurantId?: string;
}
