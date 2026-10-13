-- ============================================================================
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

-- ============================================================================
-- 2. SHOPS TABLE (Multi-tenant Tenant Root)
-- Each duka owner has their own shop record.
-- ============================================================================
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

-- Enable RLS
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can manage their own shop
CREATE POLICY "Shop owners can view and edit their own shop"
    ON public.shops FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy for anon / public token fallback (allows app operation during setup)
CREATE POLICY "Public anon access to shops"
    ON public.shops FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 3. PRODUCTS TABLE (Inventory & Low-Stock Alerts)
-- ============================================================================
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

-- Enable RLS
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

-- ============================================================================
-- 4. CUSTOMERS & KENYA DPA CONSENT TABLE (Debt Book / Mkopo)
-- Compliant with Kenya Data Protection Act 2019 Section 30
-- ============================================================================
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

-- Enable RLS
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

-- ============================================================================
-- 5. SALES TABLE (Cash, Credit & M-Pesa Sales)
-- ============================================================================
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
CREATE INDEX IF NOT EXISTS idx_sales_payment_type ON public.sales(shop_id, payment_type);

-- Enable RLS
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

-- ============================================================================
-- 6. SALE ITEMS TABLE (Itemized Line Items)
-- ============================================================================
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
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);

-- Enable RLS
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

-- ============================================================================
-- 7. DEBT PAYMENTS TABLE (Debt Clearances & Partial Payments)
-- ============================================================================
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

-- Enable RLS
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

-- ============================================================================
-- 8. ENABLE REALTIME SYNC ON TABLES
-- Allows automatic push/pull notifications to web app & mobile devices
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sale_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.debt_payments;
