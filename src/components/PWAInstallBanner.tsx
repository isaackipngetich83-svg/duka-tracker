import React, { useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { Language, translations } from '../lib/translations.ts';

interface PWAInstallBannerProps {
  language: Language;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ language }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const t = translations[language];

  if (isInstalled || isDismissed) {
    return null;
  }

  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <div className="bg-emerald-900 text-white px-3 py-2 text-xs flex items-center justify-between border-b border-emerald-950/40">
        <div className="flex items-center gap-2 truncate">
          <Download className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="truncate">
            {language === 'sw'
              ? 'Weka Duka Tracker kwenye simu kwa matumizi ya haraka'
              : 'Install Duka Tracker for fast 1-tap offline access'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isInstallable && (
            <button
              onClick={install}
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded text-xs transition-colors"
            >
              {t.installPWA}
            </button>
          )}
          {isIOS && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors"
            >
              {language === 'sw' ? 'Weka (iPhone)' : 'Install (iPhone)'}
            </button>
          )}
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-emerald-800 rounded text-emerald-300"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2">
              <Share className="w-4 h-4 text-emerald-600" />
              {language === 'sw' ? 'Jinsi ya Kuweka kwenye iPhone' : 'Install on iPhone / iPad'}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mb-4 leading-relaxed">
              {language === 'sw'
                ? '1. Gusa kitufe cha "Share" kwenye Safari chini ya skrini.\n2. Shuka chini kisha chagua "Add to Home Screen".'
                : '1. Tap the Share button in Safari toolbar.\n2. Scroll down and tap "Add to Home Screen".'}
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold rounded-xl text-xs"
            >
              {language === 'sw' ? 'Nimeelewa' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
