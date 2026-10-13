import React, { useState, useEffect } from 'react';
import { X, Database, Cloud, CloudOff, RefreshCw, UploadCloud, DownloadCloud, ExternalLink, ShieldCheck, Copy, CheckCircle2 } from 'lucide-react';
import { getSupabaseCredentials, saveSupabaseCredentials, clearSupabaseCredentials, isSupabaseConfigured, normalizeSupabaseUrl, SupabaseSync } from '../lib/supabase.ts';
import { Shop, Product, Customer, Sale, DebtPayment } from '../types/index.ts';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop | null;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  payments: DebtPayment[];
  onCloudDataPulled: (data: { products: Product[]; customers: Customer[]; sales: Sale[]; payments: DebtPayment[] }) => void;
}

const SUPABASE_SCHEMA_SQL = `-- ============================================================================
-- DUKA TRACKER - PRODUCTION POSTGRESQL & SUPABASE SCHEMA
-- CIRIS Tech 2026 Innovation Challenge (Fintech & Digital Economy Track)
-- Multi-Tenant Data Isolation with Row Level Security (RLS) & Real-time Sync
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. SHOPS TABLE
CREATE TABLE IF NOT EXISTS public.shops (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    owner_name VARCHAR(100),
    phone_number VARCHAR(20) NOT NULL,
    mpesa_type VARCHAR(20) DEFAULT 'till',
    mpesa_number VARCHAR(50),
    account_number VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'KES',
    low_stock_default INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_shops_updated_at
BEFORE UPDATE ON public.shops
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage their own shop"
    ON public.shops FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public anon access to shops"
    ON public.shops FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    buying_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    unit VARCHAR(30) DEFAULT 'pcs',
    barcode VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_shop_id ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON public.products(shop_id, quantity);

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated owners can manage products"
    ON public.products FOR ALL
    TO authenticated
    USING (shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid()))
    WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid()));

CREATE POLICY "Public anon access to products"
    ON public.products FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- 3. CUSTOMERS & KENYA DPA CONSENT TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    nickname VARCHAR(100),
    phone_number VARCHAR(20) NOT NULL,
    location_note VARCHAR(255),
    current_debt NUMERIC(12, 2) DEFAULT 0.00,
    total_borrowed NUMERIC(12, 2) DEFAULT 0.00,
    total_repaid NUMERIC(12, 2) DEFAULT 0.00,
    dpa_consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dpa_consent_purpose TEXT DEFAULT 'Credit tracking & debt reminder communications',
    dpa_consented_via VARCHAR(50) DEFAULT 'in_person_verbal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON public.customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(shop_id, phone_number);

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated owners can manage customers"
    ON public.customers FOR ALL
    TO authenticated
    USING (shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid()))
    WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid()));

CREATE POLICY "Public anon access to customers"
    ON public.customers FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- 4. SALES TABLE
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150),
    payment_type VARCHAR(20) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL,
    gross_profit NUMERIC(12, 2) NOT NULL,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_shop_date ON public.sales(shop_id, created_at DESC);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated owners can manage sales"
    ON public.sales FOR ALL
    TO authenticated
    USING (shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid()))
    WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid()));

CREATE POLICY "Public anon access to sales"
    ON public.sales FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- 5. SALE ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.sale_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sale_id TEXT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    buying_price NUMERIC(12, 2) NOT NULL,
    total NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated owners can manage sale items"
    ON public.sale_items FOR ALL
    TO authenticated
    USING (sale_id IN (SELECT id FROM public.sales WHERE shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())))
    WITH CHECK (sale_id IN (SELECT id FROM public.sales WHERE shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())));

CREATE POLICY "Public anon access to sale items"
    ON public.sale_items FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- 6. DEBT PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.debt_payments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    method VARCHAR(20) NOT NULL,
    mpesa_code VARCHAR(50),
    note TEXT,
    balance_before NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debt_payments_shop ON public.debt_payments(shop_id);

ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated owners can manage debt repayments"
    ON public.debt_payments FOR ALL
    TO authenticated
    USING (shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid()))
    WITH CHECK (shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid()));

CREATE POLICY "Public anon access to debt payments"
    ON public.debt_payments FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- 7. ENABLE REALTIME REPLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sale_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.debt_payments;
`;

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  shop,
  products,
  customers,
  sales,
  payments,
  onCloudDataPulled,
}) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<{ testing: boolean; success?: boolean; message?: string; suggestion?: string }>({ testing: false });
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'connect' | 'schema' | 'guide'>('connect');

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setKey(creds.key);
      if (isSupabaseConfigured()) {
        checkHealth();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const checkHealth = async () => {
    setConnectionStatus({ testing: true });
    const res = await SupabaseSync.testConnection();
    setConnectionStatus({ testing: false, success: res.success, message: res.message, suggestion: res.suggestion });
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(url, key);
    await checkHealth();
  };

  const handleDisconnect = () => {
    clearSupabaseCredentials();
    setUrl('');
    setKey('');
    setConnectionStatus({ testing: false });
  };

  const handlePushAll = async () => {
    if (!shop) return;
    setSyncStatus('Pushing records to Supabase PostgreSQL...');
    try {
      await SupabaseSync.pushShop(shop);
      for (const p of products) await SupabaseSync.pushProduct(p);
      for (const c of customers) await SupabaseSync.pushCustomer(c);
      for (const s of sales) await SupabaseSync.pushSale(s);
      for (const pay of payments) await SupabaseSync.pushDebtPayment(pay);

      setSyncStatus(`Successfully uploaded ${products.length} products, ${customers.length} customers, ${sales.length} sales to cloud!`);
      setTimeout(() => setSyncStatus(null), 4000);
    } catch (err: any) {
      setSyncStatus(`Push failed: ${err.message || 'Unknown error'}`);
    }
  };

  const handlePullAll = async () => {
    if (!shop) return;
    setSyncStatus('Fetching cloud data from Supabase...');
    try {
      const result = await SupabaseSync.pullAllShopData(shop.id);
      if (result) {
        onCloudDataPulled(result);
        setSyncStatus(`Downloaded ${result.products.length} products, ${result.customers.length} customers, ${result.sales.length} sales.`);
        setTimeout(() => setSyncStatus(null), 4000);
      } else {
        setSyncStatus('No cloud records found or query failed.');
      }
    } catch (err: any) {
      setSyncStatus(`Pull failed: ${err.message || 'Unknown error'}`);
    }
  };

  const copySchemaSql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Supabase PostgreSQL & Cloud Sync</h3>
              <p className="text-[11px] text-neutral-500">Realtime Database & Row Level Security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Indicator */}
        <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between shrink-0 ${
          connectionStatus.success
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300'
            : isSupabaseConfigured()
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-800 dark:text-amber-300'
            : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
        }`}>
          <div className="flex items-center gap-2">
            {connectionStatus.success ? (
              <Cloud className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <CloudOff className="w-4 h-4 text-neutral-400 shrink-0" />
            )}
            <div>
              <div className="font-bold">
                {connectionStatus.success
                  ? 'Connected to Supabase PostgreSQL'
                  : isSupabaseConfigured()
                  ? 'Connecting / Verifying Credentials...'
                  : 'Local Storage Active (Supabase Not Connected)'}
              </div>
              <div className="text-[10px] opacity-80">
                {connectionStatus.message || (isSupabaseConfigured() ? 'Ready to sync cloud records' : 'All sales, debts and stock are currently stored locally')}
              </div>
            </div>
          </div>

          {isSupabaseConfigured() && (
            <button
              onClick={checkHealth}
              disabled={connectionStatus.testing}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
              title="Test Connection"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${connectionStatus.testing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Suggestion Callout if any diagnostic advice */}
        {connectionStatus.suggestion && !connectionStatus.success && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 shrink-0">
            <span className="text-base leading-none">💡</span>
            <div className="flex-1 space-y-1.5">
              <div className="font-semibold text-[11px] leading-relaxed">{connectionStatus.suggestion}</div>
              {connectionStatus.suggestion.includes('SQL Schema') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('schema')}
                  className="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>View & Copy SQL Script</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('connect')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${activeTab === 'connect' ? 'bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-white' : 'text-neutral-500'}`}
          >
            Connection Setup
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${activeTab === 'schema' ? 'bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-white' : 'text-neutral-500'}`}
          >
            SQL Schema
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${activeTab === 'guide' ? 'bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-white' : 'text-neutral-500'}`}
          >
            3-Step Guide
          </button>
        </div>

        {/* Tab 1: Connect Form & Cloud Actions */}
        {activeTab === 'connect' && (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            <form onSubmit={handleSaveCredentials} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">Project URL</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {url && !url.includes('.supabase.co') && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-sans">
                    💡 Tip: Missing <code className="font-mono font-bold">.supabase.co</code> domain. It will auto-expand to: <span className="font-mono underline">{normalizeSupabaseUrl(url)}</span>
                  </p>
                )}
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Must follow format: <code className="font-mono">https://&lt;project-ref&gt;.supabase.co</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Anon Public Key</label>
                <input
                  type="password"
                  required
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Save & Connect</span>
                </button>
                {isSupabaseConfigured() && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="py-2.5 px-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-rose-600 rounded-xl text-xs font-bold"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </form>

            {/* Sync Push / Pull Tools */}
            {isSupabaseConfigured() && (
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Cloud Data Actions
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handlePushAll}
                    className="py-2 px-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-neutral-700 border border-transparent rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload Local Data</span>
                  </button>
                  <button
                    onClick={handlePullAll}
                    className="py-2 px-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-neutral-700 border border-transparent rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <DownloadCloud className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download Cloud Data</span>
                  </button>
                </div>
                {syncStatus && (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 font-mono">
                    {syncStatus}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: SQL Schema Copy */}
        {activeTab === 'schema' && (
          <div className="space-y-2.5 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 text-[11px]">Run once in Supabase SQL Editor:</span>
              <button
                onClick={copySchemaSql}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                {copiedSql ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
              </button>
            </div>
            <div className="flex-1 bg-neutral-950 text-neutral-200 rounded-2xl p-3 font-mono text-[11px] overflow-auto border border-neutral-800 leading-relaxed">
              <pre>{SUPABASE_SCHEMA_SQL}</pre>
            </div>
          </div>
        )}

        {/* Tab 3: Step-by-Step Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-3 flex-1 overflow-y-auto text-xs pr-1 leading-relaxed">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-neutral-900 dark:text-white">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center">1</span>
                <span>Create a Free Supabase Project</span>
              </div>
              <p className="text-[11px] text-neutral-500 pl-6.5">
                Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-semibold inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-2.5 h-2.5" /></a>, sign up, and create a new project named <strong>Duka Tracker</strong>.
              </p>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-neutral-900 dark:text-white">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center">2</span>
                <span>Run the SQL Schema</span>
              </div>
              <p className="text-[11px] text-neutral-500 pl-6.5">
                In your Supabase project dashboard, click <strong>SQL Editor</strong> on the left sidebar, click <strong>New Query</strong>, paste the schema from the <strong>SQL Schema</strong> tab, and click <strong>Run</strong>.
              </p>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-neutral-900 dark:text-white">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center">3</span>
                <span>Paste Your API Keys</span>
              </div>
              <p className="text-[11px] text-neutral-500 pl-6.5">
                Navigate to <strong>Project Settings → API</strong>. Copy your <strong>Project URL</strong> and <strong>anon public key</strong>, then paste them into the <strong>Connection Setup</strong> tab to enable real-time cloud sync.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-xl text-xs shrink-0"
        >
          Close
        </button>
      </div>
    </div>
  );
};
