'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';
import { LaTeXEditor } from '@/components/ui/latex-editor';
import { ImageUpload } from '@/components/questions/image-upload';

interface Course {
  id: string;
  code: string;
  name: string;
  color: string | null;
}

interface Topic {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface QuestionImage {
  id: string;
  filename: string;
  filepath: string;
  caption: string | null;
  sortOrder: number;
}

interface QuestionOption {
  label: string;
  optionLatex: string;
  isCorrect: boolean;
}

interface QuestionFormProps {
  courses: Course[];
  tags: Tag[];
  initialCourseId?: string;
  initialTopicId?: string;
  initialData?: {
    id: string;
    courseId: string;
    topicId: string | null;
    questionType: string;
    difficulty: string;
    questionLatex: string;
    solutionLatex: string | null;
    answerKey: string | null;
    defaultPoints: number | null;
    notes: string | null;
    sourceReference: string | null;
    options: { label: string; optionLatex: string; isCorrect: boolean }[];
    tags: { tag: Tag }[];
    images: QuestionImage[];
  };
}

const questionTypes = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'LONG_FORM', label: 'Long Form / Proof' },
  { value: 'NUMERICAL', label: 'Numerical' },
];

const difficulties = [
  { value: 'EASY', label: 'Easy', color: 'bg-green-100 text-green-700' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'HARD', label: 'Hard', color: 'bg-red-100 text-red-700' },
];

const defaultOptions: QuestionOption[] = [
  { label: 'A', optionLatex: '', isCorrect: false },
  { label: 'B', optionLatex: '', isCorrect: false },
  { label: 'C', optionLatex: '', isCorrect: false },
  { label: 'D', optionLatex: '', isCorrect: false },
];

