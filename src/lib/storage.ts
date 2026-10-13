import { Shop, Product, Customer, Sale, DebtPayment } from '../types/index.ts';

const STORAGE_KEYS = {
  CURRENT_SHOP: 'duka_current_shop',
  SHOPS: 'duka_all_shops',
  PRODUCTS_PREFIX: 'duka_products_',
  CUSTOMERS_PREFIX: 'duka_customers_',
  SALES_PREFIX: 'duka_sales_',
  PAYMENTS_PREFIX: 'duka_payments_',
  LANGUAGE: 'duka_pref_lang',
  SUNLIGHT: 'duka_pref_sunlight',
  THEME: 'duka_pref_theme',
};

// Default starter Kenyan products (optional quick-start so user doesn't have to type 20 items by hand)
export const KENYAN_STARTER_PRODUCTS: Omit<Product, 'id' | 'shopId' | 'updatedAt'>[] = [
  { name: 'Jogoo Maize Flour 2kg', category: 'Flour & Meals', buyingPrice: 175, sellingPrice: 210, quantity: 24, lowStockThreshold: 5, unit: 'packets' },
  { name: 'Kabras Sugar 1kg', category: 'Essentials', buyingPrice: 145, sellingPrice: 170, quantity: 18, lowStockThreshold: 6, unit: 'packets' },
  { name: 'Brookside Fresh Milk 500ml', category: 'Dairy & Drinks', buyingPrice: 60, sellingPrice: 70, quantity: 4, lowStockThreshold: 8, unit: 'pouches' },
  { name: 'Rina Cooking Oil 1L', category: 'Cooking Oils', buyingPrice: 280, sellingPrice: 320, quantity: 12, lowStockThreshold: 4, unit: 'bottles' },
  { name: 'Broadways White Bread 400g', category: 'Bakery', buyingPrice: 65, sellingPrice: 75, quantity: 3, lowStockThreshold: 5, unit: 'loaves' },
  { name: 'Royco Beef Cubes (Box of 40)', category: 'Spices', buyingPrice: 160, sellingPrice: 200, quantity: 15, lowStockThreshold: 3, unit: 'boxes' },
  { name: 'Omo Handwash Powder 500g', category: 'Household', buyingPrice: 150, sellingPrice: 180, quantity: 10, lowStockThreshold: 4, unit: 'packets' },
  { name: 'Geisha Beauty Soap 225g', category: 'Personal Care', buyingPrice: 90, sellingPrice: 110, quantity: 2, lowStockThreshold: 5, unit: 'bars' },
];

