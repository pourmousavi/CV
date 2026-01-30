'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface Course {
  id: string;
  code: string;
  name: string;
  color: string | null;
  topics: { id: string; name: string }[];
}

interface QuestionsFiltersProps {
  courses: Course[];
  currentFilters: {
    course?: string;
    topic?: string;
    type?: string;
    difficulty?: string;
    search?: string;
  };
}

const questionTypes = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'LONG_FORM', label: 'Long Form' },
  { value: 'NUMERICAL', label: 'Numerical' },
];

const difficulties = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

export function QuestionsFilters({ courses, currentFilters }: QuestionsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(currentFilters.search || '');
  const [selectedCourse, setSelectedCourse] = useState(currentFilters.course || '');
  const [selectedTopic, setSelectedTopic] = useState(currentFilters.topic || '');
  const [selectedType, setSelectedType] = useState(currentFilters.type || '');
  const [selectedDifficulty, setSelectedDifficulty] = useState(currentFilters.difficulty || '');

  // Get topics for selected course
  const selectedCourseData = courses.find((c) => c.id === selectedCourse);
  const topics = selectedCourseData?.topics || [];

  // Clear topic when course changes
  useEffect(() => {
    if (selectedCourse !== currentFilters.course) {
      setSelectedTopic('');
    }
  }, [selectedCourse, currentFilters.course]);

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Remove page when filters change
    params.delete('page');

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/dashboard/questions?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: search || undefined });
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCourse('');
    setSelectedTopic('');
    setSelectedType('');
    setSelectedDifficulty('');
    router.push('/dashboard/questions');
  };

  const hasActiveFilters =
    currentFilters.course ||
    currentFilters.topic ||
    currentFilters.type ||
    currentFilters.difficulty ||
    currentFilters.search;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
        </form>

        {/* Course filter */}
        <select
          value={selectedCourse}
          onChange={(e) => {
            setSelectedCourse(e.target.value);
            updateFilters({ course: e.target.value || undefined, topic: undefined });
          }}
          className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        >
          <option value="">All courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code}
            </option>
          ))}
        </select>

        {/* Topic filter */}
        <select
          value={selectedTopic}
          onChange={(e) => {
            setSelectedTopic(e.target.value);
            updateFilters({ topic: e.target.value || undefined });
          }}
          disabled={!selectedCourse}
          className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm disabled:bg-gray-100"
        >
          <option value="">All topics</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            updateFilters({ type: e.target.value || undefined });
          }}
          className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        >
          <option value="">All types</option>
          {questionTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        {/* Difficulty filter */}
        <select
          value={selectedDifficulty}
          onChange={(e) => {
            setSelectedDifficulty(e.target.value);
            updateFilters({ difficulty: e.target.value || undefined });
          }}
          className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        >
          <option value="">All difficulties</option>
          {difficulties.map((diff) => (
            <option key={diff.value} value={diff.value}>
              {diff.label}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
