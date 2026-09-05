import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer ${className}`}
        style={{ backgroundColor: '#16a34a' }}
        title="Install SchoolOS to your desktop or mobile home screen"
        aria-label="Install App"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer ${className}`}
          title="Install SchoolOS on iPhone or iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-green-600" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center text-white font-black text-xs">
                    S
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Install SchoolOS</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-slate-600">
                To install SchoolOS on your iPhone or iPad:
              </p>
              <ol className="mt-3 space-y-2 text-xs text-slate-700 list-decimal list-inside bg-slate-50 p-3 rounded-xl border border-slate-200">
                <li>Tap the <strong>Share</strong> button in Safari's bottom toolbar.</li>
                <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top-right corner.</li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-green-600 hover:bg-green-700 py-2.5 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                style={{ backgroundColor: '#16a34a' }}
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
