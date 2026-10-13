-- ============================================================================
-- DUKA TRACKER - DEVELOPMENT SEED SCRIPT
-- For testing stock, sales, debts, trust scoring, and M-Pesa reminders.
-- ============================================================================

-- 1. Create a Demo Shop
INSERT INTO public.shops (
    id, name, owner_name, phone_number, mpesa_type, mpesa_number, account_number, currency, low_stock_default
) VALUES (
    'demo-duka-001',
    'Mama Kevin Fast Groceries',
    'Mary Wanjiku',
    '+254712345678',
    'till',
    '5428901',
    '',
    'KES',
    5
) ON CONFLICT (id) DO NOTHING;

-- 2. Populate Standard Fast-Moving Retail Inventory
INSERT INTO public.products (
    id, shop_id, name, category, buying_price, selling_price, quantity, low_stock_threshold, unit
) VALUES
    ('prod-001', 'demo-duka-001', 'Jogoo Maize Flour 2kg', 'Flour & Grains', 190.00, 220.00, 18, 5, 'packet'),
    ('prod-002', 'demo-duka-002', 'Pembe Maize Flour 2kg', 'Flour & Grains', 185.00, 215.00, 3, 5, 'packet'),
    ('prod-003', 'demo-duka-001', 'Kensalt Table Salt 1kg', 'Pantry & Spices', 35.00, 50.00, 30, 8, 'packet'),
    ('prod-004', 'demo-duka-001', 'Fresh Fri Cooking Oil 1L', 'Oils & Fats', 280.00, 330.00, 2, 4, 'bottle'),
    ('prod-005', 'demo-duka-001', 'Royco Beef Cubes 40s', 'Pantry & Spices', 140.00, 180.00, 9, 3, 'box'),
    ('prod-006', 'demo-duka-001', 'Brookside Fresh Milk 500ml', 'Dairy', 58.00, 65.00, 4, 6, 'pouch'),
    ('prod-007', 'demo-duka-001', 'Broadways White Bread 400g', 'Bakery', 55.00, 65.00, 12, 5, 'loaf'),
    ('prod-008', 'demo-duka-001', 'Omo Handwashing Powder 500g', 'Detergents & Soap', 160.00, 190.00, 7, 3, 'packet'),
    ('prod-009', 'demo-duka-001', 'Geisha Soap Rose 225g', 'Personal Care', 90.00, 110.00, 14, 4, 'piece'),
    ('prod-010', 'demo-duka-001', 'Sugar White Refined 1kg', 'Pantry & Spices', 150.00, 180.00, 22, 10, 'kg')
ON CONFLICT (id) DO NOTHING;

-- 3. Populate Customers with Realistic Debt & Repayment History
INSERT INTO public.customers (
    id, shop_id, name, nickname, phone_number, location_note, current_debt, total_borrowed, total_repaid,
    dpa_consented_at, dpa_consent_purpose, dpa_consented_via
) VALUES
    (
        'cust-001', 'demo-duka-001', 'Kevin Otieno', 'Teacher Kevin',
        '+254711223344', 'Plot 14 Near Water Tank',
        850.00, 5200.00, 4350.00,
        NOW() - INTERVAL '30 days', 'Credit tracking & debt reminder communications', 'in_person_verbal'
    ),
    (
        'cust-002', 'demo-duka-001', 'Grace Mwangi', 'Mama Brian',
        '+254722334455', 'House #8 Blue Gate',
        350.00, 2800.00, 2450.00,
        NOW() - INTERVAL '25 days', 'Credit tracking & debt reminder communications', 'in_person_verbal'
    ),
    (
        'cust-003', 'demo-duka-001', 'John Kiprop', 'Boda John',
        '+254733445566', 'Kobil Stage Boda Stand',
        1450.00, 1600.00, 150.00,
        NOW() - INTERVAL '15 days', 'Credit tracking & debt reminder communications', 'in_person_verbal'
    ),
    (
        'cust-004', 'demo-duka-001', 'Alice Njeri', 'Nurse Alice',
        '+254744556677', 'Kenyatta Road Apt B2',
        0.00, 0.00, 0.00,
        NOW() - INTERVAL '5 days', 'Credit tracking & debt reminder communications', 'in_person_verbal'
    )
ON CONFLICT (id) DO NOTHING;

-- 4. Sample Recent Sales
INSERT INTO public.sales (
    id, shop_id, receipt_number, customer_id, customer_name, payment_type, total_amount, total_cost, gross_profit, created_at
) VALUES
    ('sale-001', 'demo-duka-001', 'RCP-1001', NULL, NULL, 'cash', 285.00, 245.00, 40.00, NOW() - INTERVAL '3 hours'),
    ('sale-002', 'demo-duka-001', 'RCP-1002', 'cust-001', 'Kevin Otieno', 'credit', 440.00, 375.00, 65.00, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sale_items (
    id, sale_id, product_id, product_name, quantity, unit_price, buying_price, total
) VALUES
    ('item-001', 'sale-001', 'prod-001', 'Jogoo Maize Flour 2kg', 1, 220.00, 190.00, 220.00),
    ('item-002', 'sale-001', 'prod-006', 'Brookside Fresh Milk 500ml', 1, 65.00, 58.00, 65.00),
    ('item-003', 'sale-002', 'prod-001', 'Jogoo Maize Flour 2kg', 2, 220.00, 190.00, 440.00)
ON CONFLICT (id) DO NOTHING;
