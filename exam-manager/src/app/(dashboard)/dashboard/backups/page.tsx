import { requireUser } from '@/lib/session';
import Link from 'next/link';
import { ArrowLeft, FolderOpen, Shield } from 'lucide-react';
import { BackupList } from '@/components/backups/backup-list';
import { CreateBackupButton } from '@/components/backups/create-backup-button';

export default async function BackupsPage() {
  await requireUser();

  return (
    <div className="max-w-4xl">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Backups</h1>
            <p className="text-gray-600">Manage database and file backups</p>
          </div>
        </div>
        <CreateBackupButton />
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Automatic Backups</h3>
            <p className="text-sm text-blue-700 mt-1">
              When running with Docker, daily backups are automatically created and stored
              in your configured backup directory (typically synced to Dropbox). You can also
              create manual backups at any time using the button above.
            </p>
          </div>
        </div>
      </div>

      {/* Backups list */}
      <BackupList />
    </div>
  );
}
