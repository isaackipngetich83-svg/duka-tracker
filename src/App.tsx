import React, { useState, useEffect, useCallback } from 'react';
import { Shop, Product, Customer, Sale, PaymentMethod, DebtPayment } from './types/index.ts';
import { DukaStorage } from './lib/storage.ts';
import { Language } from './lib/translations.ts';
import { useOnlineStatus } from './hooks/useOnlineStatus.ts';

// Components
import { TopBar } from './components/TopBar.tsx';
import { BottomNav, ActiveTab } from './components/BottomNav.tsx';
import { PWAInstallBanner } from './components/PWAInstallBanner.tsx';
import { OfflineBanner } from './components/OfflineBanner.tsx';
import { SellTab } from './components/SellTab.tsx';
import { DebtsTab } from './components/DebtsTab.tsx';
import { StockTab } from './components/StockTab.tsx';
import { HistoryTab } from './components/HistoryTab.tsx';
import { DashboardTab } from './components/DashboardTab.tsx';

// Modals
import { AddProductModal } from './components/AddProductModal.tsx';
import { AddCustomerModal } from './components/AddCustomerModal.tsx';
import { ShopSettingsModal } from './components/ShopSettingsModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { DpaModal } from './components/DpaModal.tsx';
import { DatabaseSchemaModal } from './components/DatabaseSchemaModal.tsx';
import { SupabaseModal } from './components/SupabaseModal.tsx';
import { GoLiveModal } from './components/GoLiveModal.tsx';
import { GitExportModal } from './components/GitExportModal.tsx';
import { isSupabaseConfigured, SupabaseSync } from './lib/supabase.ts';

