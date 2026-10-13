import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Phone, MessageSquare, Send, CheckCircle, Shield, AlertCircle, Trash2, ArrowUpRight, DollarSign, Download, FileText } from 'lucide-react';
import { Customer, Shop, DebtPayment, Sale } from '../types/index.ts';
import { calculateTrustScore } from '../lib/trustScore.ts';
import { getWhatsAppUrl, getSmsUrl } from '../lib/whatsapp.ts';
import { exportDebtsToCSV } from '../lib/export.ts';
import { CustomerStatementModal } from './CustomerStatementModal.tsx';
import { Language, translations } from '../lib/translations.ts';

interface DebtsTabProps {
  customers: Customer[];
  shop: Shop;
  sales: Sale[];
  payments: DebtPayment[];
  onRecordPayment: (customerId: string, amount: number, method: 'cash' | 'mpesa', mpesaCode?: string, note?: string) => DebtPayment;
  onDeleteCustomer: (customerId: string) => void;
  onOpenAddCustomer: () => void;
  language: Language;
}

export const DebtsTab: React.FC<DebtsTabProps> = ({
  customers,
  shop,
  sales,
  payments,
  onRecordPayment,
  onDeleteCustomer,
  onOpenAddCustomer,
  language,
}) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_debt' | 'cleared'>('with_debt');
  
  // Payment Modal state
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<'cash' | 'mpesa'>('mpesa');
  const [mpesaCode, setMpesaCode] = useState<string>('');
  const [payNote, setPayNote] = useState<string>('');

  // Delete Customer Confirm
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // Statement Modal
  const [selectedStatementCustomer, setSelectedStatementCustomer] = useState<Customer | null>(null);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = c.name.toLowerCase().includes(q) ||
        (c.nickname && c.nickname.toLowerCase().includes(q)) ||
        c.phoneNumber.includes(q);

      if (!matchesSearch) return false;
      if (filterType === 'with_debt') return c.currentDebt > 0;
      if (filterType === 'cleared') return c.currentDebt <= 0;
      return true;
    });
  }, [customers, searchQuery, filterType]);

  // Aggregate totals
  const totalDebtAmount = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.currentDebt, 0);
  }, [customers]);

  const debtorCount = useMemo(() => {
    return customers.filter(c => c.currentDebt > 0).length;
  }, [customers]);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer) return;
    const amount = Number(payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(language === 'sw' ? 'Tafadhali weka kiasi halali' : 'Please enter a valid payment amount');
      return;
    }

    onRecordPayment(payingCustomer.id, amount, payMethod, mpesaCode, payNote);
    setPayingCustomer(null);
    setPayAmount('');
    setMpesaCode('');
    setPayNote('');
  };

  const handleConfirmDelete = () => {
    if (deletingCustomer) {
      onDeleteCustomer(deletingCustomer.id);
      setDeletingCustomer(null);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Summary Card */}
      <div className="bg-amber-900 text-white rounded-2xl p-4 shadow-sm border border-amber-950/40">
        <div className="text-xs text-amber-200/90 font-medium">
          {t.totalOwed} ({debtorCount} {language === 'sw' ? 'wateja' : 'customers'})
        </div>
        <div className="text-2xl font-mono font-black mt-1 text-white">
          KES {totalDebtAmount.toLocaleString()}
        </div>
        <div className="text-[11px] text-amber-200/80 mt-1 flex items-center justify-between">
          <span>{language === 'sw' ? 'Kikumbusho kwa WhatsApp & M-Pesa' : 'One-tap WhatsApp & M-Pesa reminders'}</span>
          <span className="font-mono">{shop.mpesaNumber ? `Till: ${shop.mpesaNumber}` : ''}</span>
        </div>
      </div>

      {/* Search and Add */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={t.searchCustomers}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={() => exportDebtsToCSV(customers, shop.name)}
          className="min-h-[44px] px-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
          title="Export Debts to Excel / CSV"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">CSV</span>
        </button>
        <button
          onClick={onOpenAddCustomer}
          className="min-h-[44px] px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">{t.addNewCustomer}</span>
        </button>
      </div>

      {/* Filter Tabs (Functional segmented buttons) */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl">
        <button
          onClick={() => setFilterType('with_debt')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
            filterType === 'with_debt'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          {language === 'sw' ? 'Wenye Deni Pekee' : 'With Balance'} ({debtorCount})
        </button>
        <button
          onClick={() => setFilterType('all')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
            filterType === 'all'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          {language === 'sw' ? 'Wote' : 'All Customers'} ({customers.length})
        </button>
        <button
          onClick={() => setFilterType('cleared')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
            filterType === 'cleared'
              ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          {language === 'sw' ? 'Waliolipa Zote' : 'Cleared (0)'}
        </button>
      </div>

      {/* Customer Debt List */}
      {customers.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 text-center border border-dashed border-neutral-300 dark:border-neutral-800">
          <Shield className="w-10 h-10 mx-auto text-emerald-600 mb-2 opacity-80" />
          <h3 className="font-bold text-sm mb-1">{t.emptyDebts}</h3>
          <p className="text-xs text-neutral-500 mb-4 max-w-xs mx-auto">
            {t.emptyDebtsDesc}
          </p>
          <button
            onClick={onOpenAddCustomer}
            className="px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800"
          >
            {t.addNewCustomer}
          </button>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-500">
          {language === 'sw' ? 'Hakuna mteja anayelingana na kichujio chako' : 'No customer records match this filter'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredCustomers.map(customer => {
            const trust = calculateTrustScore(customer);
            const hasDebt = customer.currentDebt > 0;
            const waUrl = hasDebt ? getWhatsAppUrl(customer, shop, language) : '#';
            const smsUrl = hasDebt ? getSmsUrl(customer, shop, language) : '#';

            return (
              <div
                key={customer.id}
                className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3"
              >
                {/* Header: Name, Phone & Debt Balance */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white">
                        {customer.nickname || customer.name}
                      </span>
                      {customer.nickname && (
                        <span className="text-xs text-neutral-500">({customer.name})</span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                      <span className="font-mono">{customer.phoneNumber}</span>
                      {customer.locationNote && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate max-w-[120px]">{customer.locationNote}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-neutral-500 uppercase font-semibold">
                      {hasDebt ? (language === 'sw' ? 'Anadaiwa' : 'Owed') : (language === 'sw' ? 'Sifuri' : 'Cleared')}
                    </div>
                    <div className={`text-base font-mono font-black ${hasDebt ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                      KES {customer.currentDebt.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Trust Score & Repayment Stats Bar */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-neutral-500">{t.trustScore}:</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${trust.colorClass}`}>
                      {language === 'sw' ? trust.labelSwahili : trust.label} ({trust.score}%)
                    </span>
                  </div>

                  <div className="text-[10px] text-neutral-500 font-mono">
                    {language === 'sw' ? 'Jumla ya mkopo: ' : 'Total borrowed: '}
                    KES {customer.totalBorrowed.toLocaleString()}
                  </div>
                </div>

                {/* Action Buttons: Record Payment, Statement, WhatsApp Reminder, SMS Reminder, DPA Delete */}
                <div className="flex items-center gap-1.5 pt-1">
                  {/* Record Payment */}
                  <button
                    onClick={() => {
                      setPayingCustomer(customer);
                      setPayAmount(customer.currentDebt.toString());
                    }}
                    className="flex-1 min-h-[40px] px-3 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{t.recordPayment}</span>
                  </button>

                  {/* Statement & Daraja STK Push button */}
                  <button
                    onClick={() => setSelectedStatementCustomer(customer)}
                    className="min-h-[40px] px-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 rounded-xl flex items-center justify-center text-xs font-bold transition-colors"
                    title={language === 'sw' ? 'Ona Taarifa & M-Pesa STK Push' : 'View Statement & STK Push'}
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span className="ml-1 hidden sm:inline">{language === 'sw' ? 'Taarifa' : 'Statement'}</span>
                  </button>

                  {/* WhatsApp Reminder (Enabled only if has debt) */}
                  {hasDebt && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[40px] min-w-[40px] px-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 rounded-xl flex items-center justify-center text-xs font-bold transition-colors"
                      title={t.whatsappReminder}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      <span className="ml-1 hidden sm:inline">WhatsApp</span>
                    </a>
                  )}

                  {/* SMS Reminder */}
                  {hasDebt && (
                    <a
                      href={smsUrl}
                      className="min-h-[40px] min-w-[40px] px-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 rounded-xl flex items-center justify-center text-xs transition-colors"
                      title={t.smsReminder}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* DPA Delete button */}
                  <button
                    onClick={() => setDeletingCustomer(customer)}
                    className="min-h-[40px] min-w-[40px] text-neutral-400 hover:text-rose-600 rounded-xl flex items-center justify-center transition-colors"
                    title={t.deleteCustomer}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Payment Modal */}
      {payingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handlePaymentSubmit}
            className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4"
          >
            <div>
              <h3 className="font-bold text-base">{t.recordPayment}</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {payingCustomer.nickname || payingCustomer.name} (Balance: KES {payingCustomer.currentDebt.toLocaleString()})
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">{t.amountPaid} *</label>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. 500"
                />
              </div>

              {/* Quick amount shortcuts */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPayAmount(payingCustomer.currentDebt.toString())}
                  className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-[11px] font-bold text-emerald-600"
                >
                  {language === 'sw' ? 'Lipa Zote' : 'Full Balance'}
                </button>
                {payingCustomer.currentDebt > 200 && (
                  <button
                    type="button"
                    onClick={() => setPayAmount(Math.round(payingCustomer.currentDebt / 2).toString())}
                    className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-[11px] font-medium"
                  >
                    50%
                  </button>
                )}
              </div>

              {/* Method: Cash vs M-Pesa */}
              <div>
                <label className="block text-xs font-bold mb-1">{t.paymentMethod}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('mpesa')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      payMethod === 'mpesa'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    M-Pesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('cash')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      payMethod === 'cash'
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-950 shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    Cash
                  </button>
                </div>
              </div>

              {payMethod === 'mpesa' && (
                <div>
                  <label className="block text-xs font-bold mb-1">{t.mpesaRef}</label>
                  <input
                    type="text"
                    value={mpesaCode}
                    onChange={e => setMpesaCode(e.target.value.toUpperCase())}
                    placeholder="e.g. QK8912KLMN"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayingCustomer(null)}
                className="flex-1 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 shadow-sm"
              >
                {t.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Customer Confirmation Modal (Kenya DPA Right to Erasure) */}
      {deletingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">{t.deleteCustomer}</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {t.deleteConfirm}
            </p>
            <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-mono">
              <strong>{deletingCustomer.name}</strong> ({deletingCustomer.phoneNumber})
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeletingCustomer(null)}
                className="flex-1 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
              >
                {language === 'sw' ? 'Futa Kabisa' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Statement Modal with Daraja STK Push Simulator */}
      {selectedStatementCustomer && (
        <CustomerStatementModal
          isOpen={!!selectedStatementCustomer}
          onClose={() => setSelectedStatementCustomer(null)}
          customer={selectedStatementCustomer}
          shop={shop}
          sales={sales}
          payments={payments}
          onRecordPayment={onRecordPayment}
          language={language}
        />
      )}
    </div>
  );
};
