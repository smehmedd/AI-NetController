import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  BookOpen,
  Copy,
  Check,
  Download,
  FileCode,
  Smartphone,
  Server,
  X,
  Code2,
  Terminal,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  Package,
  Play
} from 'lucide-react';
import { CODE_SNIPPETS } from '../data/codeSnippets';
import { ENTERPRISE_SNIPPETS } from '../data/enterpriseSnippets';
import { triggerHapticFeedback } from '../services/hapticService';

const ALL_SNIPPETS = [...ENTERPRISE_SNIPPETS, ...CODE_SNIPPETS];

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'crossplatform' | 'backend' | 'android' | 'frontend' | 'docs'>('backend');
  const [activeFilename, setActiveFilename] = useState<string>('agent/agent.py');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const filteredSnippets = selectedCategory === 'all'
    ? ALL_SNIPPETS
    : ALL_SNIPPETS.filter(s => {
        if (selectedCategory === 'crossplatform') {
          return s.filename.startsWith('apps/mobile/') || s.category === 'crossplatform';
        }
        if (selectedCategory === 'backend') {
          return s.category === 'backend' || s.filename.startsWith('agent/') || s.filename.endsWith('.py') || s.filename.endsWith('requirements.txt') || s.filename.endsWith('.spec') || s.filename.endsWith('.bat');
        }
        if (selectedCategory === 'android') {
          return s.category === 'android' || s.filename.includes('android');
        }
        if (selectedCategory === 'frontend') {
          return s.category === 'frontend' || s.filename.startsWith('apps/web/src/');
        }
        if (selectedCategory === 'docs') {
          return s.category === 'docs' || s.filename.startsWith('docs/') || s.filename.endsWith('.md');
        }
        return true;
      });

  const currentFile = filteredSnippets.find(f => f.filename === activeFilename) || filteredSnippets[0] || ALL_SNIPPETS[0];

  const handleCopy = () => {
    triggerHapticFeedback('light');
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    triggerHapticFeedback('medium');
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.filename.split('/').pop() || currentFile.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    triggerHapticFeedback('heavy');
    setIsZipping(true);
    try {
      const zip = new JSZip();
      ALL_SNIPPETS.forEach(file => {
        zip.file(file.filename, file.code);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cst_autonomous_controller_source_and_builders.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP generation failed:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-[24px] bg-[#091020]/95 backdrop-blur-3xl border border-white/15 border-t-white/25 shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-white/[0.02] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-[12px] bg-[rgba(0,240,255,0.15)] border border-[#00F0FF]/40 text-[#00F0FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Code2 className="w-5 h-5 text-[#00F0FF]" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-base sm:text-lg font-bold text-white font-display uppercase tracking-wider">
                  ИЗХОДЕН КОД И ДИПЛОМНА ДОКУМЕНТАЦИЯ
                </h2>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[#00FFA3]/15 border border-[#00FFA3]/30 text-[#00FFA3] text-[10px] font-mono font-semibold">
                  CST B.Sc. Thesis
                </span>
              </div>
              <p className="text-xs text-[#7A93B2] font-mono">
                Flutter 3.x (Dart) Мобилен клиент • Python Host Daemon (agent.py) • WoL Magic Packet
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[10px] bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#040812] text-xs font-mono font-bold transition shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer"
              title="Изтегли всички файлове и билдъри в структуриран ZIP архив"
            >
              <Package className="w-3.5 h-3.5 text-[#040812]" />
              <span>{isZipping ? 'Архивиране...' : 'Свали проект (.ZIP)'}</span>
            </button>

            <button
              onClick={() => {
                triggerHapticFeedback('light');
                onClose();
              }}
              className="w-9 h-9 rounded-[10px] bg-white/5 hover:bg-[#FF2A6D]/20 border border-white/10 hover:border-[#FF2A6D]/40 text-[#7A93B2] hover:text-[#FF2A6D] flex items-center justify-center transition cursor-pointer"
              title="Затвори прозореца"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick 1-Click Compilation Instructions Banner */}
        <div className="px-6 py-2.5 bg-[rgba(0,240,255,0.06)] border-b border-[rgba(0,240,255,0.2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center space-x-2 text-[#00F0FF] shrink-0">
            <Sparkles className="w-4 h-4 text-[#00F0FF] shrink-0 animate-pulse" />
            <span className="font-bold">1-КЛИК КОМПИЛАЦИЯ НА .EXE & .APK:</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#A0B8D0]">
            <span>
              🪟 <b className="text-white">Windows .EXE:</b> Разархивирай ZIP → Влез в <code className="text-[#00F0FF]">agent/</code> → Стартирай <code className="text-[#00F0FF]">build_exe.bat</code>
            </span>
            <span>
              📱 <b className="text-white">Android .APK:</b> Разархивирай ZIP → Влез в <code className="text-[#00F0FF]">apps/mobile/</code> → Стартирай <code className="text-[#00F0FF]">build_apk.bat</code>
            </span>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <div className="px-6 py-2.5 bg-[rgba(10,22,40,0.85)] border-b border-[rgba(0,240,255,0.15)] flex items-center space-x-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setSelectedCategory('backend');
              setActiveFilename('agent/agent.py');
            }}
            className={`px-3.5 py-1.5 rounded-[10px] text-xs font-mono font-semibold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              selectedCategory === 'backend'
                ? 'bg-[#00F0FF] text-[#040812] shadow-[0_0_12px_rgba(0,240,255,0.5)] font-bold'
                : 'bg-white/5 text-[#7A93B2] hover:text-white border border-white/10'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>🐍 Python Agent (3.12+)</span>
          </button>

          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setSelectedCategory('crossplatform');
              setActiveFilename('apps/mobile/lib/main.dart');
            }}
            className={`px-3.5 py-1.5 rounded-[10px] text-xs font-mono font-semibold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              selectedCategory === 'crossplatform'
                ? 'bg-[#00F0FF] text-[#040812] shadow-[0_0_12px_rgba(0,240,255,0.5)] font-bold'
                : 'bg-white/5 text-[#7A93B2] hover:text-white border border-white/10'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 Flutter 3.27+ (Dart)</span>
          </button>

          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setSelectedCategory('android');
              setActiveFilename('apps/mobile/android/app/src/main/AndroidManifest.xml');
            }}
            className={`px-3.5 py-1.5 rounded-[10px] text-xs font-mono font-semibold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              selectedCategory === 'android'
                ? 'bg-[#00F0FF] text-[#040812] shadow-[0_0_12px_rgba(0,240,255,0.5)] font-bold'
                : 'bg-white/5 text-[#7A93B2] hover:text-white border border-white/10'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>🤖 Android (Manifest)</span>
          </button>

          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setSelectedCategory('frontend');
              setActiveFilename('src/components/SystemUpdateModal.tsx');
            }}
            className={`px-3.5 py-1.5 rounded-[10px] text-xs font-mono font-semibold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              selectedCategory === 'frontend'
                ? 'bg-[#00F0FF] text-[#040812] shadow-[0_0_12px_rgba(0,240,255,0.5)] font-bold'
                : 'bg-white/5 text-[#7A93B2] hover:text-white border border-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>⚛️ React (Update Center)</span>
          </button>

          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setSelectedCategory('docs');
              setActiveFilename('docs/OPEN_SOURCE_MODELS_ARCH.md');
            }}
            className={`px-3.5 py-1.5 rounded-[10px] text-xs font-mono font-semibold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              selectedCategory === 'docs'
                ? 'bg-[#00F0FF] text-[#040812] shadow-[0_0_12px_rgba(0,240,255,0.5)] font-bold'
                : 'bg-white/5 text-[#7A93B2] hover:text-white border border-white/10'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>📚 Архитектура & CI/CD</span>
          </button>

          <button
            onClick={() => {
              triggerHapticFeedback('light');
              setSelectedCategory('all');
            }}
            className={`px-3.5 py-1.5 rounded-[10px] text-xs font-mono font-semibold transition flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#00F0FF] text-[#040812] shadow-[0_0_12px_rgba(0,240,255,0.5)] font-bold'
                : 'bg-white/5 text-[#7A93B2] hover:text-white border border-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Всички файлове ({CODE_SNIPPETS.length})</span>
          </button>
        </div>

        {/* Sub-header File Selector Bar */}
        <div className="px-6 py-2 bg-[rgba(4,8,18,0.95)] border-b border-white/10 flex items-center space-x-2 overflow-x-auto shrink-0 scrollbar-thin">
          {filteredSnippets.map((file) => (
            <button
              key={file.filename}
              onClick={() => {
                triggerHapticFeedback('light');
                setActiveFilename(file.filename);
              }}
              className={`flex items-center space-x-2 px-3 py-1 rounded-[8px] text-xs font-mono transition whitespace-nowrap cursor-pointer ${
                activeFilename === file.filename
                  ? 'bg-[rgba(0,240,255,0.15)] text-[#00F0FF] border border-[#00F0FF]/40 font-bold'
                  : 'text-[#7A93B2] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{file.filename}</span>
            </button>
          ))}
        </div>

        {/* File Metadata & Quick Actions */}
        <div className="px-6 py-2.5 bg-[rgba(8,17,32,0.95)] border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-[rgba(0,240,255,0.1)] border border-[#00F0FF]/30 text-[#00F0FF] font-mono text-[10px] font-bold uppercase">
              {currentFile.language}
            </span>
            <span className="text-white font-medium truncate">
              {currentFile.description}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-[8px] bg-white/10 hover:bg-[#00F0FF]/20 border border-white/15 text-white text-xs font-mono transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#00FFA3]" /> : <Copy className="w-3.5 h-3.5 text-[#00F0FF]" />}
              <span>{copied ? 'Копирано!' : 'Копирай'}</span>
            </button>

            <button
              onClick={handleDownloadFile}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-[8px] bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-[#040812] text-xs font-mono font-bold transition shadow-[0_0_10px_rgba(0,240,255,0.4)] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#040812]" />
              <span>Свали файл</span>
            </button>
          </div>
        </div>

        {/* Code Content Window */}
        <div className="flex-1 p-4 sm:p-6 bg-[#040812] overflow-y-auto overflow-x-auto font-mono text-xs text-slate-300 select-text scrollbar-thin">
          <pre className="leading-relaxed">
            <code>{currentFile.code}</code>
          </pre>
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-2.5 bg-[rgba(8,17,32,0.95)] border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#7A93B2] shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#00FFA3]" />
            <span>Готов за компилация (Flutter SDK 3.x / Python 3.11+)</span>
          </div>
          <span>Ред 1 - {currentFile.code.split('\n').length} реда • UTF-8</span>
        </div>
      </div>
    </div>
  );
};
