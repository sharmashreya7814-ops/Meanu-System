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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}
