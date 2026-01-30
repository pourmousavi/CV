'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  Trash2,
  Loader2,
  Database,
  FolderOpen,
  FileArchive,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface BackupFile {
  filename: string;
  size: number;
  createdAt: string;
  type: 'database' | 'uploads';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BackupList() {
  const router = useRouter();
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [backupDir, setBackupDir] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchBackups = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/backups');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch backups');
      }

      setBackups(data.backups);
      setBackupDir(data.backupDir);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch backups');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleDownload = (filename: string) => {
    window.location.href = `/api/backups/${encodeURIComponent(filename)}`;
  };

  const handleDelete = async (filename: string) => {
    setDeletingFile(filename);

    try {
      const response = await fetch(`/api/backups/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete backup');
      }

      setDeleteConfirm(null);
      fetchBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete backup');
    } finally {
      setDeletingFile(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading backups...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Backups</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchBackups}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  if (backups.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <FileArchive className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No backups yet</h2>
        <p className="text-gray-600 mb-2">
          Create your first backup using the button above.
        </p>
        <p className="text-sm text-gray-500">
          Backup directory: <code className="bg-gray-100 px-1 rounded">{backupDir}</code>
        </p>
      </div>
    );
  }

  // Group backups by date
  const groupedBackups: Record<string, BackupFile[]> = {};
  backups.forEach((backup) => {
    const date = new Date(backup.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groupedBackups[date]) {
      groupedBackups[date] = [];
    }
    groupedBackups[date].push(backup);
  });

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedBackups).map(([date, dateBackups]) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-gray-500 mb-3">{date}</h3>
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
              {dateBackups.map((backup) => (
                <div
                  key={backup.filename}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {backup.type === 'database' ? (
                      <Database className="h-8 w-8 text-blue-600" />
                    ) : (
                      <FolderOpen className="h-8 w-8 text-green-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{backup.filename}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(backup.size)} &middot;{' '}
                        {formatDate(backup.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(backup.filename)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download backup"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(backup.filename)}
                      disabled={deletingFile === backup.filename}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete backup"
                    >
                      {deletingFile === backup.filename ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="text-sm text-gray-500 text-center">
          Backup directory: <code className="bg-gray-100 px-1 rounded">{backupDir}</code>
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeleteConfirm(null)}
          />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Delete Backup</h2>
            </div>

            <p className="text-gray-600 mb-4">
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-900">{deleteConfirm}</span>?
            </p>

            <p className="text-sm text-amber-600 mb-4">
              This action cannot be undone. The backup file will be permanently deleted.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={!!deletingFile}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
              >
                {deletingFile && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
