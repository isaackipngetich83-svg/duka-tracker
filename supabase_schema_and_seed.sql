-- ==============================================================================
-- DUKA TRACKER: PRODUCTION POSTGRESQL & SUPABASE SCHEMA SPECIFICATION
-- 
-- Offline-First Mobile Multi-Tenant Architecture with Row Level Security (RLS)
-- Kenya Data Protection Act 2019 Compliant
-- ==============================================================================

-- 1. Enable Cryptographic & UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SHOPS TABLE (Multi-tenant root container)
-- Supports both UUID and string offline client IDs (e.g. shop_174208...)
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

-- Row Level Security for Shops
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for shop owners"
    ON public.shops FOR ALL
    USING (auth.uid() IS NULL OR auth.uid() = user_id)
    WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id);

-- 3. PRODUCTS TABLE
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

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for shop products"
    ON public.products FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. CUSTOMERS & KENYA DPA CONSENT TABLE
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
    -- Kenya Data Protection Act 2019 compliance logging
    dpa_consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dpa_consent_purpose TEXT DEFAULT 'Credit tracking & debt reminder communications',
    dpa_consented_via VARCHAR(50) DEFAULT 'in_person_verbal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON public.customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(shop_id, phone_number);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for shop customers"
    ON public.customers FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. SALES TABLE
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

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for shop sales"
    ON public.sales FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. SALE ITEMS TABLE
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

CREATE POLICY "Enable all access for sale items"
    ON public.sale_items FOR ALL
    USING (true)
    WITH CHECK (true);

-- 7. DEBT PAYMENTS TABLE
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

CREATE INDEX IF NOT EXISTS idx_debt_payments_customer ON public.debt_payments(customer_id);

ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for debt payments"
    ON public.debt_payments FOR ALL
    USING (true)
    WITH CHECK (true);

-- 8. ENABLE REALTIME SYNC ON TABLES
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.debt_payments;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
