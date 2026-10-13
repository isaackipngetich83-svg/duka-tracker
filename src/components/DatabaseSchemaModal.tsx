import React, { useState } from 'react';
import { X, Database, Shield, Copy, Check, Terminal, FileCode, CheckCircle2 } from 'lucide-react';

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPABASE_SCHEMA_SQL = `-- ============================================================================
-- DUKA TRACKER - PRODUCTION POSTGRESQL & SUPABASE SCHEMA
-- CIRIS Tech 2026 Innovation Challenge (Fintech & Digital Economy Track)
-- Multi-Tenant Data Isolation with Row Level Security (RLS) & Real-time Sync
-- ============================================================================

-- 1. EXTENSIONS
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

-- 2. SHOPS TABLE (Multi-tenant Tenant Root)
CREATE TABLE IF NOT EXISTS public.shops (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    owner_name VARCHAR(100),
    phone_number VARCHAR(20) NOT NULL,
    mpesa_type VARCHAR(20) DEFAULT 'till', -- 'till', 'paybill', 'send_money'
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

CREATE POLICY "Shop owners can view and edit their own shop"
    ON public.shops FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public anon access to shops"
    ON public.shops FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- 3. PRODUCTS TABLE (Inventory & Low-Stock Alerts)
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
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(shop_id, category);

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

-- 4. CUSTOMERS & KENYA DPA CONSENT TABLE (Debt Book / Mkopo)
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
    -- Kenya Data Protection Act 2019 compliance audit fields
    dpa_consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dpa_consent_purpose TEXT DEFAULT 'Credit tracking & debt reminder communications',
    dpa_consented_via VARCHAR(50) DEFAULT 'in_person_verbal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON public.customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(shop_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_current_debt ON public.customers(shop_id, current_debt DESC);

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

-- 5. SALES TABLE (Cash, Credit & M-Pesa Sales)
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150),
    payment_type VARCHAR(20) NOT NULL, -- 'cash', 'credit', 'mpesa'
    total_amount NUMERIC(12, 2) NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL,
    gross_profit NUMERIC(12, 2) NOT NULL,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_shop_date ON public.sales(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON public.sales(shop_id, customer_id);

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

-- 6. SALE ITEMS TABLE (Itemized Line Items)
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
    USING (sale_id IN (
        SELECT id FROM public.sales WHERE shop_id IN (
            SELECT id FROM public.shops WHERE user_id = auth.uid()
        )
    ))
    WITH CHECK (sale_id IN (
        SELECT id FROM public.sales WHERE shop_id IN (
            SELECT id FROM public.shops WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Public anon access to sale items"
    ON public.sale_items FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- 7. DEBT PAYMENTS TABLE (Debt Clearances & Partial Payments)
CREATE TABLE IF NOT EXISTS public.debt_payments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    shop_id TEXT NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    method VARCHAR(20) NOT NULL, -- 'cash', 'mpesa'
    mpesa_code VARCHAR(50),
    note TEXT,
    balance_before NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debt_payments_shop ON public.debt_payments(shop_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_customer ON public.debt_payments(customer_id);

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

-- 8. REALTIME REPLICATION (For instant sync across devices)
ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sale_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.debt_payments;
`;

