'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, BarChart3 } from 'lucide-react';

interface ExamQuestion {
  id: string;
  pointsAssigned: number | null;
  averageScore: number | null;
  stdDeviation: number | null;
  minScore?: number | null;
  maxScore?: number | null;
  responseCount?: number | null;
  performanceNotes?: string | null;
  question: {
    id: string;
    questionLatex: string;
  };
}

interface PerformanceModalProps {
  examId: string;
  examQuestion: ExamQuestion;
  onClose: () => void;
}

export function PerformanceModal({
  examId,
  examQuestion,
  onClose,
}: PerformanceModalProps) {
  const router = useRouter();

  const [averageScore, setAverageScore] = useState(
    examQuestion.averageScore?.toString() || ''
  );
  const [stdDeviation, setStdDeviation] = useState(
    examQuestion.stdDeviation?.toString() || ''
  );
  const [minScore, setMinScore] = useState(
    examQuestion.minScore?.toString() || ''
  );
  const [maxScore, setMaxScore] = useState(
    examQuestion.maxScore?.toString() || ''
  );
  const [responseCount, setResponseCount] = useState(
    examQuestion.responseCount?.toString() || ''
  );
  const [performanceNotes, setPerformanceNotes] = useState(
    examQuestion.performanceNotes || ''
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/exams/${examId}/questions/${examQuestion.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            averageScore: averageScore || null,
            stdDeviation: stdDeviation || null,
            minScore: minScore || null,
            maxScore: maxScore || null,
            responseCount: responseCount || null,
            performanceNotes: performanceNotes || null,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save performance data');
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setIsLoading(false);
    }
  };

  const maxPoints = examQuestion.pointsAssigned
    ? Number(examQuestion.pointsAssigned)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Student Performance Data
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Question preview */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600 line-clamp-2">
            {examQuestion.question.questionLatex.substring(0, 150)}...
          </p>
          {maxPoints && (
            <p className="text-xs text-gray-500 mt-1">
              Max points: {maxPoints}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="average"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Average Score
              </label>
              <input
                id="average"
                type="number"
                step="0.01"
                min="0"
                max={maxPoints || undefined}
                value={averageScore}
                onChange={(e) => setAverageScore(e.target.value)}
                placeholder="e.g., 7.5"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="stdDev"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Std. Deviation
              </label>
              <input
                id="stdDev"
                type="number"
                step="0.01"
                min="0"
                value={stdDeviation}
                onChange={(e) => setStdDeviation(e.target.value)}
                placeholder="e.g., 2.1"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="min"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Min Score
              </label>
              <input
                id="min"
                type="number"
                step="0.01"
                min="0"
                max={maxPoints || undefined}
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                placeholder="e.g., 0"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="max"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Max Score
              </label>
              <input
                id="max"
                type="number"
                step="0.01"
                min="0"
                max={maxPoints || undefined}
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                placeholder="e.g., 10"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="count"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Number of Responses
            </label>
            <input
              id="count"
              type="number"
              min="0"
              value={responseCount}
              onChange={(e) => setResponseCount(e.target.value)}
              placeholder="e.g., 45"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Performance Notes
            </label>
            <textarea
              id="notes"
              value={performanceNotes}
              onChange={(e) => setPerformanceNotes(e.target.value)}
              rows={3}
              placeholder="Common mistakes, observations, etc."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