export default function App() {
  const isOnline = useOnlineStatus();

  // Preferences
  const [language, setLanguage] = useState<Language>(() => {
    localStorage.setItem('duka_pref_lang', 'en');
    return 'en';
  });
  const [isSunlightMode, setIsSunlightMode] = useState<boolean>(() => {
    return localStorage.getItem('duka_pref_sunlight') === 'true';
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('duka_pref_theme') === 'dark';
  });

  // Shop & Navigation
  const [currentShop, setCurrentShop] = useState<Shop | null>(() => {
    return DukaStorage.getCurrentShop();
  });
  const [allShops, setAllShops] = useState<Shop[]>(() => {
    return DukaStorage.getAllShops();
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('sell');

  // Shop Data
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<DebtPayment[]>([]);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isShopSettingsOpen, setIsShopSettingsOpen] = useState(false);
  const [isDpaModalOpen, setIsDpaModalOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isGoLiveModalOpen, setIsGoLiveModalOpen] = useState(false);
  const [isGitModalOpen, setIsGitModalOpen] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(() => isSupabaseConfigured());

  // Sync theme and sunlight classes to HTML root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('duka_pref_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (isSunlightMode) {
      document.documentElement.classList.add('sunlight-mode');
    } else {
      document.documentElement.classList.remove('sunlight-mode');
    }
    localStorage.setItem('duka_pref_sunlight', isSunlightMode ? 'true' : 'false');
  }, [isSunlightMode]);

  useEffect(() => {
    localStorage.setItem('duka_pref_lang', language);
  }, [language]);

  // Load shop data
  const loadShopData = useCallback((shopId: string) => {
    setProducts(DukaStorage.getProducts(shopId));
    setCustomers(DukaStorage.getCustomers(shopId));
    setSales(DukaStorage.getSales(shopId));
    setPayments(DukaStorage.getPayments(shopId));
  }, []);

  // Initialize shop or create default demo shop so app is immediately ready
  useEffect(() => {
    if (currentShop) {
      loadShopData(currentShop.id);
    } else {
      const shops = DukaStorage.getAllShops();
      if (shops.length > 0) {
        setCurrentShop(shops[0]);
        DukaStorage.setCurrentShop(shops[0]);
        loadShopData(shops[0].id);
      } else {
        // Automatically create initial shop with starter inventory so user lands directly in working app
        const initialShop = DukaStorage.createShop({
          name: "Isaac's Duka Store",
          ownerName: 'Isaac Kipngetich',
          phoneNumber: '0712 345 678',
          mpesaType: 'till',
          mpesaNumber: '524108',
          accountNumber: '',
          currency: 'KES',
          lowStockDefault: 5,
        });
        DukaStorage.loadStarterProducts(initialShop.id);
        setCurrentShop(initialShop);
        setAllShops([initialShop]);
        loadShopData(initialShop.id);
      }
    }
  }, [currentShop, loadShopData]);

  // Handlers
  const handleAuthComplete = (newShop: Shop) => {
    DukaStorage.setCurrentShop(newShop);
    setCurrentShop(newShop);
    setAllShops(DukaStorage.getAllShops());
    setIsAuthModalOpen(false);
    // Populate with empty state as requested
    loadShopData(newShop.id);
  };

  const handleSaveShopSettings = (shopData: Omit<Shop, 'id' | 'createdAt'>) => {
    if (currentShop) {
      const updated: Shop = { ...currentShop, ...shopData };
      DukaStorage.setCurrentShop(updated);
      setCurrentShop(updated);
      setAllShops(DukaStorage.getAllShops());
    } else {
      const created = DukaStorage.createShop(shopData);
      setCurrentShop(created);
      setAllShops(DukaStorage.getAllShops());
      loadShopData(created.id);
    }
  };

  const handleSwitchShop = (shop: Shop) => {
    DukaStorage.setCurrentShop(shop);
    setCurrentShop(shop);
    loadShopData(shop.id);
  };

  // Products
  const handleSaveProduct = (productData: Omit<Product, 'id' | 'shopId' | 'updatedAt'>) => {
    if (!currentShop) return;
    if (editingProduct) {
      const updated: Product = { ...editingProduct, ...productData };
      DukaStorage.updateProduct(currentShop.id, updated);
      if (isSupabaseConfigured()) SupabaseSync.pushProduct(updated).catch(console.error);
      setEditingProduct(null);
    } else {
      const created = DukaStorage.addProduct(currentShop.id, productData);
      if (isSupabaseConfigured()) SupabaseSync.pushProduct(created).catch(console.error);
    }
    setProducts(DukaStorage.getProducts(currentShop.id));
  };

  const handleUpdateProductQuantity = (product: Product, newQuantity: number) => {
    if (!currentShop) return;
    const updated = { ...product, quantity: newQuantity };
    DukaStorage.updateProduct(currentShop.id, updated);
    if (isSupabaseConfigured()) SupabaseSync.pushProduct(updated).catch(console.error);
    setProducts(DukaStorage.getProducts(currentShop.id));
  };

  const handleDeleteProduct = (productId: string) => {
    if (!currentShop) return;
    DukaStorage.deleteProduct(currentShop.id, productId);
    setProducts(DukaStorage.getProducts(currentShop.id));
  };

  const handleLoadStarterPack = () => {
    if (!currentShop) return;
    const loaded = DukaStorage.loadStarterProducts(currentShop.id);
    if (isSupabaseConfigured()) {
      loaded.forEach(p => SupabaseSync.pushProduct(p).catch(console.error));
    }
    setProducts(loaded);
  };

  // Customers
  const handleSaveCustomer = (customerData: Omit<Customer, 'id' | 'shopId' | 'currentDebt' | 'totalBorrowed' | 'totalRepaid' | 'createdAt'>) => {
    if (!currentShop) return;
    const created = DukaStorage.addCustomer(currentShop.id, customerData);
    if (isSupabaseConfigured()) SupabaseSync.pushCustomer(created).catch(console.error);
    setCustomers(DukaStorage.getCustomers(currentShop.id));
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (!currentShop) return;
    DukaStorage.deleteCustomer(currentShop.id, customerId);
    setCustomers(DukaStorage.getCustomers(currentShop.id));
  };

  // Sales
  const handleCompleteSale = (payload: {
    items: { productId: string; productName: string; quantity: number; unitPrice: number; buyingPrice: number; total: number }[];
    totalAmount: number;
    totalCost: number;
    grossProfit: number;
    paymentType: PaymentMethod;
    customerId?: string;
    customerName?: string;
  }): Sale => {
    if (!currentShop) throw new Error('No shop active');
    const sale = DukaStorage.recordSale(currentShop.id, payload);
    if (isSupabaseConfigured()) SupabaseSync.pushSale(sale).catch(console.error);
    setProducts(DukaStorage.getProducts(currentShop.id));
    setCustomers(DukaStorage.getCustomers(currentShop.id));
    setSales(DukaStorage.getSales(currentShop.id));
    return sale;
  };

  // Debt Repayments
  const handleRecordPayment = (
    customerId: string,
    amount: number,
    method: 'cash' | 'mpesa',
    mpesaCode?: string,
    note?: string
  ): DebtPayment => {
    if (!currentShop) throw new Error('No shop active');
    const payment = DukaStorage.recordPayment(currentShop.id, customerId, amount, method, mpesaCode, note);
    if (isSupabaseConfigured()) SupabaseSync.pushDebtPayment(payment).catch(console.error);
    setCustomers(DukaStorage.getCustomers(currentShop.id));
    setPayments(DukaStorage.getPayments(currentShop.id));
    return payment;
  };

  const handleResetShopData = (options: { clearSales: boolean; clearCustomers: boolean; clearProducts: boolean }) => {
    if (!currentShop) return;
    DukaStorage.resetShopData(currentShop.id, options);
    loadShopData(currentShop.id);
  };

  const handleCloudDataPulled = (data: { products: Product[]; customers: Customer[]; sales: Sale[]; payments: DebtPayment[] }) => {
    if (!currentShop) return;
    DukaStorage.saveProducts(currentShop.id, data.products);
    DukaStorage.saveCustomers(currentShop.id, data.customers);
    setProducts(data.products);
    setCustomers(data.customers);
    setSales(data.sales);
    setPayments(data.payments);
  };

  // Badges
  const debtorCount = customers.filter(c => c.currentDebt > 0).length;
  const lowStockCount = products.filter(p => p.quantity <= p.lowStockThreshold).length;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-150">
      {/* PWA & Offline Banners */}
      <PWAInstallBanner language={language} />
      <OfflineBanner isOnline={isOnline} language={language} />

      {/* Fixed Mobile Top App Bar */}
      <TopBar
        shop={currentShop}
        language={language}
        onLanguageToggle={() => setLanguage(l => (l === 'en' ? 'sw' : 'en'))}
        isSunlightMode={isSunlightMode}
        onSunlightToggle={() => setIsSunlightMode(s => !s)}
        isDarkMode={isDarkMode}
        onThemeToggle={() => setIsDarkMode(d => !d)}
        onOpenSettings={() => setIsShopSettingsOpen(true)}
        onOpenDpaModal={() => setIsDpaModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenGoLiveModal={() => setIsGoLiveModalOpen(true)}
        onOpenGitModal={() => setIsGitModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        isOnline={isOnline}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-4">
        {activeTab === 'sell' && (
          <SellTab
            products={products}
            customers={customers}
            onCompleteSale={handleCompleteSale}
            onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
            onOpenAddProduct={() => {
              setEditingProduct(null);
              setIsAddProductOpen(true);
            }}
            onLoadStarterProducts={handleLoadStarterPack}
            language={language}
          />
        )}

        {activeTab === 'debts' && currentShop && (
          <DebtsTab
            customers={customers}
            shop={currentShop}
            sales={sales}
            payments={payments}
            onRecordPayment={handleRecordPayment}
            onDeleteCustomer={handleDeleteCustomer}
            onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
            language={language}
          />
        )}

        {activeTab === 'stock' && (
          <StockTab
            products={products}
            onAddProduct={() => {
              setEditingProduct(null);
              setIsAddProductOpen(true);
            }}
            onEditProduct={prod => {
              setEditingProduct(prod);
              setIsAddProductOpen(true);
            }}
            onUpdateQuantity={handleUpdateProductQuantity}
            onDeleteProduct={handleDeleteProduct}
            onLoadStarterProducts={handleLoadStarterPack}
            language={language}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab sales={sales} shopName={currentShop?.name || 'Duka'} language={language} />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            sales={sales}
            products={products}
            customers={customers}
            onNavigateTab={tab => setActiveTab(tab)}
            onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            onOpenGoLiveModal={() => setIsGoLiveModalOpen(true)}
            language={language}
          />
        )}
      </main>

      {/* Ergonomic Mobile Bottom Tab Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        language={language}
        debtCount={debtorCount}
        lowStockCount={lowStockCount}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onCompleteAuth={handleAuthComplete}
        onClose={() => setIsAuthModalOpen(false)}
        language={language}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
        language={language}
      />

      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSave={handleSaveCustomer}
        language={language}
      />

      <ShopSettingsModal
        isOpen={isShopSettingsOpen}
        onClose={() => setIsShopSettingsOpen(false)}
        shop={currentShop}
        allShops={allShops}
        onSaveShop={handleSaveShopSettings}
        onSwitchShop={handleSwitchShop}
        onLoadStarterPack={handleLoadStarterPack}
        onOpenGoLiveModal={() => setIsGoLiveModalOpen(true)}
        language={language}
      />

      <DpaModal
        isOpen={isDpaModalOpen}
        onClose={() => setIsDpaModalOpen(false)}
        language={language}
      />

      <DatabaseSchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => {
          setIsSupabaseModalOpen(false);
          setIsSupabaseConnected(isSupabaseConfigured());
        }}
        shop={currentShop}
        products={products}
        customers={customers}
        sales={sales}
        payments={payments}
        onCloudDataPulled={handleCloudDataPulled}
      />

      <GoLiveModal
        isOpen={isGoLiveModalOpen}
        onClose={() => setIsGoLiveModalOpen(false)}
        shop={currentShop}
        onUpdateShop={handleSaveShopSettings}
        onResetShopData={handleResetShopData}
        language={language}
        onOpenGitModal={() => {
          setIsGoLiveModalOpen(false);
          setIsGitModalOpen(true);
        }}
      />

      <GitExportModal
        isOpen={isGitModalOpen}
        onClose={() => setIsGitModalOpen(false)}
        language={language}
      />
    </div>
  );
}
