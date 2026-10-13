import React, { useState } from 'react';
import { X, Store, Smartphone, Shield, RotateCcw, Plus, Rocket } from 'lucide-react';
import { Shop } from '../types/index.ts';
import { Language, translations } from '../lib/translations.ts';

interface ShopSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop | null;
  allShops: Shop[];
  onSaveShop: (shopData: Omit<Shop, 'id' | 'createdAt'>) => void;
  onSwitchShop: (shop: Shop) => void;
  onLoadStarterPack: () => void;
  onOpenGoLiveModal?: () => void;
  language: Language;
}

export const ShopSettingsModal: React.FC<ShopSettingsModalProps> = ({
  isOpen,
  onClose,
  shop,
  allShops,
  onSaveShop,
  onSwitchShop,
  onLoadStarterPack,
  onOpenGoLiveModal,
  language,
}) => {
  const t = translations[language];

  const [name, setName] = useState(shop ? shop.name : '');
  const [ownerName, setOwnerName] = useState(shop ? shop.ownerName : '');
  const [phoneNumber, setPhoneNumber] = useState(shop ? shop.phoneNumber : '');
  const [mpesaType, setMpesaType] = useState<'till' | 'paybill' | 'send_money'>(shop ? shop.mpesaType : 'till');
  const [mpesaNumber, setMpesaNumber] = useState(shop ? shop.mpesaNumber : '');
  const [accountNumber, setAccountNumber] = useState(shop ? (shop.accountNumber || '') : '');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveShop({
      name: name.trim(),
      ownerName: ownerName.trim() || 'Duka Owner',
      phoneNumber: phoneNumber.trim(),
      mpesaType,
      mpesaNumber: mpesaNumber.trim(),
      accountNumber: mpesaType === 'paybill' ? accountNumber.trim() : undefined,
      currency: 'KES',
      lowStockDefault: 5,
    });

    setIsCreatingNew(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <Store className="w-4 h-4 text-emerald-600" />
            <span>{t.shopSettings}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Shops Switcher (Multi-Duka support) */}
        {allShops.length > 1 && !isCreatingNew && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-500">{t.changeShop}</label>
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {allShops.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    onSwitchShop(s);
                    onClose();
                  }}
                  className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between border ${
                    shop && shop.id === s.id
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 font-bold'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span className="truncate">{s.name}</span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {s.mpesaNumber ? `Till: ${s.mpesaNumber}` : ''}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setIsCreatingNew(true);
                setName('');
                setMpesaNumber('');
              }}
              className="text-xs text-emerald-600 font-bold flex items-center gap-1 pt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'sw' ? '+ Fungua Duka Jingine' : '+ Add Another Duka'}</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold mb-1">{t.shopName} *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Kibera Fresh Duka & Cereals"
              className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              {language === 'sw' ? 'Jina la Mwenye Duka' : 'Owner / Attendant Name'}
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
              {language === 'sw' ? 'Aina ya M-Pesa' : 'M-Pesa Account Type'}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setMpesaType('till')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                  mpesaType === 'till'
                    ? 'bg-emerald-700 text-white border-emerald-800'
                    : 'bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-700 dark:text-neutral-300'
                }`}
              >
                Buy Goods
              </button>
              <button
                type="button"
                onClick={() => setMpesaType('paybill')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                  mpesaType === 'paybill'
                    ? 'bg-emerald-700 text-white border-emerald-800'
                    : 'bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-700 dark:text-neutral-300'
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
                    : 'bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-700 dark:text-neutral-300'
                }`}
              >
                Phone
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              {mpesaType === 'till'
                ? 'Lipa Na M-Pesa Till Number (Buy Goods)'
                : mpesaType === 'paybill'
                ? 'Paybill Business Number'
                : 'M-Pesa Phone Number'}
            </label>
            <input
              type="text"
              value={mpesaNumber}
              onChange={e => setMpesaNumber(e.target.value)}
              placeholder={mpesaType === 'till' ? 'e.g. 524108' : mpesaType === 'paybill' ? 'e.g. 400200' : '0712345678'}
              className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {mpesaType === 'paybill' && (
            <div>
              <label className="block text-xs font-bold mb-1">Paybill Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                placeholder="e.g. DUKA or Customer Phone"
                className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
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

        {/* Go Live / Production Setup */}
        {onOpenGoLiveModal && (
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenGoLiveModal();
              }}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Rocket className="w-4 h-4 text-amber-950" />
              <span>{language === 'sw' ? 'Zindua Duka Halisi (Futa Data ya Majaribio)' : 'Make Store Real / Clear Demo Data'}</span>
            </button>
          </div>
        )}

        {/* Quick starter pack button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              onLoadStarterPack();
              onClose();
            }}
            className="w-full py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'sw' ? 'Weka Bidhaa za Kawaida za Duka (Unga, Sukari, n.k.)' : 'Load Kenyan Starter Products Pack'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
