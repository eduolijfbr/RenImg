import React, { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Play, RefreshCw, Settings, Info, Check, Moon, Sun, Globe, Sliders } from 'lucide-react';
import { ImageScanner } from './services/ImageScanner';
import { ImageRenamer } from './services/ImageRenamer';
import { ImageFile, ProcessedFile, RenameConfig, FileStatus } from './types';
import FileList from './components/FileList';
import StatsPanel from './components/StatsPanel';
import { translations, Language } from './utils/translations';

const scanner = new ImageScanner();
const renamer = new ImageRenamer();

const App: React.FC = () => {
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('photon-theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    }
    return 'dark';
  });

  // Language State
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('photon-lang');
      return (saved && Object.keys(translations).includes(saved)) ? (saved as Language) : 'en';
    }
    return 'en';
  });

  // Derived translations
  const t = translations[lang];

  // State
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Configuration State
  const [config, setConfig] = useState<RenameConfig>({
    pattern: 'image_{num:003}',
    startNumber: 1,
    recursive: false,
    dryRun: false,
    overwrite: false,
    prefix: '',
    suffix: '',
    // Resize defaults
    enableResize: false,
    resizeWidth: 1920,
    resizeQuality: 85,
    keepOriginals: false,
  });

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('photon-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Persist Language
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Language;
    setLang(newLang);
    localStorage.setItem('photon-lang', newLang);
  };

  // Handle Real Directory Selection
  const handleDirectorySelect = async () => {
    try {
      // Clean up old object URLs to prevent memory leaks
      files.forEach(f => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });

      const result = await scanner.scanDirectory();

      if (result.dirHandle) {
        setDirHandle(result.dirHandle);
        setFiles(result.files);
        setProcessedFiles([]);
        setProgress(0);
      }
    } catch (err) {
      console.error("Directory selection failed:", err);
      alert("Could not access directory. Please ensure you grant permissions.");
    }
  };

  // Generate Preview Effect
  const refreshPreview = useCallback(() => {
    if (files.length === 0) return;

    // Only generate preview if we are NOT currently processing a real batch
    if (!isProcessing) {
      const previews = renamer.generatePreview(files, config);
      setProcessedFiles(previews);
    }
  }, [files, config, isProcessing]);

  useEffect(() => {
    refreshPreview();
  }, [refreshPreview]);

  // Execute Rename Logic (REAL)
  const handleRename = async () => {
    if (config.dryRun) {
      // Small delay to simulate UX feedback
      setIsProcessing(true);
      setTimeout(() => setIsProcessing(false), 500);
      return;
    }

    if (!dirHandle) {
      alert("No directory handle found. Please open folder again.");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const queue = [...processedFiles];
    const total = queue.length;
    let successCount = 0;

    // Process files
    for (let i = 0; i < total; i++) {
      const file = queue[i];

      // Skip errors or files that shouldn't be touched
      if (file.status !== FileStatus.ERROR) {
        try {
          await renamer.executeRename(file, dirHandle, config);

          // Update state for success
          setProcessedFiles(prev => {
            const next = [...prev];
            next[i] = { ...next[i], status: FileStatus.SUCCESS };
            return next;
          });
          successCount++;

        } catch (error) {
          console.error("Rename failed for", file.originalName, error);
          setProcessedFiles(prev => {
            const next = [...prev];
            next[i] = { ...next[i], status: FileStatus.ERROR, errorMessage: "Write/Move failed" };
            return next;
          });
        }
      }

      setProgress(((i + 1) / total) * 100);
    }

    setIsProcessing(false);

    // If successful, we should probably re-scan or update the internal file list 
    // to reflect new names so user doesn't rename same objects again immediately.
    // For MVP, we alert completion.
    if (successCount > 0) {
      // Optional: Trigger a fresh scan or UI update here
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50 text-slate-900 dark:bg-slate-900 dark:text-slate-200 transition-colors duration-300">

      {/* Header */}
      <header className="h-16 border-b border-gray-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <RefreshCw size={18} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Photon <span className="text-slate-500 font-light">{t.appTitle}</span></h1>
        </div>

        <div className="flex items-center gap-4">
          {files.length > 0 && (
            <span className="text-xs font-mono text-slate-600 dark:text-slate-500 bg-gray-200 dark:bg-slate-900/50 px-3 py-1 rounded-full border border-gray-300 dark:border-slate-800">
              {processedFiles.length} {t.readyItems}
            </span>
          )}

          {/* Language Selector */}
          <div className="relative group flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg px-2 border border-transparent hover:border-gray-300 dark:hover:border-slate-600 transition-colors">
            <Globe size={16} className="text-slate-500" />
            <select
              value={lang}
              onChange={handleLanguageChange}
              className="bg-transparent text-sm text-slate-700 dark:text-slate-300 py-2 pl-2 pr-1 outline-none cursor-pointer appearance-none font-medium"
            >
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            onClick={handleDirectorySelect}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm transition-all border border-gray-200 dark:border-slate-700 font-medium shadow-sm"
          >
            <FolderOpen size={16} />
            {t.openFolder}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar: Controls */}
        <aside className="w-80 bg-white dark:bg-slate-900/30 border-r border-gray-200 dark:border-slate-800 flex flex-col shrink-0 overflow-y-auto custom-scrollbar transition-colors duration-300">

          <div className="p-6 border-b border-gray-200 dark:border-slate-800">
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings size={14} /> {t.configTitle}
            </h2>

            {/* Pattern Input */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.patternLabel}</label>
              <input
                type="text"
                value={config.pattern}
                onChange={(e) => setConfig({ ...config, pattern: e.target.value })}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-slate-400"
                placeholder="image_{num}"
              />
              <div className="mt-2 text-[10px] text-slate-500 space-x-2">
                <span className="bg-gray-200 dark:bg-slate-800 px-1.5 py-0.5 rounded cursor-help" title={t.seqTooltip}>{`{num}`}</span>
                <span className="bg-gray-200 dark:bg-slate-800 px-1.5 py-0.5 rounded cursor-help" title={t.origTooltip}>{`{name}`}</span>
                <span className="bg-gray-200 dark:bg-slate-800 px-1.5 py-0.5 rounded cursor-help" title={t.dateTooltip}>{`{date}`}</span>
              </div>
            </div>

            {/* Sequence Start */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.startNumLabel}</label>
              <input
                type="number"
                value={config.startNumber}
                onChange={(e) => setConfig({ ...config, startNumber: parseInt(e.target.value) || 0 })}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Prefix & Suffix grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.prefixLabel}</label>
                <input
                  type="text"
                  value={config.prefix}
                  onChange={(e) => setConfig({ ...config, prefix: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.suffixLabel}</label>
                <input
                  type="text"
                  value={config.suffix}
                  onChange={(e) => setConfig({ ...config, suffix: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-10 h-5 rounded-full relative transition-colors ${config.dryRun ? 'bg-primary' : 'bg-gray-300 dark:bg-slate-700'}`}>
                  <input type="checkbox" className="hidden" checked={config.dryRun} onChange={(e) => setConfig({ ...config, dryRun: e.target.checked })} />
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${config.dryRun ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t.dryRunLabel}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${config.overwrite ? 'bg-red-500 border-red-500' : 'border-gray-400 dark:border-slate-600 bg-gray-100 dark:bg-slate-800'}`}>
                  <input type="checkbox" className="hidden" checked={config.overwrite} onChange={(e) => setConfig({ ...config, overwrite: e.target.checked })} />
                  {config.overwrite && <Check size={10} className="text-white" />}
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t.overwriteLabel}</span>
              </label>
            </div>

            {/* Resize Section */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sliders size={14} /> {t.resizeLabel}
              </h3>

              {/* Enable Resize Toggle */}
              <label className="flex items-center gap-3 cursor-pointer group mb-4">
                <div className={`w-10 h-5 rounded-full relative transition-colors ${config.enableResize ? 'bg-primary' : 'bg-gray-300 dark:bg-slate-700'}`}>
                  <input type="checkbox" className="hidden" checked={config.enableResize} onChange={(e) => setConfig({ ...config, enableResize: e.target.checked })} />
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${config.enableResize ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t.resizeLabel}</span>
              </label>

              {/* Resize Width Slider */}
              {config.enableResize && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.resizeSizeLabel}</label>
                      <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{config.resizeWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="4000"
                      step="50"
                      value={config.resizeWidth}
                      onChange={(e) => setConfig({ ...config, resizeWidth: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>100px</span>
                      <span>4000px</span>
                    </div>
                  </div>

                  {/* Quality Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.resizeQualityLabel}</label>
                      <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded">{config.resizeQuality}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      value={config.resizeQuality}
                      onChange={(e) => setConfig({ ...config, resizeQuality: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>1%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Keep Originals Checkbox */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${config.keepOriginals ? 'bg-green-500 border-green-500' : 'border-gray-400 dark:border-slate-600 bg-gray-100 dark:bg-slate-800'}`}>
                      <input type="checkbox" className="hidden" checked={config.keepOriginals} onChange={(e) => setConfig({ ...config, keepOriginals: e.target.checked })} />
                      {config.keepOriginals && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{t.keepOriginalsLabel}</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Stats Panel */}
          <div className="p-6">
            <StatsPanel files={files} t={t} />
          </div>

          {/* Action Button */}
          <div className="mt-auto p-6 bg-gray-50 dark:bg-slate-900/30 border-t border-gray-200 dark:border-slate-800">
            <button
              onClick={handleRename}
              disabled={files.length === 0 || isProcessing}
              className={`w-full py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 ${files.length === 0 || isProcessing
                ? 'bg-gray-300 dark:bg-slate-800 text-gray-500 dark:text-slate-500 cursor-not-allowed'
                : 'bg-primary hover:bg-blue-600 text-white hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> {t.processing}
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  {config.dryRun ? t.simulateRename : t.startRename}
                </>
              )}
            </button>
            {isProcessing && (
              <div className="mt-3 w-full bg-gray-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </aside>

        {/* Center: File List */}
        <main className="flex-1 bg-gray-100 dark:bg-background/50 p-6 overflow-hidden flex flex-col transition-colors duration-300">
          {files.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-light text-slate-800 dark:text-white">{t.previewTitle}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Info size={14} />
                <span>{t.modifying} {files.length} {t.files}</span>
              </div>
            </div>
          )}
          <FileList files={processedFiles} t={t} />
        </main>

      </div>
    </div>
  );
};

export default App;
