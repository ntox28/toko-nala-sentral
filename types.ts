export enum ProductSize {
  KECIL = 'Kecil',
  SEDANG = 'Sedang',
  BESAR = 'Besar',
  BUNGKUS = 'Bungkus',
}

export interface Size {
    id: string;
    name: string;
}

export enum PaymentMethod {
  TUNAI = 'Tunai',
  QRIS = 'QRIS',
  EWALLET = 'E-Wallet',
}

export enum View {
  DASHBOARD = 'Dashboard',
  POS = 'POS',
  EXPENSES = 'Expenses',
  PRODUCTS = 'Products',
  REPORTS = 'Reports',
  SETTINGS = 'Settings',
  DATA_MANAGEMENT = 'Data Management',
  PRICING_CALCULATOR = 'Pricing Calculator',
}

export enum ExpenseCategory {
    OPERASIONAL = 'Operasional',
    BAHAN_BAKU = 'Bahan Baku',
    LAINNYA = 'Lainnya'
}

export enum UserRole {
    ADMIN = 'Admin',
    KASIR = 'Kasir'
}

// Corresponds to the 'users' table in Supabase
export interface User {
    id: string; // UUID from Supabase Auth
    name: string;
    pin?: string; // Kept for type compatibility, but auth is handled by Supabase Auth
    role: UserRole;
    allowed_views?: View[]; // Added to allow admins to define which menus a user can access
    created_at?: string;
}

// Corresponds to the 'expenses' table
export interface Expense {
    id: string;
    date: string; // ISO string
    description: string;
    amount: number;
    category: ExpenseCategory;
    created_at?: string;
}

// Corresponds to the 'products' table
export interface Product {
  id: string;
  name: string;
  barcode?: string;
  size: string; // Changed from ProductSize to string for dynamic sizes
  price: number;
  cost_price: number; // Added cost_price
  stock: number; // Added stock
  low_stock_threshold: number; // Added low_stock_threshold
  use_stock: boolean; // Added use_stock toggle
  is_active: boolean;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  size: string; // Changed from ProductSize to string
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// Corresponds to the 'transaction_details' table
export interface TransactionDetail {
  id: string;
  transaction_id: string;
  product_id: string | null;
  product_name?: string; // For manual items or to lock name
  product_size?: string; // For manual items or to lock size
  quantity: number;
  unit_price: number;
  cost_price: number; // Added cost_price to lock it at transaction time
  subtotal: number;
}

// Corresponds to the 'transactions' table
export interface Transaction {
  id: string;
  transaction_code: string;
  date: string; // ISO string
  cashier_id: string; // UUID of the user
  cashier_name?: string; // Fetched for display
  total: number;
  discount_type?: 'percent' | 'nominal';
  discount_value?: number;
  discount_amount?: number;
  payment_method: PaymentMethod;
  amount_received?: number;
  change?: number;
  details: TransactionDetail[]; // For frontend use, populated from transaction_details table
}