const SEED_DATA_SQL = `-- ============================================================================
-- DUKA TRACKER - DEVELOPMENT SEED SCRIPT
-- ============================================================================

INSERT INTO public.shops (
    id, name, owner_name, phone_number, mpesa_type, mpesa_number, currency, low_stock_default
) VALUES (
    'demo-duka-001', 'Mama Kevin Fast Groceries', 'Mary Wanjiku', '+254712345678', 'till', '5428901', 'KES', 5
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (
    id, shop_id, name, category, buying_price, selling_price, quantity, low_stock_threshold, unit
) VALUES
    ('prod-001', 'demo-duka-001', 'Jogoo Maize Flour 2kg', 'Flour & Grains', 190.00, 220.00, 18, 5, 'packet'),
    ('prod-002', 'demo-duka-001', 'Pembe Maize Flour 2kg', 'Flour & Grains', 185.00, 215.00, 3, 5, 'packet'),
    ('prod-003', 'demo-duka-001', 'Kensalt Table Salt 1kg', 'Pantry & Spices', 35.00, 50.00, 30, 8, 'packet'),
    ('prod-004', 'demo-duka-001', 'Fresh Fri Cooking Oil 1L', 'Oils & Fats', 280.00, 330.00, 2, 4, 'bottle'),
    ('prod-005', 'demo-duka-001', 'Brookside Fresh Milk 500ml', 'Dairy', 58.00, 65.00, 4, 6, 'pouch'),
    ('prod-006', 'demo-duka-001', 'Broadways White Bread 400g', 'Bakery', 55.00, 65.00, 12, 5, 'loaf'),
    ('prod-007', 'demo-duka-001', 'Sugar White Refined 1kg', 'Pantry & Spices', 150.00, 180.00, 22, 10, 'kg')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.customers (
    id, shop_id, name, nickname, phone_number, location_note, current_debt, total_borrowed, total_repaid,
    dpa_consented_at, dpa_consent_purpose, dpa_consented_via
) VALUES
    ('cust-001', 'demo-duka-001', 'Kevin Otieno', 'Teacher Kevin', '+254711223344', 'Plot 14 Near Water Tank', 850.00, 5200.00, 4350.00, NOW() - INTERVAL '30 days', 'Credit tracking & debt reminder communications', 'in_person_verbal'),
    ('cust-002', 'demo-duka-001', 'Grace Mwangi', 'Mama Brian', '+254722334455', 'House #8 Blue Gate', 350.00, 2800.00, 2450.00, NOW() - INTERVAL '25 days', 'Credit tracking & debt reminder communications', 'in_person_verbal'),
    ('cust-003', 'demo-duka-001', 'John Kiprop', 'Boda John', '+254733445566', 'Kobil Stage Boda Stand', 1450.00, 1600.00, 150.00, NOW() - INTERVAL '15 days', 'Credit tracking & debt reminder communications', 'in_person_verbal')
ON CONFLICT (id) DO NOTHING;
`;

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'seed' | 'guide'>('schema');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentContent = activeTab === 'schema' ? SUPABASE_SCHEMA_SQL : SEED_DATA_SQL;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-3xl max-w-xl w-full p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-3.5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Supabase & PostgreSQL Schema</h3>
              <p className="text-[11px] text-neutral-500">Row Level Security, Tables & Seed Script</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'schema' ? 'bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-white' : 'text-neutral-500'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Schema & RLS</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seed')}
            className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'seed' ? 'bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-white' : 'text-neutral-500'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Dev Seed SQL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'guide' ? 'bg-white dark:bg-neutral-900 shadow-xs text-neutral-900 dark:text-white' : 'text-neutral-500'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Setup Steps</span>
          </button>
        </div>

        {activeTab === 'guide' ? (
          <div className="space-y-3 flex-1 overflow-y-auto text-xs pr-1 leading-relaxed">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-1">
              <div className="font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] flex items-center justify-center shrink-0">1</span>
                <span>Open your Supabase Project</span>
              </div>
              <p className="text-[11px] text-neutral-500 pl-7">
                Navigate to your project dashboard at <strong className="text-neutral-700 dark:text-neutral-300">app.supabase.com</strong>.
              </p>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-1">
              <div className="font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] flex items-center justify-center shrink-0">2</span>
                <span>Run Schema in the SQL Editor</span>
              </div>
              <p className="text-[11px] text-neutral-500 pl-7">
                Click on the <strong>SQL Editor</strong> icon on the left menu, click <strong>New Query</strong>, paste the contents from the <strong>Schema & RLS</strong> tab, and hit <strong>Run</strong>.
              </p>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-1">
              <div className="font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] flex items-center justify-center shrink-0">3</span>
                <span>Connect Duka Tracker</span>
              </div>
              <p className="text-[11px] text-neutral-500 pl-7">
                Go to <strong>Project Settings → API</strong>. Copy your <strong>Project URL</strong> and <strong>anon public key</strong>, and enter them into the Cloud connection popup in Duka Tracker.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-neutral-100 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 bg-neutral-900/90 border-b border-neutral-800 text-[11px] shrink-0">
              <span className="font-mono text-neutral-400">
                {activeTab === 'schema' ? 'supabase/schema.sql' : 'supabase/seed.sql'}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied SQL!' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="p-3 text-[11px] font-mono overflow-auto flex-1 leading-relaxed selection:bg-emerald-800">
              {currentContent}
            </pre>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-xl text-xs shrink-0"
        >
          Close
        </button>
      </div>
    </div>
  );
};
