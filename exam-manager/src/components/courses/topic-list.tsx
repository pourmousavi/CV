'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FolderOpen,
  FileQuestion,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  GripVertical,
} from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  _count: {
    questions: number;
  };
}

interface TopicListProps {
  courseId: string;
  topics: Topic[];
}

export function TopicList({ courseId, topics }: TopicListProps) {
  if (topics.length === 0) {
    return (
      <div className="p-8 text-center">
        <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-gray-600">No topics yet</p>
        <p className="text-sm text-gray-500">
          Create topics to organize questions within this course
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {topics.map((topic) => (
        <TopicItem key={topic.id} courseId={courseId} topic={topic} />
      ))}
    </div>
  );
}

function TopicItem({ courseId, topic }: { courseId: string; topic: Topic }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/courses/${courseId}/topics/${topic.id}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete topic');
      }

      setShowDeleteModal(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete topic');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
        <div className="text-gray-400 cursor-grab">
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900">{topic.name}</span>
          </div>
          {topic.description && (
            <p className="mt-0.5 text-sm text-gray-500 truncate">
              {topic.description}
            </p>
          )}
        </div>

        <Link
          href={`/dashboard/questions?course=${courseId}&topic=${topic.id}`}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <FileQuestion className="h-4 w-4" />
          <span>{topic._count.questions}</span>
        </Link>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/dashboard/courses/${courseId}/topics/${topic.id}/edit`}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Delete Topic
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <p className="text-gray-600 mb-4">
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-900">{topic.name}</span>?
            </p>

            {topic._count.questions > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  This topic has {topic._count.questions} question
                  {topic._count.questions !== 1 && 's'}. They will be unassigned
                  from this topic but not deleted.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete Topic
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
