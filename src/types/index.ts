/**
 * Duka Tracker - Data Models & Types
 * Designed for Kenyan dukas (small retail kiosks)
 */

export type PaymentMethod = 'cash' | 'credit' | 'mpesa';

export type TrustLevel = 'reliable' | 'fair' | 'risky' | 'new';

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  phoneNumber: string; // e.g. +254712345678
  mpesaType: 'till' | 'paybill' | 'send_money';
  mpesaNumber: string; // Buy Goods Till number or Paybill number
  accountNumber?: string; // For Paybill
  currency: string; // Defaults to KES
  lowStockDefault: number; // Default 5
  createdAt: string;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  category: string; // e.g., Unga & Flour, Drinks, Household, Airtime
  buyingPrice: number; // Cost in KES (for profit calculation)
  sellingPrice: number; // Selling price in KES
  quantity: number; // Current stock count
  lowStockThreshold: number; // Alert threshold (default 5)
  unit: string; // pcs, kg, packets, bales
  barcode?: string;
  updatedAt: string;
}

export interface CustomerConsent {
  consentedAt: string;
  purpose: string; // "Credit tracking & debt reminder communications"
  actRef: string; // "Kenya Data Protection Act 2019 Section 30"
  consentedVia: 'in_person_verbal' | 'written' | 'sms_opt_in';
}

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phoneNumber: string; // e.g. 0712345678
  nickname?: string; // e.g. "Mama Brian"
  locationNote?: string; // e.g. "Plot 4, Flat C"
  currentDebt: number; // Total balance owed in KES
  totalBorrowed: number; // Historical cumulative credit extended
  totalRepaid: number; // Historical cumulative repayments
  lastPaymentDate?: string;
  createdAt: string;
  consent: CustomerConsent;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  buyingPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  shopId: string;
  receiptNumber: string;
  items: SaleItem[];
  totalAmount: number;
  totalCost: number; // Sum of buyingPrice * quantity
  grossProfit: number; // totalAmount - totalCost
  paymentType: PaymentMethod;
  customerId?: string; // Present if credit sale
  customerName?: string;
  dueDate?: string; // If credit sale
  createdAt: string;
}

export interface DebtPayment {
  id: string;
  shopId: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: 'cash' | 'mpesa';
  mpesaCode?: string;
  note?: string;
  balanceBefore: number;
  balanceAfter: number;
  paidAt: string;
}

export interface TrustScoreMetrics {
  score: number; // 0 to 100
  level: TrustLevel;
  repaymentRate: number; // percentage (repaid / borrowed)
  creditCount: number;
  label: string;
  labelSwahili: string;
  colorClass: string;
  description: string;
}
