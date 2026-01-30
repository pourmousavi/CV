'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';

interface DeleteQuestionButtonProps {
  questionId: string;
  examCount: number;
}

export function DeleteQuestionButton({ questionId, examCount }: DeleteQuestionButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = examCount === 0;

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete question');
      }

      router.push('/dashboard/questions');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
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
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isDeleting && setIsOpen(false)}
          />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Delete Question
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
                  Are you sure you want to delete this question? This action cannot
                  be undone.
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
                    Delete Question
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  This question cannot be deleted because it is used in{' '}
                  <span className="font-medium">{examCount} exam{examCount !== 1 && 's'}</span>.
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  You can archive the question instead, or remove it from all exams first.
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
