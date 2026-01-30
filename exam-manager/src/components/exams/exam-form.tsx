'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { LaTeXEditor } from '@/components/ui/latex-editor';

interface Course {
  id: string;
  code: string;
  name: string;
}

interface ExamType {
  id: string;
  name: string;
}

interface ExamFormProps {
  courses: Course[];
  examTypes: ExamType[];
  initialCourseId?: string;
  initialData?: {
    id: string;
    courseId: string;
    examTypeId: string;
    title: string;
    academicYear: number | null;
    semester: string | null;
    instructionsLatex: string | null;
    examDate: Date | null;
    durationMinutes: number | null;
  };
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i + 1);
const semesters = ['Fall', 'Spring', 'Summer', 'Winter'];

export function ExamForm({
  courses,
  examTypes,
  initialCourseId,
  initialData,
}: ExamFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [courseId, setCourseId] = useState(initialData?.courseId || initialCourseId || '');
  const [examTypeId, setExamTypeId] = useState(initialData?.examTypeId || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [academicYear, setAcademicYear] = useState(
    initialData?.academicYear?.toString() || currentYear.toString()
  );
  const [semester, setSemester] = useState(initialData?.semester || '');
  const [instructionsLatex, setInstructionsLatex] = useState(
    initialData?.instructionsLatex || ''
  );
  const [examDate, setExamDate] = useState(
    initialData?.examDate
      ? new Date(initialData.examDate).toISOString().split('T')[0]
      : ''
  );
  const [durationMinutes, setDurationMinutes] = useState(
    initialData?.durationMinutes?.toString() || ''
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate title
  const generateTitle = () => {
    const course = courses.find((c) => c.id === courseId);
    const examType = examTypes.find((t) => t.id === examTypeId);
    if (course && examType) {
      const parts = [examType.name];
      if (semester) parts.push(semester);
      if (academicYear) parts.push(academicYear);
      setTitle(parts.join(' '));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const url = isEditing ? `/api/exams/${initialData.id}` : '/api/exams';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          examTypeId,
          title,
          academicYear: academicYear || null,
          semester: semester || null,
          instructionsLatex: instructionsLatex || null,
          examDate: examDate || null,
          durationMinutes: durationMinutes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save exam');
      }

      router.push(`/dashboard/exams/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save exam');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Back link */}
      <Link
        href={isEditing ? `/dashboard/exams/${initialData.id}` : '/dashboard/exams'}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {isEditing ? 'Back to exam' : 'Back to exams'}
      </Link>

      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit Exam' : 'New Exam'}
      </h1>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Exam Details</h2>

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
              <label htmlFor="examType" className="block text-sm font-medium text-gray-700 mb-1">
                Exam Type *
              </label>
              <select
                id="examType"
                value={examTypeId}
                onChange={(e) => setExamTypeId(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select type</option>
                {examTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year
              </label>
              <select
                id="year"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                id="semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select semester</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <div className="flex gap-2">
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g., Midterm Fall 2024"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={generateTitle}
                disabled={!courseId || !examTypeId}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Auto
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Exam Date
              </label>
              <input
                id="date"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                id="duration"
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="e.g., 120"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Exam Instructions (Optional)
          </h2>
          <LaTeXEditor
            value={instructionsLatex}
            onChange={setInstructionsLatex}
            placeholder="Enter exam instructions (LaTeX supported)..."
            minRows={4}
            helpText="These instructions will appear at the top of the exported exam"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isLoading || !courseId || !examTypeId || !title}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Exam'}
          </button>
          <Link
            href={isEditing ? `/dashboard/exams/${initialData.id}` : '/dashboard/exams'}
            className="px-6 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
