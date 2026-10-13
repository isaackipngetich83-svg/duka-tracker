import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, UserX, FileCheck } from 'lucide-react';
import { Language, translations } from '../lib/translations.ts';

interface DpaModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const DpaModal: React.FC<DpaModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Kenya Data Protection Act</h3>
              <p className="text-[11px] text-neutral-500">Compliance & Privacy Guarantee</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
            <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 mb-1">
              <FileCheck className="w-3.5 h-3.5" />
              <span>1. Consent-Based Record Keeping (Section 30)</span>
            </div>
            <p className="text-[11px]">
              Customer contact and credit details are only recorded with explicit consent. Duka Tracker logs the consent timestamp for every customer.
            </p>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 mb-1">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. Multi-Tenant Shop Isolation (RLS)</span>
            </div>
            <p className="text-[11px]">
              Every duka has its own private store database. Customers and debt ledgers are never shared with rival shops or third parties without explicit authorization.
            </p>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 mb-1">
              <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Private Credit Scoring</span>
            </div>
            <p className="text-[11px]">
              Customer trust scores are generated strictly based on repayment history within your own duka and remain confidential.
            </p>
          </div>

          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60">
            <div className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 mb-1">
              <UserX className="w-3.5 h-3.5 text-rose-600" />
              <span>4. Right to Erasure / Deletion (Section 40)</span>
            </div>
            <p className="text-[11px]">
              Customers have the legal right to request the deletion of their personal data. Duka Tracker provides an instant "Delete Customer Record" action.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-xl text-xs"
        >
          {language === 'sw' ? 'Nimeelewa' : 'Understood'}
        </button>
      </div>
    </div>
  );
};
