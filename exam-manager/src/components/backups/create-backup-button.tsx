'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2, Database, FolderOpen, Layers } from 'lucide-react';

export function CreateBackupButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBackup = async (type: 'database' | 'uploads' | 'all') => {
    setError(null);
    setResults(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create backup');
      }

      setResults(data.results);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setIsOpen(false);
      setResults(null);
      setError(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Create Backup
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Create Backup</h2>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {results && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">Backup Complete</p>
                {results.map((result, i) => (
                  <p key={i} className="text-sm text-green-700">{result}</p>
                ))}
              </div>
            )}

            {!results && (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Choose what to backup. Backups are saved to your configured backup directory.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => handleBackup('database')}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    ) : (
                      <Database className="h-8 w-8 text-blue-600" />
                    )}
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Database Only</p>
                      <p className="text-sm text-gray-500">
                        Export PostgreSQL database (.sql)
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleBackup('uploads')}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
                    ) : (
                      <FolderOpen className="h-8 w-8 text-green-600" />
                    )}
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Uploads Only</p>
                      <p className="text-sm text-gray-500">
                        Archive uploaded images (.tar.gz)
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleBackup('all')}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                    ) : (
                      <Layers className="h-8 w-8 text-purple-600" />
                    )}
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Full Backup</p>
                      <p className="text-sm text-gray-500">
                        Database + uploads (recommended)
                      </p>
                    </div>
                  </button>
                </div>
              </>
            )}

            <button
              onClick={handleClose}
              disabled={isLoading}
              className="mt-4 w-full px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              {results ? 'Close' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
