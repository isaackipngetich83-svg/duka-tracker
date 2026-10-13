import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Shop, Product, Customer, Sale, DebtPayment } from '../types/index.ts';

// Get credentials from environment variables or custom local storage override
export function getSupabaseCredentials(): { url: string; key: string } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  const localUrl = localStorage.getItem('duka_supabase_url') || '';
  const localKey = localStorage.getItem('duka_supabase_key') || '';

  return {
    url: localUrl || envUrl,
    key: localKey || envKey,
  };
}

export function normalizeSupabaseUrl(inputUrl: string): string {
  let clean = inputUrl.trim().replace(/\/+$/, '');
  if (!clean) return '';
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  // If user pasted just project ID or ref like https://cnfjbdwsnvqarqeyxwwl without domain
  try {
    const parsed = new URL(clean);
    if (!parsed.hostname.includes('.')) {
      // It's a bare reference ID like 'https://cnfjbdwsnvqarqeyxwwl'
      clean = `https://${parsed.hostname}.supabase.co`;
    }
  } catch {
    // If invalid URL structure, check if it's alphanumeric ref
    if (/^[a-z0-9]+$/i.test(clean)) {
      clean = `https://${clean}.supabase.co`;
    }
  }
  return clean;
}

export function saveSupabaseCredentials(url: string, key: string): void {
  const normalizedUrl = normalizeSupabaseUrl(url);
  localStorage.setItem('duka_supabase_url', normalizedUrl);
  localStorage.setItem('duka_supabase_key', key.trim());
  cachedClient = null; // Reset cached client on new credentials
}

export function clearSupabaseCredentials(): void {
  localStorage.removeItem('duka_supabase_url');
  localStorage.removeItem('duka_supabase_key');
  cachedClient = null;
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    key.length > 20 &&
    !url.includes('your-project-id')
  );
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return cachedClient;
}

// -------------------------------------------------------------
// Cloud Sync Services (PostgreSQL + RLS)
// -------------------------------------------------------------

