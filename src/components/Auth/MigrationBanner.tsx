import React, { useState, useEffect } from 'react';
import {
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  ArrowRight,
  SkipForward,
} from 'lucide-react';

export type MigrationState =
  | 'idle'
  | 'detected'    // Local data found, prompting user
  | 'migrating'   // Upload in progress
  | 'success'     // Migration complete
  | 'skipped'     // User chose to skip
  | 'error';      // Upload failed

interface MigrationBannerProps {
  state: MigrationState;
  onMigrate: () => void;
  onSkip: () => void;
  onDismiss: () => void;
  errorMessage?: string;
  dataSummary?: {
    tests: number;
    subjects: number;
    practiceRecords: number;
    hasProfile: boolean;
  };
}

export const MigrationBanner: React.FC<MigrationBannerProps> = ({
  state,
  onMigrate,
  onSkip,
  onDismiss,
  errorMessage,
  dataSummary,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (state === 'success' || state === 'skipped') {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state, onDismiss]);

  if (!visible) return null;
  if (state === 'idle') return null;

  const containerClass = `
    fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md mx-4
    transition-all duration-300 ease-out
    ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
  `;

  if (state === 'success') {
    return (
      <div className={containerClass}>
        <div className="bg-emerald-900 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold text-sm">Progress migrated to cloud! ✓</p>
            <p className="text-xs text-emerald-300 mt-0.5">
              Your REBOUND workspace is now synced. You can access it from any device.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'skipped') {
    return (
      <div className={containerClass}>
        <div className="bg-gray-800 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3">
          <SkipForward className="w-5 h-5 text-gray-400 shrink-0" />
          <p className="text-sm">
            Migration skipped. Your local data is still available in this browser.
          </p>
        </div>
      </div>
    );
  }

  if (state === 'detected') {
    return (
      <div className={containerClass}>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-[#14281D] text-white p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#B4F04C] text-[#14281D] flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Existing REBOUND data found</h3>
                <p className="text-xs text-[#9BB0A3]">
                  Upload your local progress to the cloud
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {dataSummary && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {dataSummary.hasProfile && (
                  <div className="bg-[#F4F8F5] rounded-xl p-2 text-center">
                    <p className="font-bold text-[#14281D]">Profile</p>
                    <p className="text-gray-500">set up</p>
                  </div>
                )}
                {dataSummary.subjects > 0 && (
                  <div className="bg-[#F4F8F5] rounded-xl p-2 text-center">
                    <p className="font-bold text-[#14281D]">{dataSummary.subjects}</p>
                    <p className="text-gray-500">subject{dataSummary.subjects !== 1 ? 's' : ''}</p>
                  </div>
                )}
                {dataSummary.tests > 0 && (
                  <div className="bg-[#F4F8F5] rounded-xl p-2 text-center">
                    <p className="font-bold text-[#14281D]">{dataSummary.tests}</p>
                    <p className="text-gray-500">assessment{dataSummary.tests !== 1 ? 's' : ''}</p>
                  </div>
                )}
                {dataSummary.practiceRecords > 0 && (
                  <div className="bg-[#F4F8F5] rounded-xl p-2 text-center">
                    <p className="font-bold text-[#14281D]">{dataSummary.practiceRecords}</p>
                    <p className="text-gray-500">practice session{dataSummary.practiceRecords !== 1 ? 's' : ''}</p>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-gray-600">
              Your local data will be merged with any existing cloud data. The most
              recently updated records will be kept. Nothing will be deleted before
              upload succeeds.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onMigrate}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#14281D] text-[#B4F04C] font-bold text-sm hover:bg-[#1e3a2a] transition-colors"
              >
                <CloudUpload className="w-4 h-4" />
                Upload to cloud
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium text-xs transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'migrating') {
    return (
      <div className={containerClass}>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-[#14281D] animate-spin shrink-0" />
            <div>
              <p className="font-bold text-sm text-[#14281D]">Uploading to cloud…</p>
              <p className="text-xs text-gray-500">
                Please don't close this tab until migration completes.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={containerClass}>
        <div className="bg-white rounded-2xl shadow-2xl border border-red-100 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-sm text-red-700">Migration failed</p>
              {errorMessage && (
                <p className="text-xs text-red-500 mt-0.5">{errorMessage}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Your local data is safe. You can try again or skip.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={onMigrate}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#14281D] text-[#B4F04C] font-bold text-xs"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 font-medium text-xs"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
