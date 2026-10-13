import React, { useState, useMemo } from 'react';
import { Search, Calendar, Receipt, DollarSign, Filter, ChevronRight, User, Download } from 'lucide-react';
import { Sale } from '../types/index.ts';
import { exportSalesToCSV } from '../lib/export.ts';
import { Language, translations } from '../lib/translations.ts';

interface HistoryTabProps {
  sales: Sale[];
  shopName?: string;
  language: Language;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ sales, shopName = 'Duka', language }) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'credit'>('all');
  const [activeReceipt, setActiveReceipt] = useState<Sale | null>(null);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Period filter
      const saleDate = sale.createdAt.slice(0, 10);
      if (filterPeriod === 'today' && saleDate !== todayStr) return false;
      if (filterPeriod === 'week') {
        const diffDays = (now.getTime() - new Date(sale.createdAt).getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      }
      if (filterPeriod === 'month') {
        const diffDays = (now.getTime() - new Date(sale.createdAt).getTime()) / (1000 * 3600 * 24);
        if (diffDays > 30) return false;
      }

      // Payment filter
      if (paymentFilter !== 'all' && sale.paymentType !== paymentFilter) return false;

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesReceipt = sale.receiptNumber.toLowerCase().includes(q);
        const matchesCustomer = sale.customerName && sale.customerName.toLowerCase().includes(q);
        const matchesItem = sale.items.some(i => i.productName.toLowerCase().includes(q));
        if (!matchesReceipt && !matchesCustomer && !matchesItem) return false;
      }

      return true;
    });
  }, [sales, filterPeriod, paymentFilter, searchQuery, todayStr]);

  const totalFilteredAmount = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [filteredSales]);

  return (
    <div className="space-y-4 pb-20">
      {/* Search and Period Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={language === 'sw' ? 'Tafuta risiti au mteja...' : 'Search receipt number or customer...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={() => exportSalesToCSV(filteredSales, shopName)}
          className="min-h-[44px] px-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
          title="Export Sales to Excel / CSV"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">CSV</span>
        </button>
      </div>

      {/* Date Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl overflow-x-auto">
        <button
          onClick={() => setFilterPeriod('all')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
            filterPeriod === 'all'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          {language === 'sw' ? 'Zote' : 'All'}
        </button>
        <button
          onClick={() => setFilterPeriod('today')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
            filterPeriod === 'today'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          {language === 'sw' ? 'Leo' : 'Today'}
        </button>
        <button
          onClick={() => setFilterPeriod('week')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
            filterPeriod === 'week'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          {language === 'sw' ? 'Siku 7' : '7 Days'}
        </button>
        <button
          onClick={() => setFilterPeriod('month')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
            filterPeriod === 'month'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          {language === 'sw' ? 'Mwezi Huu' : '30 Days'}
        </button>
      </div>

      {/* Payment Type Pill Filter */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setPaymentFilter('all')}
          className={`px-3 py-1 rounded-lg text-xs font-medium ${
            paymentFilter === 'all'
              ? 'bg-emerald-800 text-white'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          }`}
        >
          {language === 'sw' ? 'Malipo Yote' : 'All Types'}
        </button>
        <button
          onClick={() => setPaymentFilter('cash')}
          className={`px-3 py-1 rounded-lg text-xs font-medium ${
            paymentFilter === 'cash'
              ? 'bg-emerald-800 text-white'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          }`}
        >
          Cash
        </button>
        <button
          onClick={() => setPaymentFilter('credit')}
          className={`px-3 py-1 rounded-lg text-xs font-medium ${
            paymentFilter === 'credit'
              ? 'bg-amber-600 text-white'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          }`}
        >
          Mkopo (Credit)
        </button>

        <div className="ml-auto text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300">
          KES {totalFilteredAmount.toLocaleString()}
        </div>
      </div>

      {/* Sales List */}
      {filteredSales.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 text-center border border-dashed border-neutral-300 dark:border-neutral-800">
          <Receipt className="w-10 h-10 mx-auto text-neutral-400 mb-2" />
          <h3 className="font-bold text-sm mb-1">{language === 'sw' ? 'Hakuna mauzo yaliyopatikana' : 'No sales records found'}</h3>
          <p className="text-xs text-neutral-500">
            {language === 'sw' ? 'Rekodi mauzo ya kwanza katika kichupo cha Uza.' : 'Record your first transaction in the Sell tab.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSales.map(sale => {
            const dateFormatted = new Date(sale.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={sale.id}
                onClick={() => setActiveReceipt(sale)}
                className="bg-white dark:bg-neutral-900 rounded-2xl p-3 border border-neutral-200 dark:border-neutral-800 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500 transition-colors"
              >
                <div className="truncate flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                      {sale.receiptNumber}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                      sale.paymentType === 'credit'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}>
                      {sale.paymentType === 'credit' ? (language === 'sw' ? 'Mkopo' : 'Credit') : 'Cash'}
                    </span>
                  </div>

                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                    {sale.customerName ? `${language === 'sw' ? 'Mteja' : 'Customer'}: ${sale.customerName} · ` : ''}
                    {sale.items.length} {language === 'sw' ? 'aina ya bidhaa' : 'items'} ({dateFormatted})
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-mono font-black text-neutral-900 dark:text-white">
                    KES {sale.totalAmount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-mono">
                    +KES {sale.grossProfit.toLocaleString()} {language === 'sw' ? 'faida' : 'profit'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Receipt Detail Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
              <div>
                <h3 className="font-bold text-base">{language === 'sw' ? 'Risiti ya Mauzo' : 'Sale Receipt'}</h3>
                <div className="font-mono text-xs text-neutral-500">{activeReceipt.receiptNumber}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                activeReceipt.paymentType === 'credit' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {activeReceipt.paymentType === 'credit' ? (language === 'sw' ? 'Mkopo' : 'Credit') : 'Cash'}
              </span>
            </div>

            <div className="text-xs space-y-1.5">
              <div className="text-neutral-500">
                {new Date(activeReceipt.createdAt).toLocaleString()}
              </div>
              {activeReceipt.customerName && (
                <div className="font-bold text-emerald-700 dark:text-emerald-400">
                  {language === 'sw' ? 'Mteja aliyekopa: ' : 'Credit debtor: '} {activeReceipt.customerName}
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3 text-xs space-y-2 border border-neutral-200 dark:border-neutral-700/60 font-mono">
              {activeReceipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="truncate pr-2">{item.productName} x{item.quantity}</span>
                  <span className="shrink-0">KES {item.total.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-2 flex justify-between font-bold text-sm">
                <span>{t.total}:</span>
                <span className="text-emerald-600">KES {activeReceipt.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setActiveReceipt(null)}
              className="w-full py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold rounded-xl text-xs"
            >
              {language === 'sw' ? 'Funga' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
