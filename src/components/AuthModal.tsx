import React, { useState } from 'react';
import { Smartphone, KeyRound, Store, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';
import { Shop } from '../types/index.ts';
import { Language, translations } from '../lib/translations.ts';

interface AuthModalProps {
  isOpen: boolean;
  onCompleteAuth: (shop: Shop) => void;
  language: Language;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onCompleteAuth,
  language,
  onClose,
}) => {
  const t = translations[language];

  const [step, setStep] = useState<'phone' | 'otp' | 'shop'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('4829');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mpesaType, setMpesaType] = useState<'till' | 'paybill' | 'send_money'>('till');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleQuickDemo = () => {
    const demoShop: Shop = {
      id: `shop_${Date.now()}`,
      name: "Isaac's Duka Store",
      ownerName: 'Isaac Kipngetich',
      phoneNumber: '0712 345 678',
      mpesaType: 'till',
      mpesaNumber: '524108',
      currency: 'KES',
      lowStockDefault: 5,
      createdAt: new Date().toISOString(),
    };
    onCompleteAuth(demoShop);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setIsLoading(true);

    setTimeout(() => {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      setStep('otp');
      setIsLoading(false);
    }, 400);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === generatedOtp || otp === '1234' || otp.trim().length >= 4) {
      setStep('shop');
    } else {
      alert(language === 'sw' ? 'Nambari ya OTP si sahihi (Jaribu: ' + generatedOtp + ')' : 'Invalid OTP code. Try: ' + generatedOtp);
    }
  };

  const handleFinishSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;

    const newShop: Shop = {
      id: `shop_${Date.now()}`,
      name: shopName.trim(),
      ownerName: ownerName.trim() || 'Duka Attendant',
      phoneNumber: phoneNumber.trim() || '0712345678',
      mpesaType,
      mpesaNumber: mpesaNumber.trim(),
      currency: 'KES',
      lowStockDefault: 5,
      createdAt: new Date().toISOString(),
    };

    onCompleteAuth(newShop);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 relative">
        {/* Close Button if dismissible */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 rounded-lg"
            aria-label="Close"
          >
            ✕
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-emerald-800 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">Duka Tracker</h2>
          <p className="text-xs text-neutral-500">
            {language === 'sw' ? 'Ingia kwa nambari ya simu & weka duka lako' : 'Sign in with phone number & set up your duka'}
          </p>
        </div>

        {/* Step 1: Phone Number */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">
                {language === 'sw' ? 'Nambari ya Simu (M-Pesa)' : 'Phone Number (Kenya)'}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  autoFocus
                  placeholder="0712 345 678"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="w-full pl-3 pr-3 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                {language === 'sw' ? 'Tutatuma msimbo wa OTP kwa SMS' : 'A verification OTP will be sent via SMS'}
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <span>{isLoading ? 'Sending...' : (language === 'sw' ? 'Tuma Msimbo wa OTP' : 'Send Verification OTP')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
              <span className="bg-white dark:bg-neutral-900 px-2 text-[10px] text-neutral-400 uppercase font-bold tracking-wider">or</span>
            </div>

            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-700 transition-colors"
            >
              <span>⚡ Quick Start with Demo Shop</span>
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold">
                  {language === 'sw' ? 'Weka Msimbo wa OTP' : 'Enter 4-Digit OTP'}
                </label>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  Demo SMS OTP: {generatedOtp}
                </span>
              </div>
              <input
                type="text"
                required
                autoFocus
                maxLength={6}
                placeholder={generatedOtp}
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full py-3 text-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xl font-mono font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-neutral-500 mt-1 text-center">
                {language === 'sw' ? 'Msimbo umetumwa kwa' : 'Code sent to'} {phoneNumber}
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{language === 'sw' ? 'Thibitisha na Uendelee' : 'Verify & Continue'}</span>
            </button>
          </form>
        )}

        {/* Step 3: Setup Initial Duka */}
        {step === 'shop' && (
          <form onSubmit={handleFinishSetup} className="space-y-3">
            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Store className="w-4 h-4" />
              <span>{language === 'sw' ? 'Taarifa za Duka Lako' : 'Shop Details'}</span>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">{t.shopName} *</label>
              <input
                type="text"
                required
                autoFocus
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                placeholder="e.g. Mama Brian Duka & Cereals"
                className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                {language === 'sw' ? 'Jina Lako (Mwenye Duka)' : 'Your Name'}
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder="e.g. Isaac Kipngetich"
                className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                {language === 'sw' ? 'Njia ya Malipo ya M-Pesa' : 'M-Pesa Setup'}
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setMpesaType('till')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${
                    mpesaType === 'till'
                      ? 'bg-emerald-700 text-white border-emerald-800'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Buy Goods Till
                </button>
                <button
                  type="button"
                  onClick={() => setMpesaType('paybill')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${
                    mpesaType === 'paybill'
                      ? 'bg-emerald-700 text-white border-emerald-800'
                      : 'bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Paybill
                </button>
              </div>
              <input
                type="text"
                value={mpesaNumber}
                onChange={e => setMpesaNumber(e.target.value)}
                placeholder={mpesaType === 'till' ? 'Till Number (e.g. 524108)' : 'Paybill Number'}
                className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors mt-2"
            >
              <span>{language === 'sw' ? 'Fungua Duka Lako' : 'Open My Duka'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
