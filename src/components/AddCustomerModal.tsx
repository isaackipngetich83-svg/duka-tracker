import React, { useState } from 'react';
import { X, UserPlus, ShieldCheck } from 'lucide-react';
import { Customer } from '../types/index.ts';
import { Language, translations } from '../lib/translations.ts';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: Omit<Customer, 'id' | 'shopId' | 'currentDebt' | 'totalBorrowed' | 'totalRepaid' | 'createdAt'>) => void;
  language: Language;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  language,
}) => {
  const t = translations[language];

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [hasConsented, setHasConsented] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim()) return;

    if (!hasConsented) {
      alert(language === 'sw' 
        ? 'Idhini ya mteja inahitajika kulingana na Sheria ya Data ya Kenya (DPA 2019)' 
        : 'Customer consent is required under Kenya Data Protection Act 2019');
      return;
    }

    onSave({
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      phoneNumber: phoneNumber.trim(),
      locationNote: locationNote.trim() || undefined,
      consent: {
        consentedAt: new Date().toISOString(),
        purpose: 'Credit tracking and debt repayment reminder communications',
        actRef: 'Kenya Data Protection Act 2019 Section 30',
        consentedVia: 'in_person_verbal',
      },
    });

    setName('');
    setNickname('');
    setPhoneNumber('');
    setLocationNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-3.5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <span>{t.addNewCustomer}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1">{t.customerName} *</label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Mary Wanjiku"
            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1">{t.nickname}</label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="e.g. Mama Brian / Teacher Otieno"
            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1">{t.phoneNumber} *</label>
          <input
            type="tel"
            required
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            placeholder="e.g. 0712 345 678"
            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1">{t.locationNote}</label>
          <input
            type="text"
            value={locationNote}
            onChange={e => setLocationNote(e.target.value)}
            placeholder="e.g. Plot 4, Room B or Near Church"
            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Kenya DPA 2019 Consent Checkbox */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/60 text-xs">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasConsented}
              onChange={e => setHasConsented(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-tight">
              {t.dpaConsentLabel}
            </span>
          </label>
        </div>

        <div className="flex items-center gap-2 pt-2">
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
    </div>
  );
};
