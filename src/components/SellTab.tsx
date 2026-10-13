import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, CheckCircle2, AlertTriangle, UserCheck, ShieldAlert, ShoppingBag, Receipt, ArrowRight } from 'lucide-react';
import { Product, Customer, Sale, PaymentMethod } from '../types/index.ts';
import { calculateTrustScore } from '../lib/trustScore.ts';
import { Language, translations } from '../lib/translations.ts';

interface SellTabProps {
  products: Product[];
  customers: Customer[];
  onCompleteSale: (payload: {
    items: { productId: string; productName: string; quantity: number; unitPrice: number; buyingPrice: number; total: number }[];
    totalAmount: number;
    totalCost: number;
    grossProfit: number;
    paymentType: PaymentMethod;
    customerId?: string;
    customerName?: string;
  }) => Sale;
  onOpenAddCustomer: () => void;
  onOpenAddProduct: () => void;
  onLoadStarterProducts: () => void;
  language: Language;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const SellTab: React.FC<SellTabProps> = ({
  products,
  customers,
  onCompleteSale,
  onOpenAddCustomer,
  onOpenAddProduct,
  onLoadStarterProducts,
  language,
}) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentMethod>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        // Check stock availability
        if (existing.quantity >= product.quantity) return prev;
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.quantity) return item; // Can't exceed available stock
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  // Calculate totals
  const totalAmount = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const totalCost = cart.reduce((sum, item) => sum + item.product.buyingPrice * item.quantity, 0);
  const grossProfit = totalAmount - totalCost;

  // Selected customer for credit
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const customerTrust = selectedCustomer ? calculateTrustScore(selectedCustomer) : null;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (paymentType === 'credit' && !selectedCustomerId) {
      alert(language === 'sw' ? 'Tafadhali chagua mteja anayekopa' : 'Please select a customer for credit sale');
      return;
    }

    const saleItems = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.sellingPrice,
      buyingPrice: item.product.buyingPrice,
      total: item.product.sellingPrice * item.quantity,
    }));

    const sale = onCompleteSale({
      items: saleItems,
      totalAmount,
      totalCost,
      grossProfit,
      paymentType,
      customerId: paymentType === 'credit' ? selectedCustomerId : undefined,
      customerName: paymentType === 'credit' && selectedCustomer ? (selectedCustomer.nickname || selectedCustomer.name) : undefined,
    });

    setCompletedSale(sale);
    setCart([]);
    setSelectedCustomerId('');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={t.searchProducts}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={onOpenAddProduct}
          className="min-h-[44px] px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t.addProduct}</span>
        </button>
      </div>

      {/* Category Pills (Functional Filter Buttons) */}
      {categories.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              {cat === 'all' ? (language === 'sw' ? 'Zote' : 'All') : cat}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 text-center border border-dashed border-neutral-300 dark:border-neutral-800">
          <ShoppingBag className="w-10 h-10 mx-auto text-emerald-600 mb-2 opacity-80" />
          <h3 className="font-bold text-sm mb-1">{t.emptyStock}</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 max-w-xs mx-auto">
            {t.emptyStockDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={onOpenAddProduct}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800"
            >
              {t.addProduct}
            </button>
            <button
              onClick={onLoadStarterProducts}
              className="w-full sm:w-auto px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold hover:bg-neutral-200"
            >
              {language === 'sw' ? 'Weka Bidhaa za Kawaida (Starter Pack)' : 'Load Typical Duka Items (Starter Pack)'}
            </button>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-500">
          {language === 'sw' ? 'Hakuna bidhaa inayolingana na utafutaji wako' : 'No items match your search'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {filteredProducts.map(product => {
            const isOutOfStock = product.quantity <= 0;
            const isLowStock = product.quantity > 0 && product.quantity <= product.lowStockThreshold;
            const inCart = cart.find(c => c.product.id === product.id);

            return (
              <button
                key={product.id}
                onClick={() => !isOutOfStock && addToCart(product)}
                disabled={isOutOfStock}
                className={`text-left p-3 rounded-2xl border transition-all relative flex flex-col justify-between min-h-[110px] ${
                  isOutOfStock
                    ? 'bg-neutral-100 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-60 cursor-not-allowed'
                    : inCart
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 shadow-xs'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-emerald-600 active:scale-[0.98]'
                }`}
              >
                <div>
                  <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate mb-0.5">
                    {product.category || 'Duka Item'}
                  </div>
                  <div className="font-bold text-xs leading-snug line-clamp-2 text-neutral-900 dark:text-neutral-100">
                    {product.name}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-end justify-between">
                  <div>
                    <div className="text-xs font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                      KES {product.sellingPrice.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      {isOutOfStock ? (
                        <span className="text-rose-600 font-bold">Out of stock</span>
                      ) : isLowStock ? (
                        <span className="text-amber-600 font-bold">{product.quantity} left</span>
                      ) : (
                        <span>{product.quantity} {product.unit}</span>
                      )}
                    </div>
                  </div>

                  {inCart && (
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                      {inCart.quantity}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Cart Sheet / Order Summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-30 p-3 bg-gradient-to-t from-white via-white dark:from-neutral-950 dark:via-neutral-950 to-transparent">
          <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-3.5 space-y-3">
            {/* Cart Header */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>{t.itemsInCart} ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
              </span>
              <button
                onClick={clearCart}
                className="text-neutral-500 hover:text-rose-600 font-medium"
              >
                {t.clearCart}
              </button>
            </div>

            {/* Cart Items list (compact scroller) */}
            <div className="max-h-36 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 pr-1">
              {cart.map(item => (
                <div key={item.product.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                  <div className="truncate flex-1">
                    <div className="font-semibold truncate">{item.product.name}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      KES {item.product.sellingPrice} x {item.quantity} = KES {(item.product.sellingPrice * item.quantity).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 active:bg-neutral-300 font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 active:bg-neutral-300 font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="w-7 h-7 rounded-lg text-neutral-400 hover:text-rose-600 flex items-center justify-center ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Type Selector (Cash vs Mkopo) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setPaymentType('cash')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  paymentType === 'cash'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-transparent hover:bg-neutral-200'
                }`}
              >
                {t.cashSale}
              </button>
              <button
                onClick={() => setPaymentType('credit')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  paymentType === 'credit'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-transparent hover:bg-neutral-200'
                }`}
              >
                {t.creditSale}
              </button>
            </div>

            {/* If Credit sale: Customer Selector with Trust Score */}
            {paymentType === 'credit' && (
              <div className="space-y-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">{t.selectCustomer}</span>
                  <button
                    onClick={onOpenAddCustomer}
                    className="text-emerald-600 hover:text-emerald-700 font-bold text-[11px]"
                  >
                    {t.addNewCustomer}
                  </button>
                </div>

                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">{language === 'sw' ? '-- Chagua Mteja --' : '-- Choose Customer --'}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nickname ? `${c.nickname} (${c.name})` : c.name} - Owed: KES {c.currentDebt.toLocaleString()}
                    </option>
                  ))}
                </select>

                {/* Trust Score Warning if Customer selected */}
                {selectedCustomer && customerTrust && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${customerTrust.colorClass}`}>
                    {customerTrust.level === 'reliable' ? (
                      <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{language === 'sw' ? customerTrust.labelSwahili : customerTrust.label}</span>
                        <span className="font-mono text-[11px]">({customerTrust.score}% score)</span>
                      </div>
                      <div className="text-[11px] opacity-90 mt-0.5">
                        {customerTrust.description}
                      </div>
                      <div className="text-[10px] font-mono mt-1 pt-1 border-t border-current/20">
                        {language === 'sw' ? 'Deni analodaiwa kwa sasa: ' : 'Current balance owed: '}
                        <strong>KES {selectedCustomer.currentDebt.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Total & Checkout Button */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{t.total}</div>
                <div className="text-lg font-mono font-black text-neutral-900 dark:text-white">
                  KES {totalAmount.toLocaleString()}
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="flex-1 py-3 px-4 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <span>{t.checkout}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Success Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base">{t.saleSuccess}</h3>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">{completedSale.receiptNumber}</p>
            </div>

            {/* Receipt details */}
            <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3 text-xs space-y-2 border border-neutral-200 dark:border-neutral-700/60">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>{language === 'sw' ? 'Aina ya Mauzo' : 'Payment Type'}:</span>
                <span className="font-bold uppercase text-neutral-900 dark:text-white">
                  {completedSale.paymentType === 'credit' ? t.creditSale : t.cashSale}
                </span>
              </div>
              {completedSale.customerName && (
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>{language === 'sw' ? 'Mteja' : 'Customer'}:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{completedSale.customerName}</span>
                </div>
              )}
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2 space-y-1">
                {completedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">{item.productName} x{item.quantity}</span>
                    <span className="font-mono shrink-0">KES {item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2 flex justify-between font-bold text-sm">
                <span>{t.total}:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">
                  KES {completedSale.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setCompletedSale(null)}
              className="w-full py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-xl text-xs hover:opacity-90"
            >
              {language === 'sw' ? 'Endelea na Mauzo' : 'Next Sale'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
