import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { readFile, unlink, stat } from 'fs/promises';
import path from 'path';

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');

interface RouteParams {
  params: Promise<{ filename: string }>;
}

// GET - Download a backup file
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireUser();
    const { filename } = await params;

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Only allow .sql and .tar.gz files
    if (!filename.endsWith('.sql') && !filename.endsWith('.tar.gz')) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    const filePath = path.join(BACKUP_DIR, filename);

    // Ensure the resolved path is within BACKUP_DIR
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(path.normalize(BACKUP_DIR))) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    try {
      await stat(normalizedPath);
    } catch {
      return NextResponse.json(
        { error: 'Backup file not found' },
        { status: 404 }
      );
    }

    const fileBuffer = await readFile(normalizedPath);

    const contentType = filename.endsWith('.sql')
      ? 'application/sql'
      : 'application/gzip';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading backup:', error);
    return NextResponse.json(
      { error: 'Failed to download backup' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a backup file
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireUser();
    const { filename } = await params;

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Only allow .sql and .tar.gz files
    if (!filename.endsWith('.sql') && !filename.endsWith('.tar.gz')) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    const filePath = path.join(BACKUP_DIR, filename);

    // Ensure the resolved path is within BACKUP_DIR
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(path.normalize(BACKUP_DIR))) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    try {
      await stat(normalizedPath);
    } catch {
      return NextResponse.json(
        { error: 'Backup file not found' },
        { status: 404 }
      );
    }

    await unlink(normalizedPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      { error: 'Failed to delete backup' },
      { status: 500 }
    );
  }
}
