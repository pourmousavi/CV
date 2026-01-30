'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Loader2 } from 'lucide-react';

interface DuplicateButtonProps {
  questionId: string;
}

export function DuplicateButton({ questionId }: DuplicateButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDuplicate = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/questions/${questionId}/duplicate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to duplicate question');
      }

      // Navigate to the new question for editing
      router.push(`/dashboard/questions/${data.id}/edit`);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to duplicate question');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDuplicate}
      disabled={isLoading}
      className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
      title="Duplicate and edit"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      Duplicate
    </button>
  );
}
