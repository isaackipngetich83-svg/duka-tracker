import React, { useState } from 'react';
import { X, Rocket, CheckCircle2, Copy, Check, ExternalLink, Smartphone, Database, Trash2, Store, RefreshCw, AlertCircle, Github, Download } from 'lucide-react';
import { Shop } from '../types/index.ts';
import { Language, translations } from '../lib/translations.ts';
import { isSupabaseConfigured, SupabaseSync } from '../lib/supabase.ts';
import { DukaStorage } from '../lib/storage.ts';

interface GoLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop | null;
  onUpdateShop: (shopData: Omit<Shop, 'id' | 'createdAt'>) => void;
  onResetShopData: (options: { clearSales: boolean; clearCustomers: boolean; clearProducts: boolean }) => void;
  language: Language;
  onOpenGitModal?: () => void;
}

export const GoLiveModal: React.FC<GoLiveModalProps> = ({
  isOpen,
  onClose,
  shop,
  onUpdateShop,
  onResetShopData,
  language,
  onOpenGitModal,
}) => {
  const [shopName, setShopName] = useState(shop ? shop.name : "Isaac's Duka Store");
  const [ownerName, setOwnerName] = useState(shop ? shop.ownerName : 'Isaac Kipngetich');
  const [phoneNumber, setPhoneNumber] = useState(shop ? shop.phoneNumber : '0712 345 678');
  const [mpesaType, setMpesaType] = useState<'till' | 'paybill' | 'send_money'>(shop ? shop.mpesaType : 'till');
  const [mpesaNumber, setMpesaNumber] = useState(shop ? shop.mpesaNumber : '524108');
  const [accountNumber, setAccountNumber] = useState(shop ? (shop.accountNumber || '') : '');

  // Clean-up selections
  const [clearSales, setClearSales] = useState(true);
  const [clearCustomers, setClearCustomers] = useState(true);
  const [clearProductsMode, setClearProductsMode] = useState<'keep_starter' | 'wipe_clean'>('keep_starter');
  const [clearSupabaseCloud, setClearSupabaseCloud] = useState(true);

  const [isApplying, setIsApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyRealStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;

    setIsApplying(true);
    setSuccessMessage(null);

    try {
      // 1. Update shop profile
      onUpdateShop({
        name: shopName.trim(),
        ownerName: ownerName.trim() || 'Store Attendant',
        phoneNumber: phoneNumber.trim(),
        mpesaType,
        mpesaNumber: mpesaNumber.trim(),
        accountNumber: mpesaType === 'paybill' ? accountNumber.trim() : undefined,
        currency: 'KES',
        lowStockDefault: 5,
      });

      // 2. Perform local data reset
      const clearProducts = clearProductsMode === 'wipe_clean';
      onResetShopData({
        clearSales,
        clearCustomers,
        clearProducts,
      });

      // 3. If Supabase configured and user requested cloud wipe
      if (shop && isSupabaseConfigured() && clearSupabaseCloud) {
        await SupabaseSync.clearShopCloudData(shop.id, {
          clearSales,
          clearCustomers,
          clearProducts,
        });

        // Push new shop profile to Supabase
        await SupabaseSync.pushShop({
          ...shop,
          name: shopName.trim(),
          ownerName: ownerName.trim() || 'Store Attendant',
          phoneNumber: phoneNumber.trim(),
          mpesaType,
          mpesaNumber: mpesaNumber.trim(),
          accountNumber: mpesaType === 'paybill' ? accountNumber.trim() : undefined,
        });
      }

      setSuccessMessage(
        language === 'sw'
          ? 'Hongera! Duka lako sasa liko tayari kwa biashara halisi.'
          : 'Great! Your real store is now live and ready for business.'
      );

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-sm">
              <Rocket className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg tracking-tight">
                {language === 'sw' ? 'Weka Duka Halisi & Zindua' : 'Make Store Real & Go Live'}
              </h2>
              <p className="text-xs text-neutral-500">
                {language === 'sw'
                  ? 'Futa data ya majaribio, rekebisha maelezo yako na anza kuuza.'
                  : 'Clear demo test data, configure real details, and start selling.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Deployment & Go Live Guidance Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {language === 'sw' ? 'Jinsi ya Kufanya Duka Lako Liwe Hewani (Live)' : 'How to Publish & Take Your Shop Live'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold">
              AI Studio Build
            </span>
          </div>

          <div className="text-[11px] text-emerald-900/90 dark:text-emerald-200/90 space-y-1.5 leading-relaxed">
            <p>
              {language === 'sw'
                ? '1. Bonyeza kitufe cha "Share" au "Publish" kilicho upande wa juu kulia wa AI Studio ili kufanya tovuti iweze kufunguliwa na wateja au kwenye simu yoyote bila kosa la 404.'
                : '1. Click the "Share" or "Publish" button at the top-right corner of AI Studio to activate the public link for any phone or PC.'}
            </p>
            <p>
              {language === 'sw'
                ? '2. Unaweza pia kupakua kodi (Download code) na kuiweka kwenye Vercel, Netlify au Render kwa sekunde 60 tu.'
                : '2. You can also export the code to GitHub / Vercel / Netlify for free 24/7 custom domain hosting.'}
            </p>
            {onOpenGitModal && (
              <div className="pt-1.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenGitModal}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>{language === 'sw' ? 'Unganisha na GitHub & Git' : 'Connect to GitHub & Git'}</span>
                </button>
                <a
                  href="/duka-tracker-source.zip"
                  download="duka-tracker-source.zip"
                  className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'sw' ? 'Pakua ZIP' : 'Download ZIP (~175KB)'}</span>
                </a>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleApplyRealStore} className="space-y-4">
          {/* Section 1: Real Store Profile */}
          <div className="space-y-3 bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>{language === 'sw' ? '1. Maelezo ya Duka Lako Halisi' : '1. Your Real Store Information'}</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                {language === 'sw' ? 'Jina la Duka *' : 'Shop / Business Name *'}
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                placeholder="e.g. Kipngetich General Store"
                className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  {language === 'sw' ? 'Jina la Mwenye Duka' : 'Owner / Manager Name'}
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="Isaac Kipngetich"
                  className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  {language === 'sw' ? 'Nambari ya Simu' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="0712 345 678"
                  className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* M-Pesa Settings */}
            <div className="pt-1">
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                {language === 'sw' ? 'Lipa Na M-Pesa kwa Malipo ya Wateja' : 'Lipa Na M-Pesa for Customer Checkout'}
              </label>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                <button
                  type="button"
                  onClick={() => setMpesaType('till')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                    mpesaType === 'till'
                      ? 'bg-emerald-700 text-white border-emerald-800'
                      : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Buy Goods Till
                </button>
                <button
                  type="button"
                  onClick={() => setMpesaType('paybill')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                    mpesaType === 'paybill'
                      ? 'bg-emerald-700 text-white border-emerald-800'
                      : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Paybill
                </button>
                <button
                  type="button"
                  onClick={() => setMpesaType('send_money')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                    mpesaType === 'send_money'
                      ? 'bg-emerald-700 text-white border-emerald-800'
                      : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Phone
                </button>
              </div>

              <input
                type="text"
                value={mpesaNumber}
                onChange={e => setMpesaNumber(e.target.value)}
                placeholder={mpesaType === 'till' ? 'e.g. 524108' : mpesaType === 'paybill' ? 'e.g. 400200' : '0712345678'}
                className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Section 2: Mock Data Cleanup */}
          <div className="space-y-3 bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
              <Trash2 className="w-4 h-4 text-amber-600" />
              <span>{language === 'sw' ? '2. Usafishaji wa Data ya Majaribio (Mock Data)' : '2. Clear Mock / Sample Data'}</span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearSales}
                  onChange={e => setClearSales(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {language === 'sw'
                    ? 'Futa mauzo ya majaribio (Anza leo na Sh 0 ya mauzo)'
                    : 'Clear sample sales & receipts (start fresh with KES 0 revenue today)'}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearCustomers}
                  onChange={e => setClearCustomers(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {language === 'sw'
                    ? 'Futa wateja wa majaribio & madeni ya majaribio (Mkopo)'
                    : 'Clear sample customers & demo debts'}
                </span>
              </label>

              {/* Products Options */}
              <div className="pt-1.5 border-t border-neutral-200 dark:border-neutral-700/60 space-y-1.5">
                <span className="block font-semibold text-neutral-700 dark:text-neutral-300 text-[11px]">
                  {language === 'sw' ? 'Bidhaa na Stoo (Inventory):' : 'Products & Inventory Handling:'}
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="clearProductsMode"
                    value="keep_starter"
                    checked={clearProductsMode === 'keep_starter'}
                    onChange={() => setClearProductsMode('keep_starter')}
                    className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>
                    {language === 'sw'
                      ? 'Weka orodha ya bidhaa za Kenya (Unga, Sukari, Mafuta) ili ubadilishe bei na hesabu tu'
                      : 'Keep starter Kenyan items (Flour, Sugar, Milk, etc.) so you only adjust prices and stock counts'}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="clearProductsMode"
                    value="wipe_clean"
                    checked={clearProductsMode === 'wipe_clean'}
                    onChange={() => setClearProductsMode('wipe_clean')}
                    className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>
                    {language === 'sw'
                      ? 'Futa bidhaa zote (Nitaweka bidhaa zangu mimi mwenyewe kuanzia mwanzo)'
                      : 'Clear all products (I want to input my real products from scratch)'}
                  </span>
                </label>
              </div>

              {/* Cloud wipe */}
              {isSupabaseConfigured() && (
                <div className="pt-1.5 border-t border-neutral-200 dark:border-neutral-700/60">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearSupabaseCloud}
                      onChange={e => setClearSupabaseCloud(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      {language === 'sw'
                        ? 'Sawazisha mabadiliko haya kwenye Supabase Cloud database'
                        : 'Sync clean state to Supabase PostgreSQL cloud database'}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Mobile PWA Tips */}
          <div className="bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
              <span className="font-bold text-neutral-800 dark:text-neutral-200">
                {language === 'sw' ? 'Matumizi Kwenye Simu: ' : 'Install as an App on Phone: '}
              </span>
              {language === 'sw'
                ? 'Fungua kiungo hiki kwenye Chrome/Safari ya simu yako na uchague "Add to Home Screen" ili ifanye kazi kama app kamili hata bila intaneti!'
                : 'Open the link in your phone browser and tap "Add to Home screen" to install it with an icon. It works 100% offline and syncs when connected!'}
            </div>
          </div>

          {successMessage && (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isApplying}
              className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200"
            >
              {language === 'sw' ? 'Ghairi' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isApplying}
              className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'sw' ? 'Inazindua...' : 'Launching...'}</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>{language === 'sw' ? 'Zindua Duka Halisi' : 'Launch Real Store'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
