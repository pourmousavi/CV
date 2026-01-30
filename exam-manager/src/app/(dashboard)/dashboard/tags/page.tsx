import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft, Tag, Plus } from 'lucide-react';
import { TagList } from '@/components/tags/tag-list';
import { CreateTagButton } from '@/components/tags/create-tag-button';

export default async function TagsPage() {
  await requireUser();

  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { questions: true },
      },
    },
  });

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
          <Tag className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
            <p className="text-gray-600">Organize questions with custom tags</p>
          </div>
        </div>
        <CreateTagButton />
      </div>

      {/* Tags list */}
      {tags.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No tags yet</h2>
          <p className="text-gray-600 mb-4">
            Create tags to categorize your questions across courses.
          </p>
          <CreateTagButton variant="primary" />
        </div>
      ) : (
        <TagList tags={tags} />
      )}
    </div>
  );
}