export const DukaStorage = {
  // Current Shop
  getCurrentShop(): Shop | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_SHOP);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentShop(shop: Shop): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SHOP, JSON.stringify(shop));
    // Also save in shop list
    const shops = this.getAllShops();
    const existingIndex = shops.findIndex(s => s.id === shop.id);
    if (existingIndex >= 0) {
      shops[existingIndex] = shop;
    } else {
      shops.push(shop);
    }
    localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(shops));
  },

  getAllShops(): Shop[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHOPS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  createShop(shopData: Omit<Shop, 'id' | 'createdAt'>): Shop {
    const newShop: Shop = {
      ...shopData,
      id: `shop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.setCurrentShop(newShop);
    return newShop;
  },

  // Products
  getProducts(shopId: string): Product[] {
    try {
      const key = `${STORAGE_KEYS.PRODUCTS_PREFIX}${shopId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveProducts(shopId: string, products: Product[]): void {
    const key = `${STORAGE_KEYS.PRODUCTS_PREFIX}${shopId}`;
    localStorage.setItem(key, JSON.stringify(products));
  },

  addProduct(shopId: string, item: Omit<Product, 'id' | 'shopId' | 'updatedAt'>): Product {
    const products = this.getProducts(shopId);
    const newProduct: Product = {
      ...item,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      shopId,
      updatedAt: new Date().toISOString(),
    };
    products.unshift(newProduct);
    this.saveProducts(shopId, products);
    return newProduct;
  },

  updateProduct(shopId: string, product: Product): void {
    const products = this.getProducts(shopId);
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = { ...product, updatedAt: new Date().toISOString() };
      this.saveProducts(shopId, products);
    }
  },

  deleteProduct(shopId: string, productId: string): void {
    const products = this.getProducts(shopId).filter(p => p.id !== productId);
    this.saveProducts(shopId, products);
  },

  loadStarterProducts(shopId: string): Product[] {
    const current = this.getProducts(shopId);
    if (current.length > 0) return current;

    const seeded: Product[] = KENYAN_STARTER_PRODUCTS.map((item, idx) => ({
      ...item,
      id: `prod_seed_${idx}_${Date.now()}`,
      shopId,
      updatedAt: new Date().toISOString(),
    }));
    this.saveProducts(shopId, seeded);
    return seeded;
  },

  // Customers
  getCustomers(shopId: string): Customer[] {
    try {
      const key = `${STORAGE_KEYS.CUSTOMERS_PREFIX}${shopId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCustomers(shopId: string, customers: Customer[]): void {
    const key = `${STORAGE_KEYS.CUSTOMERS_PREFIX}${shopId}`;
    localStorage.setItem(key, JSON.stringify(customers));
  },

  addCustomer(shopId: string, customerData: Omit<Customer, 'id' | 'shopId' | 'currentDebt' | 'totalBorrowed' | 'totalRepaid' | 'createdAt'>): Customer {
    const customers = this.getCustomers(shopId);
    const newCustomer: Customer = {
      ...customerData,
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      shopId,
      currentDebt: 0,
      totalBorrowed: 0,
      totalRepaid: 0,
      createdAt: new Date().toISOString(),
    };
    customers.unshift(newCustomer);
    this.saveCustomers(shopId, customers);
    return newCustomer;
  },

  updateCustomer(shopId: string, customer: Customer): void {
    const customers = this.getCustomers(shopId);
    const index = customers.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      customers[index] = customer;
      this.saveCustomers(shopId, customers);
    }
  },

  deleteCustomer(shopId: string, customerId: string): void {
    // Kenya DPA Right to Erasure - permanently purge customer personal data
    const customers = this.getCustomers(shopId).filter(c => c.id !== customerId);
    this.saveCustomers(shopId, customers);
  },

  // Sales
  getSales(shopId: string): Sale[] {
    try {
      const key = `${STORAGE_KEYS.SALES_PREFIX}${shopId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  recordSale(
    shopId: string,
    salePayload: Omit<Sale, 'id' | 'shopId' | 'receiptNumber' | 'createdAt'>
  ): Sale {
    const sales = this.getSales(shopId);
    const products = this.getProducts(shopId);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const receiptNumber = `DUKA-${dateStr}-${(sales.length + 1).toString().padStart(4, '0')}`;

    const newSale: Sale = {
      ...salePayload,
      id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      shopId,
      receiptNumber,
      createdAt: new Date().toISOString(),
    };

    // 1. Automatically deduct stock
    newSale.items.forEach(item => {
      const prodIndex = products.findIndex(p => p.id === item.productId);
      if (prodIndex >= 0) {
        products[prodIndex].quantity = Math.max(0, products[prodIndex].quantity - item.quantity);
        products[prodIndex].updatedAt = new Date().toISOString();
      }
    });
    this.saveProducts(shopId, products);

    // 2. If credit sale, update customer debt
    if (newSale.paymentType === 'credit' && newSale.customerId) {
      const customers = this.getCustomers(shopId);
      const custIndex = customers.findIndex(c => c.id === newSale.customerId);
      if (custIndex >= 0) {
        customers[custIndex].currentDebt += newSale.totalAmount;
        customers[custIndex].totalBorrowed += newSale.totalAmount;
        this.saveCustomers(shopId, customers);
      }
    }

    // 3. Save sale
    sales.unshift(newSale);
    const key = `${STORAGE_KEYS.SALES_PREFIX}${shopId}`;
    localStorage.setItem(key, JSON.stringify(sales));

    return newSale;
  },

  // Debt Payments
  getPayments(shopId: string): DebtPayment[] {
    try {
      const key = `${STORAGE_KEYS.PAYMENTS_PREFIX}${shopId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  recordPayment(
    shopId: string,
    customerId: string,
    amount: number,
    method: 'cash' | 'mpesa',
    mpesaCode?: string,
    note?: string
  ): DebtPayment {
    const customers = this.getCustomers(shopId);
    const custIndex = customers.findIndex(c => c.id === customerId);
    if (custIndex < 0) {
      throw new Error('Customer not found');
    }

    const customer = customers[custIndex];
    const balanceBefore = customer.currentDebt;
    const balanceAfter = Math.max(0, balanceBefore - amount);

    customer.currentDebt = balanceAfter;
    customer.totalRepaid += amount;
    customer.lastPaymentDate = new Date().toISOString();
    this.saveCustomers(shopId, customers);

    const payment: DebtPayment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      shopId,
      customerId,
      customerName: customer.nickname || customer.name,
      amount,
      method,
      mpesaCode,
      note,
      balanceBefore,
      balanceAfter,
      paidAt: new Date().toISOString(),
    };

    const payments = this.getPayments(shopId);
    payments.unshift(payment);
    const key = `${STORAGE_KEYS.PAYMENTS_PREFIX}${shopId}`;
    localStorage.setItem(key, JSON.stringify(payments));

    return payment;
  },

  // Mock data clear & production reset
  clearSales(shopId: string): void {
    const key = `${STORAGE_KEYS.SALES_PREFIX}${shopId}`;
    localStorage.removeItem(key);
  },

  clearPayments(shopId: string): void {
    const key = `${STORAGE_KEYS.PAYMENTS_PREFIX}${shopId}`;
    localStorage.removeItem(key);
  },

  clearProducts(shopId: string): void {
    const key = `${STORAGE_KEYS.PRODUCTS_PREFIX}${shopId}`;
    localStorage.removeItem(key);
  },

  clearCustomers(shopId: string): void {
    const key = `${STORAGE_KEYS.CUSTOMERS_PREFIX}${shopId}`;
    localStorage.removeItem(key);
  },

  resetShopData(
    shopId: string,
    options: { clearSales?: boolean; clearCustomers?: boolean; clearProducts?: boolean }
  ): void {
    if (options.clearSales) {
      this.clearSales(shopId);
      this.clearPayments(shopId);
    }
    if (options.clearCustomers) {
      this.clearCustomers(shopId);
    }
    if (options.clearProducts) {
      this.clearProducts(shopId);
    }
  },
};
