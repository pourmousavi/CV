'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';

interface DeleteCourseButtonProps {
  courseId: string;
  courseName: string;
  questionCount: number;
  examCount: number;
}

export function DeleteCourseButton({
  courseId,
  courseName,
  questionCount,
  examCount,
}: DeleteCourseButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = questionCount === 0 && examCount === 0;

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete course');
      }

      router.push('/dashboard/courses');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isDeleting && setIsOpen(false)}
          />

          {/* Modal content */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Delete Course
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {canDelete ? (
              <>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete{' '}
                  <span className="font-medium text-gray-900">{courseName}</span>
                  ? This action cannot be undone.
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsOpen(false)}
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
                    Delete Course
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Cannot delete{' '}
                  <span className="font-medium text-gray-900">{courseName}</span>{' '}
                  because it contains:
                </p>
                <ul className="mb-4 space-y-1 text-sm text-gray-600">
                  {questionCount > 0 && (
                    <li>
                      • {questionCount} question{questionCount !== 1 && 's'}
                    </li>
                  )}
                  {examCount > 0 && (
                    <li>
                      • {examCount} exam{examCount !== 1 && 's'}
                    </li>
                  )}
                </ul>
                <p className="text-sm text-gray-500 mb-4">
                  Please delete or move these items first.
                </p>

                <div className="flex justify-end">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