export const SupabaseSync = {
  /**
   * Test database connectivity
   */
  async testConnection(): Promise<{ success: boolean; message: string; suggestion?: string }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'Supabase credentials not configured' };
    }
    try {
      const { error } = await client.from('shops').select('id').limit(1);
      if (error) {
        let suggestion = '';
        const msg = (error.message || '').toLowerCase();
        const code = error.code || '';
        if (
          msg.includes('relation "public.shops" does not exist') ||
          msg.includes("could not find the 'shops' table") ||
          msg.includes("relation") ||
          code === '42P01' ||
          code === 'PGRST204' ||
          code === 'PGRST205'
        ) {
          suggestion = "Your Supabase project is connected, but the PostgreSQL database tables haven't been created yet. Open the 'SQL Schema' tab, copy the SQL, and click Run in your Supabase SQL Editor.";
        } else if (msg.includes('jwt') || msg.includes('api key') || msg.includes('unauthorized') || code === 'PGRST301') {
          suggestion = "Invalid or expired Anon Public Key. In your Supabase dashboard, go to Project Settings → API and copy the 'anon public' key.";
        }
        return { success: false, message: error.message, suggestion };
      }
      return { success: true, message: 'Connected to Supabase PostgreSQL successfully!' };
    } catch (err: any) {
      const msg = err?.message || 'Connection failed';
      let suggestion = '';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Invalid path')) {
        suggestion = 'Could not reach Supabase. Ensure your Project URL is formatted as https://<project-ref>.supabase.co';
      }
      return { success: false, message: msg, suggestion };
    }
  },

  /**
   * Sync a Shop record to Supabase
   */
  async pushShop(shop: Shop): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    await client.from('shops').upsert({
      id: shop.id,
      name: shop.name,
      owner_name: shop.ownerName,
      phone_number: shop.phoneNumber,
      mpesa_type: shop.mpesaType,
      mpesa_number: shop.mpesaNumber,
      account_number: shop.accountNumber,
      currency: shop.currency,
      low_stock_default: shop.lowStockDefault,
      updated_at: new Date().toISOString(),
    });
  },

  /**
   * Sync a Product record to Supabase
   */
  async pushProduct(product: Product): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    await client.from('products').upsert({
      id: product.id,
      shop_id: product.shopId,
      name: product.name,
      category: product.category,
      buying_price: product.buyingPrice,
      selling_price: product.sellingPrice,
      quantity: product.quantity,
      low_stock_threshold: product.lowStockThreshold,
      unit: product.unit,
      barcode: product.barcode,
      updated_at: product.updatedAt,
    });
  },

  /**
   * Sync a Customer record to Supabase
   */
  async pushCustomer(customer: Customer): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    await client.from('customers').upsert({
      id: customer.id,
      shop_id: customer.shopId,
      name: customer.name,
      nickname: customer.nickname,
      phone_number: customer.phoneNumber,
      location_note: customer.locationNote,
      current_debt: customer.currentDebt,
      total_borrowed: customer.totalBorrowed,
      total_repaid: customer.totalRepaid,
      dpa_consented_at: customer.consent.consentedAt,
      dpa_consent_purpose: customer.consent.purpose,
      dpa_consented_via: customer.consent.consentedVia,
      updated_at: new Date().toISOString(),
    });
  },

  /**
   * Sync a Sale and its line items to Supabase
   */
  async pushSale(sale: Sale): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    // 1. Insert/Update Sale
    await client.from('sales').upsert({
      id: sale.id,
      shop_id: sale.shopId,
      receipt_number: sale.receiptNumber,
      customer_id: sale.customerId || null,
      customer_name: sale.customerName || null,
      payment_type: sale.paymentType,
      total_amount: sale.totalAmount,
      total_cost: sale.totalCost,
      gross_profit: sale.grossProfit,
      due_date: sale.dueDate || null,
      created_at: sale.createdAt,
    });

    // 2. Insert items
    if (sale.items && sale.items.length > 0) {
      const lineItems = sale.items.map(item => ({
        sale_id: sale.id,
        product_id: item.productId || null,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        buying_price: item.buyingPrice,
        total: item.total,
      }));
      await client.from('sale_items').upsert(lineItems);
    }
  },

  /**
   * Sync Debt Repayment
   */
  async pushDebtPayment(payment: DebtPayment): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    await client.from('debt_payments').upsert({
      id: payment.id,
      shop_id: payment.shopId,
      customer_id: payment.customerId,
      amount: payment.amount,
      method: payment.method,
      mpesa_code: payment.mpesaCode || null,
      note: payment.note || null,
      balance_before: payment.balanceBefore,
      balance_after: payment.balanceAfter,
      created_at: payment.paidAt,
    });
  },

  /**
   * Pull all cloud data for a shop
   */
  async pullAllShopData(shopId: string): Promise<{
    products: Product[];
    customers: Customer[];
    sales: Sale[];
    payments: DebtPayment[];
  } | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const [prodRes, custRes, salesRes, payRes] = await Promise.all([
        client.from('products').select('*').eq('shop_id', shopId),
        client.from('customers').select('*').eq('shop_id', shopId),
        client.from('sales').select('*, sale_items(*)').eq('shop_id', shopId).order('created_at', { ascending: false }),
        client.from('debt_payments').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }),
      ]);

      const products: Product[] = (prodRes.data || []).map(p => ({
        id: p.id,
        shopId: p.shop_id,
        name: p.name,
        category: p.category,
        buyingPrice: Number(p.buying_price),
        sellingPrice: Number(p.selling_price),
        quantity: Number(p.quantity),
        lowStockThreshold: Number(p.low_stock_threshold),
        unit: p.unit || 'pcs',
        barcode: p.barcode,
        updatedAt: p.updated_at,
      }));

      const customers: Customer[] = (custRes.data || []).map(c => ({
        id: c.id,
        shopId: c.shop_id,
        name: c.name,
        nickname: c.nickname,
        phoneNumber: c.phone_number,
        locationNote: c.location_note,
        currentDebt: Number(c.current_debt),
        totalBorrowed: Number(c.total_borrowed),
        totalRepaid: Number(c.total_repaid),
        createdAt: c.created_at,
        consent: {
          consentedAt: c.dpa_consented_at,
          purpose: c.dpa_consent_purpose || 'Credit tracking',
          actRef: 'Kenya Data Protection Act 2019 Section 30',
          consentedVia: c.dpa_consented_via || 'in_person_verbal',
        },
      }));

      const sales: Sale[] = (salesRes.data || []).map(s => ({
        id: s.id,
        shopId: s.shop_id,
        receiptNumber: s.receipt_number,
        customerId: s.customer_id,
        customerName: s.customer_name,
        paymentType: s.payment_type,
        totalAmount: Number(s.total_amount),
        totalCost: Number(s.total_cost),
        grossProfit: Number(s.gross_profit),
        dueDate: s.due_date,
        createdAt: s.created_at,
        items: (s.sale_items || []).map((i: any) => ({
          productId: i.product_id,
          productName: i.product_name,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unit_price),
          buyingPrice: Number(i.buying_price),
          total: Number(i.total),
        })),
      }));

      const payments: DebtPayment[] = (payRes.data || []).map(p => ({
        id: p.id,
        shopId: p.shop_id,
        customerId: p.customer_id,
        customerName: '',
        amount: Number(p.amount),
        method: p.method,
        mpesaCode: p.mpesa_code,
        note: p.note,
        balanceBefore: Number(p.balance_before),
        balanceAfter: Number(p.balance_after),
        paidAt: p.created_at,
      }));

      return { products, customers, sales, payments };
    } catch (error) {
      console.error('Failed to pull Supabase data:', error);
      return null;
    }
  },

  /**
   * Delete cloud mock/test data for a shop in Supabase PostgreSQL
   */
  async clearShopCloudData(
    shopId: string,
    options: { clearSales?: boolean; clearCustomers?: boolean; clearProducts?: boolean }
  ): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Supabase not connected' };

    try {
      if (options.clearSales) {
        // Delete sale_items, sales, and debt_payments for this shop
        await client.from('debt_payments').delete().eq('shop_id', shopId);
        await client.from('sales').delete().eq('shop_id', shopId);
      }
      if (options.clearCustomers) {
        await client.from('customers').delete().eq('shop_id', shopId);
      }
      if (options.clearProducts) {
        await client.from('products').delete().eq('shop_id', shopId);
      }
      return { success: true };
    } catch (err: any) {
      console.error('Failed to clear cloud data:', err);
      return { success: false, error: err?.message || 'Failed to clear cloud data' };
    }
  },
};
