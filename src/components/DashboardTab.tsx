import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, Users, AlertTriangle, Package, Calendar, Award, Database, ShoppingBag, Cloud, Rocket } from 'lucide-react';
import { Sale, Product, Customer } from '../types/index.ts';
import { Language, translations } from '../lib/translations.ts';

interface DashboardTabProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  onNavigateTab: (tab: 'sell' | 'debts' | 'stock' | 'history') => void;
  onOpenSchemaModal: () => void;
  onOpenSupabaseModal: () => void;
  onOpenGoLiveModal?: () => void;
  language: Language;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  sales,
  products,
  customers,
  onNavigateTab,
  onOpenSchemaModal,
  onOpenSupabaseModal,
  onOpenGoLiveModal,
  language,
}) => {
  const t = translations[language];
  const todayStr = new Date().toISOString().slice(0, 10);

  // Today's Sales
  const todaySales = useMemo(() => {
    return sales.filter((s: Sale) => s.createdAt.slice(0, 10) === todayStr);
  }, [sales, todayStr]);

  const todayTotalRevenue = useMemo(() => {
    return todaySales.reduce((sum: number, s: Sale) => sum + s.totalAmount, 0);
  }, [todaySales]);

  const todayCashRevenue = useMemo(() => {
    return todaySales.filter((s: Sale) => s.paymentType === 'cash').reduce((sum: number, s: Sale) => sum + s.totalAmount, 0);
  }, [todaySales]);

  const todayCreditRevenue = useMemo(() => {
    return todaySales.filter((s: Sale) => s.paymentType === 'credit').reduce((sum: number, s: Sale) => sum + s.totalAmount, 0);
  }, [todaySales]);

  const todayGrossProfit = useMemo(() => {
    return todaySales.reduce((sum: number, s: Sale) => sum + s.grossProfit, 0);
  }, [todaySales]);

  // Overall Debts
  const totalDebtsOwed = useMemo(() => {
    return customers.reduce((sum: number, c: Customer) => sum + c.currentDebt, 0);
  }, [customers]);

  const debtorsCount = useMemo(() => {
    return customers.filter((c: Customer) => c.currentDebt > 0).length;
  }, [customers]);

  // Low stock products
  const lowStockItems = useMemo(() => {
    return products.filter((p: Product) => p.quantity <= p.lowStockThreshold);
  }, [products]);

  // Top selling products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    sales.forEach((sale: Sale) => {
      sale.items.forEach((item) => {
        const existing = map.get(item.productId) || { name: item.productName, qty: 0, revenue: 0 };
        existing.qty += item.quantity;
        existing.revenue += item.total;
        map.set(item.productId, existing);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales]);

  return (
    <div className="space-y-4 pb-20 select-none">
      {/* Top Banner / Summary */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-3xl p-5 shadow-lg border border-emerald-700/50 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
              {language === 'sw' ? 'Muhtasari wa Leo' : "Today's Business Summary"}
            </span>
            <h2 className="text-2xl font-black tracking-tight mt-0.5">
              KES {todayTotalRevenue.toLocaleString()}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-700/60 border border-emerald-500/40 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-200" />
          </div>
        </div>

        {/* Quick Breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-700/60 text-xs">
          <div className="bg-emerald-900/40 rounded-xl p-2.5">
            <div className="text-[10px] text-emerald-300">Cash</div>
            <div className="font-bold font-mono">KES {todayCashRevenue.toLocaleString()}</div>
          </div>
          <div className="bg-emerald-900/40 rounded-xl p-2.5">
            <div className="text-[10px] text-emerald-300">Credit (Mkopo)</div>
            <div className="font-bold font-mono">KES {todayCreditRevenue.toLocaleString()}</div>
          </div>
          <div className="bg-emerald-900/40 rounded-xl p-2.5">
            <div className="text-[10px] text-emerald-300">Est. Profit</div>
            <div className="font-bold font-mono text-emerald-300">+{todayGrossProfit.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Go Live / Launch Real Store Quick Action */}
      {onOpenGoLiveModal && (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100/70 dark:from-amber-950/40 dark:to-neutral-900 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-950 dark:text-amber-200">
                {language === 'sw' ? 'Je, Uko Tayari Kufanya Biashara Halisi?' : 'Ready to Start Real Business?'}
              </div>
              <div className="text-[11px] text-amber-900/80 dark:text-amber-300/80">
                {language === 'sw'
                  ? 'Futa data ya majaribio, weka jina lako & nambari ya Till.'
                  : 'Clear demo sales, configure your Till number & start trading.'}
              </div>
            </div>
          </div>
          <button
            onClick={onOpenGoLiveModal}
            className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black rounded-xl text-xs shrink-0 shadow-xs transition-transform active:scale-95"
          >
            {language === 'sw' ? 'Zindua' : 'Go Live'}
          </button>
        </div>
      )}

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Credit Owed */}
        <div
          onClick={() => onNavigateTab('debts')}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-xs cursor-pointer hover:border-emerald-500 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold">{t.totalOwed}</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black mt-2 font-mono text-rose-600 dark:text-rose-400">
            KES {totalDebtsOwed.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {debtorsCount} {debtorsCount === 1 ? 'customer owing' : 'customers owing'}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => onNavigateTab('stock')}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-xs cursor-pointer hover:border-emerald-500 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold">{t.lowStockAlerts}</span>
            <Package className="w-4 h-4 text-rose-600" />
          </div>
          <div className={`text-xl font-black mt-2 font-mono ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {lowStockItems.length} {language === 'sw' ? 'bidhaa' : 'items'}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 truncate">
            {lowStockItems.length === 0 ? t.allStockGood : 'Restock needed'}
          </div>
        </div>
      </div>

      {/* Cloud & PostgreSQL Schema Quick Launch */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onOpenSupabaseModal}
          className="p-3 bg-white dark:bg-neutral-900 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-left hover:bg-emerald-50 dark:hover:bg-neutral-800 transition-colors shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <Cloud className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">Cloud Database</div>
            <div className="text-[10px] text-neutral-500 truncate">Supabase sync & keys</div>
          </div>
        </button>

        <button
          onClick={onOpenSchemaModal}
          className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center gap-2.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">Postgres SQL</div>
            <div className="text-[10px] text-neutral-500 truncate">View tables & RLS</div>
          </div>
        </button>
      </div>

      {/* Restock Warning Banner (if any) */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              {language === 'sw' ? 'Bidhaa Zinazohitaji Kuagizwa Haraka' : 'Urgent Restock Needed'}
            </span>
            <button
              onClick={() => onNavigateTab('stock')}
              className="text-[11px] underline"
            >
              {language === 'sw' ? 'Ona Zote' : 'View Stock'}
            </button>
          </div>
          <div className="divide-y divide-amber-200/50 dark:divide-amber-900/40 text-xs">
            {lowStockItems.slice(0, 4).map((item: Product) => (
              <div key={item.id} className="py-1.5 flex items-center justify-between">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate pr-2">
                  {item.name}
                </span>
                <span className="font-mono text-rose-600 font-bold shrink-0">
                  {item.quantity} {item.unit} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Selling Products */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-600" />
            {language === 'sw' ? 'Bidhaa Zinazouza Sana' : 'Top Selling Items'}
          </span>
          <span className="text-neutral-500 font-normal">{sales.length} {language === 'sw' ? 'mauzo' : 'sales total'}</span>
        </div>

        {topProducts.length === 0 ? (
          <div className="py-4 text-center text-xs text-neutral-400">
            {language === 'sw' ? 'Bado hakuna takwimu za mauzo' : 'No sales recorded yet'}
          </div>
        ) : (
          <div className="space-y-2">
            {topProducts.map((p, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-neutral-100 dark:border-neutral-800/80 last:border-0">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="w-5 h-5 rounded-md bg-neutral-100 dark:bg-neutral-800 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold truncate">{p.name}</span>
                </div>
                <div className="text-right shrink-0 font-mono">
                  <div className="font-bold">{p.qty} sold</div>
                  <div className="text-[10px] text-neutral-500">KES {p.revenue.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
