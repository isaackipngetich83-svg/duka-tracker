import React, { useState } from 'react';
import {
  Github,
  GitBranch,
  Download,
  Copy,
  Check,
  Terminal,
  FolderGit2,
  FileCode,
  Folder,
  ExternalLink,
  X,
  CheckCircle2,
  Sparkles,
  Layers,
  Database,
} from 'lucide-react';
import { Language } from '../lib/translations.ts';

interface GitExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const GitExportModal: React.FC<GitExportModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [githubRepoUrl, setGithubRepoUrl] = useState('https://github.com/your-username/duka-tracker.git');
  const [activeTab, setActiveTab] = useState<'download' | 'github' | 'files'>('download');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const projectFiles = [
    { name: 'src/App.tsx', desc: 'Main App controller, tabs, modals and state management' },
    { name: 'src/components/SellTab.tsx', desc: 'Point of sale, product search, cart, and M-Pesa checkout' },
    { name: 'src/components/DebtsTab.tsx', desc: 'Customer debt book (Kitabu cha Madeni), trust scores & WhatsApp reminders' },
    { name: 'src/components/StockTab.tsx', desc: 'Inventory catalog, stock level alerts, wholesale costs & margins' },
    { name: 'src/components/HistoryTab.tsx', desc: 'Sales ledger, filter by payment type (Cash vs M-Pesa) & CSV export' },
    { name: 'src/components/DashboardTab.tsx', desc: 'Daily revenue, profit, cash flow breakdown & top selling items' },
    { name: 'src/components/SupabaseModal.tsx', desc: 'Supabase PostgreSQL cloud sync & live database status' },
    { name: 'src/components/GoLiveModal.tsx', desc: 'Production store configuration & demo data wipe' },
    { name: 'src/lib/storage.ts', desc: 'Offline-first LocalStorage database engine & migrations' },
    { name: 'src/lib/supabase.ts', desc: 'Realtime cloud sync for products, customers, sales & payments' },
    { name: 'src/lib/trustScore.ts', desc: 'Kenya creditworthiness & debt repayment scoring algorithm' },
    { name: 'src/lib/whatsapp.ts', desc: 'Polite Swahili & English debt reminder generator' },
    { name: 'supabase/schema.sql', desc: 'Full PostgreSQL schema with RLS policies and indexes' },
    { name: 'supabase/seed.sql', desc: 'Kenya fast-moving retail starter dataset' },
    { name: 'vite.config.ts', desc: 'Vite build config with Tailwind CSS and PWA manifest' },
    { name: 'package.json', desc: 'Full dependencies including React 19, Supabase, Lucide & Motion' },
  ];

  const terminalCommands = [
    {
      title: '1. Create a repository on GitHub',
      cmd: '# Go to https://github.com/new and create a new repository called "duka-tracker"',
    },
    {
      title: '2. Unzip and open the code in terminal',
      cmd: `unzip duka-tracker-source.zip -d duka-tracker\ncd duka-tracker`,
    },
    {
      title: '3. Connect to your GitHub repository and push',
      cmd: `git remote add origin ${githubRepoUrl.trim() || 'https://github.com/your-username/duka-tracker.git'}\ngit branch -M main\ngit push -u origin main`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 dark:bg-neutral-800 text-white flex items-center justify-center shadow-sm">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base sm:text-lg tracking-tight">
                  {language === 'sw' ? 'Pakua Kodi & Unganisha na Git' : 'Git & Source Code Export'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  Ready
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                {language === 'sw'
                  ? 'Tazama mafaili yote, pakua ZIP, au sukuma kodi kwenye akaunti yako ya GitHub.'
                  : 'View all project files, download full ZIP, or push directly to your GitHub repository.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('download')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'download'
                ? 'bg-white dark:bg-neutral-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{language === 'sw' ? 'Pakua ZIP' : 'Download ZIP'}</span>
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'github'
                ? 'bg-white dark:bg-neutral-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>{language === 'sw' ? 'Amri za GitHub' : 'Push to GitHub'}</span>
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'files'
                ? 'bg-white dark:bg-neutral-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>{language === 'sw' ? 'Mafaili Yote (45)' : 'File Tree (45)'}</span>
          </button>
        </div>

        {/* TAB 1: 1-Click Download ZIP */}
        {activeTab === 'download' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent border border-emerald-500/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    {language === 'sw' ? 'Kifurushi Kamili cha Chanzo cha Kodi (.ZIP)' : 'Full Source Code Archive (.ZIP)'}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                    {language === 'sw'
                      ? 'Inajumuisha components zote za React, Vite, PWA, Tailwind na mifumo ya Supabase SQL.'
                      : 'Contains all React components, Vite PWA configs, Tailwind styling, and Supabase SQL migrations.'}
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">
                  ~175 KB
                </span>
              </div>

              {/* Download Action Button */}
              <a
                href="/duka-tracker-source.zip"
                download="duka-tracker-source.zip"
                className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white rounded-2xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'sw' ? 'Pakua Faili la ZIP Sasa' : 'Download Complete Code (.ZIP)'}</span>
              </a>

              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between pt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {language === 'sw' ? 'Bila node_modules (Nyepesi na Safi)' : 'Clean build (no node_modules bloat)'}
                </span>
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
                  {language === 'sw' ? 'Tawi: main' : 'Branch: main'}
                </span>
              </div>
            </div>

            {/* How to run locally instructions */}
            <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3.5 space-y-2">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-600" />
                {language === 'sw' ? 'Jinsi ya Kuendesha Kwenye Kompyuta Yako (VS Code):' : 'How to Run on Your PC / Laptop (VS Code):'}
              </span>
              <div className="bg-neutral-900 text-neutral-200 p-3 rounded-xl font-mono text-[11px] space-y-1.5 relative overflow-x-auto">
                <p className="text-neutral-400"># 1. Fungua terminal na usakinishe vifurushi / install packages:</p>
                <p className="text-emerald-400 font-bold">npm install</p>
                <p className="text-neutral-400 mt-2"># 2. Anza server ya ndani ya kompyuta / start dev server:</p>
                <p className="text-emerald-400 font-bold">npm run dev</p>
                <p className="text-neutral-400 mt-2"># 3. Kujenga toleo la uzalishaji / production build:</p>
                <p className="text-emerald-400 font-bold">npm run build</p>
              </div>
            </div>

            {/* AI Studio Interface tip */}
            <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl text-[11px] text-neutral-600 dark:text-neutral-400 flex items-start gap-2.5">
              <Layers className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  {language === 'sw' ? 'Kuangalia kodi ndani ya AI Studio: ' : 'Viewing code inside AI Studio: '}
                </span>
                {language === 'sw'
                  ? 'Kwenye paneli ya juu au kushoto ya Google AI Studio, kuna ikoni ya "Files / Code". Ukibofya, unaweza kuona na kuhariri kila faili moja kwa moja!'
                  : 'In Google AI Studio, use the Files / Code panel to browse, edit, or copy any file directly in your browser without leaving.'}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Push to GitHub Commands */}
        {activeTab === 'github' && (
          <div className="space-y-4">
            <div className="bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2.5">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                {language === 'sw' ? 'Weka Kiungo cha Repo Yako ya GitHub:' : 'Enter Your GitHub Repository URL:'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={githubRepoUrl}
                  onChange={e => setGithubRepoUrl(e.target.value)}
                  placeholder="https://github.com/your-username/duka-tracker.git"
                  className="flex-1 p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-neutral-500">
                {language === 'sw'
                  ? 'Amri hapa chini zitabadilika kiotomatiki kutumia repo hii.'
                  : 'The terminal commands below will automatically update to use your repository.'}
              </p>
            </div>

            <div className="space-y-3">
              {terminalCommands.map((item, index) => (
                <div
                  key={index}
                  className="bg-neutral-900 text-neutral-200 rounded-2xl p-3 border border-neutral-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                    <span>{item.title}</span>
                    <button
                      onClick={() => copyToClipboard(item.cmd, index)}
                      className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-neutral-800 px-2 py-0.5 rounded-lg transition-colors"
                      title="Copy command"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-emerald-300/90 whitespace-pre-wrap break-all bg-neutral-950 p-2 rounded-xl">
                    {item.cmd}
                  </pre>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <ExternalLink className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">
                  {language === 'sw' ? 'Kuhifadhi kwenye GitHub bila kupakua: ' : 'Direct GitHub Export: '}
                </span>
                {language === 'sw'
                  ? 'Ukibofya menyu ya juu ya Google AI Studio, kuna chaguo la "Export to GitHub" linalotuma kodi yako yote mara moja.'
                  : 'You can also use Google AI Studio top menu bar "Export to GitHub" to sync this workspace directly to your GitHub account.'}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: File Tree */}
        {activeTab === 'files' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
              <span>{language === 'sw' ? 'Muundo wa Faili na Moduli:' : 'Project Architecture & Modules:'}</span>
              <span className="font-mono text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md font-bold">
                TypeScript / React 19 / Vite
              </span>
            </div>

            <div className="max-h-[360px] overflow-y-auto space-y-1.5 pr-1">
              {projectFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 truncate">
                      {file.name.includes('/') ? (
                        <Folder className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <FileCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      )}
                      <span>{file.name}</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {file.desc}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(file.name, 100 + idx)}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 shrink-0"
                    title="Copy path"
                  >
                    {copiedIndex === 100 + idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href="/duka-tracker-source.zip"
                download="duka-tracker-source.zip"
                className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'sw' ? 'Pakua Mafaili Yote (.ZIP)' : 'Download All Files (.ZIP)'}</span>
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            {language === 'sw' ? 'Funga' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
