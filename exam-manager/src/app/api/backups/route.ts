import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { readdir, stat } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Backup directory - this should be in the Dropbox-synced folder
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');

interface BackupFile {
  filename: string;
  size: number;
  createdAt: string;
  type: 'database' | 'uploads';
}

// GET - List all backups
export async function GET() {
  try {
    await requireUser();

    const backups: BackupFile[] = [];

    try {
      const files = await readdir(BACKUP_DIR);

      for (const filename of files) {
        // Only include .sql and .tar.gz files
        if (!filename.endsWith('.sql') && !filename.endsWith('.tar.gz')) {
          continue;
        }

        const filePath = path.join(BACKUP_DIR, filename);
        const stats = await stat(filePath);

        backups.push({
          filename,
          size: stats.size,
          createdAt: stats.mtime.toISOString(),
          type: filename.endsWith('.sql') ? 'database' : 'uploads',
        });
      }

      // Sort by date descending (newest first)
      backups.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err) {
      // Directory doesn't exist or is empty - that's okay
      console.log('Backup directory not found or empty:', BACKUP_DIR);
    }

    return NextResponse.json({
      backups,
      backupDir: BACKUP_DIR,
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json(
      { error: 'Failed to list backups' },
      { status: 500 }
    );
  }
}

// POST - Create a new backup
export async function POST(request: NextRequest) {
  try {
    await requireUser();

    const body = await request.json();
    const { type } = body as { type?: 'database' | 'uploads' | 'all' };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const results: string[] = [];

    // Create backup directory if it doesn't exist
    const { mkdir } = await import('fs/promises');
    await mkdir(BACKUP_DIR, { recursive: true });

    if (type === 'database' || type === 'all' || !type) {
      // Database backup using pg_dump
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        return NextResponse.json(
          { error: 'DATABASE_URL not configured' },
          { status: 500 }
        );
      }

      const dbFilename = `exam_manager_db_${timestamp}.sql`;
      const dbPath = path.join(BACKUP_DIR, dbFilename);

      try {
        // Parse DATABASE_URL for pg_dump
        const url = new URL(dbUrl);
        const host = url.hostname;
        const port = url.port || '5432';
        const database = url.pathname.slice(1);
        const username = url.username;
        const password = url.password;

        // Set PGPASSWORD environment variable for pg_dump
        const env = { ...process.env, PGPASSWORD: password };

        await execAsync(
          `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -f "${dbPath}"`,
          { env }
        );

        results.push(`Database backup created: ${dbFilename}`);
      } catch (err) {
        console.error('Database backup failed:', err);
        results.push('Database backup failed - pg_dump may not be available');
      }
    }

    if (type === 'uploads' || type === 'all') {
      // Uploads backup using tar
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const uploadsFilename = `exam_manager_uploads_${timestamp}.tar.gz`;
      const uploadsPath = path.join(BACKUP_DIR, uploadsFilename);

      try {
        await execAsync(`tar -czf "${uploadsPath}" -C "${process.cwd()}" uploads`);
        results.push(`Uploads backup created: ${uploadsFilename}`);
      } catch (err) {
        console.error('Uploads backup failed:', err);
        results.push('Uploads backup failed - directory may be empty');
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}
