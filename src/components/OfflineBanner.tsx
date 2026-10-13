import React from 'react';
import { WifiOff } from 'lucide-react';
import { Language, translations } from '../lib/translations.ts';

interface OfflineBannerProps {
  isOnline: boolean;
  language: Language;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, language }) => {
  if (isOnline) return null;
  const t = translations[language];

  return (
    <div className="bg-amber-600 text-white px-3 py-1.5 text-xs flex items-center justify-center gap-2 shadow-sm font-medium">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>{t.offlineNotice}</span>
    </div>
  );
};