export function QuestionForm({
  courses,
  tags,
  initialCourseId,
  initialTopicId,
  initialData,
}: QuestionFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  // Form state
  const [courseId, setCourseId] = useState(initialData?.courseId || initialCourseId || '');
  const [topicId, setTopicId] = useState(initialData?.topicId || initialTopicId || '');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questionType, setQuestionType] = useState(initialData?.questionType || 'MULTIPLE_CHOICE');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'MEDIUM');
  const [questionLatex, setQuestionLatex] = useState(initialData?.questionLatex || '');
  const [solutionLatex, setSolutionLatex] = useState(initialData?.solutionLatex || '');
  const [answerKey, setAnswerKey] = useState(initialData?.answerKey || '');
  const [defaultPoints, setDefaultPoints] = useState(
    initialData?.defaultPoints?.toString() || ''
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [sourceReference, setSourceReference] = useState(initialData?.sourceReference || '');
  const [options, setOptions] = useState<QuestionOption[]>(
    initialData?.options?.length ? initialData.options : defaultOptions
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.tags?.map((t) => t.tag.id) || []
  );
  const [images, setImages] = useState<QuestionImage[]>(initialData?.images || []);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch topics when course changes
  useEffect(() => {
    if (courseId) {
      fetch(`/api/courses/${courseId}/topics`)
        .then((res) => res.json())
        .then((data) => {
          setTopics(data);
          // Clear topic if it doesn't belong to new course
          if (topicId && !data.find((t: Topic) => t.id === topicId)) {
            setTopicId('');
          }
        })
        .catch(() => setTopics([]));
    } else {
      setTopics([]);
      setTopicId('');
    }
  }, [courseId]);

  // Handle option changes
  const updateOption = (index: number, field: keyof QuestionOption, value: string | boolean) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };

    // If setting an option as correct, unset others (single answer)
    if (field === 'isCorrect' && value === true) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
      // Update answer key
      setAnswerKey(newOptions[index].label);
    }

    setOptions(newOptions);
  };

  const addOption = () => {
    const nextLabel = String.fromCharCode(65 + options.length); // A, B, C, D, E...
    setOptions([...options, { label: nextLabel, optionLatex: '', isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return; // Keep at least 2 options
    const newOptions = options.filter((_, i) => i !== index);
    // Relabel options
    newOptions.forEach((opt, i) => {
      opt.label = String.fromCharCode(65 + i);
    });
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const url = isEditing ? `/api/questions/${initialData.id}` : '/api/questions';
      const method = isEditing ? 'PUT' : 'POST';

      const payload: Record<string, unknown> = {
        courseId,
        topicId: topicId || null,
        questionType,
        difficulty,
        questionLatex,
        solutionLatex: solutionLatex || null,
        answerKey: answerKey || null,
        defaultPoints: defaultPoints || null,
        notes: notes || null,
        sourceReference: sourceReference || null,
        tagIds: selectedTagIds,
      };

      // Include options for multiple choice
      if (questionType === 'MULTIPLE_CHOICE') {
        payload.options = options.filter((opt) => opt.optionLatex.trim());
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save question');
      }

      router.push(`/dashboard/questions/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Back link */}
      <Link
        href={isEditing ? `/dashboard/questions/${initialData.id}` : '/dashboard/questions'}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {isEditing ? 'Back to question' : 'Back to questions'}
      </Link>

      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit Question' : 'New Question'}
      </h1>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Course and Topic */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Classification</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                Course *
              </label>
              <select
                id="course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
                Topic
              </label>
              <select
                id="topic"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                disabled={!courseId}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
              >
                <option value="">No topic</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Type and Difficulty */}
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Question Type *
              </label>
              <select
                id="type"
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {questionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty *
              </label>
              <div className="flex gap-2">
                {difficulties.map((diff) => (
                  <button
                    key={diff.value}
                    type="button"
                    onClick={() => setDifficulty(diff.value)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      difficulty === diff.value
                        ? diff.color
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    setSelectedTagIds((prev) =>
                      prev.includes(tag.id)
                        ? prev.filter((id) => id !== tag.id)
                        : [...prev, tag.id]
                    );
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTagIds.includes(tag.id)
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={
                    selectedTagIds.includes(tag.id)
                      ? { backgroundColor: tag.color || '#3B82F6' }
                      : undefined
                  }
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Question Content</h2>

          <LaTeXEditor
            label="Question"
            value={questionLatex}
            onChange={setQuestionLatex}
            required
            placeholder="Enter your question here. Use $...$ for inline math and $$...$$ for display math."
            helpText="Example: Find the derivative of $f(x) = x^2 + 3x + 1$"
          />
        </div>

        {/* Multiple Choice Options */}
        {questionType === 'MULTIPLE_CHOICE' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Answer Options</h2>
              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Option
              </button>
            </div>

            <div className="space-y-4">
              {options.map((option, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="text-gray-400 mt-3 cursor-grab">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  <button
                    type="button"
                    onClick={() => updateOption(index, 'isCorrect', !option.isCorrect)}
                    className={`mt-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      option.isCorrect
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                    title={option.isCorrect ? 'Correct answer' : 'Mark as correct'}
                  >
                    {option.label}
                  </button>

                  <div className="flex-1">
                    <textarea
                      value={option.optionLatex}
                      onChange={(e) => updateOption(index, 'optionLatex', e.target.value)}
                      placeholder={`Option ${option.label} (LaTeX supported)`}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm resize-none"
                    />
                  </div>

                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="mt-2 p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Click the letter circle to mark the correct answer. Green = correct.
            </p>
          </div>
        )}

        {/* Answer Key for non-MC questions */}
        {questionType !== 'MULTIPLE_CHOICE' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Answer Key</h2>
            <input
              type="text"
              value={answerKey}
              onChange={(e) => setAnswerKey(e.target.value)}
              placeholder={
                questionType === 'NUMERICAL'
                  ? 'e.g., 42 or 3.14159'
                  : 'Brief answer or key points'
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        )}

        {/* Solution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Solution (Worked Example)</h2>
          <LaTeXEditor
            value={solutionLatex}
            onChange={setSolutionLatex}
            placeholder="Enter the full solution with step-by-step working..."
            minRows={8}
          />
        </div>

        {/* Images - only show when editing (need questionId to upload) */}
        {isEditing && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Diagrams & Images</h2>
            </div>
            <ImageUpload
              questionId={initialData.id}
              images={images}
              onImagesChange={() => {
                // Refresh images from server
                fetch(`/api/questions/${initialData.id}/images`)
                  .then((res) => res.json())
                  .then((data) => setImages(data))
                  .catch(() => {});
              }}
            />
            <p className="mt-3 text-xs text-gray-500">
              Upload diagrams or figures to include in your question. Use the caption field to reference images in your LaTeX.
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
                Default Points
              </label>
              <input
                id="points"
                type="number"
                step="0.5"
                min="0"
                value={defaultPoints}
                onChange={(e) => setDefaultPoints(e.target.value)}
                placeholder="e.g., 10"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                Source Reference
              </label>
              <input
                id="source"
                type="text"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                placeholder="e.g., Stewart Calculus, Ch.3, Problem 42"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Personal Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes about this question (difficulty observations, common mistakes, etc.)"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isLoading || !courseId || !questionLatex.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Question'}
          </button>
          <Link
            href={isEditing ? `/dashboard/questions/${initialData.id}` : '/dashboard/questions'}
            className="px-6 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
