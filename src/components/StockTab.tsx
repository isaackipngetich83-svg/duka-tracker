import React, { useState, useMemo } from 'react';
import { Search, Plus, AlertTriangle, Package, Edit, Trash2, ArrowUpRight, Check } from 'lucide-react';
import { Product } from '../types/index.ts';
import { Language, translations } from '../lib/translations.ts';

interface StockTabProps {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onUpdateQuantity: (product: Product, newQuantity: number) => void;
  onDeleteProduct: (productId: string) => void;
  onLoadStarterProducts: () => void;
  language: Language;
}

export const StockTab: React.FC<StockTabProps> = ({
  products,
  onAddProduct,
  onEditProduct,
  onUpdateQuantity,
  onDeleteProduct,
  onLoadStarterProducts,
  language,
}) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low_stock'>('all');

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;
      if (filterMode === 'low_stock') {
        return p.quantity <= p.lowStockThreshold;
      }
      return true;
    });
  }, [products, searchQuery, filterMode]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.quantity <= p.lowStockThreshold).length;
  }, [products]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
  }, [products]);

  return (
    <div className="space-y-4 pb-20">
      {/* Inventory KPI Card */}
      <div className="bg-emerald-900 text-white rounded-2xl p-4 shadow-sm border border-emerald-950/40">
        <div className="text-xs text-emerald-200/90 font-medium">
          {language === 'sw' ? 'Jumla ya Thamani ya Stoo' : 'Total Inventory Retail Value'} ({products.length} {language === 'sw' ? 'aina za bidhaa' : 'items'})
        </div>
        <div className="text-2xl font-mono font-black mt-1 text-white">
          KES {totalInventoryValue.toLocaleString()}
        </div>
        <div className="text-[11px] text-emerald-200/80 mt-1 flex items-center justify-between">
          <span>{language === 'sw' ? 'Kiwango cha tahadhari: < 5' : 'Default low stock alert: < 5'}</span>
          {lowStockCount > 0 && (
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {lowStockCount} {language === 'sw' ? 'zinaisha' : 'low on stock'}
            </span>
          )}
        </div>
      </div>

      {/* Search and Add */}
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
          onClick={onAddProduct}
          className="min-h-[44px] px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t.addProduct}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl">
        <button
          onClick={() => setFilterMode('all')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
            filterMode === 'all'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          {language === 'sw' ? 'Bidhaa Zote' : 'All Products'} ({products.length})
        </button>
        <button
          onClick={() => setFilterMode('low_stock')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
            filterMode === 'low_stock'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          {language === 'sw' ? 'Zinazokaribia Kuisha' : 'Low Stock Only'} ({lowStockCount})
        </button>
      </div>

      {/* Products Table/List */}
      {products.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 text-center border border-dashed border-neutral-300 dark:border-neutral-800">
          <Package className="w-10 h-10 mx-auto text-emerald-600 mb-2 opacity-80" />
          <h3 className="font-bold text-sm mb-1">{t.emptyStock}</h3>
          <p className="text-xs text-neutral-500 mb-4 max-w-xs mx-auto">
            {t.emptyStockDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={onAddProduct}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800"
            >
              {t.addProduct}
            </button>
            <button
              onClick={onLoadStarterProducts}
              className="w-full sm:w-auto px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold hover:bg-neutral-200"
            >
              {language === 'sw' ? 'Weka Bidhaa za Kawaida za Duka' : 'Load Kenyan Starter Products'}
            </button>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-500">
          {filterMode === 'low_stock' ? t.allStockGood : 'No items match your search'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredProducts.map(product => {
            const isLowStock = product.quantity <= product.lowStockThreshold;
            const margin = product.sellingPrice - product.buyingPrice;

            return (
              <div
                key={product.id}
                className={`bg-white dark:bg-neutral-900 rounded-2xl p-3.5 border shadow-xs space-y-2.5 transition-all ${
                  isLowStock
                    ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                      {product.category || 'Duka'}
                    </div>
                    <div className="font-bold text-sm text-neutral-900 dark:text-white">
                      {product.name}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onEditProduct(product)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      title="Edit Product"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${product.name}?`)) {
                          onDeleteProduct(product.id);
                        }
                      }}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Price, Cost & Margin */}
                <div className="grid grid-cols-3 gap-2 py-1.5 px-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-neutral-500 block">
                      {language === 'sw' ? 'Gharama' : 'Cost'}
                    </span>
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      KES {product.buyingPrice}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 block">
                      {language === 'sw' ? 'Bei ya Kuuza' : 'Selling'}
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      KES {product.sellingPrice}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 block">
                      {language === 'sw' ? 'Faida' : 'Profit/item'}
                    </span>
                    <span className="font-semibold text-emerald-600">
                      +KES {margin}
                    </span>
                  </div>
                </div>

                {/* Stock Controls (+ / -) */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                      isLowStock
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
                    }`}>
                      {product.quantity} {product.unit}
                    </span>
                    {isLowStock && (
                      <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {language === 'sw' ? 'Inaisha!' : 'Low stock!'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateQuantity(product, Math.max(0, product.quantity - 1))}
                      className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 active:scale-95 text-xs"
                      title="Deduct 1"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => onUpdateQuantity(product, product.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold hover:bg-emerald-200 active:scale-95 text-xs"
                      title="Add 1"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => onUpdateQuantity(product, product.quantity + 10)}
                      className="px-2 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 active:scale-95 text-xs font-mono"
                      title="Add 10"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
