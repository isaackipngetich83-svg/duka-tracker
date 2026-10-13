import { Sun, Moon, Store, Globe, Smartphone, ShieldCheck, Database, Rocket, Github } from 'lucide-react';
import { Shop } from '../types/index.ts';
import { Language, translations } from '../lib/translations.ts';

interface TopBarProps {
  shop: Shop | null;
  language: Language;
  onLanguageToggle: () => void;
  isSunlightMode: boolean;
  onSunlightToggle: () => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onOpenSettings: () => void;
  onOpenDpaModal: () => void;
  onOpenSupabaseModal: () => void;
  onOpenGoLiveModal: () => void;
  onOpenGitModal: () => void;
  isSupabaseConnected: boolean;
  isOnline: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  shop,
  language,
  onLanguageToggle,
  isSunlightMode,
  onSunlightToggle,
  isDarkMode,
  onThemeToggle,
  onOpenSettings,
  onOpenDpaModal,
  onOpenSupabaseModal,
  onOpenGoLiveModal,
  onOpenGitModal,
  isSupabaseConnected,
  isOnline,
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-30 bg-emerald-800 text-white shadow-md border-b border-emerald-900/40 select-none">
      <div className="max-w-5xl mx-auto px-3 py-2.5 flex items-center justify-between gap-2">
        {/* Left: Shop Name & Status */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 text-left min-h-[44px] px-2 py-1 -ml-1 rounded-lg hover:bg-emerald-700/60 active:bg-emerald-900 transition-colors"
          title={t.shopSettings}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center shrink-0 border border-emerald-600">
            <Store className="w-4 h-4 text-emerald-100" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm tracking-tight text-white truncate max-w-[130px] sm:max-w-[200px]">
              {shop ? shop.name : t.appName}
            </div>
            <div className="text-[11px] text-emerald-200 flex items-center gap-1.5 font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-300' : 'bg-amber-400'}`} />
              <span>{shop ? (shop.mpesaNumber ? `Till: ${shop.mpesaNumber}` : shop.ownerName) : 'Setup Shop'}</span>
            </div>
          </div>
        </button>

        {/* Right Action Icons: Go Live, Git/Code, Language, Sunlight Mode, Supabase, Theme */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Go Live / Make Real Button */}
          <button
            onClick={onOpenGoLiveModal}
            className="min-h-[38px] px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black rounded-lg text-xs flex items-center gap-1 shadow-sm transition-transform active:scale-95"
            title={language === 'sw' ? 'Weka Duka Halisi & Zindua' : 'Make Store Real & Go Live'}
          >
            <Rocket className="w-3.5 h-3.5 text-amber-950" />
            <span className="text-[11px] font-bold">{language === 'sw' ? 'Zindua' : 'Go Live'}</span>
          </button>

          {/* Git & Code Export Button */}
          <button
            onClick={onOpenGitModal}
            className="min-h-[38px] px-2 py-1 bg-emerald-900/60 hover:bg-emerald-700/80 text-white rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-700/60 transition-colors"
            title={language === 'sw' ? 'Pakua kodi & Unganisha na Git/GitHub' : 'Download code & Connect to Git/GitHub'}
            aria-label="Git and Source Code Export"
          >
            <Github className="w-3.5 h-3.5 text-emerald-200" />
            <span className="text-[11px] font-bold hidden sm:inline">Git</span>
          </button>
          {/* Sunlight Mode Toggle */}
          <button
            onClick={onSunlightToggle}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
              isSunlightMode
                ? 'bg-amber-400 text-amber-950 shadow-sm'
                : 'text-emerald-100 hover:bg-emerald-700/70'
            }`}
            title={t.sunlightModeTip}
            aria-label="Toggle outdoor sunlight mode"
          >
            <Sun className="w-4 h-4" />
          </button>

          {/* Language Toggle (EN / SW) */}
          <button
            onClick={onLanguageToggle}
            className="min-h-[44px] px-2 flex items-center gap-1 rounded-lg text-xs font-bold bg-emerald-900/50 hover:bg-emerald-700/70 text-emerald-100 transition-colors"
            title="Badilisha lugha / Change language"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-300" />
            <span className="uppercase">{language}</span>
          </button>

          {/* Supabase Cloud Database */}
          <button
            onClick={onOpenSupabaseModal}
            className={`min-h-[44px] px-2 flex items-center gap-1 rounded-lg text-xs font-bold transition-colors ${
              isSupabaseConnected
                ? 'bg-emerald-600/60 text-emerald-100 hover:bg-emerald-600'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-700/70'
            }`}
            title="Supabase PostgreSQL Cloud Setup"
            aria-label="Open Supabase Cloud Database Settings"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cloud</span>
          </button>

          {/* Kenya DPA Badge */}
          <button
            onClick={onOpenDpaModal}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/70 transition-colors"
            title={t.dataPrivacy}
            aria-label="Kenya Data Protection Act Info"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
          </button>

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={onThemeToggle}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/70 transition-colors"
            title="Toggle theme"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
