import React, { useState, useMemo } from 'react';
import { X, ShieldCheck, MessageSquare, Smartphone, CheckCircle, ArrowDownLeft, ArrowUpRight, Calendar, DollarSign, Send, Zap } from 'lucide-react';
import { Customer, Shop, Sale, DebtPayment } from '../types/index.ts';
import { calculateTrustScore } from '../lib/trustScore.ts';
import { formatPhoneForWhatsApp } from '../lib/whatsapp.ts';
import { Language, translations } from '../lib/translations.ts';

interface CustomerStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  shop: Shop;
  sales: Sale[];
  payments: DebtPayment[];
  onRecordPayment: (customerId: string, amount: number, method: 'cash' | 'mpesa', mpesaCode?: string, note?: string) => DebtPayment;
  language: Language;
}

interface TimelineEvent {
  id: string;
  type: 'credit_sale' | 'repayment';
  date: string;
  amount: number;
  description: string;
  reference?: string;
}

export const CustomerStatementModal: React.FC<CustomerStatementModalProps> = ({
  isOpen,
  onClose,
  customer,
  shop,
  sales,
  payments,
  onRecordPayment,
  language,
}) => {
  const t = translations[language];

  // STK Push state
  const [showStkPush, setShowStkPush] = useState(false);
  const [stkAmount, setStkAmount] = useState<string>('');
  const [stkStage, setStkStage] = useState<'prompt' | 'simulating' | 'pin_entry' | 'success'>('prompt');
  const [stkPin, setStkPin] = useState('');
  const [stkReceiptCode, setStkReceiptCode] = useState('');

  if (!isOpen || !customer) return null;

  const trust = calculateTrustScore(customer);

  // Compile unified transaction timeline
  const timeline: TimelineEvent[] = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Credit sales
    sales
      .filter(s => s.customerId === customer.id && s.paymentType === 'credit')
      .forEach(s => {
        events.push({
          id: s.id,
          type: 'credit_sale',
          date: s.createdAt,
          amount: s.totalAmount,
          description: s.items.map(i => `${i.productName} (x${i.quantity})`).join(', '),
          reference: s.receiptNumber,
        });
      });

    // Repayments
    payments
      .filter(p => p.customerId === customer.id)
      .forEach(p => {
        events.push({
          id: p.id,
          type: 'repayment',
          date: p.paidAt,
          amount: p.amount,
          description: p.method === 'mpesa' ? `M-Pesa Payment ${p.mpesaCode ? `(${p.mpesaCode})` : ''}` : 'Cash Payment',
          reference: p.mpesaCode,
        });
      });

    // Sort descending by date
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, payments, customer.id]);

  // WhatsApp Statement share message
  const handleShareStatementWhatsApp = () => {
    const phone = formatPhoneForWhatsApp(customer.phoneNumber);
    const customerName = customer.nickname || customer.name;
    const debtStr = customer.currentDebt.toLocaleString();

    let text = language === 'sw'
      ? `*Taarifa ya Deni (Statement) - ${shop.name}*\n`
      : `*Credit Statement - ${shop.name}*\n`;

    text += `Mteja / Customer: ${customerName}\n`;
    text += `Salio Linalodaiwa: KES ${debtStr}\n\n`;
    text += `*Historia ya Hivi Karibuni:*\n`;

    timeline.slice(0, 5).forEach(evt => {
      const dateStr = new Date(evt.date).toLocaleDateString();
      if (evt.type === 'credit_sale') {
        text += `• ${dateStr}: Mkopo +KES ${evt.amount.toLocaleString()} (${evt.reference})\n`;
      } else {
        text += `• ${dateStr}: Malipo -KES ${evt.amount.toLocaleString()} (${evt.description})\n`;
      }
    });

    const mpesa = shop.mpesaNumber ? `Lipa Na M-Pesa Till: ${shop.mpesaNumber}` : '';
    text += `\nTafadhali lipia kupitia ${mpesa}. Asante!`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Trigger STK Push Simulation
  const handleStartStkPush = () => {
    const amount = Number(stkAmount) || customer.currentDebt;
    if (amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    setStkStage('simulating');

    // Simulate network delay to Safaricom Daraja API
    setTimeout(() => {
      setStkStage('pin_entry');
    }, 1200);
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(stkAmount) || customer.currentDebt;
    const randomCode = 'QK' + Math.floor(10000000 + Math.random() * 90000000);
    setStkReceiptCode(randomCode);
    setStkStage('success');

    // Automatically record payment in database
    onRecordPayment(customer.id, amount, 'mpesa', randomCode, 'Safaricom Daraja STK Push');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">
                {customer.nickname ? `${customer.nickname} (${customer.name})` : customer.name}
              </h3>
            </div>
            <div className="text-xs text-neutral-500 font-mono mt-0.5 flex items-center gap-2">
              <span>{customer.phoneNumber}</span>
              {customer.locationNote && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{customer.locationNote}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Balance & Trust Score Banner */}
        <div className="grid grid-cols-2 gap-2.5 shrink-0">
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700">
            <span className="text-[10px] text-neutral-500 font-semibold block uppercase">
              {language === 'sw' ? 'Salio Linalodaiwa' : 'Balance Owed'}
            </span>
            <span className="text-lg font-mono font-black text-rose-600 dark:text-rose-400">
              KES {customer.currentDebt.toLocaleString()}
            </span>
            <span className="text-[10px] text-neutral-500 block font-mono">
              Total borrowed: KES {customer.totalBorrowed.toLocaleString()}
            </span>
          </div>

          <div className={`p-3 rounded-2xl border flex flex-col justify-between ${trust.colorClass}`}>
            <div>
              <span className="text-[10px] font-semibold block uppercase opacity-80">
                {t.trustScore}
              </span>
              <span className="text-base font-bold">
                {language === 'sw' ? trust.labelSwahili : trust.label}
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold mt-1">
              {trust.score}% repaid ({customer.totalRepaid.toLocaleString()} KES)
            </span>
          </div>
        </div>

        {/* Action Buttons: Daraja STK Push & WhatsApp Statement */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setShowStkPush(true);
              setStkAmount(customer.currentDebt > 0 ? customer.currentDebt.toString() : '100');
              setStkStage('prompt');
            }}
            className="flex-1 py-2 px-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>M-Pesa STK Push</span>
          </button>

          <button
            onClick={handleShareStatementWhatsApp}
            className="py-2 px-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{language === 'sw' ? 'Tuma Statement' : 'Share Statement'}</span>
          </button>
        </div>

        {/* Statement Timeline Header */}
        <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
          <span>{language === 'sw' ? 'Mwenendo wa Madeni na Malipo' : 'Transaction Audit Ledger'}</span>
          <span className="text-neutral-500 font-normal text-[11px] font-mono">
            {timeline.length} {language === 'sw' ? 'rekodi' : 'records'}
          </span>
        </div>

        {/* Scrollable Timeline */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[140px]">
          {timeline.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              {language === 'sw' ? 'Hakuna rekodi za deni zilizopatikana' : 'No credit transactions on record'}
            </div>
          ) : (
            timeline.map(item => {
              const isCredit = item.type === 'credit_sale';
              const dateStr = new Date(item.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 text-xs flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 truncate flex-1">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                      }`}
                    >
                      {isCredit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold truncate">
                        {isCredit ? (language === 'sw' ? 'Mkopo Uliochukuliwa' : 'Credit Purchase') : (language === 'sw' ? 'Malipo Yaliyopokelewa' : 'Payment Received')}
                      </div>
                      <div className="text-[10px] text-neutral-500 truncate">
                        {item.description} ({dateStr})
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <div className={`font-bold ${isCredit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {isCredit ? `+KES ${item.amount.toLocaleString()}` : `-KES ${item.amount.toLocaleString()}`}
                    </div>
                    {item.reference && (
                      <div className="text-[9px] text-neutral-400 truncate max-w-[80px]">
                        {item.reference}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Kenya DPA Footer Note */}
        <div className="p-2 bg-neutral-100 dark:bg-neutral-800/40 rounded-xl text-[10px] text-neutral-500 flex items-center gap-1.5 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Kenya DPA 2019: Recorded with verbal/written consent for credit communications.</span>
        </div>
      </div>

      {/* M-Pesa STK Push Simulation Modal */}
      {showStkPush && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                  M
                </div>
                <div>
                  <h4 className="font-bold text-sm">Safaricom Daraja STK Push</h4>
                  <p className="text-[10px] text-neutral-500">M-Pesa Prompt Simulator</p>
                </div>
              </div>
              <button onClick={() => setShowStkPush(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {stkStage === 'prompt' && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  Sends an instant payment popup to customer's phone ({customer.phoneNumber}). When they input their M-Pesa PIN, their debt clears automatically.
                </p>
                <div>
                  <label className="block text-xs font-bold mb-1">Amount to Collect (KES)</label>
                  <input
                    type="number"
                    value={stkAmount}
                    onChange={e => setStkAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="KES Amount"
                  />
                </div>
                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-neutral-500">
                    <span>Payee Till:</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{shop.mpesaNumber || '524108'}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Recipient:</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{customer.name}</span>
                  </div>
                </div>
                <button
                  onClick={handleStartStkPush}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Zap className="w-4 h-4" />
                  <span>Send STK Push Prompt</span>
                </button>
              </div>
            )}

            {stkStage === 'simulating' && (
              <div className="py-8 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="font-bold text-sm">Initiating Daraja STK Push...</div>
                <p className="text-xs text-neutral-500">Contacting Safaricom gateway for {customer.phoneNumber}</p>
              </div>
            )}

            {stkStage === 'pin_entry' && (
              <form onSubmit={handleConfirmPin} className="space-y-3">
                <div className="bg-neutral-900 text-emerald-400 p-3.5 rounded-2xl font-mono text-xs border border-emerald-500/40 shadow-inner space-y-2">
                  <div className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">
                    SIM TOOLKIT / M-PESA
                  </div>
                  <p className="text-white leading-relaxed">
                    Do you want to pay KES {Number(stkAmount || customer.currentDebt).toLocaleString()} to {shop.name} {shop.mpesaNumber ? `Till ${shop.mpesaNumber}` : ''}?
                  </p>
                  <div>
                    <label className="block text-[10px] text-emerald-300 uppercase mb-1">Enter M-Pesa PIN:</label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      autoFocus
                      value={stkPin}
                      onChange={e => setStkPin(e.target.value)}
                      placeholder="****"
                      className="w-full p-2 bg-neutral-950 text-white text-center text-lg font-bold tracking-widest rounded-lg border border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm PIN & Complete Payment</span>
                </button>
              </form>
            )}

            {stkStage === 'success' && (
              <div className="text-center space-y-3 py-2">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-emerald-600">M-Pesa Payment Received!</h4>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl text-xs font-mono space-y-1">
                  <div>Ref Code: <strong>{stkReceiptCode}</strong></div>
                  <div>Amount: <strong>KES {Number(stkAmount || customer.currentDebt).toLocaleString()}</strong></div>
                  <div className="text-emerald-600 font-bold">Debt balance updated immediately!</div>
                </div>
                <button
                  onClick={() => setShowStkPush(false)}
                  className="w-full py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-xl text-xs"
                >
                  Close & View Statement
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
