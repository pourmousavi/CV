'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Search, Loader2 } from 'lucide-react';
import { LaTeXPreview } from '@/components/ui/latex-preview';

interface Question {
  id: string;
  questionType: string;
  difficulty: string;
  questionLatex: string;
  defaultPoints: number | null;
  topic: { id: string; name: string } | null;
}

interface AddQuestionModalProps {
  examId: string;
  availableQuestions: Question[];
}

const difficultyStyles: Record<string, string> = {
  EASY: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HARD: 'bg-red-100 text-red-700',
};

export function AddQuestionModal({ examId, availableQuestions }: AddQuestionModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);

  // Get unique topics
  const topics = Array.from(
    new Set(availableQuestions.filter((q) => q.topic).map((q) => q.topic!.name))
  ).sort();

  // Filter questions
  const filteredQuestions = availableQuestions.filter((q) => {
    const matchesSearch =
      !search ||
      q.questionLatex.toLowerCase().includes(search.toLowerCase());
    const matchesTopic = !selectedTopic || q.topic?.name === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  const handleAddQuestion = async (questionId: string) => {
    setAddingId(questionId);

    try {
      const response = await fetch(`/api/exams/${examId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add question');
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add question');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Questions
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Add Questions to Exam
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 p-4 border-b border-gray-200">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              >
                <option value="">All Topics</option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            {/* Questions list */}
            <div className="flex-1 overflow-y-auto p-4">
              {availableQuestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No more questions available for this course.
                  <br />
                  Create new questions to add them to this exam.
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No questions match your filters.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="flex items-start gap-4 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {question.topic && (
                            <span className="text-xs text-gray-500">
                              {question.topic.name}
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              difficultyStyles[question.difficulty]
                            }`}
                          >
                            {question.difficulty.toLowerCase()}
                          </span>
                          {question.defaultPoints && (
                            <span className="text-xs text-gray-500">
                              {question.defaultPoints} pts
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-900 line-clamp-2">
                          <LaTeXPreview
                            content={question.questionLatex.substring(0, 200)}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddQuestion(question.id)}
                        disabled={addingId === question.id}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1"
                      >
                        {addingId === question.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-4 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
