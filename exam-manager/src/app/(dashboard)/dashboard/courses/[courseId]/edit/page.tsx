import { requireUser } from '@/lib/session';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { CourseForm } from '@/components/courses/course-form';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function EditCoursePage({ params }: PageProps) {
  const user = await requireUser();
  const { courseId } = await params;

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      userId: user.id,
    },
  });

  if (!course) {
    notFound();
  }

  return <CourseForm initialData={course} />;
}
